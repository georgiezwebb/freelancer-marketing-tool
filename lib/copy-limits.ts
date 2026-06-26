export const WRITING_NOTES_MAX_LENGTH = 1000;

export function clampWritingNotes(notes: string): string {
  return notes.slice(0, WRITING_NOTES_MAX_LENGTH);
}
