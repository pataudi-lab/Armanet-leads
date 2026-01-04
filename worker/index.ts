import { Worker, QueueScheduler } from "bullmq";
import { crawlerQueue } from "./queue";
import { crawlPageJob, crawlSource, crawlSourcesDaily } from "./jobs/crawl";
import { redis } from "../src/lib/redis";
import { logger } from "../src/lib/logger";

new QueueScheduler("crawler", { connection: redis.options });

const worker = new Worker(
  "crawler",
  async (job) => {
    if (job.name === "crawl_sources_daily") return crawlSourcesDaily();
    if (job.name === "crawl_source") return crawlSource(job as any);
    if (job.name === "crawl_page") return crawlPageJob(job as any);
    logger.warn({ name: job.name }, "Unknown job");
  },
  { connection: redis.options }
);

worker.on("completed", (job) => logger.info({ name: job.name, id: job.id }, "job completed"));
worker.on("failed", (job, err) => logger.error({ name: job?.name, id: job?.id, err }, "job failed"));

async function bootstrap() {
  logger.info("worker listening for crawler jobs");
  await crawlerQueue.add("crawl_sources_daily", {}, { repeat: { pattern: "0 2 * * *" } });
}

bootstrap();
