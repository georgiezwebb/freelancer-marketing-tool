"use client";

import * as React from "react";
import { ArchiveIcon, FileTextIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { CopyTypeRecord } from "@/lib/dashboard-types";
import { versionLabel } from "@/lib/dashboard-types";
import {
  ARCHIVE_RETENTION_NOTICE,
  archiveDeletionDateIso,
} from "@/lib/archive-retention";
import { formatDateTime } from "@/lib/format-datetime";
import { stripHtmlToText } from "@/lib/html-content";
import { allArchivedVersions } from "@/lib/version-filters";

function contentPreview(content: string, max = 160): string {
  const text = stripHtmlToText(content);
  if (!text) return "No content yet";
  return text.length <= max ? text : `${text.slice(0, max)}…`;
}

const checkboxClassName =
  "size-[1.125rem] shrink-0 cursor-pointer rounded-none border-2 border-foreground accent-primary disabled:cursor-not-allowed disabled:opacity-50 sm:size-4";

type Props = {
  types: CopyTypeRecord[];
  selectedVersionId: string | null;
  onSelectVersion: (versionId: string, typeId: string) => void;
  onDeleteVersions: (versionIds: string[]) => void;
};

export function ArchivedVersionsPanel({
  types,
  selectedVersionId,
  onSelectVersion,
  onDeleteVersions,
}: Props) {
  const archived = allArchivedVersions(types);
  const archivedIds = React.useMemo(
    () => archived.map(({ version }) => version.id),
    [archived]
  );

  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(
    () => new Set()
  );
  const [deleting, setDeleting] = React.useState(false);
  const selectAllRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setSelectedIds((prev) => {
      const valid = new Set(archivedIds);
      const next = new Set([...prev].filter((id) => valid.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [archivedIds]);

  const allSelected =
    archivedIds.length > 0 &&
    archivedIds.every((id) => selectedIds.has(id));
  const someSelected = archivedIds.some((id) => selectedIds.has(id));

  React.useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected && !allSelected;
    }
  }, [someSelected, allSelected]);

  function toggleOne(versionId: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(versionId);
      else next.delete(versionId);
      return next;
    });
  }

  function toggleAll(checked: boolean) {
    setSelectedIds(checked ? new Set(archivedIds) : new Set());
  }

  async function handleDeleteSelected() {
    const ids = [...selectedIds];
    if (ids.length === 0) return;

    const msg =
      ids.length === 1
        ? "Permanently delete this archived version? This cannot be undone."
        : `Permanently delete ${ids.length} archived versions? This cannot be undone.`;
    if (!window.confirm(msg)) return;

    setDeleting(true);
    try {
      const results = await Promise.all(
        ids.map(async (id) => {
          const res = await fetch(`/api/copy-versions/${id}`, {
            method: "DELETE",
          });
          return { id, ok: res.ok };
        })
      );
      const succeeded = results.filter((r) => r.ok).map((r) => r.id);
      if (succeeded.length > 0) {
        onDeleteVersions(succeeded);
        setSelectedIds((prev) => {
          const next = new Set(prev);
          for (const id of succeeded) next.delete(id);
          return next;
        });
      }
      if (succeeded.length < ids.length) {
        window.alert(
          succeeded.length === 0
            ? "Could not delete the selected versions. Please try again."
            : `Deleted ${succeeded.length} of ${ids.length} versions. Some could not be removed.`
        );
      }
    } finally {
      setDeleting(false);
    }
  }

  if (archived.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-8 text-center sm:px-8">
        <ArchiveIcon className="size-10 text-muted-foreground/50" />
        <div className="max-w-md space-y-1">
          <p className="text-sm font-medium">No archived copy yet</p>
          <p className="text-sm text-muted-foreground">
            When you archive a version from the editor, it will appear here for
            up to 1 year. {ARCHIVE_RETENTION_NOTICE}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-foreground/10 px-4 py-4 sm:px-6 sm:py-5">
        <h2 className="font-heading text-lg font-semibold tracking-tight">
          Archived copy
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          {archived.length} version{archived.length === 1 ? "" : "s"}, newest
          archived first. {ARCHIVE_RETENTION_NOTICE}
        </p>
      </div>

      <div className="flex shrink-0 flex-col gap-3 border-b border-foreground/10 bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <label className="flex min-h-10 cursor-pointer items-center gap-2.5 text-sm font-medium">
          <input
            ref={selectAllRef}
            type="checkbox"
            className={checkboxClassName}
            checked={allSelected}
            disabled={deleting}
            onChange={(e) => toggleAll(e.target.checked)}
            aria-label="Select all archived versions"
          />
          Select all
        </label>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={selectedIds.size === 0 || deleting}
          onClick={() => void handleDeleteSelected()}
          className="w-full sm:w-auto"
        >
          <Trash2Icon />
          {deleting
            ? "Deleting…"
            : selectedIds.size > 0
              ? (
                <>
                  <span className="hidden sm:inline">
                    Delete permanently ({selectedIds.size})
                  </span>
                  <span className="sm:hidden">
                    Delete ({selectedIds.size})
                  </span>
                </>
              )
              : "Delete permanently"}
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
        <ul className="mx-auto flex max-w-3xl flex-col gap-4">
          {archived.map(({ version, pieceTitle, typeId, typeName }) => {
            const label = versionLabel(version);
            const archivedDate = version.archivedAt ?? version.updatedAt;
            const openSelected = selectedVersionId === version.id;
            const checked = selectedIds.has(version.id);

            return (
              <li key={version.id}>
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    className={cn(checkboxClassName, "mt-5")}
                    checked={checked}
                    disabled={deleting}
                    onChange={(e) => toggleOne(version.id, e.target.checked)}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Select ${pieceTitle} ${label}`}
                  />
                  <button
                    type="button"
                    onClick={() => onSelectVersion(version.id, typeId)}
                    disabled={deleting}
                    className={cn(
                      "min-w-0 flex-1 text-left transition-colors",
                      openSelected &&
                        "ring-2 ring-ring ring-offset-2 ring-offset-background"
                    )}
                  >
                    <Card
                      className={cn(
                        "gap-3 transition-colors hover:bg-accent/20",
                        openSelected && "border-primary/40 bg-accent/15"
                      )}
                    >
                      <CardHeader className="gap-1.5 pb-0">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                          <div className="min-w-0 flex-1">
                            <CardTitle className="flex items-center gap-2 text-base">
                              <FileTextIcon className="size-4 shrink-0 text-muted-foreground" />
                              <span className="line-clamp-2 sm:truncate">
                                {pieceTitle}
                              </span>
                            </CardTitle>
                            <CardDescription className="mt-1.5">
                              {typeName} · {label}
                            </CardDescription>
                          </div>
                          <span className="shrink-0 text-xs text-muted-foreground sm:text-right">
                            <span className="block">
                              Archived {formatDateTime(archivedDate)}
                            </span>
                            {version.archivedAt ? (
                              <span className="mt-0.5 block">
                                Deletes{" "}
                                {formatDateTime(
                                  archiveDeletionDateIso(version.archivedAt)
                                )}
                              </span>
                            ) : null}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 text-sm text-muted-foreground">
                        {contentPreview(version.content)}
                      </CardContent>
                    </Card>
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
