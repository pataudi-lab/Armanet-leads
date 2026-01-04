import { prisma } from "@/lib/prisma";
import { StatCard, Panel } from "@/components/cards";
import Link from "next/link";

export default async function DashboardPage() {
  const [leadCount, observationCount, jobRuns, recentLeads] = await Promise.all([
    prisma.lead.count(),
    prisma.adObservation.count(),
    prisma.jobRun.findMany({ orderBy: { startedAt: "desc" }, take: 5, include: { source: true } }),
    prisma.lead.findMany({ take: 5, orderBy: { lastSeenAt: "desc" }, include: { advertiser: true } }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-100">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Leads" value={leadCount} helper="Total advertisers scored" />
        <StatCard title="Observations" value={observationCount} helper="Ads detected" />
        <StatCard title="Jobs" value={jobRuns.length} helper="Recent job runs" />
      </div>

      <Panel title="Recent Leads" actions={<Link className="text-sm text-indigo-400" href="/leads">View all</Link>}>
        <div className="space-y-2">
          {recentLeads.map((lead) => (
            <div key={lead.id} className="flex items-center justify-between rounded border border-slate-800 bg-slate-900/40 p-3">
              <div>
                <div className="text-sm font-semibold text-slate-100">{lead.advertiser?.name || lead.advertiser?.primaryDomain}</div>
                <div className="text-xs text-slate-400">Score {lead.score} • {lead.uniquePublishers7d} publishers</div>
              </div>
              <Link href={`/leads/${lead.id}`} className="text-indigo-400">Open</Link>
            </div>
          ))}
          {recentLeads.length === 0 && <div className="text-sm text-slate-400">No leads yet</div>}
        </div>
      </Panel>

      <Panel title="Recent Jobs">
        <div className="space-y-2">
          {jobRuns.map((run) => (
            <div key={run.id} className="flex items-center justify-between rounded border border-slate-800 bg-slate-900/40 p-3 text-sm">
              <div>
                <div className="font-semibold text-slate-100">{run.jobName}</div>
                <div className="text-xs text-slate-400">{run.startedAt.toISOString()}</div>
              </div>
              <div className="text-xs uppercase tracking-wide text-emerald-300">{run.status}</div>
            </div>
          ))}
          {jobRuns.length === 0 && <div className="text-sm text-slate-400">No jobs yet</div>}
        </div>
      </Panel>
    </div>
  );
}
