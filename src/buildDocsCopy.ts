import type { DocumentType } from "./data";
import {
  getWorkspaceLanguageCopy,
  type WorkspaceLanguage,
  type WorkspaceLanguageCopyMap
} from "./workspace/shell/workspaceLanguage";

export type BuildDocsDocumentStatus =
  | "draft"
  | "sent"
  | "approved"
  | "billed"
  | "paid"
  | "cancelled";

export type BuildDocsCopy = {
  documentTypeLabels: Record<DocumentType, string>;
  invoiceBillingTitle: string;
  documentStatusAria: string;
  statusLabels: Record<BuildDocsDocumentStatus, string>;
  relationReference: string;
  relationReceiptFrom: string;
  relationPurchaseFrom: string;
  lastSavedPrefix: string;
  neverSaved: string;
  newDocument: string;
  searchPlaceholder: string;
  printOrSavePdf: string;
  duplicateDocument: string;
  importBackup: string;
  exportBackup: string;
  save: string;
  reset: string;
  openReceipt: string;
  issueReceipt: string;
  openBilling: string;
  openPurchaseOrder: string;
  issuePurchaseOrder: string;
  openQuote: string;
  sendDocument: string;
  documentTypesAria: string;
  workflowAria: string;
  workflowQuoteDetail: string;
  workflowQuoteEmpty: string;
  workflowPurchaseDetail: string;
  workflowPurchaseReadyFrom: string;
  workflowPurchaseEmpty: string;
  workflowCurrent: string;
  workflowOpenQuote: string;
  workflowCreateQuote: string;
  workflowOpenPurchaseOrder: string;
  workflowCreatePurchaseOrder: string;
};

export const buildDocsCopy: WorkspaceLanguageCopyMap<BuildDocsCopy> = {
  th: {
    documentTypeLabels: {
      quote: "ใบเสนอราคา",
      purchaseOrder: "ใบสั่งซื้อ",
      invoice: "ใบแจ้งหนี้",
      receipt: "ใบเสร็จรับเงิน",
      contract: "สัญญารับเหมา"
    },
    invoiceBillingTitle: "ใบวางบิล/ใบแจ้งหนี้",
    documentStatusAria: "สถานะเอกสาร",
    statusLabels: {
      draft: "ร่าง",
      sent: "ส่งแล้ว",
      approved: "อนุมัติแล้ว",
      billed: "วางบิลแล้ว",
      paid: "รับเงินแล้ว",
      cancelled: "ยกเลิก"
    },
    relationReference: "อ้างอิง",
    relationReceiptFrom: "รับเงินจาก",
    relationPurchaseFrom: "สั่งซื้อจาก",
    lastSavedPrefix: "บันทึกล่าสุด",
    neverSaved: "ยังไม่เคยบันทึก",
    newDocument: "เอกสารใหม่",
    searchPlaceholder: "ค้นหาลูกค้า / โครงการ",
    printOrSavePdf: "พิมพ์หรือบันทึก PDF",
    duplicateDocument: "คัดลอกเอกสารนี้",
    importBackup: "นำเข้า backup",
    exportBackup: "ดาวน์โหลด backup",
    save: "บันทึก",
    reset: "รีเซ็ต",
    openReceipt: "เปิดใบเสร็จ",
    issueReceipt: "ออกใบเสร็จ",
    openBilling: "เปิดใบวางบิล",
    openPurchaseOrder: "เปิดใบสั่งซื้อ",
    issuePurchaseOrder: "ออกใบสั่งซื้อ",
    openQuote: "เปิดใบเสนอราคา",
    sendDocument: "ส่งเอกสาร",
    documentTypesAria: "ประเภทเอกสาร",
    workflowAria: "การ์ดเอกสารเชื่อมต่อ",
    workflowQuoteDetail: "ต้นทางข้อมูลราคา รายการงาน BOQ ลูกค้า และโครงการ",
    workflowQuoteEmpty: "ยังไม่มีใบเสนอราคาของโครงการนี้",
    workflowPurchaseDetail: "ใช้รายการและยอดจากใบเสนอราคาเพื่อเชื่อมกับ Docs, BOQ, Project และ Defect",
    workflowPurchaseReadyFrom: "พร้อมสร้างจาก {documentNo}",
    workflowPurchaseEmpty: "สร้างจากข้อมูลเอกสารปัจจุบันได้",
    workflowCurrent: "กำลังเปิด",
    workflowOpenQuote: "เปิดใบเสนอราคา",
    workflowCreateQuote: "สร้างใบเสนอราคา",
    workflowOpenPurchaseOrder: "เปิดใบสั่งซื้อ",
    workflowCreatePurchaseOrder: "สร้างใบสั่งซื้อ"
  },
  en: {
    documentTypeLabels: {
      quote: "Quote",
      purchaseOrder: "Purchase order",
      invoice: "Invoice",
      receipt: "Receipt",
      contract: "Contract"
    },
    invoiceBillingTitle: "Progress billing / Invoice",
    documentStatusAria: "Document status",
    statusLabels: {
      draft: "Draft",
      sent: "Sent",
      approved: "Approved",
      billed: "Billed",
      paid: "Paid",
      cancelled: "Cancelled"
    },
    relationReference: "Reference",
    relationReceiptFrom: "Receipt from",
    relationPurchaseFrom: "Purchase from",
    lastSavedPrefix: "Last saved",
    neverSaved: "Not saved yet",
    newDocument: "New document",
    searchPlaceholder: "Search client / project",
    printOrSavePdf: "Print or save PDF",
    duplicateDocument: "Duplicate this document",
    importBackup: "Import backup",
    exportBackup: "Download backup",
    save: "Save",
    reset: "Reset",
    openReceipt: "Open receipt",
    issueReceipt: "Issue receipt",
    openBilling: "Open billing",
    openPurchaseOrder: "Open purchase order",
    issuePurchaseOrder: "Issue purchase order",
    openQuote: "Open quote",
    sendDocument: "Send document",
    documentTypesAria: "Document types",
    workflowAria: "Connected document cards",
    workflowQuoteDetail: "Price source, BOQ line items, client, and project data",
    workflowQuoteEmpty: "No quote for this project yet",
    workflowPurchaseDetail: "Uses quote line items and totals to connect Docs, BOQ, Project, and Defect",
    workflowPurchaseReadyFrom: "Ready to create from {documentNo}",
    workflowPurchaseEmpty: "Can be created from the current document data",
    workflowCurrent: "Currently open",
    workflowOpenQuote: "Open quote",
    workflowCreateQuote: "Create quote",
    workflowOpenPurchaseOrder: "Open purchase order",
    workflowCreatePurchaseOrder: "Create purchase order"
  }
};

export function getBuildDocsInvoiceTitle(
  docType: DocumentType,
  selectedMilestone: unknown,
  language: WorkspaceLanguage
) {
  const copy = getWorkspaceLanguageCopy(buildDocsCopy, language);
  return docType === "invoice" && selectedMilestone
    ? copy.invoiceBillingTitle
    : copy.documentTypeLabels[docType];
}

export function formatBuildDocsTemplate(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce(
    (current, [key, value]) => current.split(`{${key}}`).join(value),
    template
  );
}
