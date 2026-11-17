import bcrypt from 'bcryptjs';
import { getDb, resetDb, uuid } from './db.js';
import { createResource } from './resourceRepo.js';
import { CATEGORIES, RESOURCES } from './seedData.js';

export function seed({ quiet = false } = {}) {
  resetDb();
  const db = getDb();
  const catIds = new Map<string, string>();
  for (const c of CATEGORIES) {
    const id = uuid();
    db.prepare('INSERT INTO categories (id, name, slug, description, icon) VALUES (?,?,?,?,?)').run(id, c.name, c.slug, c.description, c.icon);
    catIds.set(c.slug, id);
  }
  // Spread created_at so "Latest" has a stable order.
  const base = Date.now() - RESOURCES.length * 3600_000;
  RESOURCES.forEach((r, i) => {
    const [owner, repoName] = r.repo.split('/');
    const row = createResource({
      name: r.name ?? repoName,
      summary: r.summary,
      resourceType: r.type,
      categoryId: catIds.get(r.category)!,
      provider: 'github',
      ownerName: owner,
      sourceUrl: `https://github.com/${r.repo}`,
      cloneUrl: `https://github.com/${r.repo}.git`,
      language: r.language ?? null,
      installation: r.installation ?? null,
      tags: r.tags,
      publicationStatus: 'published',
      verificationStatus: r.official ? 'verified' : 'unreviewed',
    });
    const ts = new Date(base + i * 3600_000).toISOString();
    db.prepare('UPDATE resources SET created_at=?, updated_at=? WHERE id=?').run(ts, ts, row.id);
  });

  const adminEmail = 'admin@virtualskills.local';
  db.prepare(`INSERT INTO users (id, name, email, password_hash, role) VALUES (?,?,?,?,'admin')`).run(
    uuid(),
    'Admin',
    adminEmail,
    bcrypt.hashSync('ChangeMe123!', 12),
  );
  if (!quiet) {
    console.log(`Seeded ${CATEGORIES.length} categories, ${RESOURCES.length} resources.`);
    console.log(`Admin login: ${adminEmail} / ChangeMe123!  (dev only — change it)`);
    console.log('Stars/license/last-commit are filled by GitHub sync (runs ~15s after server start, or Admin → Sync now).');
  }
}

if (process.argv[1] && /seed\.(ts|js)$/.test(process.argv[1])) seed();
