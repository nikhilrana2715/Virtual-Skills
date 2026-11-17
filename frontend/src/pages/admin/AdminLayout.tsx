import { NavLink, Outlet } from 'react-router-dom';

const LINKS = [
  ['/admin', 'Dashboard', true],
  ['/admin/resources', 'Resources'],
  ['/admin/imports', 'Import from GitHub'],
  ['/admin/categories', 'Categories & tags'],
  ['/admin/reports', 'Reports'],
  ['/admin/sync-jobs', 'Sync jobs'],
  ['/admin/users', 'Users'],
  ['/admin/audit-logs', 'Audit log'],
] as const;

export default function AdminLayout() {
  return (
    <div className="container-page grid gap-6 py-8 lg:grid-cols-[210px_1fr]">
      <nav aria-label="Admin" className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
        <p className="mb-2 hidden px-3 text-xs font-semibold uppercase tracking-wide text-slate-500 lg:block">Admin</p>
        {LINKS.map(([to, label, end]) => (
          <NavLink
            key={to}
            to={to}
            end={!!end}
            className={({ isActive }) => `btn-ghost shrink-0 justify-start whitespace-nowrap ${isActive ? 'bg-brand-50 text-brand-700' : ''}`}
          >
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="min-w-0">
        <Outlet />
      </div>
    </div>
  );
}
