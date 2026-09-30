import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createToken,
  hashPassword,
  hashToken,
  isValidCpf,
  normalizeBrazilianPhone,
  normalizeCpf,
  normalizeEmail,
  verifyPassword,
} from '../server/auth-crypto.js';

test('normaliza dados de identidade brasileiros', () => {
  assert.equal(normalizeEmail('  ANA.Exemplo@Email.com '), 'ana.exemplo@email.com');
  assert.equal(normalizeCpf('529.982.247-25'), '52998224725');
  assert.equal(normalizeBrazilianPhone('(11) 98888-7766'), '+5511988887766');
});

test('valida CPF pelos dígitos verificadores', () => {
  assert.equal(isValidCpf('52998224725'), true);
  assert.equal(isValidCpf('52998224724'), false);
  assert.equal(isValidCpf('11111111111'), false);
});

test('protege a senha com hash e aceita apenas a senha correta', async () => {
  const password = 'meu segredo seguro';
  const encodedHash = await hashPassword(password);

  assert.notEqual(encodedHash, password);
  assert.equal(await verifyPassword(password, encodedHash), true);
  assert.equal(await verifyPassword('senha incorreta', encodedHash), false);
});

test('gera tokens aleatórios e guarda somente um hash determinístico', () => {
  const first = createToken();
  const second = createToken();

  assert.notEqual(first, second);
  assert.match(first, /^[a-f0-9]{64}$/);
  assert.equal(hashToken(first), hashToken(first));
  assert.notEqual(hashToken(first), first);
});
