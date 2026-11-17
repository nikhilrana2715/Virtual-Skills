import { Link, useNavigate } from 'react-router-dom';
import type { Resource } from '../lib/types';
import { RESOURCE_TYPES } from '../lib/types';
import { fmtNum, timeAgo } from '../lib/api';
import { useAuth } from '../lib/auth';

export function ProviderIcon({ provider }: { provider: string }) {
  if (provider === 'github')
    return (
      <svg viewBox="0 0 16 16" className="h-4 w-4 fill-slate-700" aria-label="GitHub">
        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
      </svg>
    );
  return (
    <span className="grid h-4 w-4 place-items-center rounded bg-slate-200 text-[9px] font-bold uppercase text-slate-600" aria-label={provider}>
      {provider[0]}
    </span>
  );
}

export function BookmarkButton({ id, compact }: { id: string; compact?: boolean }) {
  const { user, bookmarkIds, toggleBookmark } = useAuth();
  const nav = useNavigate();
  const saved = bookmarkIds.has(id);
  return (
    <button
      type="button"
      className={compact ? `btn-ghost px-2.5 ${saved ? 'text-brand-700' : ''}` : saved ? 'btn-secondary text-brand-700' : 'btn-secondary'}
      aria-pressed={saved}
      title={user ? (saved ? 'Remove from saved' : 'Save resource') : 'Sign in to save'}
      onClick={(e) => {
        e.preventDefault();
        if (!user) return nav('/login', { state: { from: location.pathname } });
        toggleBookmark(id);
      }}
    >
      <svg viewBox="0 0 24 24" className={`h-4 w-4 ${saved ? 'fill-brand-600 stroke-brand-600' : 'fill-none stroke-current'}`} strokeWidth="2" aria-hidden>
        <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" strokeLinejoin="round" />
      </svg>
      {compact ? <span className="sr-only">{saved ? 'Saved' : 'Save'}</span> : saved ? 'Saved' : 'Save'}
    </button>
  );
}

export function ResourceCard({ r }: { r: Resource }) {
  const stars = fmtNum(r.stars);
  return (
    <article className="card group flex flex-col p-5 transition-shadow hover:shadow-md hover:shadow-slate-200/70">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2 text-xs text-slate-500">
            <ProviderIcon provider={r.provider} />
            <span className="truncate">{r.ownerName ?? r.provider}</span>
            {r.verificationStatus === 'verified' && (
              <span className="text-brand-600" title="Admin reviewed">
                ✓ Reviewed
              </span>
            )}
          </div>
          <h3 className="truncate text-base font-semibold">
            <Link to={`/resources/${r.slug}`} className="hover:text-brand-700 focus-visible:underline">
              {r.name}
            </Link>
          </h3>
        </div>
        <BookmarkButton id={r.id} compact />
      </div>
      <p className="mb-4 line-clamp-2 text-sm text-slate-600">{r.summary}</p>
      <div className="mb-4 flex flex-wrap gap-1.5">
        <Link to={`/categories/${r.category.slug}`} className="chip bg-brand-50 text-brand-700 hover:bg-brand-100">
          {r.category.name}
        </Link>
        <span className="chip">{RESOURCE_TYPES[r.resourceType] ?? r.resourceType}</span>
        {r.archivedBySource && <span className="chip bg-amber-100 text-amber-800">Archived by source</span>}
      </div>
      <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-slate-100 pt-3 text-xs text-slate-500">
        {r.language && (
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-brand-500" aria-hidden />
            {r.language}
          </span>
        )}
        {stars && <span title={`${r.stars} stars`}>★ {stars}</span>}
        <span className={r.license ? '' : 'text-amber-700'}>{r.license ?? 'License unknown'}</span>
        <span className="ml-auto" title={r.lastSyncedAt ? `Last checked ${new Date(r.lastSyncedAt).toLocaleString()}` : 'Not yet synced'}>
          {r.lastCommitAt ? `Updated ${timeAgo(r.lastCommitAt)}` : r.lastSyncedAt ? `Checked ${timeAgo(r.lastSyncedAt)}` : 'Not yet checked'}
        </span>
      </div>
    </article>
  );
}

export function ResourceGrid({ items }: { items: Resource[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((r) => (
        <ResourceCard key={r.id} r={r} />
      ))}
    </div>
  );
}
