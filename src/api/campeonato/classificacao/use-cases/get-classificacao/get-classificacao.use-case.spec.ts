import type { Faker } from '@faker-js/faker';
import { ServiceUnavailableException } from '@nestjs/common';
import { GoogleSheetService } from '@/infra/google-sheet/google-sheet.service';
import { ClassificacaoCsvParser } from './get-classificacao-csv.parser';
import { GetClassificacaoDto } from './get-classificacao.dto';
import { GetClassificacaoUseCase } from './get-classificacao.use-case';

type ParsedClassificacaoPayload = {
  grupo: string;
  itens: Array<Omit<GetClassificacaoDto, 'grupo'>>;
};

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return {
    promise,
    resolve,
    reject,
  };
}

describe('GetClassificacaoUseCase', () => {
  let useCase: GetClassificacaoUseCase;
  let googleSheetService: Pick<GoogleSheetService, 'getSpreadsheetCsv'>;
  let parser: Pick<ClassificacaoCsvParser, 'parse'>;
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

    useCase = new GetClassificacaoUseCase(
      googleSheetService as GoogleSheetService,
      parser as ClassificacaoCsvParser,
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('deve consultar dois GIDs em paralelo, unificar, ordenar e reindexar', async () => {
    const firstDeferred = createDeferred<string>();
    const secondDeferred = createDeferred<string>();

    const csvA = faker.string.uuid();
    const csvB = faker.string.uuid();

    const duplicatePlayer = faker.person.fullName();
    const tiePlayerB = faker.person.fullName();
    const tiePlayerA = faker.person.fullName();
    const topPlayer = faker.person.fullName();
    const firstGroup = `GRUPO ${faker.number.int({ min: 1, max: 9 })}`;
    const secondGroup = `GRUPO ${faker.number.int({ min: 10, max: 19 })}`;

    (googleSheetService.getSpreadsheetCsv as jest.Mock)
      .mockImplementationOnce(() => firstDeferred.promise)
      .mockImplementationOnce(() => secondDeferred.promise);

    (parser.parse as jest.Mock)
      .mockReturnValueOnce({
        grupo: firstGroup,
        itens: [
          {
            posicao: 1,
            jogador: duplicatePlayer,
            jogos: 3,
            vitorias: 3,
            empates: 0,
            derrotas: 0,
            golsPositivo: 12,
            golsContra: 3,
            saldoGols: 9,
            pontos: 9,
          },
          {
            posicao: 2,
            jogador: tiePlayerA,
            jogos: 3,
            vitorias: 3,
            empates: 0,
            derrotas: 0,
            golsPositivo: 11,
            golsContra: 2,
            saldoGols: 9,
            pontos: 9,
          },
        ],
      })
      .mockReturnValueOnce({
        grupo: secondGroup,
        itens: [
          {
            posicao: 1,
            jogador: topPlayer,
            jogos: 3,
            vitorias: 3,
            empates: 0,
            derrotas: 0,
            golsPositivo: 20,
            golsContra: 2,
            saldoGols: 18,
            pontos: 12,
          },
          {
            posicao: 2,
            jogador: tiePlayerB,
            jogos: 3,
            vitorias: 3,
            empates: 0,
            derrotas: 0,
            golsPositivo: 11,
            golsContra: 2,
            saldoGols: 9,
            pontos: 9,
          },
          {
            posicao: 3,
            jogador: duplicatePlayer,
            jogos: 3,
            vitorias: 2,
            empates: 0,
            derrotas: 1,
            golsPositivo: 8,
            golsContra: 5,
            saldoGols: 3,
            pontos: 6,
          },
        ],
      });

    const pendingExecution = useCase.execute();

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

    firstDeferred.resolve(csvA);
    secondDeferred.resolve(csvB);

    const response = await pendingExecution;

    expect(parser.parse).toHaveBeenNthCalledWith(1, csvA);
    expect(parser.parse).toHaveBeenNthCalledWith(2, csvB);

    expect(response).toEqual([
      {
        grupo: secondGroup,
        posicao: 1,
        jogador: topPlayer,
        jogos: 3,
        vitorias: 3,
        empates: 0,
        derrotas: 0,
        golsPositivo: 20,
        golsContra: 2,
        saldoGols: 18,
        pontos: 12,
      },
      {
        grupo: firstGroup,
        posicao: 2,
        jogador: duplicatePlayer,
        jogos: 3,
        vitorias: 3,
        empates: 0,
        derrotas: 0,
        golsPositivo: 12,
        golsContra: 3,
        saldoGols: 9,
        pontos: 9,
      },
      {
        grupo: firstGroup,
        posicao: 3,
        jogador: tiePlayerA < tiePlayerB ? tiePlayerA : tiePlayerB,
        jogos: 3,
        vitorias: 3,
        empates: 0,
        derrotas: 0,
        golsPositivo: 11,
        golsContra: 2,
        saldoGols: 9,
        pontos: 9,
      },
      {
        grupo: secondGroup,
        posicao: 4,
        jogador: tiePlayerA < tiePlayerB ? tiePlayerB : tiePlayerA,
        jogos: 3,
        vitorias: 3,
        empates: 0,
        derrotas: 0,
        golsPositivo: 11,
        golsContra: 2,
        saldoGols: 9,
        pontos: 9,
      },
      {
        grupo: secondGroup,
        posicao: 5,
        jogador: duplicatePlayer,
        jogos: 3,
        vitorias: 2,
        empates: 0,
        derrotas: 1,
        golsPositivo: 8,
        golsContra: 5,
        saldoGols: 3,
        pontos: 6,
      },
    ]);
  });

  it('deve consultar apenas o GID do grupo 1 quando filtro grupoId for 1', async () => {
    const csvPayload = faker.string.uuid();
    const parsedPayload: ParsedClassificacaoPayload = {
      grupo: `GRUPO ${faker.number.int({ min: 1, max: 4 })}`,
      itens: [
        {
          posicao: 1,
          jogador: faker.person.fullName(),
          jogos: 3,
          vitorias: 3,
          empates: 0,
          derrotas: 0,
          golsPositivo: 9,
          golsContra: 2,
          saldoGols: 7,
          pontos: 9,
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
      '230309619',
    );

    expect(parser.parse).toHaveBeenCalledTimes(1);
    expect(parser.parse).toHaveBeenCalledWith(csvPayload);
    expect(response).toEqual(
      parsedPayload.itens.map((item) => ({
        ...item,
        grupo: parsedPayload.grupo,
      })),
    );
  });

  it('deve consultar apenas o GID do grupo 2 quando filtro grupoId for 2', async () => {
    const csvPayload = faker.string.uuid();
    const parsedPayload: ParsedClassificacaoPayload = {
      grupo: `GRUPO ${faker.number.int({ min: 5, max: 9 })}`,
      itens: [
        {
          posicao: 1,
          jogador: faker.person.fullName(),
          jogos: 3,
          vitorias: 2,
          empates: 1,
          derrotas: 0,
          golsPositivo: 8,
          golsContra: 4,
          saldoGols: 4,
          pontos: 7,
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
      '2118727000',
    );

    expect(parser.parse).toHaveBeenCalledTimes(1);
    expect(parser.parse).toHaveBeenCalledWith(csvPayload);
    expect(response).toEqual(
      parsedPayload.itens.map((item) => ({
        ...item,
        grupo: parsedPayload.grupo,
      })),
    );
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
