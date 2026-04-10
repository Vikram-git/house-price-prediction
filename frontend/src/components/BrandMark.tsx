/** Logo: roof + horizon — shelter and long-view analytics. */
export default function BrandMark({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg viewBox="0 0 40 40" className="h-10 w-10 shrink-0" aria-hidden>
        <defs>
          <linearGradient id="roofFill" x1="8" y1="6" x2="36" y2="34" gradientUnits="userSpaceOnUse">
            <stop stopColor="#f59e0b" />
            <stop offset="1" stopColor="#ea580c" />
          </linearGradient>
        </defs>
        <path d="M4 22 L20 8 L36 22 L36 34 L4 34 Z" fill="url(#roofFill)" />
        <rect x="14" y="24" width="12" height="10" rx="1" fill="#292524" className="dark:fill-slate-950" />
        <line x1="0" y1="36" x2="40" y2="36" stroke="currentColor" strokeWidth="1.5" className="text-stone-400 dark:text-slate-500" />
      </svg>
      <div className="min-w-0 leading-tight">
        <p className="font-display text-lg font-semibold tracking-tight text-ink">Horizon</p>
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-teal-700 dark:text-teal-400">
          Price intelligence
        </p>
      </div>
    </div>
  );
}
