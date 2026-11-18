import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { addCatalog, seed } from '../src/database/seed.js';
import { CATEGORIES } from '../src/database/seedData.js';
import { getDb } from '../src/database/db.js';

const app = createApp();
const H = { 'X-Requested-With': 'virtual-skills' };

async function login(email: string, password: string) {
  const agent = request.agent(app);
  const res = await agent.post('/api/v1/auth/login').set(H).send({ email, password });
  expect(res.status).toBe(200);
  return agent;
}

beforeAll(() => seed({ quiet: true }));

describe('public API', () => {
  it('lists published resources with pagination', async () => {
    const res = await request(app).get('/api/v1/resources?limit=5');
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(5);
    expect(res.body.total).toBeGreaterThan(5);
    expect(res.body.items[0].stars).toBeNull(); // never invented
    expect(res.body.items[0].licenseLabel).toBe('License: Unknown — check source terms');
    expect(res.body.items[0].download.allowed).toBe(false);
  });

  it('searches with relevance (exact name first)', async () => {
    const res = await request(app).get('/api/v1/resources?q=langchain');
    expect(res.body.items[0].name).toBe('LangChain');
  });

  it('searches tags and filters', async () => {
    const res = await request(app).get('/api/v1/resources?q=vector%20search');
    expect(res.body.items.map((r: { name: string }) => r.name)).toEqual(expect.arrayContaining(['Chroma', 'Qdrant']));
    const f = await request(app).get('/api/v1/resources?category=mcp-ecosystem&type=mcp_server');
    expect(f.body.items.every((r: { resourceType: string }) => r.resourceType === 'mcp_server')).toBe(true);
    expect(f.body.total).toBeGreaterThanOrEqual(3);
  });

  it('includes IT & Cloud categories, and addCatalog is idempotent', async () => {
    const res = await request(app).get('/api/v1/categories');
    const slugs = res.body.categories.map((c: { slug: string }) => c.slug);
    expect(slugs).toEqual(expect.arrayContaining(['cloud-infrastructure', 'it-operations', 'it-service-management', 'networking', 'databases-storage', 'cybersecurity-defense', 'automation-integration']));
    const cloud = await request(app).get('/api/v1/resources?category=cloud-infrastructure');
    expect(cloud.body.items.map((r: { name: string }) => r.name)).toContain('Terraform');
    const before = (getDb().prepare('SELECT COUNT(*) AS n FROM resources').get() as { n: number }).n;
    expect(addCatalog()).toEqual({ categories: 0, resources: 0 });
    expect((getDb().prepare('SELECT COUNT(*) AS n FROM resources').get() as { n: number }).n).toBe(before);
  });

  it('rejects invalid query params', async () => {
    expect((await request(app).get('/api/v1/resources?type=evil')).status).toBe(400);
    expect((await request(app).get('/api/v1/resources?limit=999')).status).toBe(400);
  });

  it('LIKE wildcards are escaped', async () => {
    const res = await request(app).get('/api/v1/resources?q=%25');
    expect(res.body.total).toBe(0);
  });

  it('returns detail with related + 404 for drafts', async () => {
    const res = await request(app).get('/api/v1/resources/langgraph');
    expect(res.status).toBe(200);
    expect(res.body.resource.sourceUrl).toBe('https://github.com/langchain-ai/langgraph');
    expect(res.body.related.length).toBeGreaterThan(0);
    getDb().prepare(`UPDATE resources SET publication_status='draft' WHERE slug='nanogpt'`).run();
    expect((await request(app).get('/api/v1/resources/nanogpt')).status).toBe(404);
  });

  it('categories, trending, latest, facets', async () => {
    expect((await request(app).get('/api/v1/categories')).body.categories).toHaveLength(CATEGORIES.length);
    expect((await request(app).get('/api/v1/trending')).body.items.length).toBeGreaterThan(0);
    expect((await request(app).get('/api/v1/latest')).body.items.length).toBeGreaterThan(0);
    expect((await request(app).get('/api/v1/facets')).body.languages.length).toBeGreaterThan(0);
  });
});

describe('auth + bookmarks', () => {
  it('requires CSRF header on mutations', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email: 'x', password: 'y' });
    expect(res.status).toBe(403);
  });

  it('register → bookmark → list → remove', async () => {
    const agent = request.agent(app);
    const reg = await agent.post('/api/v1/auth/register').set(H).send({ name: 'Test', email: 'T@x.dev', password: 'password123' });
    expect(reg.status).toBe(201);
    expect(reg.headers['set-cookie'][0]).toMatch(/HttpOnly/);
    expect((await agent.post('/api/v1/auth/register').set(H).send({ name: 'Test', email: 't@x.dev', password: 'password123' })).status).toBe(409);

    const list = await agent.get('/api/v1/resources?limit=1');
    const id = list.body.items[0].id;
    expect((await agent.post(`/api/v1/me/bookmarks/${id}`).set(H)).status).toBe(201);
    expect((await agent.post(`/api/v1/me/bookmarks/${id}`).set(H)).status).toBe(201); // idempotent
    const bm = await agent.get('/api/v1/me/bookmarks');
    expect(bm.body.items).toHaveLength(1);
    await agent.delete(`/api/v1/me/bookmarks/${id}`).set(H);
    expect((await agent.get('/api/v1/me/bookmarks')).body.items).toHaveLength(0);
  });

  it('bookmarks require login', async () => {
    expect((await request(app).get('/api/v1/me/bookmarks')).status).toBe(401);
  });

  it('wrong password rejected', async () => {
    const res = await request(app).post('/api/v1/auth/login').set(H).send({ email: 'admin@virtualskills.local', password: 'nope' });
    expect(res.status).toBe(401);
  });
});

describe('admin', () => {
  it('non-admin gets 403, anonymous 401', async () => {
    expect((await request(app).get('/api/v1/admin/stats')).status).toBe(401);
    const user = await login('t@x.dev', 'password123');
    expect((await user.get('/api/v1/admin/stats')).status).toBe(403);
    expect((await user.post('/api/v1/admin/resources').set(H).send({})).status).toBe(403);
  });

  it('CRUD + duplicate detection + audit log', async () => {
    const admin = await login('admin@virtualskills.local', 'ChangeMe123!');
    const cats = (await admin.get('/api/v1/admin/categories')).body.categories;
    const categoryId = cats[0].id;
    const payload = {
      name: 'My Manual Tool', summary: 'A manually curated test resource.', resourceType: 'tool', categoryId,
      provider: 'manual', sourceUrl: 'https://example.com/my-tool',
    };
    const created = await admin.post('/api/v1/admin/resources').set(H).send(payload);
    expect(created.status).toBe(201);
    expect(created.body.resource.publicationStatus).toBe('draft');
    const id = created.body.resource.id;

    // duplicate (canonical URL)
    const dup = await admin.post('/api/v1/admin/resources').set(H).send({ ...payload, sourceUrl: 'https://www.example.com/my-tool/' });
    expect(dup.status).toBe(409);
    // github dup of seeded repo
    const dup2 = await admin.post('/api/v1/admin/resources').set(H).send({ ...payload, sourceUrl: 'https://github.com/Anthropics/Skills.git' });
    expect(dup2.status).toBe(409);

    // javascript: URL rejected
    expect((await admin.post('/api/v1/admin/resources').set(H).send({ ...payload, sourceUrl: 'javascript:alert(1)' })).status).toBe(400);

    expect((await request(app).get('/api/v1/resources/my-manual-tool')).status).toBe(404);
    await admin.post(`/api/v1/admin/resources/${id}/publish`).set(H);
    expect((await request(app).get('/api/v1/resources/my-manual-tool')).status).toBe(200);

    const upd = await admin.patch(`/api/v1/admin/resources/${id}`).set(H).send({ tags: ['Alpha', 'Beta'], licenseSpdx: 'MIT' });
    expect(upd.body.resource.tags.map((t: { name: string }) => t.name).sort()).toEqual(['Alpha', 'Beta']);

    // delete published → archived, not removed
    const del = await admin.delete(`/api/v1/admin/resources/${id}`).set(H);
    expect(del.body.archived).toBe(true);
    const del2 = await admin.delete(`/api/v1/admin/resources/${id}`).set(H);
    expect(del2.body.deleted).toBe(true);

    const logs = (await admin.get('/api/v1/admin/audit-logs')).body.items.map((l: { action: string }) => l.action);
    expect(logs).toEqual(expect.arrayContaining(['resource.create', 'resource.publish', 'resource.update', 'resource.archive', 'resource.delete']));
  });

  it('github import rejects non-github hosts without network calls', async () => {
    const admin = await login('admin@virtualskills.local', 'ChangeMe123!');
    const res = await admin.post('/api/v1/admin/imports/github/preview').set(H).send({ url: 'http://169.254.169.254/latest/meta-data' });
    expect(res.status).toBe(400);
  });
});

describe('website upgrade: contact, repository sections, sitemap', () => {
  const msg = { name: 'Test User', email: 'Test@Example.com', subject: 'Hello there', message: 'This is a test message.' };

  it('accepts a valid contact message and rejects bad input, bots and missing CSRF header', async () => {
    const ok = await request(app).post('/api/v1/contact').set(H).send(msg);
    expect(ok.status).toBe(201);
    expect(ok.body.id).toBeTruthy();
    const row = getDb().prepare('SELECT email, status FROM contact_messages WHERE id=?').get(ok.body.id) as { email: string; status: string };
    expect(row).toEqual({ email: 'test@example.com', status: 'new' });

    expect((await request(app).post('/api/v1/contact').set(H).send({ ...msg, email: 'nope' })).status).toBe(400);
    expect((await request(app).post('/api/v1/contact').set(H).send({ ...msg, message: 'short' })).status).toBe(400);
    expect((await request(app).post('/api/v1/contact').set(H).send({ ...msg, website: 'http://spam' })).status).toBe(400);
    expect((await request(app).post('/api/v1/contact').send(msg)).status).toBe(403);
  });

  it('admin-only message inbox with audit log', async () => {
    expect((await request(app).get('/api/v1/admin/messages')).status).toBe(401);
    const admin = await login('admin@virtualskills.local', 'ChangeMe123!');
    const list = await admin.get('/api/v1/admin/messages');
    expect(list.status).toBe(200);
    const id = list.body.items[0].id;
    expect((await admin.patch(`/api/v1/admin/messages/${id}`).set(H).send({ status: 'read' })).status).toBe(200);
    expect((await admin.patch(`/api/v1/admin/messages/${id}`).set(H).send({ status: 'bogus' })).status).toBe(400);
    expect((await admin.delete(`/api/v1/admin/messages/${id}`).set(H)).status).toBe(200);
    expect((await admin.delete(`/api/v1/admin/messages/${id}`).set(H)).status).toBe(404);
    const actions = (getDb().prepare(`SELECT action FROM audit_logs WHERE entity_id=?`).all(id) as { action: string }[]).map((a) => a.action);
    expect(actions).toEqual(expect.arrayContaining(['message.update', 'message.delete']));
  });

  it('filters resources by a comma-separated category list', async () => {
    const a = (await request(app).get('/api/v1/resources?category=networking&limit=50')).body.total;
    const b = (await request(app).get('/api/v1/resources?category=databases-storage&limit=50')).body.total;
    const both = await request(app).get('/api/v1/resources?category=networking,databases-storage&limit=50');
    expect(both.body.total).toBe(a + b);
    expect((await request(app).get('/api/v1/resources?category=bad%20slug')).status).toBe(400);
  });

  it('serves sitemap.xml with static pages, topics and resources', async () => {
    const res = await request(app).get('/sitemap.xml');
    expect(res.status).toBe(200);
    expect(res.type).toBe('application/xml');
    expect(res.text).toContain('/topics/ai-ml</loc>');
    expect(res.text).toContain('/repository</loc>');
    expect(res.text).toContain('/resources/terraform</loc>');
  });

  it('sitemap topic slugs match frontend resources.json', async () => {
    const { TOPIC_SLUGS } = await import('../src/modules/sitemap.js');
    const file = new URL('../../frontend/src/data/resources.json', import.meta.url);
    const json = JSON.parse((await import('node:fs')).readFileSync(file, 'utf8')) as { topics: { slug: string }[] };
    expect(TOPIC_SLUGS).toEqual(json.topics.map((t) => t.slug));
  });
});
