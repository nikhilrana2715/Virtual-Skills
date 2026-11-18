import type { SQLInputValue } from 'node:sqlite';
import { getDb, now, uuid, tx } from './db.js';
import { decideDownload, licenseLabel } from '../utils/downloadPolicy.js';
import { canonicalizeUrl, slugify } from '../utils/url.js';

type Row = Record<string, any>;

export interface ResourceFilters {
  q?: string;
  category?: string;
  type?: string;
  provider?: string;
  language?: string;
  license?: string;
  verified?: boolean;
  updatedWithinDays?: number;
  status?: string; // admin only
  sort?: 'relevance' | 'recent' | 'updated' | 'stars' | 'name';
  page?: number;
  limit?: number;
}

const BASE_SELECT = `
  SELECT r.*, c.name AS category_name, c.slug AS category_slug,
    (SELECT json_group_array(json_object('name', t.name, 'slug', t.slug))
       FROM resource_tags rt JOIN tags t ON t.id = rt.tag_id WHERE rt.resource_id = r.id) AS tags_json
  FROM resources r JOIN categories c ON c.id = r.category_id`;

function parseJsonArray(v: unknown): any[] {
  if (typeof v !== 'string' || !v) return [];
  try {
    const p = JSON.parse(v);
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}

export function toApi(row: Row, opts: { admin?: boolean } = {}) {
  const dl = decideDownload({
    downloadUrl: row.download_url,
    licenseSpdx: row.license_spdx,
    archivedBySource: !!row.archived_by_source,
  });
  const out: Record<string, unknown> = {
    id: row.id,
    name: row.name,
    slug: row.slug,
    summary: row.summary,
    description: row.description,
    resourceType: row.resource_type,
    category: { name: row.category_name, slug: row.category_slug },
    tags: parseJsonArray(row.tags_json),
    provider: row.provider,
    ownerName: row.owner_name,
    sourceUrl: row.source_url,
    cloneUrl: row.clone_url,
    documentationUrl: row.documentation_url,
    language: row.language,
    platforms: parseJsonArray(row.platforms),
    topics: parseJsonArray(row.topics),
    license: row.license_spdx,
    licenseLabel: licenseLabel(row.license_spdx),
    licenseUrl: row.license_url,
    stars: row.stars,
    forks: row.forks,
    openIssues: row.open_issues,
    archivedBySource: !!row.archived_by_source,
    installation: row.installation,
    compatibility: row.compatibility,
    lastCommitAt: row.last_commit_at,
    lastSyncedAt: row.last_synced_at,
    verificationStatus: row.verification_status,
    safetyStatus: row.safety_status,
    download: dl,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
  if (opts.admin) {
    out.publicationStatus = row.publication_status;
    out.providerResourceId = row.provider_resource_id;
    out.downloadUrlRaw = row.download_url;
    out.syncError = row.sync_error;
    out.viewCount = row.view_count;
    out.categoryId = row.category_id;
  }
  return out;
}

export function listResources(f: ResourceFilters, opts: { admin?: boolean } = {}) {
  const db = getDb();
  const where: string[] = [];
  const params: SQLInputValue[] = [];

  if (opts.admin) {
    if (f.status) {
      where.push('r.publication_status = ?');
      params.push(f.status);
    }
  } else {
    where.push(`r.publication_status = 'published'`);
  }
  const q = f.q?.trim().toLowerCase();
  if (q) {
    const like = `%${q.replace(/[\\%_]/g, (m) => '\\' + m)}%`;
    where.push(`(
      lower(r.name) LIKE ? ESCAPE '\\' OR lower(r.summary) LIKE ? ESCAPE '\\' OR lower(coalesce(r.description,'')) LIKE ? ESCAPE '\\'
      OR lower(coalesce(r.topics,'')) LIKE ? ESCAPE '\\' OR lower(coalesce(r.language,'')) LIKE ? ESCAPE '\\'
      OR lower(coalesce(r.owner_name,'')) LIKE ? ESCAPE '\\' OR lower(c.name) LIKE ? ESCAPE '\\'
      OR EXISTS (SELECT 1 FROM resource_tags rt JOIN tags t ON t.id = rt.tag_id
                 WHERE rt.resource_id = r.id AND lower(t.name) LIKE ? ESCAPE '\\'))`);
    params.push(like, like, like, like, like, like, like, like);
  }
  if (f.category) {
    // One slug, or a comma-separated list (used by the Repository page's section tabs).
    const slugs = [...new Set(f.category.split(',').map((s) => s.trim()).filter(Boolean))];
    if (slugs.length) {
      where.push(`c.slug IN (${slugs.map(() => '?').join(',')})`);
      params.push(...slugs);
    }
  }
  if (f.type) {
    where.push('r.resource_type = ?');
    params.push(f.type);
  }
  if (f.provider) {
    where.push('r.provider = ?');
    params.push(f.provider);
  }
  if (f.language) {
    where.push('lower(r.language) = lower(?)');
    params.push(f.language);
  }
  if (f.license) {
    if (f.license === 'unknown') where.push(`(r.license_spdx IS NULL OR r.license_spdx = '')`);
    else {
      where.push('r.license_spdx = ?');
      params.push(f.license);
    }
  }
  if (f.verified) where.push(`r.verification_status = 'verified'`);
  if (f.updatedWithinDays) {
    where.push(`coalesce(r.last_commit_at, r.updated_at) >= ?`);
    params.push(new Date(Date.now() - f.updatedWithinDays * 86400000).toISOString());
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const sort = f.sort ?? (q ? 'relevance' : 'recent');
  let order: string;
  const orderParams: SQLInputValue[] = [];
  switch (sort) {
    case 'relevance':
      if (q) {
        order = `CASE WHEN lower(r.name) = ? THEN 0 WHEN lower(r.name) LIKE ? THEN 1 WHEN lower(r.name) LIKE ? THEN 2 ELSE 3 END, coalesce(r.stars,-1) DESC, r.name`;
        orderParams.push(q, `${q}%`, `%${q}%`);
      } else order = 'coalesce(r.stars,-1) DESC, r.name';
      break;
    case 'updated':
      order = 'coalesce(r.last_commit_at, r.updated_at) DESC';
      break;
    case 'stars':
      order = 'r.stars IS NULL, r.stars DESC, r.name';
      break;
    case 'name':
      order = 'r.name COLLATE NOCASE ASC';
      break;
    default:
      order = 'r.created_at DESC, r.name';
  }
  const limit = Math.min(Math.max(f.limit ?? 20, 1), 50);
  const page = Math.max(f.page ?? 1, 1);

  const total = (
    db.prepare(`SELECT count(*) AS n FROM resources r JOIN categories c ON c.id = r.category_id ${whereSql}`).get(...params) as Row
  ).n as number;
  const rows = db
    .prepare(`${BASE_SELECT} ${whereSql} ORDER BY ${order} LIMIT ? OFFSET ?`)
    .all(...params, ...orderParams, limit, (page - 1) * limit) as Row[];

  return { items: rows.map((r) => toApi(r, opts)), total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

export function getResourceRow(by: { slug?: string; id?: string }): Row | undefined {
  const db = getDb();
  if (by.slug) return db.prepare(`${BASE_SELECT} WHERE r.slug = ?`).get(by.slug) as Row | undefined;
  return db.prepare(`${BASE_SELECT} WHERE r.id = ?`).get(by.id!) as Row | undefined;
}

export function incrementView(id: string) {
  getDb().prepare('UPDATE resources SET view_count = view_count + 1 WHERE id = ?').run(id);
}

/** Transparent trending score (blueprint §14) — not only stars. */
export function trendingScore(row: Row): number {
  const days = row.last_commit_at ? (Date.now() - Date.parse(row.last_commit_at)) / 86400000 : 9999;
  let s = 0;
  if (days <= 30) s += 3;
  else if (days <= 90) s += 2;
  else if (days <= 365) s += 1;
  if (row.verification_status === 'verified') s += 2;
  if (row.license_spdx) s += 1;
  if (row.documentation_url || row.installation) s += 1;
  if (row.stars) s += Math.min(Math.log10(row.stars + 1), 5);
  if (row.archived_by_source) s -= 3;
  s += Math.min(row.view_count / 50, 1);
  return Math.round(s * 100) / 100;
}

export function trending(limit = 12) {
  const rows = getDb().prepare(`${BASE_SELECT} WHERE r.publication_status = 'published'`).all() as Row[];
  return rows
    .map((r) => ({ r, score: trendingScore(r) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ r, score }) => ({ ...toApi(r), trendingScore: score }));
}

export function related(row: Row, limit = 4) {
  const rows = getDb()
    .prepare(
      `${BASE_SELECT} WHERE r.publication_status = 'published' AND r.id != ? AND (r.category_id = ? OR r.resource_type = ?)
       ORDER BY (r.category_id = ?) DESC, coalesce(r.stars,-1) DESC LIMIT ?`,
    )
    .all(row.id, row.category_id, row.resource_type, row.category_id, limit) as Row[];
  return rows.map((r) => toApi(r));
}

export function facets() {
  const db = getDb();
  const pub = `WHERE publication_status = 'published'`;
  const col = (c: string) =>
    (db.prepare(`SELECT ${c} AS v, count(*) AS n FROM resources ${pub} AND ${c} IS NOT NULL GROUP BY ${c} ORDER BY n DESC`).all() as Row[]).map(
      (r) => ({ value: r.v as string, count: r.n as number }),
    );
  return { languages: col('language'), licenses: col('license_spdx'), providers: col('provider'), types: col('resource_type') };
}

export interface ResourceInput {
  name: string;
  summary: string;
  description?: string | null;
  resourceType: string;
  categoryId: string;
  provider: string;
  providerResourceId?: string | null;
  ownerName?: string | null;
  sourceUrl: string;
  cloneUrl?: string | null;
  downloadUrl?: string | null;
  documentationUrl?: string | null;
  language?: string | null;
  platforms?: string[];
  licenseSpdx?: string | null;
  licenseUrl?: string | null;
  topics?: string[];
  stars?: number | null;
  forks?: number | null;
  openIssues?: number | null;
  archivedBySource?: boolean;
  installation?: string | null;
  compatibility?: string | null;
  lastCommitAt?: string | null;
  lastSyncedAt?: string | null;
  tags?: string[];
  publicationStatus?: 'draft' | 'published' | 'archived';
  verificationStatus?: 'unreviewed' | 'verified' | 'rejected';
  safetyStatus?: 'unreviewed' | 'reviewed' | 'flagged';
}

export class DuplicateError extends Error {
  constructor(public existing: { id: string; slug: string; name: string }) {
    super('Duplicate resource');
  }
}

export function findDuplicate(sourceUrl: string, provider?: string, providerResourceId?: string | null, excludeId?: string) {
  const db = getDb();
  const canon = canonicalizeUrl(sourceUrl);
  const row = db
    .prepare(
      `SELECT id, slug, name FROM resources
       WHERE (canonical_url = ? OR (? IS NOT NULL AND provider = ? AND provider_resource_id = ?)) AND id != ?`,
    )
    .get(canon, providerResourceId ?? null, provider ?? null, providerResourceId ?? null, excludeId ?? '') as Row | undefined;
  return row as { id: string; slug: string; name: string } | undefined;
}

function uniqueSlug(base: string, excludeId?: string): string {
  const db = getDb();
  let slug = slugify(base);
  let i = 2;
  while (db.prepare('SELECT 1 FROM resources WHERE slug = ? AND id != ?').get(slug, excludeId ?? '')) {
    slug = `${slugify(base)}-${i++}`;
  }
  return slug;
}

export function ensureTags(names: string[]): string[] {
  const db = getDb();
  const ids: string[] = [];
  for (const raw of names) {
    const name = raw.trim().slice(0, 40);
    if (!name) continue;
    const slug = slugify(name);
    let row = db.prepare('SELECT id FROM tags WHERE slug = ?').get(slug) as Row | undefined;
    if (!row) {
      const id = uuid();
      db.prepare('INSERT INTO tags (id, name, slug) VALUES (?, ?, ?)').run(id, name, slug);
      row = { id };
    }
    if (!ids.includes(row.id)) ids.push(row.id);
  }
  return ids;
}

const j = (a?: string[]) => (a && a.length ? JSON.stringify(a) : null);

export function createResource(input: ResourceInput): Row {
  const canon = canonicalizeUrl(input.sourceUrl);
  if (!canon) throw new Error('Invalid source URL');
  const dup = findDuplicate(input.sourceUrl, input.provider, input.providerResourceId);
  if (dup) throw new DuplicateError(dup);
  const id = uuid();
  const ts = now();
  return tx(() => {
    getDb()
      .prepare(
        `INSERT INTO resources (id, name, slug, summary, description, resource_type, category_id, provider, provider_resource_id,
          owner_name, source_url, canonical_url, clone_url, download_url, documentation_url, language, platforms, license_spdx,
          license_url, topics, stars, forks, open_issues, archived_by_source, installation, compatibility, last_commit_at,
          last_synced_at, verification_status, safety_status, publication_status, created_at, updated_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      )
      .run(
        id, input.name, uniqueSlug(input.name), input.summary, input.description ?? null, input.resourceType, input.categoryId,
        input.provider, input.providerResourceId ?? null, input.ownerName ?? null, input.sourceUrl, canon,
        input.cloneUrl ?? null, input.downloadUrl ?? null, input.documentationUrl ?? null, input.language ?? null,
        j(input.platforms), input.licenseSpdx || null, input.licenseUrl ?? null, j(input.topics), input.stars ?? null,
        input.forks ?? null, input.openIssues ?? null, input.archivedBySource ? 1 : 0, input.installation ?? null,
        input.compatibility ?? null, input.lastCommitAt ?? null, input.lastSyncedAt ?? null,
        input.verificationStatus ?? 'unreviewed', input.safetyStatus ?? 'unreviewed', input.publicationStatus ?? 'draft', ts, ts,
      );
    setTags(id, input.tags ?? []);
    return getResourceRow({ id })!;
  });
}

function setTags(resourceId: string, names: string[]) {
  const db = getDb();
  db.prepare('DELETE FROM resource_tags WHERE resource_id = ?').run(resourceId);
  for (const tid of ensureTags(names)) {
    db.prepare('INSERT OR IGNORE INTO resource_tags (resource_id, tag_id) VALUES (?, ?)').run(resourceId, tid);
  }
}

const COLUMN_MAP: Record<string, string> = {
  name: 'name', summary: 'summary', description: 'description', resourceType: 'resource_type', categoryId: 'category_id',
  provider: 'provider', providerResourceId: 'provider_resource_id', ownerName: 'owner_name', cloneUrl: 'clone_url',
  downloadUrl: 'download_url', documentationUrl: 'documentation_url', language: 'language', licenseSpdx: 'license_spdx',
  licenseUrl: 'license_url', stars: 'stars', forks: 'forks', openIssues: 'open_issues', installation: 'installation',
  compatibility: 'compatibility', lastCommitAt: 'last_commit_at', lastSyncedAt: 'last_synced_at',
  publicationStatus: 'publication_status', verificationStatus: 'verification_status', safetyStatus: 'safety_status',
};

export function updateResource(id: string, patch: Partial<ResourceInput> & { syncError?: string | null }): Row {
  const db = getDb();
  const sets: string[] = [];
  const params: SQLInputValue[] = [];
  for (const [k, v] of Object.entries(patch)) {
    if (k in COLUMN_MAP) {
      sets.push(`${COLUMN_MAP[k]} = ?`);
      params.push((v === '' && k === 'licenseSpdx' ? null : v) as SQLInputValue);
    }
  }
  if (patch.platforms !== undefined) {
    sets.push('platforms = ?');
    params.push(j(patch.platforms));
  }
  if (patch.topics !== undefined) {
    sets.push('topics = ?');
    params.push(j(patch.topics));
  }
  if (patch.archivedBySource !== undefined) {
    sets.push('archived_by_source = ?');
    params.push(patch.archivedBySource ? 1 : 0);
  }
  if (patch.syncError !== undefined) {
    sets.push('sync_error = ?');
    params.push(patch.syncError);
  }
  if (patch.sourceUrl !== undefined) {
    const canon = canonicalizeUrl(patch.sourceUrl);
    if (!canon) throw new Error('Invalid source URL');
    const dup = findDuplicate(patch.sourceUrl, patch.provider, patch.providerResourceId, id);
    if (dup) throw new DuplicateError(dup);
    sets.push('source_url = ?', 'canonical_url = ?');
    params.push(patch.sourceUrl, canon);
  }
  if (patch.name !== undefined) {
    sets.push('slug = ?');
    params.push(uniqueSlug(patch.name, id));
  }
  return tx(() => {
    if (sets.length) {
      sets.push('updated_at = ?');
      params.push(now());
      db.prepare(`UPDATE resources SET ${sets.join(', ')} WHERE id = ?`).run(...params, id);
    }
    if (patch.tags !== undefined) setTags(id, patch.tags);
    return getResourceRow({ id })!;
  });
}

export function deleteResource(id: string) {
  getDb().prepare('DELETE FROM resources WHERE id = ?').run(id);
}
