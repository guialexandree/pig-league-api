# GET /classificacao (Google Sheets) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Expor a rota `GET /classificacao` na API para retornar a classificação da planilha Google informada.

**Architecture:** Implementar um módulo dedicado de classificação no NestJS, com controller para o endpoint HTTP e service para buscar/transformar dados da planilha pública. A leitura será feita via endpoint de export CSV do Google Sheets (sem credenciais), com parsing e validações de formato para retornar JSON estável.

**Tech Stack:** NestJS 11, TypeScript, Jest, Supertest, `fetch` nativo do Node.js.

---

### Task 1: Definir contrato de resposta e teste e2e da rota

**Files:**
- Modify: `test/app.e2e-spec.ts`
- Create: `src/classificacao/dto/classificacao-response.dto.ts`

**Step 1: Escrever teste e2e falhando para `GET /classificacao`**

Adicionar caso em `test/app.e2e-spec.ts` validando:
- status `200`
- resposta JSON com `grupo`, `atualizadoEm`, `classificacao` (array)
- cada item com campos `posicao`, `jogador`, `j`, `v`, `e`, `d`, `gp`, `gc`, `sg`, `pts`

**Step 2: Rodar e2e para confirmar falha**

Run: `npm run test:e2e -- --runInBand`
Expected: FAIL com `Cannot GET /classificacao`.

**Step 3: Criar DTO mínimo de resposta**

Criar `src/classificacao/dto/classificacao-response.dto.ts` com interfaces/types do payload.

**Step 4: Rodar e2e novamente (ainda falhando)**

Run: `npm run test:e2e -- --runInBand`
Expected: FAIL ainda por rota inexistente.

**Step 5: Commit**

```bash
git add test/app.e2e-spec.ts src/classificacao/dto/classificacao-response.dto.ts
git commit -m "test: define contrato do endpoint de classificacao"
```

### Task 2: Implementar service de leitura da planilha

**Files:**
- Create: `src/classificacao/classificacao.service.ts`
- Create: `src/classificacao/classificacao.service.spec.ts`

**Step 1: Escrever teste unitário falhando do service**

Em `classificacao.service.spec.ts`, criar testes para:
- montar URL CSV a partir do spreadsheetId/gid
- transformar linhas CSV em objetos tipados
- ignorar linhas vazias/rodapé (ex: linha de observação)
- lançar erro quando formato esperado não existir

**Step 2: Rodar teste unitário para confirmar falha**

Run: `npm run test -- classificacao.service.spec.ts --runInBand`
Expected: FAIL por service inexistente.

**Step 3: Implementar service mínimo**

Em `classificacao.service.ts`:
- constantes para `SPREADSHEET_ID = 1ev1M_7z-I_NpC2pBsamqx1dbIeNTSBPJIWE4ow6kUQc` e `GID = 230309619`
- função para montar URL de export CSV
- `fetch` do CSV
- parser simples por linha/coluna
- mapeamento de colunas para DTO
- retorno do objeto final `{ grupo, atualizadoEm, classificacao }`

**Step 4: Rodar unit test e ajustar parser até passar**

Run: `npm run test -- classificacao.service.spec.ts --runInBand`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/classificacao/classificacao.service.ts src/classificacao/classificacao.service.spec.ts
git commit -m "feat: add service de leitura da classificacao via google sheets"
```

### Task 3: Expor endpoint GET /classificacao

**Files:**
- Create: `src/classificacao/classificacao.controller.ts`
- Create: `src/classificacao/classificacao.module.ts`
- Modify: `src/app.module.ts`

**Step 1: Escrever teste de controller falhando**

Criar teste no `classificacao.controller.spec.ts` (ou adaptar e2e existente) esperando retorno do service ao chamar `GET /classificacao`.

**Step 2: Rodar testes para confirmar falha**

Run: `npm run test -- classificacao.controller.spec.ts --runInBand`
Expected: FAIL por controller inexistente.

**Step 3: Implementar módulo + controller**

- `@Controller('classificacao')` com `@Get()`
- injetar `ClassificacaoService`
- retornar payload do service
- registrar `ClassificacaoModule` no `AppModule`

**Step 4: Rodar testes unit + e2e**

Run: `npm run test -- --runInBand`
Expected: PASS.

Run: `npm run test:e2e -- --runInBand`
Expected: PASS com `GET /classificacao` respondendo 200.

**Step 5: Commit**

```bash
git add src/classificacao/classificacao.controller.ts src/classificacao/classificacao.module.ts src/app.module.ts
# incluir spec de controller se criado
# git add src/classificacao/classificacao.controller.spec.ts
git commit -m "feat: expose GET /classificacao endpoint"
```

### Task 4: Robustez, erros e documentação

**Files:**
- Modify: `src/classificacao/classificacao.service.ts`
- Modify: `README.md`

**Step 1: Escrever teste falhando de erro externo**

Adicionar casos para:
- falha de rede (`fetch` reject)
- status HTTP não-200
- CSV inválido

**Step 2: Rodar testes para confirmar falha**

Run: `npm run test -- classificacao.service.spec.ts --runInBand`
Expected: FAIL nos cenários de erro.

**Step 3: Implementar tratamento de erro**

- converter erros para `ServiceUnavailableException`
- mensagens explícitas para troubleshooting
- garantir que campos numéricos sejam normalizados para `number`

**Step 4: Documentar endpoint no README**

Adicionar seção curta com:
- rota `GET /classificacao`
- exemplo de resposta
- origem dos dados (Google Sheets)

**Step 5: Rodar validação final + commit**

Run: `npm run lint`
Expected: PASS.

Run: `npm run test -- --runInBand && npm run test:e2e -- --runInBand`
Expected: PASS.

```bash
git add src/classificacao/classificacao.service.ts README.md src/classificacao/classificacao.service.spec.ts
git commit -m "chore: harden classificacao integration and document endpoint"
```

