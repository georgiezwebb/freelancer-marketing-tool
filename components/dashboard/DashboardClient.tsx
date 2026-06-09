"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { UserButton } from "@clerk/nextjs";

import { Separator } from "@/components/ui/separator";
import type { CopyTypeRecord, CopyVersionRecord } from "@/lib/dashboard-types";
import { activeVersions } from "@/lib/version-filters";

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

  const selectedType = types.find((t) => t.id === selectedTypeId) ?? null;
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
    if (versionId === selectedVersionId && typeId === selectedTypeId) return;
    guardNavigation(() => {
      setSelectedTypeId(typeId);
      setSelectedVersionId(versionId);
      setOpenNotesForVersionId(null);
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

  function handleVersionDeleted(versionId: string) {
    setTypes((prev) => {
      const next = prev.map((t) => ({
        ...t,
        versions: t.versions.filter((v) => v.id !== versionId),
      }));
      setSelectedVersionId((current) =>
        current === versionId ? null : current
      );
      return next;
    });
    setVersionDirty(false);
  }

  function handleHomeClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (!needsSavePrompt) return;
    e.preventDefault();
    guardNavigation(() => router.push("/"));
  }

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden">
      <header className="z-20 shrink-0 border-b-2 border-foreground/10 bg-background/90 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              onClick={handleHomeClick}
              className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              ← Home
            </Link>
            <Separator orientation="vertical" className="h-6" />
            <h1 className="font-heading text-base font-semibold tracking-tight md:text-lg">
              Copy library
            </h1>
          </div>
          <UserButton
            appearance={{
              elements: { avatarBox: "size-8 rounded-none" },
            }}
          />
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <DashboardSidebar
          types={types}
          selectedTypeId={selectedTypeId}
          selectedVersionId={selectedVersionId}
          onSelectType={handleSelectType}
          onSelectVersion={handleSelectVersion}
          onTypesChange={setTypes}
          onCreateVersion={handleCreateVersion}
          createVersionPending={createVersionPending}
        />
        {selectedVersion ? (
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
          />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <p className="max-w-md text-sm text-muted-foreground">
              Select a section on the left to view your copy versions.
            </p>
          </div>
        )}
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
