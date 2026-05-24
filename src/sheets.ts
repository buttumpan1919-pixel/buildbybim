import { LineItem } from "./data";

const SAMPLE_SHEET_CSV = `รายการ,หน่วย,จำนวน,ราคา/หน่วย
งานรื้อกระเบื้องเดิม,ตร.ม.,48,180
งานปูกระเบื้องพื้น,ตร.ม.,48,520
งานฝ้าเพดานฉาบเรียบ,ตร.ม.,36,650
งานทาสีภายใน,ตร.ม.,180,95
งานติดตั้งสุขภัณฑ์,ชุด,2,4200`;

const headerAliases = {
  name: ["รายการ", "ชื่องาน", "รายละเอียด", "name", "item", "description"],
  unit: ["หน่วย", "unit"],
  qty: ["จำนวน", "ปริมาณ", "qty", "quantity"],
  price: ["ราคา/หน่วย", "ราคาต่อหน่วย", "ราคา", "unit price", "price"]
};

export type SheetImportResult = {
  items: LineItem[];
  sourceLabel: string;
};

export function getSampleSheetCsv() {
  return SAMPLE_SHEET_CSV;
}

export function toGoogleSheetCsvUrl(input: string) {
  const trimmed = input.trim();

  if (!trimmed) {
    return "";
  }

  if (trimmed.includes("format=csv") || trimmed.includes("output=csv")) {
    return trimmed;
  }

  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);

  if (!match) {
    return trimmed;
  }

  const gid = trimmed.match(/[?&#]gid=([0-9]+)/)?.[1] ?? "0";
  return `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv&gid=${gid}`;
}

export function parseSheetCsv(csvText: string): SheetImportResult {
  const rows = parseCsv(csvText).filter((row) => row.some((cell) => cell.trim()));

  if (rows.length < 2) {
    throw new Error("ไม่พบข้อมูลรายการงานใน Sheet");
  }

  const headers = rows[0].map(normalizeHeader);
  const indexes = {
    name: findHeaderIndex(headers, headerAliases.name),
    unit: findHeaderIndex(headers, headerAliases.unit),
    qty: findHeaderIndex(headers, headerAliases.qty),
    price: findHeaderIndex(headers, headerAliases.price)
  };

  if (indexes.name < 0 || indexes.qty < 0 || indexes.price < 0) {
    throw new Error("Sheet ต้องมีคอลัมน์ รายการ, จำนวน, ราคา/หน่วย เป็นอย่างน้อย");
  }

  const items = rows
    .slice(1)
    .map((row, index) => {
      const name = row[indexes.name]?.trim();
      const qty = parseNumber(row[indexes.qty]);
      const price = parseNumber(row[indexes.price]);

      if (!name || qty <= 0 || price < 0) {
        return null;
      }

      return {
        id: index + 1,
        name,
        unit: indexes.unit >= 0 ? row[indexes.unit]?.trim() || "งาน" : "งาน",
        qty,
        price
      };
    })
    .filter((item): item is LineItem => Boolean(item));

  if (!items.length) {
    throw new Error("ไม่พบแถวที่มีรายการ จำนวน และราคา");
  }

  return {
    items,
    sourceLabel: `นำเข้า ${items.length} รายการ`
  };
}

function parseCsv(input: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const next = input[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  row.push(cell);
  rows.push(row);
  return rows;
}

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function findHeaderIndex(headers: string[], aliases: string[]) {
  return headers.findIndex((header) =>
    aliases.some((alias) => header === normalizeHeader(alias))
  );
}

function parseNumber(value = "") {
  const normalized = value.replace(/,/g, "").trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}
