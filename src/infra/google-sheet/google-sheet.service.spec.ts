import { ServiceUnavailableException } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { GoogleSheetService } from './google-sheet.service';

describe('GoogleSheetService', () => {
  let service: GoogleSheetService;
  let originalFetch: typeof fetch;
  let cacheManager: Pick<Cache, 'get' | 'set'>;

  beforeAll(() => {
    originalFetch = global.fetch;
  });

  beforeEach(() => {
    cacheManager = {
      get: jest.fn(),
      set: jest.fn(),
    };

    const GoogleSheetServiceCtor = GoogleSheetService as unknown as new (
      cacheManager: Pick<Cache, 'get' | 'set'>,
    ) => GoogleSheetService;
    service = new GoogleSheetServiceCtor(cacheManager);
    global.fetch = jest.fn() as unknown as typeof fetch;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('deve buscar o CSV da planilha usando SPREADSHEET_ID e GID', async () => {
    (cacheManager.get as jest.Mock).mockResolvedValue(undefined);
    (cacheManager.set as jest.Mock).mockResolvedValue(undefined);

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('coluna1,coluna2'),
    });

    const csv = await service.getSpreadsheetCsv('abc123', '987');

    expect(global.fetch).toHaveBeenCalledWith(
      'https://docs.google.com/spreadsheets/d/abc123/export?format=csv&gid=987',
    );
    expect(cacheManager.get).toHaveBeenCalledWith('abc123:987');
    expect(cacheManager.set).toHaveBeenCalledWith(
      'abc123:987',
      'coluna1,coluna2',
      120000,
    );
    expect(csv).toBe('coluna1,coluna2');
  });

  it('deve usar cache por 2 minutos para a mesma planilha e gid', async () => {
    (cacheManager.get as jest.Mock)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce('csv-cache-1')
      .mockResolvedValueOnce(undefined);
    (cacheManager.set as jest.Mock).mockResolvedValue(undefined);

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('csv-cache-1'),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('csv-cache-2'),
      });

    const csvWithinTtl1 = await service.getSpreadsheetCsv('abc123', '987');
    const csvWithinTtl2 = await service.getSpreadsheetCsv('abc123', '987');
    const csvAfterTtl = await service.getSpreadsheetCsv('abc123', '987');

    expect(csvWithinTtl1).toBe('csv-cache-1');
    expect(csvWithinTtl2).toBe('csv-cache-1');
    expect(csvAfterTtl).toBe('csv-cache-2');
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(cacheManager.get).toHaveBeenCalledTimes(3);
    expect(cacheManager.set).toHaveBeenCalledTimes(2);
    expect(cacheManager.set).toHaveBeenNthCalledWith(
      1,
      'abc123:987',
      'csv-cache-1',
      120000,
    );
    expect(cacheManager.set).toHaveBeenNthCalledWith(
      2,
      'abc123:987',
      'csv-cache-2',
      120000,
    );
  });

  it('deve lancar ServiceUnavailableException em erro HTTP', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
    });

    await expect(service.getSpreadsheetCsv('abc123', '987')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('deve lancar ServiceUnavailableException em falha de rede', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('network error'));

    await expect(service.getSpreadsheetCsv('abc123', '987')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
