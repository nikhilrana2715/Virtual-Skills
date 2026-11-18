import { useState, type FormEvent } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { MegaMenu, MobileMegaMenu, useMenus } from './MegaMenu';

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 font-bold tracking-tight text-ink">
      <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden>
        <rect width="32" height="32" rx="8" className="fill-brand-600" />
        <path d="M8 10l8 13 8-13" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="text-lg">Virtual Skills</span>
    </Link>
  );
}

function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  if (!user)
    return (
      <div className="flex items-center gap-2">
        <Link to="/login" className="btn-ghost">
          Sign in
        </Link>
        <Link to="/register" className="btn-primary hidden sm:inline-flex">
          Create account
        </Link>
      </div>
    );
  return (
    <div className="relative">
      <button className="btn-ghost" aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen((o) => !o)}>
        <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
          {user.name[0]?.toUpperCase()}
        </span>
        <span className="hidden max-w-28 truncate sm:inline">{user.name}</span>
      </button>
      {open && (
        <div role="menu" className="card absolute right-0 z-30 mt-2 w-52 py-1 shadow-lg" onMouseLeave={() => setOpen(false)}>
          {[
            ['/account/bookmarks', 'Saved resources'],
            ['/account/profile', 'Profile & settings'],
            ...(user.role === 'admin' ? [['/admin', 'Admin dashboard']] : []),
          ].map(([to, label]) => (
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

export function HeaderSearch() {
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const submit = (e: FormEvent) => {
    e.preventDefault();
    nav(`/explore${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`);
  };
  return (
    <form onSubmit={submit} role="search" className="hidden max-w-xs flex-1 md:block lg:hidden xl:block">
      <input className="input bg-slate-50" placeholder="Search resources…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search resources" />
    </form>
  );
}

export function Layout() {
  const [mobile, setMobile] = useState(false);
  const menus = useMenus();
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 btn-primary">
        Skip to content
      </a>
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="container-page flex h-16 items-center gap-4 xl:gap-6">
          <Logo />
          <MegaMenu menus={menus} />
          <div className="ml-auto flex flex-1 items-center justify-end gap-3">
            <HeaderSearch />
            <UserMenu />
            <button className="btn-ghost px-2 lg:hidden" aria-label="Menu" aria-expanded={mobile} onClick={() => setMobile((m) => !m)}>
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
        {mobile && <MobileMegaMenu menus={menus} onNavigate={() => setMobile(false)} />}
      </header>
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <footer className="mt-16 border-t border-slate-200 bg-white">
        <div className="container-page grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Logo />
            <p className="mt-3 max-w-sm text-sm text-slate-600">
              One place to discover AI skills, MCP servers, agents, models and developer tools. Every listing links to its original source.
            </p>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold">Platform</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><Link to="/explore" className="hover:text-brand-700">Explore</Link></li>
              <li><Link to="/categories" className="hover:text-brand-700">Categories</Link></li>
              <li><Link to="/about" className="hover:text-brand-700">About</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold">Legal</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><Link to="/terms" className="hover:text-brand-700">Terms of use</Link></li>
              <li><Link to="/privacy" className="hover:text-brand-700">Privacy policy</Link></li>
              <li><Link to="/licenses" className="hover:text-brand-700">Licenses & downloads</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-100 py-4 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Virtual Skills · Metadata from GitHub and other providers; projects belong to their respective owners.
        </div>
      </footer>
    </div>
  );
}
