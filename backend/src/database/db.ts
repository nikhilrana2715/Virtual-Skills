import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { env } from '../config/env.js';

let db: DatabaseSync | null = null;

export const RESOURCE_TYPES = [
  'repository', 'skill', 'mcp_server', 'ai_agent', 'model', 'dataset', 'framework',
  'library', 'tool', 'workflow', 'paper_implementation', 'documentation',
] as const;
export type ResourceType = (typeof RESOURCE_TYPES)[number];

const SCHEMA = `
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  parent_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS resources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  summary TEXT NOT NULL,
  description TEXT,
  resource_type TEXT NOT NULL,
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  provider TEXT NOT NULL,
  provider_resource_id TEXT,
  owner_name TEXT,
  source_url TEXT NOT NULL,
  canonical_url TEXT NOT NULL UNIQUE,
  clone_url TEXT,
  download_url TEXT,
  documentation_url TEXT,
  language TEXT,
  platforms TEXT,
  license_spdx TEXT,
  license_url TEXT,
  topics TEXT,
  stars INTEGER,
  forks INTEGER,
  open_issues INTEGER,
  archived_by_source INTEGER NOT NULL DEFAULT 0,
  installation TEXT,
  compatibility TEXT,
  last_commit_at TEXT,
  last_synced_at TEXT,
  sync_error TEXT,
  verification_status TEXT NOT NULL DEFAULT 'unreviewed' CHECK (verification_status IN ('unreviewed','verified','rejected')),
  safety_status TEXT NOT NULL DEFAULT 'unreviewed' CHECK (safety_status IN ('unreviewed','reviewed','flagged')),
  publication_status TEXT NOT NULL DEFAULT 'draft' CHECK (publication_status IN ('draft','published','archived')),
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_resources_provider_id ON resources(provider, provider_resource_id) WHERE provider_resource_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ix_resources_category ON resources(category_id);
CREATE INDEX IF NOT EXISTS ix_resources_type ON resources(resource_type);
CREATE INDEX IF NOT EXISTS ix_resources_pub ON resources(publication_status);
CREATE INDEX IF NOT EXISTS ix_resources_lang ON resources(language);
CREATE INDEX IF NOT EXISTS ix_resources_license ON resources(license_spdx);

CREATE TABLE IF NOT EXISTS resource_tags (
  resource_id TEXT NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (resource_id, tag_id)
);

CREATE TABLE IF NOT EXISTS bookmarks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resource_id TEXT NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE (user_id, resource_id)
);

CREATE TABLE IF NOT EXISTS sync_jobs (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  kind TEXT NOT NULL,
  status TEXT NOT NULL,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  items_processed INTEGER NOT NULL DEFAULT 0,
  items_failed INTEGER NOT NULL DEFAULT 0,
  error_summary TEXT
);

CREATE TABLE IF NOT EXISTS resource_reports (
  id TEXT PRIMARY KEY,
  resource_id TEXT NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  actor_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  metadata TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
`;

export function getDb(): DatabaseSync {
  if (db) return db;
  if (env.databaseFile !== ':memory:') {
    fs.mkdirSync(path.dirname(env.databaseFile), { recursive: true });
  }
  db = new DatabaseSync(env.databaseFile);
  db.exec(SCHEMA);
  return db;
}

export function resetDb(): void {
  const d = getDb();
  d.exec(`
    DROP TABLE IF EXISTS audit_logs; DROP TABLE IF EXISTS contact_messages; DROP TABLE IF EXISTS resource_reports; DROP TABLE IF EXISTS sync_jobs;
    DROP TABLE IF EXISTS bookmarks; DROP TABLE IF EXISTS resource_tags; DROP TABLE IF EXISTS resources;
    DROP TABLE IF EXISTS tags; DROP TABLE IF EXISTS categories; DROP TABLE IF EXISTS users;
  `);
  d.exec(SCHEMA);
}

export function tx<T>(fn: () => T): T {
  const d = getDb();
  d.exec('BEGIN');
  try {
    const r = fn();
    d.exec('COMMIT');
    return r;
  } catch (e) {
    d.exec('ROLLBACK');
    throw e;
  }
}

export const now = () => new Date().toISOString();
export const uuid = () => crypto.randomUUID();
