import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Category, Resource } from '../lib/types';
import { ResourceGrid } from '../components/ResourceCard';
import { EmptyState, ErrorState, PageHeader, SkeletonGrid } from '../components/common';

export function Categories() {
  const q = useQuery({ queryKey: ['categories'], queryFn: () => api<{ categories: Category[] }>('/categories') });
  return (
    <div className="container-page py-8">
      <PageHeader title="Categories" subtitle="Browse the catalog by area." />
      {q.isLoading ? (
        <SkeletonGrid />
      ) : q.error ? (
        <ErrorState error={q.error} retry={q.refetch} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {q.data!.categories.map((c) => (
            <Link key={c.id} to={`/categories/${c.slug}`} className="card flex gap-4 p-5 transition hover:border-brand-200 hover:shadow-md">
              <span className="text-3xl" aria-hidden>
                {c.icon}
              </span>
              <span>
                <span className="block font-semibold">{c.name}</span>
                <span className="mt-1 block text-sm text-slate-600">{c.description}</span>
                <span className="mt-2 block text-xs font-medium text-brand-700">{c.count} resources →</span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function SimpleList({ title, subtitle, path, keyName }: { title: string; subtitle: React.ReactNode; path: string; keyName: string }) {
  const q = useQuery({ queryKey: [keyName], queryFn: () => api<{ items: Resource[] }>(path) });
  return (
    <div className="container-page py-8">
      <PageHeader title={title} subtitle={subtitle} />
      {q.isLoading ? (
        <SkeletonGrid />
      ) : q.error ? (
        <ErrorState error={q.error} retry={q.refetch} />
      ) : q.data!.items.length === 0 ? (
        <EmptyState title="Nothing here yet" />
      ) : (
        <ResourceGrid items={q.data!.items} />
      )}
    </div>
  );
}

export const Trending = () => (
  <SimpleList
    title="Trending"
    keyName="trending-page"
    path="/trending?limit=30"
    subtitle={
      <>
        Ranked by a transparent score: recent activity, admin review, license clarity, documentation and popularity — not stars alone.{' '}
        <Link to="/about#ranking" className="text-brand-700 hover:underline">
          How ranking works
        </Link>
      </>
    }
  />
);

export const Latest = () => <SimpleList title="Latest additions" keyName="latest-page" path="/latest?limit=30" subtitle="Recently added to the catalog." />;
