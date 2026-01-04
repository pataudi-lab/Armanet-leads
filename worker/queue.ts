import { Queue } from "bullmq";
import { redis } from "../src/lib/redis";

export const crawlerQueue = new Queue("crawler", {
  connection: redis.options,
});
