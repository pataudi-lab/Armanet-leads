import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import LeadDetailClient from "./lead-detail-client";

export default async function LeadDetailPage({ params }: { params: { id: string } }) {
  const lead = await prisma.lead.findUnique({
    where: { id: params.id },
    include: { advertiser: true },
  });
  if (!lead) return notFound();
  const observations = await prisma.adObservation.findMany({
    where: { extractedDestDomain: lead.advertiser?.primaryDomain },
    orderBy: { observedAt: "desc" },
    take: 20,
  });
  return <LeadDetailClient lead={lead} observations={observations} />;
}
