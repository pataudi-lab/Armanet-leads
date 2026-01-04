import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sourceInputSchema } from "@/lib/sources";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const json = await req.json();
  const parsed = sourceInputSchema.partial().safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const updated = await prisma.source.update({ where: { id: params.id }, data: parsed.data });
  return NextResponse.json(updated);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await prisma.source.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
