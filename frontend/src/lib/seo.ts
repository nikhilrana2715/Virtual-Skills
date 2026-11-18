import { useEffect } from 'react';

const SITE = 'Virtual Skills';
const DEFAULT_DESC = 'Virtual Skills — tech & learning hub: AI, IT and cloud resources, repositories, applications and projects, each linked to its original source.';

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
}

/** Per-page <title>, meta description and Open Graph tags. */
export function useSeo(title: string | undefined, description?: string | null) {
  useEffect(() => {
    const full = title ? `${title} · ${SITE}` : `${SITE} — AI, IT & cloud learning hub`;
    const desc = (description || DEFAULT_DESC).slice(0, 300);
    document.title = full;
    setMeta('name', 'description', desc);
    setMeta('property', 'og:title', full);
    setMeta('property', 'og:description', desc);
    setMeta('property', 'og:type', 'website');
    setMeta('property', 'og:site_name', SITE);
    setMeta('property', 'og:url', window.location.origin + window.location.pathname);
    setMeta('name', 'twitter:card', 'summary');
  }, [title, description]);
}
