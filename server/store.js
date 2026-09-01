import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const file = path.resolve('data/orders.json');

async function readAll() {
  try { return JSON.parse(await fs.readFile(file, 'utf8')); }
  catch (e) { if (e.code === 'ENOENT') return []; throw e; }
}
async function writeAll(rows) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = file + '.tmp';
  await fs.writeFile(tmp, JSON.stringify(rows, null, 2));
  await fs.rename(tmp, file);
}
export function createOrderId() {
  return `BARTO-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}
export async function saveOrder(order) {
  const rows = await readAll();
  const idx = rows.findIndex(x => x.id === order.id);
  if (idx >= 0) rows[idx] = order; else rows.push(order);
  await writeAll(rows);
  return order;
}
export async function getOrder(id) {
  return (await readAll()).find(x => x.id === id) || null;
}
