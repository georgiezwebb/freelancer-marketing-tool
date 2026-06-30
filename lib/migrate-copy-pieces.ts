import { prisma } from "@/lib/db";

/** Groups legacy flat versions into CopyPieces (by type + title). */
export async function migrateCopyPiecesIfNeeded(
  userId: string
): Promise<boolean> {
  const unmigrated = await prisma.copyVersion.count({
    where: {
      pieceId: null,
      typeId: { not: null },
      type: { userId },
    },
  });

  if (unmigrated === 0) return false;

  const rows = await prisma.copyVersion.findMany({
    where: {
      pieceId: null,
      typeId: { not: null },
      type: { userId },
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      typeId: true,
      title: true,
      content: true,
      inUse: true,
      archivedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const groups = new Map<string, typeof rows>();
  for (const row of rows) {
    if (!row.typeId) continue;
    const normalizedTitle = row.title?.trim() || "";
    const key = normalizedTitle
      ? `${row.typeId}::${normalizedTitle.toLowerCase()}`
      : `${row.typeId}::${row.id}`;
    const list = groups.get(key) ?? [];
    list.push(row);
    groups.set(key, list);
  }

  let sortByType = new Map<string, number>();

  for (const group of groups.values()) {
    const first = group[0];
    if (!first?.typeId) continue;

    const pieceTitle =
      first.title?.trim() ||
      (group.length === 1 ? "Untitled" : `Untitled (${first.id.slice(-4)})`);

    const sortOrder = sortByType.get(first.typeId) ?? 0;
    sortByType.set(first.typeId, sortOrder + 1);

    const piece = await prisma.copyPiece.create({
      data: {
        typeId: first.typeId,
        title: pieceTitle,
        sortOrder,
      },
    });

    for (const version of group) {
      await prisma.copyVersion.update({
        where: { id: version.id },
        data: {
          pieceId: piece.id,
          typeId: null,
          title: null,
        },
      });
    }
  }

  return true;
}
