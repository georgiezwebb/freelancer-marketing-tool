"use client";

import * as React from "react";
import {
  BoldIcon,
  ItalicIcon,
  StrikethroughIcon,
  UnderlineIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { toEditorHtml } from "@/lib/html-content";

const FONTS = [
  { label: "Default", value: "inherit" },
  { label: "Sans", value: "var(--font-geist-sans), system-ui, sans-serif" },
  { label: "Serif", value: "Georgia, 'Times New Roman', serif" },
  { label: "Mono", value: "var(--font-geist-mono), ui-monospace, monospace" },
] as const;

const FONT_SIZES = [
  { label: "Small", value: "13px" },
  { label: "Normal", value: "16px" },
  { label: "Large", value: "20px" },
  { label: "Heading", value: "28px" },
] as const;

type Props = {
  id?: string;
  /** Initial HTML only — parent must remount via `key` when switching versions. */
  value: string;
  onChange: (html: string) => void;
  onDirty: () => void;
  placeholder?: string;
  className?: string;
};

function applyFontSize(editor: HTMLElement, size: string) {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);
  if (!editor.contains(range.commonAncestorContainer)) return;

  if (range.collapsed) {
    const start =
      range.startContainer.nodeType === Node.TEXT_NODE
        ? range.startContainer.parentElement
        : (range.startContainer as HTMLElement);
    const block = start?.closest<HTMLElement>("p, div, span, li");
    if (block && block !== editor && editor.contains(block)) {
      block.style.fontSize = size;
      return;
    }
  }

  const span = document.createElement("span");
  span.style.fontSize = size;
  span.appendChild(range.extractContents());
  range.insertNode(span);

  selection.removeAllRanges();
  const after = document.createRange();
  after.selectNodeContents(span);
  after.collapse(false);
  selection.addRange(after);
}

function applyFontFamily(fontFamily: string) {
  if (fontFamily === "inherit") {
    document.execCommand("removeFormat", false);
    return;
  }
  document.execCommand("fontName", false, fontFamily);
}

export function RichTextEditor({
  id,
  value,
  onChange,
  onDirty,
  placeholder = "Write your copy…",
  className,
}: Props) {
  const editorRef = React.useRef<HTMLDivElement>(null);
  const savedRangeRef = React.useRef<Range | null>(null);

  /** Load content once per mount (`key` on parent switches versions). */
  React.useLayoutEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    el.innerHTML = toEditorHtml(value);
    // value intentionally omitted — syncing on every parent update resets the caret
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function captureSelection() {
    const el = editorRef.current;
    const sel = window.getSelection();
    if (!el || !sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (el.contains(range.commonAncestorContainer)) {
      savedRangeRef.current = range.cloneRange();
    }
  }

  function restoreSelection() {
    const el = editorRef.current;
    const saved = savedRangeRef.current;
    if (!el || !saved) return false;
    el.focus();
    const sel = window.getSelection();
    if (!sel) return false;
    sel.removeAllRanges();
    sel.addRange(saved);
    return true;
  }

  function syncFromEditor() {
    const el = editorRef.current;
    if (!el) return;
    onChange(el.innerHTML);
    onDirty();
  }

  function runCommand(command: string, arg?: string) {
    restoreSelection();
    editorRef.current?.focus();
    document.execCommand(command, false, arg);
    syncFromEditor();
  }

  function handleFontSizeChange(size: string) {
    const el = editorRef.current;
    if (!el) return;
    restoreSelection();
    applyFontSize(el, size);
    syncFromEditor();
  }

  function handleFontFamilyChange(fontFamily: string) {
    restoreSelection();
    applyFontFamily(fontFamily);
    syncFromEditor();
  }

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      <div
        role="toolbar"
        aria-label="Formatting"
        className="flex flex-wrap items-center gap-1 border-2 border-b-0 border-foreground bg-muted/30 px-2 py-1.5"
        onMouseDownCapture={captureSelection}
        onMouseDown={(e) => {
          if ((e.target as HTMLElement).closest("button")) {
            e.preventDefault();
          }
        }}
      >
        <select
          aria-label="Font"
          className="h-7 max-w-[6.5rem] border-2 border-foreground bg-background px-1.5 text-xs outline-none"
          defaultValue="inherit"
          onChange={(e) => handleFontFamilyChange(e.target.value)}
        >
          {FONTS.map((f) => (
            <option key={f.label} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
        <select
          aria-label="Font size"
          className="h-7 max-w-[6.5rem] border-2 border-foreground bg-background px-1.5 text-xs outline-none"
          defaultValue="16px"
          onChange={(e) => handleFontSizeChange(e.target.value)}
        >
          {FONT_SIZES.map((s) => (
            <option key={s.label} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <span className="mx-0.5 h-5 w-px bg-foreground/20" aria-hidden />
        <ToolbarButton label="Bold" onClick={() => runCommand("bold")}>
          <BoldIcon className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton label="Italic" onClick={() => runCommand("italic")}>
          <ItalicIcon className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton label="Underline" onClick={() => runCommand("underline")}>
          <UnderlineIcon className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton
          label="Strikethrough"
          onClick={() => runCommand("strikeThrough")}
        >
          <StrikethroughIcon className="size-3.5" />
        </ToolbarButton>
      </div>
      <div
        id={id}
        ref={editorRef}
        role="textbox"
        aria-multiline="true"
        aria-label="Content"
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={syncFromEditor}
        className={cn(
          "min-h-[min(60vh,28rem)] flex-1 overflow-y-auto border-2 border-foreground bg-background px-2.5 py-2 text-base outline-none",
          "focus-visible:ring-2 focus-visible:ring-ring/50",
          "empty:before:pointer-events-none empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)]",
          "[&_p]:mb-2 [&_p:last-child]:mb-0",
          "[&_span]:leading-relaxed"
        )}
      />
    </div>
  );
}

function ToolbarButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="flex size-7 items-center justify-center border-2 border-transparent hover:border-foreground/30 hover:bg-background"
    >
      {children}
    </button>
  );
}
