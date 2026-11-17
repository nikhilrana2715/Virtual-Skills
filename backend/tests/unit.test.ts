import { describe, expect, it } from 'vitest';
import { parseGithubIdentifier, normalizeGithubRepo } from '../src/providers/github/github.js';
import { canonicalizeUrl, slugify } from '../src/utils/url.js';
import { decideDownload, licenseLabel } from '../src/utils/downloadPolicy.js';

describe('parseGithubIdentifier', () => {
  it('accepts github URLs and owner/repo', () => {
    expect(parseGithubIdentifier('https://github.com/anthropics/skills')).toEqual({ owner: 'anthropics', repo: 'skills' });
    expect(parseGithubIdentifier('https://www.github.com/a/b.git')).toEqual({ owner: 'a', repo: 'b' });
    expect(parseGithubIdentifier('https://github.com/a/b/tree/main/x')).toEqual({ owner: 'a', repo: 'b' });
    expect(parseGithubIdentifier('owner/repo')).toEqual({ owner: 'owner', repo: 'repo' });
  });
  it('rejects other hosts, schemes and tricks (SSRF)', () => {
    for (const bad of [
      'https://gitlab.com/a/b',
      'https://github.com.evil.com/a/b',
      'https://evil.com/github.com/a/b',
      'file:///etc/passwd',
      'javascript:alert(1)',
      'https://user:pw@github.com/a/b',
      'https://github.com:8080/a/b',
      'https://github.com/onlyowner',
      'https://github.com/a/..',
      'http://169.254.169.254/latest',
      '',
    ]) {
      expect(parseGithubIdentifier(bad), bad).toBeNull();
    }
  });
});

describe('normalizeGithubRepo', () => {
  const base = {
    id: 1, name: 'r', full_name: 'o/r', description: 'd', html_url: 'https://github.com/o/r', clone_url: 'https://github.com/o/r.git',
    homepage: 'javascript:alert(1)', default_branch: 'main', language: 'Go', topics: ['x'], stargazers_count: 5, forks_count: 1,
    open_issues_count: 0, archived: false, pushed_at: '2025-01-01T00:00:00Z', owner: { login: 'o' },
  };
  it('maps NOASSERTION license to null and drops unsafe homepage', () => {
    const n = normalizeGithubRepo({ ...base, license: { spdx_id: 'NOASSERTION', url: null } });
    expect(n.licenseSpdx).toBeNull();
    expect(n.documentationUrl).toBeNull();
    expect(n.downloadUrl).toBe('https://github.com/o/r/archive/refs/heads/main.zip');
  });
  it('keeps real SPDX license', () => {
    expect(normalizeGithubRepo({ ...base, license: { spdx_id: 'MIT', url: null } }).licenseSpdx).toBe('MIT');
  });
});

describe('canonicalizeUrl', () => {
  it('normalizes for duplicate detection', () => {
    expect(canonicalizeUrl('https://www.GitHub.com/Foo/Bar.git/')).toBe('https://github.com/foo/bar');
    expect(canonicalizeUrl('http://github.com/foo/bar?tab=readme#x')).toBe('https://github.com/foo/bar');
    expect(canonicalizeUrl('ftp://x/y')).toBeNull();
    expect(canonicalizeUrl('not a url')).toBeNull();
  });
});

describe('download policy', () => {
  it('blocks download when license unknown', () => {
    expect(decideDownload({ downloadUrl: 'https://github.com/a/b/archive/x.zip', licenseSpdx: null }).allowed).toBe(false);
    expect(decideDownload({ downloadUrl: 'https://github.com/a/b/archive/x.zip', licenseSpdx: 'NOASSERTION' }).allowed).toBe(false);
  });
  it('blocks download when provider has no download', () => {
    expect(decideDownload({ downloadUrl: null, licenseSpdx: 'MIT' }).allowed).toBe(false);
  });
  it('allows source-hosted download with known license', () => {
    const d = decideDownload({ downloadUrl: 'https://github.com/a/b/archive/x.zip', licenseSpdx: 'Apache-2.0' });
    expect(d.allowed).toBe(true);
    expect(d.label).toBe('Download ZIP (Source-hosted)');
  });
  it('labels unknown honestly', () => {
    expect(licenseLabel(null)).toBe('License: Unknown — check source terms');
    expect(licenseLabel('MIT')).toBe('License: MIT');
  });
});

describe('slugify', () => {
  it('makes url-safe slugs', () => {
    expect(slugify('LlamaIndex: RAG & More!')).toBe('llamaindex-rag-more');
    expect(slugify('!!!')).toBe('resource');
  });
});
