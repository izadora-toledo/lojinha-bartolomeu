# Conta, sessão e Meus pedidos — plano de implementação

> **For implementation:** execute cada tarefa na ordem, com testes automatizados antes do código de produção correspondente.

**Objetivo:** permitir que a cliente crie ou acesse uma conta diretamente no carrinho, finalize pedidos autenticada e acompanhe somente os próprios pedidos em uma página “Meus pedidos”.

**Arquitetura:** o Express continuará servindo a loja estática, mas passará a manter clientes, sessões e tokens de recuperação em arquivos JSON atômicos. A sessão persistente será identificada por cookie HTTP-only; o navegador nunca armazenará senha, CPF nem dados de pedidos de outras pessoas. O checkout exigirá uma sessão válida e associará o `customerId` ao pedido.

**Stack:** Node.js 20+, Express 5, `node:crypto`, armazenamento JSON local, HTML/CSS/JS sem framework e `node:test`.

**Especificação aprovada:** `docs/superpowers/specs/2026-09-29-conta-e-pedidos-design.md`

## Restrições globais

- Login é somente por e-mail e senha. CPF será coletado exclusivamente como dado fiscal do pedido, jamais como credencial.
- A senha inicia visível (`type="text"`); a opção **Ocultar senha** inicia desmarcada e a transforma em campo protegido.
- Nunca persistir senha em texto puro, nunca registrar senha, token, CPF ou endereço em logs e nunca devolver hash/token nas APIs.
- Cookies terão `HttpOnly`, `SameSite=Lax`, duração de 30 dias e `Secure` em produção.
- Toda rota que exponha pedidos de uma cliente exigirá sessão e filtrará no servidor por `customerId`; parâmetros de URL não serão autoridade de acesso.
- Manter pedidos antigos legíveis. Somente pedidos novos passam a ter `customerId`, CPF normalizado e número público amigável.
- Persistência JSON deve escrever em arquivo temporário e renomear de forma atômica, como o armazenamento atual de pedidos.

## Pontos de revisão

- Confirmar que um cookie copiado/inválido não resulta em dados de pedidos.
- Confirmar que tentativa de login, recuperação e cadastro respondem sem revelar se um e-mail existe quando isso for sensível.
- Confirmar que o carrinho continua utilizável antes da conta, mas checkout só é liberado após autenticação.
- Confirmar que os controles novos permanecem legíveis e grandes no celular, especialmente para o público 50+.

## Task 1 — Criar primitivas de identidade, senha e validação

**Arquivos:**
- Criar: `server/auth-crypto.js`
- Criar: `test/auth-crypto.test.js`

1. Escrever testes para normalização de e-mail, telefone brasileiro e CPF, incluindo CPFs com dígitos verificadores inválidos.
2. Escrever testes que comprovem que `hashPassword` não retorna a senha e que `verifyPassword` aceita somente a senha correta.
3. Implementar `normalizeEmail`, `normalizeBrazilianPhone`, `normalizeCpf` e `isValidCpf`.
4. Implementar hash de senha com `crypto.scrypt`, sal aleatório exclusivo de ao menos 16 bytes, derivação de 64 bytes e comparação com `timingSafeEqual`.
5. Implementar geração de tokens criptograficamente aleatórios de 32 bytes e hash SHA-256 para guardar tokens de sessão/recuperação sem guardar o valor bruto.
6. Rodar `node --test test/auth-crypto.test.js` e manter tudo verde.

Interface esperada:

```js
export async function hashPassword(password) {}
export async function verifyPassword(password, encodedHash) {}
export function normalizeEmail(value) {}
export function normalizeCpf(value) {}
export function isValidCpf(cpf) {}
export function createToken() {}
export function hashToken(token) {}
```

## Task 2 — Persistir clientes, sessões e recuperações

**Arquivos:**
- Criar: `server/customer-store.js`
- Criar: `test/customer-store.test.js`
- Modificar: `server/store.js`

1. Escrever testes com diretório temporário para criar e localizar cliente por e-mail normalizado, recusando duplicidade.
2. Escrever testes para sessão expirada, sessão válida, revogação individual e revogação de todas as sessões de uma cliente.
3. Escrever testes para token de redefinição de uso único e expiração de uma hora.
4. Extrair/reutilizar no armazenamento de pedidos o mecanismo de leitura e escrita JSON atômica, sem alterar o formato atual de `orders.json`.
5. Criar os arquivos `data/customers.json`, `data/sessions.json` e `data/password-reset-tokens.json` sob demanda, sem versionar dados reais.
6. Incluir no cliente os campos mínimos: `id`, `email`, `passwordHash`, `createdAt`, `updatedAt`; dados de checkout poderão atualizar nome, telefone e CPF normalizado no mesmo registro.
7. Armazenar apenas o hash do token de sessão e de recuperação, com `expiresAt`, `customerId` e datas de criação/uso.
8. Rodar `node --test test/customer-store.test.js`.

Interface esperada:

```js
export async function createCustomer({ email, passwordHash }) {}
export async function findCustomerByEmail(email) {}
export async function updateCustomerProfile(customerId, profile) {}
export async function createSession({ customerId, tokenHash, expiresAt }) {}
export async function getSessionByTokenHash(tokenHash) {}
export async function revokeSession(tokenHash) {}
export async function revokeCustomerSessions(customerId) {}
export async function createPasswordResetToken(data) {}
export async function consumePasswordResetToken(tokenHash) {}
```

## Task 3 — Expor autenticação segura e middleware de sessão

**Arquivos:**
- Criar: `server/auth-routes.js`
- Criar: `server/email.js`
- Criar: `test/auth-routes.test.js`
- Modificar: `server/index.js`
- Criar: `.env.example`

1. Escrever testes HTTP para cadastro, login, logout e leitura de sessão, cobrindo cookie emitido, senha incorreta e bloqueio por excesso de tentativas.
2. Adicionar parser mínimo de cookie e middleware que resolve `req.customer` a partir do cookie, removendo/revogando sessão expirada.
3. Criar `POST /api/auth/register`, que valida e-mail/senha, cria a cliente, inicia sessão de 30 dias e responde somente com perfil seguro.
4. Criar `POST /api/auth/login`, `POST /api/auth/logout` e `GET /api/auth/me` com o mesmo formato seguro de perfil.
5. Aplicar rate limit em memória por IP e e-mail normalizado para cadastro/login. As respostas de erro não exporão hashes nem detalhes internos.
6. Criar `POST /api/auth/password-reset/request` e `POST /api/auth/password-reset/confirm`. A primeira resposta será genérica; a segunda consumirá token de uso único, atualizará hash e revogará sessões anteriores.
7. Definir adaptador `sendPasswordReset({ to, resetUrl })` em `server/email.js`. A integração real será configurada apenas por variáveis de ambiente documentadas, sem credenciais fictícias nem endpoint de e-mail hardcoded. Os testes injetarão adaptador falso.
8. Documentar em `.env.example` as chaves de produção: `APP_URL`, `SESSION_COOKIE_NAME`, `EMAIL_PROVIDER_*` e `NODE_ENV`; nunca preencher valores secretos.
9. Rodar `node --test test/auth-routes.test.js`.

Rotas esperadas:

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
POST /api/auth/password-reset/request
POST /api/auth/password-reset/confirm
```

## Task 4 — Vincular checkout e pedidos à conta autenticada

**Arquivos:**
- Modificar: `server/index.js`
- Modificar: `server/store.js`
- Criar: `test/orders-access.test.js`

1. Escrever testes para checkout sem sessão (401), checkout autenticado e rejeição de CPF/telefone inválidos.
2. Exigir `req.customer` em `POST /api/checkout`; o carrinho será calculado no servidor como já ocorre, porém pedido receberá obrigatoriamente `customerId`.
3. Validar e normalizar CPF e telefone no backend antes de persistir; atualizar o perfil de entrega da cliente de modo explícito e limitado.
4. Acrescentar número público amigável sequencial ao pedido novo, preservando o `id` técnico e os pedidos históricos existentes.
5. Criar `GET /api/orders/me`, que retorna apenas pedidos cujo `customerId` é o da sessão, com campos públicos necessários para acompanhamento (número, data, itens, total, status, rastreio quando houver).
6. Ajustar o endpoint de status pós-pagamento para não virar consulta aberta por ID: aceitar sessão proprietária ou validar os parâmetros de retorno do provedor de pagamento já usados na confirmação.
7. Rodar `node --test test/orders-access.test.js` e os testes anteriores juntos.

Interface esperada:

```text
GET /api/orders/me -> { orders: [{ orderNumber, createdAt, status, items, total, trackingCode? }] }
POST /api/checkout -> exige sessão e cria order.customerId
```

## Task 5 — Integrar conta ao carrinho e ao checkout acessível

**Arquivos:**
- Modificar: `public/index.html`
- Modificar: `public/app.js`
- Modificar: `public/style.css`

1. Substituir a área inicial do drawer por um bloco claro “Crie sua conta para acompanhar seus pedidos”, com e-mail, senha visível e a caixa **Ocultar senha** desmarcada.
2. Incluir alternativa “Já tenho uma conta” no mesmo drawer, sem abrir uma página obrigatória nem esconder o carrinho.
3. Exibir mensagens de erro simples, junto ao campo correspondente, e estado de carregamento nos botões para evitar envio duplicado.
4. Após cadastro/login bem-sucedido, exibir o e-mail da conta, botão para sair e liberar a etapa de dados de entrega/pagamento.
5. Acrescentar CPF ao formulário de checkout como dado fiscal, com máscara/ajuda visual, mas tratar sua validação como responsabilidade final do backend.
6. Preencher nome/telefone previamente salvos quando disponíveis, sem inserir dados sensíveis no `localStorage`.
7. Preservar carrinho no `localStorage` apenas como hoje; nenhum token, senha ou CPF será salvo ali.
8. Adicionar atalho visível “Meus pedidos” no cabeçalho, com comportamento bom tanto em desktop quanto em celular.
9. Fazer revisão manual em 360 px, 768 px e desktop, garantindo alvos de toque confortáveis e textos diretos.

## Task 6 — Criar página protegida de pedidos e telas de recuperação

**Arquivos:**
- Criar: `public/meus-pedidos.html`
- Criar: `public/meus-pedidos.js`
- Modificar: `public/style.css`
- Criar: `public/redefinir-senha.html`
- Criar: `public/redefinir-senha.js`

1. Fazer `meus-pedidos.html` verificar `GET /api/auth/me`; quem não estiver autenticada verá convite de login em linguagem acolhedora, sem expor pedido algum.
2. Carregar `GET /api/orders/me` e renderizar cards grandes com número amigável, data, itens, total e situação. Incluir estado vazio explicando que os próximos pedidos aparecerão ali.
3. Garantir que a página não aceite `customerId`, CPF, e-mail ou ID de pedido na URL como forma de consulta.
4. Oferecer “Esqueci minha senha” no login do carrinho, levando ao pedido de redefinição ou apresentando-o de forma acessível no próprio fluxo.
5. Criar página de confirmação de nova senha que lê apenas o token de redefinição, explica erros de expiração/uso de forma humana e redireciona ao login após sucesso.
6. Reaproveitar o visual da loja (DM Sans/Chewy, tons quentes, botões grandes) sem comprometer contraste ou leitura.

## Task 7 — Documentar, testar e verificar o fluxo completo

**Arquivos:**
- Modificar: `README.md`
- Modificar: `FUNCIONALIDADES_E_TERCEIROS.md`
- Modificar: `test/home-data.test.js` somente se a marcação do cabeçalho exigir atualização

1. Documentar como configurar e-mail de recuperação, as variáveis necessárias e o fato de que a recuperação não fica funcional em produção enquanto o provedor não for configurado.
2. Atualizar a documentação de funcionalidades para registrar conta, sessão de 30 dias, vinculação de pedido e dados fiscais.
3. Rodar todos os testes nativos: `node --test`.
4. Rodar verificações de sintaxe para todos os módulos novos/alterados: `node --check server/index.js`, módulos de servidor e scripts públicos relevantes.
5. Rodar `git diff --check` e abrir as páginas principais para revisão visual responsiva.
6. Confirmar manualmente: cadastro, login com senha visível/oculta, logout, carrinho preservado, checkout autenticado, listagem isolada de pedidos, tentativa de acessar pedidos sem sessão e fluxo de redefinição com adaptador de teste.

## Revisão do plano

- Os dados de pagamento continuam no backend e a mudança não altera a integração InfinitePay além de restringir a leitura de status.
- A escolha por `crypto.scrypt` evita adicionar dependência para hash, preservando hash lento com sal e comparação segura no Node atual.
- O provedor de e-mail foi deixado como adaptador configurável porque nenhum serviço/credencial foi escolhido; isso evita inventar credenciais ou simular envio em produção.
- O plano preserva pedidos legados e evita migração destrutiva de `orders.json`.
