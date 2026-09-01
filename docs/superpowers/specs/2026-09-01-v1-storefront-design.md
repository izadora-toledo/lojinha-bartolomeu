# Lojinha do Bartolomeu — V1 Storefront Design

## Objetivo

Evoluir a primeira versão já publicada no repositório para uma V1 simples, confiável e visualmente alinhada ao conceito aprovado da Lojinha do Bartolomeu, mantendo o e-commerce próprio e as integrações externas apenas onde agregam valor.

## Direção visual

- Conceito: **Divertido Pop**.
- Paleta principal: preto, branco/off-white e **azul neon pastel**.
- Azul de destaque base: `#8BDCFf`; azul secundário: `#58CAFF`.
- Tipografia: corpo com `system-ui`; títulos com stack arredondada (`ui-rounded`, `Arial Rounded MT Bold`, fallbacks sans-serif), sem dependência obrigatória de fonte externa.
- Bartolomeu permanece como foco visual usando apenas imagens já existentes no projeto.
- Sem avaliações, contadores ou alegações comerciais fictícias.
- Home: header, hero, benefícios, 3 produtos, coleções, sobre, FAQ e footer.
- Carrinho lateral com resumo, quantidades, dados de entrega, cotação e CTA para pagamento.

## Carrinho e catálogo

- Catálogo e preços oficiais ficam no servidor (`server/catalog.js`).
- O navegador guarda somente `id` e `quantity` em `localStorage`.
- O servidor recalcula subtotal e rejeita item/quantidade inválidos.
- Limite atual: 20 unidades por item.

## Frete

- Integração técnica: SuperFrete API v0.
- Serviços mostrados inicialmente: PAC (`1`) e SEDEX (`2`).
- Peso-base provisório: **0,6 kg por unidade de caneca**.
- Dimensões-base provisórias por unidade: `15 x 15 x 15 cm`, configuráveis por `.env` e obrigatoriamente substituídas após medir a embalagem real.
- Para múltiplas unidades, o backend envia `products[]` com quantidade/peso/dimensões para a SuperFrete; a API calcula a caixa ideal.
- `insurance_value` é sempre o subtotal das mercadorias.
- `use_insurance_value` é sempre `true`.
- O cliente nunca escolhe seguro separadamente; vê somente o preço final do serviço.
- Prazo exibido = prazo da transportadora + faixa configurada de produção sob demanda.
- A cotação é refeita no backend no checkout para impedir manipulação de preço.

## Pagamento

- Integração: InfinitePay Checkout Integrado.
- O servidor cria o link com `order_nsu`, itens, frete, cliente, endereço, `redirect_url` e `webhook_url`.
- O cliente é redirecionado para a InfinitePay para Pix/cartão; dados de cartão não passam pela aplicação.
- A confirmação usa `payment_check`; pedido só vira `paid` após confirmação do `order_nsu` e do valor total.
- Webhook também é validado novamente via `payment_check` antes de alterar o status.

## Persistência

- A V1 de desenvolvimento continua usando `data/orders.json` quando houver disco persistente.
- Antes de receber pedidos reais em ambiente serverless, migrar pedidos para armazenamento persistente externo (por exemplo PostgreSQL/Supabase/Neon).

## Validação e segurança

- Tokens ficam somente em variáveis de ambiente.
- `PUBLIC_BASE_URL`, CEP de origem e credenciais devem ser validados antes de chamadas externas.
- Preços e frete nunca são aceitos do navegador como fonte de verdade.
- Erros de integração devem retornar mensagem útil ao comprador sem expor credenciais.
- O checkout deve exigir carrinho, modalidade de frete, nome, e-mail, telefone e endereço válidos.

## Testes

Usar `node:test` sem adicionar dependências de teste nesta etapa. Cobertura mínima da V1:

1. preço do carrinho é calculado no servidor;
2. payload da SuperFrete usa `products[]`, 0,6 kg por unidade e seguro obrigatório;
3. payload da InfinitePay usa preços em centavos, frete separado e URLs públicas;
4. normalização de PAC/SEDEX ignora serviços com erro/preço inválido;
5. HTML/CSS preservam os elementos essenciais e a paleta azul neon pastel aprovada.

## Fora do escopo desta rodada

- Compra/geração automática da etiqueta da SuperFrete;
- painel administrativo;
- banco de dados de produção;
- cálculo fiscal/NF-e/DC-e;
- domínio definitivo;
- criação das artes finais das canecas.
