import { NextResponse } from "next/server";

import { getOrCreateAppUser } from "@/lib/app-user";
import { getOwnedCopyType } from "@/lib/copy-auth";
import { prisma } from "@/lib/db";
import { resolveVersionContent } from "@/lib/marketing-stack-templates";
import { serializeVersion } from "@/lib/dashboard-types";

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
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const title =
    body && typeof body === "object" && "title" in body
      ? (body as { title?: unknown }).title
      : undefined;
  const rawContent =
    body && typeof body === "object" && "content" in body
      ? (body as { content?: unknown }).content
      : undefined;

  const content = resolveVersionContent(
    type.name,
    typeof rawContent === "string" ? rawContent : undefined
  );

  const version = await prisma.copyVersion.create({
    data: {
      typeId,
      title:
        typeof title === "string" && title.trim().length > 0
          ? title.trim()
          : null,
      content,
    },
  });

  return NextResponse.json(serializeVersion(version), { status: 201 });
}
