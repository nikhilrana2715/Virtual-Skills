import { useEffect, useId, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ArrowRight, X } from 'lucide-react';
import { ctaItem, navItems, type NavChild, type NavItem } from '../data/nav';
import { iconFor } from '../lib/icons';

/**
 * Nav / Header menu.
 * Desktop (xl+): links + "Our Resources" mega panel (hover with short delay, click/touch, keyboard).
 * Below xl: hamburger → slide-in drawer with Resources accordion and CTA at the bottom.
 */

function Chevron({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 20 20" className={`h-4 w-4 transition-transform duration-200 motion-reduce:transition-none ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M5 8l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Icon / Tile — brand-tinted square holding an item's icon. */
function IconTile({ icon, size = 'md' }: { icon: string; size?: 'sm' | 'md' }) {
  const Icon = iconFor(icon);
  return (
    <span
      className={`grid ${size === 'md' ? 'h-10 w-10' : 'h-8 w-8'} shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700 ring-1 ring-brand-100 transition-colors group-hover:bg-brand-600 group-hover:text-white group-hover:ring-brand-600`}
      aria-hidden
    >
      <Icon className={size === 'md' ? 'h-5 w-5' : 'h-4 w-4'} strokeWidth={1.75} />
    </span>
  );
}

function MegaPanel({ item, id, onNavigate }: { item: NavItem; id: string; onNavigate: () => void }) {
  return (
    <div id={id} className="container-page absolute inset-x-0 top-full pt-2">
      <div className="mega-enter rounded-2xl border border-slate-200 bg-white p-8 shadow-menu">
        <ul className="grid gap-x-8 gap-y-5 md:grid-cols-2 xl:grid-cols-3">
          {item.children!.map((c) => (
            <li key={c.href}>
              <Link to={c.href} onClick={onNavigate} className="group flex gap-3 rounded-lg p-2 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-brand-600">
                <IconTile icon={c.icon} />
                <span className="min-w-0">
                  <span className="block text-sm font-bold uppercase tracking-wide text-brand-700 group-hover:text-brand-800">{c.label}</span>
                  <span className="mt-0.5 block text-sm text-slate-600">{c.desc}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex items-center justify-between gap-4 border-t border-slate-100 pt-4 text-sm">
          <span className="text-slate-500">{item.footer?.text}</span>
          <Link to={item.href} onClick={onNavigate} className="inline-flex shrink-0 items-center gap-1 font-semibold text-brand-700 hover:text-brand-800">
            {item.footer?.allLabel ?? `All ${item.label}`} <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </div>
  );
}

const linkCls = ({ isActive }: { isActive: boolean }) => `btn-ghost px-3 ${isActive ? 'text-brand-700' : ''}`;

/** Desktop navigation. Render inside a positioned (sticky) header so the panel spans its width. */
export function MegaMenu() {
  const [open, setOpen] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const navRef = useRef<HTMLElement>(null);
  const triggers = useRef<Record<string, HTMLButtonElement | null>>({});
  const loc = useLocation();
  const uid = useId();

  // Close on route change, Esc and outside click.
  useEffect(() => setOpen(null), [loc.pathname, loc.search, loc.hash]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        triggers.current[open]?.focus();
        setOpen(null);
      }
    };
    const onDown = (e: PointerEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpen(null);
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [open]);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const showSoon = (label: string) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(label), 80);
  };
  const hideSoon = () => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(null), 150);
  };
  const active = navItems.find((n) => n.label === open && n.children);
  const pathOf = (href: string) => href.split(/[?#]/)[0];
  const inSection = (n: NavItem) => loc.pathname.startsWith(n.href) || (n.children?.some((c) => loc.pathname === pathOf(c.href)) ?? false);

  return (
    <nav ref={navRef} aria-label="Main" className="hidden items-center gap-0.5 xl:flex" onMouseLeave={hideSoon}>
      {navItems.map((n) =>
        n.children ? (
          <button
            key={n.label}
            ref={(el) => {
              triggers.current[n.label] = el;
            }}
            type="button"
            className={`btn-ghost gap-1 px-3 ${open === n.label || inSection(n) ? 'text-brand-700' : ''} ${open === n.label ? 'bg-brand-50' : ''}`}
            aria-haspopup="true"
            aria-expanded={open === n.label}
            aria-controls={`${uid}-panel`}
            onMouseEnter={() => showSoon(n.label)}
            onClick={() => {
              window.clearTimeout(timer.current);
              setOpen((o) => (o === n.label ? null : n.label));
            }}
          >
            {n.label}
            <Chevron open={open === n.label} />
          </button>
        ) : (
          <NavLink key={n.label} to={n.href} className={linkCls} onMouseEnter={() => open && hideSoon()}>
            {n.label}
          </NavLink>
        ),
      )}
      {active && (
        <div onMouseEnter={() => window.clearTimeout(timer.current)}>
          <MegaPanel item={active} id={`${uid}-panel`} onNavigate={() => setOpen(null)} />
        </div>
      )}
    </nav>
  );
}

export function CtaButton({ className = '', onClick }: { className?: string; onClick?: () => void }) {
  return (
    <Link to={ctaItem.href} onClick={onClick} className={`btn-primary rounded-full px-5 ${className}`}>
      {ctaItem.label}
    </Link>
  );
}

/** Mobile / tablet: slide-in drawer. */
export function MobileDrawer({ open, onClose, extra }: { open: boolean; onClose: () => void; extra?: React.ReactNode }) {
  const [section, setSection] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const loc = useLocation();

  useEffect(() => {
    if (open) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loc.pathname, loc.search, loc.hash]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.querySelector<HTMLElement>('button, a')?.focus();
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 xl:hidden" role="dialog" aria-modal="true" aria-label="Menu">
      <button className="drawer-fade absolute inset-0 bg-ink/40" aria-label="Close menu" tabIndex={-1} onClick={onClose} />
      <div ref={panelRef} className="drawer-slide absolute inset-y-0 right-0 flex w-full max-w-sm flex-col bg-white shadow-menu">
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-4">
          <span className="font-semibold">Menu</span>
          <button className="btn-ghost px-2" onClick={onClose} aria-label="Close menu">
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-4 py-2" aria-label="Mobile">
          {navItems.map((n) =>
            n.children ? (
              <div key={n.label} className="border-b border-slate-100">
                <button
                  type="button"
                  className="flex w-full items-center justify-between py-3 text-left font-medium text-ink"
                  aria-expanded={section === n.label}
                  onClick={() => setSection((s) => (s === n.label ? null : n.label))}
                >
                  {n.label}
                  <Chevron open={section === n.label} />
                </button>
                {section === n.label && (
                  <ul className="space-y-1 pb-3">
                    {n.children.map((c: NavChild) => (
                      <li key={c.href}>
                        <Link to={c.href} onClick={onClose} className="group flex gap-3 rounded-lg px-2 py-2 hover:bg-slate-50">
                          <IconTile icon={c.icon} size="sm" />
                          <span className="min-w-0">
                            <span className="block text-sm font-bold uppercase tracking-wide text-brand-700">{c.label}</span>
                            <span className="block text-xs text-slate-600">{c.desc}</span>
                          </span>
                        </Link>
                      </li>
                    ))}
                    <li>
                      <Link to={n.href} onClick={onClose} className="flex items-center gap-1 px-2 py-2 text-sm font-semibold text-brand-700">
                        {n.footer?.allLabel ?? `All ${n.label}`} <ArrowRight className="h-4 w-4" aria-hidden />
                      </Link>
                    </li>
                  </ul>
                )}
              </div>
            ) : (
              <NavLink
                key={n.label}
                to={n.href}
                onClick={onClose}
                className={({ isActive }) => `block border-b border-slate-100 py-3 font-medium ${isActive ? 'text-brand-700' : 'text-ink'}`}
              >
                {n.label}
              </NavLink>
            ),
          )}
          {extra}
        </nav>
        <div className="border-t border-slate-100 p-4">
          <CtaButton className="w-full" onClick={onClose} />
        </div>
      </div>
    </div>
  );
}
