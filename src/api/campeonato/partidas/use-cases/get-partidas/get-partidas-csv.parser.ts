import { isValid, parse, parseISO } from 'date-fns';
import { GoogleSheetCsvParser } from '@/infra/google-sheet/parsers/google-sheet-csv-parser.interface';
import {
  normalizeCell,
  parseCsvRows,
  parseInteger,
} from '@/infra/google-sheet/parsers/google-sheet-csv-utils';
import { GetPartidaItemDto } from './get-partidas.dto';
import { PartidaStatusEnum } from './partida-status.enum';

export class GetPartidasCsvParser implements GoogleSheetCsvParser<{
  grupo: string;
  partidas: GetPartidaItemDto[];
}> {
  parse(csvText: string): {
    grupo: string;
    partidas: GetPartidaItemDto[];
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
    const partidas: GetPartidaItemDto[] = [];
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

      partidas.push({
        grupo,
        mandante,
        golsMandante,
        golsVisitante,
        visitante,
        status: this.inferStatus(
          statusText,
          dataPartida,
          golsMandante,
          golsVisitante,
        ),
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
    dataPartida: string,
    golsMandante: number | null,
    golsVisitante: number | null,
  ): PartidaStatusEnum {
    if (this.isCanceled(statusText)) {
      return PartidaStatusEnum.CANCELADA;
    }

    if (!this.hasScheduledDate(dataPartida)) {
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

  private hasScheduledDate(dataPartida: string): boolean {
    if (!dataPartida) {
      return false;
    }

    if (isValid(parseISO(dataPartida))) {
      return true;
    }

    const supportedFormats = [
      'dd/MM/yyyy',
      'd/M/yyyy',
      'dd/MM/yy',
      'd/M/yy',
      'yyyy-MM-dd',
      'dd-MM-yyyy',
      'd-M-yyyy',
    ];

    return supportedFormats.some((format) =>
      isValid(parse(dataPartida, format, new Date())),
    );
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
