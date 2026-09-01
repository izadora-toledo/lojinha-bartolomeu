import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const css = fs.readFileSync(new URL('../public/style.css', import.meta.url), 'utf8').toLowerCase();
const html = fs.readFileSync(new URL('../public/index.html', import.meta.url), 'utf8').toLowerCase();
const app = fs.readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');

test('home usa os tokens do conceito Divertido Pop azul neon pastel', () => {
  assert.match(css, /--neon-blue:\s*#8bdcff/);
  assert.match(css, /--neon-blue-strong:\s*#58caff/);
  assert.match(css, /--display-font:/);
  assert.match(html, /caos felino/);
  assert.match(html, /frete com seguro incluso/);
});

test('home não publica prova social fictícia', () => {
  assert.doesNotMatch(html, /\+2\.500 clientes/);
  assert.doesNotMatch(html, /1\.200 avaliações/);
  assert.doesNotMatch(html, /4,9\/5/);
});

test('carrinho invalida frete antigo quando CEP ou quantidade mudam', () => {
  assert.match(app, /function resetShipping\(/);
  assert.match(app, /resetShipping\('cep alterado'\)/i);
  assert.match(app, /resetShipping\('carrinho alterado'\)/i);
});
