import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/90 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2">
          <span className="font-display text-xl font-semibold tracking-tight">
            GSTPrep<span className="text-clay">.</span>AI
          </span>
        </Link>

        {user ? (
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-sm text-ink/60 font-mono">
              {user.name.split(' ')[0]} · {user.role}
            </span>
            <button onClick={handleLogout} className="btn-secondary !py-2 !px-4 text-xs">
              Log out
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-ink/70 hover:text-ink">
              Log in
            </Link>
            <Link to="/register" className="btn-primary !py-2 !px-4 text-xs">
              Get started
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
