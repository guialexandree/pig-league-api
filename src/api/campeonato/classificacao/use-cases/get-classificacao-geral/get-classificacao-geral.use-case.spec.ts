import type { Faker } from '@faker-js/faker';
import { ServiceUnavailableException } from '@nestjs/common';
import { PartidasService } from '@/api/campeonato/partidas/partidas.service';
import { PartidaStatusEnum } from '@/api/campeonato/partidas/use-cases/get-partidas/partida-status.enum';
import { GetClassificacaoGeralUseCase } from './get-classificacao-geral.use-case';
import { GetPartidasDto } from '@/api/campeonato/partidas/use-cases/get-partidas/get-partidas.dto';

describe('GetClassificacaoGeralUseCase', () => {
  let useCase: GetClassificacaoGeralUseCase;
  let partidasService: Pick<PartidasService, 'getPartidas'>;
  let faker: Faker;

  beforeAll(async () => {
    ({ faker } = await import('@faker-js/faker'));
  });

  beforeEach(() => {
    faker.seed(20260325);

    partidasService = {
      getPartidas: jest.fn(),
    };

    useCase = new GetClassificacaoGeralUseCase(
      partidasService as PartidasService,
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('deve calcular a classificacao com partidas realizadas e desempatar por confronto direto', async () => {
    const grupo = `GRUPO ${faker.number.int({ min: 1, max: 1 })}`;
    const jogadorA = faker.company.name();
    const jogadorB = faker.company.name();
    const jogadorC = faker.company.name();
    const jogadorD = faker.company.name();
    const jogadorE = faker.company.name();

    const partidas: GetPartidasDto[] = [
      createPartida(grupo, jogadorA, 1, 0, jogadorB, PartidaStatusEnum.REALIZADA),
      createPartida(grupo, jogadorA, 0, 1, jogadorC, PartidaStatusEnum.REALIZADA),
      createPartida(grupo, jogadorA, 2, 0, jogadorD, PartidaStatusEnum.REALIZADA),
      createPartida(grupo, jogadorA, 1, 0, jogadorE, PartidaStatusEnum.REALIZADA),
      createPartida(grupo, jogadorB, 2, 1, jogadorC, PartidaStatusEnum.REALIZADA),
      createPartida(grupo, jogadorB, 1, 0, jogadorD, PartidaStatusEnum.REALIZADA),
      createPartida(grupo, jogadorB, 1, 0, jogadorE, PartidaStatusEnum.REALIZADA),
      createPartida(grupo, jogadorC, 1, 0, jogadorD, PartidaStatusEnum.REALIZADA),
      createPartida(grupo, jogadorC, 1, 0, jogadorE, PartidaStatusEnum.REALIZADA),
      createPartida(grupo, jogadorE, 1, 0, jogadorD, PartidaStatusEnum.REALIZADA),
      createPartida(grupo, jogadorD, 9, 0, jogadorA, PartidaStatusEnum.AGENDADA),
      createPartida(grupo, jogadorD, 8, 0, jogadorB, PartidaStatusEnum.CANCELADA),
      createPartida(grupo, jogadorD, null, null, jogadorC, PartidaStatusEnum.REALIZADA),
    ];

    (partidasService.getPartidas as jest.Mock).mockResolvedValue(partidas);

    const response = await useCase.execute({ grupoId: 1 });

    expect(partidasService.getPartidas).toHaveBeenCalledTimes(1);
    expect(partidasService.getPartidas).toHaveBeenCalledWith({ grupoId: 1 });

    expect(response).toEqual([
      {
        grupo,
        posicao: 1,
        jogador: jogadorA,
        jogos: 4,
        vitorias: 3,
        empates: 0,
        derrotas: 1,
        golsPositivo: 4,
        golsContra: 1,
        saldoGols: 3,
        pontos: 9,
      },
      {
        grupo,
        posicao: 2,
        jogador: jogadorB,
        jogos: 4,
        vitorias: 3,
        empates: 0,
        derrotas: 1,
        golsPositivo: 4,
        golsContra: 2,
        saldoGols: 2,
        pontos: 9,
      },
      {
        grupo,
        posicao: 3,
        jogador: jogadorC,
        jogos: 4,
        vitorias: 3,
        empates: 0,
        derrotas: 1,
        golsPositivo: 4,
        golsContra: 2,
        saldoGols: 2,
        pontos: 9,
      },
      {
        grupo,
        posicao: 4,
        jogador: jogadorE,
        jogos: 4,
        vitorias: 1,
        empates: 0,
        derrotas: 3,
        golsPositivo: 1,
        golsContra: 3,
        saldoGols: -2,
        pontos: 3,
      },
    ]);
  });

  it('deve devolver no maximo 4 classificados por grupo quando consulta geral', async () => {
    const grupo1 = `GRUPO ${faker.number.int({ min: 1, max: 1 })}`;
    const grupo2 = `GRUPO ${faker.number.int({ min: 2, max: 2 })}`;

    const grupo1Jogadores = [
      faker.company.name(),
      faker.company.name(),
      faker.company.name(),
      faker.company.name(),
      faker.company.name(),
    ];

    const grupo2Jogadores = [
      faker.company.name(),
      faker.company.name(),
      faker.company.name(),
      faker.company.name(),
      faker.company.name(),
    ];

    const partidas: GetPartidasDto[] = [
      ...buildRankingPartidas(grupo1, grupo1Jogadores),
      ...buildRankingPartidas(grupo2, grupo2Jogadores),
    ];

    (partidasService.getPartidas as jest.Mock).mockResolvedValue(partidas);

    const response = await useCase.execute();

    expect(partidasService.getPartidas).toHaveBeenCalledTimes(1);
    expect(partidasService.getPartidas).toHaveBeenCalledWith(undefined);

    expect(response).toHaveLength(8);

    const grupo1Classificados = response.filter((item) => item.grupo === grupo1);
    const grupo2Classificados = response.filter((item) => item.grupo === grupo2);

    expect(grupo1Classificados).toHaveLength(4);
    expect(grupo2Classificados).toHaveLength(4);

    expect(grupo1Classificados.map((item) => item.posicao)).toEqual([1, 2, 3, 4]);
    expect(grupo2Classificados.map((item) => item.posicao)).toEqual([1, 2, 3, 4]);

    expect(grupo1Classificados.map((item) => item.jogador)).toEqual(
      grupo1Jogadores.slice(0, 4),
    );
    expect(grupo2Classificados.map((item) => item.jogador)).toEqual(
      grupo2Jogadores.slice(0, 4),
    );
  });

  it('deve propagar erro como ServiceUnavailableException', async () => {
    const message = faker.lorem.words(3);
    (partidasService.getPartidas as jest.Mock).mockRejectedValue(
      new Error(message),
    );

    await expect(useCase.execute()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});

function createPartida(
  grupo: string,
  mandante: string,
  golsMandante: number | null,
  golsVisitante: number | null,
  visitante: string,
  status: PartidaStatusEnum,
): GetPartidasDto {
  return {
    grupo,
    dataHora: null,
    mandante,
    golsMandante,
    golsVisitante,
    visitante,
    status,
  };
}

function buildRankingPartidas(grupo: string, jogadores: string[]): GetPartidasDto[] {
  return [
    createPartida(
      grupo,
      jogadores[0],
      1,
      0,
      jogadores[1],
      PartidaStatusEnum.REALIZADA,
    ),
    createPartida(
      grupo,
      jogadores[0],
      1,
      0,
      jogadores[2],
      PartidaStatusEnum.REALIZADA,
    ),
    createPartida(
      grupo,
      jogadores[0],
      1,
      0,
      jogadores[3],
      PartidaStatusEnum.REALIZADA,
    ),
    createPartida(
      grupo,
      jogadores[0],
      1,
      0,
      jogadores[4],
      PartidaStatusEnum.REALIZADA,
    ),
    createPartida(
      grupo,
      jogadores[1],
      1,
      0,
      jogadores[2],
      PartidaStatusEnum.REALIZADA,
    ),
    createPartida(
      grupo,
      jogadores[1],
      1,
      0,
      jogadores[3],
      PartidaStatusEnum.REALIZADA,
    ),
    createPartida(
      grupo,
      jogadores[1],
      1,
      0,
      jogadores[4],
      PartidaStatusEnum.REALIZADA,
    ),
    createPartida(
      grupo,
      jogadores[2],
      1,
      0,
      jogadores[3],
      PartidaStatusEnum.REALIZADA,
    ),
    createPartida(
      grupo,
      jogadores[2],
      1,
      0,
      jogadores[4],
      PartidaStatusEnum.REALIZADA,
    ),
    createPartida(
      grupo,
      jogadores[3],
      1,
      0,
      jogadores[4],
      PartidaStatusEnum.REALIZADA,
    ),
  ];
}
