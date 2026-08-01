import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Spinner } from '../components/Spinner';
import { authApi } from '../services/resources';
import { useAuth } from '../context/AuthContext';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { user, refreshUser } = useAuth();
  const [status, setStatus] = useState('verifying'); // verifying | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token was provided.');
      return;
    }
    authApi
      .verifyEmail(token)
      .then(() => {
        setStatus('success');
        // If verifying in the same browser session that's logged in, refresh
        // the cached user so the reminder banner disappears immediately.
        refreshUser();
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification failed.');
      });
  }, [token, refreshUser]);

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-md mx-auto px-6 pt-24 text-center animate-fade-slide-up">
        {status === 'verifying' && (
          <>
            <Spinner size="lg" className="mx-auto" />
            <p className="mt-4 text-muted">Verifying your email…</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-14 h-14 mx-auto rounded-full bg-moss-500/10 border border-moss-500/25 flex items-center justify-center text-moss-400">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-6 h-6">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
            <h1 className="mt-4 font-display text-2xl font-semibold text-paper">Email verified</h1>
            <p className="mt-2 text-muted text-sm">Your account is now fully active.</p>
            <Link to={user ? '/dashboard' : '/login'} className="btn-primary btn-ripple mt-6 inline-flex">
              {user ? 'Go to dashboard' : 'Log in'}
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-14 h-14 mx-auto rounded-full bg-clay/10 border border-clay/25 flex items-center justify-center text-clay">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-6 h-6">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </div>
            <h1 className="mt-4 font-display text-2xl font-semibold text-paper">Verification failed</h1>
            <p className="mt-2 text-muted text-sm">{message}</p>
            <Link to="/login" className="btn-secondary btn-ripple mt-6 inline-flex">
              Back to login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
