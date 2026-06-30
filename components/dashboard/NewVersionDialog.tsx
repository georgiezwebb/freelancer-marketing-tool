"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CopyVersionRecord } from "@/lib/dashboard-types";
import { versionLabel } from "@/lib/dashboard-types";
import { formatDateTime } from "@/lib/format-datetime";
import { activeVersions } from "@/lib/version-filters";

export type NewVersionSource =
  | { kind: "blank" }
  | { kind: "current"; versionId: string }
  | { kind: "previous"; versionId: string };

type Props = {
  open: boolean;
  pieceTitle: string;
  versions: CopyVersionRecord[];
  currentVersionId: string | null;
  pending?: boolean;
  onConfirm: (source: NewVersionSource) => void;
  onCancel: () => void;
};

export function NewVersionDialog({
  open,
  pieceTitle,
  versions,
  currentVersionId,
  pending = false,
  onConfirm,
  onCancel,
}: Props) {
  const active = React.useMemo(
    () => activeVersions(versions),
    [versions]
  );
  const [mode, setMode] = React.useState<"blank" | "current" | "previous">(
    currentVersionId ? "current" : "blank"
  );
  const [selectedPreviousId, setSelectedPreviousId] = React.useState<string>(
    () => active.find((v) => v.id !== currentVersionId)?.id ?? active[0]?.id ?? ""
  );

  React.useEffect(() => {
    if (!open) return;
    setMode(currentVersionId ? "current" : "blank");
    const others = active.filter((v) => v.id !== currentVersionId);
    setSelectedPreviousId(others[0]?.id ?? active[0]?.id ?? "");
  }, [open, currentVersionId, active]);

  if (!open) return null;

  function handleConfirm() {
    if (mode === "blank") {
      onConfirm({ kind: "blank" });
      return;
    }
    if (mode === "current" && currentVersionId) {
      onConfirm({ kind: "current", versionId: currentVersionId });
      return;
    }
    if (mode === "previous" && selectedPreviousId) {
      onConfirm({ kind: "previous", versionId: selectedPreviousId });
      return;
    }
    onConfirm({ kind: "blank" });
  }

  const previousOptions = active.filter((v) => v.id !== currentVersionId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-foreground/20"
        aria-label="Dismiss"
        disabled={pending}
        onClick={onCancel}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-version-dialog-title"
        className="relative z-10 w-full max-w-md border-2 border-foreground bg-background p-5 shadow-lg"
      >
        <h2
          id="new-version-dialog-title"
          className="font-heading text-base font-semibold tracking-tight"
        >
          New version
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          For <span className="font-medium text-foreground">{pieceTitle}</span>
        </p>

        <fieldset className="mt-4 space-y-2" disabled={pending}>
          <legend className="sr-only">Version source</legend>

          <label
            className={cn(
              "flex cursor-pointer items-start gap-3 border-2 p-3 transition-colors",
              mode === "blank"
                ? "border-foreground bg-muted/30"
                : "border-foreground/20 hover:border-foreground/40"
            )}
          >
            <input
              type="radio"
              name="version-source"
              className="mt-0.5"
              checked={mode === "blank"}
              onChange={() => setMode("blank")}
            />
            <span>
              <span className="block text-sm font-medium">Start blank</span>
              <span className="text-xs text-muted-foreground">
                Empty content for a fresh draft
              </span>
            </span>
          </label>

          {currentVersionId ? (
            <label
              className={cn(
                "flex cursor-pointer items-start gap-3 border-2 p-3 transition-colors",
                mode === "current"
                  ? "border-foreground bg-muted/30"
                  : "border-foreground/20 hover:border-foreground/40"
              )}
            >
              <input
                type="radio"
                name="version-source"
                className="mt-0.5"
                checked={mode === "current"}
                onChange={() => setMode("current")}
              />
              <span>
                <span className="block text-sm font-medium">
                  Copy current version
                </span>
                <span className="text-xs text-muted-foreground">
                  Duplicate what you&apos;re editing now
                </span>
              </span>
            </label>
          ) : null}

          {previousOptions.length > 0 ? (
            <label
              className={cn(
                "flex cursor-pointer items-start gap-3 border-2 p-3 transition-colors",
                mode === "previous"
                  ? "border-foreground bg-muted/30"
                  : "border-foreground/20 hover:border-foreground/40"
              )}
            >
              <input
                type="radio"
                name="version-source"
                className="mt-0.5"
                checked={mode === "previous"}
                onChange={() => setMode("previous")}
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">
                  Copy a previous version
                </span>
                {mode === "previous" ? (
                  <select
                    className="mt-2 w-full border-2 border-foreground bg-background px-2 py-1.5 text-xs"
                    value={selectedPreviousId}
                    onChange={(e) => setSelectedPreviousId(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {previousOptions.map((v) => (
                      <option key={v.id} value={v.id}>
                        {versionLabel(v)} · updated{" "}
                        {formatDateTime(v.updatedAt)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    Choose from earlier drafts
                  </span>
                )}
              </span>
            </label>
          ) : null}
        </fieldset>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            size="sm"
            disabled={pending}
            onClick={handleConfirm}
            className="sm:flex-1"
          >
            {pending ? "Creating…" : "Create version"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={onCancel}
            className="sm:flex-1"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
