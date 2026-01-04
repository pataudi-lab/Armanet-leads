import { prisma } from "@/lib/prisma";
import { SourcesClient } from "./sources-client";

export default async function SourcesPage() {
  const sources = await prisma.source.findMany({ orderBy: { createdAt: "desc" } });
  return <SourcesClient initialSources={sources} />;
}
