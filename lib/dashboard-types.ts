/** Serialized shapes for the dashboard client (JSON-safe). */

export type CopyVersionRecord = {
  id: string;
  pieceId: string;
  content: string;
  inUse: boolean;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  /** 1-based index by creation order within the piece. */
  versionNumber: number;
};

export type CopyPieceRecord = {
  id: string;
  typeId: string;
  title: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  versions: CopyVersionRecord[];
};

export type CopyTypeRecord = {
  id: string;
  name: string;
  writingNotes: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  pieces: CopyPieceRecord[];
};

export function serializeVersion(
  row: {
    id: string;
    pieceId: string;
    content: string;
    inUse: boolean;
    archivedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  },
  versionNumber: number
): CopyVersionRecord {
  return {
    id: row.id,
    pieceId: row.pieceId,
    content: row.content,
    inUse: row.inUse ?? false,
    archivedAt: row.archivedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    versionNumber,
  };
}

export function serializePiece(row: {
  id: string;
  typeId: string;
  title: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  versions: {
    id: string;
    pieceId: string | null;
    content: string;
    inUse: boolean;
    archivedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }[];
}): CopyPieceRecord {
  const sorted = [...row.versions].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
  );

  return {
    id: row.id,
    typeId: row.typeId,
    title: row.title,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    versions: sorted.map((v, i) =>
      serializeVersion(
        { ...v, pieceId: v.pieceId ?? row.id },
        i + 1
      )
    ),
  };
}

export function serializeType(row: {
  id: string;
  name: string;
  writingNotes: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  pieces: {
    id: string;
    typeId: string;
    title: string;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
    versions: {
      id: string;
      pieceId: string | null;
      content: string;
      inUse: boolean;
      archivedAt: Date | null;
      createdAt: Date;
      updatedAt: Date;
    }[];
  }[];
}): CopyTypeRecord {
  return {
    id: row.id,
    name: row.name,
    writingNotes: row.writingNotes,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    pieces: row.pieces.map(serializePiece),
  };
}

export function versionLabel(version: CopyVersionRecord): string {
  return `Version ${version.versionNumber}`;
}
