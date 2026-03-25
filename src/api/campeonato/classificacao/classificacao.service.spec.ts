import type { Faker } from '@faker-js/faker';
import { GetClassificacaoDto } from './use-cases/get-classificacao/get-classificacao.dto';
import { ClassificacaoService } from './classificacao.service';
import { GetClassificacaoUseCase } from '@/api/campeonato/classificacao/use-cases/get-classificacao/get-classificacao.use-case';
import { LoadClassificacaoFilters } from '@/api/campeonato/classificacao/use-cases/get-classificacao/get-classificacao-filtros.dto';
import { GetClassificacaoGeralDto } from '@/api/campeonato/classificacao/use-cases/get-classificacao-geral/get-classificacao-geral.dto';
import { LoadClassificacaoGeralFilters } from '@/api/campeonato/classificacao/use-cases/get-classificacao-geral/get-classificacao-geral-filtros.dto';
import { GetClassificacaoGeralUseCase } from '@/api/campeonato/classificacao/use-cases/get-classificacao-geral/get-classificacao-geral.use-case';
import { ClassificacaoStatusFaseEnum } from '@/api/campeonato/classificacao/use-cases/get-classificacao-geral/classificacao-status-fase.enum';

describe('ClassificacaoService', () => {
  let service: ClassificacaoService;
  let getClassificacaoUseCase: Pick<GetClassificacaoUseCase, 'execute'>;
  let getClassificacaoGeralUseCase: Pick<GetClassificacaoGeralUseCase, 'execute'>;
  let faker: Faker;

  beforeAll(async () => {
    ({ faker } = await import('@faker-js/faker'));
  });

  beforeEach(() => {
    faker.seed(20260325);

    getClassificacaoUseCase = {
      execute: jest.fn(),
    };

    getClassificacaoGeralUseCase = {
      execute: jest.fn(),
    };

    service = new ClassificacaoService(
      getClassificacaoUseCase as GetClassificacaoUseCase,
      getClassificacaoGeralUseCase as GetClassificacaoGeralUseCase,
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('deve chamar execute do use case e repassar o payload sem alteracoes', async () => {
    const payload: GetClassificacaoDto[] = [
      {
        grupo: faker.word.sample(),
        posicao: faker.number.int({ min: 1, max: 20 }),
        statusFase: ClassificacaoStatusFaseEnum.CLASSIFICADO,
        jogador: faker.person.fullName(),
        jogos: faker.number.int({ min: 0, max: 20 }),
        vitorias: faker.number.int({ min: 0, max: 20 }),
        empates: faker.number.int({ min: 0, max: 20 }),
        derrotas: faker.number.int({ min: 0, max: 20 }),
        golsPositivo: faker.number.int({ min: 0, max: 200 }),
        golsContra: faker.number.int({ min: 0, max: 200 }),
        saldoGols: faker.number.int({ min: -100, max: 100 }),
        pontos: faker.number.int({ min: 0, max: 200 }),
      },
    ];

    (getClassificacaoUseCase.execute as jest.Mock).mockResolvedValue(payload);

    await expect(service.getClassificacao()).resolves.toEqual(payload);
    expect(getClassificacaoUseCase.execute).toHaveBeenCalledTimes(1);
    expect(getClassificacaoUseCase.execute).toHaveBeenCalledWith(undefined);
  });

  it('deve repassar o filtro de grupo para o use case', async () => {
    const filtros: LoadClassificacaoFilters = { grupoId: 1 };
    const payload: GetClassificacaoDto[] = [];

    (getClassificacaoUseCase.execute as jest.Mock).mockResolvedValue(payload);

    await expect(service.getClassificacao(filtros)).resolves.toEqual(payload);
    expect(getClassificacaoUseCase.execute).toHaveBeenCalledTimes(1);
    expect(getClassificacaoUseCase.execute).toHaveBeenCalledWith(filtros);
  });

  it('deve propagar erro do use case sem remapeamento', async () => {
    const error = new Error(faker.lorem.words(4));
    (getClassificacaoUseCase.execute as jest.Mock).mockRejectedValue(error);

    await expect(service.getClassificacao()).rejects.toBe(error);
    expect(getClassificacaoUseCase.execute).toHaveBeenCalledTimes(1);
  });

  it('deve chamar execute do use case de classificacao geral e repassar o payload sem alteracoes', async () => {
    const payload: GetClassificacaoGeralDto[] = [
      {
        grupo: faker.word.sample(),
        posicao: faker.number.int({ min: 1, max: 20 }),
        statusFase: ClassificacaoStatusFaseEnum.CLASSIFICADO,
        jogador: faker.person.fullName(),
        jogos: faker.number.int({ min: 0, max: 20 }),
        vitorias: faker.number.int({ min: 0, max: 20 }),
        empates: faker.number.int({ min: 0, max: 20 }),
        derrotas: faker.number.int({ min: 0, max: 20 }),
        golsPositivo: faker.number.int({ min: 0, max: 200 }),
        golsContra: faker.number.int({ min: 0, max: 200 }),
        saldoGols: faker.number.int({ min: -100, max: 100 }),
        pontos: faker.number.int({ min: 0, max: 200 }),
      },
    ];

    (getClassificacaoGeralUseCase.execute as jest.Mock).mockResolvedValue(payload);

    await expect(service.getClassificacaoGeral()).resolves.toEqual(payload);
    expect(getClassificacaoGeralUseCase.execute).toHaveBeenCalledTimes(1);
    expect(getClassificacaoGeralUseCase.execute).toHaveBeenCalledWith(undefined);
  });

  it('deve repassar o filtro de grupo para o use case de classificacao geral', async () => {
    const filtros: LoadClassificacaoGeralFilters = { grupoId: 2 };
    const payload: GetClassificacaoGeralDto[] = [];

    (getClassificacaoGeralUseCase.execute as jest.Mock).mockResolvedValue(
      payload,
    );

    await expect(service.getClassificacaoGeral(filtros)).resolves.toEqual(
      payload,
    );
    expect(getClassificacaoGeralUseCase.execute).toHaveBeenCalledTimes(1);
    expect(getClassificacaoGeralUseCase.execute).toHaveBeenCalledWith(filtros);
  });

  it('deve propagar erro do use case de classificacao geral sem remapeamento', async () => {
    const error = new Error(faker.lorem.words(5));
    (getClassificacaoGeralUseCase.execute as jest.Mock).mockRejectedValue(error);

    await expect(service.getClassificacaoGeral()).rejects.toBe(error);
    expect(getClassificacaoGeralUseCase.execute).toHaveBeenCalledTimes(1);
  });
});
