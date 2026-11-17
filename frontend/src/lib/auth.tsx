import { createContext, useContext, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import type { User } from './types';

interface AuthCtx {
  user: User | null;
  loading: boolean;
  bookmarkIds: Set<string>;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  toggleBookmark: (id: string) => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const me = useQuery({ queryKey: ['me'], queryFn: () => api<{ user: User | null }>('/auth/me'), staleTime: 60_000 });
  const user = me.data?.user ?? null;
  const ids = useQuery({
    queryKey: ['bookmark-ids', user?.id],
    queryFn: () => api<{ ids: string[] }>('/me/bookmarks/ids'),
    enabled: !!user,
  });

  const toggle = useMutation({
    mutationFn: async (id: string) => {
      const has = ids.data?.ids.includes(id);
      await api(`/me/bookmarks/${id}`, { method: has ? 'DELETE' : 'POST' });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookmark-ids'] });
      qc.invalidateQueries({ queryKey: ['bookmarks'] });
    },
  });

  const value: AuthCtx = {
    user,
    loading: me.isLoading,
    bookmarkIds: new Set(ids.data?.ids ?? []),
    async login(email, password) {
      const r = await api<{ user: User }>('/auth/login', { method: 'POST', body: { email, password } });
      qc.setQueryData(['me'], { user: r.user });
      return r.user;
    },
    async register(name, email, password) {
      const r = await api<{ user: User }>('/auth/register', { method: 'POST', body: { name, email, password } });
      qc.setQueryData(['me'], { user: r.user });
      return r.user;
    },
    async logout() {
      await api('/auth/logout', { method: 'POST' });
      qc.setQueryData(['me'], { user: null });
      qc.removeQueries({ queryKey: ['bookmark-ids'] });
      qc.removeQueries({ queryKey: ['bookmarks'] });
    },
    toggleBookmark: (id) => toggle.mutateAsync(id),
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAuth outside AuthProvider');
  return c;
}
