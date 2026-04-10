import type { ReactNode } from "react";

/**
 * Shared layout: ambient “skyline” mesh + subtle floor grid (listing / structure metaphor).
 */
export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-app"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-[0.4] dark:opacity-[0.35]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgb(0 0 0 / 0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgb(0 0 0 / 0.03) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-b from-transparent via-transparent to-amber-500/[0.06] dark:to-teal-950/40"
        aria-hidden
      />
      {children}
    </div>
  );
}
