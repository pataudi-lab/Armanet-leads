import { PrismaClient, AdType, CrawlMode } from "@prisma/client";
import { subDays } from "date-fns";

const prisma = new PrismaClient();

async function main() {
  const sources = [
    {
      name: "Recoil Online",
      baseUrl: "https://www.recoilweb.com",
      crawlMode: CrawlMode.STATIC,
      seeds: ["https://www.recoilweb.com/category/guns"],
      includePatterns: ["recoilweb.com"],
    },
    {
      name: "Athlon Outdoors",
      baseUrl: "https://www.athlonoutdoors.com",
      crawlMode: CrawlMode.STATIC,
      seeds: ["https://www.athlonoutdoors.com/category/gear"],
      includePatterns: ["athlonoutdoors.com"],
    },
    {
      name: "Outdoor Life",
      baseUrl: "https://www.outdoorlife.com",
      crawlMode: CrawlMode.PLAYWRIGHT,
      seeds: ["https://www.outdoorlife.com/gear"],
      includePatterns: ["outdoorlife.com"],
    },
  ];

  for (const source of sources) {
    await prisma.source.upsert({
      where: { baseUrl: source.baseUrl },
      update: {},
      create: source,
    });
  }

  const source = await prisma.source.findFirst();
  if (!source) return;

  const advertiser = await prisma.advertiser.upsert({
    where: { primaryDomain: "example-ads.com" },
    update: { name: "Example Ads" },
    create: { primaryDomain: "example-ads.com", name: "Example Ads" },
  });

  const observationTime = subDays(new Date(), 1);
  const observation = await prisma.adObservation.create({
    data: {
      sourceId: source.id,
      pageUrl: `${source.baseUrl}/sample-gear` ,
      adType: AdType.IFRAME,
      rawHtmlSnippet: "<iframe src=\"https://example-ads.com/display\"></iframe>",
      evidenceUrl: `${source.baseUrl}/sample-gear` ,
      extractedClickUrl: "https://example-ads.com/landing",
      extractedDestDomain: "example-ads.com",
      extractedBrandText: "Example Brand",
      confidence: 0.9,
      signature: `seed-${source.id}`,
      observedAt: observationTime,
    },
  });

  await prisma.lead.upsert({
    where: { advertiserId: advertiser.id },
    update: {
      score: 72,
      scoreBreakdown: { base: 20, uniquePublishers7d: 2, sightings7d: 3, avgConfidenceTop5: 0.9 },
      firstSeenAt: observationTime,
      lastSeenAt: observationTime,
      sightings7d: 3,
      uniquePublishers7d: 2,
      avgConfidenceTop5: 0.9,
      topEvidence: [
        {
          pageUrl: observation.pageUrl,
          sourceName: source.name,
          observedAt: observation.observedAt,
          screenshotPath: null,
        },
      ],
    },
    create: {
      advertiserId: advertiser.id,
      score: 72,
      scoreBreakdown: { base: 20, uniquePublishers7d: 2, sightings7d: 3, avgConfidenceTop5: 0.9 },
      firstSeenAt: observationTime,
      lastSeenAt: observationTime,
      sightings7d: 3,
      uniquePublishers7d: 2,
      avgConfidenceTop5: 0.9,
      topEvidence: [
        {
          pageUrl: observation.pageUrl,
          sourceName: source.name,
          observedAt: observation.observedAt,
          screenshotPath: null,
        },
      ],
      status: "NEW",
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
