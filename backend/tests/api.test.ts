import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { seed } from '../src/database/seed.js';
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
    expect((await request(app).get('/api/v1/categories')).body.categories).toHaveLength(14);
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
