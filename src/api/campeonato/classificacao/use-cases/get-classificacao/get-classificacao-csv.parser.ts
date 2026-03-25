import { GetClassificacaoDto } from './get-classificacao.dto';
import { GoogleSheetCsvParser } from '@/infra/google-sheet/parsers/google-sheet-csv-parser.interface';
import {
  normalizeCell,
  parseCsvRows,
  parseInteger,
} from '@/infra/google-sheet/parsers/google-sheet-csv-utils';

type ParsedClassificacaoItemDto = Omit<GetClassificacaoDto, 'grupo'>;

export class ClassificacaoCsvParser implements GoogleSheetCsvParser<{
  grupo: string;
  itens: ParsedClassificacaoItemDto[];
}> {
  parse(csvText: string): {
    grupo: string;
    itens: ParsedClassificacaoItemDto[];
  } {
    const rows = parseCsvRows(csvText);

    const headerIndex = rows.findIndex((row) => {
      return (
        normalizeCell(row[0]) === '#' && normalizeCell(row[1]) === 'jogador'
      );
    });

    if (headerIndex === -1) {
      throw new Error(
        'Cabecalho da tabela de classificacao nao encontrado na planilha',
      );
    }

    const itens: ParsedClassificacaoItemDto[] = [];
    const dataRows = rows.slice(headerIndex + 1);

    for (const row of dataRows) {
      const posicaoRaw = (row[0] ?? '').trim();
      if (!posicaoRaw) {
        continue;
      }

      if (!/^\d+$/.test(posicaoRaw)) {
        if (itens.length > 0) {
          break;
        }

        continue;
      }

      const jogador = (row[1] ?? '').trim();
      if (!jogador) {
        continue;
      }

      itens.push({
        posicao: parseInteger(posicaoRaw, 'posicao'),
        jogador,
        jogos: parseInteger(row[2], 'j'),
        vitorias: parseInteger(row[3], 'v'),
        empates: parseInteger(row[4], 'e'),
        derrotas: parseInteger(row[5], 'd'),
        golsPositivo: parseInteger(row[6], 'gp'),
        golsContra: parseInteger(row[7], 'gc'),
        saldoGols: parseInteger(row[8], 'sg'),
        pontos: parseInteger(row[9], 'pts'),
      });
    }

    if (itens.length === 0) {
      throw new Error('Nenhuma linha de classificacao valida foi encontrada');
    }

    return {
      grupo: this.extractGroup(rows),
      itens,
    };
  }

  private extractGroup(rows: string[][]): string {
    for (const row of rows) {
      for (const cell of row) {
        const value = cell.trim();
        if (!value) {
          continue;
        }

        if (/grupo\s*\d+/i.test(value)) {
          return value.replace(/^🏆\s*/u, '');
        }
      }
    }

    return 'CAMPEONATO';
  }
}
