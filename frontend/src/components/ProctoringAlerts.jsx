/**
 * Renders the transient soft-violation warning toast and the hard 15%
 * critical alert modal. The modal is dismissible (per the chosen UX), not
 * a blocking gate, so the student can choose to continue or submit.
 */
export function WarningToast({ warning }) {
  if (!warning) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-fade-slide-up">
      <div className="bg-gold/15 border border-gold/30 text-gold text-sm px-4 py-2.5 rounded-full shadow-lg backdrop-blur-md">
        {warning.message}
      </div>
    </div>
  );
}

export function CriticalIntegrityAlert({ show, integrityScore, onDismiss, onSubmitNow }) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="card max-w-sm mx-4 text-center !border-clay/40 !bg-ink-raised">
        <div className="w-14 h-14 mx-auto rounded-full bg-clay/10 border border-clay/30 flex items-center justify-center text-clay">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-7 h-7">
            <path d="M12 9v4M12 17h.01" />
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L14.71 3.86a2 2 0 0 0-3.42 0Z" />
          </svg>
        </div>
        <h3 className="mt-4 font-display text-xl font-semibold text-clay">Advised to quit now</h3>
        <p className="mt-2 text-sm text-paper/70">
          Your integrity score has dropped to <span className="font-mono font-semibold">{integrityScore}%</span>.
          Continued violations will be visible to your lecturer alongside your result.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <button onClick={onSubmitNow} className="btn-primary btn-ripple w-full">
            Submit now
          </button>
          <button onClick={onDismiss} className="btn-secondary btn-ripple w-full">
            Continue anyway
          </button>
        </div>
      </div>
    </div>
  );
}
