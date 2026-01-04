"use client";

import type { Lead, AdObservation, LeadStatus } from "@prisma/client";
import { useState } from "react";

export default function LeadDetailClient({ lead, observations }: { lead: Lead & { advertiser: any }; observations: AdObservation[] }) {
  const [status, setStatus] = useState<LeadStatus>(lead.status as LeadStatus);
  const [notes, setNotes] = useState(lead.notes || "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await fetch(`/api/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, notes }),
    });
    setSaving(false);
  };

  const evidence = (lead.topEvidence as any[]) || [];

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">{lead.advertiser?.name || lead.advertiser?.primaryDomain}</h1>
          <p className="text-sm text-slate-400">Score {lead.score} • {lead.uniquePublishers7d} publishers</p>
        </div>
        <div className="space-y-2 text-sm text-slate-100">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as LeadStatus)}
            className="w-full rounded border border-slate-800 bg-slate-950 px-3 py-2"
          >
            <option value="NEW">New</option>
            <option value="QUALIFIED">Qualified</option>
            <option value="CONTACTED">Contacted</option>
            <option value="IGNORE">Ignore</option>
          </select>
          <button
            onClick={save}
            disabled={saving}
            className="w-full rounded bg-indigo-600 px-3 py-2 font-semibold text-white"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 rounded border border-slate-800 bg-slate-900/50 p-4">
          <h2 className="text-lg font-semibold text-slate-100">Score breakdown</h2>
          <pre className="overflow-auto rounded bg-slate-950 p-3 text-xs text-slate-200">{JSON.stringify(lead.scoreBreakdown, null, 2)}</pre>
          <div>
            <label className="text-sm text-slate-300">Notes</label>
            <textarea
              className="mt-1 w-full rounded border border-slate-800 bg-slate-950 p-2 text-slate-100"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
            />
          </div>
        </div>
        <div className="space-y-2 rounded border border-slate-800 bg-slate-900/50 p-4">
          <h2 className="text-lg font-semibold text-slate-100">Top Evidence</h2>
          {evidence.map((item, idx) => (
            <div key={idx} className="rounded border border-slate-800 bg-slate-950/70 p-3 text-sm text-slate-100">
              <div className="font-semibold">{item.pageUrl}</div>
              <div className="text-xs text-slate-400">{item.sourceName} • {item.observedAt}</div>
              {item.screenshotPath && <div className="text-xs text-slate-400">Screenshot: {item.screenshotPath}</div>}
            </div>
          ))}
          {evidence.length === 0 && <div className="text-sm text-slate-400">No evidence yet</div>}
        </div>
      </div>

      <div className="space-y-2 rounded border border-slate-800 bg-slate-900/50 p-4">
        <h2 className="text-lg font-semibold text-slate-100">Recent Observations</h2>
        <div className="space-y-2">
          {observations.map((obs) => (
            <div key={obs.id} className="rounded border border-slate-800 bg-slate-950/80 p-3 text-sm text-slate-100">
              <div className="flex items-center justify-between">
                <div className="font-semibold">{obs.pageUrl}</div>
                <span className="text-xs uppercase text-emerald-300">{obs.adType}</span>
              </div>
              <div className="text-xs text-slate-400">Conf {obs.confidence.toFixed(2)} • {obs.observedAt.toString()}</div>
              <div className="text-xs text-slate-300">Snippet: {obs.rawHtmlSnippet.slice(0, 180)}</div>
              {obs.screenshotPath && <div className="text-xs text-slate-400">Screenshot: {obs.screenshotPath}</div>}
            </div>
          ))}
          {observations.length === 0 && <div className="text-sm text-slate-400">No observations yet</div>}
        </div>
      </div>
    </div>
  );
}
