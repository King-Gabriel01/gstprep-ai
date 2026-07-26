import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    matricNumber: '',
    department: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-md mx-auto px-6 pt-16 pb-16">
        <h1 className="font-display text-3xl font-semibold">Create your account</h1>
        <p className="mt-2 text-ink/60 text-sm">Set up your GSTPrep AI profile.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="label">I am a</label>
            <div className="grid grid-cols-2 gap-3">
              {['student', 'lecturer'].map((role) => (
                <button
                  type="button"
                  key={role}
                  onClick={() => update('role', role)}
                  className={`rounded-lg border px-4 py-2.5 text-sm font-medium capitalize transition-colors ${
                    form.role === role
                      ? 'border-moss-600 bg-moss-50 text-moss-700'
                      : 'border-ink/15 text-ink/60 hover:border-ink/30'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Full name</label>
            <input
              required
              className="input-field"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="Your full name"
            />
          </div>

          <div>
            <label className="label">Email</label>
            <input
              type="email"
              required
              className="input-field"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              placeholder="you@example.edu.ng"
            />
          </div>

          <div>
            <label className="label">Password</label>
            <input
              type="password"
              required
              minLength={6}
              className="input-field"
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              placeholder="At least 6 characters"
            />
          </div>

          {form.role === 'student' && (
            <div>
              <label className="label">Matric number (optional)</label>
              <input
                className="input-field"
                value={form.matricNumber}
                onChange={(e) => update('matricNumber', e.target.value)}
                placeholder="e.g. CSC/2021/045"
              />
            </div>
          )}

          <div>
            <label className="label">Department (optional)</label>
            <input
              className="input-field"
              value={form.department}
              onChange={(e) => update('department', e.target.value)}
              placeholder="e.g. Computer Science"
            />
          </div>

          {error && <p className="text-sm text-clay">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-sm text-ink/60">
          Already have an account?{' '}
          <Link to="/login" className="text-moss-700 font-medium">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
