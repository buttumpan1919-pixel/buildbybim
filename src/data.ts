export type DocumentType = "quote" | "purchaseOrder" | "invoice" | "receipt" | "contract";

export type LineItem = {
  id: number;
  name: string;
  unit: string;
  qty: number;
  price: number;
  source?: {
    kind: "boq";
    key: string;
    label: string;
  };
};

export type BoqPriceStatus = "current" | "watch" | "archived";
export type BoqPublishStatus = "public" | "review" | "private";

export type BoqCatalogRow = {
  id?: string;
  keynote: string;
  item: string;
  unit: string;
  allowance: string;
  material: string;
  labor: string;
  level: 1 | 2 | 3;
  brand?: string;
  supplier?: string;
  priceStatus?: BoqPriceStatus;
  publishStatus?: BoqPublishStatus;
  priceVersion?: string;
  source?: string;
  dataOwner?: string;
  license?: string;
  suggestedCostCodeId?: string;
  updatedAt?: string;
  note?: string;
};

export type Milestone = {
  id: number;
  name: string;
  percent: number;
  due: string;
  status: "pending" | "ready" | "paid";
};

export type DocumentInfo = {
  documentNo: string;
  contractNo: string;
  issueDate: string;
  companyName: string;
  companyAddress: string;
  companyTaxId: string;
  companyPhone: string;
  clientName: string;
  clientAddress: string;
  clientPhone: string;
  projectName: string;
  templateName: string;
  creditTerms: string;
  paymentTerms: string;
  notes: string;
  signerName: string;
};

export type ContractTemplate = {
  id: string;
  name: string;
  subtitle: string;
  useCase: string;
  duration: string;
  warranty: string;
  retention: string;
  clauses: string[];
};

export const initialItems: LineItem[] = [
  { id: 1, name: "งานรื้อถอนและเตรียมพื้นที่", unit: "งาน", qty: 1, price: 18500 },
  { id: 2, name: "งานโครงสร้างคอนกรีตเสริมเหล็ก", unit: "ตร.ม.", qty: 86, price: 1450 },
  { id: 3, name: "งานผนัง อิฐมวลเบา ฉาบเรียบ", unit: "ตร.ม.", qty: 120, price: 520 },
  { id: 4, name: "งานระบบไฟฟ้าและสุขาภิบาล", unit: "จุด", qty: 28, price: 1850 }
];

export const boqCatalogRows: BoqCatalogRow[] = [
  {
    id: "seed-A",
    keynote: "A",
    item: "หมวดงานวิศวกรรมโครงสร้าง",
    unit: "-",
    allowance: "-",
    material: "-",
    labor: "-",
    level: 1,
    priceVersion: "BBB_Database_2025",
    source: "seed"
  },
  {
    id: "seed-A1",
    keynote: "A1",
    item: "งานดิน หิน ทราย และฐานราก",
    unit: "-",
    allowance: "-",
    material: "-",
    labor: "-",
    level: 2,
    priceVersion: "BBB_Database_2025",
    source: "seed"
  },
  {
    id: "seed-A1000-standard-2025",
    keynote: "A1000",
    item: "ขุดดินทั่วไปพร้อมขนย้ายออกจากพื้นที่",
    unit: "ลบ.ม.",
    allowance: "5%",
    material: "0",
    labor: "185",
    level: 3,
    brand: "มาตรฐาน",
    supplier: "ราคากลาง",
    priceStatus: "current",
    priceVersion: "BBB_Database_2025",
    source: "seed",
    updatedAt: "2026-05-22"
  },
  {
    id: "seed-A3000-standard-2025",
    keynote: "A3000",
    item: "งานคอนกรีตโครงสร้าง กำลังอัด 240 ksc",
    unit: "ลบ.ม.",
    allowance: "3%",
    material: "2,580",
    labor: "620",
    level: 3,
    brand: "คอนกรีตผสมเสร็จ",
    supplier: "ราคากลาง",
    priceStatus: "current",
    priceVersion: "BBB_Database_2025",
    source: "seed",
    updatedAt: "2026-05-22"
  },
  {
    id: "seed-A5000-standard-2025",
    keynote: "A5000",
    item: "เหล็กเสริมคอนกรีต SD40 ขึ้นรูปและติดตั้ง",
    unit: "กก.",
    allowance: "7%",
    material: "25.50",
    labor: "5.20",
    level: 3,
    brand: "SD40",
    supplier: "ราคากลาง",
    priceStatus: "current",
    priceVersion: "BBB_Database_2025",
    source: "seed",
    updatedAt: "2026-05-22"
  },
  {
    id: "seed-F1",
    keynote: "F1",
    item: "เตรียมงานและอำนวยการ (Site Preparation & Management)",
    unit: "-",
    allowance: "-",
    material: "-",
    labor: "-",
    level: 2,
    priceVersion: "BBB_Database_2025",
    source: "seed"
  }
];

function parseBoqNumber(value: string) {
  const parsed = Number(value.replace(/,/g, "").replace("%", "").trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

export function getBoqRowUnitPrice(row: BoqCatalogRow) {
  if (row.level < 3) {
    return 0;
  }

  const basePrice = parseBoqNumber(row.material) + parseBoqNumber(row.labor);
  const allowanceRate = row.allowance.includes("%") ? parseBoqNumber(row.allowance) / 100 : 0;

  return Math.round(basePrice * (1 + allowanceRate));
}

export function createLineItemFromBoqRow(row: BoqCatalogRow, id: number): LineItem {
  return {
    id,
    name: `${row.keynote} - ${row.item}`,
    unit: row.unit === "-" ? "งาน" : row.unit,
    qty: 1,
    price: getBoqRowUnitPrice(row),
    source: {
      kind: "boq",
      key: row.keynote,
      label: [row.item, row.brand, row.supplier, row.priceVersion].filter(Boolean).join(" · ")
    }
  };
}

export const initialDocumentInfo: DocumentInfo = {
  documentNo: "QT-2026-0522",
  contractNo: "CT-2026-0522",
  issueDate: "22/05/2569",
  companyName: "บริษัท บิลด์ด็อกส์ จำกัด",
  companyAddress: "88/12 ถ.มิตรภาพ อ.เมือง จ.ขอนแก่น",
  companyTaxId: "0-5555-55555-55-5",
  companyPhone: "081-234-5678",
  clientName: "คุณสมชาย วงศ์ก่อสร้าง",
  clientAddress: "123 หมู่ 5 ต.เหนือเมือง อ.เมือง จ.ร้อยเอ็ด",
  clientPhone: "081-987-6543",
  projectName: "รีโนเวทบ้านพัก 2 ชั้น",
  templateName: "งานรีโนเวทบ้าน",
  creditTerms: "7 วันหลังอนุมัติ",
  paymentTerms: "มัดจำก่อนเริ่มงาน 30% - เมื่ออนุมัติใบเสนอราคา",
  notes: "ราคานี้รวมค่าแรงและวัสดุตามรายการ ระยะเวลาก่อสร้างประมาณ 90-120 วัน",
  signerName: "ผู้จัดการ"
};

export const initialMilestones: Milestone[] = [
  { id: 1, name: "มัดจำก่อนเริ่มงาน", percent: 30, due: "เมื่ออนุมัติใบเสนอราคา", status: "ready" },
  { id: 2, name: "งวดงานโครงสร้าง", percent: 40, due: "หลังตรวจรับโครงสร้าง", status: "pending" },
  { id: 3, name: "งวดส่งมอบงาน", percent: 30, due: "หลังตรวจรับงานทั้งหมด", status: "pending" }
];

export const documentLabels: Record<DocumentType, string> = {
  quote: "ใบเสนอราคา",
  purchaseOrder: "ใบสั่งซื้อ",
  invoice: "ใบแจ้งหนี้",
  receipt: "ใบเสร็จรับเงิน",
  contract: "สัญญารับเหมา"
};

export const contractTemplates: ContractTemplate[] = [
  {
    id: "fixed-price",
    name: "เหมารวมวัสดุและค่าแรง",
    subtitle: "เหมาะกับงานที่แบบและสเปกชัดเจน",
    useCase: "งานบ้านพัก รีโนเวท หรืองานต่อเติมที่มี BOQ แนบสัญญา",
    duration: "90 วัน นับจากวันที่รับมอบพื้นที่",
    warranty: "รับประกันงานก่อสร้าง 12 เดือน",
    retention: "หักประกันผลงาน 5% จ่ายคืนหลังพ้นระยะประกัน",
    clauses: [
      "ผู้รับจ้างจัดหาวัสดุ เครื่องมือ แรงงาน และควบคุมงานให้เป็นไปตามแบบและ BOQ",
      "การเปลี่ยนแปลงงานต้องได้รับอนุมัติเป็นลายลักษณ์อักษรก่อนดำเนินการ",
      "ผู้ว่าจ้างชำระเงินตามงวดงานหลังตรวจรับงานแต่ละงวด"
    ]
  },
  {
    id: "labor-only",
    name: "เหมาค่าแรง",
    subtitle: "ผู้ว่าจ้างจัดหาวัสดุหลักเอง",
    useCase: "งานที่เจ้าของบ้านซื้อวัสดุเองและต้องการจ้างทีมช่างเฉพาะค่าแรง",
    duration: "60 วัน นับจากวันที่เริ่มงาน",
    warranty: "รับประกันฝีมือแรงงาน 6 เดือน",
    retention: "หักประกันผลงาน 3% จ่ายคืนหลังตรวจรับงานครบ",
    clauses: [
      "ผู้ว่าจ้างเป็นผู้จัดเตรียมวัสดุหลักให้เพียงพอตามแผนงาน",
      "ผู้รับจ้างรับผิดชอบแรงงาน เครื่องมือพื้นฐาน และความเรียบร้อยของงาน",
      "วัสดุขาดหรือส่งล่าช้าให้ขยายเวลางานตามจำนวนวันที่กระทบจริง"
    ]
  },
  {
    id: "progress-payment",
    name: "รับเหมาแบ่งงวด",
    subtitle: "ใช้กับงานที่ต้องตรวจรับตาม milestone",
    useCase: "งานก่อสร้างขนาดกลางที่ต้องแยกงวดมัดจำ โครงสร้าง ระบบ และส่งมอบ",
    duration: "120 วัน หรือตามแผนงานแนบท้ายสัญญา",
    warranty: "รับประกันงาน 12 เดือน ยกเว้นความเสียหายจากการใช้งานผิดวิธี",
    retention: "กันเงินงวดสุดท้าย 10% จนกว่างานแก้ไขแล้วเสร็จ",
    clauses: [
      "แต่ละงวดต้องมีรูปถ่ายหน้างาน รายการตรวจรับ และลายเซ็นผู้เกี่ยวข้อง",
      "หากมีงานเพิ่ม-ลด ให้ทำใบเปลี่ยนแปลงงานพร้อมราคาและผลต่อระยะเวลา",
      "ผู้ว่าจ้างมีสิทธิชะลอจ่ายเฉพาะส่วนที่ยังไม่ผ่านตรวจรับ"
    ]
  },
  {
    id: "design-build",
    name: "ออกแบบพร้อมก่อสร้าง",
    subtitle: "รวมงานแบบ 3D/แบบก่อสร้าง/งานก่อสร้าง",
    useCase: "ทีม design-build ที่รับตั้งแต่ออกแบบจนส่งมอบงานจริง",
    duration: "30 วันสำหรับออกแบบ และ 120 วันสำหรับก่อสร้าง",
    warranty: "รับประกันงานออกแบบตามขอบเขต และงานก่อสร้าง 12 เดือน",
    retention: "ชำระค่าออกแบบแยกจากงวดก่อสร้าง หักประกันผลงานเฉพาะงานก่อสร้าง",
    clauses: [
      "แบบและรายการวัสดุต้องได้รับอนุมัติก่อนเริ่มจัดซื้อหรือก่อสร้าง",
      "สิทธิใช้งานแบบเป็นของผู้ว่าจ้างหลังชำระค่าบริการครบถ้วน",
      "งานเปลี่ยนจากแบบที่อนุมัติแล้วให้คิดเป็นงานเพิ่มตามราคาที่ตกลงใหม่"
    ]
  }
];
