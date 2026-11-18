/** Typed access to the JSON data files. Edit the JSON; these types keep pages honest. */
import resourcesJson from './resources.json';
import appsJson from './apps.json';
import projectsJson from './projects.json';

export type Pricing = 'Free' | 'Freemium' | 'Paid';
export interface LinkItem {
  name: string;
  url: string;
  pricing?: Pricing;
  verified?: boolean;
}
export interface Topic {
  slug: string;
  title: string;
  icon: string;
  desc: string;
  intro: string;
  roadmap: { beginner: string[]; intermediate: string[]; advanced: string[] };
  courses: LinkItem[];
  cheatSheets: LinkItem[];
  relatedCategories: string[];
  relatedAppCategories: string[];
}
export interface AppCategory {
  id: string;
  label: string;
  desc: string;
  icon: string;
}
export interface App {
  name: string;
  category: string;
  description: string;
  url: string;
  pricing: Pricing;
  image: string | null;
  verified: boolean;
}
export interface Project {
  name: string;
  problem: string | null;
  techStack: string[];
  status: 'Live' | 'In progress' | null;
  liveUrl: string | null;
  githubUrl: string | null;
  screenshot: string | null;
}

export const topics = resourcesJson.topics as Topic[];
export const appCategories = appsJson.categories as AppCategory[];
export const apps = appsJson.apps as App[];
export const projects = projectsJson.projects as Project[];

/** Stable anchor id for a project card (/projects#kpi-dashboard). */
export const projectSlug = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export const topicBySlug = (slug: string | undefined) => topics.find((t) => t.slug === slug);
export const appCategoryLabel = (id: string) => appCategories.find((c) => c.id === id)?.label ?? id;
