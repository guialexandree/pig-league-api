import { Injectable, ServiceUnavailableException } from '@nestjs/common';

@Injectable()
export class GoogleSheetService {
  async getSpreadsheetCsv(SPREADSHEET_ID: string, GID: string): Promise<string> {
    try {
      const response = await fetch(this.buildCsvUrl(SPREADSHEET_ID, GID));
      if (!response.ok) {
        throw new Error(`Google Sheets retornou status ${response.status}`);
      }

      return await response.text();
    } catch (error) {
      const details =
        error instanceof Error ? `: ${error.message}` : ': erro desconhecido';
      throw new ServiceUnavailableException(
        `Nao foi possivel carregar a planilha${details}`,
      );
    }
  }

  private buildCsvUrl(SPREADSHEET_ID: string, GID: string): string {
    return `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${GID}`;
  }
}
