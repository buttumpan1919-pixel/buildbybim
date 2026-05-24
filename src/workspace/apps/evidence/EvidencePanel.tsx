import { useMemo, useState } from "react";
import {
  Archive,
  CheckCircle2,
  Download,
  FileCheck2,
  Home,
  Link2,
  Search,
  Trash2,
  Upload,
  XCircle
} from "lucide-react";
import type { WorkspaceAppId } from "../../../apps";
import { loadCashflowState } from "../../../cashflow";
import { ensureSeedCostCodes } from "../../../costCodes";
import {
  createEvidenceAsset,
  createEvidenceAssetFromFile,
  createEvidenceAssetFromFileWithCloud,
  evidenceAssetTypeCopy,
  evidenceStatusCopy,
  filterEvidenceAssets,
  loadEvidenceState,
  normalizeEvidenceLink,
  saveEvidenceState,
  setEvidenceStatus,
  summarizeEvidenceState,
  upsertEvidenceAsset,
  removeEvidenceAsset,
  validateEvidenceAsset,
  type EvidenceAsset,
  type EvidenceAssetType,
  type EvidenceLink,
  type EvidenceStatus,
  type EvidenceState
} from "../../../evidence";
import {
  getEvidenceSignedUrl,
  isStorageAvailable,
  uploadEvidenceFile
} from "../../../storage.client";
import { ensureSeedProjects } from "../../../projects";
import { loadPRs, loadRFQs } from "../../../procurement";
import { loadSuppliers } from "../../../suppliers";
import { rowsToCsv } from "../../../csvExport";
import { PageHeader } from "../../shared/PageHeader";
import { SummaryTile } from "../../shared/SummaryTile";

type WorkspaceLanguage = "th" | "en";

type EvidencePanelProps = {
  activeTab: string;
  language: WorkspaceLanguage;
  onSelectApp: (id: WorkspaceAppId) => void;
  onSelectAppTab: (appId: WorkspaceAppId, tabKey: string) => void;
};

type EvidenceFormState = {
  title: string;
  description: string;
  type: EvidenceAssetType;
  amount: string;
  tags: string;
  projectId: string;
  costCodeId: string;
  supplierId: string;
  prId: string;
  rfqId: string;
  cashflowId: string;
};

const assetTypes: EvidenceAssetType[] = [
  "receipt",
  "invoice",
  "rfq_quote",
  "delivery_note",
  "site_photo",
  "defect_photo",
  "contract",
  "other"
];

const statuses: Array<EvidenceStatus | "all"> = ["all", "draft", "verified", "rejected", "archived"];

const money = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 0
});

const copy = {
  th: {
    heroTitle: "Evidence",
    heroDetail: "หลักฐานกลางของโครงการ: ใบเสร็จ รูปหน้างาน ใบเสนอราคา invoice และไฟล์ตรวจรับ",
    backToHub: "กลับ Hub",
    openCashflow: "เปิด Cashflow",
    openProcurement: "เปิด Procurement",
    total: "หลักฐานทั้งหมด",
    needsReview: "รอตรวจ",
    verified: "ตรวจแล้ว",
    receipts: "เอกสารการเงิน",
    linkedProjects: "โครงการที่ผูก",
    libraryTitle: "Evidence Library",
    libraryDetail: "รายการหลักฐานที่ผูกกับ project, cost code, supplier และ transaction",
    intakeTitle: "Evidence Intake",
    intakeDetail: "บันทึกไฟล์หรือ metadata แล้วผูกเข้ากับ workflow ที่เกี่ยวข้อง",
    linksTitle: "Linked Evidence",
    linksDetail: "ตรวจความเชื่อมโยงของหลักฐานกับ transaction หลัก",
    reportsTitle: "Evidence Reports",
    reportsDetail: "Export รายการหลักฐานเพื่อตรวจสอบหรือส่งต่อ",
    search: "ค้นหา",
    type: "ประเภท",
    status: "สถานะ",
    project: "Project",
    all: "ทั้งหมด",
    noRows: "ยังไม่มีหลักฐานตามเงื่อนไขนี้",
    file: "ไฟล์",
    title: "ชื่อหลักฐาน",
    description: "รายละเอียด",
    amount: "ยอดเงิน",
    tags: "Tags",
    costCode: "Cost Code",
    supplier: "Supplier",
    pr: "PR",
    rfq: "RFQ",
    cashflow: "Cashflow",
    upload: "เพิ่มหลักฐาน",
    chooseFile: "เลือกไฟล์",
    noFile: "metadata only",
    takePhoto: "📷 ถ่ายรูปหน้างาน",
    takePhotoHint: "เปิดกล้องหลังของมือถือทันที",
    cloudReady: "☁ Supabase Storage พร้อมรับ — ไฟล์ขึ้น cloud อัตโนมัติ",
    localOnly: "⚠ ยังไม่ได้ตั้งค่า Supabase — ไฟล์เก็บใน browser ตัวนี้เท่านั้น",
    saved: "บันทึกหลักฐานแล้ว",
    error: "บันทึกไม่สำเร็จ",
    verify: "Verify",
    reject: "Reject",
    archive: "Archive",
    remove: "Delete",
    openFile: "Open",
    exportCsv: "Export CSV",
    rejectedReason: "เหตุผลที่ตีกลับ",
    unlinked: "ยังไม่ผูก",
    linkedCashflow: "ผูก Cashflow",
    linkedProcurement: "ผูก PR/RFQ",
    size: "ขนาด",
    source: "Source"
  },
  en: {
    heroTitle: "Evidence",
    heroDetail: "Central proof for receipts, site photos, RFQ quotes, invoices, and inspections.",
    backToHub: "Back to Hub",
    openCashflow: "Open Cashflow",
    openProcurement: "Open Procurement",
    total: "Total evidence",
    needsReview: "Needs review",
    verified: "Verified",
    receipts: "Financial docs",
    linkedProjects: "Linked projects",
    libraryTitle: "Evidence Library",
    libraryDetail: "Evidence linked to projects, cost codes, suppliers, and transactions.",
    intakeTitle: "Evidence Intake",
    intakeDetail: "Create file or metadata evidence and link it to the relevant workflow.",
    linksTitle: "Linked Evidence",
    linksDetail: "Review evidence connections to core transactions.",
    reportsTitle: "Evidence Reports",
    reportsDetail: "Export evidence rows for review and handoff.",
    search: "Search",
    type: "Type",
    status: "Status",
    project: "Project",
    all: "All",
    noRows: "No evidence matches this view.",
    file: "File",
    title: "Title",
    description: "Description",
    amount: "Amount",
    tags: "Tags",
    costCode: "Cost Code",
    supplier: "Supplier",
    pr: "PR",
    rfq: "RFQ",
    cashflow: "Cashflow",
    upload: "Add evidence",
    chooseFile: "Choose file",
    noFile: "metadata only",
    takePhoto: "📷 Take a site photo",
    takePhotoHint: "Opens the rear camera on mobile devices",
    cloudReady: "☁ Supabase Storage ready — files upload to cloud automatically",
    localOnly: "⚠ Supabase not configured — files stay on this device's browser only",
    saved: "Evidence saved.",
    error: "Save failed",
    verify: "Verify",
    reject: "Reject",
    archive: "Archive",
    remove: "Delete",
    openFile: "Open",
    exportCsv: "Export CSV",
    rejectedReason: "Rejection reason",
    unlinked: "Unlinked",
    linkedCashflow: "Linked cashflow",
    linkedProcurement: "Linked PR/RFQ",
    size: "Size",
    source: "Source"
  }
} satisfies Record<WorkspaceLanguage, Record<string, string>>;

const initialForm: EvidenceFormState = {
  title: "",
  description: "",
  type: "receipt",
  amount: "",
  tags: "",
  projectId: "",
  costCodeId: "",
  supplierId: "",
  prId: "",
  rfqId: "",
  cashflowId: ""
};

function formatSize(size: number) {
  if (size >= 1_000_000) return `${(size / 1_000_000).toFixed(1)} MB`;
  if (size >= 1_000) return `${Math.round(size / 1_000)} KB`;
  return `${size} B`;
}

function downloadTextFile(filename: string, content: string, type = "text/csv;charset=utf-8") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function optionLabel(code: string, name: string) {
  return code ? `${code} ${name}` : name;
}

export function EvidencePanel({
  activeTab,
  language,
  onSelectApp,
  onSelectAppTab
}: EvidencePanelProps) {
  const c = copy[language];
  const currentTab =
    activeTab === "intake" || activeTab === "links" || activeTab === "reports"
      ? activeTab
      : "library";
  const projects = useMemo(() => ensureSeedProjects().projects, []);
  const costCodes = useMemo(() => ensureSeedCostCodes().codes.filter((code) => code.active), []);
  const suppliers = useMemo(() => loadSuppliers().suppliers.filter((supplier) => supplier.active), []);
  const prs = useMemo(() => loadPRs().prs, []);
  const rfqs = useMemo(() => loadRFQs().rfqs, []);
  const cashflowEntries = useMemo(() => loadCashflowState().entries, []);

  const [state, setState] = useState<EvidenceState>(() => loadEvidenceState());
  const [form, setForm] = useState<EvidenceFormState>(initialForm);
  const [file, setFile] = useState<File | null>(null);
  const [feedback, setFeedback] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<EvidenceAssetType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<EvidenceStatus | "all">("all");
  const [projectFilter, setProjectFilter] = useState("all");

  const summary = useMemo(() => summarizeEvidenceState(state), [state]);
  const visibleAssets = useMemo(
    () =>
      filterEvidenceAssets(state, {
        search,
        type: typeFilter,
        status: statusFilter,
        projectId: projectFilter === "all" ? "" : projectFilter
      }).sort((first, second) => second.updatedAt.localeCompare(first.updatedAt)),
    [projectFilter, search, state, statusFilter, typeFilter]
  );

  const persist = (next: EvidenceState, message = "") => {
    setState(next);
    saveEvidenceState(next);
    setFeedback(message);
  };

  const handleCreate = async () => {
    const tags = form.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    const linkCandidates: Array<Partial<EvidenceLink> | ""> = [
      form.projectId && {
        targetType: "project" as const,
        targetId: form.projectId,
        label: projects.find((project) => project.id === form.projectId)?.name ?? form.projectId
      },
      form.costCodeId && {
        targetType: "cost_code" as const,
        targetId: form.costCodeId,
        label: costCodes.find((code) => code.id === form.costCodeId)?.name ?? form.costCodeId
      },
      form.supplierId && {
        targetType: "supplier" as const,
        targetId: form.supplierId,
        label: suppliers.find((supplier) => supplier.id === form.supplierId)?.name ?? form.supplierId
      },
      form.prId && {
        targetType: "pr" as const,
        targetId: form.prId,
        label: prs.find((pr) => pr.id === form.prId)?.prNo ?? form.prId
      },
      form.rfqId && {
        targetType: "rfq" as const,
        targetId: form.rfqId,
        label: rfqs.find((rfq) => rfq.id === form.rfqId)?.rfqNo ?? form.rfqId
      },
      form.cashflowId && {
        targetType: "cashflow_entry" as const,
        targetId: form.cashflowId,
        label: cashflowEntries.find((entry) => entry.id === form.cashflowId)?.description ?? form.cashflowId
      }
    ];
    const links = linkCandidates.flatMap((link, index) =>
      link ? [normalizeEvidenceLink(link, index)] : []
    );

    const input: Partial<EvidenceAsset> = {
      type: form.type,
      title: form.title,
      description: form.description,
      amount: form.amount ? Number(form.amount) : 0,
      tags,
      links,
      sourceAppId: form.cashflowId ? "cashflow" : form.prId || form.rfqId ? "procurement" : "evidence",
      sourceDocumentId: form.cashflowId || form.rfqId || form.prId || ""
    };
    const errors = validateEvidenceAsset({ ...input, fileName: file?.name });
    if (errors.length) {
      setFeedback(`${c.error}: ${errors[0]}`);
      return;
    }

    try {
      let asset: EvidenceAsset;
      if (file) {
        // Prefer cloud upload when Supabase Storage is wired (mobile-first
        // flow — phone capture is 2-5 MB, doesn't fit in localStorage).
        // Fallback inside createEvidenceAssetFromFileWithCloud catches
        // upload failures and writes a local dataUrl with the
        // "pending-cloud-upload" tag for Sprint 10B sync to retry.
        asset = isStorageAvailable()
          ? await createEvidenceAssetFromFileWithCloud(file, input, uploadEvidenceFile)
          : await createEvidenceAssetFromFile(file, input);
      } else {
        asset = createEvidenceAsset(input);
      }
      persist(upsertEvidenceAsset(state, asset), c.saved);
      setForm(initialForm);
      setFile(null);
    } catch (error) {
      setFeedback(`${c.error}: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const updateStatus = (asset: EvidenceAsset, status: EvidenceStatus) => {
    const reason =
      status === "rejected"
        ? window.prompt(c.rejectedReason, asset.rejectedReason || "")?.trim() ?? ""
        : "";
    if (status === "rejected" && !reason) return;
    persist(setEvidenceStatus(state, asset.id, status, "local-owner", reason));
  };

  const deleteAsset = (asset: EvidenceAsset) => {
    persist(removeEvidenceAsset(state, asset.id));
  };

  const exportCsv = () => {
    const rows = visibleAssets.map((asset) => ({
      id: asset.id,
      type: asset.type,
      status: asset.status,
      title: asset.title,
      file_name: asset.fileName,
      amount: asset.amount,
      currency: asset.currency,
      links: asset.links.map((link) => `${link.targetType}:${link.targetId}`).join("; "),
      tags: asset.tags.join("; "),
      updated_at: asset.updatedAt
    }));
    downloadTextFile(
      `evidence-${new Date().toISOString().slice(0, 10)}.csv`,
      rowsToCsv(
        ["id", "type", "status", "title", "file_name", "amount", "currency", "links", "tags", "updated_at"],
        rows
      )
    );
  };

  return (
    <section className="workspace-hub evidence-app" aria-label={c.heroTitle}>
      <div className="module-hero evidence-hero">
        <div>
          <h1>{c.heroTitle}</h1>
          <p>{c.heroDetail}</p>
        </div>
        <div className="module-actions">
          <button className="secondary-button" onClick={() => onSelectAppTab("cashflow", "overview")} type="button">
            <FileCheck2 size={18} />
            {c.openCashflow}
          </button>
          <button className="secondary-button" onClick={() => onSelectAppTab("procurement", "pr-list")} type="button">
            <Link2 size={18} />
            {c.openProcurement}
          </button>
          <button className="secondary-button" onClick={() => onSelectApp("hub")} type="button">
            <Home size={18} />
            {c.backToHub}
          </button>
        </div>
      </div>

      <div className="summary-grid hub-summary-grid hub-summary-grid--wide">
        <SummaryTile label={c.total} value={`${summary.total}`} />
        <SummaryTile label={c.needsReview} value={`${summary.draft + summary.rejected}`} strong={summary.draft + summary.rejected > 0} />
        <SummaryTile label={c.verified} value={`${summary.verified}`} />
        <SummaryTile label={c.receipts} value={`${summary.receipts}`} />
        <SummaryTile label={c.linkedProjects} value={`${summary.linkedProjects}`} />
      </div>

      {feedback && (
        <div className="evidence-feedback" role="status">
          <FileCheck2 size={16} />
          <span>{feedback}</span>
        </div>
      )}

      {currentTab === "intake" && (
        <EvidenceIntake
          c={c}
          costCodes={costCodes}
          file={file}
          form={form}
          language={language}
          projects={projects}
          prs={prs}
          rfqs={rfqs}
          cashflowEntries={cashflowEntries}
          suppliers={suppliers}
          onCreate={handleCreate}
          onFileChange={setFile}
          onFormChange={setForm}
        />
      )}

      {currentTab === "links" && (
        <EvidenceLinks c={c} assets={visibleAssets} language={language} />
      )}

      {currentTab === "reports" && (
        <EvidenceReports c={c} language={language} summary={summary} visibleAssets={visibleAssets} onExport={exportCsv} />
      )}

      {currentTab === "library" && (
        <div className="module-board evidence-library">
          <PageHeader title={c.libraryTitle} detail={c.libraryDetail} />
          <EvidenceToolbar
            c={c}
            language={language}
            projectFilter={projectFilter}
            projects={projects}
            search={search}
            statusFilter={statusFilter}
            typeFilter={typeFilter}
            onProjectFilter={setProjectFilter}
            onSearch={setSearch}
            onStatusFilter={setStatusFilter}
            onTypeFilter={setTypeFilter}
          />
          <EvidenceTable
            c={c}
            assets={visibleAssets}
            language={language}
            onArchive={(asset) => updateStatus(asset, "archived")}
            onDelete={deleteAsset}
            onReject={(asset) => updateStatus(asset, "rejected")}
            onVerify={(asset) => updateStatus(asset, "verified")}
          />
        </div>
      )}
    </section>
  );
}

function EvidenceToolbar({
  c,
  language,
  projectFilter,
  projects,
  search,
  statusFilter,
  typeFilter,
  onProjectFilter,
  onSearch,
  onStatusFilter,
  onTypeFilter
}: {
  c: Record<string, string>;
  language: WorkspaceLanguage;
  projectFilter: string;
  projects: Array<{ id: string; code: string; name: string }>;
  search: string;
  statusFilter: EvidenceStatus | "all";
  typeFilter: EvidenceAssetType | "all";
  onProjectFilter: (value: string) => void;
  onSearch: (value: string) => void;
  onStatusFilter: (value: EvidenceStatus | "all") => void;
  onTypeFilter: (value: EvidenceAssetType | "all") => void;
}) {
  return (
    <div className="evidence-toolbar">
      <label className="evidence-field evidence-field--search">
        <span>{c.search}</span>
        <div className="evidence-search-input">
          <Search size={15} />
          <input value={search} onChange={(event) => onSearch(event.target.value)} type="search" />
        </div>
      </label>
      <label className="evidence-field">
        <span>{c.type}</span>
        <select value={typeFilter} onChange={(event) => onTypeFilter(event.target.value as EvidenceAssetType | "all")}>
          <option value="all">{c.all}</option>
          {assetTypes.map((type) => (
            <option key={type} value={type}>
              {evidenceAssetTypeCopy[type][language]}
            </option>
          ))}
        </select>
      </label>
      <label className="evidence-field">
        <span>{c.status}</span>
        <select value={statusFilter} onChange={(event) => onStatusFilter(event.target.value as EvidenceStatus | "all")}>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status === "all" ? c.all : evidenceStatusCopy[status][language]}
            </option>
          ))}
        </select>
      </label>
      <label className="evidence-field">
        <span>{c.project}</span>
        <select value={projectFilter} onChange={(event) => onProjectFilter(event.target.value)}>
          <option value="all">{c.all}</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {optionLabel(project.code, project.name)}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

function EvidenceIntake({
  c,
  costCodes,
  file,
  form,
  language,
  projects,
  prs,
  rfqs,
  cashflowEntries,
  suppliers,
  onCreate,
  onFileChange,
  onFormChange
}: {
  c: Record<string, string>;
  costCodes: Array<{ id: string; code: string; name: string }>;
  file: File | null;
  form: EvidenceFormState;
  language: WorkspaceLanguage;
  projects: Array<{ id: string; code: string; name: string }>;
  prs: Array<{ id: string; prNo: string }>;
  rfqs: Array<{ id: string; rfqNo: string }>;
  cashflowEntries: Array<{ id: string; description: string; amount: number }>;
  suppliers: Array<{ id: string; name: string }>;
  onCreate: () => void;
  onFileChange: (file: File | null) => void;
  onFormChange: (form: EvidenceFormState) => void;
}) {
  const setField = <K extends keyof EvidenceFormState>(key: K, value: EvidenceFormState[K]) =>
    onFormChange({ ...form, [key]: value });

  const storageReady = isStorageAvailable();
  return (
    <div className="module-board evidence-intake">
      <PageHeader title={c.intakeTitle} detail={c.intakeDetail} />
      <div className="evidence-form-grid">
        <label className="evidence-file-drop">
          <Upload size={22} />
          <strong>{file ? file.name : c.chooseFile}</strong>
          <span>{file ? formatSize(file.size) : c.noFile}</span>
          <span
            style={{
              fontFamily: "var(--mono)",
              fontSize: 10,
              color: storageReady ? "#2A6D45" : "#92651A",
              marginTop: 4
            }}
          >
            {storageReady ? c.cloudReady : c.localOnly}
          </span>
          <input
            type="file"
            onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
          />
        </label>
        <label className="evidence-file-drop evidence-file-drop--camera">
          <span style={{ fontSize: 22 }}>📷</span>
          <strong>{c.takePhoto}</strong>
          <span>{c.takePhotoHint}</span>
          {/* capture="environment" opens the back camera directly on mobile */}
          <input
            type="file"
            onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
            accept="image/*"
            capture="environment"
          />
        </label>
        <label className="evidence-field">
          <span>{c.title}</span>
          <input value={form.title} onChange={(event) => setField("title", event.target.value)} />
        </label>
        <label className="evidence-field">
          <span>{c.type}</span>
          <select value={form.type} onChange={(event) => setField("type", event.target.value as EvidenceAssetType)}>
            {assetTypes.map((type) => (
              <option key={type} value={type}>
                {evidenceAssetTypeCopy[type][language]}
              </option>
            ))}
          </select>
        </label>
        <label className="evidence-field">
          <span>{c.amount}</span>
          <input value={form.amount} onChange={(event) => setField("amount", event.target.value)} inputMode="decimal" />
        </label>
        <label className="evidence-field evidence-field--wide">
          <span>{c.description}</span>
          <textarea value={form.description} onChange={(event) => setField("description", event.target.value)} rows={3} />
        </label>
        <label className="evidence-field">
          <span>{c.project}</span>
          <select value={form.projectId} onChange={(event) => setField("projectId", event.target.value)}>
            <option value="">{c.all}</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {optionLabel(project.code, project.name)}
              </option>
            ))}
          </select>
        </label>
        <label className="evidence-field">
          <span>{c.costCode}</span>
          <select value={form.costCodeId} onChange={(event) => setField("costCodeId", event.target.value)}>
            <option value="">{c.all}</option>
            {costCodes.map((code) => (
              <option key={code.id} value={code.id}>
                {optionLabel(code.code, code.name)}
              </option>
            ))}
          </select>
        </label>
        <label className="evidence-field">
          <span>{c.supplier}</span>
          <select value={form.supplierId} onChange={(event) => setField("supplierId", event.target.value)}>
            <option value="">{c.all}</option>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </select>
        </label>
        <label className="evidence-field">
          <span>{c.pr}</span>
          <select value={form.prId} onChange={(event) => setField("prId", event.target.value)}>
            <option value="">{c.all}</option>
            {prs.map((pr) => (
              <option key={pr.id} value={pr.id}>
                {pr.prNo}
              </option>
            ))}
          </select>
        </label>
        <label className="evidence-field">
          <span>{c.rfq}</span>
          <select value={form.rfqId} onChange={(event) => setField("rfqId", event.target.value)}>
            <option value="">{c.all}</option>
            {rfqs.map((rfq) => (
              <option key={rfq.id} value={rfq.id}>
                {rfq.rfqNo}
              </option>
            ))}
          </select>
        </label>
        <label className="evidence-field">
          <span>{c.cashflow}</span>
          <select value={form.cashflowId} onChange={(event) => setField("cashflowId", event.target.value)}>
            <option value="">{c.all}</option>
            {cashflowEntries.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.description || money.format(entry.amount)}
              </option>
            ))}
          </select>
        </label>
        <label className="evidence-field">
          <span>{c.tags}</span>
          <input value={form.tags} onChange={(event) => setField("tags", event.target.value)} />
        </label>
      </div>
      <div className="evidence-actions">
        <button className="primary-button" onClick={onCreate} type="button">
          <Upload size={18} />
          {c.upload}
        </button>
      </div>
    </div>
  );
}

function EvidenceTable({
  c,
  assets,
  language,
  onArchive,
  onDelete,
  onReject,
  onVerify,
  readOnly = false
}: {
  c: Record<string, string>;
  assets: EvidenceAsset[];
  language: WorkspaceLanguage;
  onArchive: (asset: EvidenceAsset) => void;
  onDelete: (asset: EvidenceAsset) => void;
  onReject: (asset: EvidenceAsset) => void;
  onVerify: (asset: EvidenceAsset) => void;
  readOnly?: boolean;
}) {
  return (
    <div className="evidence-table" role="table" aria-label={c.libraryTitle}>
      <div className="evidence-table-head" role="row">
        <span>{c.file}</span>
        <span>{c.source}</span>
        <span>{c.amount}</span>
        <span>{c.status}</span>
        <span>{c.size}</span>
        <span />
      </div>
      {assets.length === 0 ? (
        <div className="evidence-empty">{c.noRows}</div>
      ) : (
        assets.map((asset) => (
          <article className={`evidence-row evidence-row--${asset.status}`} key={asset.id} role="row">
            <div className="evidence-main-cell">
              <strong>{asset.title}</strong>
              <span>{asset.fileName || asset.description || evidenceAssetTypeCopy[asset.type][language]}</span>
              {asset.tags.length > 0 && (
                <div className="evidence-chip-row">
                  {asset.tags.map((tag) => (
                    <small key={tag}>{tag}</small>
                  ))}
                </div>
              )}
            </div>
            <div className="evidence-link-cell">
              <strong>{evidenceAssetTypeCopy[asset.type][language]}</strong>
              <span>{asset.links.length ? asset.links.map((link) => link.label).join(", ") : c.unlinked}</span>
            </div>
            <div className="evidence-money-cell">{asset.amount ? money.format(asset.amount) : "-"}</div>
            <div>
              <span className={`evidence-status evidence-status--${asset.status}`}>
                {evidenceStatusCopy[asset.status][language]}
              </span>
            </div>
            <div className="evidence-size-cell">{formatSize(asset.size)}</div>
            <div className="evidence-row-actions">
              {asset.dataUrl && (
                <a className="evidence-row-button" href={asset.dataUrl} download={asset.fileName || asset.title}>
                  {c.openFile}
                </a>
              )}
              {!asset.dataUrl && asset.storagePath && (
                <button
                  className="evidence-row-button"
                  type="button"
                  onClick={async () => {
                    const url = await getEvidenceSignedUrl(asset.storagePath, 600);
                    if (url && typeof window !== "undefined") {
                      window.open(url, "_blank", "noopener");
                    }
                  }}
                >
                  ☁ {c.openFile}
                </button>
              )}
              {!readOnly && (
                <>
                  {asset.status !== "verified" && (
                    <button className="evidence-row-button evidence-row-button--verify" onClick={() => onVerify(asset)} type="button">
                      <CheckCircle2 size={15} />
                      {c.verify}
                    </button>
                  )}
                  <button className="evidence-row-button" onClick={() => onReject(asset)} type="button">
                    <XCircle size={15} />
                    {c.reject}
                  </button>
                  <button className="evidence-row-button" onClick={() => onArchive(asset)} type="button">
                    <Archive size={15} />
                    {c.archive}
                  </button>
                  <button className="evidence-row-button evidence-row-button--danger" onClick={() => onDelete(asset)} type="button">
                    <Trash2 size={15} />
                    {c.remove}
                  </button>
                </>
              )}
            </div>
          </article>
        ))
      )}
    </div>
  );
}

function EvidenceLinks({
  c,
  assets,
  language
}: {
  c: Record<string, string>;
  assets: EvidenceAsset[];
  language: WorkspaceLanguage;
}) {
  return (
    <div className="module-board evidence-links">
      <PageHeader title={c.linksTitle} detail={c.linksDetail} />
      <div className="evidence-link-grid">
        {assets.length === 0 ? (
          <div className="evidence-empty">{c.noRows}</div>
        ) : (
          assets.map((asset) => (
            <article className="evidence-link-card" key={asset.id}>
              <div>
                <strong>{asset.title}</strong>
                <span>{evidenceAssetTypeCopy[asset.type][language]} / {evidenceStatusCopy[asset.status][language]}</span>
              </div>
              <div className="evidence-chip-row">
                {asset.links.length ? (
                  asset.links.map((link) => (
                    <small key={link.id}>{link.targetType}: {link.label}</small>
                  ))
                ) : (
                  <small>{c.unlinked}</small>
                )}
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}

function EvidenceReports({
  c,
  language,
  summary,
  visibleAssets,
  onExport
}: {
  c: Record<string, string>;
  language: WorkspaceLanguage;
  summary: ReturnType<typeof summarizeEvidenceState>;
  visibleAssets: EvidenceAsset[];
  onExport: () => void;
}) {
  return (
    <div className="module-board evidence-reports">
      <PageHeader title={c.reportsTitle} detail={c.reportsDetail} />
      <div className="evidence-report-grid">
        <SummaryTile label={c.unlinked} value={`${summary.unlinked}`} strong={summary.unlinked > 0} />
        <SummaryTile label={c.linkedCashflow} value={`${summary.linkedCashflow}`} />
        <SummaryTile label={c.linkedProcurement} value={`${summary.linkedProcurement}`} />
        <SummaryTile label={c.size} value={formatSize(summary.totalSize)} />
      </div>
      <div className="evidence-actions">
        <button className="secondary-button" onClick={onExport} type="button" disabled={visibleAssets.length === 0}>
          <Download size={18} />
          {c.exportCsv}
        </button>
      </div>
      <EvidenceTable
        c={c}
        assets={visibleAssets}
        language={language}
        onArchive={() => undefined}
        onDelete={() => undefined}
        onReject={() => undefined}
        onVerify={() => undefined}
        readOnly
      />
    </div>
  );
}
