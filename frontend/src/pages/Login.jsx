import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Spinner } from '../components/Spinner';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-md mx-auto px-6 pt-16 animate-fade-slide-up">
        <h1 className="font-display text-3xl font-semibold text-paper">Welcome back</h1>
        <p className="mt-2 text-muted text-sm">Log in to continue to your dashboard.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              required
              className="input-field"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.edu.ng"
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              type="password"
              required
              className="input-field"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-sm text-clay bg-clay/10 border border-clay/20 rounded-lg px-3 py-2 animate-fade-in">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? (
              <>
                <Spinner /> Logging in…
              </>
            ) : (
              'Log in'
            )}
          </button>
        </form>

        <p className="mt-6 text-sm text-muted">
          Don't have an account?{' '}
          <Link to="/register" className="link-underline font-medium">
            Create one
          </Link>
        </p>

        <div className="mt-10 card !bg-moss-500/5 !border-moss-500/20">
          <p className="text-xs font-mono uppercase tracking-wider text-moss-400 mb-2">Demo accounts</p>
          <p className="text-sm text-paper/70">Lecturer: lecturer@gstprep.demo / password123</p>
          <p className="text-sm text-paper/70">Student: student@gstprep.demo / password123</p>
        </div>
      </div>
    </div>
  );
}
