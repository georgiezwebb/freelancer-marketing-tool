"use client";

import * as React from "react";
import { FileTextIcon, PlusIcon } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { CopyPieceRecord, CopyTypeRecord } from "@/lib/dashboard-types";
import { formatDateTime } from "@/lib/format-datetime";
import { stripHtmlToText } from "@/lib/html-content";
import { isVersionGuideContent } from "@/lib/marketing-stack-templates";
import { activePieces, activeVersions } from "@/lib/version-filters";

function latestContentPreview(
  piece: CopyPieceRecord,
  typeName: string,
  max = 120
): string {
  const active = activeVersions(piece.versions);
  const latest = active[0] ?? piece.versions[piece.versions.length - 1];
  if (!latest) return "No content yet";
  const text = isVersionGuideContent(typeName, latest.content)
    ? ""
    : stripHtmlToText(latest.content);
  if (!text) return "No content yet";
  return text.length <= max ? text : `${text.slice(0, max)}…`;
}

type Props = {
  type: CopyTypeRecord;
  selectedPieceId: string | null;
  pending?: boolean;
  onSelectPiece: (pieceId: string) => void;
  onCreatePiece: () => void;
};

export function PieceCardsGrid({
  type,
  selectedPieceId,
  pending = false,
  onSelectPiece,
  onCreatePiece,
}: Props) {
  const pieces = activePieces(type.pieces);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="border-b border-foreground/10 px-4 py-4 sm:px-6">
        <p className="inline-block border-2 border-foreground bg-muted/30 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-foreground">
          {type.name}
        </p>
        <h2 className="mt-2 font-heading text-lg font-semibold tracking-tight">
          Choose copy to edit
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick a titled piece below or start a new one. Each piece can have
          multiple versions.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
        <ul
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          aria-label={`Copy for ${type.name}`}
        >
          {pieces.map((piece) => {
            const versionCount = piece.versions.length;
            const inUse = piece.versions.some((v) => v.inUse && !v.archivedAt);
            return (
              <li key={piece.id}>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => onSelectPiece(piece.id)}
                  className={cn(
                    "h-full w-full text-left",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                    pending && "pointer-events-none opacity-60"
                  )}
                >
                  <Card
                    size="sm"
                    className={cn(
                      "h-full min-h-[9.5rem] rounded-none border-2 py-0 ring-0",
                      selectedPieceId === piece.id
                        ? "border-foreground bg-background shadow-sm"
                        : "border-foreground/25 hover:border-foreground hover:bg-background/80"
                    )}
                  >
                    <CardHeader className="border-b border-foreground/10 pb-3">
                      <CardTitle className="flex items-start gap-2 text-sm">
                        <FileTextIcon className="mt-0.5 size-4 shrink-0 opacity-70" />
                        <span className="line-clamp-2 flex-1">
                          {piece.title}
                          {inUse ? (
                            <span className="ml-1.5 text-[10px] font-normal uppercase tracking-wide text-amber-600">
                              · In use
                            </span>
                          ) : null}
                        </span>
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {versionCount} version{versionCount === 1 ? "" : "s"} ·
                        Updated {formatDateTime(piece.updatedAt)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-3">
                      <p className="line-clamp-4 text-xs leading-relaxed text-muted-foreground">
                        {latestContentPreview(piece, type.name)}
                      </p>
                    </CardContent>
                  </Card>
                </button>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              disabled={pending}
              onClick={onCreatePiece}
              className={cn(
                "h-full min-h-[9.5rem] w-full",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                pending && "pointer-events-none opacity-60"
              )}
            >
              <Card
                size="sm"
                className="flex h-full min-h-[9.5rem] flex-col items-center justify-center rounded-none border-2 border-dashed border-foreground/40 bg-muted/20 py-0 ring-0 hover:border-foreground hover:bg-muted/35"
              >
                <CardContent className="flex flex-col items-center gap-2 py-6 text-center">
                  <span className="flex size-10 items-center justify-center border-2 border-foreground bg-background">
                    <PlusIcon className="size-5" />
                  </span>
                  <span className="text-sm font-medium">New copy</span>
                  <span className="text-xs text-muted-foreground">
                    Add a titled piece for this section
                  </span>
                </CardContent>
              </Card>
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
}
