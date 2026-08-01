import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/resources';
import { Spinner } from './Spinner';

export default function VerifyEmailBanner() {
  const { user } = useAuth();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [error, setError] = useState('');

  if (!user || user.isEmailVerified || user.authProvider === 'google' || dismissed) {
    return null;
  }

  async function handleResend() {
    setSending(true);
    setError('');
    try {
      await authApi.resendVerification();
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not resend the email.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="bg-gold/10 border-b border-gold/25 animate-fade-in">
      <div className="max-w-6xl mx-auto px-6 py-2.5 flex items-center justify-between gap-4 flex-wrap">
        <p className="text-sm text-gold">
          {sent
            ? "Verification email sent. Check your inbox (and spam folder)."
            : `Please verify your email address, ${user.email}, to secure your account.`}
        </p>
        <div className="flex items-center gap-3 shrink-0">
          {error && <span className="text-xs text-clay">{error}</span>}
          {!sent && (
            <button
              onClick={handleResend}
              disabled={sending}
              className="text-xs font-medium text-gold underline underline-offset-2 hover:text-gold/80 transition-colors duration-150 flex items-center gap-1.5"
            >
              {sending ? <Spinner /> : 'Resend email'}
            </button>
          )}
          <button
            onClick={() => setDismissed(true)}
            className="text-xs text-gold/60 hover:text-gold transition-colors duration-150"
            aria-label="Dismiss"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
