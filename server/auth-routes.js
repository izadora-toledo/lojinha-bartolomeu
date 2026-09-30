import express from 'express';
import { createToken, hashPassword, hashToken, normalizeEmail, verifyPassword } from './auth-crypto.js';

const DAY = 24 * 60 * 60 * 1000;
const cookieName = process.env.SESSION_COOKIE_NAME || 'barto_session';
const safeCustomer = customer => customer && ({ id: customer.id, email: customer.email, name: customer.name || '', phone: customer.phone || '' });
const parseCookies = header => Object.fromEntries(String(header || '').split(';').map(part => part.trim().split('=').map(decodeURIComponent)).filter(([key]) => key));

export function createSessionMiddleware(store) {
  return async (req, res, next) => {
    try {
      const token = parseCookies(req.headers.cookie)[cookieName];
      if (!token) return next();
      const session = await store.getSessionByTokenHash(hashToken(token));
      if (!session) { res.clearCookie(cookieName, { path: '/' }); return next(); }
      req.sessionTokenHash = hashToken(token); req.customer = await store.findCustomerById(session.customerId);
      next();
    } catch (error) { next(error); }
  };
}

export const requireCustomer = (req, res, next) => req.customer ? next() : res.status(401).json({ error: 'Entre ou crie sua conta para continuar.' });

export function createAuthRouter({ store, sendPasswordReset = async () => {} }) {
  const router = express.Router();
  const issue = async (res, customer) => {
    const token = createToken();
    await store.createSession({ customerId: customer.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 30 * DAY).toISOString() });
    res.cookie(cookieName, token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 30 * DAY, path: '/' });
  };
  router.post('/register', async (req, res, next) => { try {
    const email = normalizeEmail(req.body?.email); const password = String(req.body?.password || '');
    if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 8) return res.status(400).json({ error: 'Use um e-mail válido e uma senha com pelo menos 8 caracteres.' });
    const customer = await store.createCustomer({ email, passwordHash: await hashPassword(password) }); await issue(res, customer); res.status(201).json({ customer: safeCustomer(customer) });
  } catch (error) { if (error.message === 'EMAIL_ALREADY_EXISTS') return res.status(409).json({ error: 'Este e-mail já possui conta. Entre com sua senha.' }); next(error); } });
  router.post('/login', async (req, res, next) => { try {
    const customer = await store.findCustomerByEmail(normalizeEmail(req.body?.email));
    if (!customer || !await verifyPassword(String(req.body?.password || ''), customer.passwordHash)) return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
    await issue(res, customer); res.json({ customer: safeCustomer(customer) });
  } catch (error) { next(error); } });
  router.post('/logout', async (req, res) => { if (req.sessionTokenHash) await store.revokeSession(req.sessionTokenHash); res.clearCookie(cookieName, { path: '/' }); res.status(204).end(); });
  router.get('/me', (req, res) => req.customer ? res.json({ customer: safeCustomer(req.customer) }) : res.status(401).json({ error: 'Sessão não encontrada.' }));
  router.post('/password-reset/request', async (req, res) => { const customer = await store.findCustomerByEmail(normalizeEmail(req.body?.email)); if (customer) { const token = createToken(); await store.createPasswordResetToken({ customerId: customer.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString() }); await sendPasswordReset({ to: customer.email, resetUrl: `${process.env.APP_URL || 'http://localhost:3000'}/redefinir-senha.html?token=${token}` }); } res.json({ message: 'Se houver uma conta com este e-mail, enviaremos as instruções.' }); });
  router.post('/password-reset/confirm', async (req, res) => { const password = String(req.body?.password || ''); const token = String(req.body?.token || ''); if (password.length < 8) return res.status(400).json({ error: 'Use uma senha com pelo menos 8 caracteres.' }); const reset = await store.consumePasswordResetToken(hashToken(token)); if (!reset) return res.status(400).json({ error: 'Este link expirou ou já foi utilizado.' }); await store.updateCustomer(reset.customerId, { passwordHash: await hashPassword(password) }); await store.revokeCustomerSessions(reset.customerId); res.json({ message: 'Senha atualizada. Entre novamente para continuar.' }); });
  return router;
}
