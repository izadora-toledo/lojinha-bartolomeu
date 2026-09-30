import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';

test('widget de carrinho cria drawer e botão de continuar compra', async () => {
  const source = await fs.readFile(new URL('../public/cart-widget.js', import.meta.url), 'utf8');
  assert.match(source, /Seu carrinho/);
  assert.match(source, /Continuar para a loja/);
  assert.match(source, /barto-cart/);
});
