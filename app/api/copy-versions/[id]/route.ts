import { NextResponse } from "next/server";

import { getOrCreateAppUser } from "@/lib/app-user";
import { getOwnedCopyVersion } from "@/lib/copy-auth";
import { prisma } from "@/lib/db";
import { serializeVersion } from "@/lib/dashboard-types";

type Params = Promise<{ id: string }>;

export async function PATCH(request: Request, { params }: { params: Params }) {
  const user = await getOrCreateAppUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await getOwnedCopyVersion(user.id, id);
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

  const { title, content, archived } = body as Record<string, unknown>;
  const data: {
    title?: string | null;
    content?: string;
    archivedAt?: Date | null;
  } = {};

  if ("title" in body) {
    data.title =
      typeof title === "string" && title.trim().length > 0
        ? title.trim()
        : null;
  }
  if ("content" in body) {
    data.content = typeof content === "string" ? content : "";
  }
  if ("archived" in body) {
    if (typeof archived !== "boolean") {
      return NextResponse.json(
        { error: "archived must be a boolean" },
        { status: 400 }
      );
    }
    data.archivedAt = archived ? new Date() : null;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  const version = await prisma.copyVersion.update({
    where: { id },
    data,
  });

  return NextResponse.json(serializeVersion(version));
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
