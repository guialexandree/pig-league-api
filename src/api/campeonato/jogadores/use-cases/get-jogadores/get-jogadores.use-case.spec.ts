import type { Faker } from '@faker-js/faker';
import { ServiceUnavailableException } from '@nestjs/common';
import { GoogleSheetService } from '@/infra/google-sheet/google-sheet.service';
import { GetJogadoresUseCase } from './get-jogadores.use-case';
import { GetJogadoresCsvParser } from './get-jogadores-csv.parser';

describe('GetJogadoresUseCase', () => {
  let useCase: GetJogadoresUseCase;
  let googleSheetService: Pick<GoogleSheetService, 'getSpreadsheetCsv'>;
  let parser: Pick<GetJogadoresCsvParser, 'parse'>;
  let faker: Faker;

  beforeAll(async () => {
    ({ faker } = await import('@faker-js/faker'));
  });

  beforeEach(() => {
    faker.seed(20260325);

    googleSheetService = {
      getSpreadsheetCsv: jest.fn(),
    };

    parser = {
      parse: jest.fn(),
    };

    useCase = new GetJogadoresUseCase(
      googleSheetService as GoogleSheetService,
      parser as GetJogadoresCsvParser,
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('deve consultar os dois GIDs de jogadores e retornar nomes com id reindexado', async () => {
    const firstCsvPayload = faker.string.uuid();
    const secondCsvPayload = faker.string.uuid();
    const firstPlayer = faker.person.fullName();
    const secondPlayer = faker.person.fullName();
    const thirdPlayer = faker.person.fullName();

    (googleSheetService.getSpreadsheetCsv as jest.Mock)
      .mockResolvedValueOnce(firstCsvPayload)
      .mockResolvedValueOnce(secondCsvPayload);

    (parser.parse as jest.Mock)
      .mockReturnValueOnce({
        jogadores: [firstPlayer, secondPlayer],
      })
      .mockReturnValueOnce({
        jogadores: [thirdPlayer],
      });

    const response = await useCase.execute();

    expect(googleSheetService.getSpreadsheetCsv).toHaveBeenCalledTimes(2);
    expect(googleSheetService.getSpreadsheetCsv).toHaveBeenNthCalledWith(
      1,
      '1ev1M_7z-I_NpC2pBsamqx1dbIeNTSBPJIWE4ow6kUQc',
      '230309619',
    );
    expect(googleSheetService.getSpreadsheetCsv).toHaveBeenNthCalledWith(
      2,
      '1ev1M_7z-I_NpC2pBsamqx1dbIeNTSBPJIWE4ow6kUQc',
      '2118727000',
    );

    expect(parser.parse).toHaveBeenCalledTimes(2);
    expect(parser.parse).toHaveBeenNthCalledWith(1, firstCsvPayload);
    expect(parser.parse).toHaveBeenNthCalledWith(2, secondCsvPayload);

    expect(response.grupo).toBe('CAMPEONATO');
    expect(response.jogadores).toEqual([
      {
        id: 1,
        nome: firstPlayer,
      },
      {
        id: 2,
        nome: secondPlayer,
      },
      {
        id: 3,
        nome: thirdPlayer,
      },
    ]);
    expect(new Date(response.atualizadoEm).toString()).not.toBe('Invalid Date');
  });

  it('deve propagar erro como ServiceUnavailableException', async () => {
    const message = faker.lorem.words(3);
    (googleSheetService.getSpreadsheetCsv as jest.Mock).mockRejectedValue(
      new Error(message),
    );

    await expect(useCase.execute()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
