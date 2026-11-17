import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { Logo } from '../components/Layout';

function Shell({ title, children, footer }: { title: string; children: React.ReactNode; footer: React.ReactNode }) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <div className="card p-6 shadow-sm">
          <h1 className="mb-5 text-xl font-bold">{title}</h1>
          {children}
        </div>
        <p className="mt-4 text-center text-sm text-slate-600">{footer}</p>
      </div>
    </div>
  );
}

export function Login() {
  const { login, user } = useAuth();
  const nav = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to={from} replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      const u = await login(email, password);
      nav(u.role === 'admin' && from === '/' ? '/admin' : from, { replace: true });
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Shell title="Sign in" footer={<>New here? <Link to="/register" className="font-medium text-brand-700 hover:underline">Create an account</Link></>}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" autoComplete="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="pw">Password</label>
          <input id="pw" type="password" autoComplete="current-password" required className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {err && <p role="alert" className="text-sm text-red-700">{err}</p>}
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </Shell>
  );
}

export function Register() {
  const { register, user } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/" replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      await register(form.name, form.email, form.password);
      nav('/', { replace: true });
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const f = (k: keyof typeof form) => ({ value: form[k], onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value }) });
  return (
    <Shell title="Create your account" footer={<>Already have an account? <Link to="/login" className="font-medium text-brand-700 hover:underline">Sign in</Link></>}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label" htmlFor="name">Name</label>
          <input id="name" required minLength={2} maxLength={60} autoComplete="name" className="input" {...f('name')} />
        </div>
        <div>
          <label className="label" htmlFor="remail">Email</label>
          <input id="remail" type="email" required autoComplete="email" className="input" {...f('email')} />
        </div>
        <div>
          <label className="label" htmlFor="rpw">Password</label>
          <input id="rpw" type="password" required minLength={8} maxLength={128} autoComplete="new-password" className="input" {...f('password')} />
          <p className="mt-1 text-xs text-slate-500">At least 8 characters.</p>
        </div>
        {err && <p role="alert" className="text-sm text-red-700">{err}</p>}
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button>
        <p className="text-xs text-slate-500">
          By signing up you agree to the <Link to="/terms" className="underline">Terms</Link> and <Link to="/privacy" className="underline">Privacy policy</Link>.
        </p>
      </form>
    </Shell>
  );
}
