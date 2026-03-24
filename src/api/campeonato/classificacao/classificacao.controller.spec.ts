import { Test, TestingModule } from '@nestjs/testing';
import { ClassificacaoController } from './classificacao.controller';
import { ClassificacaoService } from './classificacao.service';
import { ClassificacaoResponseDto } from './dto/classificacao-response.dto';

describe('ClassificacaoController', () => {
  let controller: ClassificacaoController;
  const classificacaoService = {
    getClassificacao: jest.fn<Promise<ClassificacaoResponseDto>, []>(),
  };

  beforeEach(async () => {
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
    const payload: ClassificacaoResponseDto = {
      grupo: 'CAMPEONATO - GRUPO 1',
      atualizadoEm: '2026-03-24T00:00:00.000Z',
      classificacao: [
        {
          posicao: 1,
          jogador: 'Rodrigo de Mari',
          j: 0,
          v: 0,
          e: 0,
          d: 0,
          gp: 0,
          gc: 0,
          sg: 0,
          pts: 0,
        },
      ],
    };

    classificacaoService.getClassificacao.mockResolvedValue(payload);

    await expect(controller.getClassificacao()).resolves.toEqual(payload);
    expect(classificacaoService.getClassificacao).toHaveBeenCalledTimes(1);
  });
});
