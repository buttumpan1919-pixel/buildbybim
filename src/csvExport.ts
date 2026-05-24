// CSV export utility \u2014 Sprint 6 (Project Control)
// Spec: docs/PROJECT_CONTROL_PRD.md Section 11 + Section 7
//
// RFC 4180 compliant: comma-separated, quote fields containing
// comma/quote/newline, double-quote-escape embedded quotes. Adds UTF-8
// BOM so Excel opens Thai text without mojibake.

export type CsvValue = string | number | boolean | null | undefined;

function stringifyCsvValue(value: CsvValue): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
}

/** Escape a single field per RFC 4180. */
export function escapeCsvValue(value: CsvValue): string {
  const raw = stringifyCsvValue(value);
  if (!/[",\r\n]/.test(raw)) return raw;
  return `"${raw.replace(/"/g, '""')}"`;
}

/**
 * Build a CSV string from header + rows-as-objects. Always includes a
 * UTF-8 BOM (`\uFEFF`) by default so Microsoft Excel opens Thai characters
 * correctly without an import-with-encoding step. Uses `\r\n` line
 * endings per RFC 4180.
 */
export function rowsToCsv(
  headers: string[],
  rows: Array<Record<string, CsvValue>>,
  opts: { includeBom?: boolean } = {}
): string {
  const includeBom = opts.includeBom !== false;
  const lines = [
    headers.map(escapeCsvValue).join(","),
    ...rows.map((row) => headers.map((header) => escapeCsvValue(row[header])).join(","))
  ];
  return `${includeBom ? "\uFEFF" : ""}${lines.join("\r\n")}`;
}

/**
 * Trigger a browser file download for a CSV payload. No-op in SSR.
 * Filename auto-appends `.csv` when missing. Caller stays free of
 * Blob/URL plumbing.
 */
export function downloadCsv(filename: string, csv: string): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  const safeName = filename.toLowerCase().endsWith(".csv") ? filename : `${filename}.csv`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = safeName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Format a YYYY-MM-DD date string for a dated filename. Defaults to today. */
export function dateStampForFilename(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}
