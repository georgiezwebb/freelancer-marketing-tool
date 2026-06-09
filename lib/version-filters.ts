import type { CopyVersionRecord } from "@/lib/dashboard-types";

export function isArchivedVersion(version: CopyVersionRecord): boolean {
  return version.archivedAt !== null;
}

export function activeVersions(versions: CopyVersionRecord[]): CopyVersionRecord[] {
  return versions.filter((v) => !isArchivedVersion(v));
}

export function archivedVersions(versions: CopyVersionRecord[]): CopyVersionRecord[] {
  return versions.filter((v) => isArchivedVersion(v));
}
