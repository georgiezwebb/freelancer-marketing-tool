import { NextResponse } from "next/server";

import { getOrCreateAppUser } from "@/lib/app-user";
import { getOwnedCopyType } from "@/lib/copy-auth";
import { piecesInclude } from "@/lib/copy-types";
import { prisma } from "@/lib/db";
import { resolveVersionContent } from "@/lib/marketing-stack-templates";
import { serializePiece } from "@/lib/dashboard-types";

type Params = Promise<{ id: string }>;

export async function POST(request: Request, { params }: { params: Params }) {
  const user = await getOrCreateAppUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: typeId } = await params;
  const type = await getOwnedCopyType(user.id, typeId);
  if (!type) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const title =
    body && typeof body === "object" && "title" in body
      ? (body as { title?: unknown }).title
      : undefined;

  const maxOrder = await prisma.copyPiece.aggregate({
    where: { typeId },
    _max: { sortOrder: true },
  });

  const pieceTitle =
    typeof title === "string" && title.trim().length > 0
      ? title.trim()
      : "Untitled";

  const content = resolveVersionContent(type.name, undefined);

  const piece = await prisma.copyPiece.create({
    data: {
      typeId,
      title: pieceTitle,
      sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
      versions: {
        create: { content },
      },
    },
    include: piecesInclude.include,
  });

  return NextResponse.json(serializePiece(piece), { status: 201 });
}
