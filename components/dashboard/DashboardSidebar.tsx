"use client";

import * as React from "react";
import { ArchiveIcon, ChevronDownIcon, ChevronRightIcon, FileTextIcon, FolderIcon, LayersIcon, PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { CopyTypeRecord } from "@/lib/dashboard-types";
import { versionLabel } from "@/lib/dashboard-types";
import {
  activePieces,
  activeVersions,
  archivedVersions,
} from "@/lib/version-filters";

import { VersionInUseStar } from "./VersionInUseStar";

const inputClass =
  "flex min-h-8 w-full border-2 border-foreground bg-background px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

type Props = {
  types: CopyTypeRecord[];
  selectedTypeId: string | null;
  selectedPieceId: string | null;
  selectedVersionId: string | null;
  onSelectType: (typeId: string) => void;
  onSelectPiece: (pieceId: string, typeId: string) => void;
  onSelectVersion: (versionId: string, pieceId: string, typeId: string) => void;
  onTypesChange: (types: CopyTypeRecord[]) => void;
  onCreatePiece: (typeId: string) => void;
  onRequestNewVersion: (pieceId: string, typeId: string) => void;
  onToggleInUse: (
    versionId: string,
    inUse: boolean
  ) => boolean | void | Promise<boolean | void>;
  createPending?: boolean;
  className?: string;
  onNavigate?: () => void;
};

export function DashboardSidebar({
  types,
  selectedTypeId,
  selectedPieceId,
  selectedVersionId,
  onSelectType,
  onSelectPiece,
  onSelectVersion,
  onTypesChange,
  onCreatePiece,
  onRequestNewVersion,
  onToggleInUse,
  createPending = false,
  className,
  onNavigate,
}: Props) {
  const [addingType, setAddingType] = React.useState(false);
  const [newTypeName, setNewTypeName] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [showArchivedByPiece, setShowArchivedByPiece] = React.useState<
    Record<string, boolean>
  >({});
  const [expandedTypes, setExpandedTypes] = React.useState<Set<string>>(() => {
    const first = selectedTypeId ?? types[0]?.id;
    return first ? new Set([first]) : new Set();
  });
  const [expandedPieces, setExpandedPieces] = React.useState<Set<string>>(() => {
    if (selectedPieceId) return new Set([selectedPieceId]);
    const firstType = types.find((t) => t.id === selectedTypeId) ?? types[0];
    const firstPiece = firstType?.pieces[0];
    return firstPiece ? new Set([firstPiece.id]) : new Set();
  });

  React.useEffect(() => {
    const validTypeIds = new Set(types.map((t) => t.id));
    setExpandedTypes((prev) => {
      const pruned = new Set([...prev].filter((id) => validTypeIds.has(id)));
      if (pruned.size > 0) return pruned;
      if (selectedTypeId && validTypeIds.has(selectedTypeId)) {
        return new Set([selectedTypeId]);
      }
      const first = types[0]?.id;
      return first ? new Set([first]) : new Set();
    });
  }, [types, selectedTypeId]);

  React.useEffect(() => {
    const validPieceIds = new Set(types.flatMap((t) => t.pieces.map((p) => p.id)));
    setExpandedPieces((prev) => {
      const pruned = new Set([...prev].filter((id) => validPieceIds.has(id)));
      if (selectedPieceId && validPieceIds.has(selectedPieceId)) {
        return new Set([...pruned, selectedPieceId]);
      }
      return pruned;
    });
  }, [types, selectedPieceId]);

  function expandType(typeId: string) {
    setExpandedTypes((prev) => new Set([...prev, typeId]));
  }

  function toggleTypeExpanded(typeId: string) {
    setExpandedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(typeId)) next.delete(typeId);
      else next.add(typeId);
      return next;
    });
  }

  function expandPiece(pieceId: string) {
    setExpandedPieces((prev) => new Set([...prev, pieceId]));
  }

  function togglePieceExpanded(pieceId: string) {
    setExpandedPieces((prev) => {
      const next = new Set(prev);
      if (next.has(pieceId)) next.delete(pieceId);
      else next.add(pieceId);
      return next;
    });
  }

  async function handleAddType(e: React.FormEvent) {
    e.preventDefault();
    const name = newTypeName.trim();
    if (!name) return;
    setPending(true);
    try {
      const res = await fetch("/api/copy-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("Failed to create type");
      const type = (await res.json()) as CopyTypeRecord;
      onTypesChange([...types, type]);
      setExpandedTypes(new Set([type.id]));
      onSelectType(type.id);
      setNewTypeName("");
      setAddingType(false);
      onNavigate?.();
    } finally {
      setPending(false);
    }
  }

  const busy = pending || createPending;

  return (
    <aside
      className={cn(
        "flex h-full w-80 shrink-0 flex-col border-r-2 border-foreground/10 bg-muted/15",
        className
      )}
    >
      <div className="border-b border-foreground/10 px-3 py-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Marketing stack
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-2" aria-label="Copy library">
        <ul className="space-y-2">
          {types.map((type) => {
            const typeExpanded = expandedTypes.has(type.id);
            const isActiveSection = selectedTypeId === type.id;
            const pieces = activePieces(type.pieces);

            return (
              <li
                key={type.id}
                className={cn(
                  "space-y-0.5 rounded-sm",
                  isActiveSection && "border-l-4 border-primary pl-0.5"
                )}
              >
                <div
                  className={cn(
                    "flex items-stretch overflow-hidden border-2 transition-[border-color,background-color,box-shadow]",
                    isActiveSection
                      ? "border-foreground bg-background shadow-sm"
                      : "border-transparent hover:border-foreground/30 hover:bg-background/60"
                  )}
                >
                  <button
                    type="button"
                    aria-label={typeExpanded ? "Collapse" : "Expand"}
                    aria-expanded={typeExpanded}
                    onClick={() => toggleTypeExpanded(type.id)}
                    className="flex size-8 shrink-0 items-center justify-center border-r border-foreground/10 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset"
                  >
                    {typeExpanded ? (
                      <ChevronDownIcon className="size-4 opacity-80" />
                    ) : (
                      <ChevronRightIcon className="size-4 opacity-80" />
                    )}
                  </button>
                  <button
                    type="button"
                    aria-current={isActiveSection ? "true" : undefined}
                    onClick={() => {
                      expandType(type.id);
                      onSelectType(type.id);
                      onNavigate?.();
                    }}
                    className={cn(
                      "flex min-w-0 flex-1 items-center gap-2 px-2 py-1.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset",
                      isActiveSection
                        ? "font-semibold text-foreground"
                        : "text-foreground/90"
                    )}
                  >
                    <FolderIcon
                      className={cn(
                        "size-4 shrink-0",
                        isActiveSection ? "text-primary" : "opacity-70"
                      )}
                    />
                    <span className="truncate">{type.name}</span>
                  </button>
                  <button
                    type="button"
                    aria-label={`Add copy to ${type.name}`}
                    disabled={busy}
                    onClick={() => onCreatePiece(type.id)}
                    className={cn(
                      "flex w-8 shrink-0 items-center justify-center border-l border-foreground/10 text-muted-foreground/55 transition-[color,opacity,background-color] hover:bg-muted/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset disabled:pointer-events-none disabled:opacity-40",
                      isActiveSection && "text-primary/70 hover:text-primary"
                    )}
                  >
                    <PlusIcon className="size-3.5 stroke-[2.25]" aria-hidden />
                  </button>
                </div>

                {typeExpanded ? (
                  <ul
                    className={cn(
                      "ml-3 space-y-0.5 border-l-2 pl-2",
                      isActiveSection
                        ? "border-primary/60"
                        : "border-foreground/15"
                    )}
                    aria-label={`Copy for ${type.name}`}
                  >
                    {pieces.length === 0 ? (
                      <li className="px-2 py-1.5 text-xs text-muted-foreground">
                        No copy yet
                      </li>
                    ) : (
                      pieces.map((piece) => {
                        const pieceExpanded = expandedPieces.has(piece.id);
                        const isActivePiece = selectedPieceId === piece.id;
                        const active = activeVersions(piece.versions);
                        const archived = archivedVersions(piece.versions);
                        const showArchived =
                          showArchivedByPiece[piece.id] ?? false;

                        return (
                          <li key={piece.id} className="space-y-0.5">
                            <div
                              className={cn(
                                "flex items-stretch overflow-hidden border-2 border-transparent transition-colors",
                                isActivePiece && !selectedVersionId
                                  ? "border-foreground/60 bg-background/80"
                                  : isActivePiece
                                    ? "border-foreground/30 bg-background/50"
                                    : "hover:border-foreground/20 hover:bg-background/40"
                              )}
                            >
                              <button
                                type="button"
                                aria-label={
                                  pieceExpanded ? "Collapse" : "Expand"
                                }
                                aria-expanded={pieceExpanded}
                                onClick={() => togglePieceExpanded(piece.id)}
                                className="flex size-7 shrink-0 items-center justify-center border-r border-foreground/10 hover:bg-muted/30"
                              >
                                {pieceExpanded ? (
                                  <ChevronDownIcon className="size-3.5 opacity-70" />
                                ) : (
                                  <ChevronRightIcon className="size-3.5 opacity-70" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  expandType(type.id);
                                  expandPiece(piece.id);
                                  onSelectPiece(piece.id, type.id);
                                  onNavigate?.();
                                }}
                                className="flex min-w-0 flex-1 items-center gap-1.5 px-2 py-1.5 text-left text-xs"
                              >
                                <LayersIcon className="size-3.5 shrink-0 opacity-70" />
                                <span className="truncate font-medium">
                                  {piece.title}
                                </span>
                              </button>
                              <button
                                type="button"
                                aria-label={`Add version to ${piece.title}`}
                                disabled={busy}
                                onClick={() =>
                                  onRequestNewVersion(piece.id, type.id)
                                }
                                className="flex w-7 shrink-0 items-center justify-center border-l border-foreground/10 text-muted-foreground/55 hover:bg-muted/30 hover:text-foreground disabled:opacity-40"
                              >
                                <PlusIcon className="size-3 stroke-[2.25]" />
                              </button>
                            </div>

                            {pieceExpanded ? (
                              <ul
                                className="ml-3 space-y-0.5 border-l border-foreground/10 pl-2"
                                aria-label={`Versions for ${piece.title}`}
                              >
                                {active.length === 0 ? (
                                  <li className="px-2 py-1 text-[11px] text-muted-foreground">
                                    No versions yet
                                  </li>
                                ) : (
                                  active.map((version) => (
                                    <li key={version.id}>
                                      <div
                                        className={cn(
                                          "flex w-full items-center gap-1 border-2 border-transparent pr-1 transition-colors",
                                          selectedVersionId === version.id
                                            ? "border-foreground bg-background font-medium"
                                            : "hover:border-foreground/30 hover:bg-background/60"
                                        )}
                                      >
                                        <button
                                          type="button"
                                          onClick={() => {
                                            expandType(type.id);
                                            expandPiece(piece.id);
                                            onSelectVersion(
                                              version.id,
                                              piece.id,
                                              type.id
                                            );
                                            onNavigate?.();
                                          }}
                                          className="flex min-w-0 flex-1 items-center gap-1.5 px-2 py-1 text-left text-[11px]"
                                        >
                                          <FileTextIcon className="size-3 shrink-0 opacity-70" />
                                          <span className="truncate">
                                            {versionLabel(version)}
                                          </span>
                                        </button>
                                        <VersionInUseStar
                                          size="sm"
                                          inUse={version.inUse}
                                          disabled={busy}
                                          onToggle={(next) =>
                                            onToggleInUse(version.id, next)
                                          }
                                        />
                                      </div>
                                    </li>
                                  ))
                                )}
                                {archived.length > 0 ? (
                                  <li className="pt-0.5">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setShowArchivedByPiece((prev) => ({
                                          ...prev,
                                          [piece.id]: !showArchived,
                                        }))
                                      }
                                      className="flex w-full items-center gap-1 px-2 py-0.5 text-left text-[10px] text-muted-foreground hover:text-foreground"
                                    >
                                      <ArchiveIcon className="size-2.5" />
                                      {showArchived ? "Hide" : "Show"} archived (
                                      {archived.length})
                                    </button>
                                    {showArchived
                                      ? archived.map((version) => (
                                          <button
                                            key={version.id}
                                            type="button"
                                            onClick={() => {
                                              expandType(type.id);
                                              expandPiece(piece.id);
                                              onSelectVersion(
                                                version.id,
                                                piece.id,
                                                type.id
                                              );
                                              onNavigate?.();
                                            }}
                                            className={cn(
                                              "mt-0.5 flex w-full items-center gap-1.5 border-2 border-transparent px-2 py-1 text-left text-[10px] text-muted-foreground transition-colors",
                                              selectedVersionId === version.id
                                                ? "border-foreground/60 bg-background font-medium text-foreground"
                                                : "hover:border-foreground/20 hover:bg-background/50"
                                            )}
                                          >
                                            <FileTextIcon className="size-2.5 shrink-0 opacity-50" />
                                            <span className="truncate">
                                              {versionLabel(version)}
                                            </span>
                                          </button>
                                        ))
                                      : null}
                                  </li>
                                ) : null}
                              </ul>
                            ) : null}
                          </li>
                        );
                      })
                    )}
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ul>

        {addingType ? (
          <form onSubmit={handleAddType} className="mt-3 space-y-2 px-1">
            <input
              className={inputClass}
              value={newTypeName}
              onChange={(e) => setNewTypeName(e.target.value)}
              placeholder="Type name"
              autoFocus
              disabled={pending}
            />
            <div className="flex gap-1">
              <Button type="submit" size="xs" disabled={pending}>
                Add
              </Button>
              <Button
                type="button"
                size="xs"
                variant="outline"
                onClick={() => {
                  setAddingType(false);
                  setNewTypeName("");
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-3 w-full justify-start"
            onClick={() => setAddingType(true)}
          >
            <PlusIcon />
            New type
          </Button>
        )}
      </nav>
    </aside>
  );
}
