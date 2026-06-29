/** Serialized shapes for the dashboard client (JSON-safe). */

export type CopyVersionRecord = {
  id: string;
  typeId: string;
  title: string | null;
  content: string;
  inUse: boolean;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CopyTypeRecord = {
  id: string;
  name: string;
  writingNotes: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  versions: CopyVersionRecord[];
};

export function serializeVersion(row: {
  id: string;
  typeId: string;
  title: string | null;
  content: string;
  inUse: boolean;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): CopyVersionRecord {
  return {
    id: row.id,
    typeId: row.typeId,
    title: row.title,
    content: row.content,
    inUse: row.inUse ?? false,
    archivedAt: row.archivedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function serializeType(row: {
  id: string;
  name: string;
  writingNotes: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  versions: {
    id: string;
    typeId: string;
    title: string | null;
    content: string;
    inUse: boolean;
    archivedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }[];
}): CopyTypeRecord {
  return {
    id: row.id,
    name: row.name,
    writingNotes: row.writingNotes,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    versions: row.versions.map(serializeVersion),
  };
}
