import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const defaultDirectory = path.resolve('data');

async function read(file) {
  try { return JSON.parse(await fs.readFile(file, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return []; throw error; }
}
async function write(file, rows) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const temporary = `${file}.${crypto.randomUUID()}.tmp`;
  await fs.writeFile(temporary, JSON.stringify(rows, null, 2));
  await fs.rename(temporary, file);
}

export function createCustomerStore(directory = defaultDirectory) {
  const customersFile = path.join(directory, 'customers.json');
  const sessionsFile = path.join(directory, 'sessions.json');
  const resetsFile = path.join(directory, 'password-reset-tokens.json');
  return {
    async createCustomer({ email, passwordHash }) {
      const rows = await read(customersFile);
      if (rows.some(row => row.email === email)) throw new Error('EMAIL_ALREADY_EXISTS');
      const now = new Date().toISOString();
      const customer = { id: crypto.randomUUID(), email, passwordHash, createdAt: now, updatedAt: now };
      rows.push(customer); await write(customersFile, rows); return customer;
    },
    async findCustomerByEmail(email) { return (await read(customersFile)).find(row => row.email === email) || null; },
    async findCustomerById(id) { return (await read(customersFile)).find(row => row.id === id) || null; },
    async updateCustomer(customerId, changes) {
      const rows = await read(customersFile); const index = rows.findIndex(row => row.id === customerId);
      if (index < 0) return null; rows[index] = { ...rows[index], ...changes, updatedAt: new Date().toISOString() };
      await write(customersFile, rows); return rows[index];
    },
    async createSession(session) { const rows = await read(sessionsFile); rows.push({ ...session, createdAt: new Date().toISOString() }); await write(sessionsFile, rows); },
    async getSessionByTokenHash(tokenHash) {
      const rows = await read(sessionsFile); const session = rows.find(row => row.tokenHash === tokenHash);
      if (!session || new Date(session.expiresAt) <= new Date()) return null; return session;
    },
    async revokeSession(tokenHash) { await write(sessionsFile, (await read(sessionsFile)).filter(row => row.tokenHash !== tokenHash)); },
    async revokeCustomerSessions(customerId) { await write(sessionsFile, (await read(sessionsFile)).filter(row => row.customerId !== customerId)); },
    async createPasswordResetToken(token) { const rows = await read(resetsFile); rows.push(token); await write(resetsFile, rows); },
    async consumePasswordResetToken(tokenHash) {
      const rows = await read(resetsFile); const token = rows.find(row => row.tokenHash === tokenHash && !row.usedAt && new Date(row.expiresAt) > new Date());
      if (!token) return null; token.usedAt = new Date().toISOString(); await write(resetsFile, rows); return token;
    },
  };
}

export const customerStore = createCustomerStore();
