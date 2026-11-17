/**
 * Blueprint §11: offer a download only when the provider officially serves it AND a license is known.
 * Unknown / NOASSERTION licenses never get a download button — users go to the original source.
 */
const UNKNOWN = new Set(['', 'NOASSERTION', 'OTHER', 'UNKNOWN']);

export interface DownloadDecision {
  allowed: boolean;
  url: string | null;
  label: string;
  reason: string;
}

export function decideDownload(input: {
  downloadUrl: string | null;
  licenseSpdx: string | null;
  archivedBySource?: boolean;
}): DownloadDecision {
  const lic = (input.licenseSpdx ?? '').trim().toUpperCase();
  if (!input.downloadUrl) {
    return { allowed: false, url: null, label: 'Open Original Source', reason: 'No provider-hosted download available.' };
  }
  if (UNKNOWN.has(lic)) {
    return {
      allowed: false,
      url: null,
      label: 'Open Original Source',
      reason: 'License unknown — check source terms before downloading.',
    };
  }
  return {
    allowed: true,
    url: input.downloadUrl,
    label: 'Download ZIP (Source-hosted)',
    reason: `Served by the original provider under ${input.licenseSpdx}.`,
  };
}

export function licenseLabel(spdx: string | null): string {
  const lic = (spdx ?? '').trim();
  if (!lic || UNKNOWN.has(lic.toUpperCase())) return 'License: Unknown — check source terms';
  return `License: ${lic}`;
}
