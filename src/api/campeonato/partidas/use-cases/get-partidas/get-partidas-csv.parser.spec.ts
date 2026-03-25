import type { Faker } from '@faker-js/faker';
import { PartidaStatusEnum } from './partida-status.enum';
import { GetPartidasCsvParser } from './get-partidas-csv.parser';

describe('GetPartidasCsvParser', () => {
  let parser: GetPartidasCsvParser;
  let faker: Faker;

  beforeAll(async () => {
    ({ faker } = await import('@faker-js/faker'));
  });

  beforeEach(() => {
    faker.seed(20260325);
    parser = new GetPartidasCsvParser();
  });

  it('deve encontrar cabecalho, extrair partidas e inferir status conforme data e gols', () => {
    const groupNumber = faker.number.int({ min: 1, max: 9 });

    const firstHome = faker.person.fullName();
    const firstAway = faker.person.fullName();
    const secondHome = faker.person.fullName();
    const secondAway = faker.person.fullName();
    const thirdHome = faker.person.fullName();
    const thirdAway = faker.person.fullName();
    const fourthHome = faker.person.fullName();
    const fourthAway = faker.person.fullName();
    const scheduledDate = faker.date.soon().toISOString();

    const csv = [
      `⚽  JOGOS — GRUPO ${groupNumber},,,,,`,
      ',,,,,',
      'Mandante,Gols,Gols,Visitante,Resultado,Data',
      `${firstHome},2,1,${firstAway},,${scheduledDate}`,
      `${secondHome},,,${secondAway},,${scheduledDate}`,
      `${thirdHome},0,0,${thirdAway},,`,
      `${fourthHome},,,${fourthAway},cancelada,${scheduledDate}`,
      `${faker.person.fullName()},,,,,`,
    ].join('\n');

    const parsed = parser.parse(csv);

    expect(parsed.grupo).toBe(`GRUPO ${groupNumber}`);

    expect(parsed.partidas).toEqual([
      {
        grupo: `GRUPO ${groupNumber}`,
        mandante: firstHome,
        golsMandante: 2,
        golsVisitante: 1,
        visitante: firstAway,
        status: PartidaStatusEnum.REALIZADA,
      },
      {
        grupo: `GRUPO ${groupNumber}`,
        mandante: secondHome,
        golsMandante: null,
        golsVisitante: null,
        visitante: secondAway,
        status: PartidaStatusEnum.AGENDADA,
      },
      {
        grupo: `GRUPO ${groupNumber}`,
        mandante: thirdHome,
        golsMandante: 0,
        golsVisitante: 0,
        visitante: thirdAway,
        status: PartidaStatusEnum.NAO_AGENDADA,
      },
      {
        grupo: `GRUPO ${groupNumber}`,
        mandante: fourthHome,
        golsMandante: null,
        golsVisitante: null,
        visitante: fourthAway,
        status: PartidaStatusEnum.CANCELADA,
      },
    ]);
  });

  it('deve lancar erro quando nao encontra cabecalho', () => {
    const csv = [faker.lorem.words(4), faker.lorem.words(5)].join('\n');

    expect(() => parser.parse(csv)).toThrow(
      'Cabecalho da tabela de partidas nao encontrado na planilha',
    );
  });

  it('deve lancar erro quando nao encontra nenhuma partida valida', () => {
    const csv = [
      `⚽  JOGOS — GRUPO ${faker.number.int({ min: 1, max: 9 })},,,,,`,
      ',,,,,',
      'Mandante,Gols,Gols,Visitante,Resultado,Data',
      `${faker.person.fullName()},,,,,,`,
    ].join('\n');

    expect(() => parser.parse(csv)).toThrow(
      'Nenhuma linha de partida valida foi encontrada',
    );
  });
});
