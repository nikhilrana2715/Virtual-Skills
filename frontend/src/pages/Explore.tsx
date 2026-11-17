import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api, qs } from '../lib/api';
import type { Category, Paged, Resource } from '../lib/types';
import { RESOURCE_TYPES } from '../lib/types';
import { ResourceGrid } from '../components/ResourceCard';
import { EmptyState, ErrorState, PageHeader, Pagination, SkeletonGrid } from '../components/common';

interface Facets {
  languages: { value: string; count: number }[];
  licenses: { value: string; count: number }[];
  providers: { value: string; count: number }[];
  types: { value: string; count: number }[];
}

const SORTS = [
  ['relevance', 'Relevance'],
  ['recent', 'Recently added'],
  ['updated', 'Recently updated'],
  ['stars', 'Most stars'],
  ['name', 'Name A–Z'],
];
const FILTER_KEYS = ['category', 'type', 'provider', 'language', 'license', 'verified', 'updatedWithinDays'] as const;

export default function Explore() {
  const { slug } = useParams();
  const [sp, setSp] = useSearchParams();
  const [qInput, setQInput] = useState(sp.get('q') ?? '');
  const [showFilters, setShowFilters] = useState(false);
  useEffect(() => setQInput(sp.get('q') ?? ''), [sp]);

  const params = {
    q: sp.get('q') ?? undefined,
    category: slug ?? sp.get('category') ?? undefined,
    type: sp.get('type') ?? undefined,
    provider: sp.get('provider') ?? undefined,
    language: sp.get('language') ?? undefined,
    license: sp.get('license') ?? undefined,
    verified: sp.get('verified') === 'true' || undefined,
    updatedWithinDays: sp.get('updatedWithinDays') ?? undefined,
    sort: sp.get('sort') ?? undefined,
    page: Number(sp.get('page') ?? 1),
    limit: 18,
  };

  const list = useQuery({
    queryKey: ['resources', params],
    queryFn: () => api<Paged<Resource>>(`/resources${qs(params)}`),
    placeholderData: keepPreviousData,
  });
  const facets = useQuery({ queryKey: ['facets'], queryFn: () => api<Facets>('/facets'), staleTime: 300_000 });
  const cats = useQuery({ queryKey: ['categories'], queryFn: () => api<{ categories: Category[] }>('/categories') });
  const category = slug ? cats.data?.categories.find((c) => c.slug === slug) : undefined;

  const set = (k: string, v: string | null) => {
    const n = new URLSearchParams(sp);
    if (v) n.set(k, v);
    else n.delete(k);
    if (k !== 'page') n.delete('page');
    setSp(n, { replace: k !== 'page' });
    if (k === 'page') window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const activeCount = FILTER_KEYS.filter((k) => (k === 'category' ? !slug && sp.get(k) : sp.get(k))).length;

  const Select = ({ k, label, options }: { k: string; label: string; options: [string, string][] }) => (
    <div>
      <label className="label" htmlFor={`f-${k}`}>
        {label}
      </label>
      <select id={`f-${k}`} className="input" value={sp.get(k) ?? ''} onChange={(e) => set(k, e.target.value || null)}>
        <option value="">Any</option>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </div>
  );

  const filters = (
    <div className="space-y-4">
      {!slug && <Select k="category" label="Category" options={(cats.data?.categories ?? []).map((c) => [c.slug, c.name])} />}
      <Select k="type" label="Resource type" options={(facets.data?.types ?? []).map((t) => [t.value, `${RESOURCE_TYPES[t.value] ?? t.value} (${t.count})`])} />
      <Select k="language" label="Language" options={(facets.data?.languages ?? []).map((t) => [t.value, `${t.value} (${t.count})`])} />
      <Select
        k="license"
        label="License"
        options={[...(facets.data?.licenses ?? []).map((t): [string, string] => [t.value, `${t.value} (${t.count})`]), ['unknown', 'Unknown']]}
      />
      <Select k="provider" label="Provider" options={(facets.data?.providers ?? []).map((t) => [t.value, t.value])} />
      <Select
        k="updatedWithinDays"
        label="Last updated"
        options={[
          ['30', 'Past 30 days'],
          ['90', 'Past 3 months'],
          ['365', 'Past year'],
        ]}
      />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={sp.get('verified') === 'true'} onChange={(e) => set('verified', e.target.checked ? 'true' : null)} />
        Admin reviewed only
      </label>
      {activeCount > 0 && (
        <button
          className="btn-ghost w-full"
          onClick={() => {
            const n = new URLSearchParams();
            if (sp.get('q')) n.set('q', sp.get('q')!);
            setSp(n);
          }}
        >
          Clear filters
        </button>
      )}
    </div>
  );

  return (
    <div className="container-page py-8">
      <PageHeader
        title={category ? `${category.icon ?? ''} ${category.name}` : 'Explore resources'}
        subtitle={category?.description ?? 'Search and filter AI skills, MCP servers, agents, models and developer tools.'}
      />
      <form
        role="search"
        className="mb-6 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          set('q', qInput.trim() || null);
        }}
      >
        <label htmlFor="explore-q" className="sr-only">
          Search
        </label>
        <input id="explore-q" className="input h-11 flex-1" placeholder="Search by name, description, tag, language, owner…" value={qInput} onChange={(e) => setQInput(e.target.value)} />
        <button className="btn-primary h-11">Search</button>
      </form>

      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside>
          <button className="btn-secondary mb-4 w-full lg:hidden" aria-expanded={showFilters} onClick={() => setShowFilters((s) => !s)}>
            Filters {activeCount > 0 && `(${activeCount})`}
          </button>
          <div className={`${showFilters ? 'block' : 'hidden'} card p-4 lg:sticky lg:top-24 lg:block`}>{filters}</div>
        </aside>
        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600" aria-live="polite">
              {list.data ? `${list.data.total} result${list.data.total === 1 ? '' : 's'}${params.q ? ` for “${params.q}”` : ''}` : ' '}
            </p>
            <label className="flex items-center gap-2 text-sm">
              <span className="text-slate-600">Sort</span>
              <select className="input w-auto" value={sp.get('sort') ?? (params.q ? 'relevance' : 'recent')} onChange={(e) => set('sort', e.target.value)}>
                {SORTS.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {list.isLoading ? (
            <SkeletonGrid />
          ) : list.error ? (
            <ErrorState error={list.error} retry={list.refetch} />
          ) : list.data!.items.length === 0 ? (
            <EmptyState title="No resources found">Try a broader search term or clear some filters.</EmptyState>
          ) : (
            <div className={list.isFetching ? 'opacity-60 transition-opacity' : ''}>
              <ResourceGrid items={list.data!.items} />
              <Pagination page={list.data!.page} totalPages={list.data!.totalPages} onPage={(p) => set('page', String(p))} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
