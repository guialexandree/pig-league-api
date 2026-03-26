import { GoogleSheetCsvParser } from '@/infra/google-sheet/parsers/google-sheet-csv-parser.interface';
import {
  normalizeCell,
  parseCsvRows,
} from '@/infra/google-sheet/parsers/google-sheet-csv-utils';

export class GetJogadoresCsvParser implements GoogleSheetCsvParser<{
  jogadores: string[];
}> {
  parse(csvText: string): { jogadores: string[] } {
    const rows = parseCsvRows(csvText);

    const headerIndex = rows.findIndex((row) => {
      return (
        normalizeCell(row[0]) === '#' && normalizeCell(row[2]) === 'jogador'
      );
    });

    if (headerIndex === -1) {
      throw new Error(
        'Cabecalho da tabela de jogadores nao encontrado na planilha',
      );
    }

    const jogadores: string[] = [];
    const dataRows = rows.slice(headerIndex + 1);

    for (const row of dataRows) {
      const posicaoRaw = (row[0] ?? '').trim();
      if (!posicaoRaw) {
        continue;
      }

      if (!/^\d+$/.test(posicaoRaw)) {
        if (jogadores.length > 0) {
          break;
        }

        continue;
      }

      const nome = (row[2] ?? '').trim();
      if (!nome) {
        continue;
      }

      jogadores.push(nome);
    }

    if (jogadores.length === 0) {
      throw new Error('Nenhuma linha de jogador valida foi encontrada');
    }

    return { jogadores };
  }
}
