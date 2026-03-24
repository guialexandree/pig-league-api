import { ServiceUnavailableException } from '@nestjs/common';
import { GoogleSheetService } from './google-sheet.service';

describe('GoogleSheetService', () => {
  let service: GoogleSheetService;
  let originalFetch: typeof fetch;

  beforeAll(() => {
    originalFetch = global.fetch;
  });

  beforeEach(() => {
    service = new GoogleSheetService();
    global.fetch = jest.fn() as unknown as typeof fetch;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('deve buscar o CSV da planilha usando SPREADSHEET_ID e GID', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('coluna1,coluna2'),
    });

    const csv = await service.getSpreadsheetCsv('abc123', '987');

    expect(global.fetch).toHaveBeenCalledWith(
      'https://docs.google.com/spreadsheets/d/abc123/export?format=csv&gid=987',
    );
    expect(csv).toBe('coluna1,coluna2');
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
