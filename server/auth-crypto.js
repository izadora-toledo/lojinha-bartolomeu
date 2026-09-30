import crypto from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(crypto.scrypt);
const KEY_LENGTH = 64;
const SCRYPT_OPTIONS = { N: 16_384, r: 8, p: 1, maxmem: 32 * 1024 * 1024 };

export function normalizeEmail(value) {
  return String(value ?? '').trim().toLowerCase();
}

export function normalizeCpf(value) {
  return String(value ?? '').replace(/\D/g, '');
}

export function normalizeBrazilianPhone(value) {
  const digits = String(value ?? '').replace(/\D/g, '');
  if (!digits) return '';
  const nationalNumber = digits.startsWith('55') && digits.length >= 12 ? digits.slice(2) : digits;
  return `+55${nationalNumber}`;
}

export function isValidCpf(value) {
  const cpf = normalizeCpf(value);
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;

  const digitAt = (base, factor) => {
    const sum = base.split('').reduce((total, digit, index) => total + Number(digit) * (factor - index), 0);
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };

  return Number(cpf[9]) === digitAt(cpf.slice(0, 9), 10)
    && Number(cpf[10]) === digitAt(cpf.slice(0, 10), 11);
}

export async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const derivedKey = await scrypt(String(password), salt, KEY_LENGTH, SCRYPT_OPTIONS);
  return `scrypt$${salt.toString('hex')}$${Buffer.from(derivedKey).toString('hex')}`;
}

export async function verifyPassword(password, encodedHash) {
  try {
    const [algorithm, saltHex, keyHex] = String(encodedHash).split('$');
    if (algorithm !== 'scrypt' || !saltHex || !keyHex) return false;
    const expectedKey = Buffer.from(keyHex, 'hex');
    if (expectedKey.length !== KEY_LENGTH) return false;
    const actualKey = await scrypt(String(password), Buffer.from(saltHex, 'hex'), KEY_LENGTH, SCRYPT_OPTIONS);
    return crypto.timingSafeEqual(expectedKey, Buffer.from(actualKey));
  } catch {
    return false;
  }
}

export function createToken() {
  return crypto.randomBytes(32).toString('hex');
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}
