import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PartidasService } from '@/api/campeonato/partidas/partidas.service';
import { PartidaStatusEnum } from '@/api/campeonato/partidas/use-cases/get-partidas/partida-status.enum';
import { GetClassificacaoDto } from '@/api/campeonato/classificacao/use-cases/get-classificacao/get-classificacao.dto';
import { LoadClassificacaoFilters } from '@/api/campeonato/classificacao/use-cases/get-classificacao/get-classificacao-filtros.dto';
import { GetPartidasDto } from '@/api/campeonato/partidas/use-cases/get-partidas/get-partidas.dto';

type ClassificacaoItemBase = Omit<GetClassificacaoDto, 'posicao'>;
type RankingValues = Pick<
  ClassificacaoItemBase,
  'pontos' | 'vitorias' | 'saldoGols'
>;

@Injectable()
export class GetClassificacaoGeralUseCase {
  constructor(private readonly partidasService: PartidasService) {}

  async execute(
    filtros: LoadClassificacaoFilters = {},
  ): Promise<GetClassificacaoDto[]> {
    try {
      const partidas = await this.partidasService.getPartidas(
        filtros.grupoId ? { grupoId: filtros.grupoId } : undefined,
      );

      const partidasRealizadas = partidas.filter(
        (partida) =>
          partida.status === PartidaStatusEnum.REALIZADA &&
          partida.golsMandante !== null &&
          partida.golsVisitante !== null,
      );

      const classificacaoPorGrupo = this.buildClassificacaoPorGrupo(
        partidasRealizadas,
      );

      return this.toResponse(classificacaoPorGrupo);
    } catch (error) {
      const details =
        error instanceof Error ? `: ${error.message}` : ': erro desconhecido';

      throw new ServiceUnavailableException(
        `Nao foi possivel carregar a classificacao geral${details}`,
      );
    }
  }

  private buildClassificacaoPorGrupo(
    partidasRealizadas: GetPartidasDto[],
  ): Map<string, ClassificacaoItemBase[]> {
    const classificacaoByGrupo = new Map<string, Map<string, ClassificacaoItemBase>>();
    const partidasByGrupo = new Map<string, GetPartidasDto[]>();

    for (const partida of partidasRealizadas) {
      const golsMandante = partida.golsMandante ?? 0;
      const golsVisitante = partida.golsVisitante ?? 0;
      const grupo = partida.grupo;

      const grupoClassificacao =
        classificacaoByGrupo.get(grupo) ?? new Map<string, ClassificacaoItemBase>();

      if (!classificacaoByGrupo.has(grupo)) {
        classificacaoByGrupo.set(grupo, grupoClassificacao);
      }

      const partidasGrupo = partidasByGrupo.get(grupo) ?? [];
      partidasGrupo.push(partida);
      partidasByGrupo.set(grupo, partidasGrupo);

      const mandante = this.getOrCreateJogador(
        grupoClassificacao,
        grupo,
        partida.mandante,
      );
      const visitante = this.getOrCreateJogador(
        grupoClassificacao,
        grupo,
        partida.visitante,
      );

      mandante.jogos += 1;
      visitante.jogos += 1;

      mandante.golsPositivo += golsMandante;
      mandante.golsContra += golsVisitante;
      visitante.golsPositivo += golsVisitante;
      visitante.golsContra += golsMandante;

      mandante.saldoGols = mandante.golsPositivo - mandante.golsContra;
      visitante.saldoGols = visitante.golsPositivo - visitante.golsContra;

      if (golsMandante > golsVisitante) {
        mandante.vitorias += 1;
        mandante.pontos += 3;
        visitante.derrotas += 1;
        continue;
      }

      if (golsVisitante > golsMandante) {
        visitante.vitorias += 1;
        visitante.pontos += 3;
        mandante.derrotas += 1;
        continue;
      }

      mandante.empates += 1;
      visitante.empates += 1;
      mandante.pontos += 1;
      visitante.pontos += 1;
    }

    const response = new Map<string, ClassificacaoItemBase[]>();
    for (const [grupo, classificacao] of classificacaoByGrupo.entries()) {
      const partidasGrupo = partidasByGrupo.get(grupo) ?? [];
      const classificacaoOrdenada = this.sortClassificacaoByGrupo(
        Array.from(classificacao.values()),
        partidasGrupo,
      );

      response.set(grupo, classificacaoOrdenada.slice(0, 4));
    }

    return response;
  }

  private sortClassificacaoByGrupo(
    classificacao: ClassificacaoItemBase[],
    partidasGrupo: GetPartidasDto[],
  ): ClassificacaoItemBase[] {
    const sorted = [...classificacao].sort((itemA, itemB) =>
      this.comparePrimaryCriteria(itemA, itemB),
    );

    let start = 0;
    while (start < sorted.length) {
      let end = start + 1;
      while (
        end < sorted.length &&
        this.hasSamePrimaryCriteria(sorted[start], sorted[end])
      ) {
        end += 1;
      }

      if (end - start > 1) {
        const tieGroup = sorted.slice(start, end);
        const resolved = this.sortByConfrontoDireto(tieGroup, partidasGrupo);
        sorted.splice(start, tieGroup.length, ...resolved);
      }

      start = end;
    }

    return sorted;
  }

  private sortByConfrontoDireto(
    tieGroup: ClassificacaoItemBase[],
    partidasGrupo: GetPartidasDto[],
  ): ClassificacaoItemBase[] {
    if (tieGroup.length <= 1) {
      return tieGroup;
    }

    if (tieGroup.length === 2) {
      return [...tieGroup].sort((itemA, itemB) =>
        this.compareConfrontoDireto(itemA.jogador, itemB.jogador, partidasGrupo),
      );
    }

    const jogadoresEmpatados = new Set(tieGroup.map((item) => item.jogador));
    const miniLiga = new Map<string, { pontos: number; saldoGols: number }>();

    for (const jogador of jogadoresEmpatados) {
      miniLiga.set(jogador, { pontos: 0, saldoGols: 0 });
    }

    for (const partida of partidasGrupo) {
      if (
        !jogadoresEmpatados.has(partida.mandante) ||
        !jogadoresEmpatados.has(partida.visitante)
      ) {
        continue;
      }

      const golsMandante = partida.golsMandante ?? 0;
      const golsVisitante = partida.golsVisitante ?? 0;
      const mandanteStats = miniLiga.get(partida.mandante);
      const visitanteStats = miniLiga.get(partida.visitante);

      if (!mandanteStats || !visitanteStats) {
        continue;
      }

      mandanteStats.saldoGols += golsMandante - golsVisitante;
      visitanteStats.saldoGols += golsVisitante - golsMandante;

      if (golsMandante > golsVisitante) {
        mandanteStats.pontos += 3;
        continue;
      }

      if (golsVisitante > golsMandante) {
        visitanteStats.pontos += 3;
        continue;
      }

      mandanteStats.pontos += 1;
      visitanteStats.pontos += 1;
    }

    return [...tieGroup].sort((itemA, itemB) => {
      const statsA = miniLiga.get(itemA.jogador) ?? { pontos: 0, saldoGols: 0 };
      const statsB = miniLiga.get(itemB.jogador) ?? { pontos: 0, saldoGols: 0 };

      if (statsB.pontos !== statsA.pontos) {
        return statsB.pontos - statsA.pontos;
      }

      if (statsB.saldoGols !== statsA.saldoGols) {
        return statsB.saldoGols - statsA.saldoGols;
      }

      return itemA.jogador.localeCompare(itemB.jogador, 'pt-BR', {
        sensitivity: 'base',
      });
    });
  }

  private compareConfrontoDireto(
    jogadorA: string,
    jogadorB: string,
    partidasGrupo: GetPartidasDto[],
  ): number {
    const statsA = { pontos: 0, saldoGols: 0 };
    const statsB = { pontos: 0, saldoGols: 0 };

    for (const partida of partidasGrupo) {
      const isConfrontoDireto =
        (partida.mandante === jogadorA && partida.visitante === jogadorB) ||
        (partida.mandante === jogadorB && partida.visitante === jogadorA);

      if (!isConfrontoDireto) {
        continue;
      }

      const golsMandante = partida.golsMandante ?? 0;
      const golsVisitante = partida.golsVisitante ?? 0;
      const golsA = partida.mandante === jogadorA ? golsMandante : golsVisitante;
      const golsB = partida.mandante === jogadorA ? golsVisitante : golsMandante;

      statsA.saldoGols += golsA - golsB;
      statsB.saldoGols += golsB - golsA;

      if (golsA > golsB) {
        statsA.pontos += 3;
      } else if (golsB > golsA) {
        statsB.pontos += 3;
      } else {
        statsA.pontos += 1;
        statsB.pontos += 1;
      }
    }

    if (statsB.pontos !== statsA.pontos) {
      return statsB.pontos - statsA.pontos;
    }

    if (statsB.saldoGols !== statsA.saldoGols) {
      return statsB.saldoGols - statsA.saldoGols;
    }

    return jogadorA.localeCompare(jogadorB, 'pt-BR', {
      sensitivity: 'base',
    });
  }

  private comparePrimaryCriteria(
    itemA: RankingValues & { jogador: string },
    itemB: RankingValues & { jogador: string },
  ): number {
    if (itemB.pontos !== itemA.pontos) {
      return itemB.pontos - itemA.pontos;
    }

    if (itemB.vitorias !== itemA.vitorias) {
      return itemB.vitorias - itemA.vitorias;
    }

    if (itemB.saldoGols !== itemA.saldoGols) {
      return itemB.saldoGols - itemA.saldoGols;
    }

    return itemA.jogador.localeCompare(itemB.jogador, 'pt-BR', {
      sensitivity: 'base',
    });
  }

  private hasSamePrimaryCriteria(
    itemA: RankingValues,
    itemB: RankingValues,
  ): boolean {
    return (
      itemA.pontos === itemB.pontos &&
      itemA.vitorias === itemB.vitorias &&
      itemA.saldoGols === itemB.saldoGols
    );
  }

  private toResponse(
    classificacaoPorGrupo: Map<string, ClassificacaoItemBase[]>,
  ): GetClassificacaoDto[] {
    return Array.from(classificacaoPorGrupo.entries())
      .sort(([grupoA], [grupoB]) =>
        grupoA.localeCompare(grupoB, 'pt-BR', {
          sensitivity: 'base',
          numeric: true,
        }),
      )
      .flatMap(([, classificacao]) =>
        classificacao.map((item, index) => ({
          ...item,
          posicao: index + 1,
        })),
      );
  }

  private getOrCreateJogador(
    classificacaoByJogador: Map<string, ClassificacaoItemBase>,
    grupo: string,
    jogador: string,
  ): ClassificacaoItemBase {
    const existing = classificacaoByJogador.get(jogador);
    if (existing) {
      return existing;
    }

    const created: ClassificacaoItemBase = {
      grupo,
      jogador,
      jogos: 0,
      vitorias: 0,
      empates: 0,
      derrotas: 0,
      golsPositivo: 0,
      golsContra: 0,
      saldoGols: 0,
      pontos: 0,
    };

    classificacaoByJogador.set(jogador, created);
    return created;
  }
}
