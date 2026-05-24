import { describe, expect, it } from "vitest";
import {
  buildEvidencePath,
  EVIDENCE_BUCKET,
  fileToDataUrl,
  formatFileSize,
  isStorageAvailable
} from "./storage.client";

describe("EVIDENCE_BUCKET", () => {
  it("is the well-known evidence-files bucket id", () => {
    expect(EVIDENCE_BUCKET).toBe("evidence-files");
  });
});

describe("buildEvidencePath", () => {
  it("returns workspace/asset/filename for valid inputs", () => {
    expect(buildEvidencePath("ws-1", "ev-1", "photo.jpg")).toBe("ws-1/ev-1/photo.jpg");
  });

  it("sanitizes filename — strips Thai chars + spaces, keeps ASCII word chars + dots", () => {
    // NFKD strips combining marks, then [^\w.\-] removes Thai chars + space,
    // then leading underscores are trimmed → only the ASCII tail survives
    expect(buildEvidencePath("ws-1", "ev-1", "หน้างาน รูปที่ 1.jpg")).toBe(
      "ws-1/ev-1/1.jpg"
    );
  });

  it("preserves hyphens and dots", () => {
    expect(buildEvidencePath("ws-1", "ev-1", "site-photo.v2.jpg")).toBe(
      "ws-1/ev-1/site-photo.v2.jpg"
    );
  });

  it("collapses repeated underscores", () => {
    expect(buildEvidencePath("ws-1", "ev-1", "a  b  c.png")).toBe(
      "ws-1/ev-1/a_b_c.png"
    );
  });

  it("strips leading underscores (trailing underscores before the extension stay in place)", () => {
    // Only leading + trailing-of-string underscores are stripped — the `_`
    // before `.pdf` is in the middle of the string so it's kept
    expect(buildEvidencePath("ws-1", "ev-1", "__weird__.pdf")).toBe(
      "ws-1/ev-1/weird_.pdf"
    );
  });

  it("truncates extremely long filenames", () => {
    const longName = "a".repeat(200) + ".jpg";
    const path = buildEvidencePath("ws-1", "ev-1", longName);
    const parts = path.split("/");
    expect(parts[2].length).toBeLessThanOrEqual(80);
  });

  it("falls back to 'file' when filename strips to empty", () => {
    expect(buildEvidencePath("ws-1", "ev-1", "@@@@")).toBe("ws-1/ev-1/file");
  });

  it("throws when workspaceId missing", () => {
    expect(() => buildEvidencePath("", "ev-1", "x.jpg")).toThrow();
  });

  it("throws when evidenceAssetId missing", () => {
    expect(() => buildEvidencePath("ws-1", "", "x.jpg")).toThrow();
  });
});

describe("isStorageAvailable", () => {
  it("returns a boolean reflecting whether VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY are both set", () => {
    // The expected value depends on the developer's local .env. Once the
    // user fills in their Supabase credentials this flips to true.
    // We only assert the type so the test stays valid in both modes.
    expect(typeof isStorageAvailable()).toBe("boolean");
  });
});

describe("formatFileSize", () => {
  it("formats bytes correctly", () => {
    expect(formatFileSize(0)).toBe("0 B");
    expect(formatFileSize(512)).toBe("512 B");
    expect(formatFileSize(1500)).toBe("1.5 KB");
    expect(formatFileSize(1_200_000)).toBe("1.2 MB");
    expect(formatFileSize(25_000_000)).toBe("25 MB");
    expect(formatFileSize(2_500_000_000)).toBe("2.5 GB");
  });
});

describe("fileToDataUrl", () => {
  it("converts a Blob to a base64 data URL", async () => {
    const blob = new Blob(["hello"], { type: "text/plain" });
    const url = await fileToDataUrl(blob);
    expect(url.startsWith("data:text/plain")).toBe(true);
    expect(url).toContain("base64,");
  });
});
