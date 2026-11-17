import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, qs, timeAgo } from '../../lib/api';
import type { Paged, Resource } from '../../lib/types';
import { RESOURCE_TYPES } from '../../lib/types';
import { EmptyState, ErrorState, PageHeader, Pagination, Spinner, StatusBadge } from '../../components/common';

export default function AdminResources() {
  const qc = useQueryClient();
  const [sp, setSp] = useSearchParams();
  const [q, setQ] = useState(sp.get('q') ?? '');
  const params = { q: sp.get('q') ?? undefined, status: sp.get('status') ?? undefined, page: Number(sp.get('page') ?? 1), limit: 25, sort: 'recent' };
  const list = useQuery({
    queryKey: ['admin-resources', params],
    queryFn: () => api<Paged<Resource>>(`/admin/resources${qs(params)}`),
    placeholderData: keepPreviousData,
  });
  const act = useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) =>
      action === 'delete' ? api(`/admin/resources/${id}`, { method: 'DELETE' }) : api(`/admin/resources/${id}/${action}`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries(),
  });
  const set = (k: string, v: string | null) => {
    const n = new URLSearchParams(sp);
    if (v) n.set(k, v);
    else n.delete(k);
    if (k !== 'page') n.delete('page');
    setSp(n);
  };

  return (
    <>
      <PageHeader title="Resources" subtitle={list.data ? `${list.data.total} total` : undefined}>
        <Link to="/admin/resources/new" className="btn-primary">+ Add resource</Link>
      </PageHeader>
      <div className="mb-4 flex flex-wrap gap-2">
        <form
          className="flex flex-1 gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            set('q', q.trim() || null);
          }}
        >
          <input className="input" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search resources" />
          <button className="btn-secondary">Search</button>
        </form>
        <select className="input w-auto" value={sp.get('status') ?? ''} onChange={(e) => set('status', e.target.value || null)} aria-label="Status">
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
      </div>
      {act.error && <p className="mb-3 text-sm text-red-700">{(act.error as Error).message}</p>}
      {list.isLoading ? (
        <Spinner />
      ) : list.error ? (
        <ErrorState error={list.error} retry={list.refetch} />
      ) : list.data!.items.length === 0 ? (
        <EmptyState title="No resources match" />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Review</th>
                <th className="px-4 py-3">Synced</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.data!.items.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3">
                    <Link to={`/admin/resources/${r.id}/edit`} className="font-medium hover:text-brand-700">{r.name}</Link>
                    <div className="text-xs text-slate-500">
                      {RESOURCE_TYPES[r.resourceType]} · {r.category.name}
                    </div>
                  </td>
                  <td className="px-4 py-3"><StatusBadge value={r.publicationStatus!} /></td>
                  <td className="space-x-1 px-4 py-3">
                    <StatusBadge value={r.verificationStatus} />
                    <StatusBadge value={r.safetyStatus} />
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {r.syncError ? <span className="text-red-700" title={r.syncError}>Error</span> : r.lastSyncedAt ? timeAgo(r.lastSyncedAt) : <span className="text-slate-400">Never</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      {r.publicationStatus !== 'published' ? (
                        <button className="btn-ghost px-2 py-1 text-xs" onClick={() => act.mutate({ id: r.id, action: 'publish' })}>Publish</button>
                      ) : (
                        <Link to={`/resources/${r.slug}`} className="btn-ghost px-2 py-1 text-xs">View</Link>
                      )}
                      {r.verificationStatus !== 'verified' && (
                        <button className="btn-ghost px-2 py-1 text-xs" onClick={() => act.mutate({ id: r.id, action: 'verify' })}>Verify</button>
                      )}
                      <Link to={`/admin/resources/${r.id}/edit`} className="btn-ghost px-2 py-1 text-xs">Edit</Link>
                      <button
                        className="btn-ghost px-2 py-1 text-xs text-red-700"
                        onClick={() => {
                          const msg = r.publicationStatus === 'published' ? `Archive "${r.name}"?` : `Permanently delete "${r.name}"?`;
                          if (window.confirm(msg)) act.mutate({ id: r.id, action: 'delete' });
                        }}
                      >
                        {r.publicationStatus === 'published' ? 'Archive' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {list.data && <Pagination page={list.data.page} totalPages={list.data.totalPages} onPage={(p) => set('page', String(p))} />}
    </>
  );
}
