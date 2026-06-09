/** Fixed locale so server and client render the same string (avoids hydration mismatch). */
const LOCALE = "en-US";

const OPTIONS: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
};

export function formatDateTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat(LOCALE, OPTIONS).format(new Date(iso));
  } catch {
    return iso;
  }
}
