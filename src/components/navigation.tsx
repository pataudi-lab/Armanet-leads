\"use client\";

import Link from "next/link";
import { signOut } from "next-auth/react";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/sources", label: "Sources" },
  { href: "/leads", label: "Leads" },
  { href: "/observations", label: "Observations" },
  { href: "/logs", label: "Logs" },
];

export function Navigation() {
  return (
    <aside className="hidden min-h-screen w-64 flex-col border-r border-slate-800 bg-slate-950/60 p-4 text-slate-100 md:flex">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="text-xs uppercase text-slate-500">Armanet</div>
          <div className="text-lg font-bold">Ad Poacher</div>
        </div>
        <span className="rounded bg-emerald-900/40 px-2 py-1 text-xs text-emerald-200">MVP</span>
      </div>
      <nav className="flex-1 space-y-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="block rounded px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="mt-auto rounded bg-slate-800 px-3 py-2 text-left text-sm font-semibold text-slate-100 transition hover:bg-slate-700"
      >
        Sign out
      </button>
    </aside>
  );
}
