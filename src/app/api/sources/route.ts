import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sourceInputSchema } from "@/lib/sources";

export async function GET() {
  const sources = await prisma.source.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(sources);
}

export async function POST(req: Request) {
  const json = await req.json();
  const parsed = sourceInputSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;
  const source = await prisma.source.upsert({
    where: { baseUrl: data.baseUrl },
    update: data,
    create: data,
  });
  return NextResponse.json(source, { status: 201 });
}
