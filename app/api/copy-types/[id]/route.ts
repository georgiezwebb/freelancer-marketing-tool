import { NextResponse } from "next/server";

import { getOrCreateAppUser } from "@/lib/app-user";
import { getOwnedCopyType } from "@/lib/copy-auth";
import { prisma } from "@/lib/db";
import { clampWritingNotes } from "@/lib/copy-limits";
import { serializeType } from "@/lib/dashboard-types";
import { sanitizeWritingNotes } from "@/lib/marketing-stack-templates";

type Params = Promise<{ id: string }>;

export async function PATCH(request: Request, { params }: { params: Params }) {
  const user = await getOrCreateAppUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await getOwnedCopyType(user.id, id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { name, sortOrder, writingNotes } = body as Record<string, unknown>;
  const data: { name?: string; sortOrder?: number; writingNotes?: string } = {};

  if ("name" in body) {
    if (typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "name must be non-empty" }, { status: 400 });
    }
    data.name = name.trim();
  }
  if ("sortOrder" in body && typeof sortOrder === "number") {
    data.sortOrder = sortOrder;
  }
  if ("writingNotes" in body) {
    if (typeof writingNotes !== "string") {
      return NextResponse.json(
        { error: "writingNotes must be a string" },
        { status: 400 }
      );
    }
    data.writingNotes = clampWritingNotes(
      sanitizeWritingNotes(existing.name, writingNotes)
    );
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  const type = await prisma.copyType.update({
    where: { id },
    data,
    include: { versions: { orderBy: { updatedAt: "desc" } } },
  });

  return NextResponse.json(serializeType(type));
}

export async function DELETE(
  _request: Request,
  { params }: { params: Params }
) {
  const user = await getOrCreateAppUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await getOwnedCopyType(user.id, id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.copyType.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
