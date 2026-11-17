import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { getDb } from '../database/db.js';

export const COOKIE = 'vs_session';
const MAX_AGE_S = 7 * 24 * 3600;

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function issueSession(res: Response, userId: string) {
  const token = jwt.sign({ sub: userId }, env.sessionSecret, { expiresIn: MAX_AGE_S, algorithm: 'HS256' });
  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: env.isProd,
    maxAge: MAX_AGE_S * 1000,
    path: '/',
  });
}

export function clearSession(res: Response) {
  res.clearCookie(COOKIE, { httpOnly: true, sameSite: 'strict', secure: env.isProd, path: '/' });
}

/** Loads user from cookie if valid. Never rejects. Re-checks DB so suspended users / role changes apply immediately. */
export function loadUser(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.[COOKIE];
  if (token) {
    try {
      const payload = jwt.verify(token, env.sessionSecret, { algorithms: ['HS256'] }) as { sub: string };
      const u = getDb()
        .prepare(`SELECT id, name, email, role FROM users WHERE id = ? AND status = 'active'`)
        .get(payload.sub) as AuthUser | undefined;
      if (u) req.user = { ...u };
    } catch {
      /* invalid/expired → anonymous */
    }
  }
  next();
}

export function requireUser(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  next();
}

/** CSRF guard: SameSite=Strict cookie + custom header that cross-site forms cannot set. */
export function csrfGuard(req: Request, res: Response, next: NextFunction) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  if (req.get('X-Requested-With') !== 'virtual-skills') {
    return res.status(403).json({ error: 'Missing CSRF header' });
  }
  next();
}
