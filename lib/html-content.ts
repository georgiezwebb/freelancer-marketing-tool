/** Escape text for safe HTML insertion. */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function isHtmlContent(content: string): boolean {
  return /<[a-z][\s\S]*>/i.test(content);
}

/** Plain text → simple HTML paragraphs for the rich editor. */
export function toEditorHtml(content: string): string {
  const trimmed = content.trim();
  if (!trimmed) return "";
  if (isHtmlContent(trimmed)) return trimmed;
  return trimmed
    .split(/\n{2,}/)
    .map((block) => {
      const lines = block.split("\n").map(escapeHtml).join("<br>");
      return `<p>${lines}</p>`;
    })
    .join("");
}

/** Strip tags for card previews and search snippets. */
export function stripHtmlToText(html: string): string {
  if (!html.trim()) return "";
  if (typeof document === "undefined") {
    return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }
  const el = document.createElement("div");
  el.innerHTML = html;
  return (el.textContent ?? "").replace(/\s+/g, " ").trim();
}
