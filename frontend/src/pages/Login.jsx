import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { Button, Card, Input } from "../components/ui.jsx";

export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const user = await login(email, password);
      navigate(user.role === "lecturer" ? "/lecturer" : "/student");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-6 py-20">
      <h1 className="font-display text-2xl font-bold text-ink">Log in</h1>
      <p className="mt-1.5 text-sm text-slatex">Welcome back to GSTPrep AI.</p>

      <Card className="mt-8 p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@university.edu.ng"
            required
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
          {error && <p className="text-sm text-errorred">{error}</p>}
          <Button type="submit" disabled={loading} className="mt-2">
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </Card>

      <p className="mt-6 text-center text-sm text-slatex">
        No account yet?{" "}
        <Link to="/register" className="font-semibold text-moss hover:underline">
          Register
        </Link>
      </p>
    </div>
  );
}
