import type {
  CopyPieceRecord,
  CopyTypeRecord,
  CopyVersionRecord,
} from "@/lib/dashboard-types";
import { allVersionsForType } from "@/lib/copy-tree";

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

export function activePieces(pieces: CopyPieceRecord[]): CopyPieceRecord[] {
  return [...pieces].sort((a, b) => {
    const aActive = activeVersions(a.versions).length > 0;
    const bActive = activeVersions(b.versions).length > 0;
    if (aActive !== bActive) return aActive ? -1 : 1;
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

export type ArchivedVersionEntry = {
  version: CopyVersionRecord;
  pieceId: string;
  pieceTitle: string;
  typeId: string;
  typeName: string;
};

export function allArchivedVersions(
  types: CopyTypeRecord[]
): ArchivedVersionEntry[] {
  const items: ArchivedVersionEntry[] = [];
  for (const type of types) {
    for (const piece of type.pieces) {
      for (const version of piece.versions) {
        if (isArchivedVersion(version)) {
          items.push({
            version,
            pieceId: piece.id,
            pieceTitle: piece.title,
            typeId: type.id,
            typeName: type.name,
          });
        }
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

export function allActiveVersionsForType(
  type: CopyTypeRecord
): CopyVersionRecord[] {
  return activeVersions(allVersionsForType(type));
}
