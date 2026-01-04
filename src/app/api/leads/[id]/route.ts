import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const lead = await prisma.lead.update({
    where: { id: params.id },
    data: {
      status: body.status,
      notes: body.notes,
    },
  });
  return NextResponse.json(lead);
}
