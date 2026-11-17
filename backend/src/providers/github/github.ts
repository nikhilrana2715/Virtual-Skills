import { env } from '../../config/env.js';
import { ProviderError, type NormalizedResource, type RepositoryProvider } from '../types.js';

const ALLOWED_HOSTS = new Set(['github.com', 'www.github.com']);
const NAME_RE = /^[A-Za-z0-9_.-]{1,100}$/;
const API = 'https://api.github.com';
const TIMEOUT_MS = 8000;
const MAX_BYTES = 512 * 1024;

/** Parse "owner/repo" or a github.com URL. Rejects any other host (SSRF guard). */
export function parseGithubIdentifier(input: string): { owner: string; repo: string } | null {
  const raw = input.trim();
  let owner: string | undefined;
  let repo: string | undefined;
  if (/^[^/\s]+\/[^/\s]+$/.test(raw) && !raw.includes(':')) {
    [owner, repo] = raw.split('/');
  } else {
    let u: URL;
    try {
      u = new URL(raw);
    } catch {
      return null;
    }
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
    if (!ALLOWED_HOSTS.has(u.hostname.toLowerCase())) return null;
    if (u.username || u.password || (u.port && u.port !== '443')) return null;
    [owner, repo] = u.pathname.split('/').filter(Boolean);
  }
  if (!owner || !repo) return null;
  repo = repo.replace(/\.git$/i, '');
  if (!NAME_RE.test(owner) || !NAME_RE.test(repo) || repo === '.' || repo === '..') return null;
  return { owner, repo };
}

interface GhRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  clone_url: string;
  homepage: string | null;
  default_branch: string;
  language: string | null;
  topics?: string[];
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  archived: boolean;
  pushed_at: string | null;
  owner: { login: string };
  license: { spdx_id: string | null; url: string | null } | null;
}

export function normalizeGithubRepo(r: GhRepo): NormalizedResource {
  const spdx = r.license?.spdx_id && r.license.spdx_id !== 'NOASSERTION' ? r.license.spdx_id : null;
  const homepage = r.homepage && /^https?:\/\//i.test(r.homepage) ? r.homepage : null;
  return {
    provider: 'github',
    providerResourceId: String(r.id),
    name: r.name,
    fullName: r.full_name,
    summary: r.description,
    ownerName: r.owner?.login ?? null,
    sourceUrl: r.html_url,
    cloneUrl: r.clone_url ?? null,
    // GitHub officially serves branch archives; policy layer still gates on license.
    downloadUrl: `${r.html_url}/archive/refs/heads/${encodeURIComponent(r.default_branch)}.zip`,
    documentationUrl: homepage,
    language: r.language,
    topics: Array.isArray(r.topics) ? r.topics.slice(0, 20) : [],
    licenseSpdx: spdx,
    licenseUrl: spdx ? `https://spdx.org/licenses/${spdx}.html` : null,
    stars: r.stargazers_count ?? null,
    forks: r.forks_count ?? null,
    openIssues: r.open_issues_count ?? null,
    archived: !!r.archived,
    lastCommitAt: r.pushed_at,
  };
}

async function ghFetch(path: string): Promise<unknown> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'virtual-skills-catalog',
  };
  if (env.githubToken) headers.Authorization = `Bearer ${env.githubToken}`;
  let res: Response;
  try {
    // Renamed repos answer 301 → follow, but only if we stay on api.github.com (SSRF guard).
    res = await fetch(`${API}${path}`, { headers, redirect: 'follow', signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (e) {
    throw new ProviderError(`GitHub request failed: ${(e as Error).message}`, 502, 'upstream');
  }
  if (new URL(res.url).hostname !== 'api.github.com') {
    throw new ProviderError('GitHub redirected to an unexpected host', 502, 'upstream');
  }
  if (res.status === 404) throw new ProviderError('Repository not found on GitHub', 404, 'not_found');
  if (res.status === 403 || res.status === 429) {
    const reset = res.headers.get('x-ratelimit-reset');
    const when = reset ? ` Resets at ${new Date(Number(reset) * 1000).toISOString()}.` : '';
    throw new ProviderError(`GitHub rate limit reached.${when}`, 429, 'rate_limited');
  }
  if (!res.ok) throw new ProviderError(`GitHub returned ${res.status}`, 502, 'upstream');
  if (!(res.headers.get('content-type') ?? '').includes('application/json')) {
    throw new ProviderError('Unexpected content type from GitHub', 502, 'upstream');
  }
  const text = await res.text();
  if (text.length > MAX_BYTES) throw new ProviderError('GitHub response too large', 502, 'upstream');
  return JSON.parse(text);
}

export const githubProvider: RepositoryProvider & {
  fetchById(id: string): Promise<NormalizedResource>;
} = {
  name: 'github',
  validateSourceUrl: (url) => parseGithubIdentifier(url) !== null,
  async fetchResource(identifier) {
    const parsed = parseGithubIdentifier(identifier);
    if (!parsed) throw new ProviderError('Not a valid github.com repository URL', 400, 'invalid');
    const data = (await ghFetch(`/repos/${parsed.owner}/${parsed.repo}`)) as GhRepo;
    return normalizeGithubRepo(data);
  },
  async fetchById(id) {
    if (!/^\d{1,15}$/.test(id)) throw new ProviderError('Invalid GitHub repository id', 400, 'invalid');
    const data = (await ghFetch(`/repositories/${id}`)) as GhRepo;
    return normalizeGithubRepo(data);
  },
};
