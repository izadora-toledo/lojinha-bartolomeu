# 🐾 Lojinha do Bartolomeu

E-commerce próprio de canecas produzidas sob demanda, com carrinho, cotação de frete e checkout externo seguro.

## Rodar localmente

```bash
npm install
cp .env.example .env
# preencha as variáveis
npm run dev
```

Abra `http://localhost:3000`.

## Testes

```bash
npm test
```

A suíte usa `node:test` e cobre regras de preço, payloads de frete/pagamento e elementos essenciais da home.

## Integrações

- **SuperFrete:** PAC/SEDEX, seguro/valor declarado automático e cálculo por quantidade do carrinho.
- **InfinitePay:** Pix/cartão via checkout externo e confirmação por webhook + `payment_check`.

### Regra provisória de frete

Enquanto a embalagem real não for medida, o projeto usa **600 g e 15 × 15 × 15 cm por unidade de caneca**. Em compras com mais de uma unidade, o backend envia `products[]` com quantidade para a SuperFrete calcular a caixa ideal.

O valor declarado é sempre o subtotal dos produtos e não aparece como opção separada para o comprador.

Leia **[FUNCIONALIDADES_E_TERCEIROS.md](./FUNCIONALIDADES_E_TERCEIROS.md)** antes de configurar produção.

## Variáveis sensíveis

Nunca versione `.env`. O repositório contém somente `.env.example`.

## Estado atual

O código já possui os endpoints de catálogo, cotação, checkout e confirmação de pagamento. Para funcionar com serviços reais, é necessário preencher `.env` com CEP/token/handle e usar uma URL pública estável em `PUBLIC_BASE_URL`.

Antes de receber pedidos reais, ainda é necessário validar medidas/peso da embalagem, configurar persistência adequada para pedidos e concluir políticas comerciais/privacidade.
