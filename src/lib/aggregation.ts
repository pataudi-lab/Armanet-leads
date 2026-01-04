import { prisma } from "./prisma";
import { AdObservation } from "@prisma/client";

export async function upsertAdvertisersAndLeads(observations: AdObservation[]) {
  const domainToAdvertiser: Record<string, string> = {};

  for (const obs of observations) {
    if (!obs.extractedDestDomain) continue;
    const advertiser = await prisma.advertiser.upsert({
      where: { primaryDomain: obs.extractedDestDomain },
      update: { name: obs.extractedBrandText || obs.extractedDestDomain },
      create: { primaryDomain: obs.extractedDestDomain, name: obs.extractedBrandText || obs.extractedDestDomain },
    });
    domainToAdvertiser[obs.extractedDestDomain] = advertiser.id;
  }

  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recent = await prisma.adObservation.findMany({
    where: { observedAt: { gte: cutoff }, extractedDestDomain: { not: null } },
    include: { source: true },
  });

  const grouped = recent.reduce<Record<string, AdObservation[]>>((acc, obs) => {
    if (!obs.extractedDestDomain) return acc;
    acc[obs.extractedDestDomain] = acc[obs.extractedDestDomain] || [];
    acc[obs.extractedDestDomain].push(obs);
    return acc;
  }, {});

  for (const [domain, obsList] of Object.entries(grouped)) {
    const advertiserId = domainToAdvertiser[domain] ||
      (await prisma.advertiser.upsert({
        where: { primaryDomain: domain },
        update: {},
        create: { primaryDomain: domain },
      })).id;

    const sightings7d = obsList.length;
    const uniquePublishers7d = new Set(obsList.map((o) => o.sourceId)).size;
    const sortedByConfidence = [...obsList].sort((a, b) => b.confidence - a.confidence);
    const top5 = sortedByConfidence.slice(0, 5);
    const avgConfidenceTop5 = top5.reduce((sum, o) => sum + o.confidence, 0) / Math.max(top5.length, 1);
    const firstSeenAt = obsList.reduce((min, o) => (o.observedAt < min ? o.observedAt : min), obsList[0].observedAt);
    const lastSeenAt = obsList.reduce((max, o) => (o.observedAt > max ? o.observedAt : max), obsList[0].observedAt);
    const score = Math.min(100, Math.round(20 + 8 * uniquePublishers7d + 2 * sightings7d + 15 * avgConfidenceTop5));
    const scoreBreakdown = {
      base: 20,
      uniquePublishers7d,
      sightings7d,
      avgConfidenceTop5,
      formula: "20 + 8*uniquePublishers7d + 2*sightings7d + 15*avgConfidenceTop5",
    };

    const topEvidence = top5.map((o) => ({
      pageUrl: o.pageUrl,
      sourceName: (o as any).source?.name || o.sourceId,
      observedAt: o.observedAt,
      screenshotPath: o.screenshotPath,
    }));

    await prisma.lead.upsert({
      where: { advertiserId },
      update: {
        score,
        scoreBreakdown,
        firstSeenAt,
        lastSeenAt,
        sightings7d,
        uniquePublishers7d,
        avgConfidenceTop5,
        topEvidence,
      },
      create: {
        advertiserId,
        score,
        scoreBreakdown,
        firstSeenAt,
        lastSeenAt,
        sightings7d,
        uniquePublishers7d,
        avgConfidenceTop5,
        topEvidence,
      },
    });
  }
}
