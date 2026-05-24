import { describe, expect, it } from "vitest";
import { parseSheetCsv, toGoogleSheetCsvUrl } from "./sheets";

describe("toGoogleSheetCsvUrl", () => {
  it("keeps an existing csv export url unchanged", () => {
    const url = "https://docs.google.com/spreadsheets/d/sheet-id/export?format=csv&gid=123";
    expect(toGoogleSheetCsvUrl(url)).toBe(url);
  });

  it("converts a Google Sheets edit url into a csv export url", () => {
    expect(
      toGoogleSheetCsvUrl(
        "https://docs.google.com/spreadsheets/d/abcDEF_123/edit?gid=987#gid=987"
      )
    ).toBe("https://docs.google.com/spreadsheets/d/abcDEF_123/export?format=csv&gid=987");
  });

  it("returns non-Google input unchanged so callers can show a clear fetch error", () => {
    expect(toGoogleSheetCsvUrl("https://example.com/file.csv")).toBe(
      "https://example.com/file.csv"
    );
  });
});

describe("parseSheetCsv", () => {
  it("parses English headers, quoted commas, and thousand separators", () => {
    const result = parseSheetCsv(`item,unit,quantity,unit price
"Concrete, 240 ksc",m3,2,"1,250"
Steel,kg,10,32.5`);

    expect(result.items).toEqual([
      { id: 1, name: "Concrete, 240 ksc", unit: "m3", qty: 2, price: 1250 },
      { id: 2, name: "Steel", unit: "kg", qty: 10, price: 32.5 }
    ]);
    expect(result.sourceLabel).toContain("2");
  });

  it("skips empty rows and rows with invalid quantity, then coerces invalid price to zero", () => {
    const result = parseSheetCsv(`name,unit,qty,price
Valid item,job,1,500
Missing qty,job,0,300
Missing price,job,2,not-a-number
,,,`);

    expect(result.items).toHaveLength(2);
    expect(result.items[0]).toMatchObject({ name: "Valid item", qty: 1, price: 500 });
    expect(result.items[1]).toMatchObject({ name: "Missing price", qty: 2, price: 0 });
  });

  it("uses the default unit when the CSV has no unit column", () => {
    const result = parseSheetCsv(`description,qty,price
Site setup,1,750`);

    expect(result.items[0].unit).toBeTruthy();
    expect(result.items[0].name).toBe("Site setup");
  });

  it("throws when required columns are missing", () => {
    expect(() => parseSheetCsv(`item,unit
Site setup,job`)).toThrow();
  });
});
