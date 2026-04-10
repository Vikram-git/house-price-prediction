import { Fragment, useMemo } from "react";

type Matrix = Record<string, Record<string, number>>;

function colorFor(v: number): string {
  const t = (v + 1) / 2;
  const r = Math.round(30 + (1 - t) * 120);
  const g = Math.round(40 + t * 140);
  const b = Math.round(80 + (1 - Math.abs(t - 0.5) * 2) * 100);
  return `rgb(${r},${g},${b})`;
}

export default function CorrelationHeatmap({ matrix }: { matrix: Matrix }) {
  const labels = useMemo(() => Object.keys(matrix).sort(), [matrix]);
  if (!labels.length) return null;

  return (
    <div className="overflow-x-auto pb-2">
      <div
        className="inline-grid gap-1 text-[10px]"
        style={{
          gridTemplateColumns: `minmax(100px,140px) repeat(${labels.length}, minmax(40px, 52px))`,
        }}
      >
        <div />
        {labels.map((c) => (
          <div key={c} className="truncate px-0.5 text-center text-ink-soft" title={c}>
            {c.replace(/_/g, " ")}
          </div>
        ))}
        {labels.map((r) => (
          <Fragment key={r}>
            <div className="truncate py-1 pr-2 text-right text-ink-soft" title={r}>
              {r.replace(/_/g, " ")}
            </div>
            {labels.map((c) => {
              const v = matrix[r]?.[c] ?? 0;
              const clamped = Math.max(-1, Math.min(1, v));
              return (
                <div
                  key={`${r}-${c}`}
                  className="flex h-9 items-center justify-center rounded-md font-mono text-[10px] text-white/90"
                  style={{ backgroundColor: colorFor(clamped) }}
                  title={`${r} vs ${c}: ${v.toFixed(3)}`}
                >
                  {v.toFixed(2)}
                </div>
              );
            })}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
