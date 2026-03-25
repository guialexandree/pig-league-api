import type { Faker } from '@faker-js/faker';
import { ServiceUnavailableException } from '@nestjs/common';
import { GoogleSheetService } from '@/infra/google-sheet/google-sheet.service';
import { PartidaStatusEnum } from './partida-status.enum';
import { GetPartidasCsvParser } from './get-partidas-csv.parser';
import { GetPartidasUseCase } from './get-partidas.use-case';

describe('GetPartidasUseCase', () => {
  let useCase: GetPartidasUseCase;
  let googleSheetService: Pick<GoogleSheetService, 'getSpreadsheetCsv'>;
  let parser: Pick<GetPartidasCsvParser, 'parse'>;
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

    useCase = new GetPartidasUseCase(
      googleSheetService as GoogleSheetService,
      parser as GetPartidasCsvParser,
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('deve consultar os dois GIDs de partidas e devolver lista unificada', async () => {
    const firstCsvPayload = faker.string.uuid();
    const secondCsvPayload = faker.string.uuid();

    const firstHome = faker.person.fullName();
    const firstAway = faker.person.fullName();
    const secondHome = faker.person.fullName();
    const secondAway = faker.person.fullName();
    const firstGroup = `GRUPO ${faker.number.int({ min: 1, max: 4 })}`;
    const secondGroup = `GRUPO ${faker.number.int({ min: 5, max: 9 })}`;

    const firstParsedPayload = {
      grupo: firstGroup,
      partidas: [
        {
          grupo: firstGroup,
          dataHora: faker.date.soon().toISOString(),
          mandante: firstHome,
          golsMandante: faker.number.int({ min: 0, max: 15 }),
          golsVisitante: faker.number.int({ min: 0, max: 15 }),
          visitante: firstAway,
          status: PartidaStatusEnum.REALIZADA,
        },
      ],
    };

    const secondParsedPayload = {
      grupo: secondGroup,
      partidas: [
        {
          grupo: secondGroup,
          dataHora: faker.date.soon().toISOString(),
          mandante: secondHome,
          golsMandante: faker.number.int({ min: 0, max: 15 }),
          golsVisitante: faker.number.int({ min: 0, max: 15 }),
          visitante: secondAway,
          status: PartidaStatusEnum.REALIZADA,
        },
      ],
    };

    (googleSheetService.getSpreadsheetCsv as jest.Mock)
      .mockResolvedValueOnce(firstCsvPayload)
      .mockResolvedValueOnce(secondCsvPayload);
    (parser.parse as jest.Mock)
      .mockReturnValueOnce(firstParsedPayload)
      .mockReturnValueOnce(secondParsedPayload);

    const response = await useCase.execute({});

    expect(googleSheetService.getSpreadsheetCsv).toHaveBeenCalledTimes(2);
    expect(googleSheetService.getSpreadsheetCsv).toHaveBeenNthCalledWith(
      1,
      '1ev1M_7z-I_NpC2pBsamqx1dbIeNTSBPJIWE4ow6kUQc',
      '944756563',
    );
    expect(googleSheetService.getSpreadsheetCsv).toHaveBeenNthCalledWith(
      2,
      '1ev1M_7z-I_NpC2pBsamqx1dbIeNTSBPJIWE4ow6kUQc',
      '275699173',
    );

    expect(parser.parse).toHaveBeenCalledTimes(2);
    expect(parser.parse).toHaveBeenNthCalledWith(1, firstCsvPayload);
    expect(parser.parse).toHaveBeenNthCalledWith(2, secondCsvPayload);

    expect(response).toEqual([
      ...firstParsedPayload.partidas,
      ...secondParsedPayload.partidas,
    ]);
  });

  it('deve consultar apenas o GID do grupo 1 quando o filtro for grupo 1', async () => {
    const csvPayload = faker.string.uuid();
    const home = faker.person.fullName();
    const away = faker.person.fullName();
    const group = `GRUPO ${faker.number.int({ min: 1, max: 4 })}`;

    const parsedPayload = {
      grupo: group,
      partidas: [
        {
          grupo: group,
          dataHora: faker.date.soon().toISOString(),
          mandante: home,
          golsMandante: faker.number.int({ min: 0, max: 15 }),
          golsVisitante: faker.number.int({ min: 0, max: 15 }),
          visitante: away,
          status: PartidaStatusEnum.REALIZADA,
        },
      ],
    };

    (googleSheetService.getSpreadsheetCsv as jest.Mock).mockResolvedValueOnce(
      csvPayload,
    );
    (parser.parse as jest.Mock).mockReturnValueOnce(parsedPayload);

    const response = await useCase.execute({ grupoId: 1 });

    expect(googleSheetService.getSpreadsheetCsv).toHaveBeenCalledTimes(1);
    expect(googleSheetService.getSpreadsheetCsv).toHaveBeenCalledWith(
      '1ev1M_7z-I_NpC2pBsamqx1dbIeNTSBPJIWE4ow6kUQc',
      '944756563',
    );

    expect(parser.parse).toHaveBeenCalledTimes(1);
    expect(parser.parse).toHaveBeenCalledWith(csvPayload);
    expect(response).toEqual(parsedPayload.partidas);
  });

  it('deve consultar apenas o GID do grupo 2 quando o filtro for grupo 2', async () => {
    const csvPayload = faker.string.uuid();
    const home = faker.person.fullName();
    const away = faker.person.fullName();
    const group = `GRUPO ${faker.number.int({ min: 5, max: 9 })}`;

    const parsedPayload = {
      grupo: group,
      partidas: [
        {
          grupo: group,
          dataHora: faker.date.soon().toISOString(),
          mandante: home,
          golsMandante: faker.number.int({ min: 0, max: 15 }),
          golsVisitante: faker.number.int({ min: 0, max: 15 }),
          visitante: away,
          status: PartidaStatusEnum.REALIZADA,
        },
      ],
    };

    (googleSheetService.getSpreadsheetCsv as jest.Mock).mockResolvedValueOnce(
      csvPayload,
    );
    (parser.parse as jest.Mock).mockReturnValueOnce(parsedPayload);

    const response = await useCase.execute({ grupoId: 2 });

    expect(googleSheetService.getSpreadsheetCsv).toHaveBeenCalledTimes(1);
    expect(googleSheetService.getSpreadsheetCsv).toHaveBeenCalledWith(
      '1ev1M_7z-I_NpC2pBsamqx1dbIeNTSBPJIWE4ow6kUQc',
      '275699173',
    );

    expect(parser.parse).toHaveBeenCalledTimes(1);
    expect(parser.parse).toHaveBeenCalledWith(csvPayload);
    expect(response).toEqual(parsedPayload.partidas);
  });

  it('deve propagar erro como ServiceUnavailableException', async () => {
    const message = faker.lorem.words(3);

    (googleSheetService.getSpreadsheetCsv as jest.Mock).mockRejectedValue(
      new Error(message),
    );

    await expect(useCase.execute({})).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
