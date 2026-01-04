import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sourceInputSchema } from "@/lib/sources";

export async function POST(req: Request) {
  const payload = await req.json();
  if (!Array.isArray(payload)) {
    return NextResponse.json({ error: "Expected array" }, { status: 400 });
  }
  const results = [] as any[];
  for (const item of payload) {
    const parsed = sourceInputSchema.safeParse(item);
    if (!parsed.success) {
      results.push({ error: parsed.error.flatten() });
      continue;
    }
    const data = parsed.data;
    const source = await prisma.source.upsert({
      where: { baseUrl: data.baseUrl },
      update: data,
      create: data,
    });
    results.push({ id: source.id, baseUrl: source.baseUrl });
  }
  return NextResponse.json({ count: results.length, results });
}
