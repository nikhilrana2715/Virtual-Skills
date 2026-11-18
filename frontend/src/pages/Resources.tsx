import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, BookOpen, FileText, GraduationCap } from 'lucide-react';
import { api, qs } from '../lib/api';
import { useSeo } from '../lib/seo';
import { iconFor } from '../lib/icons';
import { apps, topicBySlug, topics, type LinkItem } from '../data';
import type { Paged, Resource } from '../lib/types';
import { EmptyState, ErrorState, ExternalLink, PageHeader, SkeletonGrid } from '../components/common';
import { ResourceGrid } from '../components/ResourceCard';
import { AppCard, PricingTag } from '../components/AppCard';
import { NotFound } from './Static';

/** /resources — all learning topics. */
export function ResourcesHub() {
  useSeo('Our Resources', 'Learning roadmaps, free and paid courses, cheat sheets and related repositories for AI, IT, cloud, data and development topics.');
  return (
    <div className="container-page py-8">
      <PageHeader title="Our Resources" subtitle="Pick a topic: beginner → advanced roadmap, best courses, cheat sheets, related repositories and apps." />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {topics.map((t) => {
          const Icon = iconFor(t.icon);
          return (
            <li key={t.slug}>
              <Link to={`/topics/${t.slug}`} className="card group flex h-full gap-4 p-5 transition-shadow hover:shadow-md">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700 ring-1 ring-brand-100 group-hover:bg-brand-600 group-hover:text-white" aria-hidden>
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <span>
                  <span className="block text-sm font-bold uppercase tracking-wide text-brand-700">{t.title}</span>
                  <span className="mt-1 block text-sm text-slate-600">{t.desc}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const STAGES = [
  ['beginner', 'Beginner'],
  ['intermediate', 'Intermediate'],
  ['advanced', 'Advanced'],
] as const;

function LinkList({ items, withPricing }: { items: LinkItem[]; withPricing?: boolean }) {
  return (
    <ul className="divide-y divide-slate-100">
      {items.map((c) => (
        <li key={c.url} className="flex items-center justify-between gap-3 py-3">
          <ExternalLink href={c.url} className="text-sm font-medium text-brand-700 hover:underline">
            {c.name}
          </ExternalLink>
          <span className="flex shrink-0 items-center gap-2">
            {c.verified === false && <span className="text-xs text-amber-700">not verified</span>}
            {withPricing && c.pricing && <PricingTag value={c.pricing} />}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** /topics/:slug — one template for every topic in resources.json. */
export function TopicPage() {
  const { slug } = useParams();
  const topic = topicBySlug(slug);
  useSeo(topic?.title, topic ? `${topic.title}: ${topic.intro}` : undefined);

  const repos = useQuery({
    queryKey: ['topic-repos', slug],
    queryFn: () => api<Paged<Resource>>(`/resources${qs({ category: topic!.relatedCategories.join(','), sort: 'stars', limit: 6 })}`),
    enabled: !!topic && topic.relatedCategories.length > 0,
  });

  if (!topic) return <NotFound />;
  const Icon = iconFor(topic.icon);
  const relatedApps = apps.filter((a) => topic.relatedAppCategories.includes(a.category)).slice(0, 6);
  const free = topic.courses.filter((c) => c.pricing === 'Free');
  const paid = topic.courses.filter((c) => c.pricing !== 'Free');

  return (
    <div className="container-page py-8">
      <nav className="mb-4 text-sm text-slate-500" aria-label="Breadcrumb">
        <Link to="/resources" className="hover:text-brand-700">
          Our Resources
        </Link>{' '}
        / <span className="text-slate-700">{topic.title}</span>
      </nav>

      <section className="card mb-8 flex flex-col gap-5 bg-gradient-to-br from-white to-brand-50 p-6 sm:flex-row sm:items-center sm:p-8">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-brand-600 text-white" aria-hidden>
          <Icon className="h-7 w-7" strokeWidth={1.75} />
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{topic.title}</h1>
          <p className="mt-2 max-w-3xl text-slate-600">{topic.intro}</p>
        </div>
      </section>

      <section aria-labelledby="roadmap" className="mb-10">
        <h2 id="roadmap" className="mb-4 flex items-center gap-2 text-xl font-semibold">
          <ArrowRight className="h-5 w-5 text-brand-600" aria-hidden /> Roadmap: beginner → advanced
        </h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {STAGES.map(([key, label], i) => (
            <li key={key} className="card p-5">
              <p className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-brand-700">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-brand-600 text-xs text-white">{i + 1}</span>
                {label}
              </p>
              <ul className="list-disc space-y-1.5 pl-5 text-sm text-slate-700">
                {topic.roadmap[key].map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </section>

      <div className="mb-10 grid gap-6 lg:grid-cols-3">
        <section className="card p-5" aria-labelledby="free-courses">
          <h2 id="free-courses" className="mb-1 flex items-center gap-2 font-semibold">
            <GraduationCap className="h-5 w-5 text-brand-600" aria-hidden /> Best free courses
          </h2>
          {free.length ? <LinkList items={free} withPricing /> : <p className="py-3 text-sm text-slate-500">None listed yet.</p>}
        </section>
        <section className="card p-5" aria-labelledby="paid-courses">
          <h2 id="paid-courses" className="mb-1 flex items-center gap-2 font-semibold">
            <BookOpen className="h-5 w-5 text-brand-600" aria-hidden /> Paid & freemium courses
          </h2>
          {paid.length ? <LinkList items={paid} withPricing /> : <p className="py-3 text-sm text-slate-500">None listed yet.</p>}
        </section>
        <section className="card p-5" aria-labelledby="cheats">
          <h2 id="cheats" className="mb-1 flex items-center gap-2 font-semibold">
            <FileText className="h-5 w-5 text-brand-600" aria-hidden /> Cheat sheets & references
          </h2>
          <LinkList items={topic.cheatSheets} />
        </section>
      </div>

      <section className="mb-10" aria-labelledby="related-repos">
        <div className="mb-4 flex items-end justify-between gap-3">
          <h2 id="related-repos" className="text-xl font-semibold">
            Related repositories
          </h2>
          <Link to={`/repository?categories=${topic.relatedCategories.join(',')}`} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800">
            See all <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        {repos.isLoading ? (
          <SkeletonGrid n={3} />
        ) : repos.error ? (
          <ErrorState error={repos.error} retry={repos.refetch} />
        ) : repos.data && repos.data.items.length ? (
          <ResourceGrid items={repos.data.items} />
        ) : (
          <EmptyState title="No repositories yet">Repositories for this topic will appear here once added to the catalog.</EmptyState>
        )}
      </section>

      {relatedApps.length > 0 && (
        <section aria-labelledby="related-apps">
          <div className="mb-4 flex items-end justify-between gap-3">
            <h2 id="related-apps" className="text-xl font-semibold">
              Related applications
            </h2>
            <Link to="/applications" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800">
              All applications <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {relatedApps.map((a) => (
              <AppCard key={a.url} app={a} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
