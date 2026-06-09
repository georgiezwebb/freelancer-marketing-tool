import { MARKETING_STACK_TYPES } from "@/lib/marketing-stack-templates";
import {
  migrateLegacyCopyTypesIfNeeded,
  renameNumberedStackTypeNames,
} from "@/lib/migrate-legacy-copy-types";
import { prisma } from "@/lib/db";

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

  return prisma.copyType.findMany({
    where: { userId },
    orderBy: { sortOrder: "asc" },
    include: {
      versions: {
        orderBy: { updatedAt: "desc" },
      },
    },
  });
}
