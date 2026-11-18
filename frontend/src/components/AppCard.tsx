import { appCategoryLabel, type App, type Pricing } from '../data';
import { ExternalLink } from './common';

const PRICING_CLS: Record<Pricing, string> = {
  Free: 'bg-green-100 text-green-800',
  Freemium: 'bg-brand-100 text-brand-800',
  Paid: 'bg-amber-100 text-amber-800',
};

export function PricingTag({ value }: { value: Pricing }) {
  return <span className={`chip ${PRICING_CLS[value]}`}>{value}</span>;
}

/** Lettered tile used when no logo/screenshot file is provided (we never hotlink or invent logos). */
export function Monogram({ name, className = '' }: { name: string; className?: string }) {
  const letters = name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className={`grid place-items-center bg-gradient-to-br from-brand-50 to-brand-100 text-2xl font-bold text-brand-700 ${className}`} role="img" aria-label={`${name} (logo not provided)`}>
      {letters}
    </div>
  );
}

export function AppCard({ app }: { app: App }) {
  return (
    <article className="card group flex flex-col overflow-hidden transition-shadow hover:shadow-md">
      {app.image ? (
        <img src={app.image} alt={`${app.name} logo`} loading="lazy" decoding="async" width={400} height={160} className="h-32 w-full bg-slate-50 object-contain p-6" />
      ) : (
        <Monogram name={app.name} className="h-32 w-full" />
      )}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-ink">{app.name}</h3>
          <PricingTag value={app.pricing} />
        </div>
        <p className="mt-1 text-xs font-medium uppercase tracking-wide text-brand-700">{appCategoryLabel(app.category)}</p>
        <p className="mt-2 flex-1 text-sm text-slate-600">{app.description}</p>
        <div className="mt-4 flex items-center justify-between gap-2">
          <ExternalLink href={app.url} className="btn-secondary px-3 py-1.5 text-xs">
            Visit official site
          </ExternalLink>
          {!app.verified && <span className="text-xs text-amber-700">URL not verified</span>}
        </div>
      </div>
    </article>
  );
}
