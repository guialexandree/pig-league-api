import type { Faker } from '@faker-js/faker';
import { Test, TestingModule } from '@nestjs/testing';
import { ClassificacaoController } from './classificacao.controller';
import { ClassificacaoService } from './classificacao.service';
import { GetClassificacaoDto } from './use-cases/get-classificacao/get-classificacao.dto';
import { LoadClassificacaoFilters } from '@/api/campeonato/classificacao/use-cases/get-classificacao/get-classificacao-filtros.dto';

describe('ClassificacaoController', () => {
  let controller: ClassificacaoController;
  let faker: Faker;
  const classificacaoService = {
    getClassificacao: jest.fn<
      Promise<GetClassificacaoDto>,
      [LoadClassificacaoFilters?]
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
  });

  it('deve retornar a classificacao do service', async () => {
    const payload: GetClassificacaoDto = {
      grupo: `CAMPEONATO - GRUPO ${faker.number.int({ min: 1, max: 2 })}`,
      atualizadoEm: faker.date.recent().toISOString(),
      classificacao: [
        {
          posicao: 1,
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
      ],
    };

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

    const payload: GetClassificacaoDto = {
      grupo: 'CAMPEONATO',
      atualizadoEm: faker.date.recent().toISOString(),
      classificacao: [],
    };

    classificacaoService.getClassificacao.mockResolvedValue(payload);

    await expect(controller.getClassificacao(filtros)).resolves.toEqual(
      payload,
    );
    expect(classificacaoService.getClassificacao).toHaveBeenCalledTimes(1);
    expect(classificacaoService.getClassificacao).toHaveBeenCalledWith(filtros);
  });
});
