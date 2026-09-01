import test from 'node:test';
import assert from 'node:assert/strict';
import { priceCart } from '../server/catalog.js';

test('priceCart recalcula subtotal usando o catálogo do servidor', () => {
  const priced = priceCart([
    { id: 'cafe-caos', quantity: 2 },
    { id: 'modo-caos', quantity: 1 }
  ]);

  assert.equal(priced.items.length, 2);
  assert.equal(priced.items[0].priceCents, 4990);
  assert.equal(priced.items[0].lineTotalCents, 9980);
  assert.equal(priced.subtotalCents, 14970);
});

test('priceCart rejeita item desconhecido ou quantidade inválida', () => {
  assert.throws(() => priceCart([{ id: 'nao-existe', quantity: 1 }]), /Item inválido/);
  assert.throws(() => priceCart([{ id: 'cafe-caos', quantity: 0 }]), /Item inválido/);
  assert.throws(() => priceCart([{ id: 'cafe-caos', quantity: 21 }]), /Item inválido/);
});
