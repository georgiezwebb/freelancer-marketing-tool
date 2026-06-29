/** Archived versions older than this are permanently deleted. */
export const ARCHIVE_RETENTION_MS = 365 * 24 * 60 * 60 * 1000;

export const ARCHIVE_RETENTION_NOTICE =
  "Archived copy is automatically deleted after 1 year.";

export function archiveDeletionDate(archivedAtIso: string): Date {
  return new Date(new Date(archivedAtIso).getTime() + ARCHIVE_RETENTION_MS);
}

export function archiveDeletionDateIso(archivedAtIso: string): string {
  return archiveDeletionDate(archivedAtIso).toISOString();
}
