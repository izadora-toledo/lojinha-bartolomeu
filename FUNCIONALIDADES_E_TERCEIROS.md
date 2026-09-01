# Funcionalidades e terceiros — Lojinha do Bartolomeu

Documento operacional da versão 1.0. Este arquivo deve ser atualizado sempre que uma integração, fluxo de dados ou funcionalidade for alterada.

## 1. Funcionalidades do site

### Catálogo
- Exibe os modelos de caneca cadastrados em `server/catalog.js`.
- O preço oficial fica no servidor. O navegador não define nem altera o preço cobrado.
- As imagens atuais são referências/fotos do Bartolomeu fornecidas para o projeto.

### Carrinho
- Adicionar/remover produtos e alterar quantidade.
- Carrinho persistido no navegador via `localStorage`.
- Subtotal recalculado a partir do catálogo recebido do servidor.

### Dados de entrega
- Coleta nome, e-mail, telefone e endereço do comprador.
- CEP é usado na cotação de frete.
- Nesta versão não há serviço de preenchimento automático de endereço.

### Frete
- O frontend chama `POST /api/shipping`.
- O backend recalcula o valor dos produtos e chama a SuperFrete; o token nunca fica no navegador.
- Peso inicial do pacote: **600 g**, configurável em `.env`.
- Dimensões iniciais são configuráveis em `.env` e DEVEM ser substituídas pelas dimensões reais da embalagem antes do lançamento.
- Serviços solicitados inicialmente: PAC e SEDEX.
- `insurance_value` é sempre igual ao subtotal das mercadorias.
- `use_insurance_value` é sempre `true`.
- O seguro/valor declarado não aparece como opcional para o cliente; ele já participa do preço final retornado pela transportadora.
- O prazo exibido soma prazo da transportadora + faixa de produção configurada no servidor.

### Checkout/pagamento
- O backend recebe o carrinho e **recalcula tudo** antes de cobrar.
- O frete escolhido é cotado novamente no servidor para reduzir risco de manipulação de preço.
- Um identificador de pedido `BARTO-...` é criado.
- O checkout é criado na InfinitePay e o comprador é redirecionado para a página de pagamento deles.
- Dados de cartão NÃO passam pelo servidor da Lojinha.
- O frete é enviado à InfinitePay como um item separado no checkout.

### Confirmação de pagamento
- `redirect_url`: o comprador volta para `/obrigado.html`.
- `webhook_url`: InfinitePay chama `/api/webhooks/infinitepay` quando o pagamento é aprovado.
- O webhook não é aceito cegamente: o servidor usa `payment_check` para confirmar o pagamento e compara o valor recebido com o total armazenado no pedido.
- O pedido só passa para `paid` depois dessa validação.

### Pedidos
- Nesta versão, pedidos são persistidos em `data/orders.json` para desenvolvimento e servidores com disco persistente.
- **Para produção em ambiente serverless**, substituir por banco persistente (ex.: PostgreSQL/Supabase/Neon) antes de receber pedidos reais.
- `data/orders.json` está no `.gitignore` e nunca deve ser versionado.

### Página de confirmação
- `/obrigado.html` consulta o status do pedido depois do retorno da InfinitePay.
- Mostra confirmação quando o pagamento tiver sido validado.

## 2. Terceiros envolvidos

### SuperFrete
**Finalidade:** cotação de frete e, em etapa posterior, compra/geração das etiquetas.

**Dados enviados na cotação:**
- CEP de origem;
- CEP de destino;
- peso e dimensões do pacote;
- valor declarado da mercadoria;
- serviços desejados (PAC/SEDEX).

**Segredos:** `SUPERFRETE_TOKEN` fica somente no servidor e em variáveis de ambiente.

**Ambientes:** Sandbox e Produção. URLs definidas em `server/integrations.js`.

**Custo da integração:** documentação informa API sem mensalidade; a cobrança operacional ocorre nos fretes/etiquetas contratados.

**Documentação oficial:** https://superfrete.readme.io/reference/primeiros-passos e https://superfrete.readme.io/reference/cotacao-de-frete

### InfinitePay
**Finalidade:** processar Pix e cartão e hospedar o formulário seguro de pagamento.

**Dados enviados:**
- identificador do pedido (`order_nsu`);
- itens, quantidades e preços;
- custo do frete;
- nome/e-mail/telefone do comprador;
- endereço de entrega;
- URLs de retorno e webhook.

**Dados de cartão:** preenchidos diretamente no checkout da InfinitePay; não são coletados pela aplicação.

**Identificação:** `INFINITEPAY_HANDLE` (InfiniteTag sem `$`) fica em variável de ambiente.

**Confirmação:** webhook + endpoint `payment_check`.

**Documentação oficial:** https://www.infinitepay.io/checkout-documentacao

### Correios
**Finalidade:** transporte físico quando o cliente escolhe PAC ou SEDEX disponibilizado via SuperFrete.

**Relação:** a integração técnica do site é com a SuperFrete; a postagem física é feita posteriormente em ponto/agência elegível conforme a etiqueta emitida.

### Provedor de hospedagem (a definir)
O projeto é Node.js e pode rodar em um serviço compatível com Node 20+.

Antes do lançamento, confirmar:
- suporte a HTTPS;
- variáveis de ambiente;
- URL pública estável para webhook;
- persistência de pedidos ou banco externo;
- logs e reinício automático.

### GitHub
**Finalidade:** repositório público do código-fonte.
- `.env` não é versionado.
- tokens e credenciais nunca devem entrar em commits.
- fotos usadas pelo projeto estarão públicas se forem commitadas em um repositório público.

## 3. Dados pessoais tratados
O checkout próprio coleta dados necessários para entrega e comunicação: nome, e-mail, telefone e endereço. Devem existir Política de Privacidade e controles de retenção/acesso antes do lançamento comercial.

## 4. Pendências obrigatórias antes de produção
1. Definir CEP real de postagem.
2. Medir caixa real e substituir altura/largura/comprimento do `.env`.
3. Criar token de Produção da SuperFrete.
4. Habilitar Checkout Integrado na InfinitePay e informar a InfiniteTag.
5. Definir domínio/URL HTTPS final e preencher `PUBLIC_BASE_URL`.
6. Trocar armazenamento JSON por banco persistente caso a hospedagem não ofereça disco persistente.
7. Criar Política de Privacidade, Trocas/Devoluções, prazo de produção e informações comerciais obrigatórias.
8. Testar compra completa em ambiente seguro antes de divulgar.
9. Depois do primeiro lote embalado, conferir se 600 g continua representando o peso real final.
10. Integrar compra/geração de etiqueta da SuperFrete após validar o fluxo de pedidos.

## 5. Segurança
- Nunca expor `SUPERFRETE_TOKEN` no frontend.
- Nunca aceitar preço de produto enviado pelo navegador.
- Sempre recalcular frete no backend no momento do checkout.
- Sempre confirmar pagamento antes de iniciar produção.
- Não armazenar dados de cartão.
- Manter `.env` fora do Git.
