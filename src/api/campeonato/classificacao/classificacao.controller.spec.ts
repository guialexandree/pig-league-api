import type { Faker } from '@faker-js/faker';
import { Test, TestingModule } from '@nestjs/testing';
import { ClassificacaoController } from './classificacao.controller';
import { ClassificacaoService } from './classificacao.service';
import { GetClassificacaoDto } from './use-cases/get-classificacao/get-classificacao.dto';
import { LoadClassificacaoFilters } from '@/api/campeonato/classificacao/use-cases/get-classificacao/get-classificacao-filtros.dto';
import { GetClassificacaoGeralDto } from '@/api/campeonato/classificacao/use-cases/get-classificacao-geral/get-classificacao-geral.dto';
import { LoadClassificacaoGeralFilters } from '@/api/campeonato/classificacao/use-cases/get-classificacao-geral/get-classificacao-geral-filtros.dto';
import { ClassificacaoStatusFaseEnum } from '@/api/campeonato/classificacao/use-cases/get-classificacao-geral/classificacao-status-fase.enum';

describe('ClassificacaoController', () => {
  let controller: ClassificacaoController;
  let faker: Faker;
  const classificacaoService = {
    getClassificacao: jest.fn<
      Promise<GetClassificacaoDto[]>,
      [LoadClassificacaoFilters?]
    >(),
    getClassificacaoGeral: jest.fn<
      Promise<GetClassificacaoGeralDto[]>,
      [LoadClassificacaoGeralFilters?]
    >(),
  };

  beforeAll(async () => {
    ({ faker } = await import('@faker-js/faker'));
  });

  beforeEach(async () => {
    faker.seed(20260325);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClassificacaoController],
      providers: [
        {
          provide: ClassificacaoService,
          useValue: classificacaoService,
        },
      ],
    }).compile();

    controller = module.get<ClassificacaoController>(ClassificacaoController);
    classificacaoService.getClassificacao.mockReset();
    classificacaoService.getClassificacaoGeral.mockReset();
  });

  it('deve retornar a classificacao do service', async () => {
    const payload: GetClassificacaoDto[] = [
      {
        grupo: `CAMPEONATO - GRUPO ${faker.number.int({ min: 1, max: 2 })}`,
        posicao: 1,
        statusFase: ClassificacaoStatusFaseEnum.CLASSIFICADO,
        jogador: faker.person.fullName(),
        jogos: 0,
        vitorias: 0,
        empates: 0,
        derrotas: 0,
        golsPositivo: 0,
        golsContra: 0,
        saldoGols: 0,
        pontos: 0,
      },
    ];

    classificacaoService.getClassificacao.mockResolvedValue(payload);

    await expect(controller.getClassificacao(undefined)).resolves.toEqual(
      payload,
    );
    expect(classificacaoService.getClassificacao).toHaveBeenCalledTimes(1);
    expect(classificacaoService.getClassificacao).toHaveBeenCalledWith(
      undefined,
    );
  });

  it('deve encaminhar o filtro de grupo para o service quando informado', async () => {
    const filtros: LoadClassificacaoFilters = { grupoId: 2 };

    const payload: GetClassificacaoDto[] = [];

    classificacaoService.getClassificacao.mockResolvedValue(payload);

    await expect(controller.getClassificacao(filtros)).resolves.toEqual(
      payload,
    );
    expect(classificacaoService.getClassificacao).toHaveBeenCalledTimes(1);
    expect(classificacaoService.getClassificacao).toHaveBeenCalledWith(filtros);
  });

  it('deve retornar a classificacao geral do service', async () => {
    const payload: GetClassificacaoGeralDto[] = [
      {
        grupo: `CAMPEONATO - GRUPO ${faker.number.int({ min: 1, max: 2 })}`,
        posicao: 1,
        statusFase: ClassificacaoStatusFaseEnum.CLASSIFICADO,
        jogador: faker.person.fullName(),
        jogos: 0,
        vitorias: 0,
        empates: 0,
        derrotas: 0,
        golsPositivo: 0,
        golsContra: 0,
        saldoGols: 0,
        pontos: 0,
      },
    ];

    classificacaoService.getClassificacaoGeral.mockResolvedValue(payload);

    await expect(controller.getClassificacaoGeral(undefined)).resolves.toEqual(
      payload,
    );
    expect(classificacaoService.getClassificacaoGeral).toHaveBeenCalledTimes(1);
    expect(classificacaoService.getClassificacaoGeral).toHaveBeenCalledWith(
      undefined,
    );
  });

  it('deve encaminhar o filtro de grupo para classificacao geral', async () => {
    const filtros: LoadClassificacaoGeralFilters = { grupoId: 1 };
    const payload: GetClassificacaoGeralDto[] = [];

    classificacaoService.getClassificacaoGeral.mockResolvedValue(payload);

    await expect(controller.getClassificacaoGeral(filtros)).resolves.toEqual(
      payload,
    );
    expect(classificacaoService.getClassificacaoGeral).toHaveBeenCalledTimes(1);
    expect(classificacaoService.getClassificacaoGeral).toHaveBeenCalledWith(
      filtros,
    );
  });
});
