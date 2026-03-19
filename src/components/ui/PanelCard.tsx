import { ReactNode } from "react";

export function PanelCard({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-slate-950/20">
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.26em] text-cyan-200/80">
          {eyebrow}
        </p>
      ) : null}
      <h3 className="mt-1 text-xl font-semibold text-white">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}
