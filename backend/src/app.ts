import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { csrfGuard, loadUser } from './middleware/auth.js';
import { errorHandler, notFound } from './middleware/errors.js';
import { authRouter } from './modules/auth.js';
import { publicRouter } from './modules/public.js';
import { meRouter } from './modules/me.js';
import { adminRouter } from './modules/admin.js';
import { getDb } from './database/db.js';
import { sitemapHandler } from './modules/sitemap.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', env.isProd ? 1 : false);
  app.use(
    helmet({
      contentSecurityPolicy: { directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] } },
      crossOriginResourcePolicy: { policy: 'same-origin' },
    }),
  );
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());
  app.use(loadUser);

  app.get('/api/health', (_req, res) => {
    getDb().prepare('SELECT 1').get();
    res.json({ ok: true, name: 'Virtual Skills API' });
  });

  app.get('/sitemap.xml', sitemapHandler);

  const v1 = express.Router();
  v1.use(csrfGuard);
  v1.use('/auth', authRouter);
  v1.use('/me', meRouter);
  v1.use('/admin', adminRouter);
  v1.use('/', publicRouter);
  app.use('/api/v1', v1);

  app.use('/api', notFound);
  app.use(errorHandler);
  return app;
}
