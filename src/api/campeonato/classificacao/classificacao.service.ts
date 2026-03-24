import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import {
  ClassificacaoItemDto,
  ClassificacaoResponseDto,
} from './dto/classificacao-response.dto';

const SPREADSHEET_ID = '1ev1M_7z-I_NpC2pBsamqx1dbIeNTSBPJIWE4ow6kUQc';
const GID = '230309619';

@Injectable()
export class ClassificacaoService {
  async getClassificacao(): Promise<ClassificacaoResponseDto> {
    try {
      const response = await fetch(this.buildCsvUrl());
      if (!response.ok) {
        throw new Error(`Google Sheets retornou status ${response.status}`);
      }

      const csvText = await response.text();
      return this.parseCsvToClassificacao(csvText);
    } catch (error) {
      const details =
        error instanceof Error ? `: ${error.message}` : ': erro desconhecido';
      throw new ServiceUnavailableException(
        `Nao foi possivel carregar a classificacao${details}`,
      );
    }
  }

  private buildCsvUrl(): string {
    return `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${GID}`;
  }

  private parseCsvToClassificacao(csvText: string): ClassificacaoResponseDto {
    const rows = csvText
      .split(/\r?\n/)
      .map((line) => this.parseCsvLine(line))
      .filter((row) => row.some((cell) => cell.trim() !== ''));

    const headerIndex = rows.findIndex((row) => {
      return (
        this.normalizeCell(row[0]) === '#' &&
        this.normalizeCell(row[1]) === 'jogador'
      );
    });

    if (headerIndex === -1) {
      throw new Error(
        'Cabecalho da tabela de classificacao nao encontrado na planilha',
      );
    }

    const grupo = this.extractGroup(rows);
    const classificacao: ClassificacaoItemDto[] = [];
    const dataRows = rows.slice(headerIndex + 1);

    for (const row of dataRows) {
      const posicaoRaw = (row[0] ?? '').trim();
      if (!posicaoRaw) {
        continue;
      }

      if (!/^\d+$/.test(posicaoRaw)) {
        if (classificacao.length > 0) {
          break;
        }
        continue;
      }

      const jogador = (row[1] ?? '').trim();
      if (!jogador) {
        continue;
      }

      classificacao.push({
        posicao: this.parseInteger(posicaoRaw, 'posicao'),
        jogador,
        j: this.parseInteger(row[2], 'j'),
        v: this.parseInteger(row[3], 'v'),
        e: this.parseInteger(row[4], 'e'),
        d: this.parseInteger(row[5], 'd'),
        gp: this.parseInteger(row[6], 'gp'),
        gc: this.parseInteger(row[7], 'gc'),
        sg: this.parseInteger(row[8], 'sg'),
        pts: this.parseInteger(row[9], 'pts'),
      });
    }

    if (classificacao.length === 0) {
      throw new Error('Nenhuma linha de classificacao valida foi encontrada');
    }

    return {
      grupo,
      atualizadoEm: new Date().toISOString(),
      classificacao,
    };
  }

  private parseCsvLine(line: string): string[] {
    const cells: string[] = [];
    let currentCell = '';
    let insideQuotes = false;

    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      const next = line[i + 1];

      if (char === '"' && next === '"' && insideQuotes) {
        currentCell += '"';
        i += 1;
        continue;
      }

      if (char === '"') {
        insideQuotes = !insideQuotes;
        continue;
      }

      if (char === ',' && !insideQuotes) {
        cells.push(currentCell);
        currentCell = '';
        continue;
      }

      currentCell += char;
    }

    cells.push(currentCell);
    return cells;
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

  private normalizeCell(value?: string): string {
    return (value ?? '').trim().toLowerCase();
  }

  private parseInteger(value: string | undefined, field: string): number {
    const normalized = (value ?? '').trim();
    if (normalized === '') {
      return 0;
    }

    if (!/^-?\d+$/.test(normalized)) {
      throw new Error(`Valor invalido para ${field}: ${value}`);
    }

    return Number.parseInt(normalized, 10);
  }
}
