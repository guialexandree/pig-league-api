import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { GetClassificacaoDto } from './get-classificacao.dto';
import { GoogleSheetService } from '@/infra/google-sheet/google-sheet.service';
import { ClassificacaoCsvParser } from './get-classificacao-csv.parser';
import { LoadClassificacaoFilters } from './get-classificacao-filtros.dto';

const SPREADSHEET_ID = '1ev1M_7z-I_NpC2pBsamqx1dbIeNTSBPJIWE4ow6kUQc';
const CLASSIFICACAO_GID_BY_GRUPO = {
  1: '230309619',
  2: '2118727000',
} as const;

export type ClassificacaoGrupoFilter = keyof typeof CLASSIFICACAO_GID_BY_GRUPO;

@Injectable()
export class GetClassificacaoUseCase {
  constructor(
    private readonly googleSheetService: GoogleSheetService,
    private readonly classificacaoCsvParser: ClassificacaoCsvParser,
  ) {}

  async execute(
    filters: LoadClassificacaoFilters = {},
  ): Promise<GetClassificacaoDto> {
    try {
      const gid = filters.grupoId
        ? CLASSIFICACAO_GID_BY_GRUPO[
            filters.grupoId as ClassificacaoGrupoFilter
          ]
        : undefined;
      const gids = gid ? [gid] : Object.values(CLASSIFICACAO_GID_BY_GRUPO);

      const csvPayloads = await Promise.all(
        gids.map((gid) =>
          this.googleSheetService.getSpreadsheetCsv(SPREADSHEET_ID, gid),
        ),
      );

      const classificacao = csvPayloads
        .map((csvPayload) => this.classificacaoCsvParser.parse(csvPayload))
        .flatMap((parsedTab) => parsedTab.itens)
        .sort((itemA, itemB) => {
          if (itemB.pontos !== itemA.pontos) {
            return itemB.pontos - itemA.pontos;
          }

          if (itemB.saldoGols !== itemA.saldoGols) {
            return itemB.saldoGols - itemA.saldoGols;
          }

          if (itemB.golsPositivo !== itemA.golsPositivo) {
            return itemB.golsPositivo - itemA.golsPositivo;
          }

          return itemA.jogador.localeCompare(itemB.jogador, 'pt-BR', {
            sensitivity: 'base',
          });
        })
        .map((item, index) => ({
          ...item,
          posicao: index + 1,
        }));

      return {
        grupo: 'CAMPEONATO',
        atualizadoEm: new Date().toISOString(),
        classificacao,
      };
    } catch (error) {
      const details =
        error instanceof Error ? `: ${error.message}` : ': erro desconhecido';
      throw new ServiceUnavailableException(
        `Nao foi possivel carregar a classificacao${details}`,
      );
    }
  }
}
