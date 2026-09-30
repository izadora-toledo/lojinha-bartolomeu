export const HOME_CONTENT = Object.freeze({
  benefits: [
    { icon: 'fa-heart', title: 'Feito com carinho', text: 'Produção cuidadosa em cada pedido.' },
    { icon: 'fa-paw', title: 'Artes exclusivas', text: 'Um toque do Bartolomeu no seu dia.' },
    { icon: 'fa-shield-halved', title: 'Compra segura', text: 'Dados e pagamento protegidos.' },
    { icon: 'fa-gift', title: 'Presente para gateiros', text: 'Para surpreender quem ama gatos.' }
  ],
  steps: [
    { number: '1', icon: 'fa-mug-hot', title: 'Escolha sua caneca', text: 'Veja as artes disponíveis e escolha a sua favorita.' },
    { number: '2', icon: 'fa-cart-shopping', title: 'Adicione ao carrinho', text: 'Escolha a quantidade e finalize seu pedido.' },
    { number: '3', icon: 'fa-location-dot', title: 'Informe seu endereço', text: 'Calculamos o frete e mostramos o prazo de entrega.' },
    { number: '4', icon: 'fa-box-open', title: 'Receba em casa', text: 'Sua caneca chega embalada com muito carinho e segurança.' }
  ],
  testimonials: [
    { initials: 'MS', name: 'Mariana S.', quote: 'A caneca chegou linda, muito bem embalada e a qualidade é incrível!' },
    { initials: 'RM', name: 'Rafael M.', quote: 'É ainda mais bonita pessoalmente. Chegou rápido e muito bem protegida.' },
    { initials: 'LC', name: 'Lívia C.', quote: 'Comprei de presente e foi um sucesso entre os cat lovers.' }
  ],
  finalBenefits: [
    { icon: 'fa-palette', text: 'Artes exclusivas do Bartolomeu' },
    { icon: 'fa-shield-halved', text: 'Compra segura' },
    { icon: 'fa-truck-fast', text: 'Entrega para todo o Brasil' },
    { icon: 'fa-box-open', text: 'Embalagem feita com carinho' }
  ]
});

const escapeHtml = value => String(value).replace(/[&<>'"]/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
})[char]);

const money = cents => (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function createProductCardMarkup(product) {
  const name = escapeHtml(product.name);
  const description = escapeHtml(product.description);
  const id = escapeHtml(product.id);
  const image = product.image ? escapeHtml(product.image) : '';
  return `<article class="product-card">
    <div class="product-placeholder">${image ? `<img src="${image}" alt="${name}">` : '<span>☕</span><small>ARTE EM BREVE</small>'}</div>
    <div class="product-card__body">
      <span class="product-card__eyebrow">CANECAS DO BARTO</span>
      <h3>${name}</h3>
      <p>${description}</p>
      <div class="product-card__footer">
        <strong>${money(product.priceCents)}</strong>
        <button class="add" data-id="${id}" type="button" aria-label="Adicionar ${name} ao carrinho"><i class="fa-solid fa-cart-shopping" aria-hidden="true"></i> Adicionar</button>
      </div>
    </div>
  </article>`;
}

export const renderList = (items, template) => items.map(template).join('');
