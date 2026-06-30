import { NextResponse } from "next/server";

import { getOrCreateAppUser } from "@/lib/app-user";
import { getOwnedCopyVersion } from "@/lib/copy-auth";
import { prisma } from "@/lib/db";
import { serializeVersion } from "@/lib/dashboard-types";
import { isVersionGuideContent } from "@/lib/marketing-stack-templates";

type Params = Promise<{ id: string }>;

async function versionNumberFor(
  pieceId: string,
  versionId: string
): Promise<number> {
  const versions = await prisma.copyVersion.findMany({
    where: { pieceId },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  const index = versions.findIndex((v) => v.id === versionId);
  return index >= 0 ? index + 1 : versions.length;
}

export async function GET(_request: Request, { params }: { params: Params }) {
  const user = await getOrCreateAppUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await getOwnedCopyVersion(user.id, id);
  if (!existing || !existing.pieceId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const versionNumber = await versionNumberFor(existing.pieceId, existing.id);
  return NextResponse.json(
    serializeVersion({ ...existing, pieceId: existing.pieceId }, versionNumber)
  );
}

export async function PATCH(request: Request, { params }: { params: Params }) {
  const user = await getOrCreateAppUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await getOwnedCopyVersion(user.id, id);
  if (!existing || !existing.pieceId) {
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

  const { content, archived, inUse } = body as Record<string, unknown>;
  const data: {
    content?: string;
    archivedAt?: Date | null;
    inUse?: boolean;
  } = {};

  if ("content" in body) {
    const raw = typeof content === "string" ? content : "";
    const typeName = existing.piece?.type.name ?? "";
    data.content = isVersionGuideContent(typeName, raw) ? "" : raw;
  }
  if ("archived" in body) {
    if (typeof archived !== "boolean") {
      return NextResponse.json(
        { error: "archived must be a boolean" },
        { status: 400 }
      );
    }
    data.archivedAt = archived ? new Date() : null;
    if (archived) {
      data.inUse = false;
    }
  }
  if ("inUse" in body) {
    if (typeof inUse !== "boolean") {
      return NextResponse.json(
        { error: "inUse must be a boolean" },
        { status: 400 }
      );
    }
    if (existing.archivedAt && inUse) {
      return NextResponse.json(
        { error: "Cannot mark archived copy as in use" },
        { status: 400 }
      );
    }
    data.inUse = inUse;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  try {
    if (data.inUse === true) {
      await prisma.copyVersion.updateMany({
        where: { pieceId: existing.pieceId, id: { not: id } },
        data: { inUse: false },
      });
    }

    const version = await prisma.copyVersion.update({
      where: { id },
      data,
    });

    const versionNumber = await versionNumberFor(existing.pieceId, version.id);
    return NextResponse.json(
      serializeVersion({ ...version, pieceId: existing.pieceId }, versionNumber)
    );
  } catch (err) {
    console.error("copy-version PATCH failed:", err);
    return NextResponse.json(
      {
        error:
          "Could not update version. If you just added the star feature, run npm run db:push.",
      },
      { status: 500 }
    );
  }
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
  const existing = await getOwnedCopyVersion(user.id, id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.copyVersion.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
