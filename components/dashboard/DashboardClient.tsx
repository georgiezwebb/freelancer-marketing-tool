"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ArchiveIcon, PanelLeftIcon } from "lucide-react";
import { UserButton } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type {
  CopyPieceRecord,
  CopyTypeRecord,
  CopyVersionRecord,
} from "@/lib/dashboard-types";
import {
  findPiece,
  findVersionContext,
  initialSelection,
} from "@/lib/copy-tree";
import { allArchivedVersions } from "@/lib/version-filters";
import { ARCHIVE_RETENTION_NOTICE } from "@/lib/archive-retention";

import { ArchivedVersionsPanel } from "./ArchivedVersionsPanel";
import { CopyEditor, type CopyEditorHandle } from "./CopyEditor";
import { DashboardSidebar } from "./DashboardSidebar";
import {
  NewVersionDialog,
  type NewVersionSource,
} from "./NewVersionDialog";
import { PieceCardsGrid } from "./PieceCardsGrid";
import { UnsavedChangesDialog } from "./UnsavedChangesDialog";
import { VersionCardsGrid } from "./VersionCardsGrid";

type Props = {
  initialTypes: CopyTypeRecord[];
};

function mergePieceIntoTypes(piece: CopyPieceRecord, types: CopyTypeRecord[]) {
  return types.map((t) =>
    t.id === piece.typeId
      ? {
          ...t,
          pieces: t.pieces.some((p) => p.id === piece.id)
            ? t.pieces
                .map((p) => (p.id === piece.id ? piece : p))
                .sort((a, b) => a.sortOrder - b.sortOrder)
            : [...t.pieces, piece].sort((a, b) => a.sortOrder - b.sortOrder),
        }
      : t
  );
}

function mergeVersionIntoTypes(
  version: CopyVersionRecord,
  types: CopyTypeRecord[]
) {
  return types.map((t) => ({
    ...t,
    pieces: t.pieces.map((p) =>
      p.id === version.pieceId
        ? {
            ...p,
            versions: p.versions.some((v) => v.id === version.id)
              ? p.versions.map((v) => (v.id === version.id ? version : v))
              : [...p.versions, version].sort(
                  (a, b) => a.versionNumber - b.versionNumber
                ),
            updatedAt: version.updatedAt,
          }
        : p
    ),
  }));
}

export function DashboardClient({ initialTypes }: Props) {
  const router = useRouter();
  const editorRef = React.useRef<CopyEditorHandle>(null);
  const pendingNavRef = React.useRef<(() => void) | null>(null);

  const initial = initialSelection(initialTypes);

  const [types, setTypes] = React.useState(initialTypes);
  const [selectedTypeId, setSelectedTypeId] = React.useState<string | null>(
    initial.typeId
  );
  const [selectedPieceId, setSelectedPieceId] = React.useState<string | null>(
    initial.pieceId
  );
  const [selectedVersionId, setSelectedVersionId] = React.useState<
    string | null
  >(initial.versionId);
  const [openNotesForVersionId, setOpenNotesForVersionId] = React.useState<
    string | null
  >(null);
  const [versionDirty, setVersionDirty] = React.useState(false);
  const [pieceTitleDirty, setPieceTitleDirty] = React.useState(false);
  const [unsavedDialogOpen, setUnsavedDialogOpen] = React.useState(false);
  const [unsavedSaving, setUnsavedSaving] = React.useState(false);
  const [createPending, setCreatePending] = React.useState(false);
  const [newVersionDialog, setNewVersionDialog] = React.useState<{
    pieceId: string;
    typeId: string;
  } | null>(null);
  const [viewMode, setViewMode] = React.useState<"library" | "archived">(
    "library"
  );
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const selectedType = types.find((t) => t.id === selectedTypeId) ?? null;
  const selectedPieceCtx = findPiece(types, selectedPieceId);
  const selectedPiece = selectedPieceCtx?.piece ?? null;
  const versionCtx = findVersionContext(types, selectedVersionId);
  const selectedVersion = versionCtx?.version ?? null;
  const archivedCount = allArchivedVersions(types).length;

  const versionDirtyRef = React.useRef(versionDirty);
  const pieceTitleDirtyRef = React.useRef(pieceTitleDirty);
  const selectedVersionIdRef = React.useRef(selectedVersionId);
  versionDirtyRef.current = versionDirty;
  pieceTitleDirtyRef.current = pieceTitleDirty;
  selectedVersionIdRef.current = selectedVersionId;

  const needsSavePrompt =
    (versionDirty || pieceTitleDirty) && selectedVersionId !== null;

  React.useEffect(() => {
    if (!needsSavePrompt) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [needsSavePrompt]);

  const guardNavigation = React.useCallback((action: () => void) => {
    if (
      (!versionDirtyRef.current && !pieceTitleDirtyRef.current) ||
      !selectedVersionIdRef.current
    ) {
      action();
      return;
    }
    pendingNavRef.current = action;
    setUnsavedDialogOpen(true);
  }, []);

  function completePendingNavigation() {
    const action = pendingNavRef.current;
    pendingNavRef.current = null;
    setUnsavedDialogOpen(false);
    action?.();
  }

  function handleStay() {
    pendingNavRef.current = null;
    setUnsavedDialogOpen(false);
  }

  async function handleSaveAndContinue() {
    setUnsavedSaving(true);
    const ok = await editorRef.current?.save();
    setUnsavedSaving(false);
    if (ok) {
      versionDirtyRef.current = false;
      pieceTitleDirtyRef.current = false;
      setVersionDirty(false);
      setPieceTitleDirty(false);
      completePendingNavigation();
    }
  }

  function handleDiscardAndContinue() {
    versionDirtyRef.current = false;
    pieceTitleDirtyRef.current = false;
    setVersionDirty(false);
    setPieceTitleDirty(false);
    completePendingNavigation();
  }

  function handleSelectType(typeId: string) {
    if (
      typeId === selectedTypeId &&
      !selectedPieceId &&
      !selectedVersionId
    ) {
      return;
    }
    guardNavigation(() => {
      setViewMode("library");
      setSelectedTypeId(typeId);
      setSelectedPieceId(null);
      setSelectedVersionId(null);
      setOpenNotesForVersionId(null);
    });
  }

  function handleSelectPiece(pieceId: string, typeId: string) {
    if (
      viewMode === "library" &&
      pieceId === selectedPieceId &&
      typeId === selectedTypeId &&
      !selectedVersionId
    ) {
      return;
    }
    guardNavigation(() => {
      setViewMode("library");
      setSelectedTypeId(typeId);
      setSelectedPieceId(pieceId);
      setSelectedVersionId(null);
      setOpenNotesForVersionId(null);
    });
  }

  function handleSelectVersion(
    versionId: string,
    pieceId: string,
    typeId: string
  ) {
    if (
      viewMode === "library" &&
      versionId === selectedVersionId &&
      pieceId === selectedPieceId &&
      typeId === selectedTypeId
    ) {
      return;
    }
    guardNavigation(() => {
      void (async () => {
        try {
          const res = await fetch(`/api/copy-versions/${versionId}`);
          if (res.ok) {
            const fresh = (await res.json()) as CopyVersionRecord;
            setTypes((prev) => mergeVersionIntoTypes(fresh, prev));
          }
        } catch {
          // Fall back to cached client state if refresh fails.
        }
        setViewMode("library");
        setSelectedTypeId(typeId);
        setSelectedPieceId(pieceId);
        setSelectedVersionId(versionId);
        setOpenNotesForVersionId(null);
      })();
    });
  }

  function handleToggleArchivedView() {
    guardNavigation(() => {
      setViewMode((current) => (current === "archived" ? "library" : "archived"));
    });
  }

  async function handleCreatePiece(typeId: string) {
    guardNavigation(() => {
      void (async () => {
        setCreatePending(true);
        try {
          const res = await fetch(`/api/copy-types/${typeId}/pieces`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: "Untitled" }),
          });
          if (!res.ok) throw new Error("Failed to create copy");
          const piece = (await res.json()) as CopyPieceRecord;
          setTypes((prev) => mergePieceIntoTypes(piece, prev));
          setSelectedTypeId(typeId);
          setSelectedPieceId(piece.id);
          const firstVersion = piece.versions[0];
          setSelectedVersionId(firstVersion?.id ?? null);
          setOpenNotesForVersionId(firstVersion?.id ?? null);
          setVersionDirty(false);
          setPieceTitleDirty(false);
          setSidebarOpen(false);
        } finally {
          setCreatePending(false);
        }
      })();
    });
  }

  function handleRequestNewVersion(pieceId: string, typeId: string) {
    guardNavigation(() => {
      setNewVersionDialog({ pieceId, typeId });
    });
  }

  async function handleConfirmNewVersion(source: NewVersionSource) {
    if (!newVersionDialog) return;
    const { pieceId } = newVersionDialog;

    setCreatePending(true);
    try {
      let sourceVersionId: string | undefined;
      if (source.kind === "current" || source.kind === "previous") {
        sourceVersionId = source.versionId;
      }

      const res = await fetch(`/api/copy-pieces/${pieceId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          sourceVersionId ? { sourceVersionId } : {}
        ),
      });
      if (!res.ok) throw new Error("Failed to create version");
      const version = (await res.json()) as CopyVersionRecord;

      setTypes((prev) => mergeVersionIntoTypes(version, prev));
      setSelectedTypeId(newVersionDialog.typeId);
      setSelectedPieceId(pieceId);
      setSelectedVersionId(version.id);
      setOpenNotesForVersionId(version.id);
      setVersionDirty(false);
      setNewVersionDialog(null);
      setSidebarOpen(false);
    } finally {
      setCreatePending(false);
    }
  }

  function handleWritingNotesSaved(typeId: string, notes: string) {
    setTypes((prev) =>
      prev.map((t) => (t.id === typeId ? { ...t, writingNotes: notes } : t))
    );
  }

  function handleVersionSaved(version: CopyVersionRecord) {
    setTypes((prev) => mergeVersionIntoTypes(version, prev));
  }

  function handlePieceSaved(piece: CopyPieceRecord) {
    setTypes((prev) => mergePieceIntoTypes(piece, prev));
    setPieceTitleDirty(false);
  }

  function handleVersionArchived(version: CopyVersionRecord) {
    setTypes((prev) => mergeVersionIntoTypes(version, prev));
    if (version.archivedAt) {
      setSelectedVersionId((current) =>
        current === version.id ? null : current
      );
    }
    setVersionDirty(false);
  }

  async function handleToggleInUse(
    versionId: string,
    inUse: boolean
  ): Promise<boolean> {
    try {
      const res = await fetch(`/api/copy-versions/${versionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inUse }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        console.error(body?.error ?? "Could not update in-use status");
        return false;
      }
      const version = (await res.json()) as CopyVersionRecord;
      setTypes((prev) =>
        prev.map((t) => ({
          ...t,
          pieces: t.pieces.map((p) =>
            p.id === version.pieceId
              ? {
                  ...p,
                  versions: p.versions.map((v) => {
                    if (v.id === version.id) return version;
                    if (version.inUse) return { ...v, inUse: false };
                    return v;
                  }),
                }
              : p
          ),
        }))
      );
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  function handleVersionsDeleted(versionIds: string[]) {
    if (versionIds.length === 0) return;
    const idSet = new Set(versionIds);
    setTypes((prev) => {
      const next = prev.map((t) => ({
        ...t,
        pieces: t.pieces.map((p) => ({
          ...p,
          versions: p.versions.filter((v) => !idSet.has(v.id)),
        })),
      }));
      setSelectedVersionId((current) =>
        current && idSet.has(current) ? null : current
      );
      return next;
    });
    setVersionDirty(false);
  }

  function handleVersionDeleted(versionId: string) {
    handleVersionsDeleted([versionId]);
  }

  function handleBackToVersions() {
    guardNavigation(() => {
      setSelectedVersionId(null);
      setOpenNotesForVersionId(null);
    });
  }

  function handleBackToPieces() {
    guardNavigation(() => {
      setSelectedPieceId(null);
      setSelectedVersionId(null);
      setOpenNotesForVersionId(null);
    });
  }

  function handleHomeClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (!needsSavePrompt) return;
    e.preventDefault();
    guardNavigation(() => router.push("/"));
  }

  const newVersionPiece =
    newVersionDialog &&
    findPiece(types, newVersionDialog.pieceId)?.piece;

  const sidebarProps = {
    types,
    selectedTypeId,
    selectedPieceId,
    selectedVersionId,
    onSelectType: handleSelectType,
    onSelectPiece: handleSelectPiece,
    onSelectVersion: handleSelectVersion,
    onTypesChange: setTypes,
    onCreatePiece: handleCreatePiece,
    onRequestNewVersion: handleRequestNewVersion,
    onToggleInUse: handleToggleInUse,
    createPending,
  };

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden">
      <header className="z-20 shrink-0 border-b-2 border-foreground/10 bg-background/90 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-2 px-3 py-2.5 sm:gap-4 sm:px-4 sm:py-3">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="shrink-0 md:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sections menu"
            >
              <PanelLeftIcon />
            </Button>
            <Link
              href="/"
              onClick={handleHomeClick}
              className="shrink-0 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              ← Home
            </Link>
            <Separator
              orientation="vertical"
              className="hidden h-6 sm:block"
            />
            <h1 className="truncate font-heading text-sm font-semibold tracking-tight sm:text-base md:text-lg">
              Copy library
            </h1>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <Button
              type="button"
              variant={viewMode === "archived" ? "default" : "outline"}
              size="sm"
              onClick={handleToggleArchivedView}
              aria-pressed={viewMode === "archived"}
              title={ARCHIVE_RETENTION_NOTICE}
              className="px-2 sm:px-2.5"
            >
              <ArchiveIcon />
              <span className="hidden min-[380px]:inline">Archived</span>
              {archivedCount > 0 ? (
                <>
                  <span className="min-[380px]:hidden">{archivedCount}</span>
                  <span className="hidden min-[380px]:inline">
                    {" "}
                    ({archivedCount})
                  </span>
                </>
              ) : null}
            </Button>
            <UserButton
              appearance={{
                elements: { avatarBox: "size-8 rounded-none" },
              }}
            />
          </div>
        </div>
      </header>

      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent
          side="left"
          className="w-[min(100vw,20rem)] gap-0 p-0"
        >
          <SheetHeader className="border-b border-foreground/10 px-4 py-3 text-left">
            <SheetTitle>Sections</SheetTitle>
          </SheetHeader>
          <DashboardSidebar
            {...sidebarProps}
            className="h-[calc(100%-3.25rem)] w-full border-r-0"
            onNavigate={() => setSidebarOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <div className="flex min-h-0 min-w-0 flex-1">
        <DashboardSidebar {...sidebarProps} className="hidden md:flex" />
        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {viewMode === "archived" ? (
            <ArchivedVersionsPanel
              types={types}
              selectedVersionId={selectedVersionId}
              onSelectVersion={(versionId, typeId) => {
                const ctx = findVersionContext(types, versionId);
                if (ctx) {
                  handleSelectVersion(versionId, ctx.piece.id, typeId);
                }
              }}
              onDeleteVersions={handleVersionsDeleted}
            />
          ) : selectedVersion && selectedPiece ? (
            <CopyEditor
              ref={editorRef}
              version={selectedVersion}
              piece={selectedPiece}
              typeId={selectedType?.id ?? null}
              typeName={selectedType?.name ?? null}
              writingNotes={selectedType?.writingNotes ?? ""}
              showNotesInitially={openNotesForVersionId === selectedVersion.id}
              onNotesDismiss={() => setOpenNotesForVersionId(null)}
              onDirtyChange={setVersionDirty}
              onPieceTitleDirtyChange={setPieceTitleDirty}
              onWritingNotesSaved={handleWritingNotesSaved}
              onSaved={handleVersionSaved}
              onPieceSaved={handlePieceSaved}
              onDeleted={handleVersionDeleted}
              onArchived={handleVersionArchived}
              onToggleInUse={handleToggleInUse}
              onBackToVersions={handleBackToVersions}
              onRequestNewVersion={() =>
                handleRequestNewVersion(
                  selectedPiece.id,
                  selectedType?.id ?? ""
                )
              }
            />
          ) : selectedPiece ? (
            <VersionCardsGrid
              piece={selectedPiece}
              typeName={selectedType?.name ?? ""}
              selectedVersionId={selectedVersionId}
              pending={createPending}
              onBackToPieces={handleBackToPieces}
              onSelectVersion={(versionId) =>
                handleSelectVersion(
                  versionId,
                  selectedPiece.id,
                  selectedType?.id ?? ""
                )
              }
              onCreateVersion={() =>
                handleRequestNewVersion(
                  selectedPiece.id,
                  selectedType?.id ?? ""
                )
              }
              onToggleInUse={handleToggleInUse}
            />
          ) : selectedType ? (
            <PieceCardsGrid
              type={selectedType}
              selectedPieceId={selectedPieceId}
              pending={createPending}
              onSelectPiece={(pieceId) =>
                handleSelectPiece(pieceId, selectedType.id)
              }
              onCreatePiece={() => handleCreatePiece(selectedType.id)}
            />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center px-6 text-center sm:px-8">
              <p className="max-w-md text-sm text-muted-foreground">
                <span className="md:hidden">
                  Open the menu to pick a section, then select or add copy to
                  edit.
                </span>
                <span className="hidden md:inline">
                  Select a section on the left to view your copy.
                </span>
              </p>
            </div>
          )}
        </main>
      </div>

      <NewVersionDialog
        open={Boolean(newVersionDialog && newVersionPiece)}
        pieceTitle={newVersionPiece?.title ?? ""}
        versions={newVersionPiece?.versions ?? []}
        currentVersionId={
          newVersionDialog?.pieceId === selectedPieceId
            ? selectedVersionId
            : null
        }
        pending={createPending}
        onConfirm={handleConfirmNewVersion}
        onCancel={() => setNewVersionDialog(null)}
      />

      <UnsavedChangesDialog
        open={unsavedDialogOpen}
        saving={unsavedSaving}
        onSaveAndContinue={handleSaveAndContinue}
        onStay={handleStay}
        onDiscard={handleDiscardAndContinue}
      />
    </div>
  );
}
