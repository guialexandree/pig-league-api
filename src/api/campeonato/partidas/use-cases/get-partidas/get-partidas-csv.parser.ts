import { format, isValid, parse, parseISO } from 'date-fns';
import { GoogleSheetCsvParser } from '@/infra/google-sheet/parsers/google-sheet-csv-parser.interface';
import {
  normalizeCell,
  parseCsvRows,
  parseInteger,
} from '@/infra/google-sheet/parsers/google-sheet-csv-utils';
import { GetPartidasDto } from './get-partidas.dto';
import { PartidaStatusEnum } from './partida-status.enum';

export class GetPartidasCsvParser implements GoogleSheetCsvParser<{
  grupo: string;
  partidas: GetPartidasDto[];
}> {
  parse(csvText: string): {
    grupo: string;
    partidas: GetPartidasDto[];
  } {
    const rows = parseCsvRows(csvText);

    const headerIndex = rows.findIndex((row) => {
      return (
        normalizeCell(row[0]) === 'mandante' &&
        normalizeCell(row[1]) === 'gols' &&
        normalizeCell(row[2]) === 'gols' &&
        normalizeCell(row[3]) === 'visitante'
      );
    });

    if (headerIndex === -1) {
      throw new Error(
        'Cabecalho da tabela de partidas nao encontrado na planilha',
      );
    }

    const grupo = this.extractGroup(rows);
    const partidas: GetPartidasDto[] = [];
    const dataRows = rows.slice(headerIndex + 1);

    for (const row of dataRows) {
      const mandante = (row[0] ?? '').trim();
      const visitante = (row[3] ?? '').trim();

      if (!mandante && !visitante) {
        continue;
      }

      if (!mandante || !visitante) {
        continue;
      }

      const golsMandante = this.parseGoals(row[1], 'golsMandante');
      const golsVisitante = this.parseGoals(row[2], 'golsVisitante');
      const statusText = (row[4] ?? '').trim();
      const dataPartida = (row[5] ?? '').trim();
      const dataHora = this.parseDataHora(dataPartida);

      partidas.push({
        grupo,
        dataHora,
        mandante,
        golsMandante,
        golsVisitante,
        visitante,
        status: this.inferStatus(statusText, dataHora, golsMandante, golsVisitante),
      });
    }

    if (partidas.length === 0) {
      throw new Error('Nenhuma linha de partida valida foi encontrada');
    }

    return {
      grupo,
      partidas,
    };
  }

  private parseGoals(value: string | undefined, field: string): number | null {
    const normalized = (value ?? '').trim();

    if (!normalized) {
      return null;
    }

    return parseInteger(normalized, field);
  }

  private inferStatus(
    statusText: string,
    dataHora: string | null,
    golsMandante: number | null,
    golsVisitante: number | null,
  ): PartidaStatusEnum {
    if (this.isCanceled(statusText)) {
      return PartidaStatusEnum.CANCELADA;
    }

    if (!dataHora) {
      return PartidaStatusEnum.NAO_AGENDADA;
    }

    if (golsMandante === null || golsVisitante === null) {
      return PartidaStatusEnum.AGENDADA;
    }

    return PartidaStatusEnum.REALIZADA;
  }

  private isCanceled(statusText: string): boolean {
    return /cancelad[ao]/i.test(statusText);
  }

  private parseDataHora(dataPartida: string): string | null {
    const date = this.parseDate(dataPartida);

    if (!date) {
      return null;
    }

    return format(date, "yyyy-MM-dd'T'HH:mm:ss");
  }

  private parseDate(dataPartida: string): Date | null {
    if (!dataPartida) {
      return null;
    }

    const normalized = dataPartida.trim();
    if (!normalized) {
      return null;
    }

    const parsedIso = parseISO(normalized);
    if (isValid(parsedIso)) {
      return parsedIso;
    }

    const supportedFormats = [
      'dd/MM/yyyy HH:mm:ss',
      'd/M/yyyy HH:mm:ss',
      'dd/MM/yy HH:mm:ss',
      'd/M/yy HH:mm:ss',
      'dd/MM/yyyy HH:mm',
      'd/M/yyyy HH:mm',
      'dd/MM/yy HH:mm',
      'd/M/yy HH:mm',
      'dd/MM/yyyy H:mm',
      'd/M/yyyy H:mm',
      'dd/MM/yy H:mm',
      'd/M/yy H:mm',
      'yyyy-MM-dd HH:mm:ss',
      'yyyy-MM-dd HH:mm',
      'yyyy-MM-dd',
      'dd/MM/yyyy',
      'd/M/yyyy',
      'dd/MM/yy',
      'd/M/yy',
      'dd-MM-yyyy',
      'd-M-yyyy',
    ];

    for (const dateFormat of supportedFormats) {
      const parsedDate = parse(normalized, dateFormat, new Date());
      if (isValid(parsedDate)) {
        return parsedDate;
      }
    }

    return null;
  }

  private extractGroup(rows: string[][]): string {
    for (const row of rows) {
      for (const cell of row) {
        const value = cell.trim();

        if (!value) {
          continue;
        }

        const groupMatch = value.match(/(grupo\s*\d+)/i);
        if (groupMatch?.[1]) {
          return groupMatch[1].toUpperCase();
        }
      }
    }

    return 'CAMPEONATO';
  }
}
