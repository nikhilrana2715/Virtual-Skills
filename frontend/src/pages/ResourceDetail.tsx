import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api, fmtDate, fmtNum } from '../lib/api';
import type { Resource } from '../lib/types';
import { RESOURCE_TYPES } from '../lib/types';
import { BookmarkButton, ProviderIcon, ResourceGrid } from '../components/ResourceCard';
import { EmptyState, ErrorState, ExternalLink, Spinner } from '../components/common';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 py-2.5 text-sm last:border-0">
      <dt className="text-slate-500">{label}</dt>
      <dd className="min-w-0 text-right font-medium break-words">{children ?? <span className="font-normal text-slate-400">Not provided</span>}</dd>
    </div>
  );
}

function CopyBlock({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative">
      <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 pr-20 font-mono text-sm text-slate-100">
        <code>{text}</code>
      </pre>
      <button
        className="absolute right-2 top-2 rounded-md bg-slate-700 px-2.5 py-1 text-xs text-white hover:bg-slate-600"
        onClick={async () => {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}

function ReportForm({ slug }: { slug: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('broken_link');
  const [details, setDetails] = useState('');
  const m = useMutation({ mutationFn: () => api(`/resources/${slug}/report`, { method: 'POST', body: { reason, details: details || undefined } }) });
  if (m.isSuccess) return <p className="text-sm text-green-700">Thanks — an admin will review your report.</p>;
  if (!open)
    return (
      <button className="text-sm text-slate-500 underline hover:text-slate-700" onClick={() => setOpen(true)}>
        Report this resource
      </button>
    );
  return (
    <form
      className="card space-y-3 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        m.mutate();
      }}
    >
      <label className="label" htmlFor="rep-reason">
        Reason
      </label>
      <select id="rep-reason" className="input" value={reason} onChange={(e) => setReason(e.target.value)}>
        <option value="broken_link">Broken link</option>
        <option value="incorrect_info">Incorrect information</option>
        <option value="license_issue">License issue</option>
        <option value="security_concern">Security concern</option>
        <option value="takedown">Takedown request (owner)</option>
        <option value="spam">Spam</option>
        <option value="other">Other</option>
      </select>
      <textarea className="input" rows={3} maxLength={1000} placeholder="Details (optional)" value={details} onChange={(e) => setDetails(e.target.value)} />
      {m.error && <p className="text-sm text-red-700">{(m.error as Error).message}</p>}
      <div className="flex gap-2">
        <button className="btn-primary" disabled={m.isPending}>
          Submit report
        </button>
        <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function ResourceDetail() {
  const { slug } = useParams();
  const q = useQuery({
    queryKey: ['resource', slug],
    queryFn: () => api<{ resource: Resource; related: Resource[] }>(`/resources/${slug}`),
    retry: (n, e: any) => e?.status !== 404 && n < 2,
  });

  if (q.isLoading) return <Spinner />;
  if (q.error)
    return (
      <div className="container-page py-12">
        {(q.error as any).status === 404 ? (
          <EmptyState title="Resource not found" icon="🗂️">
            It may have been archived or the link is wrong. <Link to="/explore" className="text-brand-700 underline">Explore resources</Link>
          </EmptyState>
        ) : (
          <ErrorState error={q.error} retry={q.refetch} />
        )}
      </div>
    );
  const { resource: r, related } = q.data!;

  return (
    <div className="container-page py-8">
      <nav className="mb-4 text-sm text-slate-500" aria-label="Breadcrumb">
        <Link to="/explore" className="hover:text-brand-700">Explore</Link> /{' '}
        <Link to={`/categories/${r.category.slug}`} className="hover:text-brand-700">{r.category.name}</Link> /{' '}
        <span className="text-slate-700">{r.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-6">
          <header className="card p-6">
            <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
              <ProviderIcon provider={r.provider} />
              {r.ownerName ?? r.provider}
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{r.name}</h1>
            <p className="mt-2 text-lg text-slate-600">{r.summary}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              <span className="chip bg-brand-50 text-brand-700">{RESOURCE_TYPES[r.resourceType] ?? r.resourceType}</span>
              {r.verificationStatus === 'verified' && <span className="chip bg-green-100 text-green-800">✓ Admin reviewed</span>}
              {r.archivedBySource && <span className="chip bg-amber-100 text-amber-800">Archived by source</span>}
              {r.license && <span className="chip">License available</span>}
            </div>
            {r.safetyStatus !== 'reviewed' && (
              <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900" role="note">
                <strong>Not yet safety-reviewed.</strong> Third-party code is untrusted — read the source and its license before installing or running it.
              </div>
            )}
            {r.safetyStatus === 'flagged' && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900" role="alert">
                This resource has been flagged by an administrator. Proceed with caution.
              </div>
            )}
          </header>

          {r.description && (
            <section className="card p-6">
              <h2 className="mb-3 text-lg font-semibold">Overview</h2>
              <div className="prose-text whitespace-pre-line text-slate-700">{r.description}</div>
            </section>
          )}

          <section className="card p-6">
            <h2 className="mb-3 text-lg font-semibold">Installation & usage</h2>
            {r.installation ? (
              <CopyBlock text={r.installation} />
            ) : (
              <p className="text-sm text-slate-600">
                No install command provided. See the{' '}
                <ExternalLink href={r.sourceUrl} className="text-brand-700 underline">
                  original repository
                </ExternalLink>{' '}
                for setup instructions.
              </p>
            )}
            {r.cloneUrl && (
              <div className="mt-4">
                <p className="mb-2 text-sm text-slate-600">Clone from source:</p>
                <CopyBlock text={`git clone ${r.cloneUrl}`} />
              </div>
            )}
            {r.compatibility && (
              <>
                <h3 className="mb-2 mt-5 font-semibold">Compatibility</h3>
                <p className="whitespace-pre-line text-sm text-slate-700">{r.compatibility}</p>
              </>
            )}
          </section>

          {(r.tags.length > 0 || r.topics.length > 0) && (
            <section className="card p-6">
              <h2 className="mb-3 text-lg font-semibold">Tags & topics</h2>
              <div className="flex flex-wrap gap-1.5">
                {r.tags.map((t) => (
                  <Link key={t.slug} to={`/explore?q=${encodeURIComponent(t.name)}`} className="chip bg-brand-50 text-brand-700 hover:bg-brand-100">
                    {t.name}
                  </Link>
                ))}
                {r.topics
                  .filter((t) => !r.tags.some((x) => x.name.toLowerCase() === t.toLowerCase()))
                  .map((t) => (
                    <span key={t} className="chip">
                      {t}
                    </span>
                  ))}
              </div>
            </section>
          )}

          <ReportForm slug={r.slug} />
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="card space-y-2 p-5">
            <ExternalLink href={r.sourceUrl} className="btn-primary w-full">
              Open Original Source
            </ExternalLink>
            {r.download.allowed ? (
              <ExternalLink href={r.download.url} className="btn-secondary w-full">
                {r.download.label}
              </ExternalLink>
            ) : null}
            <p className="text-xs text-slate-500">{r.download.reason} Files are served by the original provider, not by Virtual Skills.</p>
            <BookmarkButton id={r.id} />
            {r.documentationUrl && (
              <ExternalLink href={r.documentationUrl} className="btn-ghost w-full">
                Documentation
              </ExternalLink>
            )}
          </div>

          <dl className="card p-5">
            <h2 className="mb-2 font-semibold">Details</h2>
            <Field label="License">
              {r.license ? (
                <ExternalLink href={r.licenseUrl} className="text-brand-700 hover:underline">
                  {r.license}
                </ExternalLink>
              ) : (
                <span className="text-amber-700">Unknown — check source terms</span>
              )}
            </Field>
            <Field label="Category">
              <Link to={`/categories/${r.category.slug}`} className="text-brand-700 hover:underline">
                {r.category.name}
              </Link>
            </Field>
            <Field label="Language">{r.language}</Field>
            {r.platforms.length > 0 && <Field label="Platforms">{r.platforms.join(', ')}</Field>}
            <Field label="Stars">{fmtNum(r.stars)}</Field>
            <Field label="Forks">{fmtNum(r.forks)}</Field>
            <Field label="Open issues">{fmtNum(r.openIssues)}</Field>
            <Field label="Last commit">{r.lastCommitAt ? fmtDate(r.lastCommitAt) : null}</Field>
            <Field label="Maintainer">{r.ownerName}</Field>
            <Field label="Provider">{r.provider}</Field>
          </dl>

          <div className="card p-5 text-xs text-slate-500">
            <p>
              <strong className="text-slate-700">Source attribution:</strong> metadata from {r.provider === 'github' ? 'the GitHub API' : r.provider}. Project © its
              respective owners.
            </p>
            <p className="mt-2">Last checked: {r.lastSyncedAt ? new Date(r.lastSyncedAt).toLocaleString() : 'Not yet synced'}</p>
            <p>Listed: {fmtDate(r.createdAt)}</p>
          </div>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-xl font-bold">Related resources</h2>
          <ResourceGrid items={related} />
        </section>
      )}
    </div>
  );
}
