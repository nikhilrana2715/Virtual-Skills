import { Link } from 'react-router-dom';
import { EmptyState, ExternalLink } from '../components/common';
import { useSeo } from '../lib/seo';
import { site, SOCIAL_LABELS, type SocialKey } from '../data/site';

function Doc({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="container-page max-w-3xl py-10">
      <h1 className="mb-6 text-3xl font-bold tracking-tight">{title}</h1>
      <div className="card space-y-4 p-6 leading-relaxed text-slate-700 sm:p-8 [&_h2]:mt-6 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-ink [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
        {children}
      </div>
    </div>
  );
}

export const About = () => {
  useSeo('About Us', site.mission);
  const socials = (Object.keys(site.links) as SocialKey[]).filter((k) => site.links[k]);
  return (
  <Doc title="About Us">
    {(site.owner.name || site.owner.role) && (
      <p className="text-lg font-semibold text-ink">
        {site.owner.name}
        {site.owner.role && <span className="font-normal text-slate-600"> · {site.owner.role}</span>}
      </p>
    )}
    {site.owner.bio && <p>{site.owner.bio}</p>}
    <p>
      Virtual Skills is a tech and learning hub. Instead of searching many sites, you can find AI skills, MCP servers, agents, models, IT and cloud
      tools, learning roadmaps and useful applications in one place — each linked to its original source.
    </p>
    <h2>Mission</h2>
    <p>{site.mission}</p>
    <h2>Skills & tech stack</h2>
    <ul className="!list-none !pl-0 flex flex-wrap gap-2">
      {site.skills.map((s) => (
        <li key={s} className="chip">
          {s}
        </li>
      ))}
    </ul>
    {site.timeline.length > 0 && (
      <>
        <h2>Journey</h2>
        <ol className="space-y-3 border-l-2 border-brand-100 pl-5">
          {site.timeline.map((t) => (
            <li key={t.year + t.title}>
              <p className="text-sm font-semibold text-brand-700">{t.year}</p>
              <p className="font-medium text-ink">{t.title}</p>
              <p className="text-sm">{t.text}</p>
            </li>
          ))}
        </ol>
      </>
    )}
    {socials.length > 0 && (
      <>
        <h2>Find us online</h2>
        <ul className="!list-none !pl-0 flex flex-wrap gap-4">
          {socials.map((k) => (
            <li key={k}>
              <ExternalLink href={site.links[k]} className="text-brand-700 hover:underline">
                {SOCIAL_LABELS[k]}
              </ExternalLink>
            </li>
          ))}
        </ul>
      </>
    )}
    <p>
      Questions or ideas? <Link to="/contact" className="text-brand-700 underline">Contact us</Link>.
    </p>
    <h2>Principles</h2>
    <ul>
      <li><strong>Source transparency</strong> — every listing shows its original source and when metadata was last checked.</li>
      <li><strong>Respect licenses</strong> — we do not mirror or rehost third-party code. Unknown licenses are shown as unknown.</li>
      <li><strong>Untrusted by default</strong> — listed code is never executed by the platform. Review code yourself before running it.</li>
      <li><strong>Human oversight</strong> — administrators curate, verify and categorize resources.</li>
    </ul>
    <h2 id="ranking">How Trending is ranked</h2>
    <p>The trending score combines several transparent signals, so small but well-maintained projects are not buried:</p>
    <ul>
      <li>Recent commits (last 30 / 90 / 365 days)</li>
      <li>Admin review status</li>
      <li>A clearly identified license</li>
      <li>Documentation or install instructions present</li>
      <li>Popularity (stars, logarithmic and capped) and page views</li>
      <li>A penalty if the project is archived by its owner</li>
    </ul>
    <p>Popularity never implies safety. “Admin reviewed” means a curator checked the listing, not that the code is guaranteed safe.</p>
  </Doc>
  );
};

export const Terms = () => (
  <Doc title="Terms of use">
    <p>Virtual Skills lists metadata about third-party projects and links to their original sources. Projects belong to their respective owners and are governed by their own licenses and terms.</p>
    <h2>No warranty</h2>
    <p>Listings are provided “as is”. We do not guarantee that any listed project is safe, accurate, maintained or fit for a purpose. You are responsible for reviewing code and licenses before use.</p>
    <h2>Acceptable use</h2>
    <ul>
      <li>Do not use the platform to promote malware, credential theft, evasion or unauthorized access.</li>
      <li>Do not scrape the service in a way that degrades it for others.</li>
      <li>Security and reverse-engineering resources are listed for learning, defensive analysis and authorized research only.</li>
    </ul>
    <h2>Reports & takedowns</h2>
    <p>Use “Report this resource” on any listing to flag broken links, incorrect information, license issues or to request a takedown as the project owner.</p>
  </Doc>
);

export const Privacy = () => (
  <Doc title="Privacy policy">
    <p>We collect only what is needed to run your account: your name, email address and a secure hash of your password. Your saved resources are private to you.</p>
    <h2>Cookies</h2>
    <p>We use a single HTTP-only session cookie to keep you signed in. No advertising or third-party tracking cookies.</p>
    <h2>Your rights</h2>
    <ul>
      <li>Export your data from <Link to="/account/profile" className="text-brand-700 underline">Profile & settings</Link>.</li>
      <li>Delete your account at any time from the same page; bookmarks are deleted with it.</li>
    </ul>
    <h2>Admin access</h2>
    <p>Audit logs record administrative changes to the catalog and are visible only to administrators.</p>
  </Doc>
);

export const Licenses = () => (
  <Doc title="Licenses & downloads">
    <p>Virtual Skills does not host third-party files. Every action takes you to the original provider.</p>
    <ul>
      <li><strong>Open Original Source</strong> — always available; goes to the project's official page.</li>
      <li><strong>Download ZIP (Source-hosted)</strong> — shown only when the provider officially serves an archive <em>and</em> a license was identified. The file comes from the provider, not from us.</li>
      <li><strong>License: Unknown — check source terms</strong> — no reliable license was detected. Unknown does not mean open source; public code is not automatically free to redistribute.</li>
    </ul>
    <p>Always keep license files and author attribution when you reuse a project.</p>
  </Doc>
);

export const NotFound = () => {
  useSeo('Page not found');
  return (
  <div className="container-page py-16">
    <EmptyState title="Page not found" icon="🧭">
      <Link to="/" className="text-brand-700 underline">Go home</Link>
    </EmptyState>
  </div>
  );
};
