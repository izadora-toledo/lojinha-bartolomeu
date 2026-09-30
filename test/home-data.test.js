import test from 'node:test';
import assert from 'node:assert/strict';
import { createProductCardMarkup } from '../public/home-data.js';

test('renders an accessible add-to-cart button for an API product', () => {
  const markup = createProductCardMarkup({
    id: 'cafe-caos',
    name: 'Caneca Café & Caos',
    description: 'Caneca de cerâmica 325 ml',
    priceCents: 4990
  });

  assert.match(markup, /data-id="cafe-caos"/);
  assert.match(markup, /aria-label="Adicionar Caneca Café &amp; Caos ao carrinho"/);
  assert.match(markup, /Adicionar<\/button>/);
  assert.match(markup, /R\$\s?49,90/);
});

test('renders the supplied mug image when the product has one', () => {
  const markup = createProductCardMarkup({ id: 'barto-1', name: 'Caneca do Bartô', description: 'Fofa', priceCents: 4990, image: '/assets/caneca-1.png' });
  assert.match(markup, /<img src="\/assets\/caneca-1\.png"/);
});
