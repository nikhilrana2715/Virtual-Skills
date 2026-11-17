import 'dotenv/config';
import path from 'node:path';

const isProd = process.env.NODE_ENV === 'production';
const secret = process.env.SESSION_SECRET ?? '';
if (isProd && (secret.length < 32 || secret.startsWith('replace_'))) {
  throw new Error('SESSION_SECRET must be set to a strong value (>=32 chars) in production');
}

export const env = {
  isProd,
  isTest: process.env.NODE_ENV === 'test' || !!process.env.VITEST,
  port: Number(process.env.PORT ?? 5000),
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  databaseFile:
    process.env.DATABASE_FILE === ':memory:'
      ? ':memory:'
      : path.resolve(process.env.DATABASE_FILE ?? 'data/virtual-skills.db'),
  sessionSecret: secret || 'dev-only-insecure-secret-change-me-please-now',
  githubToken: process.env.GITHUB_TOKEN || undefined,
};
