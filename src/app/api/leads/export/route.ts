import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function toCsv(rows: Record<string, any>[]) {
  const headers = Object.keys(rows[0] || {});
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => JSON.stringify(row[h] ?? "")).join(","));
  }
  return lines.join("\n");
}

export async function GET() {
  const leads = await prisma.lead.findMany({
    include: { advertiser: true },
  });
  const rows = leads.map((lead) => ({
    advertiser: lead.advertiser?.name || lead.advertiser?.primaryDomain,
    domain: lead.advertiser?.primaryDomain,
    score: lead.score,
    status: lead.status,
    firstSeenAt: lead.firstSeenAt.toISOString(),
    lastSeenAt: lead.lastSeenAt.toISOString(),
    sightings7d: lead.sightings7d,
    uniquePublishers7d: lead.uniquePublishers7d,
    avgConfidenceTop5: lead.avgConfidenceTop5,
    topEvidenceUrls: (lead.topEvidence as any[])?.map((t) => t.pageUrl).join(" | "),
  }));
  const csv = toCsv(rows);
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=leads.csv",
    },
  });
}
