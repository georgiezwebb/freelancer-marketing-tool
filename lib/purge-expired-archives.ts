import { ARCHIVE_RETENTION_MS } from "@/lib/archive-retention";
import { prisma } from "@/lib/db";

export async function purgeExpiredArchivedVersions(userId?: string) {
  const cutoff = new Date(Date.now() - ARCHIVE_RETENTION_MS);

  return prisma.copyVersion.deleteMany({
    where: {
      archivedAt: { not: null, lt: cutoff },
      ...(userId ? { piece: { type: { userId } } } : {}),
    },
  });
}
