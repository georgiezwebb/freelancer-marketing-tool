import { MARKETING_STACK_TYPES } from "@/lib/marketing-stack-templates";
import { prisma } from "@/lib/db";

const LEGACY_TYPE_NAMES = ["Type 1", "Type 2", "Type 3"] as const;

function isLegacyName(name: string) {
  return LEGACY_TYPE_NAMES.includes(name as (typeof LEGACY_TYPE_NAMES)[number]);
}

function isLegacyOnly(types: { name: string }[]) {
  return types.length > 0 && types.every((t) => isLegacyName(t.name));
}

async function seedMarketingStackTypes(userId: string) {
  await prisma.copyType.createMany({
    data: MARKETING_STACK_TYPES.map((t) => ({
      userId,
      name: t.name,
      sortOrder: t.sortOrder,
    })),
  });
}

async function syncStackTypeSortOrders(userId: string) {
  for (const t of MARKETING_STACK_TYPES) {
    await prisma.copyType.updateMany({
      where: { userId, name: t.name },
      data: { sortOrder: t.sortOrder },
    });
  }
}

/** Rename stack types that still use legacy "1. Title" labels. */
export async function renameNumberedStackTypeNames(userId: string) {
  for (const t of MARKETING_STACK_TYPES) {
    const numberedName = `${t.sortOrder + 1}. ${t.name}`;
    await prisma.copyType.updateMany({
      where: { userId, name: numberedName },
      data: { name: t.name },
    });
  }

  // Name had the number baked into the template (not only a prefixed label).
  await prisma.copyType.updateMany({
    where: { userId, name: "7. Basic Content System" },
    data: { name: "Basic Content System" },
  });
}

/** Replace legacy “Type 1–3” with the eight marketing stack types. Returns true if migrated. */
export async function migrateLegacyCopyTypesIfNeeded(
  userId: string
): Promise<boolean> {
  const types = await prisma.copyType.findMany({
    where: { userId },
    select: { name: true },
  });

  if (!types.some((t) => isLegacyName(t.name))) return false;

  if (isLegacyOnly(types)) {
    await prisma.copyType.deleteMany({ where: { userId } });
    await seedMarketingStackTypes(userId);
    return true;
  }

  await prisma.copyType.deleteMany({
    where: {
      userId,
      name: { in: [...LEGACY_TYPE_NAMES] },
    },
  });

  const existingNames = new Set(
    (
      await prisma.copyType.findMany({
        where: { userId },
        select: { name: true },
      })
    ).map((t) => t.name)
  );

  const missing = MARKETING_STACK_TYPES.filter(
    (t) => !existingNames.has(t.name)
  );

  if (missing.length > 0) {
    await prisma.copyType.createMany({
      data: missing.map((t) => ({
        userId,
        name: t.name,
        sortOrder: t.sortOrder,
      })),
    });
  }

  await syncStackTypeSortOrders(userId);
  return true;
}

/** Run migration for every user (CLI / one-off). */
export async function migrateAllUsersLegacyCopyTypes() {
  const users = await prisma.user.findMany({ select: { id: true, email: true } });
  let migrated = 0;

  for (const user of users) {
    const did = await migrateLegacyCopyTypesIfNeeded(user.id);
    if (did) {
      migrated += 1;
      console.log(`Migrated copy types for ${user.email}`);
    }
  }

  console.log(
    `Done. ${migrated} of ${users.length} user(s) migrated from legacy types.`
  );
}
