# Conta simples e acompanhamento de pedidos — Lojinha do Bartolomeu

## Objetivo

Criar uma conta simples por e-mail e senha para que clientes acompanhem seus pedidos sem depender de CPF ou de códigos temporários a cada acesso. A compra continua possível a partir do carrinho e a conta é criada no próprio fluxo de checkout.

## Decisões de experiência

- Não há username, login por CPF nem conta obrigatória antes de ver o carrinho.
- Ao abrir o carrinho, o cliente vê uma área inicial “Crie sua conta para acompanhar seus pedidos”, com e-mail e senha.
- A senha fica visível por padrão; o controle “Ocultar senha” começa desmarcado para facilitar a digitação por pessoas menos familiarizadas com tecnologia.
- O cliente completa dados de contato e endereço no mesmo drawer e finaliza a compra normalmente.
- Em acessos futuros, e-mail e senha permitem entrar e acessar “Meus pedidos”.
- CPF continua dado fiscal e de entrega; não é autenticador e não aparece como identificador público de pedidos.
- Um fluxo de recuperação de senha por e-mail será incluído; nenhuma senha é enviada ou armazenada em texto puro.

## Persistência

O projeto continuará usando o armazenamento JSON local já existente, com estruturas equivalentes a tabelas:

- `customers.json`: `id`, `email`, `passwordHash`, `name`, `cpf`, `phone`, timestamps.
- `orders.json`: cada pedido passa a ter `customerId` e um número público amigável, sem remover os campos atuais necessários ao checkout.
- `sessions.json`: hash de token de sessão, cliente associado, expiração e timestamps.
- `password-reset-tokens.json`: hash de token de redefinição, cliente associado, expiração e uso único.

E-mail é normalizado (minúsculas e sem espaços nas extremidades), CPF é salvo somente com dígitos, e telefone é normalizado para o padrão brasileiro/E.164 quando informado.

## Autenticação e sessão

- Senhas usam hash resistente a força bruta, nunca texto puro.
- Login e criação de conta aplicam validação, mensagens genéricas quando apropriado e limite de tentativas por IP/e-mail.
- O servidor emite um token aleatório em cookie `HttpOnly`, `SameSite=Lax`, `Path=/`; `Secure` é habilitado em produção.
- A sessão “manter conectado” expira em 30 dias e não usa `localStorage` para segredos.
- A troca de senha invalida as sessões existentes do cliente.

## API e páginas

- `POST /api/auth/register`: cria ou associa conta antes do checkout.
- `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`.
- `POST /api/auth/password-reset/request` e `POST /api/auth/password-reset/confirm`; o envio de e-mail usa adapter configurável, sem credenciais fictícias.
- `GET /api/orders/me`: retorna somente pedidos associados à sessão autenticada.
- `public/meus-pedidos.html`: lista pedidos autenticados, com estados amigáveis e links para a home.
- O drawer existente exibe cadastro/login de maneira progressiva e envia `customerId` somente a partir da sessão do servidor.

## Segurança e limites

- Nunca retornar pedidos por CPF ou e-mail em query string.
- Nunca registrar senha, CPF completo, tokens ou e-mail completo em logs de aplicação.
- Aplicar limite de login/cadastro e recuperação por IP e identidade normalizada.
- Usar comparação em tempo constante para segredos e tokens.
- Validar e escapar toda entrada usada na interface.

## Migração e compatibilidade

Pedidos já gravados sem `customerId` continuam legíveis. Novos pedidos requerem uma sessão de cliente válida; o carrinho existente, cotação, checkout externo e webhooks são preservados. Nenhum fornecedor de e-mail será assumido: o adapter deve falhar de modo seguro em produção quando não estiver configurado e deve documentar as variáveis de ambiente necessárias.

## Verificação

Cobrir teste de registro, login válido/inválido, hash de senha, persistência de sessão, logout, expiração, isolamento de pedidos por cliente, recuperação com token expirado/usado, normalização de CPF/telefone e compatibilidade de pedido existente. Verificar manualmente o cadastro no drawer, senha visível por padrão, toggle “Ocultar senha”, retorno persistente e lista de pedidos.
