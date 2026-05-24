import { describe, expect, it } from "vitest";
import {
  dateStampForFilename,
  escapeCsvValue,
  rowsToCsv
} from "./csvExport";

const BOM = "﻿";

describe("escapeCsvValue", () => {
  it("returns empty string for null/undefined", () => {
    expect(escapeCsvValue(null)).toBe("");
    expect(escapeCsvValue(undefined)).toBe("");
  });

  it("returns value unchanged when no special chars", () => {
    expect(escapeCsvValue("hello")).toBe("hello");
    expect(escapeCsvValue(42)).toBe("42");
  });

  it("quotes fields containing commas", () => {
    expect(escapeCsvValue("hello, world")).toBe('"hello, world"');
  });

  it("quotes fields containing newlines", () => {
    expect(escapeCsvValue("line1\nline2")).toBe('"line1\nline2"');
    expect(escapeCsvValue("line1\r\nline2")).toBe('"line1\r\nline2"');
  });

  it("escapes embedded double quotes", () => {
    expect(escapeCsvValue('he said "hi"')).toBe('"he said ""hi"""');
  });

  it("handles Thai characters", () => {
    expect(escapeCsvValue("ปูนซีเมนต์")).toBe("ปูนซีเมนต์");
    expect(escapeCsvValue("ปูน, ทราย")).toBe('"ปูน, ทราย"');
  });

  it("converts booleans to true/false", () => {
    expect(escapeCsvValue(true)).toBe("true");
    expect(escapeCsvValue(false)).toBe("false");
  });
});

describe("rowsToCsv", () => {
  it("includes UTF-8 BOM at start by default", () => {
    const csv = rowsToCsv(["a"], [{ a: "1" }]);
    expect(csv.startsWith(BOM)).toBe(true);
  });

  it("omits BOM when includeBom=false", () => {
    const csv = rowsToCsv(["a"], [{ a: "1" }], { includeBom: false });
    expect(csv.startsWith(BOM)).toBe(false);
    expect(csv).toBe("a\r\n1");
  });

  it("uses CRLF line endings", () => {
    const csv = rowsToCsv(["a", "b"], [{ a: "1", b: "2" }, { a: "3", b: "4" }]);
    expect(csv).toContain("\r\n");
    expect(csv.split("\r\n")).toHaveLength(3); // header + 2 rows
  });

  it("handles empty rows", () => {
    const csv = rowsToCsv(["a"], []);
    expect(csv).toBe(`${BOM}a`);
  });

  it("escapes header fields too", () => {
    const csv = rowsToCsv(["a,b", "c"], [{ "a,b": "1", c: "2" }]);
    expect(csv).toContain(`"a,b",c`);
  });

  it("renders missing fields as empty", () => {
    const csv = rowsToCsv(["a", "b"], [{ a: 1 } as Record<string, string | number>, { a: 2, b: "x" }]);
    const lines = csv.replace(BOM, "").split("\r\n");
    expect(lines[1]).toBe("1,");
    expect(lines[2]).toBe("2,x");
  });

  it("round-trips Thai data", () => {
    const csv = rowsToCsv(
      ["code", "name"],
      [{ code: "01-100", name: "ปรับระดับ" }]
    );
    expect(csv).toContain("ปรับระดับ");
    expect(csv).toContain("01-100");
  });
});

describe("dateStampForFilename", () => {
  it("returns YYYY-MM-DD", () => {
    expect(dateStampForFilename(new Date("2026-05-24T12:34:56Z"))).toBe("2026-05-24");
  });
});
