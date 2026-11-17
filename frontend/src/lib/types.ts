export interface Tag {
  name: string;
  slug: string;
}

export interface Resource {
  id: string;
  name: string;
  slug: string;
  summary: string;
  description: string | null;
  resourceType: string;
  category: { name: string; slug: string };
  tags: Tag[];
  provider: string;
  ownerName: string | null;
  sourceUrl: string;
  cloneUrl: string | null;
  documentationUrl: string | null;
  language: string | null;
  platforms: string[];
  topics: string[];
  license: string | null;
  licenseLabel: string;
  licenseUrl: string | null;
  stars: number | null;
  forks: number | null;
  openIssues: number | null;
  archivedBySource: boolean;
  installation: string | null;
  compatibility: string | null;
  lastCommitAt: string | null;
  lastSyncedAt: string | null;
  verificationStatus: 'unreviewed' | 'verified' | 'rejected';
  safetyStatus: 'unreviewed' | 'reviewed' | 'flagged';
  download: { allowed: boolean; url: string | null; label: string; reason: string };
  createdAt: string;
  updatedAt: string;
  trendingScore?: number;
  // admin only
  publicationStatus?: 'draft' | 'published' | 'archived';
  providerResourceId?: string | null;
  downloadUrlRaw?: string | null;
  syncError?: string | null;
  viewCount?: number;
  categoryId?: string;
}

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  count: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

export const RESOURCE_TYPES: Record<string, string> = {
  repository: 'Repository',
  skill: 'Skill',
  mcp_server: 'MCP Server',
  ai_agent: 'AI Agent',
  model: 'Model',
  dataset: 'Dataset',
  framework: 'Framework',
  library: 'Library',
  tool: 'Tool',
  workflow: 'Workflow',
  paper_implementation: 'Paper Implementation',
  documentation: 'Documentation',
};
