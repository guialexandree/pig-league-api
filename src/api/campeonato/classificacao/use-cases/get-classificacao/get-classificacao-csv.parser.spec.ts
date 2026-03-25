import type { Faker } from '@faker-js/faker';
import { ClassificacaoCsvParser } from './get-classificacao-csv.parser';

describe('ClassificacaoCsvParser', () => {
  let parser: ClassificacaoCsvParser;
  let faker: Faker;

  beforeAll(async () => {
    ({ faker } = await import('@faker-js/faker'));
  });

  beforeEach(() => {
    faker.seed(20260325);
    parser = new ClassificacaoCsvParser();
  });

  it('deve encontrar cabecalho e extrair linhas validas ignorando rodape', () => {
    const firstPlayer = faker.person.fullName();
    const secondPlayer = faker.person.fullName();

    const csv = [
      `,🏆 CAMPEONATO - GRUPO ${faker.number.int({ min: 1, max: 9 })},,,,,,,,,`,
      '#,Jogador,J,V,E,D,GP,GC,SG,Pts',
      `1,${firstPlayer},3,2,1,0,10,2,8,7`,
      `2,${secondPlayer},3,2,0,1,8,4,4,6`,
      `* ${faker.lorem.words(4)},,,,,,,,,`,
    ].join('\n');

    const parsed = parser.parse(csv);

    expect(parsed.itens).toEqual([
      {
        posicao: 1,
        jogador: firstPlayer,
        j: 3,
        v: 2,
        e: 1,
        d: 0,
        gp: 10,
        gc: 2,
        sg: 8,
        pts: 7,
      },
      {
        posicao: 2,
        jogador: secondPlayer,
        j: 3,
        v: 2,
        e: 0,
        d: 1,
        gp: 8,
        gc: 4,
        sg: 4,
        pts: 6,
      },
    ]);
  });

  it('deve lancar erro quando nao encontra cabecalho', () => {
    const csv = [faker.lorem.words(3), faker.lorem.words(4)].join('\n');

    expect(() => parser.parse(csv)).toThrow(
      'Cabecalho da tabela de classificacao nao encontrado na planilha',
    );
  });

  it('deve extrair grupo quando presente no texto', () => {
    const groupNumber = faker.number.int({ min: 1, max: 9 });
    const player = faker.person.fullName();

    const csv = [
      `,🏆 CAMPEONATO - GRUPO ${groupNumber},,,,,,,,,`,
      '#,Jogador,J,V,E,D,GP,GC,SG,Pts',
      `1,${player},1,1,0,0,2,0,2,3`,
    ].join('\n');

    const parsed = parser.parse(csv);

    expect(parsed.grupo).toBe(`CAMPEONATO - GRUPO ${groupNumber}`);
  });
});
