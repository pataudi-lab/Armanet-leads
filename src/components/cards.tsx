import { ReactNode } from "react";

export function StatCard({ title, value, helper }: { title: string; value: ReactNode; helper?: string }) {
  return (
    <div className="rounded border border-slate-800 bg-slate-900/80 p-4 shadow">
      <div className="text-sm uppercase text-slate-500">{title}</div>
      <div className="text-2xl font-bold text-slate-100">{value}</div>
      {helper && <div className="text-xs text-slate-400">{helper}</div>}
    </div>
  );
}

export function Panel({ title, children, actions }: { title: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className="rounded border border-slate-800 bg-slate-950/70 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
        {actions}
      </div>
      {children}
    </section>
  );
}
