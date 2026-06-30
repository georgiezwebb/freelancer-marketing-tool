"use client";

import * as React from "react";
import { ArchiveIcon, ArchiveRestoreIcon, ChevronLeftIcon, StarIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  getGuideForTypeName,
  isVersionGuideContent,
  sanitizeWritingNotes,
} from "@/lib/marketing-stack-templates";

import type { CopyPieceRecord, CopyVersionRecord } from "@/lib/dashboard-types";
import { versionLabel } from "@/lib/dashboard-types";
import {
  ARCHIVE_RETENTION_NOTICE,
  archiveDeletionDateIso,
} from "@/lib/archive-retention";
import { formatDateTime } from "@/lib/format-datetime";

import { clampWritingNotes } from "@/lib/copy-limits";
import { cn } from "@/lib/utils";
import { isArchivedVersion } from "@/lib/version-filters";

import {
  CopyWritingNotesPanel,
  CopyWritingNotesReopenButton,
} from "./CopyWritingNotes";
import { RichTextEditor } from "./RichTextEditor";

const inputClass =
  "flex min-h-9 w-full border-2 border-foreground bg-background px-2.5 py-1.5 text-sm outline-none transition-[box-shadow] focus-visible:ring-2 focus-visible:ring-ring/50";

function editorContentForVersion(
  version: CopyVersionRecord,
  typeName: string | null
): string {
  if (typeName && isVersionGuideContent(typeName, version.content)) return "";
  return version.content;
}

type NotesStatus = "idle" | "saving" | "saved" | "error";

export type CopyEditorHandle = {
  save: () => Promise<boolean>;
};

type Props = {
  version: CopyVersionRecord | null;
  piece: CopyPieceRecord | null;
  typeId: string | null;
  typeName: string | null;
  writingNotes: string;
  showNotesInitially?: boolean;
  onNotesDismiss?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
  onPieceTitleDirtyChange?: (dirty: boolean) => void;
  onWritingNotesSaved: (typeId: string, writingNotes: string) => void;
  onSaved: (version: CopyVersionRecord) => void;
  onPieceSaved: (piece: CopyPieceRecord) => void;
  onDeleted: (versionId: string) => void;
  onArchived: (version: CopyVersionRecord) => void;
  onToggleInUse: (
    versionId: string,
    inUse: boolean
  ) => boolean | void | Promise<boolean | void>;
  onBackToVersions?: () => void;
  onRequestNewVersion?: () => void;
};

export const CopyEditor = React.forwardRef<CopyEditorHandle, Props>(
  function CopyEditor(
    {
      version,
      piece,
      typeId,
      typeName,
      writingNotes,
      showNotesInitially = false,
      onNotesDismiss,
      onDirtyChange,
      onPieceTitleDirtyChange,
      onWritingNotesSaved,
      onSaved,
      onPieceSaved,
      onDeleted,
      onArchived,
      onToggleInUse,
      onBackToVersions,
      onRequestNewVersion,
    },
    ref
  ) {
  const templateGuide = typeName ? getGuideForTypeName(typeName) : "";
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [userNotes, setUserNotes] = React.useState("");
  const [notesOpen, setNotesOpen] = React.useState(false);
  const [notesStatus, setNotesStatus] = React.useState<NotesStatus>("idle");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [dirty, setDirty] = React.useState(false);
  const [titleDirty, setTitleDirty] = React.useState(false);
  const notesSaveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedNotes = React.useRef("");
  const lastSavedTitle = React.useRef("");
  const titleInputRef = React.useRef<HTMLInputElement>(null);
  const activeVersionIdRef = React.useRef<string | null>(version?.id ?? null);
  const activePieceIdRef = React.useRef<string | null>(piece?.id ?? null);
  activeVersionIdRef.current = version?.id ?? null;
  activePieceIdRef.current = piece?.id ?? null;

  const markDirty = React.useCallback(() => {
    setDirty(true);
    onDirtyChange?.(true);
  }, [onDirtyChange]);

  const markClean = React.useCallback(() => {
    setDirty(false);
    onDirtyChange?.(false);
  }, [onDirtyChange]);

  /** Reset fields when switching versions — useLayoutEffect so Quill mounts with correct content. */
  React.useLayoutEffect(() => {
    if (!version || !piece) {
      setTitle("");
      setContent("");
      setUserNotes("");
      setNotesOpen(false);
      markClean();
      setTitleDirty(false);
      onPieceTitleDirtyChange?.(false);
      setError(null);
      setNotesStatus("idle");
      return;
    }
    const pieceTitle = piece.title;
    setTitle(pieceTitle);
    lastSavedTitle.current = pieceTitle;
    setContent(editorContentForVersion(version, typeName));
    setNotesOpen(Boolean(showNotesInitially));
    markClean();
    setTitleDirty(false);
    onPieceTitleDirtyChange?.(false);
    setError(null);
    setNotesStatus("idle");
  }, [version?.id, piece?.id, piece?.title, typeName, showNotesInitially, markClean, onPieceTitleDirtyChange]);

  const notesCleanupRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!version || !typeId) return;
    const notes = clampWritingNotes(writingNotes);
    const cleanNotes = typeName
      ? sanitizeWritingNotes(typeName, notes)
      : notes;
    setUserNotes(cleanNotes);
    lastSavedNotes.current = cleanNotes;

    if (cleanNotes !== notes && notesCleanupRef.current !== typeId) {
      notesCleanupRef.current = typeId;
      void (async () => {
        try {
          const res = await fetch(`/api/copy-types/${typeId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ writingNotes: cleanNotes }),
          });
          if (!res.ok) return;
          lastSavedNotes.current = cleanNotes;
          onWritingNotesSaved(typeId, cleanNotes);
        } catch {
          notesCleanupRef.current = null;
        }
      })();
    }
  }, [version?.id, writingNotes, typeName, typeId, onWritingNotesSaved]);

  const saveVersion = React.useCallback(async (): Promise<boolean> => {
    const versionId = version?.id;
    const pieceId = piece?.id;
    if (!versionId || !pieceId) return true;

    const contentPayload =
      typeName && isVersionGuideContent(typeName, content) ? "" : content;
    const titleChanged = title.trim() !== lastSavedTitle.current.trim();
    const contentChanged = contentPayload !== version.content;

    if (!titleChanged && !contentChanged) {
      markClean();
      setTitleDirty(false);
      onPieceTitleDirtyChange?.(false);
      return true;
    }

    setPending(true);
    setError(null);
    try {
      if (contentChanged) {
        const res = await fetch(`/api/copy-versions/${versionId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: contentPayload }),
        });
        if (!res.ok) {
          const j = (await res.json().catch(() => null)) as { error?: string };
          throw new Error(j?.error ?? "Save failed");
        }
        const saved = (await res.json()) as CopyVersionRecord;
        if (activeVersionIdRef.current === versionId) {
          onSaved(saved);
        }
      }

      if (titleChanged) {
        const trimmed = title.trim();
        if (!trimmed) {
          throw new Error("Title is required");
        }
        const res = await fetch(`/api/copy-pieces/${pieceId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: trimmed }),
        });
        if (!res.ok) {
          const j = (await res.json().catch(() => null)) as { error?: string };
          throw new Error(j?.error ?? "Could not save title");
        }
        const savedPiece = (await res.json()) as CopyPieceRecord;
        if (activePieceIdRef.current === pieceId) {
          lastSavedTitle.current = savedPiece.title;
          onPieceSaved(savedPiece);
        }
      }

      if (activeVersionIdRef.current !== versionId) return true;
      markClean();
      setTitleDirty(false);
      onPieceTitleDirtyChange?.(false);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
      return false;
    } finally {
      setPending(false);
    }
  }, [
    version,
    piece,
    title,
    content,
    typeName,
    onSaved,
    onPieceSaved,
    markClean,
    onPieceTitleDirtyChange,
  ]);

  React.useImperativeHandle(ref, () => ({ save: saveVersion }), [saveVersion]);

  React.useEffect(() => {
    if (!typeId || userNotes === lastSavedNotes.current) return;

    if (notesSaveTimer.current) clearTimeout(notesSaveTimer.current);
    setNotesStatus("idle");

    notesSaveTimer.current = setTimeout(async () => {
      setNotesStatus("saving");
      try {
        const res = await fetch(`/api/copy-types/${typeId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            writingNotes: clampWritingNotes(
              typeName
                ? sanitizeWritingNotes(typeName, userNotes)
                : userNotes
            ),
          }),
        });
        if (!res.ok) throw new Error("Failed to save notes");
        lastSavedNotes.current = userNotes;
        onWritingNotesSaved(typeId, userNotes);
        setNotesStatus("saved");
        window.setTimeout(() => setNotesStatus("idle"), 2000);
      } catch {
        setNotesStatus("error");
      }
    }, 600);

    return () => {
      if (notesSaveTimer.current) clearTimeout(notesSaveTimer.current);
    };
  }, [userNotes, typeId, onWritingNotesSaved]);

  function handleNotesOpenChange(open: boolean) {
    setNotesOpen(open);
    if (!open) onNotesDismiss?.();
  }

  async function handleSave() {
    await saveVersion();
  }

  async function handleDelete() {
    if (!version) return;
    if (!window.confirm("Delete this version? This cannot be undone.")) return;
    setPending(true);
    try {
      const res = await fetch(`/api/copy-versions/${version.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      onDeleted(version.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setPending(false);
    }
  }

  async function handleSetArchived(archived: boolean) {
    if (!version) return;
    const msg = archived
      ? `Archive this version? You can restore it from the archived list for up to 1 year. ${ARCHIVE_RETENTION_NOTICE}`
      : "Restore this version to your active copy?";
    if (!window.confirm(msg)) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/copy-versions/${version.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived }),
      });
      if (!res.ok) throw new Error(archived ? "Archive failed" : "Restore failed");
      const updated = (await res.json()) as CopyVersionRecord;
      onArchived(updated);
      markClean();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setPending(false);
    }
  }

  const canShowNotes = Boolean(typeId && version);
  const isArchived = version ? isArchivedVersion(version) : false;

  if (!version || !piece) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
        {typeName ? (
          <p className="border-2 border-foreground bg-muted/30 px-3 py-1 text-sm font-semibold tracking-tight text-foreground">
            {typeName}
          </p>
        ) : null}
        <p className="max-w-md text-sm text-muted-foreground">
          {typeName
            ? "Select a version on the left, or use + to add one."
            : "Expand a type on the left, then select or add copy to edit."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="max-h-[min(38vh,15rem)] shrink-0 overflow-y-auto border-b border-foreground/10">
        <div className="flex flex-col gap-3 px-4 pt-3 pb-3 sm:px-6 sm:pt-4 sm:pb-4">
          {onBackToVersions ? (
            <button
              type="button"
              onClick={onBackToVersions}
              className="flex w-fit items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground md:hidden"
            >
              <ChevronLeftIcon className="size-3.5" />
              Back to versions
            </button>
          ) : null}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              {typeName ? (
                <p className="inline-block max-w-full truncate border-2 border-foreground bg-muted/30 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-foreground">
                  {typeName}
                </p>
              ) : null}
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                <span className="font-medium text-foreground">
                  {versionLabel(version)}
                </span>
                {" · "}
                {isArchived ? (
                  <>
                    <span className="font-medium text-foreground">Archived · </span>
                    {version.archivedAt ? (
                      <>
                        <span className="block sm:inline">
                          Deletes{" "}
                          {formatDateTime(
                            archiveDeletionDateIso(version.archivedAt)
                          )}
                        </span>
                        <span className="hidden sm:inline"> · </span>
                      </>
                    ) : null}
                  </>
                ) : version.inUse ? (
                  <span className="font-medium text-amber-600">In use · </span>
                ) : null}
                <span className="block sm:inline">
                  Updated {formatDateTime(version.updatedAt)}
                </span>
                {version.createdAt !== version.updatedAt ? (
                  <span className="hidden sm:inline">
                    {" "}
                    · Created {formatDateTime(version.createdAt)}
                  </span>
                ) : null}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
              {onRequestNewVersion ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={pending}
                  onClick={onRequestNewVersion}
                  className="col-span-2 sm:col-span-1"
                >
                  New version
                </Button>
              ) : null}
              {!isArchived ? (
                <Button
                  type="button"
                  variant={version.inUse ? "default" : "outline"}
                  size="sm"
                  disabled={pending}
                  onClick={async () => {
                    const ok = await onToggleInUse(version.id, !version.inUse);
                    if (ok === false) {
                      window.alert(
                        "Could not update. Run npm run db:push if the database schema is out of date."
                      );
                    }
                  }}
                >
                  <StarIcon
                    className={cn(
                      version.inUse && "fill-amber-300 text-amber-300"
                    )}
                  />
                  <span className="truncate">
                    {version.inUse ? "In use" : "Mark in use"}
                  </span>
                </Button>
              ) : null}
              {isArchived ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={pending}
                  onClick={() => handleSetArchived(false)}
                >
                  <ArchiveRestoreIcon />
                  Restore
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={pending}
                  onClick={() => handleSetArchived(true)}
                >
                  <ArchiveIcon />
                  Archive
                </Button>
              )}
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={pending}
                onClick={handleDelete}
              >
                <Trash2Icon />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="shrink-0 border-b border-foreground/10 px-4 py-3 sm:px-6">
        <div className="space-y-1.5">
          <label htmlFor="piece-title" className="text-xs font-medium">
            Title
          </label>
          <input
            ref={titleInputRef}
            id="piece-title"
            type="text"
            className={inputClass}
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setTitleDirty(true);
              onPieceTitleDirtyChange?.(true);
              markDirty();
            }}
            placeholder="e.g. Launch week post, welcome email"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="sticky top-0 z-10 flex flex-col gap-2 border-b border-foreground/10 bg-background/95 px-4 py-2 backdrop-blur-sm sm:px-6">
          {error || dirty || titleDirty ? (
            <div className="text-xs text-muted-foreground">
              {error ? (
                <p className="text-destructive" role="alert">
                  {error}
                </p>
              ) : (
                <p>Unsaved changes</p>
              )}
            </div>
          ) : null}
          <Button
            type="button"
            size="sm"
            disabled={pending || (!dirty && !titleDirty)}
            onClick={handleSave}
            className="w-full"
          >
            {pending ? "Saving…" : "Save"}
          </Button>
        </div>

        <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 sm:py-6">
        <div className="flex min-h-0 flex-1 flex-col space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="version-content" className="text-xs font-medium">
              Content
            </label>
            {canShowNotes && !notesOpen ? (
              <CopyWritingNotesReopenButton
                onClick={() => handleNotesOpenChange(true)}
              />
            ) : null}
          </div>
          {canShowNotes && notesOpen ? (
            <CopyWritingNotesPanel
              templateGuide={templateGuide}
              userNotes={userNotes}
              onUserNotesChange={(v) => setUserNotes(clampWritingNotes(v))}
              notesStatus={notesStatus}
              onClose={() => handleNotesOpenChange(false)}
            />
          ) : null}
          <RichTextEditor
            key={version.id}
            id="version-content"
            value={editorContentForVersion(version, typeName)}
            onChange={(html) => {
              if (activeVersionIdRef.current !== version.id) return;
              setContent(html);
            }}
            onDirty={markDirty}
            placeholder="Write your copy…"
            externalFieldRef={titleInputRef}
          />
        </div>
        </div>
      </div>
    </div>
  );
  }
);
