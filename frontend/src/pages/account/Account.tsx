import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import type { Resource } from '../../lib/types';
import { ResourceGrid } from '../../components/ResourceCard';
import { EmptyState, ErrorState, PageHeader, SkeletonGrid } from '../../components/common';

export function Bookmarks() {
  const q = useQuery({ queryKey: ['bookmarks'], queryFn: () => api<{ items: Resource[] }>('/me/bookmarks') });
  return (
    <div className="container-page py-8">
      <PageHeader title="Saved resources" subtitle="Only you can see this list." />
      {q.isLoading ? (
        <SkeletonGrid />
      ) : q.error ? (
        <ErrorState error={q.error} retry={q.refetch} />
      ) : q.data!.items.length === 0 ? (
        <EmptyState title="No saved resources yet" icon="🔖">
          Tap the bookmark icon on any resource to save it here. <Link to="/explore" className="text-brand-700 underline">Explore</Link>
        </EmptyState>
      ) : (
        <ResourceGrid items={q.data!.items} />
      )}
    </div>
  );
}

export function Profile() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [confirm, setConfirm] = useState('');
  const [err, setErr] = useState('');
  if (!user) return null;
  return (
    <div className="container-page max-w-2xl py-8">
      <PageHeader title="Profile & settings" />
      <div className="card mb-6 p-6">
        <dl className="space-y-2 text-sm">
          <div className="flex gap-2"><dt className="w-20 text-slate-500">Name</dt><dd className="font-medium">{user.name}</dd></div>
          <div className="flex gap-2"><dt className="w-20 text-slate-500">Email</dt><dd className="font-medium">{user.email}</dd></div>
          <div className="flex gap-2"><dt className="w-20 text-slate-500">Role</dt><dd className="font-medium">{user.role}</dd></div>
        </dl>
      </div>
      <div className="card mb-6 p-6">
        <h2 className="font-semibold">Export your data</h2>
        <p className="mt-1 text-sm text-slate-600">Download your profile and saved resources as JSON.</p>
        <a className="btn-secondary mt-3" href="/api/v1/me/export" download>
          Download export
        </a>
      </div>
      <div className="card border-red-200 p-6">
        <h2 className="font-semibold text-red-800">Delete account</h2>
        <p className="mt-1 text-sm text-slate-600">Permanently deletes your account and saved resources. This cannot be undone.</p>
        <label className="label mt-3" htmlFor="del-confirm">Type DELETE to confirm</label>
        <input id="del-confirm" className="input max-w-xs" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        {err && <p className="mt-2 text-sm text-red-700">{err}</p>}
        <button
          className="btn-danger mt-3"
          disabled={confirm !== 'DELETE' || user.role === 'admin'}
          title={user.role === 'admin' ? 'Admins cannot self-delete' : undefined}
          onClick={async () => {
            try {
              await api('/auth/me', { method: 'DELETE' });
              await logout().catch(() => {});
              nav('/');
            } catch (e) {
              setErr((e as Error).message);
            }
          }}
        >
          Delete my account
        </button>
      </div>
    </div>
  );
}
