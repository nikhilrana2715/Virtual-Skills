import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { getDb, RESOURCE_TYPES, uuid } from '../database/db.js';
import {
  createResource, deleteResource, findDuplicate, getResourceRow, listResources, toApi, updateResource,
} from '../database/resourceRepo.js';
import { audit } from '../database/audit.js';
import { requireAdmin } from '../middleware/auth.js';
import { HttpError } from '../middleware/errors.js';
import { githubProvider } from '../providers/github/github.js';
import { metadataPatch, runGithubSync } from '../jobs/sync.js';
import { listQuerySchema } from './public.js';
import { slugify } from '../utils/url.js';
import { env } from '../config/env.js';

export const adminRouter = Router();
adminRouter.use(requireAdmin);

const httpUrl = z
  .url({ protocol: /^https?$/ })
  .max(500);
const optUrl = z.union([httpUrl, z.literal('').transform(() => null), z.null()]).optional();
const optText = (max: number) => z.union([z.string().trim().max(max), z.null()]).optional();
const optInt = z.union([z.number().int().min(0), z.null()]).optional();

const resourceSchema = z.object({
  name: z.string().trim().min(2).max(120),
  summary: z.string().trim().min(10).max(300),
  description: optText(5000),
  resourceType: z.enum(RESOURCE_TYPES),
  categoryId: z.string().min(1),
  provider: z.enum(['github', 'huggingface', 'gitlab', 'manual', 'other']),
  providerResourceId: optText(100),
  ownerName: optText(100),
  sourceUrl: httpUrl,
  cloneUrl: optUrl,
  downloadUrl: optUrl,
  documentationUrl: optUrl,
  language: optText(40),
  platforms: z.array(z.string().trim().max(30)).max(10).optional(),
  licenseSpdx: optText(60),
  licenseUrl: optUrl,
  topics: z.array(z.string().trim().max(40)).max(20).optional(),
  stars: optInt,
  forks: optInt,
  openIssues: optInt,
  archivedBySource: z.boolean().optional(),
  installation: optText(5000),
  compatibility: optText(2000),
  lastCommitAt: optText(40),
  tags: z.array(z.string().trim().min(1).max(40)).max(15).optional(),
  publicationStatus: z.enum(['draft', 'published', 'archived']).optional(),
  verificationStatus: z.enum(['unreviewed', 'verified', 'rejected']).optional(),
  safetyStatus: z.enum(['unreviewed', 'reviewed', 'flagged']).optional(),
});

function assertCategory(id: string) {
  if (!getDb().prepare('SELECT 1 FROM categories WHERE id = ?').get(id)) throw new HttpError(400, 'Unknown category');
}
function mustGet(id: string) {
  const row = getResourceRow({ id });
  if (!row) throw new HttpError(404, 'Resource not found');
  return row;
}

// ---- Dashboard ----
adminRouter.get('/stats', (_req, res) => {
  const db = getDb();
  const one = (sql: string, ...p: string[]) => (db.prepare(sql).get(...p) as { n: number }).n;
  const staleCutoff = new Date(Date.now() - 7 * 86400_000).toISOString();
  res.json({
    total: one('SELECT count(*) n FROM resources'),
    published: one(`SELECT count(*) n FROM resources WHERE publication_status='published'`),
    draft: one(`SELECT count(*) n FROM resources WHERE publication_status='draft'`),
    archived: one(`SELECT count(*) n FROM resources WHERE publication_status='archived'`),
    pendingReview: one(`SELECT count(*) n FROM resources WHERE verification_status='unreviewed' OR safety_status='unreviewed'`),
    stale: one(`SELECT count(*) n FROM resources WHERE provider='github' AND (last_synced_at IS NULL OR last_synced_at < ?)`, staleCutoff),
    syncErrors: one(`SELECT count(*) n FROM resources WHERE sync_error IS NOT NULL`),
    openReports: one(`SELECT count(*) n FROM resource_reports WHERE status='open'`),
    users: one('SELECT count(*) n FROM users'),
    byCategory: db
      .prepare(`SELECT c.name, count(r.id) n FROM categories c LEFT JOIN resources r ON r.category_id=c.id GROUP BY c.id ORDER BY n DESC`)
      .all(),
    byProvider: db.prepare(`SELECT provider AS name, count(*) n FROM resources GROUP BY provider ORDER BY n DESC`).all(),
    mostViewed: db.prepare(`SELECT name, slug, view_count n FROM resources ORDER BY view_count DESC LIMIT 5`).all(),
    mostSaved: db
      .prepare(`SELECT r.name, r.slug, count(b.id) n FROM resources r JOIN bookmarks b ON b.resource_id=r.id GROUP BY r.id ORDER BY n DESC LIMIT 5`)
      .all(),
  });
});

// ---- Resources ----
adminRouter.get('/resources', (req, res) => {
  const f = listQuerySchema.extend({ status: z.enum(['draft', 'published', 'archived']).optional() }).parse(req.query);
  res.json(listResources({ sort: 'recent', ...f }, { admin: true }));
});

adminRouter.get('/resources/:id', (req, res) => {
  res.json({ resource: toApi(mustGet(String(req.params.id)), { admin: true }) });
});

adminRouter.post('/resources', (req, res) => {
  const body = resourceSchema.parse(req.body);
  assertCategory(body.categoryId);
  const row = createResource(body);
  audit(req.user!.id, 'resource.create', 'resource', row.id, { name: row.name, status: row.publication_status });
  res.status(201).json({ resource: toApi(row, { admin: true }) });
});

adminRouter.patch('/resources/:id', (req, res) => {
  const id = String(req.params.id);
  const before = mustGet(id);
  const body = resourceSchema.partial().parse(req.body);
  if (body.categoryId) assertCategory(body.categoryId);
  const row = updateResource(id, { ...body, provider: body.provider ?? before.provider });
  audit(req.user!.id, 'resource.update', 'resource', id, { fields: Object.keys(body) });
  res.json({ resource: toApi(row, { admin: true }) });
});

const statusAction = (action: string, patch: Parameters<typeof updateResource>[1]) =>
  adminRouter.post(`/resources/:id/${action}`, (req, res) => {
    const id = String(req.params.id);
    mustGet(id);
    const row = updateResource(id, patch);
    audit(req.user!.id, `resource.${action}`, 'resource', id);
    res.json({ resource: toApi(row, { admin: true }) });
  });
statusAction('publish', { publicationStatus: 'published' });
statusAction('unpublish', { publicationStatus: 'draft' });
statusAction('archive', { publicationStatus: 'archived' });

adminRouter.post('/resources/:id/verify', (req, res) => {
  const id = String(req.params.id);
  mustGet(id);
  const body = z
    .object({
      verificationStatus: z.enum(['unreviewed', 'verified', 'rejected']).optional(),
      safetyStatus: z.enum(['unreviewed', 'reviewed', 'flagged']).optional(),
    })
    .parse(req.body ?? {});
  const row = updateResource(id, {
    verificationStatus: body.verificationStatus ?? 'verified',
    safetyStatus: body.safetyStatus ?? 'reviewed',
  });
  audit(req.user!.id, 'resource.verify', 'resource', id, body);
  res.json({ resource: toApi(row, { admin: true }) });
});

/** Policy: published resources are archived, not hard-deleted. Drafts/archived may be deleted. */
adminRouter.delete('/resources/:id', (req, res) => {
  const id = String(req.params.id);
  const row = mustGet(id);
  if (row.publication_status === 'published') {
    updateResource(id, { publicationStatus: 'archived' });
    audit(req.user!.id, 'resource.archive', 'resource', id, { via: 'delete' });
    return res.json({ archived: true });
  }
  deleteResource(id);
  audit(req.user!.id, 'resource.delete', 'resource', id, { name: row.name });
  res.json({ deleted: true });
});

adminRouter.post('/resources/:id/sync', async (req, res) => {
  const id = String(req.params.id);
  const row = mustGet(id);
  if (row.provider !== 'github') throw new HttpError(400, 'Only GitHub resources can be synced');
  const result = await runGithubSync({ resourceIds: [id] });
  audit(req.user!.id, 'resource.sync', 'resource', id, result);
  res.json({ result, resource: toApi(mustGet(id), { admin: true }) });
});

// ---- GitHub import ----
const importLimiter = rateLimit({ windowMs: 60_000, limit: env.isTest ? 1000 : 20, standardHeaders: 'draft-8', legacyHeaders: false });

adminRouter.post('/imports/github/preview', importLimiter, async (req, res) => {
  const { url } = z.object({ url: z.string().trim().min(3).max(300) }).parse(req.body);
  const n = await githubProvider.fetchResource(url);
  const dup = findDuplicate(n.sourceUrl, 'github', n.providerResourceId);
  res.json({ preview: n, duplicate: dup ?? null });
});

adminRouter.post('/imports/github', importLimiter, async (req, res) => {
  const body = z
    .object({
      url: z.string().trim().min(3).max(300),
      categoryId: z.string().min(1),
      resourceType: z.enum(RESOURCE_TYPES).default('repository'),
      tags: z.array(z.string().trim().min(1).max(40)).max(15).optional(),
      summary: z.string().trim().min(10).max(300).optional(),
      installation: optText(5000),
      publish: z.boolean().default(false),
      safetyStatus: z.enum(['unreviewed', 'reviewed', 'flagged']).default('unreviewed'),
    })
    .parse(req.body);
  assertCategory(body.categoryId);
  const n = await githubProvider.fetchResource(body.url);
  const summary = body.summary ?? n.summary?.slice(0, 300);
  if (!summary || summary.length < 10) throw new HttpError(400, 'Repository has no description — provide a summary');
  const row = createResource({
    name: n.name,
    summary,
    resourceType: body.resourceType,
    categoryId: body.categoryId,
    provider: 'github',
    ownerName: n.ownerName,
    sourceUrl: n.sourceUrl,
    documentationUrl: n.documentationUrl,
    tags: body.tags ?? n.topics.slice(0, 8),
    installation: body.installation ?? null,
    publicationStatus: body.publish ? 'published' : 'draft',
    safetyStatus: body.safetyStatus,
    ...metadataPatch(n),
    syncError: undefined,
  } as Parameters<typeof createResource>[0]);
  audit(req.user!.id, 'resource.import', 'resource', row.id, { provider: 'github', source: n.fullName });
  res.status(201).json({ resource: toApi(row, { admin: true }) });
});

adminRouter.post('/sync', async (req, res) => {
  const result = await runGithubSync({ staleHours: 0, max: 100 });
  audit(req.user!.id, 'sync.trigger', 'sync_job', 'jobId' in result ? (result.jobId ?? null) : null, result);
  res.json(result);
});

adminRouter.get('/sync-jobs', (_req, res) => {
  res.json({ items: getDb().prepare('SELECT * FROM sync_jobs ORDER BY started_at DESC LIMIT 50').all() });
});

// ---- Categories ----
const categorySchema = z.object({
  name: z.string().trim().min(2).max(60),
  description: optText(300),
  icon: optText(8),
});

adminRouter.get('/categories', (_req, res) => {
  res.json({
    categories: getDb()
      .prepare(`SELECT c.*, (SELECT count(*) FROM resources r WHERE r.category_id=c.id) AS count FROM categories c ORDER BY c.name`)
      .all(),
  });
});

adminRouter.post('/categories', (req, res) => {
  const body = categorySchema.parse(req.body);
  const slug = slugify(body.name);
  const db = getDb();
  if (db.prepare('SELECT 1 FROM categories WHERE slug = ?').get(slug)) throw new HttpError(409, 'Category already exists');
  const id = uuid();
  db.prepare('INSERT INTO categories (id, name, slug, description, icon) VALUES (?,?,?,?,?)').run(
    id, body.name, slug, body.description ?? null, body.icon ?? null,
  );
  audit(req.user!.id, 'category.create', 'category', id, body);
  res.status(201).json({ category: db.prepare('SELECT * FROM categories WHERE id=?').get(id) });
});

adminRouter.patch('/categories/:id', (req, res) => {
  const id = String(req.params.id);
  const body = categorySchema.partial().parse(req.body);
  const db = getDb();
  if (!db.prepare('SELECT 1 FROM categories WHERE id=?').get(id)) throw new HttpError(404, 'Category not found');
  if (body.name) db.prepare('UPDATE categories SET name=?, slug=? WHERE id=?').run(body.name, slugify(body.name), id);
  if (body.description !== undefined) db.prepare('UPDATE categories SET description=? WHERE id=?').run(body.description, id);
  if (body.icon !== undefined) db.prepare('UPDATE categories SET icon=? WHERE id=?').run(body.icon, id);
  audit(req.user!.id, 'category.update', 'category', id, body);
  res.json({ category: db.prepare('SELECT * FROM categories WHERE id=?').get(id) });
});

adminRouter.delete('/categories/:id', (req, res) => {
  const id = String(req.params.id);
  const db = getDb();
  const n = (db.prepare('SELECT count(*) n FROM resources WHERE category_id=?').get(id) as { n: number }).n;
  if (n > 0) throw new HttpError(409, `Category has ${n} resources — move them first`);
  db.prepare('DELETE FROM categories WHERE id=?').run(id);
  audit(req.user!.id, 'category.delete', 'category', id);
  res.json({ ok: true });
});

// ---- Tags ----
adminRouter.get('/tags', (_req, res) => {
  res.json({
    tags: getDb()
      .prepare(`SELECT t.*, count(rt.resource_id) AS count FROM tags t LEFT JOIN resource_tags rt ON rt.tag_id=t.id GROUP BY t.id ORDER BY t.name`)
      .all(),
  });
});
adminRouter.delete('/tags/:id', (req, res) => {
  getDb().prepare('DELETE FROM tags WHERE id=?').run(String(req.params.id));
  audit(req.user!.id, 'tag.delete', 'tag', String(req.params.id));
  res.json({ ok: true });
});

// ---- Users ----
adminRouter.get('/users', (_req, res) => {
  res.json({ users: getDb().prepare('SELECT id, name, email, role, status, created_at FROM users ORDER BY created_at DESC').all() });
});
adminRouter.patch('/users/:id', (req, res) => {
  const id = String(req.params.id);
  if (id === req.user!.id) throw new HttpError(400, 'You cannot change your own role or status');
  const body = z.object({ role: z.enum(['user', 'admin']).optional(), status: z.enum(['active', 'suspended']).optional() }).parse(req.body);
  const db = getDb();
  if (!db.prepare('SELECT 1 FROM users WHERE id=?').get(id)) throw new HttpError(404, 'User not found');
  if (body.role) db.prepare('UPDATE users SET role=?, updated_at=? WHERE id=?').run(body.role, new Date().toISOString(), id);
  if (body.status) db.prepare('UPDATE users SET status=?, updated_at=? WHERE id=?').run(body.status, new Date().toISOString(), id);
  audit(req.user!.id, 'user.update', 'user', id, body);
  res.json({ ok: true });
});

// ---- Reports ----
adminRouter.get('/reports', (_req, res) => {
  res.json({
    items: getDb()
      .prepare(
        `SELECT rr.*, r.name AS resource_name, r.slug AS resource_slug, u.email AS reporter_email
         FROM resource_reports rr JOIN resources r ON r.id=rr.resource_id LEFT JOIN users u ON u.id=rr.user_id
         ORDER BY rr.status='open' DESC, rr.created_at DESC LIMIT 100`,
      )
      .all(),
  });
});
adminRouter.patch('/reports/:id', (req, res) => {
  const { status } = z.object({ status: z.enum(['open', 'resolved', 'dismissed']) }).parse(req.body);
  getDb().prepare('UPDATE resource_reports SET status=? WHERE id=?').run(status, String(req.params.id));
  audit(req.user!.id, 'report.update', 'report', String(req.params.id), { status });
  res.json({ ok: true });
});

// ---- Audit ----
adminRouter.get('/audit-logs', (_req, res) => {
  res.json({
    items: getDb()
      .prepare(
        `SELECT a.*, u.email AS actor_email FROM audit_logs a LEFT JOIN users u ON u.id=a.actor_user_id ORDER BY a.created_at DESC LIMIT 200`,
      )
      .all(),
  });
});
