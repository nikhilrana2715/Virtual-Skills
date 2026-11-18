import { useEffect, useId, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Bot,
  Boxes,
  Brain,
  ChartColumn,
  Clock,
  Cloud,
  Code,
  Compass,
  Container,
  Cpu,
  Database,
  FileText,
  FlaskConical,
  Flame,
  FolderGit2,
  Globe,
  Layers,
  LayoutGrid,
  Library,
  Microscope,
  Network,
  Plug,
  Puzzle,
  RefreshCw,
  ScanSearch,
  Server,
  ShieldCheck,
  Sparkles,
  Ticket,
  Workflow,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { api } from '../lib/api';
import type { Category } from '../lib/types';
import { RESOURCE_TYPES } from '../lib/types';

/** Nav / MegaMenu — hover (desktop) or click/keyboard opens a multi-column panel of icon + title + description links. */

export interface MenuItem {
  to: string;
  title: string;
  description: string;
  count?: number;
  icon?: LucideIcon;
  /** Fallback when no SVG icon is mapped (e.g. a category an admin added later). */
  emoji?: string | null;
}
export interface Menu {
  id: string;
  label: string;
  icon: LucideIcon;
  intro: { title: string; text: string; cta: { to: string; label: string } };
  items: MenuItem[];
}

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  'ai-machine-learning': Brain,
  'generative-ai': Sparkles,
  'ai-agents': Bot,
  'ai-skills-workflows': Puzzle,
  'mcp-ecosystem': Plug,
  'rag-knowledge-systems': BookOpen,
  'models-datasets': Boxes,
  'robotics-edge-ai': Cpu,
  'research-papers': Microscope,
  'data-science-analytics': ChartColumn,
  'developer-tools': Wrench,
  'web-development': Globe,
  'devops-cloud': Container,
  'security-reverse-engineering': ScanSearch,
  'cloud-infrastructure': Cloud,
  'it-operations': Activity,
  'it-service-management': Ticket,
  networking: Network,
  'databases-storage': Database,
  'cybersecurity-defense': ShieldCheck,
  'automation-integration': Workflow,
};

const TYPE_META: Record<string, { icon: LucideIcon; description: string }> = {
  skill: { icon: Puzzle, description: 'Packaged instructions and scripts an AI assistant loads on demand' },
  mcp_server: { icon: Plug, description: 'Model Context Protocol servers that connect AI tools to data and apps' },
  ai_agent: { icon: Bot, description: 'Autonomous or semi-autonomous agents that plan and act' },
  model: { icon: Brain, description: 'Trained model weights and checkpoints' },
  dataset: { icon: Database, description: 'Datasets and evaluation sets for training and testing' },
  framework: { icon: Layers, description: 'Frameworks for building apps, agents and pipelines' },
  library: { icon: Library, description: 'Libraries and SDKs to use from your own code' },
  tool: { icon: Wrench, description: 'Ready-to-run applications, CLIs and services' },
  workflow: { icon: Workflow, description: 'Automation flows and reusable workflow templates' },
  repository: { icon: FolderGit2, description: 'General open-source repositories' },
  paper_implementation: { icon: FlaskConical, description: 'Code that reproduces published research' },
  documentation: { icon: FileText, description: 'Guides, references and learning material' },
};

// Which categories appear under which menu. Unlisted categories fall into "Developers" so nothing is hidden.
const GROUPS: { id: string; label: string; icon: LucideIcon; slugs: string[]; intro: Menu['intro'] }[] = [
  {
    id: 'ai',
    label: 'AI & ML',
    icon: Brain,
    slugs: ['ai-machine-learning', 'generative-ai', 'ai-agents', 'ai-skills-workflows', 'mcp-ecosystem', 'rag-knowledge-systems', 'models-datasets', 'robotics-edge-ai', 'research-papers'],
    intro: {
      title: 'AI & Machine Learning',
      text: 'Agents, skills, MCP servers, models and frameworks — each linked to its original source.',
      cta: { to: '/explore?q=ai', label: 'Search all AI resources' },
    },
  },
  {
    id: 'it',
    label: 'IT & Cloud',
    icon: Server,
    slugs: ['cloud-infrastructure', 'devops-cloud', 'it-operations', 'it-service-management', 'networking', 'databases-storage', 'cybersecurity-defense', 'security-reverse-engineering', 'automation-integration'],
    intro: {
      title: 'IT & Cloud',
      text: 'Infrastructure as code, monitoring, networking, databases, security and automation tools for IT teams.',
      cta: { to: '/categories', label: 'See all categories' },
    },
  },
  {
    id: 'dev',
    label: 'Developers',
    icon: Code,
    slugs: ['developer-tools', 'web-development', 'data-science-analytics'],
    intro: {
      title: 'For developers',
      text: 'CLIs, SDKs, IDE extensions, web frameworks and data tooling.',
      cta: { to: '/explore?type=library', label: 'Browse libraries' },
    },
  },
];

const DISCOVER: MenuItem[] = [
  { to: '/explore', title: 'Explore all', description: 'Search and filter the full catalog', icon: Compass },
  { to: '/categories', title: 'All categories', description: 'Every topic area with resource counts', icon: LayoutGrid },
  { to: '/trending', title: 'Trending', description: 'What people are viewing and starring now', icon: Flame },
  { to: '/latest', title: 'Latest additions', description: 'Newest resources added to the catalog', icon: Clock },
  { to: '/explore?sort=updated', title: 'Recently updated', description: 'Projects with the freshest source activity', icon: RefreshCw },
  { to: '/explore?verified=true', title: 'Admin reviewed', description: 'Listings checked by a Virtual Skills admin', icon: BadgeCheck },
];

const catItem = (c: Category): MenuItem => ({
  to: `/categories/${c.slug}`,
  title: c.name,
  description: c.description ?? 'Browse resources in this category',
  count: c.count,
  icon: CATEGORY_ICONS[c.slug],
  emoji: c.icon,
});

export function useMenus(): Menu[] {
  const cats = useQuery({ queryKey: ['categories'], queryFn: () => api<{ categories: Category[] }>('/categories'), staleTime: 300_000 });
  const all = cats.data?.categories ?? [];
  const bySlug = new Map(all.map((c) => [c.slug, c]));
  const grouped = new Set(GROUPS.flatMap((g) => g.slugs));
  const leftovers = all.filter((c) => !grouped.has(c.slug));

  const menus: Menu[] = GROUPS.map((g) => ({
    id: g.id,
    label: g.label,
    icon: g.icon,
    intro: g.intro,
    items: [...g.slugs.map((s) => bySlug.get(s)).filter((c): c is Category => !!c), ...(g.id === 'dev' ? leftovers : [])].map(catItem),
  }));
  menus.push({
    id: 'types',
    label: 'Resource types',
    icon: Layers,
    intro: { title: 'Browse by type', text: 'Find exactly the kind of resource you need, across every category.', cta: { to: '/explore', label: 'Open full filters' } },
    items: Object.entries(RESOURCE_TYPES).map(([value, label]) => ({
      to: `/explore?type=${value}`,
      title: label,
      description: TYPE_META[value]?.description ?? `Browse ${label.toLowerCase()} resources`,
      icon: TYPE_META[value]?.icon ?? Boxes,
    })),
  });
  menus.push({
    id: 'discover',
    label: 'Discover',
    icon: Compass,
    intro: { title: 'Discover', text: 'Trending projects, new arrivals and admin-reviewed picks.', cta: { to: '/trending', label: 'See trending' } },
    items: DISCOVER,
  });
  return menus.filter((m) => m.items.length > 0);
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 20 20" className={`h-4 w-4 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M5 8l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Icon / Tile — brand-tinted square holding the item's SVG icon (or emoji fallback). */
function IconTile({ item, size = 'md' }: { item: MenuItem; size?: 'sm' | 'md' }) {
  const Icon = item.icon;
  const box = size === 'md' ? 'h-10 w-10' : 'h-8 w-8';
  return (
    <span
      className={`grid ${box} shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700 ring-1 ring-brand-100 transition-colors group-hover:bg-brand-600 group-hover:text-white group-hover:ring-brand-600`}
      aria-hidden
    >
      {Icon ? <Icon className={size === 'md' ? 'h-5 w-5' : 'h-4 w-4'} strokeWidth={1.75} /> : <span className="text-base leading-none">{item.emoji ?? '•'}</span>}
    </span>
  );
}

function Panel({ menu, id, onNavigate }: { menu: Menu; id: string; onNavigate: () => void }) {
  const MenuIcon = menu.icon;
  return (
    <div id={id} className="container-page absolute inset-x-0 top-full pt-2">
      <div className="card grid gap-8 p-6 shadow-menu lg:grid-cols-[240px_1fr] lg:p-8">
        <div className="rounded-lg bg-brand-50 p-5">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-600 text-white" aria-hidden>
            <MenuIcon className="h-6 w-6" strokeWidth={1.75} />
          </span>
          <p className="mt-4 text-lg font-semibold text-ink">{menu.intro.title}</p>
          <p className="mt-2 text-sm text-slate-600">{menu.intro.text}</p>
          <Link to={menu.intro.cta.to} onClick={onNavigate} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800">
            {menu.intro.cta.label} <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        <ul className="grid content-start gap-x-6 gap-y-4 sm:grid-cols-2 xl:grid-cols-3">
          {menu.items.map((it) => (
            <li key={it.to}>
              <Link to={it.to} onClick={onNavigate} className="group flex gap-3 rounded-lg p-2 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-brand-600">
                <IconTile item={it} />
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-bold uppercase tracking-wide text-brand-700 group-hover:text-brand-800">{it.title}</span>
                    {it.count !== undefined && <span className="chip">{it.count}</span>}
                  </span>
                  <span className="mt-0.5 block text-sm text-slate-600">{it.description}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** Desktop mega menu. Render inside a positioned (sticky/relative) header so panels span its width. */
export function MegaMenu({ menus }: { menus: Menu[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const triggers = useRef<Record<string, HTMLButtonElement | null>>({});
  const loc = useLocation();
  const uid = useId();

  useEffect(() => setOpen(null), [loc.pathname, loc.search]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        triggers.current[open]?.focus();
        setOpen(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const show = (id: string) => {
    window.clearTimeout(timer.current);
    setOpen(id);
  };
  const hideSoon = () => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(null), 150);
  };
  const active = menus.find((m) => m.id === open);

  return (
    <nav aria-label="Main" className="hidden items-center gap-1 lg:flex" onMouseLeave={hideSoon} onMouseEnter={() => window.clearTimeout(timer.current)}>
      {menus.map((m) => (
        <button
          key={m.id}
          ref={(el) => {
            triggers.current[m.id] = el;
          }}
          type="button"
          className={`btn-ghost gap-1 px-3 ${open === m.id ? 'bg-brand-50 text-brand-700' : ''}`}
          aria-expanded={open === m.id}
          aria-controls={`${uid}-${m.id}`}
          onMouseEnter={() => show(m.id)}
          onClick={() => (open === m.id ? setOpen(null) : show(m.id))}
        >
          {m.label}
          <Chevron open={open === m.id} />
        </button>
      ))}
      {active && <Panel menu={active} id={`${uid}-${active.id}`} onNavigate={() => setOpen(null)} />}
    </nav>
  );
}

/** Mobile: accordion version of the same menus. */
export function MobileMegaMenu({ menus, onNavigate }: { menus: Menu[]; onNavigate: () => void }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <nav className="container-page flex flex-col border-t border-slate-100 py-2 lg:hidden" aria-label="Mobile">
      {menus.map((m) => {
        const MenuIcon = m.icon;
        return (
          <div key={m.id} className="border-b border-slate-100 last:border-0">
            <button
              type="button"
              className="flex w-full items-center gap-3 py-3 text-left text-sm font-semibold text-ink"
              aria-expanded={open === m.id}
              onClick={() => setOpen((o) => (o === m.id ? null : m.id))}
            >
              <MenuIcon className="h-5 w-5 text-brand-700" strokeWidth={1.75} aria-hidden />
              <span className="flex-1">{m.label}</span>
              <Chevron open={open === m.id} />
            </button>
            {open === m.id && (
              <ul className="space-y-2 pb-4">
                {m.items.map((it) => (
                  <li key={it.to}>
                    <Link to={it.to} onClick={onNavigate} className="group flex gap-3 rounded-lg px-2 py-1.5 hover:bg-slate-50">
                      <IconTile item={it} size="sm" />
                      <span className="min-w-0">
                        <span className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-brand-700">
                          {it.title}
                          {it.count !== undefined && <span className="chip normal-case">{it.count}</span>}
                        </span>
                        <span className="block text-xs text-slate-600">{it.description}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </nav>
  );
}
