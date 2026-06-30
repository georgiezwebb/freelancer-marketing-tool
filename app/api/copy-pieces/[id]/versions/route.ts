import { NextResponse } from "next/server";

import { getOrCreateAppUser } from "@/lib/app-user";
import { getOwnedCopyPiece, getOwnedCopyVersion } from "@/lib/copy-auth";
import { piecesInclude } from "@/lib/copy-types";
import { prisma } from "@/lib/db";
import {
  isVersionGuideContent,
  resolveVersionContent,
} from "@/lib/marketing-stack-templates";
import { serializeVersion } from "@/lib/dashboard-types";

type Params = Promise<{ id: string }>;

export async function POST(request: Request, { params }: { params: Params }) {
  const user = await getOrCreateAppUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: pieceId } = await params;
  const piece = await getOwnedCopyPiece(user.id, pieceId);
  if (!piece) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const sourceVersionId =
    body && typeof body === "object" && "sourceVersionId" in body
      ? (body as { sourceVersionId?: unknown }).sourceVersionId
      : undefined;

  let content = resolveVersionContent(piece.type.name, undefined);

  if (
    typeof sourceVersionId === "string" &&
    sourceVersionId.trim().length > 0
  ) {
    const source = await getOwnedCopyVersion(user.id, sourceVersionId);
    if (!source || source.pieceId !== pieceId) {
      return NextResponse.json(
        { error: "Source version not found for this piece" },
        { status: 400 }
      );
    }
    const raw = source.content;
    content = isVersionGuideContent(piece.type.name, raw) ? "" : raw;
  }

  const version = await prisma.copyVersion.create({
    data: {
      pieceId,
      content,
    },
  });

  const pieceWithVersions = await prisma.copyPiece.findUniqueOrThrow({
    where: { id: pieceId },
    include: piecesInclude.include,
  });

  const sorted = [...pieceWithVersions.versions].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
  );
  const versionNumber =
    sorted.findIndex((v) => v.id === version.id) + 1 || sorted.length;

  return NextResponse.json(
    serializeVersion({ ...version, pieceId }, versionNumber),
    { status: 201 }
  );
}
