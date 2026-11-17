/** Internal provider-agnostic shape. Provider API types never leak past the adapter. */
export interface NormalizedResource {
  provider: string;
  providerResourceId: string;
  name: string;
  fullName: string;
  summary: string | null;
  ownerName: string | null;
  sourceUrl: string;
  cloneUrl: string | null;
  downloadUrl: string | null;
  documentationUrl: string | null;
  language: string | null;
  topics: string[];
  licenseSpdx: string | null;
  licenseUrl: string | null;
  stars: number | null;
  forks: number | null;
  openIssues: number | null;
  archived: boolean;
  lastCommitAt: string | null;
}

export interface RepositoryProvider {
  name: string;
  validateSourceUrl(url: string): boolean;
  fetchResource(identifier: string): Promise<NormalizedResource>;
}

export class ProviderError extends Error {
  constructor(message: string, public status: number, public code: 'not_found' | 'rate_limited' | 'invalid' | 'upstream') {
    super(message);
  }
}
