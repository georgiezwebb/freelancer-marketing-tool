"use client";

import * as React from "react";
import { ArchiveIcon, FileTextIcon, PlusIcon } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { CopyTypeRecord, CopyVersionRecord } from "@/lib/dashboard-types";
import { ARCHIVE_RETENTION_NOTICE } from "@/lib/archive-retention";
import { formatDateTime } from "@/lib/format-datetime";
import { stripHtmlToText } from "@/lib/html-content";
import { isVersionGuideContent } from "@/lib/marketing-stack-templates";
import {
  activeVersions,
  archivedVersions,
} from "@/lib/version-filters";

import { VersionInUseStar } from "./VersionInUseStar";

function contentPreview(content: string, max = 120): string {
  const text = stripHtmlToText(content);
  if (!text) return "No content yet";
  return text.length <= max ? text : `${text.slice(0, max)}…`;
}

type Props = {
  type: CopyTypeRecord;
  selectedVersionId: string | null;
  pending?: boolean;
  onSelectVersion: (versionId: string) => void;
  onCreateVersion: () => void;
  onToggleInUse: (
    versionId: string,
    inUse: boolean
  ) => boolean | void | Promise<boolean | void>;
};

export function VersionCardsGrid({
  type,
  selectedVersionId,
  pending = false,
  onSelectVersion,
  onCreateVersion,
  onToggleInUse,
}: Props) {
  const active = activeVersions(type.versions);
  const archived = archivedVersions(type.versions);
  const [showArchived, setShowArchived] = React.useState(false);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="border-b border-foreground/10 px-6 py-4">
        <p className="inline-block border-2 border-foreground bg-muted/30 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-foreground">
          {type.name}
        </p>
        <h2 className="mt-2 font-heading text-lg font-semibold tracking-tight">
          Choose copy to edit
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick a version below or start a new one. Star the copy you&apos;re
          currently using.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <ul
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          aria-label={`Versions for ${type.name}`}
        >
          {active.map((version) => (
            <li key={version.id}>
              <VersionCard
                version={version}
                typeName={type.name}
                selected={selectedVersionId === version.id}
                disabled={pending}
                onSelect={() => onSelectVersion(version.id)}
                onToggleInUse={onToggleInUse}
              />
            </li>
          ))}
          <li>
            <NewVersionCard disabled={pending} onCreate={onCreateVersion} />
          </li>
        </ul>

        {archived.length > 0 ? (
          <div className="mt-8 border-t border-foreground/10 pt-6">
            <button
              type="button"
              onClick={() => setShowArchived((v) => !v)}
              className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <ArchiveIcon className="size-3.5" />
              {showArchived ? "Hide" : "Show"} archived ({archived.length})
            </button>
            {showArchived ? (
              <>
                <p className="mt-2 max-w-xl text-xs text-muted-foreground">
                  {ARCHIVE_RETENTION_NOTICE}
                </p>
                <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {archived.map((version) => (
                  <li key={version.id}>
                    <VersionCard
                      version={version}
                      typeName={type.name}
                      archived
                      selected={selectedVersionId === version.id}
                      disabled={pending}
                      onSelect={() => onSelectVersion(version.id)}
                      onToggleInUse={onToggleInUse}
                    />
                  </li>
                ))}
              </ul>
              </>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function VersionCard({
  version,
  typeName,
  archived = false,
  selected,
  disabled,
  onSelect,
  onToggleInUse,
}: {
  version: CopyVersionRecord;
  typeName: string;
  archived?: boolean;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
  onToggleInUse: (
    versionId: string,
    inUse: boolean
  ) => boolean | void | Promise<boolean | void>;
}) {
  const title = version.title?.trim() || "Untitled";
  const preview = isVersionGuideContent(typeName, version.content)
    ? "No content yet"
    : contentPreview(version.content);

  return (
    <Card
      size="sm"
      className={cn(
        "h-full rounded-none border-2 py-0 ring-0",
        selected
          ? "border-foreground bg-background shadow-sm"
          : archived
            ? "border-foreground/15 bg-muted/20 opacity-80 hover:opacity-100"
            : "border-foreground/25 hover:border-foreground hover:bg-background/80",
        disabled && "pointer-events-none opacity-60"
      )}
    >
      <div className="flex h-full items-stretch">
        <button
          type="button"
          disabled={disabled}
          onClick={onSelect}
          className={cn(
            "flex min-w-0 flex-1 flex-col text-left",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset"
          )}
        >
          <CardHeader className="border-b border-foreground/10 pb-3">
            <CardTitle className="flex items-start gap-2 text-sm">
              <FileTextIcon className="mt-0.5 size-4 shrink-0 opacity-70" />
              <span className="line-clamp-2 flex-1">
                {title}
                {archived ? (
                  <span className="ml-1.5 text-[10px] font-normal uppercase tracking-wide text-muted-foreground">
                    · Archived
                  </span>
                ) : null}
                {version.inUse ? (
                  <span className="ml-1.5 text-[10px] font-normal uppercase tracking-wide text-amber-600">
                    · In use
                  </span>
                ) : null}
              </span>
            </CardTitle>
            <CardDescription className="text-xs">
              Updated {formatDateTime(version.updatedAt)}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-3">
            <p className="line-clamp-4 text-xs leading-relaxed text-muted-foreground">
              {preview}
            </p>
          </CardContent>
        </button>
        {!archived ? (
          <div className="flex shrink-0 items-start border-l border-foreground/10 px-1.5 pt-3">
            <VersionInUseStar
              size="sm"
              inUse={version.inUse}
              disabled={disabled}
              onToggle={(next) => onToggleInUse(version.id, next)}
            />
          </div>
        ) : null}
      </div>
    </Card>
  );
}

function NewVersionCard({
  disabled,
  onCreate,
}: {
  disabled: boolean;
  onCreate: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onCreate}
      className={cn(
        "h-full min-h-[9.5rem] w-full",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        disabled && "pointer-events-none opacity-60"
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
          <span className="text-sm font-medium">New version</span>
          <span className="text-xs text-muted-foreground">
            Start fresh copy for this section
          </span>
        </CardContent>
      </Card>
    </button>
  );
}
