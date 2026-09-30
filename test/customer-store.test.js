import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createCustomerStore } from '../server/customer-store.js';

test('persiste cliente e trata sessões expiradas', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'barto-auth-'));
  const store = createCustomerStore(dir);
  const customer = await store.createCustomer({ email: 'ana@email.com', passwordHash: 'hash' });
  assert.equal((await store.findCustomerByEmail('ana@email.com')).id, customer.id);
  await store.createSession({ customerId: customer.id, tokenHash: 'valid', expiresAt: new Date(Date.now() + 60_000).toISOString() });
  await store.createSession({ customerId: customer.id, tokenHash: 'old', expiresAt: new Date(Date.now() - 60_000).toISOString() });
  assert.equal((await store.getSessionByTokenHash('valid')).customerId, customer.id);
  assert.equal(await store.getSessionByTokenHash('old'), null);
  await fs.rm(dir, { recursive: true, force: true });
});
