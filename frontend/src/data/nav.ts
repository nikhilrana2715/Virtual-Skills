import { appCategories, projects, projectSlug, topics } from './index';
import { REPO_SECTIONS } from './repoSections';

/** Header navigation — single source for desktop mega menus, mobile drawer and footer. */
export interface NavChild {
  label: string;
  href: string;
  /** One line (≤60 chars). */
  desc: string;
  icon: string;
}
export interface NavItem {
  label: string;
  href: string;
  children?: NavChild[];
  /** Mega panel footer: hint text + "see all" link label (goes to href). */
  footer?: { text: string; allLabel: string };
}

const short = (s: string, n = 60) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s);

export const navItems: NavItem[] = [
  { label: 'About Us', href: '/about' },
  {
    label: 'Our Resources',
    href: '/resources',
    children: topics.map((t) => ({ label: t.title, href: `/topics/${t.slug}`, desc: t.desc, icon: t.icon })),
    footer: { text: 'Roadmaps, courses, cheat sheets and related repositories for each topic.', allLabel: 'All resources' },
  },
  {
    label: 'Our Repository',
    href: '/repository',
    children: REPO_SECTIONS.map((s) => ({ label: s.label, href: `/repository?section=${s.id}`, desc: s.desc, icon: s.icon })),
    footer: { text: 'Every repository in the catalog, arranged by category.', allLabel: 'All repositories' },
  },
  {
    label: 'Our Applications',
    href: '/applications',
    children: appCategories.map((c) => ({ label: c.label, href: `/applications?category=${c.id}`, desc: c.desc, icon: c.icon })),
    footer: { text: 'Useful tech, IT and AI websites — official links only.', allLabel: 'All applications' },
  },
  {
    label: 'Our Projects',
    href: '/projects',
    children: projects.map((p) => ({
      label: p.name,
      href: `/projects#${projectSlug(p.name)}`,
      // Never invent a description: fall back to status / tech stack, then a neutral note.
      desc: short(p.problem ?? (p.techStack.length ? p.techStack.join(' · ') : p.status ?? 'Details coming soon')),
      icon: 'project',
    })),
    footer: { text: 'Applications we have built, with status and links.', allLabel: 'All projects' },
  },
  { label: 'Contact Us', href: '/contact' },
];

export const ctaItem = { label: 'Get in Touch', href: '/contact' };
