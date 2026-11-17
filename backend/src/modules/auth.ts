import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { getDb, uuid } from '../database/db.js';
import { clearSession, issueSession, requireUser } from '../middleware/auth.js';
import { HttpError } from '../middleware/errors.js';
import { env } from '../config/env.js';

export const authRouter = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.isTest ? 1000 : 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many attempts, try again later' },
});

const registerSchema = z.object({
  name: z.string().trim().min(2).max(60),
  email: z.email().max(254).transform((e) => e.toLowerCase()),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
});
const loginSchema = z.object({ email: z.string().trim().toLowerCase(), password: z.string().min(1).max(128) });

// Constant-time-ish: always run a bcrypt compare to avoid user-enumeration timing.
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', 10);

authRouter.post('/register', authLimiter, async (req, res) => {
  const body = registerSchema.parse(req.body);
  const db = getDb();
  if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(body.email)) throw new HttpError(409, 'Email already registered');
  const id = uuid();
  const hash = await bcrypt.hash(body.password, 12);
  db.prepare('INSERT INTO users (id, name, email, password_hash) VALUES (?,?,?,?)').run(id, body.name, body.email, hash);
  issueSession(res, id);
  res.status(201).json({ user: { id, name: body.name, email: body.email, role: 'user' } });
});

authRouter.post('/login', authLimiter, async (req, res) => {
  const body = loginSchema.parse(req.body);
  const u = getDb()
    .prepare(`SELECT id, name, email, role, status, password_hash FROM users WHERE email = ?`)
    .get(body.email) as { id: string; name: string; email: string; role: string; status: string; password_hash: string } | undefined;
  const ok = await bcrypt.compare(body.password, u?.password_hash ?? DUMMY_HASH);
  if (!u || !ok) throw new HttpError(401, 'Invalid email or password');
  if (u.status !== 'active') throw new HttpError(403, 'Account suspended');
  issueSession(res, u.id);
  res.json({ user: { id: u.id, name: u.name, email: u.email, role: u.role } });
});

authRouter.post('/logout', (_req, res) => {
  clearSession(res);
  res.json({ ok: true });
});

authRouter.get('/me', (req, res) => {
  res.json({ user: req.user ?? null });
});

authRouter.delete('/me', requireUser, (req, res) => {
  getDb().prepare('DELETE FROM users WHERE id = ?').run(req.user!.id);
  clearSession(res);
  res.json({ ok: true });
});
