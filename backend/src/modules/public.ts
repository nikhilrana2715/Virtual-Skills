import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { getDb, RESOURCE_TYPES, uuid } from '../database/db.js';
import { facets, getResourceRow, incrementView, listResources, related, toApi, trending } from '../database/resourceRepo.js';
import { HttpError } from '../middleware/errors.js';
import { env } from '../config/env.js';

export const publicRouter = Router();

const searchLimiter = rateLimit({ windowMs: 60_000, limit: env.isTest ? 10_000 : 120, standardHeaders: 'draft-8', legacyHeaders: false });

const bool = z.preprocess((v) => v === 'true' || v === '1' || v === true, z.boolean()).optional();
export const listQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  category: z.string().max(80).optional(),
  type: z.enum(RESOURCE_TYPES).optional(),
  provider: z.string().max(30).optional(),
  language: z.string().max(40).optional(),
  license: z.string().max(60).optional(),
  verified: bool,
  updatedWithinDays: z.coerce.number().int().min(1).max(3650).optional(),
  sort: z.enum(['relevance', 'recent', 'updated', 'stars', 'name']).optional(),
  page: z.coerce.number().int().min(1).max(10_000).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

publicRouter.get('/resources', searchLimiter, (req, res) => {
  const f = listQuerySchema.parse(req.query);
  res.json(listResources(f));
});

publicRouter.get('/resources/:slug', (req, res) => {
  const row = getResourceRow({ slug: String(req.params.slug) });
  if (!row || row.publication_status !== 'published') throw new HttpError(404, 'Resource not found');
  incrementView(row.id);
  let bookmarked = false;
  if (req.user) {
    bookmarked = !!getDb().prepare('SELECT 1 FROM bookmarks WHERE user_id = ? AND resource_id = ?').get(req.user.id, row.id);
  }
  res.json({ resource: toApi(row), related: related(row), bookmarked });
});

publicRouter.get('/categories', (_req, res) => {
  const rows = getDb()
    .prepare(
      `SELECT c.id, c.name, c.slug, c.description, c.icon,
        (SELECT count(*) FROM resources r WHERE r.category_id = c.id AND r.publication_status = 'published') AS count
       FROM categories c ORDER BY c.name`,
    )
    .all();
  res.json({ categories: rows });
});

publicRouter.get('/categories/:slug', (req, res) => {
  const cat = getDb().prepare('SELECT id, name, slug, description, icon FROM categories WHERE slug = ?').get(String(req.params.slug));
  if (!cat) throw new HttpError(404, 'Category not found');
  res.json({ category: cat });
});

publicRouter.get('/categories/:slug/resources', searchLimiter, (req, res) => {
  const f = listQuerySchema.parse(req.query);
  res.json(listResources({ ...f, category: String(req.params.slug) }));
});

publicRouter.get('/tags', (_req, res) => {
  const rows = getDb()
    .prepare(
      `SELECT t.name, t.slug, count(rt.resource_id) AS count FROM tags t
       LEFT JOIN resource_tags rt ON rt.tag_id = t.id
       LEFT JOIN resources r ON r.id = rt.resource_id AND r.publication_status = 'published'
       GROUP BY t.id HAVING count(r.id) > 0 ORDER BY count DESC, t.name`,
    )
    .all();
  res.json({ tags: rows });
});

publicRouter.get('/facets', (_req, res) => res.json(facets()));

publicRouter.get('/trending', (req, res) => {
  const limit = z.coerce.number().int().min(1).max(50).catch(12).parse(req.query.limit);
  res.json({ items: trending(limit) });
});

publicRouter.get('/latest', (req, res) => {
  const limit = z.coerce.number().int().min(1).max(50).catch(12).parse(req.query.limit);
  res.json(listResources({ sort: 'recent', limit }));
});

publicRouter.get('/stats', (_req, res) => {
  const db = getDb();
  const one = (sql: string) => (db.prepare(sql).get() as { n: number }).n;
  res.json({
    resources: one(`SELECT count(*) n FROM resources WHERE publication_status='published'`),
    categories: one(`SELECT count(*) n FROM categories`),
    verified: one(`SELECT count(*) n FROM resources WHERE publication_status='published' AND verification_status='verified'`),
  });
});

const reportSchema = z.object({
  reason: z.enum(['broken_link', 'incorrect_info', 'license_issue', 'security_concern', 'spam', 'takedown', 'other']),
  details: z.string().trim().max(1000).optional(),
});
const reportLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: env.isTest ? 1000 : 10, standardHeaders: 'draft-8', legacyHeaders: false });

publicRouter.post('/resources/:slug/report', reportLimiter, (req, res) => {
  const body = reportSchema.parse(req.body);
  const row = getResourceRow({ slug: String(req.params.slug) });
  if (!row || row.publication_status !== 'published') throw new HttpError(404, 'Resource not found');
  getDb()
    .prepare('INSERT INTO resource_reports (id, resource_id, user_id, reason, details) VALUES (?,?,?,?,?)')
    .run(uuid(), row.id, req.user?.id ?? null, body.reason, body.details ?? null);
  res.status(201).json({ ok: true });
});
