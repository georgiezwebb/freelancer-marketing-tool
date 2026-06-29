export const QUILL_FONT_OPTIONS = [
  { label: "Default", value: "default" },
  { label: "Sans", value: "sans" },
  { label: "Serif", value: "serif" },
  { label: "Mono", value: "mono" },
] as const;

export const QUILL_SIZE_OPTIONS = [
  { label: "Small", value: "13px" },
  { label: "Normal", value: "16px" },
  { label: "Large", value: "20px" },
  { label: "Heading", value: "28px" },
] as const;

export const QUILL_FORMATS = [
  "bold",
  "italic",
  "underline",
  "strike",
  "size",
  "font",
] as const;

let configured = false;

/** Client-only — call after dynamically importing Quill. */
export async function ensureQuillConfigured() {
  if (configured) return;

  const Quill = (await import("quill")).default;
  const { FontClass } = await import("quill/formats/font");
  const { SizeStyle } = await import("quill/formats/size");

  SizeStyle.whitelist = QUILL_SIZE_OPTIONS.map((s) => s.value);
  Quill.register(SizeStyle, true);

  FontClass.whitelist = QUILL_FONT_OPTIONS.filter(
    (f) => f.value !== "default"
  ).map((f) => f.value);
  Quill.register(FontClass, true);

  configured = true;
}

export type QuillConstructor = typeof import("quill").default;

export async function loadQuill(): Promise<QuillConstructor> {
  await ensureQuillConfigured();
  return (await import("quill")).default;
}
