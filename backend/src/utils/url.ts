/** Lowercase host, strip www, trailing slash, .git, query and hash. Returns null for non-http(s). */
export function canonicalizeUrl(raw: string): string | null {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    return null;
  }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
  const host = u.hostname.toLowerCase().replace(/^www\./, '');
  let p = u.pathname.replace(/\/+$/, '').replace(/\.git$/i, '');
  if (host === 'github.com' || host === 'gitlab.com' || host === 'huggingface.co') p = p.toLowerCase();
  return `https://${host}${p}`;
}

/** Only http(s) links may be rendered as hrefs. */
export function isSafeHttpUrl(raw: string | null | undefined): boolean {
  if (!raw) return false;
  try {
    const u = new URL(raw);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80) || 'resource';
}
