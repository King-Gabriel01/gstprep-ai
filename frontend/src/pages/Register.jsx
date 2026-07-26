import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { Button, Card, Input } from "../components/ui.jsx";

export default function Register() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "student" });
  const [error, setError] = useState("");

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const user = await register(form.name, form.email, form.password, form.role);
      navigate(user.role === "lecturer" ? "/lecturer" : "/student");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-6 py-20">
      <h1 className="font-display text-2xl font-bold text-ink">Create an account</h1>
      <p className="mt-1.5 text-sm text-slatex">Choose the role that matches what you'll do here.</p>

      <Card className="mt-8 p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            {["student", "lecturer"].map((r) => (
              <button
                type="button"
                key={r}
                onClick={() => update("role", r)}
                className={`rounded-sm border px-4 py-3 text-sm font-semibold capitalize transition-colors focus-ring ${
                  form.role === r
                    ? "border-moss bg-moss/10 text-moss"
                    : "border-ink/15 text-slatex hover:border-ink/30"
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <Input
            label="Full name"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="Ada Obi"
            required
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="you@university.edu.ng"
            required
          />
          <Input
            label="Password"
            type="password"
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
            placeholder="At least 6 characters"
            minLength={6}
            required
          />
          {error && <p className="text-sm text-errorred">{error}</p>}
          <Button type="submit" disabled={loading} className="mt-2">
            {loading ? "Creating account…" : "Create account"}
          </Button>
        </form>
      </Card>

      <p className="mt-6 text-center text-sm text-slatex">
        Already registered?{" "}
        <Link to="/login" className="font-semibold text-moss hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
