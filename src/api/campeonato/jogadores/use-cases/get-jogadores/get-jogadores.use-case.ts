import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { GoogleSheetService } from '@/infra/google-sheet/google-sheet.service';
import { GetJogadorDto, GetJogadoresDto } from './get-jogadores.dto';
import { GetJogadoresCsvParser } from './get-jogadores-csv.parser';
import { PartidasService } from '@/api/campeonato/partidas/partidas.service';
import { GetPartidasDto } from '@/api/campeonato/partidas/use-cases/get-partidas/get-partidas.dto';
import { PartidaStatusEnum } from '@/api/campeonato/partidas/use-cases/get-partidas/partida-status.enum';
import { JogadorTierEnum } from './jogador-tier.enum';

const SPREADSHEET_ID = '1ev1M_7z-I_NpC2pBsamqx1dbIeNTSBPJIWE4ow6kUQc';
const JOGADORES_GIDS = ['230309619', '2118727000'] as const;

@Injectable()
export class GetJogadoresUseCase {
  constructor(
    private readonly googleSheetService: GoogleSheetService,
    private readonly parser: GetJogadoresCsvParser,
    private readonly partidasService: PartidasService,
  ) {}

  async execute(): Promise<GetJogadoresDto> {
    try {
      const csvPayloads = await Promise.all(
        JOGADORES_GIDS.map((gid) =>
          this.googleSheetService.getSpreadsheetCsv(SPREADSHEET_ID, gid),
        ),
      );

      const partidas = await this.partidasService.getPartidas();
      const jogadores = csvPayloads
        .map((csvPayload) => this.parser.parse(csvPayload))
        .flatMap((parsedTab) => parsedTab.jogadores)
        .map((nome, index) => this.mapJogador(index + 1, nome, partidas));

      return {
        grupo: 'CAMPEONATO',
        atualizadoEm: new Date().toISOString(),
        jogadores,
      };
    } catch (error) {
      const details =
        error instanceof Error ? `: ${error.message}` : ': erro desconhecido';

      throw new ServiceUnavailableException(
        `Nao foi possivel carregar os jogadores${details}`,
      );
    }
  }

  private mapJogador(
    id: number,
    nome: string,
    partidas: GetPartidasDto[],
  ): GetJogadorDto {
    const partidasRealizadas = partidas.filter(
      (partida) =>
        partida.status === PartidaStatusEnum.REALIZADA &&
        (partida.mandante === nome || partida.visitante === nome) &&
        partida.golsMandante !== null &&
        partida.golsVisitante !== null,
    );

    const gols = partidasRealizadas.reduce((total, partida) => {
      if (partida.mandante === nome) {
        return total + (partida.golsMandante ?? 0);
      }

      if (partida.visitante === nome) {
        return total + (partida.golsVisitante ?? 0);
      }

      return total;
    }, 0);

    const vitorias = partidasRealizadas.reduce((total, partida) => {
      if (
        partida.mandante === nome &&
        (partida.golsMandante ?? 0) > (partida.golsVisitante ?? 0)
      ) {
        return total + 1;
      }

      if (
        partida.visitante === nome &&
        (partida.golsVisitante ?? 0) > (partida.golsMandante ?? 0)
      ) {
        return total + 1;
      }

      return total;
    }, 0);

    const xp = partidasRealizadas.reduce((total, partida) => {
      const golsFeitos =
        partida.mandante === nome
          ? (partida.golsMandante ?? 0)
          : (partida.golsVisitante ?? 0);
      const golsSofridos =
        partida.mandante === nome
          ? (partida.golsVisitante ?? 0)
          : (partida.golsMandante ?? 0);
      const resultado = this.resolverResultado(golsFeitos, golsSofridos);

      return total + this.calcularXpPartida(resultado, golsFeitos, golsSofridos);
    }, 0);

    const totalPartidas = partidasRealizadas.length;
    const percentualVitoria =
      totalPartidas === 0 ? 0 : Number(((vitorias / totalPartidas) * 100).toFixed(2));
    const tier = this.resolverTier(xp);
    const progressoTier = this.calcularProgressoTier(xp, tier);

    return {
      id,
      nome,
      gols,
      partidas: totalPartidas,
      vitorias,
      percentualVitoria,
      xp,
      tier,
      ...progressoTier,
    };
  }

  private resolverResultado(
    golsFeitos: number,
    golsSofridos: number,
  ): 'VITORIA' | 'EMPATE' | 'DERROTA' {
    if (golsFeitos > golsSofridos) {
      return 'VITORIA';
    }

    if (golsFeitos < golsSofridos) {
      return 'DERROTA';
    }

    return 'EMPATE';
  }

  private calcularXpPartida(
    resultado: 'VITORIA' | 'EMPATE' | 'DERROTA',
    golsFeitos: number,
    golsSofridos: number,
  ): number {
    const xpResultado =
      resultado === 'VITORIA' ? 30 : resultado === 'EMPATE' ? 10 : 5;
    const saldo = golsFeitos - golsSofridos;
    const bonusSaldo = resultado === 'VITORIA' && saldo >= 3 ? 10 : 0;
    const xpPartida = xpResultado + golsFeitos * 2 - golsSofridos + bonusSaldo;

    return Math.max(5, xpPartida);
  }

  private resolverTier(xp: number): JogadorTierEnum {
    if (xp >= 2000) {
      return JogadorTierEnum.Hero;
    }

    if (xp >= 1000) {
      return JogadorTierEnum.Gold;
    }

    return JogadorTierEnum.Silver;
  }

  private calcularProgressoTier(
    xp: number,
    tier: JogadorTierEnum,
  ): {
    xpAtualNoTier: number;
    xpNecessarioProximoTier: number;
    progressoProximoTierPercentual: number;
  } {
    if (tier === JogadorTierEnum.Hero) {
      return {
        xpAtualNoTier: Math.max(0, xp - 2000),
        xpNecessarioProximoTier: 0,
        progressoProximoTierPercentual: 100,
      };
    }

    const xpMinimoTier = tier === JogadorTierEnum.Silver ? 0 : 1000;
    const xpMaximoExclusivoTier = tier === JogadorTierEnum.Silver ? 1000 : 2000;
    const xpAtualNoTier = Math.max(0, xp - xpMinimoTier);
    const xpNecessarioProximoTier = xpMaximoExclusivoTier - xpMinimoTier;
    const progressoProximoTierPercentual = Number(
      ((xpAtualNoTier / xpNecessarioProximoTier) * 100).toFixed(2),
    );

    return {
      xpAtualNoTier,
      xpNecessarioProximoTier,
      progressoProximoTierPercentual,
    };
  }
}
