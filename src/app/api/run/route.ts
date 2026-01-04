import { NextResponse } from "next/server";
import { crawlerQueue } from "../../../../worker/queue";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const sourceId = body.sourceId as string | undefined;
  if (sourceId) {
    await crawlerQueue.add("crawl_source", { sourceId });
  } else {
    await crawlerQueue.add("crawl_sources_daily", {});
  }
  return NextResponse.json({ ok: true });
}
