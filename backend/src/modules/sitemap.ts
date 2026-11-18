import type { Request, Response } from 'express';
import { sitemapEntries } from '../database/contactRepo.js';
import { env } from '../config/env.js';

/** Public SPA pages. Topic slugs must match frontend/src/data/resources.json (checked by a test). */
export const STATIC_PATHS = ['/', '/about', '/resources', '/repository', '/applications', '/projects', '/contact', '/explore', '/categories', '/trending', '/latest', '/terms', '/privacy', '/licenses'];
export const TOPIC_SLUGS = [
  'ai-ml',
  'it-services',
  'cloud-storage',
  'coding-languages',
  'data-science',
  'data-analyst',
  'full-stack-development',
  'devops',
  'prompt-engineering',
  'loop-engineering',
];

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function sitemapHandler(_req: Request, res: Response) {
  const { resources, categories } = sitemapEntries();
  const url = (path: string, lastmod?: string) =>
    `  <url><loc>${esc(env.siteUrl + path)}</loc>${lastmod ? `<lastmod>${esc(lastmod.slice(0, 10))}</lastmod>` : ''}</url>`;
  const lines = [
    ...STATIC_PATHS.map((p) => url(p)),
    ...TOPIC_SLUGS.map((s) => url(`/topics/${s}`)),
    ...categories.map((c) => url(`/categories/${encodeURIComponent(c.slug)}`)),
    ...resources.map((r) => url(`/resources/${encodeURIComponent(r.slug)}`, r.updated_at)),
  ];
  res
    .type('application/xml')
    .send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${lines.join('\n')}\n</urlset>\n`);
}
