import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { GoogleSheetService } from '@/infra/google-sheet/google-sheet.service';
import { GetJogadoresDto } from './get-jogadores.dto';
import { GetJogadoresCsvParser } from './get-jogadores-csv.parser';
import { PartidasService } from '@/api/campeonato/partidas/partidas.service';
import { GetPartidasDto } from '@/api/campeonato/partidas/use-cases/get-partidas/get-partidas.dto';
import { PartidaStatusEnum } from '@/api/campeonato/partidas/use-cases/get-partidas/partida-status.enum';

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
  ): {
    id: number;
    nome: string;
    gols: number;
    partidas: number;
    vitorias: number;
    percentualVitoria: number;
  } {
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

    const totalPartidas = partidasRealizadas.length;
    const percentualVitoria =
      totalPartidas === 0 ? 0 : Number(((vitorias / totalPartidas) * 100).toFixed(2));

    return {
      id,
      nome,
      gols,
      partidas: totalPartidas,
      vitorias,
      percentualVitoria,
    };
  }
}
