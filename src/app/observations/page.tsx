import { prisma } from "@/lib/prisma";

export default async function ObservationsPage() {
  const observations = await prisma.adObservation.findMany({ orderBy: { observedAt: "desc" }, take: 50 });
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold text-slate-100">Observations</h1>
      <div className="space-y-2">
        {observations.map((obs) => (
          <div key={obs.id} className="rounded border border-slate-800 bg-slate-950/50 p-3 text-sm text-slate-100">
            <div className="flex items-center justify-between">
              <div className="font-semibold">{obs.pageUrl}</div>
              <span className="text-xs uppercase text-emerald-300">{obs.adType}</span>
            </div>
            <div className="text-xs text-slate-400">{obs.extractedDestDomain || "Unknown domain"} • Conf {obs.confidence.toFixed(2)}</div>
            <div className="text-xs text-slate-300">{obs.rawHtmlSnippet.slice(0, 200)}</div>
            {obs.screenshotPath && <div className="text-xs text-slate-400">Screenshot: {obs.screenshotPath}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
