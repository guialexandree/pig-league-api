import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { GoogleSheetService } from '@/infra/google-sheet/google-sheet.service';
import { GetJogadoresDto } from './get-jogadores.dto';
import { GetJogadoresCsvParser } from './get-jogadores-csv.parser';

const SPREADSHEET_ID = '1ev1M_7z-I_NpC2pBsamqx1dbIeNTSBPJIWE4ow6kUQc';
const JOGADORES_GIDS = ['230309619', '2118727000'] as const;

@Injectable()
export class GetJogadoresUseCase {
  constructor(
    private readonly googleSheetService: GoogleSheetService,
    private readonly parser: GetJogadoresCsvParser,
  ) {}

  async execute(): Promise<GetJogadoresDto> {
    try {
      const csvPayloads = await Promise.all(
        JOGADORES_GIDS.map((gid) =>
          this.googleSheetService.getSpreadsheetCsv(SPREADSHEET_ID, gid),
        ),
      );

      const jogadores = csvPayloads
        .map((csvPayload) => this.parser.parse(csvPayload))
        .flatMap((parsedTab) => parsedTab.jogadores)
        .map((nome, index) => ({
          id: index + 1,
          nome,
        }));

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
}
