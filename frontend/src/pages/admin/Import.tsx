import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, fmtDate } from '../../lib/api';
import type { Category, Resource } from '../../lib/types';
import { RESOURCE_TYPES } from '../../lib/types';
import { PageHeader } from '../../components/common';

interface Preview {
  name: string; fullName: string; summary: string | null; ownerName: string | null; sourceUrl: string; language: string | null;
  topics: string[]; licenseSpdx: string | null; stars: number | null; forks: number | null; archived: boolean; lastCommitAt: string | null;
}

export default function Import() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const [url, setUrl] = useState('');
  const [opts, setOpts] = useState({ categoryId: '', resourceType: 'repository', tags: '', summary: '', installation: '', publish: false, safetyStatus: 'unreviewed' });
  const cats = useQuery({ queryKey: ['admin-categories'], queryFn: () => api<{ categories: Category[] }>('/admin/categories') });
  const preview = useMutation({
    mutationFn: () => api<{ preview: Preview; duplicate: { id: string; name: string } | null }>('/admin/imports/github/preview', { method: 'POST', body: { url } }),
    onSuccess: (d) =>
      setOpts((o) => ({
        ...o,
        categoryId: o.categoryId || cats.data?.categories[0]?.id || '',
        tags: d.preview.topics.slice(0, 8).join(', '),
        summary: d.preview.summary?.slice(0, 300) ?? '',
      })),
  });
  const create = useMutation({
    mutationFn: () =>
      api<{ resource: Resource }>('/admin/imports/github', {
        method: 'POST',
        body: {
          url,
          categoryId: opts.categoryId,
          resourceType: opts.resourceType,
          tags: opts.tags.split(',').map((t) => t.trim()).filter(Boolean),
          summary: opts.summary.trim() || undefined,
          installation: opts.installation.trim() || null,
          publish: opts.publish,
          safetyStatus: opts.safetyStatus,
        },
      }),
    onSuccess: (d) => {
      qc.invalidateQueries();
      nav(`/admin/resources/${d.resource.id}/edit`);
    },
  });

  const p = preview.data?.preview;
  const dup = preview.data?.duplicate;

  return (
    <>
      <PageHeader title="Import from GitHub" subtitle="Fetches public metadata via the official GitHub API. Only github.com URLs are accepted; no code is downloaded or run." />
      <form
        className="card mb-6 flex flex-col gap-2 p-5 sm:flex-row"
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          create.reset();
          preview.mutate();
        }}
      >
        <label htmlFor="imp-url" className="sr-only">GitHub repository URL</label>
        <input id="imp-url" className="input flex-1" required placeholder="https://github.com/owner/repo  or  owner/repo" value={url} onChange={(e) => setUrl(e.target.value)} />
        <button className="btn-primary" disabled={preview.isPending}>{preview.isPending ? 'Fetching…' : 'Fetch preview'}</button>
      </form>
      {preview.error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{(preview.error as Error).message}</p>}

      {p && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card p-5">
            <h2 className="mb-1 text-lg font-semibold">{p.fullName}</h2>
            <p className="mb-4 text-sm text-slate-600">{p.summary ?? <em>No description provided</em>}</p>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <dt className="text-slate-500">License</dt><dd>{p.licenseSpdx ?? <span className="text-amber-700">Unknown</span>}</dd>
              <dt className="text-slate-500">Language</dt><dd>{p.language ?? 'Not provided'}</dd>
              <dt className="text-slate-500">Stars / forks</dt><dd>{p.stars ?? '—'} / {p.forks ?? '—'}</dd>
              <dt className="text-slate-500">Last push</dt><dd>{fmtDate(p.lastCommitAt)}</dd>
              <dt className="text-slate-500">Archived</dt><dd>{p.archived ? 'Yes' : 'No'}</dd>
            </dl>
            {p.topics.length > 0 && <div className="mt-3 flex flex-wrap gap-1">{p.topics.map((t) => <span key={t} className="chip">{t}</span>)}</div>}
            {dup && (
              <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
                Duplicate: already in catalog as <Link className="underline" to={`/admin/resources/${dup.id}/edit`}>{dup.name}</Link>.
              </p>
            )}
          </div>
          {!dup && (
            <form
              className="card space-y-4 p-5"
              onSubmit={(e) => {
                e.preventDefault();
                create.mutate();
              }}
            >
              <h2 className="font-semibold">Review & save</h2>
              <div>
                <label className="label" htmlFor="imp-cat">Category</label>
                <select id="imp-cat" className="input" value={opts.categoryId} onChange={(e) => setOpts({ ...opts, categoryId: e.target.value })}>
                  {cats.data?.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="imp-type">Resource type</label>
                <select id="imp-type" className="input" value={opts.resourceType} onChange={(e) => setOpts({ ...opts, resourceType: e.target.value })}>
                  {Object.entries(RESOURCE_TYPES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="imp-sum">Summary</label>
                <input id="imp-sum" className="input" maxLength={300} value={opts.summary} onChange={(e) => setOpts({ ...opts, summary: e.target.value })} />
              </div>
              <div>
                <label className="label" htmlFor="imp-tags">Tags (comma separated)</label>
                <input id="imp-tags" className="input" value={opts.tags} onChange={(e) => setOpts({ ...opts, tags: e.target.value })} />
              </div>
              <div>
                <label className="label" htmlFor="imp-inst">Install command (optional)</label>
                <input id="imp-inst" className="input font-mono" value={opts.installation} onChange={(e) => setOpts({ ...opts, installation: e.target.value })} />
              </div>
              <div>
                <label className="label" htmlFor="imp-safe">Safety review</label>
                <select id="imp-safe" className="input" value={opts.safetyStatus} onChange={(e) => setOpts({ ...opts, safetyStatus: e.target.value })}>
                  <option value="unreviewed">Unreviewed</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="flagged">Flagged</option>
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={opts.publish} onChange={(e) => setOpts({ ...opts, publish: e.target.checked })} />
                Publish immediately (otherwise saved as draft)
              </label>
              {create.error && <p role="alert" className="text-sm text-red-700">{(create.error as Error).message}</p>}
              <button className="btn-primary w-full" disabled={create.isPending}>{create.isPending ? 'Saving…' : opts.publish ? 'Import & publish' : 'Import as draft'}</button>
            </form>
          )}
        </div>
      )}
    </>
  );
}
