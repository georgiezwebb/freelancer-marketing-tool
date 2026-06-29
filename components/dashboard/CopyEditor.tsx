"use client";

import * as React from "react";
import { ArchiveIcon, ArchiveRestoreIcon, StarIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  getGuideForTypeName,
  isVersionGuideContent,
} from "@/lib/marketing-stack-templates";

import type { CopyVersionRecord } from "@/lib/dashboard-types";
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
  typeId: string | null;
  typeName: string | null;
  writingNotes: string;
  showNotesInitially?: boolean;
  onNotesDismiss?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
  onWritingNotesSaved: (typeId: string, writingNotes: string) => void;
  onSaved: (version: CopyVersionRecord) => void;
  onDeleted: (versionId: string) => void;
  onArchived: (version: CopyVersionRecord) => void;
  onToggleInUse: (
    versionId: string,
    inUse: boolean
  ) => boolean | void | Promise<boolean | void>;
};

export const CopyEditor = React.forwardRef<CopyEditorHandle, Props>(
  function CopyEditor(
    {
      version,
      typeId,
      typeName,
      writingNotes,
      showNotesInitially = false,
      onNotesDismiss,
      onDirtyChange,
      onWritingNotesSaved,
      onSaved,
      onDeleted,
      onArchived,
      onToggleInUse,
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
  const notesSaveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedNotes = React.useRef("");
  const activeVersionIdRef = React.useRef<string | null>(version?.id ?? null);
  activeVersionIdRef.current = version?.id ?? null;

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
    if (!version) {
      setTitle("");
      setContent("");
      setUserNotes("");
      setNotesOpen(false);
      markClean();
      setError(null);
      setNotesStatus("idle");
      return;
    }
    setTitle(version.title ?? "");
    setContent(editorContentForVersion(version, typeName));
    setNotesOpen(Boolean(showNotesInitially));
    markClean();
    setError(null);
    setNotesStatus("idle");
  }, [version?.id, typeName, showNotesInitially, markClean]);

  React.useEffect(() => {
    if (!version) return;
    const notes = clampWritingNotes(writingNotes);
    setUserNotes(notes);
    lastSavedNotes.current = notes;
  }, [version?.id, writingNotes]);

  const saveVersion = React.useCallback(async (): Promise<boolean> => {
    const versionId = version?.id;
    if (!versionId) return true;

    const payload = {
      title: title.trim() || null,
      content,
    };

    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/copy-versions/${versionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string };
        throw new Error(j?.error ?? "Save failed");
      }
      const saved = (await res.json()) as CopyVersionRecord;
      if (activeVersionIdRef.current !== versionId) return true;
      onSaved(saved);
      markClean();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
      return false;
    } finally {
      setPending(false);
    }
  }, [version?.id, title, content, onSaved, markClean]);

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
            writingNotes: clampWritingNotes(userNotes),
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

  if (!version) {
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
            : "Expand a type on the left, then select or add a version to edit."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-foreground/10 px-6 py-4">
        <div>
          {typeName ? (
            <p className="inline-block border-2 border-foreground bg-muted/30 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-foreground">
              {typeName}
            </p>
          ) : null}
          <p className="text-xs text-muted-foreground">
            {isArchived ? (
              <>
                <span className="font-medium text-foreground">Archived · </span>
                {version.archivedAt ? (
                  <>
                    Deletes{" "}
                    {formatDateTime(
                      archiveDeletionDateIso(version.archivedAt)
                    )}
                    {" · "}
                  </>
                ) : null}
              </>
            ) : version.inUse ? (
              <span className="font-medium text-amber-600">In use · </span>
            ) : null}
            Updated {formatDateTime(version.updatedAt)}
            {version.createdAt !== version.updatedAt && (
              <> · Created {formatDateTime(version.createdAt)}</>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
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
              {version.inUse ? "In use" : "Mark in use"}
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
          <Button
            type="button"
            size="sm"
            disabled={pending || !dirty}
            onClick={handleSave}
          >
            {pending ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-6">
        <div className="space-y-1.5">
          <label htmlFor="version-title" className="text-xs font-medium">
            Title
          </label>
          <input
            id="version-title"
            className={inputClass}
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              markDirty();
            }}
            placeholder="e.g. Short post, v2, launch week"
          />
        </div>
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
            className="flex-1"
          />
        </div>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        {dirty ? (
          <p className="text-xs text-muted-foreground">Unsaved changes</p>
        ) : null}
      </div>
    </div>
  );
  }
);
