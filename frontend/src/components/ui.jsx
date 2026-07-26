import React from "react";

export function Button({ children, variant = "primary", className = "", ...props }) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-sm px-4 py-2.5 text-sm font-semibold tracking-wide transition-colors focus-ring disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-ink text-parchment hover:bg-slatex",
    accent: "bg-moss text-parchment hover:bg-moss/90",
    ghost: "bg-transparent text-ink border border-ink/20 hover:border-ink/60",
    danger: "bg-errorred text-parchment hover:bg-errorred/90",
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Card({ children, className = "" }) {
  return (
    <div className={`bg-white border border-ink/10 rounded-sm shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function Input({ label, error, className = "", ...props }) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slatex">
          {label}
        </span>
      )}
      <input
        className={`w-full rounded-sm border border-ink/20 bg-white px-3 py-2.5 text-sm text-ink placeholder:text-slatex/50 focus-ring focus:border-moss ${className}`}
        {...props}
      />
      {error && <span className="mt-1 block text-xs text-errorred">{error}</span>}
    </label>
  );
}

export function Badge({ children, tone = "neutral" }) {
  const tones = {
    neutral: "bg-slatex/10 text-slatex",
    pending: "bg-amberflag/15 text-amberflag",
    approved: "bg-moss/15 text-moss",
    rejected: "bg-errorred/15 text-errorred",
  };
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-sm border border-dashed border-ink/20 px-6 py-14 text-center">
      <h3 className="font-display text-lg text-ink">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-slatex">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Spinner({ className = "" }) {
  return (
    <span
      className={`inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
      aria-label="Loading"
    />
  );
}
