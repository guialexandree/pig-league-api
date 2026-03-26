import type { Faker } from '@faker-js/faker';
import { GetPartidasFiltrosDto } from '@/api/campeonato/partidas/use-cases/get-partidas/get-partidas-filtros.dto';
import { GetPartidasDto } from '@/api/campeonato/partidas/use-cases/get-partidas/get-partidas.dto';
import { PartidaStatusEnum } from '@/api/campeonato/partidas/use-cases/get-partidas/partida-status.enum';
import { GetPartidasUseCase } from '@/api/campeonato/partidas/use-cases/get-partidas/get-partidas.use-case';
import { GetPartidasRealizadasUseCase } from '@/api/campeonato/partidas/use-cases/get-partidas-realizadas/get-partidas-realizadas.use-case';

describe('GetPartidasRealizadasUseCase', () => {
  let useCase: GetPartidasRealizadasUseCase;
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

    useCase = new GetPartidasRealizadasUseCase(
      getPartidasUseCase as GetPartidasUseCase,
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('deve filtrar apenas partidas realizadas e ordenar por data desc', async () => {
    const partidas: GetPartidasDto[] = [
      createPartida({
        status: PartidaStatusEnum.AGENDADA,
        dataHora: '2026-03-08T21:00:00.000Z',
      }),
      createPartida({
        status: PartidaStatusEnum.REALIZADA,
        dataHora: '2026-03-10T21:00:00.000Z',
      }),
      createPartida({
        status: PartidaStatusEnum.REALIZADA,
        dataHora: '2026-03-09T21:00:00.000Z',
      }),
      createPartida({
        status: PartidaStatusEnum.CANCELADA,
        dataHora: '2026-03-11T21:00:00.000Z',
      }),
    ];

    (getPartidasUseCase.execute as jest.Mock).mockResolvedValue(partidas);

    const response = await useCase.execute({});

    expect(getPartidasUseCase.execute).toHaveBeenCalledTimes(1);
    expect(getPartidasUseCase.execute).toHaveBeenCalledWith({});
    expect(response).toHaveLength(2);
    expect(response[0]?.dataHora).toBe('2026-03-10T21:00:00.000Z');
    expect(response[1]?.dataHora).toBe('2026-03-09T21:00:00.000Z');
    expect(response.every((partida) => partida.status === PartidaStatusEnum.REALIZADA)).toBe(
      true,
    );
  });

  it('deve repassar filtros para o use case base', async () => {
    const filtros: GetPartidasFiltrosDto = { grupoId: 1 };
    const partidas: GetPartidasDto[] = [
      createPartida({
        status: PartidaStatusEnum.REALIZADA,
        dataHora: '2026-03-12T21:00:00.000Z',
      }),
    ];

    (getPartidasUseCase.execute as jest.Mock).mockResolvedValue(partidas);

    await expect(useCase.execute(filtros)).resolves.toEqual(partidas);
    expect(getPartidasUseCase.execute).toHaveBeenCalledTimes(1);
    expect(getPartidasUseCase.execute).toHaveBeenCalledWith(filtros);
  });
  function createPartida(overrides: Partial<GetPartidasDto> = {}): GetPartidasDto {
    return {
      grupo: 'GRUPO 1',
      dataHora: faker.date.soon().toISOString(),
      mandante: faker.person.fullName(),
      golsMandante: faker.number.int({ min: 0, max: 15 }),
      golsVisitante: faker.number.int({ min: 0, max: 15 }),
      visitante: faker.person.fullName(),
      status: PartidaStatusEnum.REALIZADA,
      ...overrides,
    };
  }
});
