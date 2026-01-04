import { Job } from "bullmq";
import { crawlerQueue } from "../queue";
import { prisma } from "../../src/lib/prisma";
import { crawlPage } from "../../src/lib/crawler";
import { logger } from "../../src/lib/logger";
import { upsertAdvertisersAndLeads } from "../../src/lib/aggregation";
import { CrawlMode, CrawlStatus, JobStatus } from "@prisma/client";
import { URL } from "url";

const domainLocks: Record<string, number> = {};

async function limitDomain(domain: string) {
  while ((domainLocks[domain] || 0) >= 2) {
    await new Promise((r) => setTimeout(r, 200));
  }
  domainLocks[domain] = (domainLocks[domain] || 0) + 1;
}

function releaseDomain(domain: string) {
  domainLocks[domain] = Math.max(0, (domainLocks[domain] || 1) - 1);
}

async function parseSitemap(url: string): Promise<string[]> {
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const text = await res.text();
    const matches = [...text.matchAll(/<loc>(.*?)<\/loc>/g)];
    return matches.map((m) => m[1]).slice(0, 50);
  } catch (e) {
    logger.warn({ url, e }, "sitemap fetch failed");
    return [];
  }
}

async function parseRss(url: string): Promise<string[]> {
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const text = await res.text();
    const matches = [...text.matchAll(/<link>(.*?)<\/link>/g)];
    return matches.map((m) => m[1]).slice(0, 50);
  } catch (e) {
    logger.warn({ url, e }, "rss fetch failed");
    return [];
  }
}

function applyFilters(urls: string[], includes: string[], excludes: string[]) {
  return urls
    .filter((url) => {
      if (includes.length && !includes.some((r) => new RegExp(r).test(url))) return false;
      if (excludes.some((r) => new RegExp(r).test(url))) return false;
      return true;
    })
    .filter((v, idx, arr) => arr.indexOf(v) === idx);
}

export async function crawlSourcesDaily() {
  const sources = await prisma.source.findMany({ where: { enabled: true } });
  for (const source of sources) {
    await crawlerQueue.add("crawl_source", { sourceId: source.id });
  }
  await prisma.jobRun.create({
    data: { jobName: "crawl_sources_daily", status: JobStatus.OK, stats: { sources: sources.length } },
  });
}

export async function crawlSource(job: Job<{ sourceId: string }>) {
  const source = await prisma.source.findUnique({ where: { id: job.data.sourceId } });
  if (!source) return;
  let urls: string[] = [];
  if (source.seeds.length) {
    urls = source.seeds;
  } else if (source.sitemapUrl) {
    urls = await parseSitemap(source.sitemapUrl);
  } else if (source.rssUrl) {
    urls = await parseRss(source.rssUrl);
  } else {
    urls = [source.baseUrl];
  }
  urls = applyFilters(urls, source.includePatterns, source.excludePatterns).slice(0, source.maxPagesPerRun);

  for (const url of urls) {
    await crawlerQueue.add("crawl_page", { sourceId: source.id, url }, { jobId: `${source.id}:${url}` });
  }

  await prisma.jobRun.create({
    data: {
      jobName: "crawl_source",
      sourceId: source.id,
      status: JobStatus.OK,
      stats: { queued: urls.length },
    },
  });
}

export async function crawlPageJob(job: Job<{ sourceId: string; url: string }>) {
  const { sourceId, url } = job.data;
  const source = await prisma.source.findUnique({ where: { id: sourceId } });
  if (!source) return;
  const domain = new URL(url).hostname;
  await limitDomain(domain);
  const started = Date.now();
  try {
    let attempt = 0;
    let lastError: any;
    let status = 0;
    let duration = 0;
    let observations: any[] = [];
    let contentHash = \"\";
    while (attempt < 3) {
      try {
        const result = await crawlPage(url, sourceId, source.crawlMode as CrawlMode, {
          userAgent: source.userAgent,
          minDelay: source.crawlDelayMsMin,
          maxDelay: source.crawlDelayMsMax,
          takeScreenshot: source.crawlMode === CrawlMode.PLAYWRIGHT,
        });
        status = result.status;
        duration = result.duration;
        observations = result.observations;
        contentHash = result.contentHash;
        break;
      } catch (err) {
        lastError = err;
        attempt += 1;
        await new Promise((r) => setTimeout(r, Math.min(30000, 1000 * 2 ** attempt)));
      }
    }
    if (attempt >= 3 && lastError) {
      throw lastError;
    }

    await prisma.page.upsert({
      where: { sourceId_url: { sourceId, url } },
      update: {
        lastFetchedAt: new Date(),
        lastStatusCode: status,
        contentHash,
        fetchDurationMs: duration,
      },
      create: {
        sourceId,
        url,
        lastFetchedAt: new Date(),
        lastStatusCode: status,
        contentHash,
        fetchDurationMs: duration,
      },
    });

    const stored: string[] = [];
    for (const obs of observations) {
      const record = await prisma.adObservation.upsert({
        where: { sourceId_signature: { sourceId, signature: obs.signature } },
        update: obs,
        create: { ...obs, sourceId, pageUrl: url },
      });
      stored.push(record.id);
    }

    await upsertAdvertisersAndLeads(
      observations.map((o) => ({ ...o, sourceId, pageUrl: url, id: "temp", observedAt: new Date() } as any))
    );

    await prisma.crawlLog.create({
      data: {
        sourceId,
        url,
        status: CrawlStatus.OK,
        statusCode: status,
        durationMs: duration,
        errorText: null,
        errorClass: null,
      },
    });
    logger.info({ url, stored: stored.length }, "crawl complete");
  } catch (e: any) {
    logger.error({ url, e }, "crawl failed");
    await prisma.crawlLog.create({
      data: {
        sourceId,
        url,
        status: CrawlStatus.FAIL,
        statusCode: null,
        durationMs: Date.now() - started,
        errorText: e?.message,
        errorClass: e?.name,
      },
    });
  } finally {
    releaseDomain(domain);
  }
}
