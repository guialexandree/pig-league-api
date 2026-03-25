# Classificacao Unificada (Duas Abas) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Criar `use-cases/get-classificacao` em `src/api/campeonato/classificacao`, buscar duas abas do mesmo Google Sheets, unificar em uma classificação única e migrar o parse tipado de `classificacao.service.ts` para o use-case com um padrão de parsing reutilizável.

**Architecture:** O `GetClassificacaoUseCase` passa a ser o orquestrador principal: busca os dois CSVs em paralelo via `GoogleSheetService`, converte cada aba com um parser dedicado e unifica em uma tabela geral. O parsing deixa de ficar no `ClassificacaoService` e passa a seguir um padrão (`GoogleSheetCsvParser<T>`) para ser reutilizado nas próximas rotas baseadas em Google Sheets. O `ClassificacaoService` vira fachada fina para não quebrar a assinatura atual da controller.

**Tech Stack:** NestJS 11, TypeScript, Jest, `@faker-js/faker`, `fetch` nativo.

---

### Task 1: Criar padrão de parse para rotas baseadas em Google Sheets

**Files:**
- Create: `src/infra/google-sheet/parsers/google-sheet-csv-parser.interface.ts`
- Create: `src/infra/google-sheet/parsers/google-sheet-csv-utils.ts`
- Create: `src/infra/google-sheet/parsers/google-sheet-csv-utils.spec.ts`

**Step 1: Escrever teste unitário falhando para utilitários CSV**

Criar `google-sheet-csv-utils.spec.ts` cobrindo:
- parsing de linha CSV com aspas escapadas
- remoção de linhas totalmente vazias
- normalização de célula
- parse inteiro com fallback `0` para vazio e erro para texto inválido

Usar `faker` para gerar strings/números de teste (não usar valores truncados fixos).

**Step 2: Rodar teste para validar falha inicial**

Run: `npm run test -- src/infra/google-sheet/parsers/google-sheet-csv-utils.spec.ts --runInBand`
Expected: FAIL por arquivos ainda inexistentes.

**Step 3: Implementar interface + utilitários base**

Criar interface:

```ts
export interface GoogleSheetCsvParser<T> {
  parse(csvText: string): T;
}
```

Criar utilitários:

```ts
export function parseCsvRows(csvText: string): string[][] { /* ... */ }
export function normalizeCell(value?: string): string { /* ... */ }
export function parseInteger(value: string | undefined, field: string): number { /* ... */ }
```

**Step 4: Rodar teste novamente para validar PASS**

Run: `npm run test -- src/infra/google-sheet/parsers/google-sheet-csv-utils.spec.ts --runInBand`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/infra/google-sheet/parsers/google-sheet-csv-parser.interface.ts src/infra/google-sheet/parsers/google-sheet-csv-utils.ts src/infra/google-sheet/parsers/google-sheet-csv-utils.spec.ts
git commit -m "feat: add reusable google sheet csv parser pattern"
```

### Task 2: Implementar parser de classificação no novo use-case

**Files:**
- Create: `src/api/campeonato/classificacao/use-cases/get-classificacao/get-classificacao-csv.parser.ts`
- Create: `src/api/campeonato/classificacao/use-cases/get-classificacao/get-classificacao-csv.parser.spec.ts`

**Step 1: Escrever teste falhando para parser da classificação**

Cobrir cenários:
- encontra cabeçalho `#,Jogador,...`
- extrai linhas válidas para `ClassificacaoItemDto`
- ignora rodapé/linhas de observação
- lança erro quando não encontra cabeçalho
- extrai `grupo` quando existir no texto

Gerar conteúdo dos jogadores com `faker.person.fullName()`.

**Step 2: Rodar o teste para confirmar falha**

Run: `npm run test -- src/api/campeonato/classificacao/use-cases/get-classificacao/get-classificacao-csv.parser.spec.ts --runInBand`
Expected: FAIL por parser inexistente.

**Step 3: Implementar parser tipado**

Implementar classe:

```ts
export class ClassificacaoCsvParser
  implements GoogleSheetCsvParser<{ grupo: string; itens: ClassificacaoItemDto[] }>
{
  parse(csvText: string) { /* parseCsvRows + validações + mapeamento tipado */ }
}
```

Reaproveitar utilitários da Task 1 via alias `@/infra/...`.

**Step 4: Rodar o teste de parser para validar PASS**

Run: `npm run test -- src/api/campeonato/classificacao/use-cases/get-classificacao/get-classificacao-csv.parser.spec.ts --runInBand`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/api/campeonato/classificacao/use-cases/get-classificacao/get-classificacao-csv.parser.ts src/api/campeonato/classificacao/use-cases/get-classificacao/get-classificacao-csv.parser.spec.ts
git commit -m "feat: add classificacao csv parser for get-classificacao use-case"
```

### Task 3: Criar `GetClassificacaoUseCase` com leitura de duas abas e unificação

**Files:**
- Create: `src/api/campeonato/classificacao/use-cases/get-classificacao/get-classificacao.use-case.ts`
- Create: `src/api/campeonato/classificacao/use-cases/get-classificacao/get-classificacao.use-case.spec.ts`

**Step 1: Escrever teste falhando do use-case**

Cobrir:
- consulta os dois GIDs `230309619` e `2118727000`
- usa `Promise.all` (ou comportamento equivalente em paralelo)
- unifica as listas das duas abas
- valida regra de jogador repetido entre abas (deduplica/agrega ou mantém linhas separadas)
- ordena classificação geral por `pts DESC`, `sg DESC`, `gp DESC`, `jogador ASC`
- recalcula `posicao` sequencial após unificação
- propaga erro como `ServiceUnavailableException`

Usar `faker` para jogadores e números.

**Step 2: Rodar teste do use-case para confirmar falha**

Run: `npm run test -- src/api/campeonato/classificacao/use-cases/get-classificacao/get-classificacao.use-case.spec.ts --runInBand`
Expected: FAIL por use-case inexistente.

**Step 3: Implementar `GetClassificacaoUseCase`**

Estrutura mínima:

```ts
export class GetClassificacaoUseCase {
  async execute(): Promise<ClassificacaoResponseDto> {
    // busca dois CSVs, parseia, unifica, ordena e reindexa posicoes
  }
}
```

Regras:
- `SPREADSHEET_ID = '1ev1M_7z-I_NpC2pBsamqx1dbIeNTSBPJIWE4ow6kUQc'`
- `GIDS = ['230309619', '2118727000']`
- `grupo` de saída: valor geral estável (ex.: `'CAMPEONATO'`)
- `atualizadoEm` com `new Date().toISOString()`

**Step 4: Rodar teste do use-case para validar PASS**

Run: `npm run test -- src/api/campeonato/classificacao/use-cases/get-classificacao/get-classificacao.use-case.spec.ts --runInBand`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/api/campeonato/classificacao/use-cases/get-classificacao/get-classificacao.use-case.ts src/api/campeonato/classificacao/use-cases/get-classificacao/get-classificacao.use-case.spec.ts
git commit -m "feat: implement get-classificacao use-case with two sheet tabs"
```

### Task 4: Migrar `ClassificacaoService` para delegar ao use-case

**Files:**
- Modify: `src/api/campeonato/classificacao/classificacao.service.ts`
- Modify: `src/api/campeonato/classificacao/classificacao.service.spec.ts`
- Modify: `src/api/campeonato/classificacao/classificacao.module.ts`

**Step 1: Escrever/ajustar testes falhando de delegação**

No `classificacao.service.spec.ts`, validar que:
- `getClassificacao()` chama `GetClassificacaoUseCase.execute()`
- retorno é repassado sem alterar payload
- exceções do use-case são apenas propagadas (service como fachada fina, sem remapear erro)

Usar `faker` para dados do payload.

**Step 2: Rodar teste do service para confirmar falha**

Run: `npm run test -- src/api/campeonato/classificacao/classificacao.service.spec.ts --runInBand`
Expected: FAIL até service ser refatorado.

**Step 3: Refatorar service e providers**

- remover parse/regex/csv helpers de `classificacao.service.ts`
- injetar `GetClassificacaoUseCase`
- manter método `getClassificacao()` chamando `execute()`
- registrar `GetClassificacaoUseCase` e `ClassificacaoCsvParser` em `classificacao.module.ts`

**Step 4: Rodar teste do service para validar PASS**

Run: `npm run test -- src/api/campeonato/classificacao/classificacao.service.spec.ts --runInBand`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/api/campeonato/classificacao/classificacao.service.ts src/api/campeonato/classificacao/classificacao.service.spec.ts src/api/campeonato/classificacao/classificacao.module.ts
git commit -m "refactor: move classificacao parsing from service to use-case"
```

### Task 5: Validar controller e suíte final

**Files:**
- Modify: `src/api/campeonato/classificacao/classificacao.controller.spec.ts`
- Optional Modify: `src/api/campeonato/classificacao/dto/classificacao-response.dto.ts` (somente se contrato exigir novo campo)
- Optional Modify: `test/app.e2e-spec.ts` (smoke test de `GET /campeonato/classificacao`, se já existir suíte e2e ativa)

**Step 1: Ajustar teste de controller para o fluxo novo**

Garantir que o controller continue delegando ao `ClassificacaoService` sem regressão de contrato.

**Step 2: Rodar teste do controller**

Run: `npm run test -- src/api/campeonato/classificacao/classificacao.controller.spec.ts --runInBand`
Expected: PASS.

**Step 3: Rodar pacote de testes da feature**

Run: `npm run test -- src/api/campeonato/classificacao --runInBand`
Expected: PASS.

**Step 4: Rodar validação global**

Run: `npm run test -- --runInBand`
Expected: PASS.

Run: `npm run lint`
Expected: PASS.

**Step 5: Commit final da feature**

```bash
git add src/api/campeonato/classificacao src/infra/google-sheet/parsers
git commit -m "feat: unify classificacao from two google sheet tabs"
```

## Assumptions to confirm before implementation

1. Critério de desempate da classificação unificada: `pts`, `sg`, `gp`, `jogador` (ordem ascendente no nome).
2. O campo `grupo` da resposta final pode virar valor único estável (`CAMPEONATO`) em vez de grupo por aba.
3. Se um mesmo jogador aparecer em ambas abas, a regra inicial será manter as duas linhas (sem deduplicação), salvo orientação diferente.
4. Se a regra correta for deduplicar por jogador, aplicar agregação de estatísticas (`j`, `v`, `e`, `d`, `gp`, `gc`, `sg`, `pts`) antes da ordenação final.
