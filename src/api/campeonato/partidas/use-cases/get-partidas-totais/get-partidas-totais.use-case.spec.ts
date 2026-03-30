import type { Faker } from '@faker-js/faker';
import { GetPartidasDto } from '@/api/campeonato/partidas/use-cases/get-partidas/get-partidas.dto';
import { PartidaStatusEnum } from '@/api/campeonato/partidas/use-cases/get-partidas/partida-status.enum';
import { GetPartidasUseCase } from '@/api/campeonato/partidas/use-cases/get-partidas/get-partidas.use-case';
import { GetPartidasTotaisUseCase } from '@/api/campeonato/partidas/use-cases/get-partidas-totais/get-partidas-totais.use-case';

describe('GetPartidasTotaisUseCase', () => {
  let useCase: GetPartidasTotaisUseCase;
  let getPartidasUseCase: Pick<GetPartidasUseCase, 'execute'>;
  let faker: Faker;

  beforeAll(async () => {
    ({ faker } = await import('@faker-js/faker'));
  });

  beforeEach(() => {
    faker.seed(20260325);

    getPartidasUseCase = {
      execute: jest.fn(),
    };

    useCase = new GetPartidasTotaisUseCase(
      getPartidasUseCase as GetPartidasUseCase,
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('deve retornar totais agregados de partidas', async () => {
    const partidas: GetPartidasDto[] = [
      createPartida({ status: PartidaStatusEnum.REALIZADA }),
      createPartida({ status: PartidaStatusEnum.REALIZADA }),
      createPartida({ status: PartidaStatusEnum.AGENDADA }),
      createPartida({ status: PartidaStatusEnum.NAO_AGENDADA }),
      createPartida({ status: PartidaStatusEnum.CANCELADA }),
    ];

    (getPartidasUseCase.execute as jest.Mock).mockResolvedValue(partidas);

    await expect(useCase.execute()).resolves.toEqual({
      totalPartidas: 5,
      totalRealizada: 2,
      totalPendente: 3,
    });
    expect(getPartidasUseCase.execute).toHaveBeenCalledTimes(1);
    expect(getPartidasUseCase.execute).toHaveBeenCalledWith({});
  });

  it('deve retornar zeros quando nao houver partidas', async () => {
    (getPartidasUseCase.execute as jest.Mock).mockResolvedValue([]);

    await expect(useCase.execute()).resolves.toEqual({
      totalPartidas: 0,
      totalRealizada: 0,
      totalPendente: 0,
    });
  });

  function createPartida(overrides: Partial<GetPartidasDto> = {}): GetPartidasDto {
    return {
      grupo: `GRUPO ${faker.number.int({ min: 1, max: 2 })}`,
      dataHora: faker.date.soon().toISOString(),
      mandante: faker.person.fullName(),
      golsMandante: faker.number.int({ min: 0, max: 15 }),
      golsVisitante: faker.number.int({ min: 0, max: 15 }),
      visitante: faker.person.fullName(),
      status: PartidaStatusEnum.AGENDADA,
      ...overrides,
    };
  }
});
