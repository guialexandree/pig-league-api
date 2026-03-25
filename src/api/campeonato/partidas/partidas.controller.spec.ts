import type { Faker } from '@faker-js/faker';
import { Test, TestingModule } from '@nestjs/testing';
import { PartidasGrupoFilter } from '@/api/campeonato/partidas/use-cases/get-partidas/get-partidas.use-case';
import { PartidasController } from './partidas.controller';
import { PartidasService } from './partidas.service';
import { GetPartidasDto } from './use-cases/get-partidas/get-partidas.dto';
import { PartidaStatusEnum } from './use-cases/get-partidas/partida-status.enum';

describe('PartidasController', () => {
  let controller: PartidasController;
  let faker: Faker;
  const partidasService = {
    getPartidas: jest.fn<
      Promise<GetPartidasDto>,
      [grupo?: PartidasGrupoFilter]
    >(),
  };

  beforeAll(async () => {
    ({ faker } = await import('@faker-js/faker'));
  });

  beforeEach(async () => {
    faker.seed(20260325);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PartidasController],
      providers: [
        {
          provide: PartidasService,
          useValue: partidasService,
        },
      ],
    }).compile();

    controller = module.get<PartidasController>(PartidasController);
    partidasService.getPartidas.mockReset();
  });

  it('deve retornar as partidas do service', async () => {
    const home = faker.person.fullName();
    const away = faker.person.fullName();

    const payload: GetPartidasDto = {
      grupo: `GRUPO ${faker.number.int({ min: 1, max: 9 })}`,
      atualizadoEm: faker.date.recent().toISOString(),
      partidas: [
        {
          grupo: `GRUPO ${faker.number.int({ min: 1, max: 9 })}`,
          mandante: home,
          golsMandante: faker.number.int({ min: 0, max: 15 }),
          golsVisitante: faker.number.int({ min: 0, max: 15 }),
          visitante: away,
          status: PartidaStatusEnum.REALIZADA,
        },
      ],
    };

    partidasService.getPartidas.mockResolvedValue(payload);

    await expect(controller.getPartidas(undefined)).resolves.toEqual(payload);
    expect(partidasService.getPartidas).toHaveBeenCalledTimes(1);
    expect(partidasService.getPartidas).toHaveBeenCalledWith(undefined);
  });

  it('deve encaminhar o grupo para o service quando informado', async () => {
    const grupo: PartidasGrupoFilter = 2;

    const payload: GetPartidasDto = {
      grupo: `GRUPO ${grupo}`,
      atualizadoEm: faker.date.recent().toISOString(),
      partidas: [],
    };

    partidasService.getPartidas.mockResolvedValue(payload);

    await expect(
      controller.getPartidas(String(grupo) as '1' | '2'),
    ).resolves.toEqual(payload);
    expect(partidasService.getPartidas).toHaveBeenCalledTimes(1);
    expect(partidasService.getPartidas).toHaveBeenCalledWith(grupo);
  });
});
