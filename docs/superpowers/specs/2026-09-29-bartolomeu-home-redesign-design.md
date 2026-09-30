# Redesign da home — Lojinha do Bartolomeu

## Objetivo

Transformar a página inicial existente em uma vitrine de canecas prontas do Bartolomeu, com aparência de e-commerce acolhedor e profissional para amantes de gatos. A referência visual define a composição, hierarquia, arredondamentos e linguagem gráfica; ela não será usada como uma imagem de fundo.

## Restrições e preservação

- Manter Express, a rota `GET /api/catalog`, o carrinho em `localStorage`, cotação de frete e checkout existentes.
- Não criar projeto, rotas, dependências ou integração de pagamento novos.
- Não introduzir linguagem de personalização, upload, quiz ou criação de arte pelo cliente.
- Usar somente azul pastel `#CFEAF6`, pêssego `#FFA97D`, creme `#FFF7EA`, marrom `#3B180F` e branco como cores principais.
- Carregar Coiny para títulos e Nunito Sans para texto, controles e valores.
- Usar fotos locais já presentes do Bartolomeu provisoriamente em hero e banner. As artes de canecas permanecem como placeholders locais/CSS até que assets definitivos sejam fornecidos.

## Arquitetura de interface

A home continuará como uma página estática servida de `public/`, dividida semanticamente em:

1. Header com logo, links âncora, busca visual, conta visual, carrinho e menu móvel.
2. Hero de duas colunas no desktop, com mensagem de marca, CTA e imagem local do Bartolomeu.
3. Faixa de quatro benefícios.
4. Bloco “Como funciona?” com quatro passos do fluxo real: escolher, adicionar, informar endereço e receber.
5. Vitrine de produtos carregada da API existente.
6. Banner editorial intermediário com foto local temporária.
7. Depoimentos temporários em cards.
8. Faixa final de benefícios e footer com apenas âncoras funcionais ou conteúdo textual.

O HTML preservará o drawer do carrinho e todos os IDs consumidos por `app.js`, para que cotação e checkout não sejam afetados.

## Dados e comportamento

`app.js` continuará requisitando `GET /api/catalog` e calculando preço, quantidade e subtotal com os dados retornados. A renderização dos cards será atualizada para o novo visual, mas cada botão continuará acrescentando o mesmo `id` de produto ao carrinho e abrindo o drawer.

Benefícios, passos e depoimentos temporários serão definidos como estruturas de dados únicas no JavaScript e renderizados no markup; não haverá duplicação espalhada entre seções. O catálogo de servidor não será alterado nesta etapa, já que é a fonte de verdade de preço e de itens aceitos no checkout.

## Responsividade e acessibilidade

- Desktop: hero em duas colunas, passos em linha e vitrine com até quatro cards.
- Tablet: redução progressiva de grid e espaçamentos.
- Mobile: menu compacto, hero empilhada, CTA de largura ampla, passos verticais e vitrine em duas colunas sem overflow horizontal.
- Usar `header`, `main`, `section`, `article`, títulos em ordem lógica, imagens com `alt`, botões nativos, foco visível e rótulos/`aria-label` nos controles icônicos.
- Imagens abaixo da dobra terão `loading="lazy"`; nenhuma imagem externa será carregada.

## Estilo e interações

Cards e caixas terão raios entre 16 e 24 px, contornos pêssego sutis e sombras leves. Títulos principais usarão Coiny; texto predominante será marrom. Elementos felinos serão discretos, como patinhas, corações e pequenos rabiscos. Botões, cards e links terão transições curtas (150–250 ms), evitando gradientes fortes, glassmorphism e movimentos excessivos.

## Arquivos previstos

- `public/index.html`: nova estrutura e conteúdo editável da home.
- `public/style.css`: sistema visual, layout e breakpoints.
- `public/app.js`: dados temporários da home e renderização atualizada de cards, preservando checkout.

## Verificação

Após implementar, verificar a navegação por teclado, a ausência de overflow horizontal e as larguras de 375 px, 430 px, 768 px, 1024 px e 1440 px. Executar os scripts disponíveis do projeto; hoje o `package.json` só contém `dev` e `start`, portanto lint e testes não estão configurados. Também iniciar o servidor e validar a home e o fluxo de adicionar item ao carrinho.
