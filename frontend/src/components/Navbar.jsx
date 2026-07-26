import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { Button } from "./ui.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="border-b border-ink/10 bg-parchment/95 backdrop-blur sticky top-0 z-10">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-baseline gap-2">
          <span className="font-display text-xl font-bold text-ink">GSTPrep</span>
          <span className="font-mono text-xs font-semibold text-amberflag">AI</span>
        </Link>

        {user ? (
          <nav className="flex items-center gap-6">
            <Link
              to={user.role === "lecturer" ? "/lecturer" : "/student"}
              className="text-sm font-medium text-slatex hover:text-ink"
            >
              Dashboard
            </Link>
            <span className="text-sm text-slatex">
              {user.name} <span className="text-ink/40">·</span>{" "}
              <span className="font-mono text-xs uppercase text-amberflag">{user.role}</span>
            </span>
            <Button variant="ghost" onClick={handleLogout} className="!py-1.5 !px-3 text-xs">
              Sign out
            </Button>
          </nav>
        ) : (
          <nav className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-slatex hover:text-ink">
              Log in
            </Link>
            <Link to="/register">
              <Button className="!py-2 !px-4 text-xs">Get started</Button>
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
