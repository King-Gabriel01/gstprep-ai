export function Spinner({ size = 'default', className = '' }) {
  const sizeClass = size === 'lg' ? 'spinner spinner-lg' : 'spinner';
  return <span className={`${sizeClass} ${className}`} role="status" aria-label="Loading" />;
}

export function DotPulse({ className = '' }) {
  return (
    <span className={`dot-pulse ${className}`} role="status" aria-label="Loading">
      <span />
      <span />
      <span />
    </span>
  );
}

export function LoadingScreen({ label = 'Loading' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 animate-fade-in">
      <Spinner size="lg" />
      <p className="text-sm text-muted font-mono tracking-wide">{label}</p>
    </div>
  );
}
