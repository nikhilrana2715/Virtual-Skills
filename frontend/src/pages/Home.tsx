import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Category, Resource } from '../lib/types';
import { ResourceGrid } from '../components/ResourceCard';
import { ErrorState, SkeletonGrid } from '../components/common';

const SUGGESTIONS = ['Claude skills', 'MCP server', 'RAG', 'agent framework', 'vector search', 'LLM inference'];

function Section({ title, to, children }: { title: string; to: string; children: React.ReactNode }) {
  return (
    <section className="container-page mt-14">
      <div className="mb-5 flex items-end justify-between">
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h2>
        <Link to={to} className="text-sm font-medium text-brand-700 hover:underline">
          View all →
        </Link>
      </div>
      {children}
    </section>
  );
}

function ResourceSection({ title, to, path }: { title: string; to: string; path: string }) {
  const q = useQuery({ queryKey: ['home', path], queryFn: () => api<{ items: Resource[] }>(path) });
  return (
    <Section title={title} to={to}>
      {q.isLoading ? <SkeletonGrid n={3} /> : q.error ? <ErrorState error={q.error} retry={q.refetch} /> : <ResourceGrid items={q.data!.items.slice(0, 6)} />}
    </Section>
  );
}

export default function Home() {
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const cats = useQuery({ queryKey: ['categories'], queryFn: () => api<{ categories: Category[] }>('/categories') });
  const stats = useQuery({ queryKey: ['stats'], queryFn: () => api<{ resources: number; categories: number; verified: number }>('/stats') });

  const go = (e?: FormEvent, term = q) => {
    e?.preventDefault();
    nav(`/explore${term.trim() ? `?q=${encodeURIComponent(term.trim())}` : ''}`);
  };

  return (
    <>
      <section className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--color-brand-100),transparent_60%)]"
        />
        <div className="container-page relative py-16 text-center sm:py-24">
          <span className="chip mb-5 bg-brand-50 text-brand-700">AI skills · MCP servers · agents · models · tools</span>
          <h1 className="mx-auto max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">
            Find the right AI skill, tool or repo — <span className="text-brand-600">in one place</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            Virtual Skills is a curated catalog of AI and developer resources, with honest license info and a link to every original source.
          </p>
          <form onSubmit={go} role="search" className="mx-auto mt-8 flex max-w-2xl gap-2">
            <label htmlFor="hero-search" className="sr-only">
              Search resources
            </label>
            <input
              id="hero-search"
              className="input h-12 flex-1 text-base shadow-sm"
              placeholder='Try "Claude skills for code review"'
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <button className="btn-primary h-12 px-6">Search</button>
          </form>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {SUGGESTIONS.map((s) => (
              <button key={s} className="chip hover:bg-brand-50 hover:text-brand-700" onClick={() => go(undefined, s)}>
                {s}
              </button>
            ))}
          </div>
          {stats.data && (
            <dl className="mx-auto mt-10 flex max-w-md justify-center gap-10 text-center">
              {[
                ['Resources', stats.data.resources],
                ['Categories', stats.data.categories],
                ['Reviewed', stats.data.verified],
              ].map(([k, v]) => (
                <div key={k}>
                  <dd className="text-2xl font-bold">{v}</dd>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">{k}</dt>
                </div>
              ))}
            </dl>
          )}
        </div>
      </section>

      <Section title="Browse by category" to="/categories">
        {cats.isLoading ? (
          <SkeletonGrid n={6} />
        ) : cats.error ? (
          <ErrorState error={cats.error} />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {cats.data!.categories.slice(0, 10).map((c) => (
              <Link key={c.id} to={`/categories/${c.slug}`} className="card flex items-center gap-3 p-4 transition hover:border-brand-200 hover:bg-brand-50/40">
                <span className="text-2xl" aria-hidden>
                  {c.icon}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{c.name}</span>
                  <span className="text-xs text-slate-500">{c.count} resources</span>
                </span>
              </Link>
            ))}
          </div>
        )}
      </Section>

      <ResourceSection title="Popular skills & MCP servers" to="/explore?category=mcp-ecosystem" path="/resources?q=&category=mcp-ecosystem&sort=stars&limit=6" />
      <ResourceSection title="Trending" to="/trending" path="/trending?limit=6" />
      <ResourceSection title="Latest additions" to="/latest" path="/latest?limit=6" />
    </>
  );
}

