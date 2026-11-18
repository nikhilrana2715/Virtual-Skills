import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { Menu as MenuIcon, Search } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { CtaButton, MegaMenu, MobileDrawer } from './MegaMenu';
import { ExternalLink } from './common';
import { site, SOCIAL_LABELS, type SocialKey } from '../data/site';

export function Logo() {
  return (
    <Link to="/" className="flex shrink-0 items-center gap-2 font-bold tracking-tight text-ink">
      <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden>
        <rect width="32" height="32" rx="8" className="fill-brand-600" />
        <path d="M8 10l8 13 8-13" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="text-lg">Virtual Skills</span>
    </Link>
  );
}

const ACCOUNT_LINKS = (admin: boolean) => [
  ['/account/bookmarks', 'Saved resources'],
  ['/account/profile', 'Profile & settings'],
  ...(admin ? [['/admin', 'Admin dashboard']] : []),
];

function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  if (!user)
    return (
      <Link to="/login" className="btn-ghost hidden sm:inline-flex">
        Sign in
      </Link>
    );
  return (
    <div className="relative">
      <button className="btn-ghost px-2" aria-expanded={open} aria-haspopup="menu" aria-label="Account menu" onClick={() => setOpen((o) => !o)}>
        <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">{user.name[0]?.toUpperCase()}</span>
      </button>
      {open && (
        <div role="menu" className="card absolute right-0 z-30 mt-2 w-52 py-1 shadow-lg" onMouseLeave={() => setOpen(false)}>
          <p className="truncate px-4 py-2 text-xs text-slate-500">{user.name}</p>
          {ACCOUNT_LINKS(user.role === 'admin').map(([to, label]) => (
            <Link key={to} role="menuitem" to={to} className="block px-4 py-2 text-sm hover:bg-slate-50" onClick={() => setOpen(false)}>
              {label}
            </Link>
          ))}
          <button
            role="menuitem"
            className="block w-full px-4 py-2 text-left text-sm text-red-700 hover:bg-red-50"
            onClick={async () => {
              setOpen(false);
              await logout();
              nav('/');
            }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

function DrawerSearch({ onDone }: { onDone: () => void }) {
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const submit = (e: FormEvent) => {
    e.preventDefault();
    nav(`/explore${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`);
    onDone();
  };
  return (
    <form onSubmit={submit} role="search" className="mt-4">
      <input className="input" placeholder="Search resources…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search resources" />
    </form>
  );
}

function DrawerAccount({ onDone }: { onDone: () => void }) {
  const { user } = useAuth();
  const links = user ? ACCOUNT_LINKS(user.role === 'admin') : [['/login', 'Sign in'], ['/register', 'Create account']];
  return (
    <div className="mt-4 space-y-1 text-sm">
      {links.map(([to, label]) => (
        <Link key={to} to={to} onClick={onDone} className="block rounded-lg px-2 py-2 text-slate-700 hover:bg-slate-50">
          {label}
        </Link>
      ))}
    </div>
  );
}

export function Layout() {
  const [drawer, setDrawer] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const close = useCallback(() => setDrawer(false), []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const socials = (Object.keys(site.links) as SocialKey[]).filter((k) => site.links[k]);

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 btn-primary">
        Skip to content
      </a>
      <header className={`sticky top-0 z-20 border-b bg-white/90 backdrop-blur transition-shadow ${scrolled ? 'border-slate-200 shadow-sm' : 'border-transparent'}`}>
        <div className="container-page flex h-16 items-center gap-4">
          <Logo />
          <div className="flex flex-1 justify-center">
            <MegaMenu />
          </div>
          <div className="flex items-center justify-end gap-2">
            <Link to="/explore" className="btn-ghost hidden px-2 xl:inline-flex" aria-label="Search resources">
              <Search className="h-5 w-5" aria-hidden />
            </Link>
            <CtaButton className="hidden sm:inline-flex" />
            <UserMenu />
            <button className="btn-ghost px-2 xl:hidden" aria-label="Open menu" aria-expanded={drawer} onClick={() => setDrawer(true)}>
              <MenuIcon className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </div>
      </header>
      <MobileDrawer
        open={drawer}
        onClose={close}
        extra={
          <>
            <DrawerSearch onDone={close} />
            <DrawerAccount onDone={close} />
          </>
        }
      />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <footer className="mt-16 border-t border-slate-200 bg-white">
        <div className="container-page grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Logo />
            <p className="mt-3 max-w-sm text-sm text-slate-600">{site.mission}</p>
            {socials.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-3 text-sm">
                {socials.map((k) => (
                  <li key={k}>
                    <ExternalLink href={site.links[k]} className="text-slate-600 hover:text-brand-700">
                      {SOCIAL_LABELS[k]}
                    </ExternalLink>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <FooterCol
            title="Hub"
            links={[
              ['/resources', 'Our Resources'],
              ['/repository', 'Our Repository'],
              ['/applications', 'Our Applications'],
              ['/projects', 'Our Projects'],
            ]}
          />
          <FooterCol
            title="Catalog"
            links={[
              ['/explore', 'Explore'],
              ['/categories', 'Categories'],
              ['/trending', 'Trending'],
              ['/latest', 'Latest'],
            ]}
          />
          <FooterCol
            title="Company"
            links={[
              ['/about', 'About Us'],
              ['/contact', 'Contact Us'],
              ['/terms', 'Terms of use'],
              ['/privacy', 'Privacy policy'],
              ['/licenses', 'Licenses & downloads'],
            ]}
          />
        </div>
        <div className="border-t border-slate-100 py-4 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Virtual Skills · Metadata from GitHub and other providers; projects belong to their respective owners.
        </div>
      </footer>
    </div>
  );
}

function FooterCol({ title, links }: { title: string; links: string[][] }) {
  return (
    <div>
      <h4 className="mb-3 text-sm font-semibold">{title}</h4>
      <ul className="space-y-2 text-sm text-slate-600">
        {links.map(([to, label]) => (
          <li key={to}>
            <Link to={to} className="hover:text-brand-700">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
