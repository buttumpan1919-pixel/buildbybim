import { ensureSeedCostCodes } from "./costCodes";
import {
  normalizeCashflowState,
  loadCashflowState,
  saveCashflowState,
  type CashflowEntry,
  type CashflowState
} from "./cashflow";
import { syncProjectsFromCashflow } from "./cashflow.rollup";
import {
  loadProjects,
  normalizeProjectListState,
  saveProjects,
  type Project,
  type ProjectListState
} from "./projects";
import {
  loadPRs,
  loadRFQs,
  normalizePurchaseRequest,
  normalizeRFQ,
  savePRs,
  saveRFQs,
  type PurchaseRequest,
  type PRState,
  type RFQ,
  type RFQState
} from "./procurement";
import {
  createDefectRecord,
  createDocumentRecord,
  initialAppData,
  loadWorkspaceData,
  normalizeDefectPhotoRecord,
  saveWorkspaceData,
  type ClientRecord,
  type DefectRecord,
  type EmployeeRecord,
  type EmployeeSiteTeamRecord,
  type ProjectRecord,
  type StoredDocument
} from "./storage";
import {
  loadSuppliers,
  normalizeSupplierState,
  saveSuppliers,
  type Supplier,
  type SupplierPriceHistoryEntry,
  type SupplierState
} from "./suppliers";

export const DEMO_WORKSPACE_ID = "demo-buildbybim";
export const DEMO_PROJECT_ID = "demo-project-townhome-rama9";
export const DEMO_PROJECT_NAME = "Demo - Townhome Rama 9 Renovation";
export const DEMO_CLIENT_NAME = "Demo Owner Co., Ltd.";

const DEMO_DOCUMENT_ID = "demo-doc-contract-townhome-rama9";
const DEMO_CLIENT_ID = "demo-client-owner";
const DEMO_WORKSPACE_PROJECT_ID = "demo-workspace-project-townhome-rama9";

const COST_STEEL = "seed-02-800";
const COST_CONCRETE = "seed-02-400";
const COST_TILE = "seed-05-100";
const COST_WATERPROOFING = "seed-03-800";
const COST_ELECTRICAL = "seed-04-200";
const COST_FOREMAN = "seed-07-110";

const SUP_MAIN = "demo-sup-mainmat";
const SUP_STEEL = "demo-sup-steel";
const SUP_CONCRETE = "demo-sup-concrete";
const SUP_MEP = "demo-sup-mep";
const SUP_FINISH = "demo-sup-finish";

const DEMO_PR_MAIN = "demo-pr-main-material";
const DEMO_PR_PENDING = "demo-pr-pending-mep";
const DEMO_PR_RECEIVED = "demo-pr-received-site";
const DEMO_RFQ_MAIN = "demo-rfq-main-material";

export type DemoSeedResult = {
  projects: number;
  suppliers: number;
  purchaseRequests: number;
  rfqs: number;
  cashflowEntries: number;
  workspaceDocuments: number;
  defects: number;
};

export type DemoResetResult = DemoSeedResult & {
  supplierPriceHistory: number;
  workspaceClients: number;
  workspaceProjects: number;
  employees: number;
  siteTeams: number;
};

function nowIso() {
  return new Date().toISOString();
}

function isDemoId(value: string | null | undefined): boolean {
  return typeof value === "string" && value.startsWith("demo-");
}

function mergeById<T extends { id: string }>(current: T[], demoRecords: T[]): T[] {
  const demoIds = new Set(demoRecords.map((record) => record.id));
  return [...demoRecords, ...current.filter((record) => !demoIds.has(record.id))];
}

function getProjectSyncKey(projectName: string, clientName: string) {
  return `${projectName.trim()}::${clientName.trim()}`.toLocaleLowerCase("th-TH");
}

function createSvgDataUrl(title: string, subtitle: string, fill: string) {
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="520" viewBox="0 0 900 520">`,
    `<rect width="900" height="520" fill="${fill}"/>`,
    `<rect x="70" y="70" width="760" height="380" rx="18" fill="rgba(255,255,255,0.82)"/>`,
    `<text x="105" y="180" font-family="Arial, sans-serif" font-size="54" font-weight="700" fill="#1f2933">${title}</text>`,
    `<text x="105" y="250" font-family="Arial, sans-serif" font-size="30" fill="#52606d">${subtitle}</text>`,
    `<text x="105" y="345" font-family="Arial, sans-serif" font-size="26" fill="#7b8794">Buildbybim demo evidence</text>`,
    `</svg>`
  ].join("");

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function createDemoProjects(): Project[] {
  const now = nowIso();
  return normalizeProjectListState({
    projects: [
      {
        id: DEMO_PROJECT_ID,
        workspaceId: DEMO_WORKSPACE_ID,
        code: "demo-2601",
        name: DEMO_PROJECT_NAME,
        clientId: DEMO_CLIENT_ID,
        clientName: DEMO_CLIENT_NAME,
        customerType: "corporate",
        contractValue: 4_200_000,
        plannedCost: 2_950_000,
        actualCost: 0,
        plannedRevenue: 4_200_000,
        actualRevenue: 0,
        startDate: "2026-02-15",
        endDate: "2026-05-20",
        status: "delayed",
        hasBudget: true,
        notes:
          "Demo scenario: delayed project with linked PR, RFQ, cashflow, supplier history, and defects.",
        createdAt: now,
        updatedAt: now
      },
      {
        id: "demo-project-office-fitout",
        workspaceId: DEMO_WORKSPACE_ID,
        code: "demo-2602",
        name: "Demo - Office Fit-out Sathorn",
        clientId: "demo-client-sathorn",
        clientName: "Sathorn Design Lab",
        customerType: "corporate",
        contractValue: 1_850_000,
        plannedCost: 1_320_000,
        actualCost: 0,
        plannedRevenue: 1_850_000,
        actualRevenue: 0,
        startDate: "2026-05-10",
        endDate: "2026-08-15",
        status: "normal",
        hasBudget: true,
        notes: "Secondary demo project for filters and project list testing.",
        createdAt: now,
        updatedAt: now
      }
    ],
    updatedAt: now
  }).projects;
}

function createDemoSuppliers(): Supplier[] {
  const now = nowIso();
  return normalizeSupplierState({
    suppliers: [
      {
        id: SUP_MAIN,
        workspaceId: DEMO_WORKSPACE_ID,
        name: "Demo Bangkok BuildMart",
        shortName: "BuildMart",
        type: "distributor",
        taxId: "0105555000001",
        address: "Rama 9, Bangkok",
        city: "Bangkok",
        province: "Bangkok",
        postalCode: "10310",
        phone: "02-000-1100",
        email: "sales@demo-buildmart.test",
        lineId: "@demo-buildmart",
        paymentTerms: "30 days",
        rating: 5,
        notes: "Demo supplier used as awarded RFQ vendor.",
        tags: ["demo", "main-material"],
        active: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: SUP_STEEL,
        workspaceId: DEMO_WORKSPACE_ID,
        name: "Demo Thai Steel Yard",
        shortName: "SteelYard",
        type: "manufacturer",
        taxId: "0105555000002",
        address: "Bangna-Trad, Samut Prakan",
        city: "Samut Prakan",
        province: "Samut Prakan",
        postalCode: "10540",
        phone: "02-000-2200",
        email: "quote@demo-steel.test",
        lineId: "@demo-steel",
        paymentTerms: "45 days",
        rating: 4,
        notes: "Demo alternate RFQ vendor.",
        tags: ["demo", "steel"],
        active: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: SUP_CONCRETE,
        workspaceId: DEMO_WORKSPACE_ID,
        name: "Demo ReadyMix Siam",
        shortName: "ReadyMix",
        type: "manufacturer",
        taxId: "0105555000003",
        address: "Lat Krabang, Bangkok",
        city: "Bangkok",
        province: "Bangkok",
        postalCode: "10520",
        phone: "02-000-3300",
        email: "batch@demo-readymix.test",
        lineId: "@demo-readymix",
        paymentTerms: "cash",
        rating: 4,
        notes: "Concrete and slab material sample.",
        tags: ["demo", "concrete"],
        active: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: SUP_MEP,
        workspaceId: DEMO_WORKSPACE_ID,
        name: "Demo MEP Pro Service",
        shortName: "MEP Pro",
        type: "subcontractor",
        taxId: "0105555000004",
        address: "Huai Khwang, Bangkok",
        city: "Bangkok",
        province: "Bangkok",
        postalCode: "10310",
        phone: "02-000-4400",
        email: "ops@demo-mep.test",
        lineId: "@demo-mep",
        paymentTerms: "milestone",
        rating: 3,
        notes: "Pending PR vendor for MEP work.",
        tags: ["demo", "mep"],
        active: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: SUP_FINISH,
        workspaceId: DEMO_WORKSPACE_ID,
        name: "Demo Finishing Plus",
        shortName: "Finish+",
        type: "subcontractor",
        taxId: "0105555000005",
        address: "Nonthaburi",
        city: "Nonthaburi",
        province: "Nonthaburi",
        postalCode: "11000",
        phone: "02-000-5500",
        email: "hello@demo-finish.test",
        lineId: "@demo-finish",
        paymentTerms: "15 days",
        rating: 4,
        notes: "Tile and waterproofing demo subcontractor.",
        tags: ["demo", "finishing"],
        active: true,
        createdAt: now,
        updatedAt: now
      }
    ],
    priceHistory: [],
    updatedAt: now
  }).suppliers;
}

function createDemoPurchaseRequests(): PurchaseRequest[] {
  const now = nowIso();
  return [
    normalizePurchaseRequest({
      id: DEMO_PR_MAIN,
      workspaceId: DEMO_WORKSPACE_ID,
      projectId: DEMO_PROJECT_ID,
      prNo: "PR-2026-001",
      requestedBy: "site-foreman",
      approvedBy: "project-manager",
      status: "awarded",
      requestDate: "2026-04-18",
      neededByDate: "2026-05-05",
      notes: "Main structure and finishing materials for demo project.",
      linkedRfqId: DEMO_RFQ_MAIN,
      items: [
        {
          id: "demo-pr-line-steel",
          costCodeId: COST_STEEL,
          description: "Deformed bar SD40",
          quantity: 18,
          unit: "ton",
          estimatedUnitPrice: 41_000,
          amount: 738_000,
          preferredSupplierId: SUP_MAIN,
          note: "Compare one-stop supplier vs steel yard"
        },
        {
          id: "demo-pr-line-concrete",
          costCodeId: COST_CONCRETE,
          description: "RC slab concrete and formwork allowance",
          quantity: 145,
          unit: "sq_m",
          estimatedUnitPrice: 3_500,
          amount: 507_500,
          preferredSupplierId: SUP_MAIN,
          note: ""
        },
        {
          id: "demo-pr-line-tile",
          costCodeId: COST_TILE,
          description: "Ceramic floor tile including adhesive",
          quantity: 240,
          unit: "sq_m",
          estimatedUnitPrice: 650,
          amount: 156_000,
          preferredSupplierId: SUP_FINISH,
          note: "Owner selected mid-range tile"
        }
      ],
      createdAt: now,
      updatedAt: now
    }),
    normalizePurchaseRequest({
      id: DEMO_PR_PENDING,
      workspaceId: DEMO_WORKSPACE_ID,
      projectId: DEMO_PROJECT_ID,
      prNo: "PR-2026-002",
      requestedBy: "site-engineer",
      status: "submitted",
      requestDate: "2026-04-10",
      neededByDate: "2026-05-10",
      notes: "Pending approval intentionally old enough to trigger PR aging.",
      items: [
        {
          id: "demo-pr-line-waterproof",
          costCodeId: COST_WATERPROOFING,
          description: "Bathroom waterproofing re-check",
          quantity: 210,
          unit: "sq_m",
          estimatedUnitPrice: 360,
          amount: 75_600,
          preferredSupplierId: SUP_FINISH,
          note: "Requested after leak test issue"
        },
        {
          id: "demo-pr-line-electrical",
          costCodeId: COST_ELECTRICAL,
          description: "Electrical panel revision",
          quantity: 1,
          unit: "lump_sum",
          estimatedUnitPrice: 86_000,
          amount: 86_000,
          preferredSupplierId: SUP_MEP,
          note: "Owner changed circuit requirement"
        }
      ],
      createdAt: now,
      updatedAt: now
    }),
    normalizePurchaseRequest({
      id: DEMO_PR_RECEIVED,
      workspaceId: DEMO_WORKSPACE_ID,
      projectId: DEMO_PROJECT_ID,
      prNo: "PR-2026-003",
      requestedBy: "project-manager",
      approvedBy: "project-director",
      status: "received",
      requestDate: "2026-05-01",
      neededByDate: "2026-05-03",
      notes: "Site supervision cost received and ready for cashflow reconciliation.",
      items: [
        {
          id: "demo-pr-line-foreman",
          costCodeId: COST_FOREMAN,
          description: "Foreman and site supervision - May",
          quantity: 1,
          unit: "month",
          estimatedUnitPrice: 220_000,
          amount: 220_000,
          preferredSupplierId: "",
          note: ""
        }
      ],
      createdAt: now,
      updatedAt: now
    })
  ];
}

function createDemoRFQs(): RFQ[] {
  const now = nowIso();
  return [
    normalizeRFQ({
      id: DEMO_RFQ_MAIN,
      workspaceId: DEMO_WORKSPACE_ID,
      projectId: DEMO_PROJECT_ID,
      prId: DEMO_PR_MAIN,
      rfqNo: "RFQ-2026-001",
      status: "awarded",
      invitedSupplierIds: [SUP_MAIN, SUP_STEEL, SUP_FINISH],
      awardedSupplierId: SUP_MAIN,
      awardedAt: "2026-04-24T10:00:00.000Z",
      awardReason: "best_payment_terms",
      createdBy: "project-manager",
      responses: [
        {
          id: "demo-rfq-response-main",
          supplierId: SUP_MAIN,
          paymentTerms: "30 days",
          deliveryDate: "2026-05-04",
          validUntil: "2026-05-15",
          notes: "One-stop delivery and credit term.",
          totalAmount: 1_401_500,
          receivedAt: "2026-04-22T09:00:00.000Z",
          receivedVia: "line",
          itemQuotes: [
            {
              prLineItemId: "demo-pr-line-steel",
              costCodeId: COST_STEEL,
              description: "Deformed bar SD40",
              unitPrice: 41_000,
              amount: 738_000,
              available: true,
              alternativeSpec: "",
              note: ""
            },
            {
              prLineItemId: "demo-pr-line-concrete",
              costCodeId: COST_CONCRETE,
              description: "RC slab concrete and formwork allowance",
              unitPrice: 3_500,
              amount: 507_500,
              available: true,
              alternativeSpec: "",
              note: ""
            },
            {
              prLineItemId: "demo-pr-line-tile",
              costCodeId: COST_TILE,
              description: "Ceramic floor tile including adhesive",
              unitPrice: 650,
              amount: 156_000,
              available: true,
              alternativeSpec: "",
              note: ""
            }
          ]
        },
        {
          id: "demo-rfq-response-steel",
          supplierId: SUP_STEEL,
          paymentTerms: "cash before delivery",
          deliveryDate: "2026-05-08",
          validUntil: "2026-05-10",
          notes: "Cheaper steel but cannot quote tile.",
          totalAmount: 723_600,
          receivedAt: "2026-04-23T11:00:00.000Z",
          receivedVia: "email",
          itemQuotes: [
            {
              prLineItemId: "demo-pr-line-steel",
              costCodeId: COST_STEEL,
              description: "Deformed bar SD40",
              unitPrice: 40_200,
              amount: 723_600,
              available: true,
              alternativeSpec: "",
              note: ""
            },
            {
              prLineItemId: "demo-pr-line-concrete",
              costCodeId: COST_CONCRETE,
              description: "RC slab concrete and formwork allowance",
              unitPrice: 0,
              amount: 0,
              available: false,
              alternativeSpec: "",
              note: "No bid"
            },
            {
              prLineItemId: "demo-pr-line-tile",
              costCodeId: COST_TILE,
              description: "Ceramic floor tile including adhesive",
              unitPrice: 0,
              amount: 0,
              available: false,
              alternativeSpec: "",
              note: "No bid"
            }
          ]
        },
        {
          id: "demo-rfq-response-finish",
          supplierId: SUP_FINISH,
          paymentTerms: "15 days",
          deliveryDate: "2026-05-06",
          validUntil: "2026-05-12",
          notes: "Best tile price but partial quote only.",
          totalAmount: 148_800,
          receivedAt: "2026-04-23T15:00:00.000Z",
          receivedVia: "manual",
          itemQuotes: [
            {
              prLineItemId: "demo-pr-line-steel",
              costCodeId: COST_STEEL,
              description: "Deformed bar SD40",
              unitPrice: 0,
              amount: 0,
              available: false,
              alternativeSpec: "",
              note: "No bid"
            },
            {
              prLineItemId: "demo-pr-line-concrete",
              costCodeId: COST_CONCRETE,
              description: "RC slab concrete and formwork allowance",
              unitPrice: 0,
              amount: 0,
              available: false,
              alternativeSpec: "",
              note: "No bid"
            },
            {
              prLineItemId: "demo-pr-line-tile",
              costCodeId: COST_TILE,
              description: "Ceramic floor tile including adhesive",
              unitPrice: 620,
              amount: 148_800,
              available: true,
              alternativeSpec: "local grade A",
              note: ""
            }
          ]
        }
      ],
      createdAt: now,
      updatedAt: now
    })
  ];
}

function createDemoCashflowEntries(): CashflowEntry[] {
  const now = nowIso();
  return normalizeCashflowState({
    entries: [
      {
        id: "demo-cash-income-deposit",
        direction: "income",
        category: "client_payment",
        amount: 1_260_000,
        description: "Milestone 1 deposit received",
        projectId: DEMO_PROJECT_ID,
        documentId: DEMO_DOCUMENT_ID,
        entryDate: "2026-05-02",
        status: "confirmed",
        sourceType: "receipt",
        sourceDocumentId: DEMO_DOCUMENT_ID,
        note: "30% deposit for demo project",
        createdAt: now,
        updatedAt: now
      },
      {
        id: "demo-cash-exp-steel",
        direction: "expense",
        category: "material",
        amount: 780_000,
        description: "Actual steel delivery SD40 - price drift after award",
        projectId: DEMO_PROJECT_ID,
        documentId: "",
        entryDate: "2026-05-08",
        status: "confirmed",
        sourceType: "rfq",
        sourceDocumentId: DEMO_RFQ_MAIN,
        costCodeId: COST_STEEL,
        supplierId: SUP_MAIN,
        prId: DEMO_PR_MAIN,
        rfqId: DEMO_RFQ_MAIN,
        quantityActual: 18,
        unitActual: "ton",
        note: "Actual invoice above RFQ by 42,000 THB",
        createdAt: now,
        updatedAt: now
      },
      {
        id: "demo-cash-exp-concrete",
        direction: "expense",
        category: "material",
        amount: 430_000,
        description: "RC slab concrete pour - first batch",
        projectId: DEMO_PROJECT_ID,
        documentId: "",
        entryDate: "2026-05-09",
        status: "confirmed",
        sourceType: "rfq",
        sourceDocumentId: DEMO_RFQ_MAIN,
        costCodeId: COST_CONCRETE,
        supplierId: SUP_MAIN,
        prId: DEMO_PR_MAIN,
        rfqId: DEMO_RFQ_MAIN,
        quantityActual: 120,
        unitActual: "sq_m",
        note: "",
        createdAt: now,
        updatedAt: now
      },
      {
        id: "demo-cash-exp-tile",
        direction: "expense",
        category: "material",
        amount: 168_000,
        description: "Ceramic floor tile - owner-selected upgrade",
        projectId: DEMO_PROJECT_ID,
        documentId: "",
        entryDate: "2026-05-11",
        status: "confirmed",
        sourceType: "rfq",
        sourceDocumentId: DEMO_RFQ_MAIN,
        costCodeId: COST_TILE,
        supplierId: SUP_MAIN,
        prId: DEMO_PR_MAIN,
        rfqId: DEMO_RFQ_MAIN,
        quantityActual: 240,
        unitActual: "sq_m",
        note: "Upgrade creates small over-budget signal",
        createdAt: now,
        updatedAt: now
      },
      {
        id: "demo-cash-exp-foreman",
        direction: "expense",
        category: "labor",
        amount: 320_000,
        description: "Foreman and site team payroll reserve",
        projectId: DEMO_PROJECT_ID,
        documentId: "",
        entryDate: "2026-05-15",
        status: "confirmed",
        sourceType: "pr",
        sourceDocumentId: DEMO_PR_RECEIVED,
        costCodeId: COST_FOREMAN,
        supplierId: "",
        prId: DEMO_PR_RECEIVED,
        quantityActual: 1,
        unitActual: "month",
        note: "Includes overtime during delay recovery",
        createdAt: now,
        updatedAt: now
      },
      {
        id: "demo-cash-draft-waterproof",
        direction: "expense",
        category: "subcontract",
        amount: 76_500,
        description: "Draft waterproofing rework cost",
        projectId: DEMO_PROJECT_ID,
        documentId: "",
        entryDate: "2026-05-18",
        status: "draft",
        sourceType: "pr",
        sourceDocumentId: DEMO_PR_PENDING,
        costCodeId: COST_WATERPROOFING,
        supplierId: SUP_FINISH,
        prId: DEMO_PR_PENDING,
        quantityActual: 210,
        unitActual: "sq_m",
        note: "Draft on purpose so tester can confirm/delete",
        createdAt: now,
        updatedAt: now
      }
    ],
    updatedAt: now
  }).entries;
}

function createDemoPriceHistory(): SupplierPriceHistoryEntry[] {
  const now = nowIso();
  return normalizeSupplierState({
    suppliers: [],
    priceHistory: [
      {
        id: "demo-price-steel-rfq",
        workspaceId: DEMO_WORKSPACE_ID,
        supplierId: SUP_MAIN,
        costCodeId: COST_STEEL,
        itemDescription: "Deformed bar SD40",
        unitPrice: 41_000,
        unit: "ton",
        quantity: 18,
        totalAmount: 738_000,
        quotedAt: "2026-04-22",
        sourceType: "rfq",
        sourceDocumentId: DEMO_RFQ_MAIN,
        note: "Awarded RFQ unit price",
        createdAt: now
      },
      {
        id: "demo-price-steel-actual",
        workspaceId: DEMO_WORKSPACE_ID,
        supplierId: SUP_MAIN,
        costCodeId: COST_STEEL,
        itemDescription: "Actual steel delivery SD40",
        unitPrice: 43_333,
        unit: "ton",
        quantity: 18,
        totalAmount: 780_000,
        quotedAt: "2026-05-08",
        sourceType: "manual",
        sourceDocumentId: "demo-cash-exp-steel",
        note: "Actual cost from cashflow",
        createdAt: now
      },
      {
        id: "demo-price-tile-rfq",
        workspaceId: DEMO_WORKSPACE_ID,
        supplierId: SUP_FINISH,
        costCodeId: COST_TILE,
        itemDescription: "Ceramic floor tile including adhesive",
        unitPrice: 620,
        unit: "sq_m",
        quantity: 240,
        totalAmount: 148_800,
        quotedAt: "2026-04-23",
        sourceType: "rfq",
        sourceDocumentId: DEMO_RFQ_MAIN,
        note: "Cheapest partial quote",
        createdAt: now
      }
    ],
    updatedAt: now
  }).priceHistory;
}

function createDemoWorkspaceRecords(): {
  client: ClientRecord;
  project: ProjectRecord;
  document: StoredDocument;
  employees: EmployeeRecord[];
  siteTeam: EmployeeSiteTeamRecord;
  defects: DefectRecord[];
} {
  const now = nowIso();
  const projectKey = getProjectSyncKey(DEMO_PROJECT_NAME, DEMO_CLIENT_NAME);
  const document = createDocumentRecord(
    {
      ...initialAppData,
      docType: "contract",
      vatEnabled: false,
      withholdingEnabled: false,
      documentStatus: "approved",
      selectedContractId: "fixed-price",
      selectedBillingMilestoneId: 2,
      documentInfo: {
        ...initialAppData.documentInfo,
        documentNo: "CT-DEMO-2605-001",
        contractNo: "CT-DEMO-2605-001",
        issueDate: "24/05/2569",
        companyName: "Buildbybim Demo Builder",
        companyAddress: "Rama 9, Bangkok",
        companyTaxId: "0105555999999",
        companyPhone: "02-123-4567",
        clientName: DEMO_CLIENT_NAME,
        clientAddress: "Rama 9, Bangkok",
        clientPhone: "02-888-0000",
        projectName: DEMO_PROJECT_NAME,
        templateName: "Residential renovation",
        creditTerms: "7 days",
        paymentTerms: "30% deposit / 40% structure / 30% handover",
        notes:
          "Demo contract used to test defect reports, project sync, and handover workflow.",
        signerName: "Demo PM"
      },
      items: [
        { id: 1, name: "Site preparation and demolition", unit: "lump_sum", qty: 1, price: 420_000 },
        { id: 2, name: "Structure and slab strengthening", unit: "lump_sum", qty: 1, price: 1_520_000 },
        { id: 3, name: "Architectural and finishing works", unit: "lump_sum", qty: 1, price: 1_180_000 },
        { id: 4, name: "MEP revision and testing", unit: "lump_sum", qty: 1, price: 680_000 },
        { id: 5, name: "Project management and handover", unit: "lump_sum", qty: 1, price: 400_000 }
      ],
      milestones: [
        { id: 1, name: "Deposit", percent: 30, due: "2026-05-02", status: "paid" },
        { id: 2, name: "Structure inspection", percent: 40, due: "2026-05-20", status: "ready" },
        { id: 3, name: "Final handover", percent: 30, due: "2026-06-15", status: "pending" }
      ],
      savedAt: now
    },
    {
      id: DEMO_DOCUMENT_ID,
      title: `${DEMO_PROJECT_NAME} - Contract`,
      createdAt: now,
      updatedAt: now,
      total: 4_200_000
    }
  );

  return {
    client: {
      id: DEMO_CLIENT_ID,
      name: DEMO_CLIENT_NAME,
      address: "Rama 9, Bangkok",
      phone: "02-888-0000",
      taxId: "0105555888888",
      updatedAt: now
    },
    project: {
      id: DEMO_WORKSPACE_PROJECT_ID,
      name: DEMO_PROJECT_NAME,
      clientId: DEMO_CLIENT_ID,
      clientName: DEMO_CLIENT_NAME,
      templateName: "Residential renovation",
      paymentTerms: "30% deposit / 40% structure / 30% handover",
      notes: "Demo workspace project for Defect and BuildDocs sync.",
      updatedAt: now
    },
    document,
    employees: [
      {
        id: "demo-employee-pm",
        name: "Demo Project Manager",
        team: "office",
        teamName: "Office",
        position: "Project Manager",
        dailyWage: 1_800,
        benefit: 250,
        workDays: 22,
        assignedProjectIds: [DEMO_WORKSPACE_PROJECT_ID],
        status: "active"
      },
      {
        id: "demo-employee-foreman",
        name: "Demo Site Foreman",
        team: "site",
        teamName: "Rama 9 Site Team",
        position: "Foreman",
        dailyWage: 950,
        benefit: 120,
        workDays: 26,
        assignedProjectIds: [DEMO_WORKSPACE_PROJECT_ID],
        status: "active"
      },
      {
        id: "demo-employee-qc",
        name: "Demo QC Inspector",
        team: "site",
        teamName: "Rama 9 Site Team",
        position: "QC Inspector",
        dailyWage: 850,
        benefit: 100,
        workDays: 24,
        assignedProjectIds: [DEMO_WORKSPACE_PROJECT_ID],
        status: "active"
      }
    ],
    siteTeam: {
      id: "demo-site-team-rama9",
      name: "Rama 9 Site Team",
      projectId: DEMO_WORKSPACE_PROJECT_ID,
      updatedAt: now
    },
    defects: [
      createDefectRecord({
        id: "demo-defect-waterproofing",
        projectKey,
        documentId: DEMO_DOCUMENT_ID,
        title: "Waterproofing leak test failed",
        area: "2F bathroom",
        due: "2026-05-26",
        owner: "Demo Finishing Plus",
        note: "Re-check membrane overlap before tiling. This links to draft waterproofing cashflow.",
        severity: "high",
        status: "open",
        photos: [
          normalizeDefectPhotoRecord({
            id: "demo-photo-waterproof-before",
            name: "waterproof-before.svg",
            dataUrl: createSvgDataUrl("Before", "Leak mark at shower corner", "#dbeafe"),
            mimeType: "image/svg+xml",
            size: 2048,
            stage: "before",
            caption: "Leak mark before rework",
            capturedAt: "2026-05-18T09:00:00.000Z"
          })
        ],
        createdAt: "2026-05-18T09:00:00.000Z",
        updatedAt: "2026-05-18T09:00:00.000Z"
      }),
      createDefectRecord({
        id: "demo-defect-tile-slope",
        projectKey,
        documentId: DEMO_DOCUMENT_ID,
        title: "Tile slope needs correction",
        area: "Kitchen entrance",
        due: "2026-05-25",
        owner: "Demo Site Foreman",
        note: "Slope is not draining to floor trap. Capture after-photo once fixed.",
        severity: "medium",
        status: "fixing",
        photos: [
          normalizeDefectPhotoRecord({
            id: "demo-photo-tile-before",
            name: "tile-before.svg",
            dataUrl: createSvgDataUrl("Before", "Kitchen tile slope issue", "#fef3c7"),
            mimeType: "image/svg+xml",
            size: 2048,
            stage: "before",
            caption: "Slope issue before correction",
            capturedAt: "2026-05-17T16:20:00.000Z"
          }),
          normalizeDefectPhotoRecord({
            id: "demo-photo-tile-checkpoint",
            name: "tile-checkpoint.svg",
            dataUrl: createSvgDataUrl("Checkpoint", "Screed adjusted before final tile", "#ecfccb"),
            mimeType: "image/svg+xml",
            size: 2048,
            stage: "checkpoint",
            caption: "Checkpoint after screed adjustment",
            capturedAt: "2026-05-19T11:10:00.000Z"
          })
        ],
        createdAt: "2026-05-17T16:20:00.000Z",
        updatedAt: "2026-05-19T11:10:00.000Z"
      }),
      createDefectRecord({
        id: "demo-defect-paint-touchup",
        projectKey,
        documentId: DEMO_DOCUMENT_ID,
        title: "Paint touch-up completed",
        area: "Living room wall",
        due: "2026-05-19",
        owner: "Demo QC Inspector",
        note: "Closed sample defect with before and after evidence.",
        severity: "low",
        status: "closed",
        photos: [
          normalizeDefectPhotoRecord({
            id: "demo-photo-paint-before",
            name: "paint-before.svg",
            dataUrl: createSvgDataUrl("Before", "Scratch on living room wall", "#fee2e2"),
            mimeType: "image/svg+xml",
            size: 2048,
            stage: "before",
            caption: "Wall scratch before touch-up",
            capturedAt: "2026-05-16T10:30:00.000Z"
          }),
          normalizeDefectPhotoRecord({
            id: "demo-photo-paint-after",
            name: "paint-after.svg",
            dataUrl: createSvgDataUrl("After", "Touch-up completed", "#dcfce7"),
            mimeType: "image/svg+xml",
            size: 2048,
            stage: "after",
            caption: "Touch-up completed",
            capturedAt: "2026-05-18T14:30:00.000Z"
          })
        ],
        createdAt: "2026-05-16T10:30:00.000Z",
        updatedAt: "2026-05-18T14:30:00.000Z"
      })
    ]
  };
}

export function seedDemoScenario(): DemoSeedResult {
  ensureSeedCostCodes();

  const demoProjects = createDemoProjects();
  const demoSuppliers = createDemoSuppliers();
  const demoPRs = createDemoPurchaseRequests();
  const demoRFQs = createDemoRFQs();
  const demoCashflowEntries = createDemoCashflowEntries();
  const demoPriceHistory = createDemoPriceHistory();
  const workspaceRecords = createDemoWorkspaceRecords();

  const projectState = normalizeProjectListState({
    projects: mergeById(loadProjects().projects, demoProjects),
    updatedAt: nowIso()
  });

  const cashflowState: CashflowState = normalizeCashflowState({
    entries: mergeById(loadCashflowState().entries, demoCashflowEntries),
    updatedAt: nowIso()
  });
  saveCashflowState(cashflowState);

  const syncedProjectState = syncProjectsFromCashflow(cashflowState, projectState);
  saveProjects(syncedProjectState);

  const supplierState: SupplierState = normalizeSupplierState({
    suppliers: mergeById(loadSuppliers().suppliers, demoSuppliers),
    priceHistory: mergeById(loadSuppliers().priceHistory, demoPriceHistory),
    updatedAt: nowIso()
  });
  saveSuppliers(supplierState);

  const prState: PRState = {
    prs: mergeById(loadPRs().prs, demoPRs),
    updatedAt: nowIso()
  };
  savePRs(prState);

  const rfqState: RFQState = {
    rfqs: mergeById(loadRFQs().rfqs, demoRFQs),
    updatedAt: nowIso()
  };
  saveRFQs(rfqState);

  const workspace = loadWorkspaceData();
  saveWorkspaceData({
    ...workspace,
    activeDocumentId: workspaceRecords.document.id,
    documents: mergeById(workspace.documents, [workspaceRecords.document]),
    clients: mergeById(workspace.clients, [workspaceRecords.client]),
    projects: mergeById(workspace.projects, [workspaceRecords.project]),
    employees: mergeById(workspace.employees, workspaceRecords.employees),
    siteTeams: mergeById(workspace.siteTeams, [workspaceRecords.siteTeam]),
    defects: mergeById(workspace.defects, workspaceRecords.defects)
  });

  return {
    projects: demoProjects.length,
    suppliers: demoSuppliers.length,
    purchaseRequests: demoPRs.length,
    rfqs: demoRFQs.length,
    cashflowEntries: demoCashflowEntries.length,
    workspaceDocuments: 1,
    defects: workspaceRecords.defects.length
  };
}

export function resetDemoScenario(): DemoResetResult {
  const now = nowIso();

  const projectState = loadProjects();
  const remainingProjects = projectState.projects.filter(
    (project) => !isDemoId(project.id) && project.workspaceId !== DEMO_WORKSPACE_ID
  );
  saveProjects(
    normalizeProjectListState({
      projects: remainingProjects,
      updatedAt: now
    })
  );

  const cashflowState = loadCashflowState();
  const remainingCashflowEntries = cashflowState.entries.filter(
    (entry) =>
      !isDemoId(entry.id) &&
      entry.projectId !== DEMO_PROJECT_ID &&
      !isDemoId(entry.documentId) &&
      !isDemoId(entry.sourceDocumentId) &&
      !isDemoId(entry.supplierId) &&
      !isDemoId(entry.prId) &&
      !isDemoId(entry.rfqId)
  );
  saveCashflowState(
    normalizeCashflowState({
      entries: remainingCashflowEntries,
      updatedAt: now
    })
  );

  const supplierState = loadSuppliers();
  const remainingSuppliers = supplierState.suppliers.filter(
    (supplier) => !isDemoId(supplier.id) && supplier.workspaceId !== DEMO_WORKSPACE_ID
  );
  const remainingPriceHistory = supplierState.priceHistory.filter(
    (entry) =>
      !isDemoId(entry.id) &&
      entry.workspaceId !== DEMO_WORKSPACE_ID &&
      !isDemoId(entry.supplierId) &&
      !isDemoId(entry.sourceDocumentId)
  );
  saveSuppliers(
    normalizeSupplierState({
      suppliers: remainingSuppliers,
      priceHistory: remainingPriceHistory,
      updatedAt: now
    })
  );

  const prState = loadPRs();
  const remainingPRs = prState.prs.filter(
    (pr) =>
      !isDemoId(pr.id) &&
      pr.workspaceId !== DEMO_WORKSPACE_ID &&
      pr.projectId !== DEMO_PROJECT_ID &&
      !isDemoId(pr.linkedRfqId) &&
      !isDemoId(pr.linkedPoDocumentId)
  );
  savePRs({
    prs: remainingPRs,
    updatedAt: now
  });

  const rfqState = loadRFQs();
  const remainingRFQs = rfqState.rfqs.filter(
    (rfq) =>
      !isDemoId(rfq.id) &&
      rfq.workspaceId !== DEMO_WORKSPACE_ID &&
      rfq.projectId !== DEMO_PROJECT_ID &&
      !isDemoId(rfq.prId)
  );
  saveRFQs({
    rfqs: remainingRFQs,
    updatedAt: now
  });

  const workspace = loadWorkspaceData();
  const remainingDocuments = workspace.documents.filter((document) => !isDemoId(document.id));
  const remainingClients = workspace.clients.filter((client) => !isDemoId(client.id));
  const remainingWorkspaceProjects = workspace.projects.filter((project) => !isDemoId(project.id));
  const remainingEmployees = workspace.employees.filter((employee) => !isDemoId(employee.id));
  const remainingSiteTeams = workspace.siteTeams.filter((siteTeam) => !isDemoId(siteTeam.id));
  const remainingDefects = workspace.defects.filter(
    (defect) =>
      !isDemoId(defect.id) &&
      !isDemoId(defect.documentId) &&
      !defect.photos.some((photo) => isDemoId(photo.id))
  );

  saveWorkspaceData({
    ...workspace,
    activeDocumentId:
      workspace.activeDocumentId && !isDemoId(workspace.activeDocumentId)
        ? workspace.activeDocumentId
        : (remainingDocuments[0]?.id ?? ""),
    documents: remainingDocuments,
    clients: remainingClients,
    projects: remainingWorkspaceProjects,
    employees: remainingEmployees,
    siteTeams: remainingSiteTeams,
    defects: remainingDefects
  });

  return {
    projects: projectState.projects.length - remainingProjects.length,
    suppliers: supplierState.suppliers.length - remainingSuppliers.length,
    purchaseRequests: prState.prs.length - remainingPRs.length,
    rfqs: rfqState.rfqs.length - remainingRFQs.length,
    cashflowEntries: cashflowState.entries.length - remainingCashflowEntries.length,
    supplierPriceHistory: supplierState.priceHistory.length - remainingPriceHistory.length,
    workspaceDocuments: workspace.documents.length - remainingDocuments.length,
    workspaceClients: workspace.clients.length - remainingClients.length,
    workspaceProjects: workspace.projects.length - remainingWorkspaceProjects.length,
    employees: workspace.employees.length - remainingEmployees.length,
    siteTeams: workspace.siteTeams.length - remainingSiteTeams.length,
    defects: workspace.defects.length - remainingDefects.length
  };
}
