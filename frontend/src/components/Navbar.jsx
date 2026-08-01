import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import VerifyEmailBanner from './VerifyEmailBanner';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <header className="sticky top-0 z-40 bg-ink/85 backdrop-blur-md border-b border-ink-border">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2 group">
          <span className="font-display text-xl font-semibold tracking-tight text-paper">
            GSTPrep
            <span className="text-moss-400 transition-colors duration-200 group-hover:text-gold">.</span>
            AI
          </span>
        </Link>

        {user ? (
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-sm text-muted font-mono">
              {user.firstName} · {user.role}
            </span>
            <button onClick={handleLogout} className="btn-secondary !py-2 !px-4 text-xs">
              Log out
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-paper/70 hover:text-paper transition-colors duration-150">
              Log in
            </Link>
            <Link to="/register" className="btn-primary btn-ripple !py-2 !px-4 text-xs">
              Get started
            </Link>
          </div>
        )}
      </div>
      <VerifyEmailBanner />
    </header>
  );
}
