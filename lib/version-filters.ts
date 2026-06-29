import type { CopyTypeRecord, CopyVersionRecord } from "@/lib/dashboard-types";

export function isArchivedVersion(version: CopyVersionRecord): boolean {
  return version.archivedAt !== null;
}

export function isInUseVersion(version: CopyVersionRecord): boolean {
  return version.inUse;
}

function sortVersions(versions: CopyVersionRecord[]): CopyVersionRecord[] {
  return [...versions].sort((a, b) => {
    if (a.inUse !== b.inUse) return a.inUse ? -1 : 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

export function activeVersions(versions: CopyVersionRecord[]): CopyVersionRecord[] {
  return sortVersions(versions.filter((v) => !isArchivedVersion(v)));
}

function sortByArchivedDate(
  versions: CopyVersionRecord[]
): CopyVersionRecord[] {
  return [...versions].sort((a, b) => {
    const aTime = new Date(a.archivedAt ?? a.updatedAt).getTime();
    const bTime = new Date(b.archivedAt ?? b.updatedAt).getTime();
    return bTime - aTime;
  });
}

export function archivedVersions(versions: CopyVersionRecord[]): CopyVersionRecord[] {
  return sortByArchivedDate(versions.filter((v) => isArchivedVersion(v)));
}

export type ArchivedVersionEntry = {
  version: CopyVersionRecord;
  typeId: string;
  typeName: string;
};

export function allArchivedVersions(
  types: CopyTypeRecord[]
): ArchivedVersionEntry[] {
  const items: ArchivedVersionEntry[] = [];
  for (const type of types) {
    for (const version of type.versions) {
      if (isArchivedVersion(version)) {
        items.push({
          version,
          typeId: type.id,
          typeName: type.name,
        });
      }
    }
  }
  return items.sort((a, b) => {
    const aTime = new Date(
      a.version.archivedAt ?? a.version.updatedAt
    ).getTime();
    const bTime = new Date(
      b.version.archivedAt ?? b.version.updatedAt
    ).getTime();
    return bTime - aTime;
  });
}
