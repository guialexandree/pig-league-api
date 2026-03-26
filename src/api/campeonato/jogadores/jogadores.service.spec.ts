import type { Faker } from '@faker-js/faker';
import { JogadoresService } from './jogadores.service';
import { GetJogadoresUseCase } from '@/api/campeonato/jogadores/use-cases/get-jogadores/get-jogadores.use-case';
import { GetJogadoresDto } from '@/api/campeonato/jogadores/use-cases/get-jogadores/get-jogadores.dto';
import { JogadorTierEnum } from '@/api/campeonato/jogadores/use-cases/get-jogadores/jogador-tier.enum';

describe('JogadoresService', () => {
  let service: JogadoresService;
  let getJogadoresUseCase: Pick<GetJogadoresUseCase, 'execute'>;
  let faker: Faker;

  beforeAll(async () => {
    ({ faker } = await import('@faker-js/faker'));
  });

  beforeEach(() => {
    faker.seed(20260325);

    getJogadoresUseCase = {
      execute: jest.fn(),
    };

    service = new JogadoresService(getJogadoresUseCase as GetJogadoresUseCase);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('deve chamar execute do use case e repassar o payload sem alteracoes', async () => {
    const payload: GetJogadoresDto = {
      grupo: faker.word.sample(),
      atualizadoEm: faker.date.recent().toISOString(),
      jogadores: [
        {
          id: 1,
          nome: faker.person.fullName(),
          gols: faker.number.int({ min: 0, max: 50 }),
          partidas: faker.number.int({ min: 0, max: 30 }),
          vitorias: faker.number.int({ min: 0, max: 30 }),
          percentualVitoria: faker.number.float({
            min: 0,
            max: 100,
            fractionDigits: 2,
          }),
          xp: faker.number.int({ min: 0, max: 3500 }),
          tier: JogadorTierEnum.Silver,
          xpAtualNoTier: faker.number.int({ min: 0, max: 999 }),
          xpNecessarioProximoTier: 1000,
          progressoProximoTierPercentual: faker.number.float({
            min: 0,
            max: 100,
            fractionDigits: 2,
          }),
        },
      ],
    };

    (getJogadoresUseCase.execute as jest.Mock).mockResolvedValue(payload);

    await expect(service.getJogadores()).resolves.toEqual(payload);
    expect(getJogadoresUseCase.execute).toHaveBeenCalledTimes(1);
  });

  it('deve propagar erro do use case sem remapeamento', async () => {
    const error = new Error(faker.lorem.words(4));
    (getJogadoresUseCase.execute as jest.Mock).mockRejectedValue(error);

    await expect(service.getJogadores()).rejects.toBe(error);
    expect(getJogadoresUseCase.execute).toHaveBeenCalledTimes(1);
  });
});
