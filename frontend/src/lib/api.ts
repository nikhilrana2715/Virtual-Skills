export class ApiError extends Error {
  constructor(public status: number, message: string, public body?: any) {
    super(message);
  }
}

export async function api<T = any>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(`/api/v1${path}`, {
    method: init.method ?? 'GET',
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
      'X-Requested-With': 'virtual-skills',
      ...(init.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    /* empty body */
  }
  if (!res.ok) {
    const details = Array.isArray(data?.details) ? ': ' + data.details.map((d: any) => `${d.path} ${d.message}`).join('; ') : '';
    throw new ApiError(res.status, (data?.error ?? `Request failed (${res.status})`) + details, data);
  }
  return data as T;
}

export function qs(params: Record<string, string | number | boolean | undefined | null>) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== '' && v !== false) p.set(k, String(v));
  const s = p.toString();
  return s ? `?${s}` : '';
}

export const fmtDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Not provided';

export const fmtNum = (n: number | null | undefined) =>
  n === null || n === undefined ? null : n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(n);

export function timeAgo(iso: string | null | undefined) {
  if (!iso) return 'Not provided';
  const s = (Date.now() - Date.parse(iso)) / 1000;
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  if (s < 86400 * 30) return `${Math.round(s / 86400)}d ago`;
  if (s < 86400 * 365) return `${Math.round(s / (86400 * 30))}mo ago`;
  return `${Math.round(s / (86400 * 365))}y ago`;
}

/** Only allow http(s) hrefs from imported data. */
export const safeHref = (u: string | null | undefined) => (u && /^https?:\/\//i.test(u) ? u : undefined);
