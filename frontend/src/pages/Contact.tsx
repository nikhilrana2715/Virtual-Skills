import { useState, type FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Mail } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useSeo } from '../lib/seo';
import { site, SOCIAL_LABELS, type SocialKey } from '../data/site';
import { ExternalLink, PageHeader } from '../components/common';

/** /contact — form stores the message for admins (Admin → Messages). */
export default function Contact() {
  useSeo('Contact Us', 'Send a message to the Virtual Skills team — questions, suggestions, resource requests or collaboration.');
  const { user } = useAuth();
  const [form, setForm] = useState({ name: user?.name ?? '', email: user?.email ?? '', subject: '', message: '', website: '' });
  const send = useMutation({ mutationFn: () => api('/contact', { method: 'POST', body: form }) });
  const socials = (Object.keys(site.links) as SocialKey[]).filter((k) => site.links[k]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    send.mutate();
  };
  const field = (k: keyof typeof form) => ({
    id: `c-${k}`,
    value: form[k],
    onChange: (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value })),
  });

  return (
    <div className="container-page py-8">
      <PageHeader title="Contact Us" subtitle="Questions, suggestions, a resource we should list, or a collaboration idea — send us a message." />
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="card p-6 sm:p-8">
          {send.isSuccess ? (
            <div role="status" className="py-10 text-center">
              <p className="text-lg font-semibold text-ink">Thanks — your message was sent.</p>
              <p className="mt-2 text-sm text-slate-600">We read every message and will reply to {form.email}.</p>
              <button
                className="btn-secondary mt-6"
                onClick={() => {
                  setForm((f) => ({ ...f, subject: '', message: '' }));
                  send.reset();
                }}
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate={false}>
              <div>
                <label className="label" htmlFor="c-name">
                  Name
                </label>
                <input className="input" required minLength={2} maxLength={80} autoComplete="name" {...field('name')} />
              </div>
              <div>
                <label className="label" htmlFor="c-email">
                  Email
                </label>
                <input className="input" type="email" required maxLength={254} autoComplete="email" {...field('email')} />
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="c-subject">
                  Subject
                </label>
                <input className="input" required minLength={3} maxLength={120} {...field('subject')} />
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="c-message">
                  Message
                </label>
                <textarea className="input min-h-40" required minLength={10} maxLength={4000} {...field('message')} />
              </div>
              {/* Honeypot for bots — hidden from people and assistive tech */}
              <div className="hidden" aria-hidden>
                <label htmlFor="c-website">Website</label>
                <input tabIndex={-1} autoComplete="off" {...field('website')} />
              </div>
              {send.error && (
                <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800 sm:col-span-2">
                  {send.error instanceof Error ? send.error.message : 'Could not send message'}
                </p>
              )}
              <div className="sm:col-span-2">
                <button className="btn-primary rounded-full px-6" disabled={send.isPending}>
                  {send.isPending ? 'Sending…' : 'Send message'}
                </button>
              </div>
            </form>
          )}
        </div>

        <aside className="space-y-4">
          {site.email && (
            <div className="card p-5">
              <p className="mb-1 flex items-center gap-2 font-semibold">
                <Mail className="h-4 w-4 text-brand-600" aria-hidden /> Email
              </p>
              <a href={`mailto:${site.email}`} className="text-sm text-brand-700 hover:underline">
                {site.email}
              </a>
            </div>
          )}
          {socials.length > 0 && (
            <div className="card p-5">
              <p className="mb-2 font-semibold">Find us online</p>
              <ul className="space-y-2 text-sm">
                {socials.map((k) => (
                  <li key={k}>
                    <ExternalLink href={site.links[k]} className="text-brand-700 hover:underline">
                      {SOCIAL_LABELS[k]}
                    </ExternalLink>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="px-1 text-xs text-slate-500">Your message is stored securely and only visible to site administrators. We never share your email.</p>
        </aside>
      </div>
    </div>
  );
}
