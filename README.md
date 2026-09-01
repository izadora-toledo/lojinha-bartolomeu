# 🐾 Lojinha do Bartolomeu

E-commerce próprio de canecas produzidas sob demanda.

## Rodar localmente
```bash
npm install
cp .env.example .env
# preencha as variáveis
npm run dev
```
Abra `http://localhost:3000`.

## Integrações
- **SuperFrete:** PAC/SEDEX, seguro/valor declarado automático.
- **InfinitePay:** Pix/cartão via checkout externo e confirmação por webhook.

Leia **[FUNCIONALIDADES_E_TERCEIROS.md](./FUNCIONALIDADES_E_TERCEIROS.md)** antes de configurar produção.

## Variáveis sensíveis
Nunca versione `.env`. O repositório contém somente `.env.example`.

## Estado atual
O código já possui os endpoints de cotação, checkout e confirmação de pagamento. Para funcionar com serviços reais, é necessário preencher `.env` com CEP/token/handle e usar uma URL HTTPS pública para os webhooks.
