import type { Faker } from '@faker-js/faker';
import { GetPartidasFiltrosDto } from '@/api/campeonato/partidas/use-cases/get-partidas/get-partidas-filtros.dto';
import { GetPartidasDto } from '@/api/campeonato/partidas/use-cases/get-partidas/get-partidas.dto';
import { PartidaStatusEnum } from '@/api/campeonato/partidas/use-cases/get-partidas/partida-status.enum';
import { GetPartidasUseCase } from '@/api/campeonato/partidas/use-cases/get-partidas/get-partidas.use-case';
import { GetPartidasPendentesUseCase } from '@/api/campeonato/partidas/use-cases/get-partidas-pendentes/get-partidas-pendentes.use-case';

describe('GetPartidasPendentesUseCase', () => {
  let useCase: GetPartidasPendentesUseCase;
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

    useCase = new GetPartidasPendentesUseCase(
      getPartidasUseCase as GetPartidasUseCase,
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('deve retornar somente partidas pendentes', async () => {
    const partidas: GetPartidasDto[] = [
      createPartida({ status: PartidaStatusEnum.AGENDADA }),
      createPartida({ status: PartidaStatusEnum.NAO_AGENDADA }),
      createPartida({ status: PartidaStatusEnum.CANCELADA }),
      createPartida({ status: PartidaStatusEnum.REALIZADA }),
    ];

    (getPartidasUseCase.execute as jest.Mock).mockResolvedValue(partidas);

    const response = await useCase.execute({});

    expect(getPartidasUseCase.execute).toHaveBeenCalledTimes(1);
    expect(getPartidasUseCase.execute).toHaveBeenCalledWith({});
    expect(response).toHaveLength(3);
    expect(response.every((partida) => partida.status !== PartidaStatusEnum.REALIZADA)).toBe(
      true,
    );
  });

  it('deve repassar filtro de grupo para o use-case base', async () => {
    const filtros: GetPartidasFiltrosDto = { grupoId: 2 };
    const partidas: GetPartidasDto[] = [
      createPartida({ status: PartidaStatusEnum.AGENDADA }),
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
      status: PartidaStatusEnum.AGENDADA,
      ...overrides,
    };
  }
});
