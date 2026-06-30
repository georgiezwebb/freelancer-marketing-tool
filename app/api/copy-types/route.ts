import { NextResponse } from "next/server";

import { getOrCreateAppUser } from "@/lib/app-user";
import { getCopyTypesWithVersions } from "@/lib/copy-types";
import { prisma } from "@/lib/db";
import { serializeType } from "@/lib/dashboard-types";

export async function GET() {
  const user = await getOrCreateAppUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const types = await getCopyTypesWithVersions(user.id);
  return NextResponse.json(types.map(serializeType));
}

export async function POST(request: Request) {
  const user = await getOrCreateAppUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  const { name } = body as Record<string, unknown>;
  if (typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const maxOrder = await prisma.copyType.aggregate({
    where: { userId: user.id },
    _max: { sortOrder: true },
  });

  const type = await prisma.copyType.create({
    data: {
      userId: user.id,
      name: name.trim(),
      sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
    },
    include: { pieces: { include: { versions: true } } },
  });

  return NextResponse.json(serializeType(type), { status: 201 });
}
