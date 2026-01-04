"use client";

import { useEffect, useState } from "react";
import type { Source } from "@prisma/client";
import Link from "next/link";

export function SourcesClient({ initialSources }: { initialSources: Source[] }) {
  const [sources, setSources] = useState<Source[]>(initialSources);
  const [form, setForm] = useState({ name: "", baseUrl: "", seeds: "" });
  const [importText, setImportText] = useState("");

  useEffect(() => setSources(initialSources), [initialSources]);

  const createSource = async () => {
    const payload = {
      name: form.name,
      baseUrl: form.baseUrl,
      seeds: form.seeds ? form.seeds.split(/\s+/).filter(Boolean) : [],
    };
    const res = await fetch("/api/sources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const source = await res.json();
      setSources([source, ...sources]);
      setForm({ name: "", baseUrl: "", seeds: "" });
    }
  };

  const runNow = async (sourceId: string) => {
    await fetch("/api/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceId }),
    });
  };

  const importSources = async () => {
    try {
      const parsed = JSON.parse(importText);
      const res = await fetch("/api/sources/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });
      if (res.ok) {
        const { results } = await res.json();
        setImportText("");
        const refreshed = await fetch("/api/sources").then((r) => r.json());
        setSources(refreshed);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const exportSources = async () => {
    const res = await fetch("/api/sources/export");
    const data = await res.json();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sources.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Sources</h1>
          <p className="text-sm text-slate-400">Configure publisher sources, import/export, and run now.</p>
        </div>
        <button
          onClick={exportSources}
          className="rounded bg-slate-800 px-3 py-2 text-sm font-semibold text-slate-100"
        >
          Export JSON
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3 rounded border border-slate-800 bg-slate-900/60 p-4">
          <h2 className="text-lg font-semibold text-slate-100">Add Source</h2>
          <input
            className="w-full rounded border border-slate-800 bg-slate-950 p-2 text-slate-100"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            className="w-full rounded border border-slate-800 bg-slate-950 p-2 text-slate-100"
            placeholder="Base URL"
            value={form.baseUrl}
            onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
          />
          <textarea
            className="w-full rounded border border-slate-800 bg-slate-950 p-2 text-slate-100"
            placeholder="Seed URLs (space or newline separated)"
            value={form.seeds}
            onChange={(e) => setForm({ ...form, seeds: e.target.value })}
          />
          <button
            onClick={createSource}
            className="w-full rounded bg-indigo-600 px-4 py-2 font-semibold text-white"
          >
            Save Source
          </button>
        </div>

        <div className="space-y-3 rounded border border-slate-800 bg-slate-900/60 p-4">
          <h2 className="text-lg font-semibold text-slate-100">Import JSON</h2>
          <textarea
            className="h-32 w-full rounded border border-slate-800 bg-slate-950 p-2 text-slate-100"
            placeholder='[{"name":"","baseUrl":""}]'
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
          />
          <button
            onClick={importSources}
            className="w-full rounded bg-slate-800 px-4 py-2 font-semibold text-slate-100"
          >
            Import
          </button>
        </div>
      </div>

      <div className="rounded border border-slate-800 bg-slate-950/50">
        <table className="min-w-full divide-y divide-slate-800">
          <thead className="bg-slate-900/60">
            <tr>
              <th className="px-3 py-2 text-left text-xs uppercase text-slate-400">Name</th>
              <th className="px-3 py-2 text-left text-xs uppercase text-slate-400">Base URL</th>
              <th className="px-3 py-2 text-left text-xs uppercase text-slate-400">Mode</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-900">
            {sources.map((source) => (
              <tr key={source.id} className="text-sm text-slate-100">
                <td className="px-3 py-2">{source.name}</td>
                <td className="px-3 py-2"><Link className="text-indigo-300" href={source.baseUrl}>{source.baseUrl}</Link></td>
                <td className="px-3 py-2">{source.crawlMode}</td>
                <td className="px-3 py-2 text-right">
                  <button
                    onClick={() => runNow(source.id)}
                    className="rounded bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-100"
                  >
                    Run now
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
