import type { Faker } from '@faker-js/faker';
import { PartidasService } from './partidas.service';
import {
  GetPartidasUseCase,
} from '@/api/campeonato/partidas/use-cases/get-partidas/get-partidas.use-case';
import { GetPartidasDto } from '@/api/campeonato/partidas/use-cases/get-partidas/get-partidas.dto';
import { GetPartidasFiltrosDto } from '@/api/campeonato/partidas/use-cases/get-partidas/get-partidas-filtros.dto';
import { PartidaStatusEnum } from '@/api/campeonato/partidas/use-cases/get-partidas/partida-status.enum';

describe('PartidasService', () => {
  let service: PartidasService;
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

    service = new PartidasService(getPartidasUseCase as GetPartidasUseCase);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('deve chamar execute do use case e repassar o payload sem alteracoes', async () => {
    const home = faker.person.fullName();
    const away = faker.person.fullName();

    const payload: GetPartidasDto[] = [
      {
        grupo: `GRUPO ${faker.number.int({ min: 1, max: 9 })}`,
        dataHora: faker.date.soon().toISOString(),
        mandante: home,
        golsMandante: faker.number.int({ min: 0, max: 15 }),
        golsVisitante: faker.number.int({ min: 0, max: 15 }),
        visitante: away,
        status: PartidaStatusEnum.REALIZADA,
      },
    ];

    (getPartidasUseCase.execute as jest.Mock).mockResolvedValue(payload);

    await expect(service.getPartidas({})).resolves.toEqual(payload);
    expect(getPartidasUseCase.execute).toHaveBeenCalledTimes(1);
    expect(getPartidasUseCase.execute).toHaveBeenCalledWith({});
  });

  it('deve repassar o filtro de grupo para o use case', async () => {
    const grupo = 1;
    const filtros: GetPartidasFiltrosDto = { grupoId: grupo };
    const payload: GetPartidasDto[] = [];

    (getPartidasUseCase.execute as jest.Mock).mockResolvedValue(payload);

    await expect(service.getPartidas(filtros)).resolves.toEqual(payload);
    expect(getPartidasUseCase.execute).toHaveBeenCalledTimes(1);
    expect(getPartidasUseCase.execute).toHaveBeenCalledWith(filtros);
  });

  it('deve propagar erro do use case sem remapeamento', async () => {
    const error = new Error(faker.lorem.words(4));
    (getPartidasUseCase.execute as jest.Mock).mockRejectedValue(error);

    await expect(service.getPartidas({})).rejects.toBe(error);
    expect(getPartidasUseCase.execute).toHaveBeenCalledTimes(1);
  });
});
