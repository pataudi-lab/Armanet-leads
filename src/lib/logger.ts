import pino from "pino";

export const logger = pino({
  name: "armanet",
  level: process.env.LOG_LEVEL || "info",
});
