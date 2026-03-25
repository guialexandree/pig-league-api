import type { Faker } from '@faker-js/faker';
import { GetJogadoresCsvParser } from './get-jogadores-csv.parser';

describe('GetJogadoresCsvParser', () => {
  let parser: GetJogadoresCsvParser;
  let faker: Faker;

  beforeAll(async () => {
    ({ faker } = await import('@faker-js/faker'));
  });

  beforeEach(() => {
    faker.seed(20260325);
    parser = new GetJogadoresCsvParser();
  });

  it('deve encontrar cabecalho e extrair nomes validos ignorando linhas de rodape', () => {
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

    expect(parsed.jogadores).toEqual([firstPlayer, secondPlayer]);
  });

  it('deve lancar erro quando nao encontra o cabecalho da tabela', () => {
    const csv = [faker.lorem.words(3), faker.lorem.words(4)].join('\n');

    expect(() => parser.parse(csv)).toThrow(
      'Cabecalho da tabela de jogadores nao encontrado na planilha',
    );
  });

  it('deve lancar erro quando nao encontra nenhuma linha valida de jogador', () => {
    const csv = [
      `,🏆 CAMPEONATO - GRUPO ${faker.number.int({ min: 1, max: 9 })},,,,,,,,,`,
      '#,Jogador,J,V,E,D,GP,GC,SG,Pts',
      `${faker.lorem.word()},,,,,,,,,`,
    ].join('\n');

    expect(() => parser.parse(csv)).toThrow(
      'Nenhuma linha de jogador valida foi encontrada',
    );
  });
});
