export const CATALOG = Object.freeze({
  'cafe-caos': {
    id: 'cafe-caos',
    name: 'Caneca Café & Caos',
    description: 'Caneca de cerâmica 325 ml — Café & Caos',
    priceCents: 4990,
    image: '/assets/barto-selfie.png'
  },
  'modo-caos': {
    id: 'modo-caos',
    name: 'Caneca Modo Caos',
    description: 'Caneca de cerâmica 325 ml — Modo Caos',
    priceCents: 4990,
    image: '/assets/barto-tulipa.png'
  },
  'julgo-silencio': {
    id: 'julgo-silencio',
    name: 'Caneca Julgo em Silêncio',
    description: 'Caneca de cerâmica 325 ml — Julgo em Silêncio',
    priceCents: 4990,
    image: '/assets/barto-cama.png'
  }
});

export function priceCart(cart) {
  if (!Array.isArray(cart) || cart.length === 0) throw new Error('Carrinho vazio.');
  const items = cart.map(({ id, quantity }) => {
    const product = CATALOG[id];
    const qty = Number(quantity);
    if (!product || !Number.isInteger(qty) || qty < 1 || qty > 20) throw new Error('Item inválido no carrinho.');
    return { ...product, quantity: qty, lineTotalCents: product.priceCents * qty };
  });
  const subtotalCents = items.reduce((sum, item) => sum + item.lineTotalCents, 0);
  return { items, subtotalCents };
}
