import { prisma } from "@/lib/db";

export async function getOwnedCopyType(userId: string, typeId: string) {
  return prisma.copyType.findFirst({
    where: { id: typeId, userId },
  });
}

export async function getOwnedCopyVersion(userId: string, versionId: string) {
  return prisma.copyVersion.findFirst({
    where: {
      id: versionId,
      type: { userId },
    },
    include: { type: true },
  });
}
