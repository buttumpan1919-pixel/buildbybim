import {
  DocumentInfo,
  DocumentType,
  LineItem,
  Milestone,
  initialDocumentInfo,
  initialItems,
  initialMilestones
} from "./data";

const WORKSPACE_STORAGE_KEY = "builddocs-pro.workspace.v1";
const LEGACY_STORAGE_KEY = "builddocs-pro.mvp.v1";

const WINDOWS_874_SPECIAL_BYTES_BY_CODE_POINT: Record<number, number> = {
  0x20ac: 0x80,
  0x201a: 0x82,
  0x0192: 0x83,
  0x201e: 0x84,
  0x2026: 0x85,
  0x2020: 0x86,
  0x2021: 0x87,
  0x02c6: 0x88,
  0x2030: 0x89,
  0x0160: 0x8a,
  0x2039: 0x8b,
  0x0152: 0x8c,
  0x2018: 0x91,
  0x2019: 0x92,
  0x201c: 0x93,
  0x201d: 0x94,
  0x2022: 0x95,
  0x2013: 0x96,
  0x2014: 0x97,
  0x02dc: 0x98,
  0x2122: 0x99,
  0x0161: 0x9a,
  0x203a: 0x9b,
  0x0153: 0x9c,
  0x0178: 0x9f
};

const MOJIBAKE_CONTROL_PATTERN = /[\u0080-\u009f\u20ac]/;
const MOJIBAKE_THAI_PREFIX_PATTERN = /\u0e40(?:\u0e18|\u0e19)/g;

function countMojibakeSignals(value: string) {
  return (
    (MOJIBAKE_CONTROL_PATTERN.test(value) ? 10 : 0) +
    (value.match(MOJIBAKE_THAI_PREFIX_PATTERN)?.length ?? 0)
  );
}

function shouldRepairMojibakeText(value: string) {
  return (
    MOJIBAKE_CONTROL_PATTERN.test(value) ||
    (value.match(MOJIBAKE_THAI_PREFIX_PATTERN)?.length ?? 0) >= 2
  );
}

function getWindows874Byte(character: string) {
  const codePoint = character.codePointAt(0);

  if (codePoint === undefined) {
    return null;
  }

  if (codePoint <= 0x7f || (codePoint >= 0x80 && codePoint <= 0x9f)) {
    return codePoint;
  }

  if (codePoint === 0x00a0) {
    return 0xa0;
  }

  if (codePoint >= 0x0e01 && codePoint <= 0x0e5b) {
    return codePoint - 0x0e01 + 0xa1;
  }

  return WINDOWS_874_SPECIAL_BYTES_BY_CODE_POINT[codePoint] ?? null;
}

function repairMojibakeText(value: string) {
  if (!shouldRepairMojibakeText(value)) {
    return value;
  }

  const bytes: number[] = [];

  for (const character of value) {
    const byte = getWindows874Byte(character);

    if (byte === null) {
      return value;
    }

    bytes.push(byte);
  }

  try {
    const repaired = new TextDecoder("utf-8", { fatal: true }).decode(new Uint8Array(bytes));

    return countMojibakeSignals(repaired) < countMojibakeSignals(value) ? repaired : value;
  } catch {
    return value;
  }
}

function repairStoredTextFields<T extends object>(record: T): T {
  const repaired = { ...record };

  (Object.keys(repaired) as Array<keyof T>).forEach((key) => {
    const value = repaired[key];

    if (typeof value === "string") {
      repaired[key] = repairMojibakeText(value) as T[typeof key];
    }
  });

  return repaired;
}

export type DocumentStatus = "draft" | "sent" | "approved" | "billed" | "paid" | "cancelled";

export type DocumentRelationship = {
  kind: "standard" | "purchase" | "billing" | "receipt";
  sourceDocumentId: string | null;
  sourceDocumentNo: string;
  sourceDocumentTitle: string;
  sourceMilestoneId: number | null;
  sourceMilestoneName: string;
};

export type AppData = {
  documentInfo: DocumentInfo;
  docType: DocumentType;
  items: LineItem[];
  milestones: Milestone[];
  vatEnabled: boolean;
  withholdingEnabled: boolean;
  selectedContractId: string;
  selectedBillingMilestoneId: number;
  documentStatus: DocumentStatus;
  relationship: DocumentRelationship;
  savedAt: string | null;
};

export type StoredDocument = AppData & {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  total: number;
};

export type ClientRecord = {
  id: string;
  name: string;
  address: string;
  phone: string;
  taxId: string;
  updatedAt: string;
};

export type ProjectRecord = {
  id: string;
  name: string;
  clientId: string | null;
  clientName: string;
  templateName: string;
  paymentTerms: string;
  notes: string;
  updatedAt: string;
};

export type EmployeeTeamType = "office" | "site";
export type EmployeeStatus = "active" | "standby";

export type EmployeeRecord = {
  id: string;
  name: string;
  team: EmployeeTeamType;
  teamName: string;
  position: string;
  dailyWage: number;
  benefit: number;
  workDays: number;
  assignedProjectIds: string[];
  status: EmployeeStatus;
};

export type EmployeeSiteTeamRecord = {
  id: string;
  name: string;
  projectId: string;
  updatedAt: string;
};

export type DefectSeverity = "high" | "medium" | "low";
export type DefectStatus = "open" | "fixing" | "review" | "closed";
export type DefectPhotoStage = "before" | "after" | "checkpoint";

export type DefectPhotoRecord = {
  id: string;
  name: string;
  dataUrl: string;
  mimeType: string;
  size: number;
  stage: DefectPhotoStage;
  caption: string;
  capturedAt: string;
};

export type DefectRecord = {
  id: string;
  projectKey: string;
  documentId: string | null;
  title: string;
  area: string;
  due: string;
  owner: string;
  note: string;
  severity: DefectSeverity;
  status: DefectStatus;
  photos: DefectPhotoRecord[];
  createdAt: string;
  updatedAt: string;
};

export type WorkspaceData = {
  activeDocumentId: string;
  documents: StoredDocument[];
  clients: ClientRecord[];
  projects: ProjectRecord[];
  employees: EmployeeRecord[];
  siteTeams: EmployeeSiteTeamRecord[];
  defects: DefectRecord[];
};

type WorkspaceSaveData = Omit<WorkspaceData, "siteTeams"> & {
  siteTeams?: EmployeeSiteTeamRecord[];
};

export const initialAppData: AppData = {
  documentInfo: initialDocumentInfo,
  docType: "quote",
  items: initialItems,
  milestones: initialMilestones,
  vatEnabled: true,
  withholdingEnabled: false,
  selectedContractId: "fixed-price",
  selectedBillingMilestoneId: initialMilestones[0].id,
  documentStatus: "draft",
  relationship: {
    kind: "standard",
    sourceDocumentId: null,
    sourceDocumentNo: "",
    sourceDocumentTitle: "",
    sourceMilestoneId: null,
    sourceMilestoneName: ""
  },
  savedAt: null
};

const standardRelationship: DocumentRelationship = initialAppData.relationship;

export function loadWorkspaceData(): WorkspaceData {
  if (typeof window === "undefined") {
    return createInitialWorkspace();
  }

  try {
    const rawWorkspace = window.localStorage.getItem(WORKSPACE_STORAGE_KEY);

    if (rawWorkspace) {
      return normalizeWorkspace(JSON.parse(rawWorkspace) as Partial<WorkspaceData>);
    }

    const rawLegacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);

    if (rawLegacy) {
      const legacyData = normalizeAppData(JSON.parse(rawLegacy) as Partial<AppData>);
      const migrated = createWorkspaceFromAppData(legacyData);
      saveWorkspaceData(migrated);
      return migrated;
    }

    return createInitialWorkspace();
  } catch {
    return createInitialWorkspace();
  }
}

export function saveWorkspaceData(data: WorkspaceData | WorkspaceSaveData) {
  let previousSiteTeams: EmployeeSiteTeamRecord[] = [];

  if (!("siteTeams" in data) || !Array.isArray(data.siteTeams)) {
    try {
      const rawWorkspace = window.localStorage.getItem(WORKSPACE_STORAGE_KEY);
      const parsed = rawWorkspace ? (JSON.parse(rawWorkspace) as Partial<WorkspaceData>) : null;
      if (!("siteTeams" in data) || !Array.isArray(data.siteTeams)) {
        previousSiteTeams = Array.isArray(parsed?.siteTeams) ? parsed.siteTeams : [];
      }
    } catch {
      previousSiteTeams = [];
    }
  }

  window.localStorage.setItem(
    WORKSPACE_STORAGE_KEY,
    JSON.stringify(
      normalizeWorkspace({
        ...data,
        siteTeams: data.siteTeams ?? previousSiteTeams
      })
    )
  );
}

export function createDefectRecord(record: Partial<DefectRecord> & { projectKey: string }) {
  const now = new Date().toISOString();

  return normalizeDefectRecord({
    ...record,
    id: record.id ?? createId(),
    createdAt: record.createdAt ?? now,
    updatedAt: record.updatedAt ?? now
  });
}

export function clearWorkspaceData() {
  window.localStorage.removeItem(WORKSPACE_STORAGE_KEY);
  window.localStorage.removeItem(LEGACY_STORAGE_KEY);
}

export function createDocumentRecord(data: AppData, options: Partial<StoredDocument> = {}) {
  const now = new Date().toISOString();
  const normalizedData = normalizeAppData(data);

  return {
    ...normalizedData,
    id: options.id ?? createId(),
    title: repairMojibakeText(options.title ?? getDocumentTitle(normalizedData)),
    createdAt: options.createdAt ?? now,
    updatedAt: options.updatedAt ?? now,
    total: options.total ?? calculateTotal(normalizedData)
  };
}

export function createClientRecordFromDocument(
  data: AppData,
  options: Partial<ClientRecord> = {}
) {
  const now = new Date().toISOString();

  return normalizeClientRecord({
    id: options.id ?? createId(),
    name: data.documentInfo.clientName,
    address: data.documentInfo.clientAddress,
    phone: data.documentInfo.clientPhone,
    taxId: options.taxId ?? "",
    updatedAt: options.updatedAt ?? now
  });
}

export function createProjectRecordFromDocument(
  data: AppData,
  clientId: string | null,
  options: Partial<ProjectRecord> = {}
) {
  const now = new Date().toISOString();

  return normalizeProjectRecord({
    id: options.id ?? createId(),
    name: data.documentInfo.projectName,
    clientId,
    clientName: data.documentInfo.clientName,
    templateName: data.documentInfo.templateName,
    paymentTerms: data.documentInfo.paymentTerms,
    notes: data.documentInfo.notes,
    updatedAt: options.updatedAt ?? now
  });
}

export function createBlankDocument(baseCompany?: DocumentInfo, docType: DocumentType = "quote") {
  const now = new Date();
  const documentNo = createDocumentNo(now, getDocumentNoPrefix(docType));
  const contractNo = createDocumentNo(now, "CT");
  const companyFields = baseCompany
    ? {
        companyName: baseCompany.companyName,
        companyAddress: baseCompany.companyAddress,
        companyTaxId: baseCompany.companyTaxId,
        companyPhone: baseCompany.companyPhone,
        signerName: baseCompany.signerName
      }
    : {};

  return createDocumentRecord({
    ...initialAppData,
    docType,
    documentInfo: {
      ...initialAppData.documentInfo,
      ...companyFields,
      documentNo,
      contractNo,
      issueDate: now.toLocaleDateString("th-TH"),
      clientName: "ลูกค้าใหม่",
      clientAddress: "",
      clientPhone: "",
      projectName: "โครงการใหม่",
      notes: "ระบุเงื่อนไข ราคา และระยะเวลาดำเนินงานก่อนส่งเอกสาร"
    },
    items: [
      {
        id: 1,
        name: "รายการงานใหม่",
        unit: "งาน",
        qty: 1,
        price: 0
      }
    ],
    milestones: initialMilestones.map((milestone) => ({ ...milestone })),
    savedAt: now.toISOString()
  });
}

export function duplicateDocument(data: AppData) {
  const now = new Date();
  const normalizedData = normalizeAppData(data);
  const documentNo = createDocumentNo(now, getDocumentNoPrefix(normalizedData.docType));
  const contractNo = createDocumentNo(now, "CT");

  return createDocumentRecord({
    ...normalizedData,
    documentInfo: {
      ...data.documentInfo,
      documentNo,
      contractNo,
      projectName: `${data.documentInfo.projectName} (สำเนา)`
    },
    items: data.items.map((item, index) => ({ ...item, id: index + 1 })),
    milestones: data.milestones.map((milestone) => ({ ...milestone })),
    documentStatus: "draft",
    relationship: standardRelationship,
    savedAt: now.toISOString()
  });
}

export function createQuoteDocument(sourceDocument: StoredDocument) {
  const now = new Date();
  const savedAt = now.toISOString();
  const documentNo = createDocumentNo(now, "QT");
  const quoteData: AppData = {
    ...sourceDocument,
    documentInfo: {
      ...sourceDocument.documentInfo,
      documentNo,
      issueDate: now.toLocaleDateString("th-TH")
    },
    docType: "quote",
    items: sourceDocument.items.map((item, index) => ({ ...item, id: index + 1 })),
    milestones: sourceDocument.milestones.map((item) => ({ ...item })),
    documentStatus: "draft",
    relationship: standardRelationship,
    savedAt
  };

  return createDocumentRecord(quoteData, {
    title: getDocumentTitle(quoteData),
    createdAt: savedAt,
    updatedAt: savedAt,
    total: calculateTotal(quoteData)
  });
}

export function createPurchaseOrderDocument(sourceDocument: StoredDocument) {
  const now = new Date();
  const savedAt = now.toISOString();
  const documentNo = createDocumentNo(now, "PO");
  const purchaseOrderData: AppData = {
    ...sourceDocument,
    documentInfo: {
      ...sourceDocument.documentInfo,
      documentNo,
      issueDate: now.toLocaleDateString("th-TH")
    },
    docType: "purchaseOrder",
    items: sourceDocument.items.map((item, index) => ({ ...item, id: index + 1 })),
    milestones: sourceDocument.milestones.map((item) => ({ ...item })),
    documentStatus: "draft",
    relationship: {
      kind: "purchase",
      sourceDocumentId: sourceDocument.id,
      sourceDocumentNo: sourceDocument.documentInfo.documentNo,
      sourceDocumentTitle: getDocumentTitle(sourceDocument),
      sourceMilestoneId: null,
      sourceMilestoneName: ""
    },
    savedAt
  };

  return createDocumentRecord(purchaseOrderData, {
    title: `${sourceDocument.documentInfo.projectName} - ใบสั่งซื้อ`,
    createdAt: savedAt,
    updatedAt: savedAt,
    total: calculateTotal(purchaseOrderData)
  });
}

export function createBillingDocument(sourceDocument: StoredDocument, milestoneId: number) {
  const now = new Date();
  const savedAt = now.toISOString();
  const milestone =
    sourceDocument.milestones.find((item) => item.id === milestoneId) ??
    sourceDocument.milestones[0];
  const documentNo = createDocumentNo(now, "INV");
  const sourceDocumentNo =
    sourceDocument.documentInfo.contractNo || sourceDocument.documentInfo.documentNo;
  const title = `${sourceDocument.documentInfo.projectName} - ${milestone.name}`;
  const billingData: AppData = {
    documentInfo: {
      ...sourceDocument.documentInfo,
      documentNo,
      issueDate: now.toLocaleDateString("th-TH")
    },
    docType: "invoice",
    items: sourceDocument.items.map((item, index) => ({ ...item, id: index + 1 })),
    milestones: sourceDocument.milestones.map((item) => ({ ...item })),
    vatEnabled: sourceDocument.vatEnabled,
    withholdingEnabled: sourceDocument.withholdingEnabled,
    selectedContractId: sourceDocument.selectedContractId,
    selectedBillingMilestoneId: milestone.id,
    documentStatus: "draft",
    relationship: {
      kind: "billing",
      sourceDocumentId: sourceDocument.id,
      sourceDocumentNo,
      sourceDocumentTitle: getDocumentTitle(sourceDocument),
      sourceMilestoneId: milestone.id,
      sourceMilestoneName: milestone.name
    },
    savedAt
  };

  return createDocumentRecord(billingData, {
    title,
    createdAt: savedAt,
    updatedAt: savedAt,
    total: calculateTotal(billingData)
  });
}

export function createReceiptDocument(sourceDocument: StoredDocument) {
  const now = new Date();
  const savedAt = now.toISOString();
  const milestone =
    sourceDocument.milestones.find(
      (item) => item.id === sourceDocument.selectedBillingMilestoneId
    ) ?? sourceDocument.milestones[0];
  const sourceMilestoneId =
    sourceDocument.relationship.sourceMilestoneId ?? milestone.id;
  const sourceMilestoneName =
    sourceDocument.relationship.sourceMilestoneName || milestone.name;
  const documentNo = createDocumentNo(now, "RC");
  const title = `${sourceDocument.documentInfo.projectName} - รับเงิน ${sourceMilestoneName}`;
  const receiptData: AppData = {
    documentInfo: {
      ...sourceDocument.documentInfo,
      documentNo,
      issueDate: now.toLocaleDateString("th-TH")
    },
    docType: "receipt",
    items: sourceDocument.items.map((item, index) => ({ ...item, id: index + 1 })),
    milestones: sourceDocument.milestones.map((item) => ({ ...item })),
    vatEnabled: sourceDocument.vatEnabled,
    withholdingEnabled: sourceDocument.withholdingEnabled,
    selectedContractId: sourceDocument.selectedContractId,
    selectedBillingMilestoneId: sourceMilestoneId,
    documentStatus: "paid",
    relationship: {
      kind: "receipt",
      sourceDocumentId: sourceDocument.id,
      sourceDocumentNo: sourceDocument.documentInfo.documentNo,
      sourceDocumentTitle: getDocumentTitle(sourceDocument),
      sourceMilestoneId,
      sourceMilestoneName
    },
    savedAt
  };

  return createDocumentRecord(receiptData, {
    title,
    createdAt: savedAt,
    updatedAt: savedAt,
    total: calculateTotal(receiptData)
  });
}

export function getDocumentTitle(data: AppData) {
  return data.documentInfo.projectName || data.documentInfo.clientName || data.documentInfo.documentNo;
}

export function calculateTotal(data: AppData) {
  const subtotal = data.items.reduce((sum, item) => sum + item.qty * item.price, 0);
  const vat = data.vatEnabled ? subtotal * 0.07 : 0;
  const withholding = data.withholdingEnabled ? subtotal * 0.03 : 0;
  const total = subtotal + vat - withholding;

  const shouldUseSelectedMilestoneTotal =
    data.docType === "invoice" ||
    (data.docType === "receipt" && data.relationship.kind === "receipt");

  if (!shouldUseSelectedMilestoneTotal) {
    return total;
  }

  const selectedMilestone = data.milestones.find(
    (milestone) => milestone.id === data.selectedBillingMilestoneId
  );
  return selectedMilestone ? (total * selectedMilestone.percent) / 100 : total;
}

export function normalizeImportedWorkspace(value: unknown): WorkspaceData {
  if (!value || typeof value !== "object") {
    throw new Error("ไฟล์ backup ไม่ถูกต้อง");
  }

  const candidate = value as Partial<WorkspaceData> & {
    workspace?: Partial<WorkspaceData>;
  };
  return normalizeWorkspace(candidate.workspace ?? candidate);
}

function createInitialWorkspace(): WorkspaceData {
  return createWorkspaceFromAppData(initialAppData);
}

function createWorkspaceFromAppData(data: AppData): WorkspaceData {
  const document = createDocumentRecord(data, {
    id: createId(),
    createdAt: data.savedAt ?? new Date().toISOString(),
    updatedAt: data.savedAt ?? new Date().toISOString()
  });
  const clients = deriveClientsFromDocuments([document]);

  return {
    activeDocumentId: document.id,
    documents: [document],
    clients,
    projects: deriveProjectsFromDocuments([document], clients),
    employees: [],
    siteTeams: [],
    defects: []
  };
}

function normalizeWorkspace(value: Partial<WorkspaceData>): WorkspaceData {
  const documents = (value.documents ?? [])
    .map((document) => createDocumentRecord(document, document))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  if (!documents.length) {
    return createInitialWorkspace();
  }

  const activeDocumentId = documents.some((document) => document.id === value.activeDocumentId)
    ? value.activeDocumentId
    : documents[0].id;
  const clients = value.clients?.length
    ? value.clients.map(normalizeClientRecord).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    : deriveClientsFromDocuments(documents);
  const projects = value.projects?.length
    ? value.projects.map(normalizeProjectRecord).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    : deriveProjectsFromDocuments(documents, clients);
  const employees = value.employees?.length
    ? value.employees.map(normalizeEmployeeRecord)
    : [];
  const siteTeams = normalizeEmployeeSiteTeams(value.siteTeams, employees);
  const defects = value.defects?.length
    ? value.defects
        .map((record, index) => normalizeDefectRecord(record, index))
        .filter((record) => record.projectKey)
    : [];

  return {
    activeDocumentId: activeDocumentId ?? documents[0].id,
    documents,
    clients,
    projects,
    employees,
    siteTeams,
    defects
  };
}

function normalizeClientRecord(record: Partial<ClientRecord>): ClientRecord {
  const now = new Date().toISOString();
  const cleanRecord = repairStoredTextFields(record);

  return {
    id: cleanRecord.id ?? createId(),
    name: cleanRecord.name?.trim() || "ลูกค้าใหม่",
    address: cleanRecord.address ?? "",
    phone: cleanRecord.phone ?? "",
    taxId: cleanRecord.taxId ?? "",
    updatedAt: cleanRecord.updatedAt ?? now
  };
}

function normalizeProjectRecord(record: Partial<ProjectRecord>): ProjectRecord {
  const now = new Date().toISOString();
  const cleanRecord = repairStoredTextFields(record);

  return {
    id: cleanRecord.id ?? createId(),
    name: cleanRecord.name?.trim() || "โครงการใหม่",
    clientId: cleanRecord.clientId ?? null,
    clientName: cleanRecord.clientName ?? "",
    templateName: cleanRecord.templateName ?? "",
    paymentTerms: cleanRecord.paymentTerms ?? "",
    notes: cleanRecord.notes ?? "",
    updatedAt: cleanRecord.updatedAt ?? now
  };
}

function normalizeEmployeeRecord(record: Partial<EmployeeRecord>): EmployeeRecord {
  const cleanRecord = repairStoredTextFields(record);
  const team: EmployeeTeamType = cleanRecord.team === "site" ? "site" : "office";

  return {
    id: cleanRecord.id ?? createId(),
    name: cleanRecord.name?.trim() || "พนักงานใหม่",
    team,
    teamName: team === "office" ? "ออฟฟิศ" : cleanRecord.teamName?.trim() || "ทีมหน้างาน 1",
    position: cleanRecord.position?.trim() || (team === "office" ? "ธุรการออฟฟิศ" : "ช่างประจำไซต์"),
    dailyWage: typeof cleanRecord.dailyWage === "number" ? cleanRecord.dailyWage : 650,
    benefit: typeof cleanRecord.benefit === "number" ? cleanRecord.benefit : 80,
    workDays: typeof cleanRecord.workDays === "number" ? cleanRecord.workDays : 26,
    assignedProjectIds: Array.isArray(cleanRecord.assignedProjectIds)
      ? cleanRecord.assignedProjectIds.filter((id): id is string => typeof id === "string")
      : [],
    status: cleanRecord.status === "standby" ? "standby" : "active"
  };
}

function normalizeEmployeeSiteTeams(
  records: Partial<EmployeeSiteTeamRecord>[] | undefined,
  employees: EmployeeRecord[]
): EmployeeSiteTeamRecord[] {
  const now = new Date().toISOString();
  const normalizedRecords = (records ?? [])
    .map((record, index) => normalizeEmployeeSiteTeamRecord(record, index))
    .filter((record) => record.name);
  const teamNames = new Set(normalizedRecords.map((record) => record.name));
  const derivedRecords = employees
    .filter((employee) => employee.team === "site")
    .map((employee, index) => ({
      id: `site-team-derived-${index}`,
      name: employee.teamName.trim(),
      projectId: employee.assignedProjectIds[0] ?? "",
      updatedAt: now
    }))
    .filter((record) => {
      if (!record.name || teamNames.has(record.name)) {
        return false;
      }

      teamNames.add(record.name);
      return true;
    });

  return [...normalizedRecords, ...derivedRecords].sort((a, b) => a.name.localeCompare(b.name, "th-TH"));
}

function normalizeEmployeeSiteTeamRecord(
  record: Partial<EmployeeSiteTeamRecord>,
  index = 0
): EmployeeSiteTeamRecord {
  const now = new Date().toISOString();
  const cleanRecord = repairStoredTextFields(record);

  return {
    id: cleanRecord.id ?? `site-team-${Date.now()}-${index}`,
    name: cleanRecord.name?.trim() || `ทีมหน้างาน ${index + 1}`,
    projectId: cleanRecord.projectId?.trim() ?? "",
    updatedAt: cleanRecord.updatedAt ?? now
  };
}

export function normalizeDefectRecord(record: Partial<DefectRecord>, index = 0): DefectRecord {
  const now = new Date().toISOString();
  const cleanRecord = repairStoredTextFields(record);
  const severity: DefectSeverity =
    cleanRecord.severity === "high" || cleanRecord.severity === "low" ? cleanRecord.severity : "medium";
  const status: DefectStatus =
    cleanRecord.status === "fixing" || cleanRecord.status === "review" || cleanRecord.status === "closed"
      ? cleanRecord.status
      : "open";

  return {
    id: cleanRecord.id ?? `defect-${Date.now()}-${index}`,
    projectKey: cleanRecord.projectKey ?? "",
    documentId: cleanRecord.documentId ?? null,
    title: cleanRecord.title?.trim() || "รายการ defect ใหม่",
    area: cleanRecord.area?.trim() || "ยังไม่ระบุพื้นที่",
    due: cleanRecord.due?.trim() || "ก่อนตรวจงวดถัดไป",
    owner: cleanRecord.owner?.trim() || "ยังไม่ระบุผู้รับผิดชอบ",
    note: cleanRecord.note?.trim() || "",
    severity,
    status,
    photos: Array.isArray(cleanRecord.photos)
      ? cleanRecord.photos
          .map((photo, photoIndex) => normalizeDefectPhotoRecord(photo, photoIndex))
          .filter((photo) => photo.dataUrl)
      : [],
    createdAt: cleanRecord.createdAt ?? now,
    updatedAt: cleanRecord.updatedAt ?? now
  };
}

export function normalizeDefectPhotoRecord(
  record: Partial<DefectPhotoRecord>,
  index = 0
): DefectPhotoRecord {
  const now = new Date().toISOString();
  const cleanRecord = repairStoredTextFields(record);
  const stage: DefectPhotoStage =
    cleanRecord.stage === "before" || cleanRecord.stage === "after" || cleanRecord.stage === "checkpoint"
      ? cleanRecord.stage
      : "checkpoint";

  return {
    id: cleanRecord.id ?? `defect-photo-${Date.now()}-${index}`,
    name: cleanRecord.name?.trim() || "รูปหน้างาน",
    dataUrl: cleanRecord.dataUrl ?? "",
    mimeType: cleanRecord.mimeType ?? "image/jpeg",
    size: typeof cleanRecord.size === "number" ? cleanRecord.size : 0,
    stage,
    caption: cleanRecord.caption?.trim() ?? "",
    capturedAt: cleanRecord.capturedAt ?? now
  };
}

function deriveClientsFromDocuments(documents: StoredDocument[]) {
  const clientsByName = new Map<string, ClientRecord>();

  documents.forEach((document) => {
    const name = document.documentInfo.clientName.trim();

    if (!name) {
      return;
    }

    const key = name.toLocaleLowerCase("th-TH");
    const existing = clientsByName.get(key);

    if (!existing || document.updatedAt > existing.updatedAt) {
      clientsByName.set(
        key,
        normalizeClientRecord({
          id: existing?.id ?? createId(),
          name,
          address: document.documentInfo.clientAddress,
          phone: document.documentInfo.clientPhone,
          updatedAt: document.updatedAt
        })
      );
    }
  });

  return [...clientsByName.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function deriveProjectsFromDocuments(documents: StoredDocument[], clients: ClientRecord[]) {
  const projectsByName = new Map<string, ProjectRecord>();

  documents.forEach((document) => {
    const name = document.documentInfo.projectName.trim();

    if (!name) {
      return;
    }

    const client = clients.find((item) => item.name === document.documentInfo.clientName);
    const key = `${name}::${document.documentInfo.clientName}`.toLocaleLowerCase("th-TH");
    const existing = projectsByName.get(key);

    if (!existing || document.updatedAt > existing.updatedAt) {
      projectsByName.set(
        key,
        normalizeProjectRecord({
          id: existing?.id ?? createId(),
          name,
          clientId: client?.id ?? null,
          clientName: document.documentInfo.clientName,
          templateName: document.documentInfo.templateName,
          paymentTerms: document.documentInfo.paymentTerms,
          notes: document.documentInfo.notes,
          updatedAt: document.updatedAt
        })
      );
    }
  });

  return [...projectsByName.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function normalizeAppData(data: Partial<AppData>): AppData {
  const documentInfo = repairStoredTextFields({
    ...initialAppData.documentInfo,
    ...data.documentInfo
  });

  return {
    ...initialAppData,
    ...data,
    documentInfo,
    items: (data.items?.length ? data.items : initialAppData.items).map(repairLineItemText),
    milestones: (data.milestones?.length ? data.milestones : initialAppData.milestones).map(repairMilestoneText),
    selectedBillingMilestoneId:
      data.selectedBillingMilestoneId ??
      data.milestones?.[0]?.id ??
      initialAppData.selectedBillingMilestoneId,
    documentStatus: normalizeDocumentStatus(data.documentStatus),
    relationship: normalizeDocumentRelationship(data.relationship),
    savedAt: data.savedAt ?? null
  };
}

function repairLineItemText(item: LineItem): LineItem {
  return {
    ...item,
    name: repairMojibakeText(item.name),
    unit: repairMojibakeText(item.unit),
    source: item.source
      ? {
          ...item.source,
          key: repairMojibakeText(item.source.key),
          label: repairMojibakeText(item.source.label)
        }
      : undefined
  };
}

function repairMilestoneText(milestone: Milestone): Milestone {
  return {
    ...milestone,
    name: repairMojibakeText(milestone.name),
    due: repairMojibakeText(milestone.due)
  };
}

function normalizeDocumentStatus(status?: DocumentStatus): DocumentStatus {
  return ["draft", "sent", "approved", "billed", "paid", "cancelled"].includes(status ?? "")
    ? (status as DocumentStatus)
    : "draft";
}

function normalizeDocumentRelationship(
  relationship?: Partial<DocumentRelationship>
): DocumentRelationship {
  const cleanRelationship = repairStoredTextFields(relationship ?? {});

  return {
    ...initialAppData.relationship,
    ...cleanRelationship,
    kind:
      cleanRelationship.kind === "purchase" ||
      cleanRelationship.kind === "billing" ||
      cleanRelationship.kind === "receipt"
        ? cleanRelationship.kind
        : "standard",
    sourceDocumentId: cleanRelationship.sourceDocumentId ?? null,
    sourceMilestoneId:
      typeof cleanRelationship.sourceMilestoneId === "number"
        ? cleanRelationship.sourceMilestoneId
        : null
  };
}

function getDocumentNoPrefix(docType: DocumentType) {
  if (docType === "purchaseOrder") {
    return "PO";
  }

  if (docType === "invoice") {
    return "INV";
  }

  if (docType === "receipt") {
    return "RC";
  }

  if (docType === "contract") {
    return "CT";
  }

  return "QT";
}

function createDocumentNo(date: Date, prefix = "QT") {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  const second = String(date.getSeconds()).padStart(2, "0");
  const millisecond = String(date.getMilliseconds()).padStart(3, "0");
  return `${prefix}-${year}${month}${day}-${hour}${minute}${second}${millisecond}`;
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `doc-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
