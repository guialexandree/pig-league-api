import type { Faker } from '@faker-js/faker';
import { ServiceUnavailableException } from '@nestjs/common';
import { GoogleSheetService } from '@/infra/google-sheet/google-sheet.service';
import { GetJogadoresUseCase } from './get-jogadores.use-case';
import { GetJogadoresCsvParser } from './get-jogadores-csv.parser';
import { PartidasService } from '@/api/campeonato/partidas/partidas.service';
import { GetPartidasDto } from '@/api/campeonato/partidas/use-cases/get-partidas/get-partidas.dto';
import { PartidaStatusEnum } from '@/api/campeonato/partidas/use-cases/get-partidas/partida-status.enum';
import { JogadorTierEnum } from './jogador-tier.enum';

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
        xp: 35,
        tier: JogadorTierEnum.Silver,
        xpAtualNoTier: 35,
        xpNecessarioProximoTier: 110,
        progressoProximoTierPercentual: 31.82,
      },
      {
        id: 2,
        nome: secondPlayer,
        gols: 1,
        partidas: 1,
        vitorias: 0,
        percentualVitoria: 0,
        xp: 6,
        tier: JogadorTierEnum.Silver,
        xpAtualNoTier: 6,
        xpNecessarioProximoTier: 110,
        progressoProximoTierPercentual: 5.45,
      },
      {
        id: 3,
        nome: thirdPlayer,
        gols: 2,
        partidas: 1,
        vitorias: 0,
        percentualVitoria: 0,
        xp: 12,
        tier: JogadorTierEnum.Silver,
        xpAtualNoTier: 12,
        xpNecessarioProximoTier: 110,
        progressoProximoTierPercentual: 10.91,
      },
    ]);
    expect(new Date(response.atualizadoEm).toString()).not.toBe('Invalid Date');
  });

  it('deve aplicar bonus de saldo em vitoria e garantir XP minimo por partida', async () => {
    const firstCsvPayload = faker.string.uuid();
    const secondCsvPayload = faker.string.uuid();
    const firstPlayer = faker.person.fullName();
    const secondPlayer = faker.person.fullName();
    const partidas: GetPartidasDto[] = [
      {
        grupo: 'Grupo 1',
        dataHora: faker.date.recent().toISOString(),
        mandante: firstPlayer,
        golsMandante: 5,
        golsVisitante: 1,
        visitante: secondPlayer,
        status: PartidaStatusEnum.REALIZADA,
      },
      {
        grupo: 'Grupo 1',
        dataHora: faker.date.recent().toISOString(),
        mandante: secondPlayer,
        golsMandante: 0,
        golsVisitante: 7,
        visitante: firstPlayer,
        status: PartidaStatusEnum.REALIZADA,
      },
    ];

    (googleSheetService.getSpreadsheetCsv as jest.Mock)
      .mockResolvedValueOnce(firstCsvPayload)
      .mockResolvedValueOnce(secondCsvPayload);

    (parser.parse as jest.Mock)
      .mockReturnValueOnce({
        jogadores: [firstPlayer],
      })
      .mockReturnValueOnce({
        jogadores: [secondPlayer],
      });
    (partidasService.getPartidas as jest.Mock).mockResolvedValue(partidas);

    const response = await useCase.execute();

    expect(response.jogadores).toEqual([
      {
        id: 1,
        nome: firstPlayer,
        gols: 12,
        partidas: 2,
        vitorias: 2,
        percentualVitoria: 100,
        xp: 71,
        tier: JogadorTierEnum.Silver,
        xpAtualNoTier: 71,
        xpNecessarioProximoTier: 110,
        progressoProximoTierPercentual: 64.55,
      },
      {
        id: 2,
        nome: secondPlayer,
        gols: 1,
        partidas: 2,
        vitorias: 0,
        percentualVitoria: 0,
        xp: 12,
        tier: JogadorTierEnum.Silver,
        xpAtualNoTier: 12,
        xpNecessarioProximoTier: 110,
        progressoProximoTierPercentual: 10.91,
      },
    ]);
  });

  it('deve classificar tiers por desempenho em ate 9 partidas por jogador', async () => {
    const firstCsvPayload = faker.string.uuid();
    const secondCsvPayload = faker.string.uuid();
    const silverPlayer = faker.person.fullName();
    const goldPlayer = faker.person.fullName();
    const heroPlayer = faker.person.fullName();

    const createPartida = (
      mandante: string,
      golsMandante: number,
      golsVisitante: number,
      index: number,
    ): GetPartidasDto => ({
      grupo: 'Grupo 1',
      dataHora: faker.date.recent().toISOString(),
      mandante,
      golsMandante,
      golsVisitante,
      visitante: `${faker.company.name()} ${index}`,
      status: PartidaStatusEnum.REALIZADA,
    });

    const silverFixtures: Array<[number, number]> = [
      [1, 0],
      [0, 0],
      [0, 1],
      [1, 2],
      [0, 1],
      [0, 2],
      [1, 3],
      [0, 1],
      [2, 3],
    ];
    const goldFixtures: Array<[number, number]> = [
      [2, 1],
      [2, 1],
      [1, 0],
      [3, 2],
      [1, 1],
      [2, 2],
      [1, 2],
      [0, 1],
      [2, 3],
    ];
    const heroFixtures: Array<[number, number]> = [
      [3, 0],
      [3, 0],
      [3, 0],
      [3, 0],
      [2, 0],
      [2, 0],
      [2, 0],
      [2, 2],
      [1, 2],
    ];

    const partidas: GetPartidasDto[] = [
      ...silverFixtures.map(([gf, ga], index) =>
        createPartida(silverPlayer, gf, ga, index + 1),
      ),
      ...goldFixtures.map(([gf, ga], index) =>
        createPartida(goldPlayer, gf, ga, index + 101),
      ),
      ...heroFixtures.map(([gf, ga], index) =>
        createPartida(heroPlayer, gf, ga, index + 201),
      ),
    ];

    (googleSheetService.getSpreadsheetCsv as jest.Mock)
      .mockResolvedValueOnce(firstCsvPayload)
      .mockResolvedValueOnce(secondCsvPayload);

    (parser.parse as jest.Mock)
      .mockReturnValueOnce({
        jogadores: [silverPlayer, goldPlayer],
      })
      .mockReturnValueOnce({
        jogadores: [heroPlayer],
      });
    (partidasService.getPartidas as jest.Mock).mockResolvedValue(partidas);

    const response = await useCase.execute();

    expect(response.jogadores).toEqual([
      {
        id: 1,
        nome: silverPlayer,
        gols: 5,
        partidas: 9,
        vitorias: 1,
        percentualVitoria: 11.11,
        xp: 73,
        tier: JogadorTierEnum.Silver,
        xpAtualNoTier: 73,
        xpNecessarioProximoTier: 110,
        progressoProximoTierPercentual: 66.36,
      },
      {
        id: 2,
        nome: goldPlayer,
        gols: 14,
        partidas: 9,
        vitorias: 4,
        percentualVitoria: 44.44,
        xp: 126,
        tier: JogadorTierEnum.Gold,
        xpAtualNoTier: 16,
        xpNecessarioProximoTier: 60,
        progressoProximoTierPercentual: 26.67,
      },
      {
        id: 3,
        nome: heroPlayer,
        gols: 21,
        partidas: 9,
        vitorias: 7,
        percentualVitoria: 77.78,
        xp: 204,
        tier: JogadorTierEnum.Hero,
        xpAtualNoTier: 34,
        xpNecessarioProximoTier: 0,
        progressoProximoTierPercentual: 100,
      },
    ]);
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
