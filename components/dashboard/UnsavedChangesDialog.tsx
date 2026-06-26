"use client";

import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  saving?: boolean;
  onSaveAndContinue: () => void;
  onStay: () => void;
  onDiscard: () => void;
};

export function UnsavedChangesDialog({
  open,
  saving = false,
  onSaveAndContinue,
  onStay,
  onDiscard,
}: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-foreground/20"
        aria-label="Dismiss"
        onClick={onStay}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="unsaved-dialog-title"
        className="relative z-10 w-full max-w-sm border-2 border-foreground bg-background p-5 shadow-lg"
      >
        <h2
          id="unsaved-dialog-title"
          className="font-heading text-base font-semibold tracking-tight"
        >
          Unsaved changes
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Save before leaving, or your edits will be lost.
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button
            type="button"
            size="sm"
            disabled={saving}
            onClick={onSaveAndContinue}
            className="sm:flex-1"
          >
            {saving ? "Saving…" : "Save & continue"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={saving}
            onClick={onStay}
            className="sm:flex-1"
          >
            Stay
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={saving}
            onClick={onDiscard}
            className="sm:flex-1"
          >
            Leave without saving
          </Button>
        </div>
      </div>
    </div>
  );
}
