import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSeo } from '../lib/seo';
import { appCategories, apps } from '../data';
import { EmptyState, PageHeader } from '../components/common';
import { AppCard } from '../components/AppCard';

/** /applications — useful external Tech, IT and AI websites from data/apps.json. */
export default function Applications() {
  useSeo('Our Applications', 'Useful tech, IT and AI websites — AI assistants, media tools, dev tools, design, cloud hosting, data, automation and learning platforms — with official links and pricing.');
  const [sp, setSp] = useSearchParams();
  const cat = sp.get('category') ?? 'all';
  const q = (sp.get('q') ?? '').trim().toLowerCase();

  const counts = useMemo(() => new Map(appCategories.map((c) => [c.id, apps.filter((a) => a.category === c.id).length])), []);
  const shown = apps.filter(
    (a) => (cat === 'all' || a.category === cat) && (!q || `${a.name} ${a.description}`.toLowerCase().includes(q)),
  );
  const set = (k: string, v: string | null) => {
    const n = new URLSearchParams(sp);
    v ? n.set(k, v) : n.delete(k);
    setSp(n, { replace: true });
  };

  return (
    <div className="container-page py-8">
      <PageHeader title="Our Applications" subtitle="Handpicked tech, IT and AI websites. Every link goes to the official site and opens in a new tab." />

      <div className="mb-6 flex flex-col gap-4">
        <label htmlFor="app-q" className="sr-only">
          Search applications
        </label>
        <input id="app-q" className="input h-11" type="search" placeholder="Search applications…" value={sp.get('q') ?? ''} onChange={(e) => set('q', e.target.value || null)} />
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          {[{ id: 'all', label: 'All', n: apps.length }, ...appCategories.map((c) => ({ ...c, n: counts.get(c.id) ?? 0 }))].map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={cat === c.id}
              onClick={() => set('category', c.id === 'all' ? null : c.id)}
              className={`rounded-full px-3.5 py-1.5 text-sm transition-colors ${cat === c.id ? 'bg-brand-600 text-white' : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50'}`}
            >
              {c.label} <span className={cat === c.id ? 'text-brand-100' : 'text-slate-400'}>{c.n}</span>
            </button>
          ))}
        </div>
      </div>

      <p className="mb-4 text-sm text-slate-600" aria-live="polite">
        {shown.length} application{shown.length === 1 ? '' : 's'}
      </p>
      {shown.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {shown.map((a) => (
            <AppCard key={a.url} app={a} />
          ))}
        </div>
      ) : (
        <EmptyState title="No applications found">Try another search or category.</EmptyState>
      )}
    </div>
  );
}
