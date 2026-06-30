"use client";

import * as React from "react";
import { ChevronDownIcon, ChevronRightIcon, CircleHelpIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { WRITING_NOTES_MAX_LENGTH } from "@/lib/copy-limits";
import { cn } from "@/lib/utils";

const notesInputClass =
  "flex min-h-24 w-full resize-y border-2 border-foreground bg-background px-2.5 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

type PanelProps = {
  templateGuide: string;
  userNotes: string;
  onUserNotesChange: (value: string) => void;
  notesStatus: "idle" | "saving" | "saved" | "error";
  onClose: () => void;
  className?: string;
};

export function CopyWritingNotesPanel({
  templateGuide,
  userNotes,
  onUserNotesChange,
  notesStatus,
  onClose,
  className,
}: PanelProps) {
  const hasGuide = templateGuide.trim().length > 0;
  const [guideMinimized, setGuideMinimized] = React.useState(false);
  const atLimit = userNotes.length >= WRITING_NOTES_MAX_LENGTH;

  React.useEffect(() => {
    setGuideMinimized(false);
  }, [templateGuide]);

  return (
    <div
      role="region"
      aria-label="Writing notes"
      className={cn(
        "relative border-2 border-foreground bg-muted/40 p-4 pr-10 shadow-sm",
        className
      )}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-2 right-2 flex size-7 items-center justify-center border-2 border-transparent hover:border-foreground/30 hover:bg-background/80"
        aria-label="Close writing notes"
      >
        <XIcon className="size-4" />
      </button>
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-foreground">
        Writing notes
      </p>

      <div className="space-y-4">
        {hasGuide ? (
          <section className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-medium text-muted-foreground">
                Guide <span className="font-normal">(read-only)</span>
              </h3>
              <button
                type="button"
                onClick={() => setGuideMinimized((v) => !v)}
                aria-expanded={!guideMinimized}
                className="flex items-center gap-1 border-2 border-transparent px-1.5 py-0.5 text-xs text-foreground hover:border-foreground/30 hover:bg-background/60"
              >
                {guideMinimized ? (
                  <>
                    <ChevronRightIcon className="size-3.5" />
                    Show guide
                  </>
                ) : (
                  <>
                    <ChevronDownIcon className="size-3.5" />
                    Hide guide
                  </>
                )}
              </button>
            </div>
            {!guideMinimized ? (
              <div
                className="max-h-40 overflow-y-auto whitespace-pre-wrap rounded-sm border border-foreground/20 bg-background/80 p-2.5 text-sm leading-relaxed text-foreground/90"
                aria-readonly="true"
              >
                {templateGuide}
              </div>
            ) : null}
          </section>
        ) : null}

        <section className="space-y-1.5">
          <h3 className="text-xs font-medium text-muted-foreground">Your notes</h3>
          <textarea
            className={notesInputClass}
            value={userNotes}
            maxLength={WRITING_NOTES_MAX_LENGTH}
            onChange={(e) =>
              onUserNotesChange(
                e.target.value.slice(0, WRITING_NOTES_MAX_LENGTH)
              )
            }
            placeholder="Add reminders, angles, or ideas for this section…"
            rows={4}
          />
          <p
            className={cn(
              "text-xs tabular-nums",
              atLimit ? "text-destructive" : "text-muted-foreground"
            )}
          >
            {userNotes.length}/{WRITING_NOTES_MAX_LENGTH}
          </p>
          {notesStatus === "saving" ? (
            <p className="text-xs text-muted-foreground">Saving notes…</p>
          ) : null}
          {notesStatus === "saved" ? (
            <p className="text-xs text-muted-foreground">Notes saved</p>
          ) : null}
          {notesStatus === "error" ? (
            <p className="text-xs text-destructive">Could not save notes</p>
          ) : null}
        </section>
      </div>
    </div>
  );
}

type ReopenProps = {
  onClick: () => void;
  className?: string;
};

export function CopyWritingNotesReopenButton({ onClick, className }: ReopenProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn("h-8 gap-1.5 text-xs", className)}
      onClick={onClick}
    >
      <CircleHelpIcon className="size-3.5" />
      Show writing notes
    </Button>
  );
}
