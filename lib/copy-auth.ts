import { prisma } from "@/lib/db";

export async function getOwnedCopyType(userId: string, typeId: string) {
  return prisma.copyType.findFirst({
    where: { id: typeId, userId },
  });
}

export async function getOwnedCopyPiece(userId: string, pieceId: string) {
  return prisma.copyPiece.findFirst({
    where: {
      id: pieceId,
      type: { userId },
    },
    include: { type: true },
  });
}

export async function getOwnedCopyVersion(userId: string, versionId: string) {
  return prisma.copyVersion.findFirst({
    where: {
      id: versionId,
      piece: { type: { userId } },
    },
    include: {
      piece: {
        include: { type: true },
      },
    },
  });
}
