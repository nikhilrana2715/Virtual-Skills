import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSeo } from '../lib/seo';
import { projects, projectSlug, type Project } from '../data';
import { ExternalLink, PageHeader } from '../components/common';
import { Monogram } from '../components/AppCard';

function StatusTag({ status }: { status: Project['status'] }) {
  if (!status) return <span className="chip">Status not provided</span>;
  return <span className={`chip ${status === 'Live' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>{status}</span>;
}

/** /projects — applications built by the site owner (data/projects.json). */
export default function Projects() {
  useSeo('Our Projects', 'Applications we have built — the problem each one solves, its tech stack, status and links.');
  const { hash } = useLocation();
  const target = decodeURIComponent(hash.slice(1));
  // Header menu links to /projects#<slug>: scroll that card into view.
  useEffect(() => {
    if (!target) return;
    const el = document.getElementById(target);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
  }, [target]);
  return (
    <div className="container-page py-8">
      <PageHeader title="Our Projects" subtitle="Applications we have built: the problem each one solves, how it is built and where to try it." />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => (
          <article
            key={p.name}
            id={projectSlug(p.name)}
            className={`card flex scroll-mt-24 flex-col overflow-hidden transition-shadow hover:shadow-md ${target === projectSlug(p.name) ? 'ring-2 ring-brand-500' : ''}`}
          >
            {p.screenshot ? (
              <img src={p.screenshot} alt={`${p.name} screenshot`} loading="lazy" decoding="async" width={640} height={360} className="aspect-video w-full object-cover" />
            ) : (
              <Monogram name={p.name} className="aspect-video w-full" />
            )}
            <div className="flex flex-1 flex-col p-5">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold text-ink">{p.name}</h2>
                <StatusTag status={p.status} />
              </div>
              <p className={`mt-2 flex-1 text-sm ${p.problem ? 'text-slate-600' : 'italic text-slate-400'}`}>{p.problem ?? 'Description not provided yet.'}</p>
              {p.techStack.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Tech stack">
                  {p.techStack.map((t) => (
                    <li key={t} className="chip">
                      {t}
                    </li>
                  ))}
                </ul>
              )}
              {(p.liveUrl || p.githubUrl) && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {p.liveUrl && (
                    <ExternalLink href={p.liveUrl} className="btn-primary px-3 py-1.5 text-xs">
                      Live demo
                    </ExternalLink>
                  )}
                  {p.githubUrl && (
                    <ExternalLink href={p.githubUrl} className="btn-secondary px-3 py-1.5 text-xs">
                      GitHub
                    </ExternalLink>
                  )}
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
