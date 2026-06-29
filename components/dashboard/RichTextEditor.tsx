"use client";

import * as React from "react";
import {
  BoldIcon,
  ItalicIcon,
  StrikethroughIcon,
  UnderlineIcon,
} from "lucide-react";

import { toEditorHtml } from "@/lib/html-content";
import {
  loadQuill,
  QUILL_FONT_OPTIONS,
  QUILL_FORMATS,
  QUILL_SIZE_OPTIONS,
  type QuillConstructor,
} from "@/lib/quill-config";
import { cn } from "@/lib/utils";

type QuillInstance = InstanceType<QuillConstructor>;

type Props = {
  id?: string;
  /** Initial HTML only — parent must remount via `key` when switching versions. */
  value: string;
  onChange: (html: string) => void;
  onDirty: () => void;
  placeholder?: string;
  className?: string;
};

type ActiveFormats = {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strike: boolean;
};

const EMPTY_FORMATS: ActiveFormats = {
  bold: false,
  italic: false,
  underline: false,
  strike: false,
};

type QuillRange = { index: number; length: number };

export function RichTextEditor({
  id,
  value,
  onChange,
  onDirty,
  placeholder = "Write your copy…",
  className,
}: Props) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const quillRef = React.useRef<QuillInstance | null>(null);
  const quillClassRef = React.useRef<QuillConstructor | null>(null);
  const savedRangeRef = React.useRef<QuillRange | null>(null);
  const onChangeRef = React.useRef(onChange);
  const onDirtyRef = React.useRef(onDirty);
  const [ready, setReady] = React.useState(false);
  const [activeFormats, setActiveFormats] =
    React.useState<ActiveFormats>(EMPTY_FORMATS);
  const [fontValue, setFontValue] = React.useState("default");
  const [sizeValue, setSizeValue] = React.useState("16px");

  onChangeRef.current = onChange;
  onDirtyRef.current = onDirty;

  const syncToolbarFromQuill = React.useCallback(() => {
    const quill = quillRef.current;
    if (!quill) return;

    const format = quill.getFormat();
    setActiveFormats({
      bold: !!format.bold,
      italic: !!format.italic,
      underline: !!format.underline,
      strike: !!format.strike,
    });

    const font = typeof format.font === "string" ? format.font : undefined;
    setFontValue(
      font && QUILL_FONT_OPTIONS.some((f) => f.value === font)
        ? font
        : "default"
    );

    const size = typeof format.size === "string" ? format.size : undefined;
    setSizeValue(
      size && QUILL_SIZE_OPTIONS.some((s) => s.value === size) ? size : "16px"
    );
  }, []);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const initialValue = value;
    let quill: QuillInstance | null = null;
    let handleChange:
      | ((
          delta: unknown,
          old: unknown,
          source: string
        ) => void)
      | null = null;
    let handleSelectionChange: (() => void) | null = null;
    let cancelled = false;

    void (async () => {
      const Quill = await loadQuill();
      if (cancelled || !containerRef.current) return;

      quillClassRef.current = Quill;
      quill = new Quill(container, {
        theme: "snow",
        modules: { toolbar: false },
        formats: [...QUILL_FORMATS],
        placeholder,
      });

      quillRef.current = quill;

      const initialHtml = toEditorHtml(initialValue);
      if (initialHtml) {
        quill.clipboard.dangerouslyPasteHTML(initialHtml, Quill.sources.SILENT);
      }

      handleChange = (_delta, _old, source) => {
        syncToolbarFromQuill();
        if (source !== Quill.sources.USER || !quill) return;
        onChangeRef.current(quill.getSemanticHTML());
        onDirtyRef.current();
      };

      handleSelectionChange = () => {
        syncToolbarFromQuill();
      };

      quill.on(Quill.events.TEXT_CHANGE, handleChange);
      quill.on(Quill.events.SELECTION_CHANGE, handleSelectionChange);
      syncToolbarFromQuill();
      setReady(true);
    })();

    return () => {
      cancelled = true;
      const Quill = quillClassRef.current;
      if (quill && Quill) {
        if (handleChange) {
          quill.off(Quill.events.TEXT_CHANGE, handleChange);
        }
        if (handleSelectionChange) {
          quill.off(Quill.events.SELECTION_CHANGE, handleSelectionChange);
        }
      }
      quillRef.current = null;
      quillClassRef.current = null;
      setReady(false);
      setActiveFormats(EMPTY_FORMATS);
      container.innerHTML = "";
    };
    // value intentionally omitted — parent remounts via `key` when switching versions
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncToolbarFromQuill]);

  function captureSelection() {
    const quill = quillRef.current;
    if (!quill) return;
    const range = quill.getSelection();
    if (range) {
      savedRangeRef.current = {
        index: range.index,
        length: range.length,
      };
    }
  }

  function restoreSelection(quill: QuillInstance, Quill: QuillConstructor) {
    const saved = savedRangeRef.current;
    if (saved) {
      quill.setSelection(saved.index, saved.length, Quill.sources.SILENT);
      return;
    }
    quill.focus();
  }

  function withQuill(action: (quill: QuillInstance, Quill: QuillConstructor) => void) {
    const quill = quillRef.current;
    const Quill = quillClassRef.current;
    if (!quill || !Quill) return;
    restoreSelection(quill, Quill);
    action(quill, Quill);
  }

  function applyFormat(name: string, formatValue: string | false) {
    withQuill((quill, Quill) => {
      quill.format(name, formatValue, Quill.sources.USER);
      syncToolbarFromQuill();
      onChangeRef.current(quill.getSemanticHTML());
      onDirtyRef.current();
    });
  }

  function toggleFormat(name: keyof ActiveFormats) {
    withQuill((quill, Quill) => {
      const current = quill.getFormat()[name];
      quill.format(name, !current, Quill.sources.USER);
      syncToolbarFromQuill();
    });
  }

  return (
    <div className={cn("pitchkit-quill flex min-h-0 flex-1 flex-col", className)}>
      <div
        role="toolbar"
        aria-label="Formatting"
        className={cn(
          "flex flex-wrap items-center gap-1 border-2 border-b-0 border-foreground bg-muted/30 px-2 py-1.5",
          !ready && "pointer-events-none opacity-60"
        )}
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
          value={fontValue}
          disabled={!ready}
          onChange={(e) => {
            const next = e.target.value;
            applyFormat("font", next === "default" ? false : next);
          }}
        >
          {QUILL_FONT_OPTIONS.map((f) => (
            <option key={f.label} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
        <select
          aria-label="Font size"
          className="h-7 max-w-[6.5rem] border-2 border-foreground bg-background px-1.5 text-xs outline-none"
          value={sizeValue}
          disabled={!ready}
          onChange={(e) => {
            applyFormat("size", e.target.value);
          }}
        >
          {QUILL_SIZE_OPTIONS.map((s) => (
            <option key={s.label} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <span className="mx-0.5 h-5 w-px bg-foreground/20" aria-hidden />
        <ToolbarButton
          label="Bold"
          active={activeFormats.bold}
          disabled={!ready}
          onClick={() => toggleFormat("bold")}
        >
          <BoldIcon className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton
          label="Italic"
          active={activeFormats.italic}
          disabled={!ready}
          onClick={() => toggleFormat("italic")}
        >
          <ItalicIcon className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton
          label="Underline"
          active={activeFormats.underline}
          disabled={!ready}
          onClick={() => toggleFormat("underline")}
        >
          <UnderlineIcon className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton
          label="Strikethrough"
          active={activeFormats.strike}
          disabled={!ready}
          onClick={() => toggleFormat("strike")}
        >
          <StrikethroughIcon className="size-3.5" />
        </ToolbarButton>
      </div>
      <div
        id={id}
        ref={containerRef}
        className="pitchkit-quill__surface min-h-[min(60vh,28rem)] flex-1 border-2 border-foreground bg-background"
        aria-label="Content"
        aria-busy={!ready}
      />
    </div>
  );
}

function ToolbarButton({
  label,
  active = false,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex size-7 items-center justify-center border-2 transition-colors disabled:opacity-50",
        active
          ? "border-foreground bg-background text-foreground shadow-sm"
          : "border-transparent text-muted-foreground hover:border-foreground/30 hover:bg-background hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}
