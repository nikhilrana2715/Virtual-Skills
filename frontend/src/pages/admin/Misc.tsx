import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { EmptyState, ErrorState, PageHeader, Spinner, StatusBadge } from '../../components/common';

const dt = (s: string | null) => (s ? new Date(s).toLocaleString() : '—');

function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>{head.map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr>
        </thead>
        <tbody className="[&_td]:px-4 [&_td]:py-3 [&_tr]:border-b [&_tr]:border-slate-100 [&_tr:last-child]:border-0">{children}</tbody>
      </table>
    </div>
  );
}

function useList<T>(key: string, path: string) {
  return useQuery({ queryKey: [key], queryFn: () => api<T>(path) });
}

export function AdminCategories() {
  const qc = useQueryClient();
  const cats = useList<{ categories: { id: string; name: string; slug: string; description: string | null; icon: string | null; count: number }[] }>('admin-categories', '/admin/categories');
  const tags = useList<{ tags: { id: string; name: string; count: number }[] }>('admin-tags', '/admin/tags');
  const [form, setForm] = useState({ name: '', description: '', icon: '' });
  const create = useMutation({
    mutationFn: () => api('/admin/categories', { method: 'POST', body: { name: form.name, description: form.description || null, icon: form.icon || null } }),
    onSuccess: () => {
      setForm({ name: '', description: '', icon: '' });
      qc.invalidateQueries();
    },
  });
  const del = useMutation({ mutationFn: (id: string) => api(`/admin/categories/${id}`, { method: 'DELETE' }), onSuccess: () => qc.invalidateQueries() });
  const delTag = useMutation({ mutationFn: (id: string) => api(`/admin/tags/${id}`, { method: 'DELETE' }), onSuccess: () => qc.invalidateQueries() });

  return (
    <>
      <PageHeader title="Categories & tags" />
      <form
        className="card mb-4 grid gap-2 p-4 sm:grid-cols-[80px_1fr_2fr_auto]"
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate();
        }}
      >
        <input className="input" placeholder="Icon" maxLength={8} value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} aria-label="Icon" />
        <input className="input" placeholder="Name" required minLength={2} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} aria-label="Name" />
        <input className="input" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} aria-label="Description" />
        <button className="btn-primary">Add category</button>
      </form>
      {(create.error || del.error) && <p className="mb-3 text-sm text-red-700">{((create.error || del.error) as Error).message}</p>}
      {cats.isLoading ? <Spinner /> : cats.error ? <ErrorState error={cats.error} /> : (
        <Table head={['Category', 'Slug', 'Resources', '']}>
          {cats.data!.categories.map((c) => (
            <tr key={c.id}>
              <td><span className="mr-2">{c.icon}</span>{c.name}</td>
              <td className="text-slate-500">{c.slug}</td>
              <td>{c.count}</td>
              <td className="text-right">
                <button className="btn-ghost px-2 py-1 text-xs text-red-700" disabled={c.count > 0} title={c.count > 0 ? 'Move resources first' : ''} onClick={() => window.confirm(`Delete ${c.name}?`) && del.mutate(c.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </Table>
      )}
      <h2 className="mb-3 mt-8 text-lg font-semibold">Tags</h2>
      <div className="card flex flex-wrap gap-2 p-4">
        {tags.data?.tags.map((t) => (
          <span key={t.id} className="chip gap-1">
            {t.name} <span className="text-slate-400">({t.count})</span>
            <button className="ml-1 text-slate-400 hover:text-red-700" aria-label={`Delete tag ${t.name}`} onClick={() => window.confirm(`Delete tag ${t.name}?`) && delTag.mutate(t.id)}>
              ×
            </button>
          </span>
        ))}
      </div>
    </>
  );
}

export function AdminUsers() {
  const qc = useQueryClient();
  const { user: me } = useAuth();
  const q = useList<{ users: { id: string; name: string; email: string; role: string; status: string; created_at: string }[] }>('admin-users', '/admin/users');
  const upd = useMutation({
    mutationFn: ({ id, body }: { id: string; body: object }) => api(`/admin/users/${id}`, { method: 'PATCH', body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });
  return (
    <>
      <PageHeader title="Users" />
      {upd.error && <p className="mb-3 text-sm text-red-700">{(upd.error as Error).message}</p>}
      {q.isLoading ? <Spinner /> : q.error ? <ErrorState error={q.error} /> : (
        <Table head={['Name', 'Email', 'Role', 'Status', 'Joined']}>
          {q.data!.users.map((u) => (
            <tr key={u.id}>
              <td>{u.name}</td>
              <td className="text-slate-600">{u.email}</td>
              <td>
                <select className="input w-auto py-1" value={u.role} disabled={u.id === me?.id} onChange={(e) => upd.mutate({ id: u.id, body: { role: e.target.value } })} aria-label="Role">
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
              </td>
              <td>
                <select className="input w-auto py-1" value={u.status} disabled={u.id === me?.id} onChange={(e) => upd.mutate({ id: u.id, body: { status: e.target.value } })} aria-label="Status">
                  <option value="active">active</option>
                  <option value="suspended">suspended</option>
                </select>
              </td>
              <td className="text-xs text-slate-500">{dt(u.created_at)}</td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}

export function AdminReports() {
  const qc = useQueryClient();
  const q = useList<{ items: { id: string; resource_name: string; resource_slug: string; reason: string; details: string | null; status: string; reporter_email: string | null; created_at: string }[] }>('admin-reports', '/admin/reports');
  const upd = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api(`/admin/reports/${id}`, { method: 'PATCH', body: { status } }),
    onSuccess: () => qc.invalidateQueries(),
  });
  return (
    <>
      <PageHeader title="Reports" subtitle="User reports: broken links, license issues, takedown requests." />
      {q.isLoading ? <Spinner /> : q.error ? <ErrorState error={q.error} /> : q.data!.items.length === 0 ? <EmptyState title="No reports" icon="✅" /> : (
        <Table head={['Resource', 'Reason', 'Details', 'Reporter', 'Status', '']}>
          {q.data!.items.map((r) => (
            <tr key={r.id}>
              <td><Link to={`/resources/${r.resource_slug}`} className="hover:text-brand-700">{r.resource_name}</Link></td>
              <td>{r.reason.replace('_', ' ')}</td>
              <td className="max-w-xs whitespace-pre-line text-slate-600">{r.details ?? '—'}</td>
              <td className="text-xs">{r.reporter_email ?? 'anonymous'}</td>
              <td><StatusBadge value={r.status} /></td>
              <td className="whitespace-nowrap text-right">
                {r.status === 'open' && (
                  <>
                    <button className="btn-ghost px-2 py-1 text-xs" onClick={() => upd.mutate({ id: r.id, status: 'resolved' })}>Resolve</button>
                    <button className="btn-ghost px-2 py-1 text-xs" onClick={() => upd.mutate({ id: r.id, status: 'dismissed' })}>Dismiss</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}

export function AdminSyncJobs() {
  const qc = useQueryClient();
  const q = useList<{ items: { id: string; provider: string; kind: string; status: string; started_at: string; finished_at: string | null; items_processed: number; items_failed: number; error_summary: string | null }[] }>('admin-sync', '/admin/sync-jobs');
  const run = useMutation({ mutationFn: () => api('/admin/sync', { method: 'POST' }), onSuccess: () => qc.invalidateQueries() });
  return (
    <>
      <PageHeader title="Sync jobs" subtitle="Automatic GitHub metadata refresh runs every 6 hours for resources older than 24h.">
        <button className="btn-primary" disabled={run.isPending} onClick={() => run.mutate()}>{run.isPending ? 'Running…' : 'Run sync now'}</button>
      </PageHeader>
      {run.error && <p className="mb-3 text-sm text-red-700">{(run.error as Error).message}</p>}
      {q.isLoading ? <Spinner /> : q.error ? <ErrorState error={q.error} /> : q.data!.items.length === 0 ? <EmptyState title="No sync jobs yet" icon="🔄" /> : (
        <Table head={['Started', 'Status', 'Updated', 'Failed', 'Errors']}>
          {q.data!.items.map((j) => (
            <tr key={j.id}>
              <td className="whitespace-nowrap text-xs">{dt(j.started_at)}</td>
              <td><StatusBadge value={j.status} /></td>
              <td>{j.items_processed}</td>
              <td>{j.items_failed}</td>
              <td className="max-w-md whitespace-pre-line text-xs text-red-700">{j.error_summary ?? ''}</td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}

export function AdminAudit() {
  const q = useList<{ items: { id: string; action: string; entity_type: string; entity_id: string | null; actor_email: string | null; metadata: string | null; created_at: string }[] }>('admin-audit', '/admin/audit-logs');
  return (
    <>
      <PageHeader title="Audit log" subtitle="Every admin change, newest first." />
      {q.isLoading ? <Spinner /> : q.error ? <ErrorState error={q.error} /> : q.data!.items.length === 0 ? <EmptyState title="No admin activity yet" icon="📜" /> : (
        <Table head={['When', 'Actor', 'Action', 'Entity', 'Details']}>
          {q.data!.items.map((a) => (
            <tr key={a.id}>
              <td className="whitespace-nowrap text-xs">{dt(a.created_at)}</td>
              <td className="text-xs">{a.actor_email ?? 'system'}</td>
              <td><code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">{a.action}</code></td>
              <td className="text-xs text-slate-500">{a.entity_type} {a.entity_id?.slice(0, 8)}</td>
              <td className="max-w-xs truncate font-mono text-xs text-slate-500" title={a.metadata ?? ''}>{a.metadata ?? ''}</td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
