import { getDb, uuid } from './db.js';

export type ContactStatus = 'new' | 'read' | 'archived';

export function createContactMessage(m: { name: string; email: string; subject: string; message: string; userId: string | null }) {
  const id = uuid();
  getDb()
    .prepare('INSERT INTO contact_messages (id, name, email, subject, message, user_id) VALUES (?,?,?,?,?,?)')
    .run(id, m.name, m.email, m.subject, m.message, m.userId);
  return id;
}

export function listContactMessages(limit = 200) {
  return getDb()
    .prepare(`SELECT * FROM contact_messages ORDER BY status='new' DESC, created_at DESC LIMIT ?`)
    .all(limit);
}

export function setContactStatus(id: string, status: ContactStatus): boolean {
  return getDb().prepare('UPDATE contact_messages SET status=? WHERE id=?').run(status, id).changes > 0;
}

export function deleteContactMessage(id: string): boolean {
  return getDb().prepare('DELETE FROM contact_messages WHERE id=?').run(id).changes > 0;
}

export function countNewContactMessages(): number {
  return (getDb().prepare(`SELECT count(*) n FROM contact_messages WHERE status='new'`).get() as { n: number }).n;
}

/** Published resource slugs + last change, for sitemap.xml. */
export function sitemapEntries() {
  const db = getDb();
  return {
    resources: db.prepare(`SELECT slug, updated_at FROM resources WHERE publication_status='published' ORDER BY slug`).all() as { slug: string; updated_at: string }[],
    categories: db.prepare('SELECT slug FROM categories ORDER BY slug').all() as { slug: string }[],
  };
}
