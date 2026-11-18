import bcrypt from 'bcryptjs';
import { getDb, resetDb, uuid } from './db.js';
import { createResource, findDuplicate } from './resourceRepo.js';
import { CATEGORIES, RESOURCES } from './seedData.js';

/**
 * Insert curated categories/resources that are not in the DB yet.
 * Never updates or deletes existing rows, so it is safe to run on a live DB.
 */
export function addCatalog() {
  const db = getDb();
  const catIds = new Map<string, string>();
  let newCats = 0;
  for (const c of CATEGORIES) {
    const existing = db.prepare('SELECT id FROM categories WHERE slug = ?').get(c.slug) as { id: string } | undefined;
    if (existing) {
      catIds.set(c.slug, existing.id);
      continue;
    }
    const id = uuid();
    db.prepare('INSERT INTO categories (id, name, slug, description, icon) VALUES (?,?,?,?,?)').run(id, c.name, c.slug, c.description, c.icon);
    catIds.set(c.slug, id);
    newCats++;
  }

  const todo = RESOURCES.filter((r) => !findDuplicate(`https://github.com/${r.repo}`));
  // Spread created_at so "Latest" has a stable order.
  const base = Date.now() - todo.length * 3600_000;
  todo.forEach((r, i) => {
    const categoryId = catIds.get(r.category);
    if (!categoryId) throw new Error(`Seed resource ${r.repo} references unknown category ${r.category}`);
    const [owner, repoName] = r.repo.split('/');
    const row = createResource({
      name: r.name ?? repoName,
      summary: r.summary,
      resourceType: r.type,
      categoryId,
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
  return { categories: newCats, resources: todo.length };
}

export function seed({ quiet = false } = {}) {
  resetDb();
  const db = getDb();
  const added = addCatalog();

  const adminEmail = 'admin@virtualskills.local';
  db.prepare(`INSERT INTO users (id, name, email, password_hash, role) VALUES (?,?,?,?,'admin')`).run(
    uuid(),
    'Admin',
    adminEmail,
    bcrypt.hashSync('ChangeMe123!', 12),
  );
  if (!quiet) {
    console.log(`Seeded ${added.categories} categories, ${added.resources} resources.`);
    console.log(`Admin login: ${adminEmail} / ChangeMe123!  (dev only — change it)`);
    console.log('Stars/license/last-commit are filled by GitHub sync (runs ~15s after server start, or Admin → Sync now).');
  }
}

if (process.argv[1] && /seed\.(ts|js)$/.test(process.argv[1])) {
  if (process.argv.includes('--add')) {
    const added = addCatalog();
    console.log(`Added ${added.categories} new categories, ${added.resources} new resources (existing data untouched).`);
  } else {
    seed();
  }
}
