function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let currentCell = '';
  let insideQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const currentChar = line[index];
    const nextChar = line[index + 1];

    if (currentChar === '"' && nextChar === '"' && insideQuotes) {
      currentCell += '"';
      index += 1;
      continue;
    }

    if (currentChar === '"') {
      insideQuotes = !insideQuotes;
      continue;
    }

    if (currentChar === ',' && !insideQuotes) {
      cells.push(currentCell);
      currentCell = '';
      continue;
    }

    currentCell += currentChar;
  }

  cells.push(currentCell);
  return cells;
}

export function parseCsvRows(csvText: string): string[][] {
  return csvText
    .split(/\r?\n/)
    .map((line) => parseCsvLine(line))
    .filter((row) => row.some((cell) => normalizeCell(cell) !== ''));
}

export function normalizeCell(value?: string): string {
  return (value ?? '').trim().toLowerCase();
}

export function parseInteger(value: string | undefined, field: string): number {
  const normalized = (value ?? '').trim();

  if (normalized === '') {
    return 0;
  }

  if (!/^-?\d+$/.test(normalized)) {
    throw new Error(`Valor invalido para ${field}: ${value}`);
  }

  return Number.parseInt(normalized, 10);
}
