import {
  normalizeCell,
  parseCsvRows,
  parseInteger,
} from './google-sheet-csv-utils';
import type { Faker } from '@faker-js/faker';

describe('google-sheet-csv-utils', () => {
  let faker: Faker;

  beforeAll(async () => {
    ({ faker } = await import('@faker-js/faker'));
  });

  beforeEach(() => {
    faker.seed(1234);
  });

  it('deve fazer parse de linha CSV com aspas escapadas', () => {
    const prefix = faker.word.sample({ length: { min: 5, max: 10 } });
    const escapedName = faker.person.fullName();
    const suffix = faker.word.sample({ length: { min: 5, max: 10 } });
    const points = faker.number.int({ min: 1, max: 999 }).toString();

    const csv = `${prefix},${suffix}\n"${escapedName} ""${suffix}""",${points}`;

    const rows = parseCsvRows(csv);

    expect(rows).toEqual([
      [prefix, suffix],
      [`${escapedName} "${suffix}"`, points],
    ]);
  });

  it('deve remover linhas totalmente vazias', () => {
    const header = `${faker.word.sample()},${faker.word.sample()}`;
    const valueA = faker.word.sample();
    const valueB = faker.word.sample();

    const csv = [header, ',,', '  ,  ', `${valueA},${valueB}`, '', '   '].join(
      '\n',
    );

    const rows = parseCsvRows(csv);

    expect(rows).toEqual([
      header.split(','),
      [valueA, valueB],
    ]);
  });

  it('deve normalizar celula', () => {
    const word = faker.word.sample({ length: { min: 5, max: 10 } });
    const raw = `  ${word.toUpperCase()}  `;

    expect(normalizeCell(raw)).toBe(word.toLowerCase());
    expect(normalizeCell(undefined)).toBe('');
  });

  it('deve fazer parse inteiro com fallback 0 e erro para texto invalido', () => {
    const numeric = faker.number.int({ min: 1, max: 9999 }).toString();
    const field = faker.word.sample();
    const invalid = faker.word.words(2).replace(/\s+/g, '-');

    expect(parseInteger(undefined, field)).toBe(0);
    expect(parseInteger('   ', field)).toBe(0);
    expect(parseInteger(numeric, field)).toBe(Number.parseInt(numeric, 10));

    expect(() => parseInteger(invalid, field)).toThrow(`Valor invalido para ${field}: ${invalid}`);
  });
});
