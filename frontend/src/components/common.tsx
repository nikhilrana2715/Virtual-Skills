import type { ReactNode } from 'react';
import { safeHref } from '../lib/api';

export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-16 text-slate-500">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function SkeletonGrid({ n = 6 }: { n?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading resources">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="card h-52 animate-pulse p-5">
          <div className="mb-3 h-4 w-1/2 rounded bg-slate-200" />
          <div className="mb-2 h-3 w-full rounded bg-slate-100" />
          <div className="mb-6 h-3 w-4/5 rounded bg-slate-100" />
          <div className="h-3 w-1/3 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ title, children, icon = '🔍' }: { title: string; children?: ReactNode; icon?: string }) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-3 text-4xl" aria-hidden>
        {icon}
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      {children && <div className="mt-2 max-w-md text-sm text-slate-600">{children}</div>}
    </div>
  );
}

export function ErrorState({ error, retry }: { error: unknown; retry?: () => void }) {
  return (
    <div role="alert" className="card border-red-200 bg-red-50 px-6 py-8 text-center">
      <p className="font-medium text-red-800">Something went wrong</p>
      <p className="mt-1 text-sm text-red-700">{error instanceof Error ? error.message : String(error)}</p>
      {retry && (
        <button className="btn-secondary mt-4" onClick={retry}>
          Try again
        </button>
      )}
    </div>
  );
}

/** Clearly-labelled external link. Rejects non-http(s) hrefs from imported data. */
export function ExternalLink({ href, children, className }: { href: string | null | undefined; children: ReactNode; className?: string }) {
  const h = safeHref(href);
  if (!h) return <span className={className}>{children}</span>;
  return (
    <a href={h} target="_blank" rel="noopener noreferrer nofollow" className={className}>
      {children}
      <span aria-hidden className="ml-0.5 text-[0.8em]">↗</span>
      <span className="sr-only"> (opens external site)</span>
    </a>
  );
}

export function Pagination({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Pagination">
      <button className="btn-secondary" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        ← Prev
      </button>
      <span className="px-3 text-sm text-slate-600">
        Page {page} of {totalPages}
      </span>
      <button className="btn-secondary" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>
        Next →
      </button>
    </nav>
  );
}

export function StatusBadge({ value }: { value: string }) {
  const map: Record<string, string> = {
    published: 'bg-green-100 text-green-800',
    verified: 'bg-green-100 text-green-800',
    reviewed: 'bg-green-100 text-green-800',
    succeeded: 'bg-green-100 text-green-800',
    resolved: 'bg-green-100 text-green-800',
    draft: 'bg-amber-100 text-amber-800',
    unreviewed: 'bg-slate-100 text-slate-700',
    partial: 'bg-amber-100 text-amber-800',
    running: 'bg-blue-100 text-blue-800',
    open: 'bg-amber-100 text-amber-800',
    archived: 'bg-slate-200 text-slate-700',
    rejected: 'bg-red-100 text-red-800',
    flagged: 'bg-red-100 text-red-800',
    failed: 'bg-red-100 text-red-800',
    dismissed: 'bg-slate-100 text-slate-600',
  };
  return <span className={`chip ${map[value] ?? ''}`}>{value}</span>;
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: ReactNode; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-slate-600">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
