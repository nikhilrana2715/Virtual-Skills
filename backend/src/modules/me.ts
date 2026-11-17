import { Router } from 'express';
import { getDb, uuid } from '../database/db.js';
import { toApi } from '../database/resourceRepo.js';
import { requireUser } from '../middleware/auth.js';
import { HttpError } from '../middleware/errors.js';

export const meRouter = Router();
meRouter.use(requireUser);

meRouter.get('/bookmarks', (req, res) => {
  const rows = getDb()
    .prepare(
      `SELECT r.*, c.name AS category_name, c.slug AS category_slug,
        (SELECT json_group_array(json_object('name', t.name, 'slug', t.slug))
           FROM resource_tags rt JOIN tags t ON t.id = rt.tag_id WHERE rt.resource_id = r.id) AS tags_json,
        b.created_at AS bookmarked_at
       FROM bookmarks b JOIN resources r ON r.id = b.resource_id JOIN categories c ON c.id = r.category_id
       WHERE b.user_id = ? AND r.publication_status = 'published'
       ORDER BY b.created_at DESC`,
    )
    .all(req.user!.id) as Record<string, any>[];
  res.json({ items: rows.map((r) => ({ ...toApi(r), bookmarkedAt: r.bookmarked_at })) });
});

meRouter.get('/bookmarks/ids', (req, res) => {
  const rows = getDb().prepare('SELECT resource_id FROM bookmarks WHERE user_id = ?').all(req.user!.id) as { resource_id: string }[];
  res.json({ ids: rows.map((r) => r.resource_id) });
});

meRouter.post('/bookmarks/:resourceId', (req, res) => {
  const db = getDb();
  const rid = String(req.params.resourceId);
  const r = db.prepare(`SELECT id FROM resources WHERE id = ? AND publication_status = 'published'`).get(rid);
  if (!r) throw new HttpError(404, 'Resource not found');
  db.prepare('INSERT OR IGNORE INTO bookmarks (id, user_id, resource_id) VALUES (?,?,?)').run(uuid(), req.user!.id, rid);
  res.status(201).json({ ok: true });
});

meRouter.delete('/bookmarks/:resourceId', (req, res) => {
  getDb().prepare('DELETE FROM bookmarks WHERE user_id = ? AND resource_id = ?').run(req.user!.id, String(req.params.resourceId));
  res.json({ ok: true });
});

meRouter.get('/export', (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?').get(req.user!.id);
  const bookmarks = db
    .prepare('SELECT r.name, r.source_url, b.created_at FROM bookmarks b JOIN resources r ON r.id = b.resource_id WHERE b.user_id = ?')
    .all(req.user!.id);
  res.setHeader('Content-Disposition', 'attachment; filename="virtual-skills-export.json"');
  res.json({ user, bookmarks });
});
