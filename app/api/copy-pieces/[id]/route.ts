import { NextResponse } from "next/server";

import { getOrCreateAppUser } from "@/lib/app-user";
import { getOwnedCopyPiece } from "@/lib/copy-auth";
import { piecesInclude } from "@/lib/copy-types";
import { prisma } from "@/lib/db";
import { serializePiece } from "@/lib/dashboard-types";

type Params = Promise<{ id: string }>;

export async function PATCH(request: Request, { params }: { params: Params }) {
  const user = await getOrCreateAppUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await getOwnedCopyPiece(user.id, id);
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

  const { title, sortOrder } = body as Record<string, unknown>;
  const data: { title?: string; sortOrder?: number } = {};

  if ("title" in body) {
    if (typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json(
        { error: "title must be non-empty" },
        { status: 400 }
      );
    }
    data.title = title.trim();
  }
  if ("sortOrder" in body && typeof sortOrder === "number") {
    data.sortOrder = sortOrder;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  const piece = await prisma.copyPiece.update({
    where: { id },
    data,
    include: piecesInclude.include,
  });

  return NextResponse.json(serializePiece(piece));
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
  const existing = await getOwnedCopyPiece(user.id, id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.copyPiece.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
