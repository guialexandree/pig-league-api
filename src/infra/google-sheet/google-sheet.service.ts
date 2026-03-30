import {
  Inject,
  Global,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Global()
@Injectable()
export class GoogleSheetService {
  private readonly cacheTtlInMs = 2 * 60 * 1000;

  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  async getSpreadsheetCsv(
    SPREADSHEET_ID: string,
    GID: string,
  ): Promise<string> {
    try {
      const cacheKey = this.buildCacheKey(SPREADSHEET_ID, GID);
      const cachedCsv = await this.cacheManager.get<string>(cacheKey);
      if (typeof cachedCsv === 'string') {
        return cachedCsv;
      }

      const response = await fetch(this.buildCsvUrl(SPREADSHEET_ID, GID));
      if (!response.ok) {
        throw new Error(`Google Sheets retornou status ${response.status}`);
      }

      const csv = await response.text();
      await this.cacheManager.set(cacheKey, csv, this.cacheTtlInMs);
      return csv;
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

  private buildCacheKey(SPREADSHEET_ID: string, GID: string): string {
    return `${SPREADSHEET_ID}:${GID}`;
  }
}
