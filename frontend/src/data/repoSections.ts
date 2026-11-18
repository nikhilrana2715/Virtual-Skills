/**
 * Our Repository sections. Every catalog repo has exactly one category (DB, admin-managed);
 * this maps each category to exactly one section. Categories not listed here land in "Others",
 * so a new category never makes repos disappear.
 */
export interface RepoSection {
  id: string;
  label: string;
  /** One line (≤60 chars) shown in the header menu. */
  desc: string;
  icon: string;
  categories: string[];
}

export const REPO_SECTIONS: RepoSection[] = [
  {
    id: 'ai-ml',
    label: 'AI & ML',
    desc: 'Agents, MCP servers, models, RAG and ML frameworks',
    icon: 'brain',
    categories: ['ai-machine-learning', 'generative-ai', 'ai-agents', 'mcp-ecosystem', 'rag-knowledge-systems', 'models-datasets', 'research-papers'],
  },
  { id: 'data', label: 'Data Science & Analytics', desc: 'Notebooks, data analysis and ML lifecycle tools', icon: 'chart', categories: ['data-science-analytics'] },
  { id: 'web', label: 'Full Stack / Web', desc: 'Web frameworks, build tools, SDKs and dev tools', icon: 'globe', categories: ['web-development', 'developer-tools'] },
  { id: 'automation', label: 'Automation & Scripts', desc: 'Workflow automation and job orchestration', icon: 'workflow', categories: ['automation-integration'] },
  {
    id: 'cloud',
    label: 'Cloud & DevOps',
    desc: 'IaC, containers, monitoring, networking and databases',
    icon: 'cloud',
    categories: ['cloud-infrastructure', 'devops-cloud', 'it-operations', 'networking', 'databases-storage'],
  },
  { id: 'prompt', label: 'Prompt & Loop Engineering', desc: 'Agent skills, prompt packs and reusable workflows', icon: 'message', categories: ['ai-skills-workflows'] },
  { id: 'mobile-games', label: 'Mobile / Games', desc: 'Mobile apps and game projects', icon: 'gamepad', categories: [] },
  { id: 'others', label: 'Others', desc: 'Security, IT service management, robotics and more', icon: 'boxes', categories: [] }, // filled at runtime with every unmapped category
];

/** Resolve sections against the live category list; "Others" gets all unmapped slugs. */
export function resolveSections(allCategorySlugs: string[]): RepoSection[] {
  const mapped = new Set(REPO_SECTIONS.flatMap((s) => s.categories));
  const others = allCategorySlugs.filter((s) => !mapped.has(s));
  return REPO_SECTIONS.map((s) => (s.id === 'others' ? { ...s, categories: others } : s));
}
