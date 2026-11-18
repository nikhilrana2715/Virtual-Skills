/**
 * Site owner profile used by About, Contact and the footer.
 * Anything null is hidden in the UI — fill it in rather than leaving placeholder text.
 */
export const site = {
  name: 'Virtual Skills',
  tagline: 'Tech & learning hub for AI, IT and cloud',
  owner: {
    name: null as string | null,
    role: null as string | null,
    bio: null as string | null,
  },
  mission:
    'Help learners and builders find trustworthy AI, IT and cloud resources fast — every listing links to its original source, with honest metadata and no invented numbers.',
  /** Public contact email shown on the Contact page. null = hidden (the form still works). */
  email: null as string | null,
  links: {
    github: 'https://github.com/nikhilrana2715' as string | null,
    linkedin: null as string | null,
    youtube: null as string | null,
    portfolio: null as string | null,
  },
  /** Skills / tech stack shown on About. */
  skills: ['React', 'TypeScript', 'Node.js', 'Express', 'SQL', 'Tailwind CSS', 'Python', 'AI tooling'],
  /** Journey timeline on About: { year, title, text }. Empty = section hidden. */
  timeline: [] as { year: string; title: string; text: string }[],
};

export type SocialKey = keyof typeof site.links;
export const SOCIAL_LABELS: Record<SocialKey, string> = { github: 'GitHub', linkedin: 'LinkedIn', youtube: 'YouTube', portfolio: 'Portfolio' };
