import { MARKETING_STACK_TYPES } from "@/lib/marketing-stack-templates";
import { migrateCopyPiecesIfNeeded } from "@/lib/migrate-copy-pieces";
import { purgeExpiredArchivedVersions } from "@/lib/purge-expired-archives";
import {
  migrateLegacyCopyTypesIfNeeded,
  renameNumberedStackTypeNames,
} from "@/lib/migrate-legacy-copy-types";
import { prisma } from "@/lib/db";

const piecesInclude = {
  orderBy: [{ sortOrder: "asc" as const }, { updatedAt: "desc" as const }],
  include: {
    versions: {
      orderBy: { createdAt: "asc" as const },
    },
  },
};

/** Ensures new users start with the eight essential marketing stack types. */
export async function ensureDefaultCopyTypes(userId: string) {
  const count = await prisma.copyType.count({ where: { userId } });
  if (count > 0) return;

  await prisma.copyType.createMany({
    data: MARKETING_STACK_TYPES.map((t) => ({
      userId,
      name: t.name,
      sortOrder: t.sortOrder,
    })),
  });
}

export async function getCopyTypesWithVersions(userId: string) {
  await migrateLegacyCopyTypesIfNeeded(userId);
  await renameNumberedStackTypeNames(userId);
  await ensureDefaultCopyTypes(userId);
  await migrateCopyPiecesIfNeeded(userId);
  await purgeExpiredArchivedVersions(userId);

  return prisma.copyType.findMany({
    where: { userId },
    orderBy: { sortOrder: "asc" },
    include: {
      pieces: piecesInclude,
    },
  });
}

export { piecesInclude };
