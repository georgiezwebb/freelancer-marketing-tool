/**
 * pg v8+ warns when sslmode is prefer/require/verify-ca because those will
 * change meaning in pg v9. Use verify-full explicitly for current behavior.
 */
export function normalizeDatabaseUrl(connectionString: string): string {
  try {
    const url = new URL(connectionString);
    const sslmode = url.searchParams.get("sslmode");
    if (
      sslmode === "prefer" ||
      sslmode === "require" ||
      sslmode === "verify-ca"
    ) {
      url.searchParams.set("sslmode", "verify-full");
    }
    return url.toString();
  } catch {
    return connectionString;
  }
}
