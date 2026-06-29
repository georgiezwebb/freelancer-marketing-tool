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
import type { CopyTypeRecord, CopyVersionRecord } from "@/lib/dashboard-types";
import { activeVersions, allArchivedVersions } from "@/lib/version-filters";
import { ARCHIVE_RETENTION_NOTICE } from "@/lib/archive-retention";

import { ArchivedVersionsPanel } from "./ArchivedVersionsPanel";
import { CopyEditor, type CopyEditorHandle } from "./CopyEditor";
import { DashboardSidebar } from "./DashboardSidebar";
import { UnsavedChangesDialog } from "./UnsavedChangesDialog";
import { VersionCardsGrid } from "./VersionCardsGrid";

type Props = {
  initialTypes: CopyTypeRecord[];
};

function findVersion(
  types: CopyTypeRecord[],
  versionId: string | null
): CopyVersionRecord | null {
  if (!versionId) return null;
  for (const type of types) {
    const v = type.versions.find((x) => x.id === versionId);
    if (v) return v;
  }
  return null;
}

export function DashboardClient({ initialTypes }: Props) {
  const router = useRouter();
  const editorRef = React.useRef<CopyEditorHandle>(null);
  const pendingNavRef = React.useRef<(() => void) | null>(null);

  const [types, setTypes] = React.useState(initialTypes);
  const [selectedTypeId, setSelectedTypeId] = React.useState<string | null>(
    initialTypes[0]?.id ?? null
  );
  const [selectedVersionId, setSelectedVersionId] = React.useState<
    string | null
  >(initialTypes[0]?.versions[0]?.id ?? null);
  const [openNotesForVersionId, setOpenNotesForVersionId] = React.useState<
    string | null
  >(null);
  const [versionDirty, setVersionDirty] = React.useState(false);
  const [unsavedDialogOpen, setUnsavedDialogOpen] = React.useState(false);
  const [unsavedSaving, setUnsavedSaving] = React.useState(false);
  const [createVersionPending, setCreateVersionPending] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<"library" | "archived">(
    "library"
  );
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const selectedType = types.find((t) => t.id === selectedTypeId) ?? null;
  const archivedCount = allArchivedVersions(types).length;
  const selectedVersion = findVersion(types, selectedVersionId);

  const versionDirtyRef = React.useRef(versionDirty);
  const selectedVersionIdRef = React.useRef(selectedVersionId);
  versionDirtyRef.current = versionDirty;
  selectedVersionIdRef.current = selectedVersionId;

  const needsSavePrompt = versionDirty && selectedVersionId !== null;

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
    if (!versionDirtyRef.current || !selectedVersionIdRef.current) {
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
      setVersionDirty(false);
      completePendingNavigation();
    }
  }

  function handleDiscardAndContinue() {
    versionDirtyRef.current = false;
    setVersionDirty(false);
    completePendingNavigation();
  }

  function handleSelectType(typeId: string) {
    if (typeId === selectedTypeId && !selectedVersionId) return;
    guardNavigation(() => {
      setSelectedTypeId(typeId);
      setSelectedVersionId(null);
      setOpenNotesForVersionId(null);
    });
  }

  function handleSelectVersion(versionId: string, typeId: string) {
    if (
      viewMode === "library" &&
      versionId === selectedVersionId &&
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
            mergeVersionIntoTypes(fresh);
          }
        } catch {
          // Fall back to cached client state if refresh fails.
        }
        setViewMode("library");
        setSelectedTypeId(typeId);
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

  async function handleCreateVersion(typeId: string) {
    const type = types.find((t) => t.id === typeId);
    if (!type) return;

    guardNavigation(() => {
      void (async () => {
        setCreateVersionPending(true);
        try {
          const res = await fetch(`/api/copy-types/${typeId}/versions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: `Version ${activeVersions(type.versions).length + 1}`,
            }),
          });
          if (!res.ok) throw new Error("Failed to create version");
          const version = (await res.json()) as CopyVersionRecord;
          handleVersionCreated(version);
        } finally {
          setCreateVersionPending(false);
        }
      })();
    });
  }

  function handleVersionCreated(version: CopyVersionRecord) {
    setTypes((prev) =>
      prev.map((t) =>
        t.id === version.typeId
          ? { ...t, versions: [version, ...t.versions] }
          : t
      )
    );
    setSelectedTypeId(version.typeId);
    setSelectedVersionId(version.id);
    setOpenNotesForVersionId(version.id);
    setVersionDirty(false);
    setSidebarOpen(false);
  }

  function handleWritingNotesSaved(typeId: string, notes: string) {
    setTypes((prev) =>
      prev.map((t) => (t.id === typeId ? { ...t, writingNotes: notes } : t))
    );
  }

  function handleVersionSaved(version: CopyVersionRecord) {
    mergeVersionIntoTypes(version);
  }

  function mergeVersionIntoTypes(version: CopyVersionRecord) {
    setTypes((prev) =>
      prev.map((t) =>
        t.id === version.typeId
          ? {
              ...t,
              versions: t.versions
                .map((v) => (v.id === version.id ? version : v))
                .sort(
                  (a, b) =>
                    new Date(b.updatedAt).getTime() -
                    new Date(a.updatedAt).getTime()
                ),
            }
          : t
      )
    );
  }

  function handleVersionArchived(version: CopyVersionRecord) {
    mergeVersionIntoTypes(version);
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
        prev.map((t) =>
          t.id === version.typeId
            ? {
                ...t,
                versions: t.versions.map((v) => {
                  if (v.id === version.id) return version;
                  if (version.inUse) return { ...v, inUse: false };
                  return v;
                }),
              }
            : t
        )
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
        versions: t.versions.filter((v) => !idSet.has(v.id)),
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

  function handleHomeClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (!needsSavePrompt) return;
    e.preventDefault();
    guardNavigation(() => router.push("/"));
  }

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
            types={types}
            selectedTypeId={selectedTypeId}
            selectedVersionId={selectedVersionId}
            onSelectType={handleSelectType}
            onSelectVersion={handleSelectVersion}
            onTypesChange={setTypes}
            onCreateVersion={handleCreateVersion}
            onToggleInUse={handleToggleInUse}
            createVersionPending={createVersionPending}
            className="h-[calc(100%-3.25rem)] w-full border-r-0"
            onNavigate={() => setSidebarOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <div className="flex min-h-0 min-w-0 flex-1">
        <DashboardSidebar
          types={types}
          selectedTypeId={selectedTypeId}
          selectedVersionId={selectedVersionId}
          onSelectType={handleSelectType}
          onSelectVersion={handleSelectVersion}
          onTypesChange={setTypes}
          onCreateVersion={handleCreateVersion}
          onToggleInUse={handleToggleInUse}
          createVersionPending={createVersionPending}
          className="hidden md:flex"
        />
        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {viewMode === "archived" ? (
          <ArchivedVersionsPanel
            types={types}
            selectedVersionId={selectedVersionId}
            onSelectVersion={handleSelectVersion}
            onDeleteVersions={handleVersionsDeleted}
          />
        ) : selectedVersion ? (
          <CopyEditor
            ref={editorRef}
            version={selectedVersion}
            typeId={selectedType?.id ?? null}
            typeName={selectedType?.name ?? null}
            writingNotes={selectedType?.writingNotes ?? ""}
            showNotesInitially={openNotesForVersionId === selectedVersion.id}
            onNotesDismiss={() => setOpenNotesForVersionId(null)}
            onDirtyChange={setVersionDirty}
            onWritingNotesSaved={handleWritingNotesSaved}
            onSaved={handleVersionSaved}
            onDeleted={handleVersionDeleted}
            onArchived={handleVersionArchived}
            onToggleInUse={handleToggleInUse}
            onBackToVersions={handleBackToVersions}
          />
        ) : selectedType ? (
          <VersionCardsGrid
            type={selectedType}
            selectedVersionId={selectedVersionId}
            pending={createVersionPending}
            onSelectVersion={(versionId) =>
              handleSelectVersion(versionId, selectedType.id)
            }
            onCreateVersion={() => handleCreateVersion(selectedType.id)}
            onToggleInUse={handleToggleInUse}
          />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center sm:px-8">
            <p className="max-w-md text-sm text-muted-foreground">
              <span className="md:hidden">
                Open the menu to pick a section, then select or add a version to
                edit.
              </span>
              <span className="hidden md:inline">
                Select a section on the left to view your copy versions.
              </span>
            </p>
          </div>
        )}
        </main>
      </div>

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
