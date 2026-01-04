import { z } from "zod";
import { prisma } from "./prisma";
import { CrawlMode } from "@prisma/client";

export const sourceInputSchema = z.object({
  name: z.string().min(1),
  baseUrl: z.string().url(),
  enabled: z.boolean().optional().default(true),
  crawlMode: z.nativeEnum(CrawlMode).optional().default(CrawlMode.STATIC),
  seeds: z.array(z.string().url()).optional().default([]),
  sitemapUrl: z.string().url().optional().or(z.literal("")),
  rssUrl: z.string().url().optional().or(z.literal("")),
  includePatterns: z.array(z.string()).optional().default([]),
  excludePatterns: z.array(z.string()).optional().default([]),
  maxPagesPerRun: z.number().int().min(1).max(500).optional().default(50),
  crawlDelayMsMin: z.number().int().min(500).max(10000).optional().default(2000),
  crawlDelayMsMax: z.number().int().min(500).max(15000).optional().default(5000),
  userAgent: z.string().optional().default("ArmanetAdPoacher/1.0"),
});

export async function upsertSourceFromInput(data: unknown) {
  const parsed = sourceInputSchema.parse(data);
  return prisma.source.upsert({
    where: { baseUrl: parsed.baseUrl },
    update: parsed,
    create: parsed,
  });
}
