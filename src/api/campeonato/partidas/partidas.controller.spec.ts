import type { Faker } from '@faker-js/faker';
import { Test, TestingModule } from '@nestjs/testing';
import { PartidasController } from './partidas.controller';
import { PartidasService } from './partidas.service';
import { GetPartidasDto } from './use-cases/get-partidas/get-partidas.dto';
import { GetPartidasFiltrosDto } from '@/api/campeonato/partidas/use-cases/get-partidas/get-partidas-filtros.dto';
import { PartidaStatusEnum } from './use-cases/get-partidas/partida-status.enum';

describe('PartidasController', () => {
  let controller: PartidasController;
  let faker: Faker;
  const partidasService = {
    getPartidas: jest.fn<
      Promise<GetPartidasDto[]>,
      [filtros: GetPartidasFiltrosDto]
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

    partidasService.getPartidas.mockResolvedValue(payload);

    await expect(controller.getPartidas({})).resolves.toEqual(payload);
    expect(partidasService.getPartidas).toHaveBeenCalledTimes(1);
    expect(partidasService.getPartidas).toHaveBeenCalledWith({});
  });

  it('deve encaminhar o grupo para o service quando informado', async () => {
    const grupoId = 2;
    const filtros = { grupoId };
    const payload: GetPartidasDto[] = [];

    partidasService.getPartidas.mockResolvedValue(payload);

    await expect(controller.getPartidas(filtros)).resolves.toEqual(payload);
    expect(partidasService.getPartidas).toHaveBeenCalledTimes(1);
    expect(partidasService.getPartidas).toHaveBeenCalledWith(filtros);
  });
});
