import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api, qs } from '../lib/api';
import { useSeo } from '../lib/seo';
import type { Category, Paged, Resource } from '../lib/types';
import { resolveSections } from '../data/repoSections';
import { EmptyState, ErrorState, PageHeader, Pagination, SkeletonGrid } from '../components/common';
import { ResourceGrid } from '../components/ResourceCard';

const SORTS = [
  ['recent', 'Latest'],
  ['stars', 'Popular'],
  ['name', 'A–Z'],
] as const;

/** /repository — every catalog repository, grouped into sections by its single category. */
export default function Repository() {
  useSeo('Our Repository', 'All repositories in the Virtual Skills catalog, arranged by category: AI & ML, data, web, automation, cloud & DevOps, prompt engineering and more.');
  const [sp, setSp] = useSearchParams();
  const [qInput, setQInput] = useState(sp.get('q') ?? '');
  useEffect(() => setQInput(sp.get('q') ?? ''), [sp]);

  const cats = useQuery({ queryKey: ['categories'], queryFn: () => api<{ categories: Category[] }>('/categories'), staleTime: 300_000 });
  const sections = useMemo(() => resolveSections((cats.data?.categories ?? []).map((c) => c.slug)), [cats.data]);
  const countBySlug = useMemo(() => new Map((cats.data?.categories ?? []).map((c) => [c.slug, c.count])), [cats.data]);
  const sectionCount = (slugs: string[]) => slugs.reduce((n, s) => n + (countBySlug.get(s) ?? 0), 0);
  const total = (cats.data?.categories ?? []).reduce((n, c) => n + c.count, 0);

  const sectionId = sp.get('section') ?? 'all';
  const custom = sp.get('categories'); // set by topic pages ("See all")
  const section = sections.find((s) => s.id === sectionId);
  const categoryFilter = custom ?? (section ? section.categories.join(',') : undefined);
  const emptySection = !!section && section.categories.length === 0;

  const params = {
    q: sp.get('q') ?? undefined,
    category: categoryFilter || undefined,
    sort: sp.get('sort') ?? 'recent',
    page: Number(sp.get('page') ?? 1),
    limit: 18,
  };
  const list = useQuery({
    queryKey: ['repository', params],
    queryFn: () => api<Paged<Resource>>(`/resources${qs(params)}`),
    placeholderData: keepPreviousData,
    enabled: !emptySection,
  });

  const set = (patch: Record<string, string | null>) => {
    const n = new URLSearchParams(sp);
    for (const [k, v] of Object.entries(patch)) (v ? n.set(k, v) : n.delete(k));
    if (!('page' in patch)) n.delete('page');
    setSp(n, { replace: !('page' in patch) });
    if ('page' in patch) window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const pick = (id: string) => set({ section: id === 'all' ? null : id, categories: null });

  const tabs = [{ id: 'all', label: 'All repositories', n: total }, ...sections.map((s) => ({ id: s.id, label: s.label, n: sectionCount(s.categories) }))];
  const activeTab = custom ? null : sectionId;

  return (
    <div className="container-page py-8">
      <PageHeader title="Our Repository" subtitle="Every repository in the catalog, arranged by category. Each card links to its original source." />

      <form
        role="search"
        className="mb-6 flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          set({ q: qInput.trim() || null });
        }}
      >
        <label htmlFor="repo-q" className="sr-only">
          Search repositories
        </label>
        <input id="repo-q" className="input h-11 min-w-0 flex-1" placeholder="Search repositories by name, tag, language…" value={qInput} onChange={(e) => setQInput(e.target.value)} />
        <button className="btn-primary h-11">Search</button>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-slate-600">Sort</span>
          <select className="input h-11 w-auto" value={params.sort} onChange={(e) => set({ sort: e.target.value })}>
            {SORTS.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
      </form>

      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside aria-label="Repository categories">
          {/* Tabs scroll horizontally on small screens, sidebar on large */}
          <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:px-0 lg:pb-0">
            {tabs.map((t) => (
              <li key={t.id} className="shrink-0">
                <button
                  type="button"
                  aria-pressed={activeTab === t.id}
                  onClick={() => pick(t.id)}
                  className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    activeTab === t.id ? 'bg-brand-600 font-semibold text-white' : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 lg:bg-transparent lg:ring-0'
                  }`}
                >
                  {t.label}
                  <span className={`text-xs ${activeTab === t.id ? 'text-brand-100' : 'text-slate-400'}`}>{t.n}</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <div>
          {custom && (
            <p className="mb-4 flex items-center gap-2 text-sm text-slate-600">
              Showing repositories related to a topic.
              <button className="font-semibold text-brand-700 hover:underline" onClick={() => pick('all')}>
                Show all
              </button>
            </p>
          )}
          <p className="mb-4 text-sm text-slate-600" aria-live="polite">
            {emptySection ? '0 repositories' : list.data ? `${list.data.total} repositor${list.data.total === 1 ? 'y' : 'ies'}${params.q ? ` for “${params.q}”` : ''}` : ' '}
          </p>
          {emptySection ? (
            <EmptyState title="No repositories in this section yet" icon="📦">
              Add a repository from the admin dashboard and give it a category in this section.
            </EmptyState>
          ) : list.isLoading ? (
            <SkeletonGrid />
          ) : list.error ? (
            <ErrorState error={list.error} retry={list.refetch} />
          ) : list.data!.items.length === 0 ? (
            <EmptyState title="No repositories found">Try a different search term or section.</EmptyState>
          ) : (
            <div className={list.isFetching ? 'opacity-60 transition-opacity' : ''}>
              <ResourceGrid items={list.data!.items} />
              <Pagination page={list.data!.page} totalPages={list.data!.totalPages} onPage={(p) => set({ page: String(p) })} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
