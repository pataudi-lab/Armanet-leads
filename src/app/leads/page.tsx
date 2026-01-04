import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function LeadsPage() {
  const leads = await prisma.lead.findMany({ include: { advertiser: true }, orderBy: { score: "desc" } });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Leads</h1>
          <p className="text-sm text-slate-400">Scored advertisers with evidence.</p>
        </div>
        <Link
          href="/api/leads/export"
          className="rounded bg-slate-800 px-3 py-2 text-sm font-semibold text-slate-100"
        >
          Export CSV
        </Link>
      </div>
      <div className="overflow-hidden rounded border border-slate-800">
        <table className="min-w-full divide-y divide-slate-800">
          <thead className="bg-slate-900/50">
            <tr>
              <th className="px-3 py-2 text-left text-xs uppercase text-slate-400">Advertiser</th>
              <th className="px-3 py-2 text-left text-xs uppercase text-slate-400">Score</th>
              <th className="px-3 py-2 text-left text-xs uppercase text-slate-400">Last Seen</th>
              <th className="px-3 py-2 text-left text-xs uppercase text-slate-400">Publishers</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-900">
            {leads.map((lead) => (
              <tr key={lead.id} className="text-sm text-slate-100">
                <td className="px-3 py-2">{lead.advertiser?.name || lead.advertiser?.primaryDomain}</td>
                <td className="px-3 py-2 font-semibold">{lead.score}</td>
                <td className="px-3 py-2">{lead.lastSeenAt.toISOString()}</td>
                <td className="px-3 py-2">{lead.uniquePublishers7d}</td>
                <td className="px-3 py-2 text-right">
                  <Link className="text-indigo-300" href={`/leads/${lead.id}`}>Open</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
