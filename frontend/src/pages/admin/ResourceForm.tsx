import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, timeAgo } from '../../lib/api';
import type { Category, Resource } from '../../lib/types';
import { RESOURCE_TYPES } from '../../lib/types';
import { ErrorState, PageHeader, Spinner, StatusBadge } from '../../components/common';

const EMPTY = {
  name: '', summary: '', description: '', resourceType: 'repository', categoryId: '', provider: 'manual', sourceUrl: '',
  documentationUrl: '', downloadUrl: '', language: '', licenseSpdx: '', installation: '', compatibility: '', tags: '', platforms: '',
  publicationStatus: 'draft', verificationStatus: 'unreviewed', safetyStatus: 'unreviewed',
};
type Form = typeof EMPTY;

function fromResource(r: Resource): Form {
  return {
    name: r.name, summary: r.summary, description: r.description ?? '', resourceType: r.resourceType, categoryId: r.categoryId ?? '',
    provider: r.provider, sourceUrl: r.sourceUrl, documentationUrl: r.documentationUrl ?? '', downloadUrl: r.downloadUrlRaw ?? '',
    language: r.language ?? '', licenseSpdx: r.license ?? '', installation: r.installation ?? '', compatibility: r.compatibility ?? '',
    tags: r.tags.map((t) => t.name).join(', '), platforms: r.platforms.join(', '),
    publicationStatus: r.publicationStatus ?? 'draft', verificationStatus: r.verificationStatus, safetyStatus: r.safetyStatus,
  };
}

const list = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean);
const orNull = (s: string) => (s.trim() ? s.trim() : null);

export default function ResourceForm() {
  const { id } = useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState<Form>(EMPTY);
  const cats = useQuery({ queryKey: ['admin-categories'], queryFn: () => api<{ categories: Category[] }>('/admin/categories') });
  const existing = useQuery({ queryKey: ['admin-resource', id], queryFn: () => api<{ resource: Resource }>(`/admin/resources/${id}`), enabled: !!id });

  useEffect(() => {
    if (existing.data) setForm(fromResource(existing.data.resource));
  }, [existing.data]);
  useEffect(() => {
    if (!id && !form.categoryId && cats.data?.categories[0]) setForm((f) => ({ ...f, categoryId: cats.data!.categories[0].id }));
  }, [cats.data, id, form.categoryId]);

  const save = useMutation({
    mutationFn: () => {
      const body = {
        name: form.name, summary: form.summary, description: orNull(form.description), resourceType: form.resourceType,
        categoryId: form.categoryId, provider: form.provider, sourceUrl: form.sourceUrl.trim(),
        documentationUrl: orNull(form.documentationUrl), downloadUrl: orNull(form.downloadUrl), language: orNull(form.language),
        licenseSpdx: orNull(form.licenseSpdx), installation: orNull(form.installation), compatibility: orNull(form.compatibility),
        tags: list(form.tags), platforms: list(form.platforms), publicationStatus: form.publicationStatus,
        verificationStatus: form.verificationStatus, safetyStatus: form.safetyStatus,
      };
      return id
        ? api<{ resource: Resource }>(`/admin/resources/${id}`, { method: 'PATCH', body })
        : api<{ resource: Resource }>('/admin/resources', { method: 'POST', body });
    },
    onSuccess: () => {
      qc.invalidateQueries();
      nav('/admin/resources');
    },
  });
  const sync = useMutation({
    mutationFn: () => api<{ resource: Resource }>(`/admin/resources/${id}/sync`, { method: 'POST' }),
    onSuccess: (d) => {
      qc.invalidateQueries();
      setForm(fromResource(d.resource));
    },
  });

  if (id && existing.isLoading) return <Spinner />;
  if (existing.error) return <ErrorState error={existing.error} />;
  const r = existing.data?.resource;

  const inp = (k: keyof Form, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <input id={`rf-${k}`} className="input" value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} {...props} />
  );
  const sel = (k: keyof Form, opts: [string, string][]) => (
    <select id={`rf-${k}`} className="input" value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })}>
      {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );
  const L = ({ k, children, hint }: { k: keyof Form; children: string; hint?: string }) => (
    <label className="label" htmlFor={`rf-${k}`}>
      {children} {hint && <span className="font-normal text-slate-400">{hint}</span>}
    </label>
  );

  const submit = (e: FormEvent) => {
    e.preventDefault();
    save.mutate();
  };

  return (
    <>
      <PageHeader title={id ? `Edit: ${r?.name}` : 'Add resource'} subtitle={id ? undefined : 'Required: name, type, category, source URL, summary, provider.'}>
        {r && (
          <div className="flex items-center gap-2">
            <StatusBadge value={r.publicationStatus!} />
            {r.provider === 'github' && (
              <button className="btn-secondary" disabled={sync.isPending} onClick={() => sync.mutate()}>
                {sync.isPending ? 'Syncing…' : 'Refresh from GitHub'}
              </button>
            )}
          </div>
        )}
      </PageHeader>
      {r && (
        <p className="mb-4 text-xs text-slate-500">
          Last synced: {r.lastSyncedAt ? timeAgo(r.lastSyncedAt) : 'never'} {r.syncError && <span className="text-red-700">· Sync error: {r.syncError}</span>}
          {r.stars !== null && ` · ★ ${r.stars} · forks ${r.forks}`}
        </p>
      )}
      {sync.error && <p className="mb-3 text-sm text-red-700">{(sync.error as Error).message}</p>}
      <form onSubmit={submit} className="card space-y-5 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div><L k="name">Name *</L>{inp('name', { required: true, minLength: 2, maxLength: 120 })}</div>
          <div><L k="sourceUrl">Source URL *</L>{inp('sourceUrl', { required: true, type: 'url', placeholder: 'https://github.com/owner/repo' })}</div>
          <div><L k="resourceType">Type *</L>{sel('resourceType', Object.entries(RESOURCE_TYPES))}</div>
          <div><L k="categoryId">Category *</L>{sel('categoryId', (cats.data?.categories ?? []).map((c) => [c.id, c.name]))}</div>
          <div><L k="provider">Provider *</L>{sel('provider', [['manual', 'Manual'], ['github', 'GitHub'], ['huggingface', 'Hugging Face'], ['gitlab', 'GitLab'], ['other', 'Other']])}</div>
          <div><L k="language">Language</L>{inp('language', { maxLength: 40 })}</div>
        </div>
        <div>
          <L k="summary" hint="(10–300 chars)">Summary *</L>
          <input id="rf-summary" className="input" required minLength={10} maxLength={300} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
        </div>
        <div>
          <L k="description">Description</L>
          <textarea id="rf-description" className="input" rows={4} maxLength={5000} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><L k="tags" hint="(comma separated)">Tags</L>{inp('tags')}</div>
          <div><L k="platforms" hint="(comma separated)">Platforms</L>{inp('platforms')}</div>
          <div><L k="licenseSpdx" hint="(SPDX id, blank = unknown)">License</L>{inp('licenseSpdx', { maxLength: 60, placeholder: 'MIT' })}</div>
          <div><L k="documentationUrl">Documentation URL</L>{inp('documentationUrl', { type: 'url' })}</div>
          <div className="sm:col-span-2">
            <L k="downloadUrl" hint="(official provider download only)">Download URL</L>
            {inp('downloadUrl', { type: 'url' })}
          </div>
        </div>
        <div>
          <L k="installation">Installation command / notes</L>
          <textarea id="rf-installation" className="input font-mono" rows={3} maxLength={5000} value={form.installation} onChange={(e) => setForm({ ...form, installation: e.target.value })} />
        </div>
        <div>
          <L k="compatibility">Compatibility notes</L>
          <textarea id="rf-compatibility" className="input" rows={2} maxLength={2000} value={form.compatibility} onChange={(e) => setForm({ ...form, compatibility: e.target.value })} />
        </div>
        <div className="grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-3">
          <div><L k="publicationStatus">Publication</L>{sel('publicationStatus', [['draft', 'Draft'], ['published', 'Published'], ['archived', 'Archived']])}</div>
          <div><L k="verificationStatus">Verification</L>{sel('verificationStatus', [['unreviewed', 'Unreviewed'], ['verified', 'Verified'], ['rejected', 'Rejected']])}</div>
          <div><L k="safetyStatus">Safety review</L>{sel('safetyStatus', [['unreviewed', 'Unreviewed'], ['reviewed', 'Reviewed'], ['flagged', 'Flagged']])}</div>
        </div>
        {save.error && <p role="alert" className="text-sm text-red-700">{(save.error as Error).message}</p>}
        {(save.error as any)?.body?.existing && (
          <p className="text-sm">
            Existing: <Link className="text-brand-700 underline" to={`/admin/resources/${(save.error as any).body.existing.id}/edit`}>{(save.error as any).body.existing.name}</Link>
          </p>
        )}
        <div className="flex gap-2">
          <button className="btn-primary" disabled={save.isPending}>{save.isPending ? 'Saving…' : id ? 'Save changes' : 'Create resource'}</button>
          <Link to="/admin/resources" className="btn-ghost">Cancel</Link>
        </div>
      </form>
    </>
  );
}
