import html2canvas from "html2canvas";
import { useRef, type ReactNode } from "react";

export default function ChartCard({
  title,
  subtitle,
  chartId,
  children,
}: {
  title: string;
  subtitle?: string;
  chartId: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  async function exportPng() {
    if (!ref.current) return;
    const canvas = await html2canvas(ref.current, {
      backgroundColor:
        document.documentElement.getAttribute("data-theme") === "openhouse"
          ? "#fafaf9"
          : "#0c1222",
      scale: 2,
    });
    const a = document.createElement("a");
    a.download = `${chartId}.png`;
    a.href = canvas.toDataURL("image/png");
    a.click();
  }

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-stone-200/80 bg-white/70 p-5 shadow-sm backdrop-blur-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-white/[0.04] dark:hover:shadow-lg dark:hover:shadow-black/30">
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-teal-400/10 to-amber-400/10 blur-2xl dark:from-teal-500/15 dark:to-amber-500/10" />
      <div className="relative mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-base font-semibold text-ink">{title}</h3>
          {subtitle && (
            <p className="mt-1 text-xs text-ink-soft">{subtitle}</p>
          )}
        </div>
        <button
          type="button"
          onClick={exportPng}
          className="shrink-0 rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-[11px] font-medium text-ink transition hover:bg-stone-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
        >
          Export PNG
        </button>
      </div>
      <div ref={ref} className="relative min-h-[220px] w-full text-ink" id={chartId}>
        {children}
      </div>
    </div>
  );
}
