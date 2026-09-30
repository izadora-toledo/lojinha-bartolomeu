import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';

for (const page of ['entrar.html', 'criar-conta.html', 'redefinir-senha.html']) {
  test(`${page} inclui navegação, formulário e footer`, async () => {
    const html = await fs.readFile(new URL(`../public/${page}`, import.meta.url), 'utf8');
    assert.match(html, /site-header|header/);
    assert.match(html, /footer/);
    assert.match(html, /fa-paw/);
  });
}
