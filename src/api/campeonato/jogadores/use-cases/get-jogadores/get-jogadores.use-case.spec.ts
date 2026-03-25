import type { Faker } from '@faker-js/faker';
import { ServiceUnavailableException } from '@nestjs/common';
import { GoogleSheetService } from '@/infra/google-sheet/google-sheet.service';
import { GetJogadoresUseCase } from './get-jogadores.use-case';
import { GetJogadoresCsvParser } from './get-jogadores-csv.parser';
import { PartidasService } from '@/api/campeonato/partidas/partidas.service';
import { GetPartidasDto } from '@/api/campeonato/partidas/use-cases/get-partidas/get-partidas.dto';
import { PartidaStatusEnum } from '@/api/campeonato/partidas/use-cases/get-partidas/partida-status.enum';

describe('GetJogadoresUseCase', () => {
  let useCase: GetJogadoresUseCase;
  let googleSheetService: Pick<GoogleSheetService, 'getSpreadsheetCsv'>;
  let parser: Pick<GetJogadoresCsvParser, 'parse'>;
  let partidasService: Pick<PartidasService, 'getPartidas'>;
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

    partidasService = {
      getPartidas: jest.fn(),
    };

    useCase = new GetJogadoresUseCase(
      googleSheetService as GoogleSheetService,
      parser as GetJogadoresCsvParser,
      partidasService as PartidasService,
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('deve consultar os dois GIDs de jogadores e calcular metricas por jogador', async () => {
    const firstCsvPayload = faker.string.uuid();
    const secondCsvPayload = faker.string.uuid();
    const firstPlayer = faker.person.fullName();
    const secondPlayer = faker.person.fullName();
    const thirdPlayer = faker.person.fullName();
    const otherTeam = faker.company.name();
    const partidas: GetPartidasDto[] = [
      {
        grupo: 'Grupo 1',
        dataHora: faker.date.recent().toISOString(),
        mandante: firstPlayer,
        golsMandante: 3,
        golsVisitante: 1,
        visitante: secondPlayer,
        status: PartidaStatusEnum.REALIZADA,
      },
      {
        grupo: 'Grupo 2',
        dataHora: faker.date.recent().toISOString(),
        mandante: thirdPlayer,
        golsMandante: 2,
        golsVisitante: 2,
        visitante: firstPlayer,
        status: PartidaStatusEnum.REALIZADA,
      },
      {
        grupo: 'Grupo 1',
        dataHora: faker.date.recent().toISOString(),
        mandante: firstPlayer,
        golsMandante: 5,
        golsVisitante: 0,
        visitante: otherTeam,
        status: PartidaStatusEnum.CANCELADA,
      },
    ];

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
    (partidasService.getPartidas as jest.Mock).mockResolvedValue(partidas);

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
    expect(partidasService.getPartidas).toHaveBeenCalledTimes(1);

    expect(response.grupo).toBe('CAMPEONATO');
    expect(response.jogadores).toEqual([
      {
        id: 1,
        nome: firstPlayer,
        gols: 5,
        partidas: 2,
        vitorias: 1,
        percentualVitoria: 50,
      },
      {
        id: 2,
        nome: secondPlayer,
        gols: 1,
        partidas: 1,
        vitorias: 0,
        percentualVitoria: 0,
      },
      {
        id: 3,
        nome: thirdPlayer,
        gols: 2,
        partidas: 1,
        vitorias: 0,
        percentualVitoria: 0,
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
