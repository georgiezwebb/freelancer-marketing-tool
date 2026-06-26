import { currentUser } from "@clerk/nextjs/server";

import type { User as DbUser } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/db";

function displayName(
  cu: NonNullable<Awaited<ReturnType<typeof currentUser>>>
): string | null {
  if (cu.fullName) return cu.fullName;
  if (cu.firstName || cu.lastName) {
    return [cu.firstName, cu.lastName].filter(Boolean).join(" ");
  }
  return null;
}

export async function getOrCreateAppUser(): Promise<DbUser | null> {
  const cu = await currentUser();
  if (!cu) return null;

  const email =
    cu.primaryEmailAddress?.emailAddress ??
    cu.emailAddresses[0]?.emailAddress;
  if (!email) return null;

  return prisma.user.upsert({
    where: { email },
    create: {
      email,
      name: displayName(cu),
    },
    update: {
      name: displayName(cu) ?? undefined,
    },
  });
}
