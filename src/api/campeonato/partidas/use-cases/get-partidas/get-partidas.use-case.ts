import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { GoogleSheetService } from '@/infra/google-sheet/google-sheet.service';
import { GetPartidasCsvParser } from './get-partidas-csv.parser';
import { GetPartidasDto } from './get-partidas.dto';
import { GetPartidasFiltrosDto } from '@/api/campeonato/partidas/use-cases/get-partidas/get-partidas-filtros.dto';

const SPREADSHEET_ID = '1ev1M_7z-I_NpC2pBsamqx1dbIeNTSBPJIWE4ow6kUQc';
const PARTIDAS_GID_BY_GRUPO = {
  1: '944756563',
  2: '275699173',
} as const;

export type PartidasGrupoFilter = keyof typeof PARTIDAS_GID_BY_GRUPO;

@Injectable()
export class GetPartidasUseCase {
  constructor(
    private readonly googleSheetService: GoogleSheetService,
    private readonly parser: GetPartidasCsvParser,
  ) {}

  async execute(filters: GetPartidasFiltrosDto = {}): Promise<GetPartidasDto[]> {
    try {
      const gids = filters.grupoId
        ? [PARTIDAS_GID_BY_GRUPO[filters.grupoId]]
        : Object.values(PARTIDAS_GID_BY_GRUPO);

      const csvPayloads = await Promise.all(
        gids.map((gid) =>
          this.googleSheetService.getSpreadsheetCsv(SPREADSHEET_ID, gid),
        ),
      );

      const partidas = csvPayloads
        .map((csvPayload) => this.parser.parse(csvPayload))
        .flatMap((parsedTab) => parsedTab.partidas);

      return partidas;
    } catch (error) {
      const details =
        error instanceof Error ? `: ${error.message}` : ': erro desconhecido';

      throw new ServiceUnavailableException(
        `Nao foi possivel carregar as partidas${details}`,
      );
    }
  }
}
