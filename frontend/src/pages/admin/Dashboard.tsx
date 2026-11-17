import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { ErrorState, PageHeader, Spinner } from '../../components/common';

interface Stats {
  total: number; published: number; draft: number; archived: number; pendingReview: number; stale: number; syncErrors: number;
  openReports: number; users: number;
  byCategory: { name: string; n: number }[]; byProvider: { name: string; n: number }[];
  mostViewed: { name: string; slug: string; n: number }[]; mostSaved: { name: string; slug: string; n: number }[];
}

function Bars({ rows }: { rows: { name: string; n: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.n));
  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li key={r.name} className="grid grid-cols-[minmax(0,1fr)_2fr_auto] items-center gap-3 text-sm">
          <span className="truncate text-slate-600">{r.name}</span>
          <span className="h-2 rounded-full bg-slate-100">
            <span className="block h-2 rounded-full bg-brand-500" style={{ width: `${(r.n / max) * 100}%` }} />
          </span>
          <span className="w-6 text-right font-medium tabular-nums">{r.n}</span>
        </li>
      ))}
    </ul>
  );
}

export default function Dashboard() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['admin-stats'], queryFn: () => api<Stats>('/admin/stats') });
  const sync = useMutation({
    mutationFn: () => api<{ processed?: number; failed?: number; status?: string; skipped?: boolean; reason?: string }>('/admin/sync', { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries(),
  });
  if (q.isLoading) return <Spinner />;
  if (q.error) return <ErrorState error={q.error} retry={q.refetch} />;
  const s = q.data!;
  const tiles: [string, number, string?][] = [
    ['Total resources', s.total, '/admin/resources'],
    ['Published', s.published, '/admin/resources?status=published'],
    ['Drafts', s.draft, '/admin/resources?status=draft'],
    ['Pending review', s.pendingReview, '/admin/resources'],
    ['Stale metadata (>7d)', s.stale, '/admin/sync-jobs'],
    ['Sync errors', s.syncErrors, '/admin/sync-jobs'],
    ['Open reports', s.openReports, '/admin/reports'],
    ['Users', s.users, '/admin/users'],
  ];
  return (
    <>
      <PageHeader title="Dashboard" subtitle="Catalog health at a glance.">
        <div className="flex gap-2">
          <Link to="/admin/imports" className="btn-secondary">Import repo</Link>
          <button className="btn-primary" disabled={sync.isPending} onClick={() => sync.mutate()}>
            {sync.isPending ? 'Syncing…' : 'Sync GitHub metadata'}
          </button>
        </div>
      </PageHeader>
      {sync.data && (
        <p className="mb-4 rounded-lg bg-brand-50 p-3 text-sm text-brand-800" role="status">
          {sync.data.skipped ? sync.data.reason : `Sync ${sync.data.status}: ${sync.data.processed} updated, ${sync.data.failed} failed.`}
        </p>
      )}
      {sync.error && <p className="mb-4 text-sm text-red-700">{(sync.error as Error).message}</p>}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {tiles.map(([label, n, to]) => (
          <Link key={label} to={to ?? '#'} className="card p-4 transition hover:border-brand-200">
            <div className="text-2xl font-bold tabular-nums">{n}</div>
            <div className="text-xs text-slate-500">{label}</div>
          </Link>
        ))}
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-3 font-semibold">Resources by category</h2>
          <Bars rows={s.byCategory} />
        </div>
        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="mb-3 font-semibold">By provider</h2>
            <Bars rows={s.byProvider} />
          </div>
          <div className="card p-5">
            <h2 className="mb-3 font-semibold">Most viewed</h2>
            <ol className="space-y-1 text-sm">
              {s.mostViewed.map((r) => (
                <li key={r.slug} className="flex justify-between">
                  <Link to={`/resources/${r.slug}`} className="truncate hover:text-brand-700">{r.name}</Link>
                  <span className="tabular-nums text-slate-500">{r.n}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="card p-5">
            <h2 className="mb-3 font-semibold">Most saved</h2>
            {s.mostSaved.length === 0 ? (
              <p className="text-sm text-slate-500">No bookmarks yet.</p>
            ) : (
              <ol className="space-y-1 text-sm">
                {s.mostSaved.map((r) => (
                  <li key={r.slug} className="flex justify-between">
                    <span className="truncate">{r.name}</span>
                    <span className="tabular-nums text-slate-500">{r.n}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
