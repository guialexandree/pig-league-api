import { ServiceUnavailableException } from '@nestjs/common';
import { ClassificacaoService } from './classificacao.service';

describe('ClassificacaoService', () => {
  let service: ClassificacaoService;
  let originalFetch: typeof fetch;

  beforeAll(() => {
    originalFetch = global.fetch;
  });

  beforeEach(() => {
    service = new ClassificacaoService();
    global.fetch = jest.fn() as unknown as typeof fetch;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('deve retornar classificacao a partir do CSV da planilha', async () => {
    const csv = [
      ',🏆 CAMPEONATO — GRUPO 1,,,,,,,,,',
      '#,Jogador,J,V,E,D,GP,GC,SG,Pts',
      '1,Rodrigo de Mari,3,2,1,0,8,2,6,7',
      '2,Matheus Smek,3,2,0,1,5,3,2,6',
      '* Os 4 primeiros classificam,,,,,,,,,',
    ].join('\n');

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(csv),
    });

    const response = await service.getClassificacao();

    expect(global.fetch).toHaveBeenCalledWith(
      'https://docs.google.com/spreadsheets/d/1ev1M_7z-I_NpC2pBsamqx1dbIeNTSBPJIWE4ow6kUQc/export?format=csv&gid=230309619',
    );
    expect(response.grupo).toBe('CAMPEONATO — GRUPO 1');
    expect(response.classificacao).toEqual([
      {
        posicao: 1,
        jogador: 'Rodrigo de Mari',
        j: 3,
        v: 2,
        e: 1,
        d: 0,
        gp: 8,
        gc: 2,
        sg: 6,
        pts: 7,
      },
      {
        posicao: 2,
        jogador: 'Matheus Smek',
        j: 3,
        v: 2,
        e: 0,
        d: 1,
        gp: 5,
        gc: 3,
        sg: 2,
        pts: 6,
      },
    ]);
    expect(new Date(response.atualizadoEm).toString()).not.toBe('Invalid Date');
  });

  it('deve lancar ServiceUnavailableException em falha HTTP', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 503,
    });

    await expect(service.getClassificacao()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('deve lancar ServiceUnavailableException em CSV invalido', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('foo,bar,baz'),
    });

    await expect(service.getClassificacao()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
