import { StrictMode, lazy, Suspense, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import { AuthProvider, useAuth } from './lib/auth';
import { Layout } from './components/Layout';
import { Spinner } from './components/common';
import Home from './pages/Home';
import Explore from './pages/Explore';
import ResourceDetail from './pages/ResourceDetail';
import { Categories, Latest, Trending } from './pages/Lists';
import { Login, Register } from './pages/Auth';
import { About, Licenses, NotFound, Privacy, Terms } from './pages/Static';
import { Bookmarks, Profile } from './pages/account/Account';

const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminResources = lazy(() => import('./pages/admin/Resources'));
const ResourceForm = lazy(() => import('./pages/admin/ResourceForm'));
const Import = lazy(() => import('./pages/admin/Import'));
const misc = () => import('./pages/admin/Misc');
const AdminCategories = lazy(() => misc().then((m) => ({ default: m.AdminCategories })));
const AdminUsers = lazy(() => misc().then((m) => ({ default: m.AdminUsers })));
const AdminReports = lazy(() => misc().then((m) => ({ default: m.AdminReports })));
const AdminSyncJobs = lazy(() => misc().then((m) => ({ default: m.AdminSyncJobs })));
const AdminAudit = lazy(() => misc().then((m) => ({ default: m.AdminAudit })));

const qc = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 } },
});

/** UI guard only — the API enforces auth/roles independently. */
function Guard({ children, admin }: { children: ReactNode; admin?: boolean }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  if (admin && user.role !== 'admin') return <NotFound />;
  return <>{children}</>;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<Spinner />}>
            <Routes>
              <Route element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="explore" element={<Explore />} />
                <Route path="categories" element={<Categories />} />
                <Route path="categories/:slug" element={<Explore />} />
                <Route path="resources/:slug" element={<ResourceDetail />} />
                <Route path="trending" element={<Trending />} />
                <Route path="latest" element={<Latest />} />
                <Route path="login" element={<Login />} />
                <Route path="register" element={<Register />} />
                <Route path="about" element={<About />} />
                <Route path="terms" element={<Terms />} />
                <Route path="privacy" element={<Privacy />} />
                <Route path="licenses" element={<Licenses />} />
                <Route path="account/bookmarks" element={<Guard><Bookmarks /></Guard>} />
                <Route path="account/profile" element={<Guard><Profile /></Guard>} />
                <Route path="admin" element={<Guard admin><AdminLayout /></Guard>}>
                  <Route index element={<Dashboard />} />
                  <Route path="resources" element={<AdminResources />} />
                  <Route path="resources/new" element={<ResourceForm />} />
                  <Route path="resources/:id/edit" element={<ResourceForm />} />
                  <Route path="imports" element={<Import />} />
                  <Route path="categories" element={<AdminCategories />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="reports" element={<AdminReports />} />
                  <Route path="sync-jobs" element={<AdminSyncJobs />} />
                  <Route path="audit-logs" element={<AdminAudit />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
