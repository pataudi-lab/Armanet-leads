import { prisma } from "@/lib/prisma";

export default async function LogsPage() {
  const [logs, jobs] = await Promise.all([
    prisma.crawlLog.findMany({ orderBy: { createdAt: "desc" }, take: 50, include: { source: true } }),
    prisma.jobRun.findMany({ orderBy: { startedAt: "desc" }, take: 20, include: { source: true } }),
  ]);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Logs</h1>
        <p className="text-sm text-slate-400">Crawl activity and job runs.</p>
      </div>
      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-slate-100">Crawl Logs</h2>
        {logs.map((log) => (
          <div key={log.id} className="rounded border border-slate-800 bg-slate-950/60 p-3 text-sm text-slate-100">
            <div className="flex items-center justify-between">
              <div className="font-semibold">{log.source?.name}</div>
              <span className="text-xs uppercase text-emerald-300">{log.status}</span>
            </div>
            <div className="text-xs text-slate-400">{log.url}</div>
            {log.errorText && <div className="text-xs text-red-300">{log.errorText}</div>}
            <div className="text-xs text-slate-500">{log.createdAt.toISOString()} • {log.durationMs}ms</div>
          </div>
        ))}
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-slate-100">Job Runs</h2>
        {jobs.map((run) => (
          <div key={run.id} className="rounded border border-slate-800 bg-slate-950/60 p-3 text-sm text-slate-100">
            <div className="flex items-center justify-between">
              <div className="font-semibold">{run.jobName}</div>
              <span className="text-xs uppercase text-emerald-300">{run.status}</span>
            </div>
            <div className="text-xs text-slate-400">{run.startedAt.toISOString()}</div>
            <pre className="text-xs text-slate-300">{JSON.stringify(run.stats, null, 2)}</pre>
          </div>
        ))}
      </section>
    </div>
  );
}
