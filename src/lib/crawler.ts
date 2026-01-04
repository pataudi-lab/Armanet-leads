import { load, type Element } from "cheerio";
import crypto from "crypto";
import { chromium } from "playwright";
import { URL } from "url";
import fs from "fs";
import path from "path";
import { logger } from "./logger";
import { prisma } from "./prisma";
import { AdType, CrawlMode } from "@prisma/client";

const adTechHosts = /(doubleclick|googlesyndication|adnxs|rubicon|openx|criteo|taboola|outbrain)/i;
const adScriptMarkers = /(googletag|gpt|prebid|pbjs|dfp)/i;
const sponsorText = /(sponsored|presented by|partner)/i;
const outboundPatterns = /(\/click|\/redirect|\/out|adclick|utm_campaign)/i;

export function hashValue(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export async function respectRobots(baseUrl: string, path: string): Promise<boolean> {
  try {
    const robotsUrl = new URL("/robots.txt", baseUrl).toString();
    const res = await fetch(robotsUrl, { redirect: "follow" });
    if (!res.ok) return true;
    const text = await res.text();
    const lines = text.split(/\n/).map((l) => l.trim());
    let apply = false;
    for (const line of lines) {
      if (line.toLowerCase().startsWith("user-agent:")) {
        apply = line.toLowerCase().includes("*");
      }
      if (apply && line.toLowerCase().startsWith("disallow:")) {
        const rule = line.split(":")[1]?.trim();
        if (rule && path.startsWith(rule)) {
          return false;
        }
      }
    }
    return true;
  } catch (err) {
    logger.warn({ err }, "robots check failed, allowing crawl");
    return true;
  }
}

export function jitterDelay(min = 2000, max = 5000) {
  const delay = min + Math.random() * (max - min);
  return new Promise((resolve) => setTimeout(resolve, delay));
}

async function fetchStatic(url: string, userAgent?: string) {
  const start = Date.now();
  const res = await fetch(url, {
    headers: {
      "User-Agent": userAgent || "ArmanetAdPoacher/1.0",
      Accept: "text/html,application/xhtml+xml",
    },
    redirect: "follow",
  });
  const html = await res.text();
  return { html, status: res.status, duration: Date.now() - start };
}

async function fetchWithPlaywright(url: string, userAgent?: string, screenshotPath?: string) {
  const start = Date.now();
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined,
  });
  const page = await browser.newPage({ userAgent });
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
  const html = await page.content();
  if (screenshotPath) {
    await page.screenshot({ path: screenshotPath, fullPage: true });
  }
  await browser.close();
  return { html, status: 200, duration: Date.now() - start };
}

export async function resolveRedirect(url: string, maxDepth = 2): Promise<string> {
  let current = url;
  for (let i = 0; i < maxDepth; i++) {
    try {
      const res = await fetch(current, { redirect: "manual" as const, method: "HEAD" });
      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get("location");
        if (location) {
          current = new URL(location, current).toString();
          continue;
        }
      }
      return current;
    } catch {
      return current;
    }
  }
  return current;
}

export type ExtractedObservation = {
  adType: AdType;
  rawHtmlSnippet: string;
  evidenceUrl: string;
  screenshotPath?: string | null;
  extractedClickUrl?: string | null;
  extractedDestDomain?: string | null;
  extractedBrandText?: string | null;
  confidence: number;
  signature: string;
};

function domainFromUrl(url?: string | null) {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "");
  } catch (e) {
    return null;
  }
}

export async function extractAdsFromHtml(
  html: string,
  pageUrl: string,
  sourceId: string,
  takeScreenshot = false,
  screenshotPath?: string
) {
  const $ = load(html);
  const observations: ExtractedObservation[] = [];

  const candidates: { el: Element; type: AdType }[] = [];
  $("iframe[src]").each((_, el) => {
    const src = $(el).attr("src") || "";
    if (adTechHosts.test(src)) {
      candidates.push({ el, type: AdType.IFRAME });
    }
  });
  $("script").each((_, el) => {
    const content = $(el).html() || "";
    const src = $(el).attr("src") || "";
    if (adScriptMarkers.test(content) || adScriptMarkers.test(src)) {
      candidates.push({ el, type: AdType.SCRIPT });
    }
  });
  $("img[src], a[href]").each((_, el) => {
    const src = $(el).attr("src") || $(el).attr("href") || "";
    if (adTechHosts.test(src) || outboundPatterns.test(src)) {
      candidates.push({ el, type: AdType.IMAGE });
    }
    const classes = ($(el).attr("class") || "") + " " + ($(el).attr("id") || "");
    if (/ad-|ads|gpt|dfp|prebid|sponsor/i.test(classes)) {
      candidates.push({ el, type: AdType.IMAGE });
    }
  });
  $("*:contains('Sponsored'), *:contains('Presented by'), *:contains('Partner')").each((_, el) => {
    candidates.push({ el, type: AdType.SPONSORED_LABEL });
  });
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    if (outboundPatterns.test(href)) {
      candidates.push({ el, type: AdType.OUTBOUND_LINK });
    }
  });

  for (const { el, type } of candidates) {
    const node = $(el);
    const snippet = $.html(el).slice(0, 500);
    const clickUrl = node.attr("href") || node.attr("src") || undefined;
    const resolvedClick = clickUrl ? await resolveRedirect(new URL(clickUrl, pageUrl).toString()) : undefined;
    const destDomain = domainFromUrl(resolvedClick);
    const brandText =
      node.attr("alt") ||
      node.attr("title") ||
      node.text()?.trim().slice(0, 120) ||
      node.parent().text()?.trim().slice(0, 120) ||
      undefined;

    let confidence = 0.2;
    if (destDomain) confidence = 0.9;
    else if (sponsorText.test(brandText || "")) confidence = 0.7;
    else if (brandText) confidence = 0.5;

    const signature = hashValue(`${sourceId}:${pageUrl}:${type}:${snippet}:${destDomain || ""}:${brandText || ""}`);

    observations.push({
      adType: type,
      rawHtmlSnippet: snippet,
      evidenceUrl: pageUrl,
      extractedClickUrl: resolvedClick,
      extractedDestDomain: destDomain,
      extractedBrandText: brandText,
      screenshotPath: takeScreenshot ? screenshotPath ?? null : undefined,
      confidence,
      signature,
    });
  }
  return observations;
}

export async function crawlPage(
  url: string,
  sourceId: string,
  mode: CrawlMode,
  options: { userAgent?: string; minDelay?: number; maxDelay?: number; takeScreenshot?: boolean }
) {
  const canCrawl = await respectRobots(url, new URL(url).pathname);
  if (!canCrawl) {
    await prisma.source.update({ where: { id: sourceId }, data: { blockedReason: "robots.txt" } });
    throw new Error("Blocked by robots.txt");
  }
  await jitterDelay(options.minDelay, options.maxDelay);
  const screenshotDir = process.env.SCREENSHOT_DIR || "./screenshots";
  const screenshotPath = options.takeScreenshot
    ? `${screenshotDir}/${hashValue(url).slice(0, 10)}.png`
    : undefined;
  if (screenshotPath) {
    fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });
  }
  const fetcher = mode === CrawlMode.PLAYWRIGHT ? fetchWithPlaywright : fetchStatic;
  const { html, status, duration } = await fetcher(url, options.userAgent, screenshotPath);
  if (status === 403 || status === 429) {
    await prisma.source.update({ where: { id: sourceId }, data: { blockedReason: `HTTP ${status}` } });
    throw new Error(`Received status ${status}, cooling down`);
  }
  const observations = await extractAdsFromHtml(html, url, sourceId, options.takeScreenshot, screenshotPath);
  const contentHash = hashValue(html);
  return { html, status, duration, observations, contentHash, screenshotPath };
}
