import type {
  CopyPieceRecord,
  CopyTypeRecord,
  CopyVersionRecord,
} from "@/lib/dashboard-types";

export type VersionContext = {
  version: CopyVersionRecord;
  piece: CopyPieceRecord;
  type: CopyTypeRecord;
};

export function findVersionContext(
  types: CopyTypeRecord[],
  versionId: string | null
): VersionContext | null {
  if (!versionId) return null;
  for (const type of types) {
    for (const piece of type.pieces) {
      const version = piece.versions.find((v) => v.id === versionId);
      if (version) return { version, piece, type };
    }
  }
  return null;
}

export function findPiece(
  types: CopyTypeRecord[],
  pieceId: string | null
): { piece: CopyPieceRecord; type: CopyTypeRecord } | null {
  if (!pieceId) return null;
  for (const type of types) {
    const piece = type.pieces.find((p) => p.id === pieceId);
    if (piece) return { piece, type };
  }
  return null;
}

export function allVersionsForType(type: CopyTypeRecord): CopyVersionRecord[] {
  return type.pieces.flatMap((p) => p.versions);
}

export function initialSelection(types: CopyTypeRecord[]): {
  typeId: string | null;
  pieceId: string | null;
  versionId: string | null;
} {
  const type = types[0];
  if (!type) return { typeId: null, pieceId: null, versionId: null };

  const piece = type.pieces[0];
  if (!piece) return { typeId: type.id, pieceId: null, versionId: null };

  const version = piece.versions[0];
  return {
    typeId: type.id,
    pieceId: piece.id,
    versionId: version?.id ?? null,
  };
}
