export function LoadingOverlay({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm transition-opacity">
      <div className="glass-panel flex flex-col items-center gap-4 px-10 py-8">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-400/30 border-t-cyan-400" />
        <p className="text-sm text-slate-300 animate-pulseSoft">{label}</p>
      </div>
    </div>
  );
}

export function InlineLoader({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block h-4 w-4 animate-spin rounded-full border-2 border-cyan-400/30 border-t-cyan-400 ${className}`}
    />
  );
}
