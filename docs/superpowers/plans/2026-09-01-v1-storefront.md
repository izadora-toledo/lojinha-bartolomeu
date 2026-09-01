# Lojinha do Bartolomeu V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar uma V1 visualmente alinhada ao conceito Divertido Pop azul neon pastel, com carrinho próprio, frete SuperFrete correto para múltiplas canecas e checkout InfinitePay validado no servidor.

**Architecture:** Manter Express 5 + frontend estático sem framework. Preços permanecem no catálogo do servidor; o frontend envia apenas ids/quantidades. A camada de integração expõe builders puros testáveis para SuperFrete e InfinitePay e executa as chamadas HTTP somente depois da validação local.

**Tech Stack:** Node.js 20+, Express 5, JavaScript ES Modules, `node:test`, HTML/CSS/JS estáticos, SuperFrete API v0, InfinitePay Checkout Integrado.

**Spec:** `docs/superpowers/specs/2026-09-01-v1-storefront-design.md`

## Global Constraints

- Peso-base provisório: `0.6 kg` por unidade de caneca.
- Dimensões-base provisórias: `15 x 15 x 15 cm` por unidade, via `.env`.
- Serviços iniciais: PAC `1` e SEDEX `2`.
- Seguro/valor declarado sempre obrigatório e invisível como opção separada para o cliente.
- Preços e frete são sempre recalculados no backend.
- Paleta principal: preto, off-white, `#8BDCFF` e `#58CAFF`.
- Sem avaliações, números de clientes ou alegações comerciais fictícias.
- Nenhum token/segredo no frontend ou no Git.

---

### Task 1: Add executable rule tests

**Files:**
- Create: `tests/catalog.test.js`
- Create: `tests/integrations.test.js`
- Create: `tests/storefront.test.js`
- Modify: `package.json`

**Interfaces:**
- Consumes: `priceCart(cart)` from `server/catalog.js`.
- Produces: regression coverage and `npm test` script used by every later task.

- [ ] **Step 1: Write failing integration tests**

Create tests that import `buildSuperFretePayload` and `buildInfinitePayPayload`, which do not exist yet. Assert that two canecas produce `products[0].quantity === 2`, per-unit weight is `0.6`, insurance equals subtotal, services are `1,2`, and InfinitePay includes freight as a separate cent-value item.

- [ ] **Step 2: Run RED**

Run: `node --test tests/*.test.js`
Expected: FAIL because the new payload builder exports do not exist and storefront design tokens are not yet present.

- [ ] **Step 3: Add package test script**

Set `"test": "node --test tests/*.test.js"` while keeping existing `dev` and `start` scripts.

- [ ] **Step 4: Run RED again through package script**

Run: `npm test`
Expected: same intentional failures.

- [ ] **Step 5: Commit tests/setup**

Commit message: `test: cover storefront checkout rules`

### Task 2: Make shipping/payment payloads pure and correct

**Files:**
- Modify: `server/integrations.js`
- Modify: `server/index.js`

**Interfaces:**
- Produces: `buildSuperFretePayload({ destinationPostalCode, insuranceValueReais, items, services })` and `buildInfinitePayPayload({ order, items, shippingCents, customer, address })`.
- `quoteSuperFrete(...)` consumes the SuperFrete builder.
- `createInfinitePayCheckout(...)` consumes the InfinitePay builder.

- [ ] **Step 1: Implement `buildSuperFretePayload` minimally**

Return `from`, `to`, `services`, mandatory insurance options, and `products[]` built from priced cart items. Each product uses configured per-unit weight/dimensions and the cart quantity.

- [ ] **Step 2: Update shipping calls**

Pass `priced.items` to `quoteSuperFrete` in both `/api/shipping` and `/api/checkout` so quantity affects the quote.

- [ ] **Step 3: Implement `buildInfinitePayPayload` minimally**

Validate `INFINITEPAY_HANDLE` and a public/base URL, then return items in cents plus freight as a separate item, customer, address, redirect and webhook URLs.

- [ ] **Step 4: Run GREEN**

Run: `npm test`
Expected: payload/catalog tests PASS; storefront test may remain RED until Task 3.

- [ ] **Step 5: Commit integration changes**

Commit message: `fix: price shipping by cart quantity`

### Task 3: Align home and cart with approved visual

**Files:**
- Modify: `public/index.html`
- Modify: `public/style.css`
- Modify: `public/app.js`

**Interfaces:**
- Consumes `/api/catalog`, `/api/shipping`, `/api/checkout` unchanged at the HTTP level.
- Produces the same cart item `{id, quantity}` shape expected by the backend.

- [ ] **Step 1: Add explicit design tokens and rounded display font stack**

Define variables for `--neon-blue:#8bdcff`, `--neon-blue-strong:#58caff`, off-white, black, body font and display font. Use rounded display stack for logo/headlines/buttons.

- [ ] **Step 2: Refine approved Divertido Pop layout**

Keep the existing sections, but strengthen the black/white/blue visual hierarchy, playful doodles, rounded cards, hero blob, benefit strip, collection tiles and cart drawer. Keep only factual copy.

- [ ] **Step 3: Improve cart states**

Disable checkout when cart/freight are incomplete, reset stale shipping when quantities or CEP change, show progress/error copy, and keep selected shipping visually accessible.

- [ ] **Step 4: Run storefront regression test and full tests**

Run: `npm test`
Expected: all tests PASS.

- [ ] **Step 5: Commit frontend polish**

Commit message: `feat: polish neon blue storefront`

### Task 4: Documentation and release verification

**Files:**
- Modify: `README.md`
- Modify: `FUNCIONALIDADES_E_TERCEIROS.md`
- Modify: `.env.example`

**Interfaces:** none.

- [ ] **Step 1: Document per-unit shipping behavior**

State clearly that 600 g and dimensions are provisional per caneca, multiple quantities use `products[]`, and real measurements are mandatory before launch.

- [ ] **Step 2: Document required production variables**

Keep sandbox defaults; document production token, InfiniteTag, `PUBLIC_BASE_URL`, origin CEP and package dimensions.

- [ ] **Step 3: Run syntax and test verification**

Run: `node --check server/index.js && node --check server/integrations.js && node --check public/app.js && npm test`
Expected: all checks PASS, no failures.

- [ ] **Step 4: Commit docs**

Commit message: `docs: update V1 setup and shipping notes`

- [ ] **Step 5: Open PR and merge after verification**

Create a PR from the isolated branch to `main`, inspect the diff, verify CI/status if present, then merge with squash or merge commit according to repository support.
