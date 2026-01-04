/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["pino", "bullmq", "ioredis", "cheerio", "playwright"]
  }
};

export default nextConfig;
