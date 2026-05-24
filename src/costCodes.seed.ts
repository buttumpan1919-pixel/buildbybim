// Thai construction cost code seed catalog — Sprint 1 (Builk parity)
// Spec: docs/COST_CODES_PRD.md Section 4.2
//
// ~100 codes across 7 categories: site (01) / structure (02) / architecture
// (03) / mep (04) / finishing (05) / external (06) / indirect (07).
//
// Pricing references:
//   - ตำราราคามาตรฐานก่อสร้างของสำนักงบประมาณ (public domain estimate)
//   - ราคากลางผู้รับเหมาทั่วไป กรุงเทพ-ปริมณฑล 2025-2026
//
// All seeds: workspaceId === "" → shared system catalog. UI marks them
// read-only; user can copy + override into workspace.

import type { CostCode, CostCodeCategory, CostCodeUnit } from "./costCodes";

type SeedInput = {
  code: string;
  parentCode?: string;
  name: string;
  nameEn?: string;
  category: CostCodeCategory;
  defaultUnit: CostCodeUnit;
  defaultUnitPrice?: number;
  description?: string;
};

const SEED_INPUTS: SeedInput[] = [
  // ─── 01 Site (~10) ────────────────────────────────────────────────────────
  { code: "01", name: "งานเตรียมพื้นที่", nameEn: "Site Work", category: "site", defaultUnit: "lump_sum" },
  { code: "01-100", parentCode: "01", name: "งานปรับระดับ", nameEn: "Grading", category: "site", defaultUnit: "sq_m", defaultUnitPrice: 120 },
  { code: "01-110", parentCode: "01", name: "งานปรับระดับ (เครื่องจักรหนัก)", category: "site", defaultUnit: "sq_m", defaultUnitPrice: 180 },
  { code: "01-200", parentCode: "01", name: "งานรื้อถอนอาคารเดิม", category: "site", defaultUnit: "sq_m", defaultUnitPrice: 200 },
  { code: "01-300", parentCode: "01", name: "งานขุดดิน", nameEn: "Excavation", category: "site", defaultUnit: "cubic_m", defaultUnitPrice: 85 },
  { code: "01-400", parentCode: "01", name: "งานถมดิน-ปรับพื้น", category: "site", defaultUnit: "cubic_m", defaultUnitPrice: 110 },
  { code: "01-500", parentCode: "01", name: "งานรั้วชั่วคราว/site fence", category: "site", defaultUnit: "linear_m", defaultUnitPrice: 220 },
  { code: "01-600", parentCode: "01", name: "งานทำสำนักงานชั่วคราว", category: "site", defaultUnit: "lump_sum", defaultUnitPrice: 35000 },
  { code: "01-700", parentCode: "01", name: "งานน้ำ-ไฟชั่วคราว", category: "site", defaultUnit: "lump_sum", defaultUnitPrice: 15000 },
  { code: "01-800", parentCode: "01", name: "งานเก็บกวาดทำความสะอาดส่งงาน", category: "site", defaultUnit: "lump_sum", defaultUnitPrice: 8000 },

  // ─── 02 Structure (~15) ───────────────────────────────────────────────────
  { code: "02", name: "งานโครงสร้าง", nameEn: "Structure", category: "structure", defaultUnit: "lump_sum" },
  { code: "02-100", parentCode: "02", name: "เสาเข็มเจาะ", nameEn: "Bored pile", category: "structure", defaultUnit: "piece", defaultUnitPrice: 8500 },
  { code: "02-110", parentCode: "02", name: "เสาเข็มตอก", nameEn: "Driven pile", category: "structure", defaultUnit: "piece", defaultUnitPrice: 4200 },
  { code: "02-120", parentCode: "02", name: "ฐานราก คสล.", category: "structure", defaultUnit: "cubic_m", defaultUnitPrice: 5800 },
  { code: "02-200", parentCode: "02", name: "เสา คสล.", nameEn: "RC column", category: "structure", defaultUnit: "cubic_m", defaultUnitPrice: 3200 },
  { code: "02-300", parentCode: "02", name: "คาน คสล.", nameEn: "RC beam", category: "structure", defaultUnit: "cubic_m", defaultUnitPrice: 3500 },
  { code: "02-400", parentCode: "02", name: "พื้น คสล.", nameEn: "RC slab", category: "structure", defaultUnit: "sq_m", defaultUnitPrice: 850 },
  { code: "02-410", parentCode: "02", name: "พื้นสำเร็จรูป", category: "structure", defaultUnit: "sq_m", defaultUnitPrice: 620 },
  { code: "02-500", parentCode: "02", name: "บันได คสล.", category: "structure", defaultUnit: "set", defaultUnitPrice: 45000 },
  { code: "02-510", parentCode: "02", name: "บันไดเหล็ก", category: "structure", defaultUnit: "set", defaultUnitPrice: 38000 },
  { code: "02-600", parentCode: "02", name: "โครงหลังคาเหล็ก", category: "structure", defaultUnit: "sq_m", defaultUnitPrice: 580 },
  { code: "02-610", parentCode: "02", name: "โครงหลังคาไม้", category: "structure", defaultUnit: "sq_m", defaultUnitPrice: 720 },
  { code: "02-700", parentCode: "02", name: "เหล็กรูปพรรณรับโครงสร้าง", category: "structure", defaultUnit: "kg", defaultUnitPrice: 45 },
  { code: "02-800", parentCode: "02", name: "เหล็กเส้นเสริมคอนกรีต", category: "structure", defaultUnit: "ton", defaultUnitPrice: 26500 },
  { code: "02-900", parentCode: "02", name: "ไม้แบบ-นั่งร้าน", category: "structure", defaultUnit: "sq_m", defaultUnitPrice: 280 },

  // ─── 03 Architecture (~20) ────────────────────────────────────────────────
  { code: "03", name: "งานสถาปัตยกรรม", nameEn: "Architecture", category: "architecture", defaultUnit: "lump_sum" },
  { code: "03-100", parentCode: "03", name: "ผนังก่ออิฐมอญ", category: "architecture", defaultUnit: "sq_m", defaultUnitPrice: 380 },
  { code: "03-110", parentCode: "03", name: "ผนังก่ออิฐมวลเบา", category: "architecture", defaultUnit: "sq_m", defaultUnitPrice: 420 },
  { code: "03-120", parentCode: "03", name: "ผนังคอนกรีตบล็อก", category: "architecture", defaultUnit: "sq_m", defaultUnitPrice: 350 },
  { code: "03-130", parentCode: "03", name: "ผนัง drywall (Gypsum)", category: "architecture", defaultUnit: "sq_m", defaultUnitPrice: 480 },
  { code: "03-200", parentCode: "03", name: "ฉาบปูน 2 ด้าน", category: "architecture", defaultUnit: "sq_m", defaultUnitPrice: 180 },
  { code: "03-210", parentCode: "03", name: "ฉาบปูนเรียบ", category: "architecture", defaultUnit: "sq_m", defaultUnitPrice: 220 },
  { code: "03-300", parentCode: "03", name: "ติดประตูไม้+วงกบ", category: "architecture", defaultUnit: "set", defaultUnitPrice: 4500 },
  { code: "03-310", parentCode: "03", name: "ติดประตู PVC ห้องน้ำ", category: "architecture", defaultUnit: "set", defaultUnitPrice: 2800 },
  { code: "03-320", parentCode: "03", name: "ติดประตูบานเลื่อนกระจก", category: "architecture", defaultUnit: "set", defaultUnitPrice: 18500 },
  { code: "03-330", parentCode: "03", name: "ติดประตูเหล็กม้วน", category: "architecture", defaultUnit: "sq_m", defaultUnitPrice: 1800 },
  { code: "03-400", parentCode: "03", name: "ติดหน้าต่าง UPVC", category: "architecture", defaultUnit: "set", defaultUnitPrice: 6500 },
  { code: "03-410", parentCode: "03", name: "ติดหน้าต่างอลูมิเนียม", category: "architecture", defaultUnit: "set", defaultUnitPrice: 4800 },
  { code: "03-500", parentCode: "03", name: "ฝ้าเพดานยิปซั่ม", category: "architecture", defaultUnit: "sq_m", defaultUnitPrice: 380 },
  { code: "03-510", parentCode: "03", name: "ฝ้าเพดาน T-bar", category: "architecture", defaultUnit: "sq_m", defaultUnitPrice: 320 },
  { code: "03-520", parentCode: "03", name: "ฝ้าฉาบเรียบ", category: "architecture", defaultUnit: "sq_m", defaultUnitPrice: 450 },
  { code: "03-600", parentCode: "03", name: "ติดตั้งกระเบื้องผนัง", category: "architecture", defaultUnit: "sq_m", defaultUnitPrice: 580 },
  { code: "03-700", parentCode: "03", name: "งานหินขัด/หินอ่อนผนัง", category: "architecture", defaultUnit: "sq_m", defaultUnitPrice: 1250 },
  { code: "03-800", parentCode: "03", name: "งานกันรั่วซึม (waterproofing)", category: "architecture", defaultUnit: "sq_m", defaultUnitPrice: 320 },
  { code: "03-900", parentCode: "03", name: "งานฉนวนกันความร้อน", category: "architecture", defaultUnit: "sq_m", defaultUnitPrice: 250 },

  // ─── 04 MEP (~15) ─────────────────────────────────────────────────────────
  { code: "04", name: "งานระบบ MEP", nameEn: "MEP Systems", category: "mep", defaultUnit: "lump_sum" },
  { code: "04-100", parentCode: "04", name: "ระบบประปาภายใน", category: "mep", defaultUnit: "linear_m", defaultUnitPrice: 280 },
  { code: "04-110", parentCode: "04", name: "ระบบประปาภายนอก-เมนเข้าบ้าน", category: "mep", defaultUnit: "lump_sum", defaultUnitPrice: 25000 },
  { code: "04-120", parentCode: "04", name: "ปั๊มน้ำ+ถังเก็บน้ำ", category: "mep", defaultUnit: "set", defaultUnitPrice: 18500 },
  { code: "04-200", parentCode: "04", name: "ระบบไฟฟ้าภายใน (เมน+ย่อย)", category: "mep", defaultUnit: "lump_sum", defaultUnitPrice: 75000 },
  { code: "04-210", parentCode: "04", name: "เดินสายไฟในบ้าน", category: "mep", defaultUnit: "linear_m", defaultUnitPrice: 150 },
  { code: "04-220", parentCode: "04", name: "ตู้ Consumer Unit", category: "mep", defaultUnit: "set", defaultUnitPrice: 8500 },
  { code: "04-230", parentCode: "04", name: "ติดตั้งโคมไฟ", category: "mep", defaultUnit: "set", defaultUnitPrice: 850 },
  { code: "04-300", parentCode: "04", name: "ติดตั้งสุขภัณฑ์ครบชุด", category: "mep", defaultUnit: "set", defaultUnitPrice: 18500 },
  { code: "04-310", parentCode: "04", name: "ติดตั้งฉากกั้นอาบน้ำ", category: "mep", defaultUnit: "set", defaultUnitPrice: 12500 },
  { code: "04-400", parentCode: "04", name: "ระบบแอร์ — เครื่อง+ติดตั้ง", category: "mep", defaultUnit: "set", defaultUnitPrice: 28500 },
  { code: "04-410", parentCode: "04", name: "ระบบ ductless / multi-split", category: "mep", defaultUnit: "set", defaultUnitPrice: 65000 },
  { code: "04-500", parentCode: "04", name: "ระบบ CCTV", category: "mep", defaultUnit: "set", defaultUnitPrice: 32000 },
  { code: "04-510", parentCode: "04", name: "ระบบสัญญาณกันขโมย", category: "mep", defaultUnit: "set", defaultUnitPrice: 18500 },
  { code: "04-600", parentCode: "04", name: "ระบบ solar / PV rooftop", category: "mep", defaultUnit: "kg", defaultUnitPrice: 35000 },

  // ─── 05 Finishing (~20) ───────────────────────────────────────────────────
  { code: "05", name: "งานตกแต่ง", nameEn: "Finishing", category: "finishing", defaultUnit: "lump_sum" },
  { code: "05-100", parentCode: "05", name: "ปูพื้นกระเบื้องเซรามิก", category: "finishing", defaultUnit: "sq_m", defaultUnitPrice: 520 },
  { code: "05-110", parentCode: "05", name: "ปูพื้นกระเบื้องแกรนิตโต้", category: "finishing", defaultUnit: "sq_m", defaultUnitPrice: 780 },
  { code: "05-120", parentCode: "05", name: "ปูพื้นหินอ่อน", category: "finishing", defaultUnit: "sq_m", defaultUnitPrice: 1850 },
  { code: "05-200", parentCode: "05", name: "พื้นลามิเนต", category: "finishing", defaultUnit: "sq_m", defaultUnitPrice: 850 },
  { code: "05-210", parentCode: "05", name: "พื้นไม้เอ็นจิเนียร์", category: "finishing", defaultUnit: "sq_m", defaultUnitPrice: 1450 },
  { code: "05-220", parentCode: "05", name: "พื้น SPC vinyl", category: "finishing", defaultUnit: "sq_m", defaultUnitPrice: 680 },
  { code: "05-300", parentCode: "05", name: "ทาสีภายในรองพื้น+ทับหน้า", category: "finishing", defaultUnit: "sq_m", defaultUnitPrice: 95 },
  { code: "05-310", parentCode: "05", name: "ทาสีภายนอก (พิเศษ acrylic)", category: "finishing", defaultUnit: "sq_m", defaultUnitPrice: 145 },
  { code: "05-320", parentCode: "05", name: "ทาสีกันร้อน/สะท้อนแสง", category: "finishing", defaultUnit: "sq_m", defaultUnitPrice: 185 },
  { code: "05-400", parentCode: "05", name: "บิวท์อินครัว", category: "finishing", defaultUnit: "linear_m", defaultUnitPrice: 8500 },
  { code: "05-410", parentCode: "05", name: "บิวท์อินตู้เสื้อผ้า", category: "finishing", defaultUnit: "linear_m", defaultUnitPrice: 6500 },
  { code: "05-420", parentCode: "05", name: "บิวท์อินห้องน้ำ", category: "finishing", defaultUnit: "set", defaultUnitPrice: 22000 },
  { code: "05-500", parentCode: "05", name: "ติดมุ้งลวดประตู-หน้าต่าง", category: "finishing", defaultUnit: "set", defaultUnitPrice: 1850 },
  { code: "05-600", parentCode: "05", name: "wallpaper", category: "finishing", defaultUnit: "sq_m", defaultUnitPrice: 480 },
  { code: "05-700", parentCode: "05", name: "เพดานยิปซั่มหลุม", category: "finishing", defaultUnit: "sq_m", defaultUnitPrice: 580 },
  { code: "05-800", parentCode: "05", name: "ติดตั้งราวบันได/มือจับ", category: "finishing", defaultUnit: "linear_m", defaultUnitPrice: 1850 },
  { code: "05-810", parentCode: "05", name: "ติดตั้งราวระเบียง", category: "finishing", defaultUnit: "linear_m", defaultUnitPrice: 2450 },
  { code: "05-900", parentCode: "05", name: "ติดตั้งกระจกเงา+ตู้เก็บของ", category: "finishing", defaultUnit: "set", defaultUnitPrice: 4500 },
  { code: "05-910", parentCode: "05", name: "งานป้ายชื่อบ้าน-เลขที่", category: "finishing", defaultUnit: "set", defaultUnitPrice: 2500 },

  // ─── 06 External (~10) ────────────────────────────────────────────────────
  { code: "06", name: "งานภายนอก", nameEn: "External Works", category: "external", defaultUnit: "lump_sum" },
  { code: "06-100", parentCode: "06", name: "ปูทางเดิน-หินแกรนิต", category: "external", defaultUnit: "sq_m", defaultUnitPrice: 950 },
  { code: "06-110", parentCode: "06", name: "ปูทางเดินบล็อกตัวหนอน", category: "external", defaultUnit: "sq_m", defaultUnitPrice: 480 },
  { code: "06-200", parentCode: "06", name: "จัดสวน landscape", category: "external", defaultUnit: "sq_m", defaultUnitPrice: 850 },
  { code: "06-210", parentCode: "06", name: "ปลูกต้นไม้ใหญ่+ค้ำยัน", category: "external", defaultUnit: "piece", defaultUnitPrice: 4500 },
  { code: "06-300", parentCode: "06", name: "ระบบรดน้ำอัตโนมัติ", category: "external", defaultUnit: "lump_sum", defaultUnitPrice: 38500 },
  { code: "06-400", parentCode: "06", name: "รั้วถาวร — กำแพง+เสา", category: "external", defaultUnit: "linear_m", defaultUnitPrice: 4500 },
  { code: "06-410", parentCode: "06", name: "ประตูรั้วเหล็ก+มอเตอร์", category: "external", defaultUnit: "set", defaultUnitPrice: 38500 },
  { code: "06-500", parentCode: "06", name: "ที่จอดรถ — พื้นคอนกรีต", category: "external", defaultUnit: "sq_m", defaultUnitPrice: 750 },
  { code: "06-510", parentCode: "06", name: "หลังคาที่จอดรถ", category: "external", defaultUnit: "sq_m", defaultUnitPrice: 1850 },

  // ─── 07 Indirect (~10) ────────────────────────────────────────────────────
  { code: "07", name: "ค่าใช้จ่ายทางอ้อม", nameEn: "Indirect Costs", category: "indirect", defaultUnit: "lump_sum" },
  { code: "07-100", parentCode: "07", name: "ค่าแรงควบคุมงาน (วิศวกรไซต์)", category: "indirect", defaultUnit: "month", defaultUnitPrice: 35000 },
  { code: "07-110", parentCode: "07", name: "ค่าแรง foreman", category: "indirect", defaultUnit: "month", defaultUnitPrice: 22000 },
  { code: "07-200", parentCode: "07", name: "ค่าออกแบบสถาปัตยกรรม", category: "indirect", defaultUnit: "lump_sum", defaultUnitPrice: 85000 },
  { code: "07-210", parentCode: "07", name: "ค่าออกแบบโครงสร้าง", category: "indirect", defaultUnit: "lump_sum", defaultUnitPrice: 35000 },
  { code: "07-300", parentCode: "07", name: "ค่าขอใบอนุญาตก่อสร้าง", category: "indirect", defaultUnit: "lump_sum", defaultUnitPrice: 25000 },
  { code: "07-310", parentCode: "07", name: "ค่ามิเตอร์น้ำ-ไฟถาวร", category: "indirect", defaultUnit: "set", defaultUnitPrice: 18500 },
  { code: "07-400", parentCode: "07", name: "ค่าประกันความเสียหายต่อบุคคล", category: "indirect", defaultUnit: "lump_sum", defaultUnitPrice: 12500 },
  { code: "07-500", parentCode: "07", name: "ค่าขนส่งวัสดุ", category: "indirect", defaultUnit: "lump_sum", defaultUnitPrice: 25000 },
  { code: "07-600", parentCode: "07", name: "ค่าจัดเก็บ-รักษาความปลอดภัย", category: "indirect", defaultUnit: "month", defaultUnitPrice: 8500 },
  { code: "07-700", parentCode: "07", name: "กำไรผู้รับเหมา (markup)", category: "indirect", defaultUnit: "lump_sum" }
];

/**
 * Return the canonical Thai construction cost code seed catalog.
 * All seeds carry `workspaceId === ""` — system-shared, read-only.
 * Re-runs return fresh CostCode objects (createdAt = now) — caller is
 * responsible for storing them.
 */
export function seedThaiCostCodes(): CostCode[] {
  const now = new Date().toISOString();
  return SEED_INPUTS.map((s) => ({
    id: `seed-${s.code}`,
    workspaceId: "",
    code: s.code,
    parentCode: s.parentCode ?? "",
    name: s.name,
    nameEn: s.nameEn ?? "",
    description: s.description ?? "",
    category: s.category,
    defaultUnit: s.defaultUnit,
    customUnit: "",
    defaultUnitPrice: s.defaultUnitPrice ?? 0,
    active: true,
    createdAt: now,
    updatedAt: now
  }));
}

export const SEED_THAI_COST_CODE_COUNT = SEED_INPUTS.length;
