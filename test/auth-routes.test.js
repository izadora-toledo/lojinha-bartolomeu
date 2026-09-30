import assert from 'node:assert/strict';
import test from 'node:test';
import { createAuthRouter } from '../server/auth-routes.js';

test('expõe o roteador de autenticação', () => {
  assert.equal(typeof createAuthRouter, 'function');
});
