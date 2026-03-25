import type { Faker } from '@faker-js/faker';
import { Test, TestingModule } from '@nestjs/testing';
import { JogadoresController } from './jogadores.controller';
import { JogadoresService } from './jogadores.service';
import { GetJogadoresDto } from './use-cases/get-jogadores/get-jogadores.dto';

describe('JogadoresController', () => {
  let controller: JogadoresController;
  let faker: Faker;
  const jogadoresService = {
    getJogadores: jest.fn<Promise<GetJogadoresDto>, []>(),
  };

  beforeAll(async () => {
    ({ faker } = await import('@faker-js/faker'));
  });

  beforeEach(async () => {
    faker.seed(20260325);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [JogadoresController],
      providers: [
        {
          provide: JogadoresService,
          useValue: jogadoresService,
        },
      ],
    }).compile();

    controller = module.get<JogadoresController>(JogadoresController);
    jogadoresService.getJogadores.mockReset();
  });

  it('deve retornar a lista de jogadores do service', async () => {
    const payload: GetJogadoresDto = {
      grupo: 'CAMPEONATO',
      atualizadoEm: faker.date.recent().toISOString(),
      jogadores: [
        {
          id: faker.number.int({ min: 1, max: 999 }),
          nome: faker.person.fullName(),
        },
      ],
    };

    jogadoresService.getJogadores.mockResolvedValue(payload);

    await expect(controller.getJogadores()).resolves.toEqual(payload);
    expect(jogadoresService.getJogadores).toHaveBeenCalledTimes(1);
  });
});
