import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Banknote, Check, FilePlus2, Home, Trash2 } from "lucide-react";
import type { WorkspaceAppId } from "../../../apps";
import {
  costCodeUnitCopy,
  ensureSeedCostCodes,
  type CostCodeState
} from "../../../costCodes";
import {
  cashflowCategoryCopy,
  loadCashflowState,
  removeCashflowEntry,
  saveCashflowState,
  summarizeCashflow,
  upsertCashflowEntry
} from "../../../cashflow";
import type {
  CashflowCategory,
  CashflowDirection,
  CashflowEntry,
  CashflowState
} from "../../../cashflow";
import {
  filterCashflowEntries,
  removeCashflowPriceHistory,
  syncProjectsFromCashflow,
  syncSupplierPriceHistoryFromCashflow
} from "../../../cashflow.rollup";
import {
  ensureSeedProjects,
  saveProjects,
  type ProjectListState
} from "../../../projects";
import {
  loadSuppliers,
  saveSuppliers,
  type SupplierState
} from "../../../suppliers";
import {
  evaluateLocalProjectAccess,
  filterProjectScopedRecordsByAccess,
  getProjectAccessDecisionText,
  hasActiveProjectAccessGrants,
  loadProjectAccessState
} from "../../../projectAccess";
import { PageHeader } from "../../shared/PageHeader";
import { ProjectAccessNotice } from "../../shared/ProjectAccessNotice";
import { SummaryTile } from "../../shared/SummaryTile";

type WorkspaceLanguage = "th" | "en";

type CashflowPanelProps = {
  activeTab: string;
  language: WorkspaceLanguage;
  onSelectApp: (id: WorkspaceAppId) => void;
};

const money = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 0
});

const cashflowIncomeCategories: CashflowCategory[] = [
  "client_payment",
  "loan_in",
  "other_income"
];

const cashflowExpenseCategories: CashflowCategory[] = [
  "material",
  "labor",
  "subcontract",
  "transport",
  "equipment",
  "office",
  "tax_fee",
  "other_expense"
];

const cashflowPanelCopy: Record<
  WorkspaceLanguage,
  {
    heroTitle: string;
    heroDetail: string;
    backToHub: string;
    summaryMonthIncome: string;
    summaryMonthExpense: string;
    summaryMonthNet: string;
    summaryDraftCount: string;
    summaryTotalEntries: string;
    summaryLastEntry: string;
    warningTitle: string;
    warningDetail: string;
    addFormTitle: string;
    addFormDetail: string;
    directionIncome: string;
    directionExpense: string;
    categoryLabel: string;
    amountLabel: string;
    amountPlaceholder: string;
    descriptionLabel: string;
    descriptionPlaceholder: string;
    entryDateLabel: string;
    projectLabel: string;
    noProjectOption: string;
    costCodeLabel: string;
    noCostCodeOption: string;
    supplierLabel: string;
    noSupplierOption: string;
    qtyLabel: string;
    unitLabel: string;
    filtersTitle: string;
    filterAllProjects: string;
    filterAllCostCodes: string;
    filterAllSuppliers: string;
    linkedMetaEmpty: string;
    submitDraft: string;
    submitConfirm: string;
    invalidAmount: string;
    listTitle: string;
    listDetail: string;
    listEmpty: string;
    listColDate: string;
    listColCategory: string;
    listColDescription: string;
    listColAmount: string;
    listColStatus: string;
    statusDraft: string;
    statusConfirmed: string;
    statusVoid: string;
    actionConfirm: string;
    actionDelete: string;
    deleteConfirm: string;
    forecastTitle: string;
    forecastDetail: string;
    reportsTitle: string;
    reportsDetail: string;
    projectAccessActive: string;
    projectAccessVisibleProjects: string;
    projectAccessBlocked: string;
    projectAccessWriteBlocked: string;
    projectAccessApproveBlocked: string;
  }
> = {
  th: {
    warningTitle: "Cashflow เดือนนี้ติดลบ",
    warningDetail:
      "รายจ่ายที่ยืนยันแล้วมากกว่ารายรับเดือนนี้ ตรวจ draft และรายการยืนยันก่อนอนุมัติจ่ายรอบถัดไป",
    heroTitle: "กระแสเงินสด",
    heroDetail: "บันทึกเงินเข้า-ออก ตรวจยอดสุทธิรายเดือน บันทึก draft ก่อนยืนยันได้",
    backToHub: "กลับ Hub",
    summaryMonthIncome: "รายรับเดือนนี้",
    summaryMonthExpense: "รายจ่ายเดือนนี้",
    summaryMonthNet: "สุทธิเดือนนี้",
    summaryDraftCount: "รายการรอ confirm",
    summaryTotalEntries: "รายการทั้งหมด",
    summaryLastEntry: "รายการล่าสุด",
    addFormTitle: "เพิ่มรายการ",
    addFormDetail:
      "เลือก income/expense, หมวดหมู่, ยอด แล้วบันทึกเป็น draft หรือ confirm ทันที",
    directionIncome: "รายรับ",
    directionExpense: "รายจ่าย",
    categoryLabel: "หมวด",
    amountLabel: "จำนวน (บาท)",
    amountPlaceholder: "0",
    descriptionLabel: "รายละเอียด",
    descriptionPlaceholder: "เช่น ค่าซื้อปูน, รับเงินงวด 1",
    entryDateLabel: "วันที่",
    projectLabel: "โครงการ",
    noProjectOption: "ไม่ผูกโครงการ",
    costCodeLabel: "Cost Code",
    noCostCodeOption: "ไม่ระบุหมวดต้นทุน",
    supplierLabel: "Supplier",
    noSupplierOption: "ไม่ระบุ supplier",
    qtyLabel: "จำนวนจริง",
    unitLabel: "หน่วยจริง",
    filtersTitle: "ตัวกรองรายการ",
    filterAllProjects: "ทุกโครงการ",
    filterAllCostCodes: "ทุก Cost Code",
    filterAllSuppliers: "ทุก Supplier",
    linkedMetaEmpty: "ยังไม่ผูกข้อมูล ERP",
    submitDraft: "บันทึก draft",
    submitConfirm: "บันทึก + confirm",
    invalidAmount: "ใส่จำนวนเงินที่ถูกต้องก่อนบันทึก",
    listTitle: "รายการล่าสุด",
    listDetail: "เรียงตามวันที่ใหม่สุด คลิก draft เพื่อ confirm หรือลบรายการ",
    listEmpty: "ยังไม่มีรายการ เริ่มเพิ่มที่ฟอร์มด้านบน",
    listColDate: "วันที่",
    listColCategory: "หมวด",
    listColDescription: "รายละเอียด",
    listColAmount: "ยอด",
    listColStatus: "สถานะ",
    statusDraft: "Draft",
    statusConfirmed: "Confirmed",
    statusVoid: "Void",
    actionConfirm: "Confirm",
    actionDelete: "ลบ",
    deleteConfirm: "ลบรายการนี้?",
    forecastTitle: "Forecast 90 วัน",
    forecastDetail:
      "เร็ว ๆ นี้ - คำนวณกระแสเงินสดล่วงหน้าจากรายการ recurring และงวดงานใน BuildDocs",
    reportsTitle: "Reports",
    reportsDetail:
      "เร็ว ๆ นี้ - กราฟ income/expense รายเดือน รายปี แยกตาม category และโครงการ",
    projectAccessActive: "Project Access เปิดใช้งาน",
    projectAccessVisibleProjects: "โครงการที่เห็นได้ใน Cashflow",
    projectAccessBlocked: "Project Access บล็อกการทำงานนี้",
    projectAccessWriteBlocked: "ไม่มีสิทธิ์บันทึก Cashflow โครงการนี้",
    projectAccessApproveBlocked: "ไม่มีสิทธิ์ confirm Cashflow โครงการนี้"
  },
  en: {
    warningTitle: "Cashflow is negative this month",
    warningDetail:
      "Confirmed expenses exceed income this month. Review drafts and confirmed entries before approving the next payout.",
    heroTitle: "Cashflow",
    heroDetail: "Record money in and out, check monthly net, save drafts before you confirm.",
    backToHub: "Back to Hub",
    summaryMonthIncome: "Income this month",
    summaryMonthExpense: "Expense this month",
    summaryMonthNet: "Net this month",
    summaryDraftCount: "Pending confirm",
    summaryTotalEntries: "Total entries",
    summaryLastEntry: "Last entry",
    addFormTitle: "Add entry",
    addFormDetail: "Pick income/expense, category, amount, then save as draft or confirm.",
    directionIncome: "Income",
    directionExpense: "Expense",
    categoryLabel: "Category",
    amountLabel: "Amount (THB)",
    amountPlaceholder: "0",
    descriptionLabel: "Description",
    descriptionPlaceholder: "e.g. Cement purchase, milestone 1 payment",
    entryDateLabel: "Date",
    projectLabel: "Project",
    noProjectOption: "No project",
    costCodeLabel: "Cost Code",
    noCostCodeOption: "No cost code",
    supplierLabel: "Supplier",
    noSupplierOption: "No supplier",
    qtyLabel: "Actual qty",
    unitLabel: "Actual unit",
    filtersTitle: "Entry filters",
    filterAllProjects: "All projects",
    filterAllCostCodes: "All cost codes",
    filterAllSuppliers: "All suppliers",
    linkedMetaEmpty: "No ERP links yet",
    submitDraft: "Save draft",
    submitConfirm: "Save + confirm",
    invalidAmount: "Enter a valid amount before saving",
    listTitle: "Recent entries",
    listDetail: "Sorted by newest date. Click draft to confirm or delete a row.",
    listEmpty: "No entries yet - add one using the form above.",
    listColDate: "Date",
    listColCategory: "Category",
    listColDescription: "Description",
    listColAmount: "Amount",
    listColStatus: "Status",
    statusDraft: "Draft",
    statusConfirmed: "Confirmed",
    statusVoid: "Void",
    actionConfirm: "Confirm",
    actionDelete: "Delete",
    deleteConfirm: "Delete this entry?",
    forecastTitle: "90-day forecast",
    forecastDetail:
      "Coming soon - projects upcoming cash from recurring entries and BuildDocs milestones.",
    reportsTitle: "Reports",
    reportsDetail: "Coming soon - income/expense charts by month, year, category, and project.",
    projectAccessActive: "Project Access active",
    projectAccessVisibleProjects: "projects visible in Cashflow",
    projectAccessBlocked: "Project Access blocked this action",
    projectAccessWriteBlocked: "No permission to save cashflow for this project",
    projectAccessApproveBlocked: "No permission to confirm cashflow for this project"
  }
};

export function CashflowPanel({ activeTab, language, onSelectApp }: CashflowPanelProps) {
  const copy = cashflowPanelCopy[language];
  const currentTab =
    activeTab === "forecast" || activeTab === "reports" ? activeTab : "overview";

  const [state, setState] = useState<CashflowState>(() => loadCashflowState());
  const [projectState, setProjectState] = useState<ProjectListState>(() => ensureSeedProjects());
  const [costCodeState] = useState<CostCodeState>(() => ensureSeedCostCodes());
  const [supplierState, setSupplierState] = useState<SupplierState>(() => loadSuppliers());
  const [direction, setDirection] = useState<CashflowDirection>("expense");
  const [category, setCategory] = useState<CashflowCategory>("material");
  const [amountText, setAmountText] = useState("");
  const [description, setDescription] = useState("");
  const today = new Date().toISOString().slice(0, 10);
  const [entryDate, setEntryDate] = useState(today);
  const [projectId, setProjectId] = useState("");
  const [costCodeId, setCostCodeId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [quantityText, setQuantityText] = useState("");
  const [unitActual, setUnitActual] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const [costCodeFilter, setCostCodeFilter] = useState("all");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [formError, setFormError] = useState("");

  const projectAccessState = loadProjectAccessState();
  const hasProjectAccessConfig = hasActiveProjectAccessGrants(projectAccessState);
  const availableCategories =
    direction === "income" ? cashflowIncomeCategories : cashflowExpenseCategories;
  const projects = useMemo(
    () => [...projectState.projects].sort((a, b) => a.code.localeCompare(b.code)),
    [projectState.projects]
  );
  const visibleProjects = useMemo(
    () =>
      filterProjectScopedRecordsByAccess(
        projects,
        projectAccessState,
        "cashflow.read",
        (project) => project.id,
        { includeUnscoped: false }
      ),
    [projectAccessState, projects]
  );
  const visibleEntries = useMemo(
    () =>
      filterProjectScopedRecordsByAccess(
        state.entries,
        projectAccessState,
        "cashflow.read",
        (entry) => entry.projectId,
        { includeUnscoped: true }
      ),
    [projectAccessState, state.entries]
  );
  const scopedState = useMemo(
    () => ({ ...state, entries: visibleEntries }),
    [state, visibleEntries]
  );
  const summary = useMemo(() => summarizeCashflow(scopedState), [scopedState]);
  const activeCostCodes = useMemo(
    () =>
      costCodeState.codes
        .filter((code) => code.active)
        .sort((a, b) => a.code.localeCompare(b.code)),
    [costCodeState.codes]
  );
  const activeSuppliers = useMemo(
    () =>
      supplierState.suppliers
        .filter((supplier) => supplier.active)
        .sort((a, b) => a.name.localeCompare(b.name, "th-TH")),
    [supplierState.suppliers]
  );
  const projectById = useMemo(
    () => new Map(projects.map((project) => [project.id, project])),
    [projects]
  );
  const costCodeById = useMemo(
    () => new Map(activeCostCodes.map((code) => [code.id, code])),
    [activeCostCodes]
  );
  const supplierById = useMemo(
    () => new Map(activeSuppliers.map((supplier) => [supplier.id, supplier])),
    [activeSuppliers]
  );

  useEffect(() => {
    if (!availableCategories.includes(category)) {
      setCategory(availableCategories[0]);
    }
  }, [availableCategories, category]);

  useEffect(() => {
    if (!hasProjectAccessConfig) return;
    if (projectId && !visibleProjects.some((project) => project.id === projectId)) {
      setProjectId("");
    }
    if (
      projectFilter !== "all" &&
      !visibleProjects.some((project) => project.id === projectFilter)
    ) {
      setProjectFilter("all");
    }
  }, [hasProjectAccessConfig, projectFilter, projectId, visibleProjects]);

  const persist = (
    next: CashflowState,
    opts: { syncedEntryId?: string; removedEntryId?: string } = {}
  ) => {
    setState(next);
    saveCashflowState(next);

    const nextProjects = syncProjectsFromCashflow(next, projectState);
    setProjectState(nextProjects);
    saveProjects(nextProjects);

    let nextSuppliers = supplierState;
    if (opts.removedEntryId) {
      nextSuppliers = removeCashflowPriceHistory(nextSuppliers, opts.removedEntryId);
    }
    if (opts.syncedEntryId) {
      const syncedEntry = next.entries.find((entry) => entry.id === opts.syncedEntryId);
      if (syncedEntry) {
        nextSuppliers = syncSupplierPriceHistoryFromCashflow(nextSuppliers, syncedEntry);
      }
    }
    if (nextSuppliers !== supplierState) {
      setSupplierState(nextSuppliers);
      saveSuppliers(nextSuppliers);
    }
  };

  const resetForm = () => {
    setAmountText("");
    setDescription("");
    setEntryDate(today);
    setQuantityText("");
    setUnitActual("");
    setFormError("");
  };

  const submit = (status: "draft" | "confirmed") => {
    const amount = parseFloat(amountText.replace(/,/g, ""));
    const quantityActual = parseFloat(quantityText.replace(/,/g, ""));
    const selectedCostCode = activeCostCodes.find((code) => code.id === costCodeId);
    const access = evaluateLocalProjectAccess(
      loadProjectAccessState(),
      status === "confirmed" ? "cashflow.approve" : "cashflow.write",
      projectId || undefined
    );
    if (!access.allowed) {
      setFormError(
        `${status === "confirmed" ? copy.projectAccessApproveBlocked : copy.projectAccessWriteBlocked}: ${getProjectAccessDecisionText(access)}`
      );
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setFormError(copy.invalidAmount);
      return;
    }
    const nextEntry = {
      direction,
      category,
      amount,
      description: description.trim(),
      projectId,
      costCodeId,
      supplierId,
      quantityActual: Number.isFinite(quantityActual) && quantityActual > 0 ? quantityActual : 0,
      unitActual:
        unitActual.trim() ||
        (selectedCostCode
          ? selectedCostCode.defaultUnit === "custom"
            ? selectedCostCode.customUnit
            : costCodeUnitCopy[selectedCostCode.defaultUnit].short
          : ""),
      entryDate,
      status,
      sourceType: "manual" as const
    };
    const next = upsertCashflowEntry(state, nextEntry);
    const syncedEntry = next.entries[0];
    persist(next, { syncedEntryId: syncedEntry?.id });
    resetForm();
  };

  const confirmDraft = (entry: CashflowEntry) => {
    const access = evaluateLocalProjectAccess(
      loadProjectAccessState(),
      "cashflow.approve",
      entry.projectId || undefined
    );
    if (!access.allowed) {
      setFormError(`${copy.projectAccessApproveBlocked}: ${getProjectAccessDecisionText(access)}`);
      return;
    }
    persist(upsertCashflowEntry(state, { ...entry, status: "confirmed" }), {
      syncedEntryId: entry.id
    });
  };

  const deleteEntry = (id: string) => {
    const entry = state.entries.find((item) => item.id === id);
    const access = evaluateLocalProjectAccess(
      loadProjectAccessState(),
      "cashflow.write",
      entry?.projectId || undefined
    );
    if (!access.allowed) {
      setFormError(`${copy.projectAccessWriteBlocked}: ${getProjectAccessDecisionText(access)}`);
      return;
    }
    if (typeof window !== "undefined" && !window.confirm(copy.deleteConfirm)) {
      return;
    }
    persist(removeCashflowEntry(state, id), { removedEntryId: id });
  };

  const sortedEntries = useMemo(
    () =>
      filterCashflowEntries(scopedState, {
        projectId: projectFilter,
        costCodeId: costCodeFilter,
        supplierId: supplierFilter
      }).sort((a, b) => {
        if (a.entryDate === b.entryDate) {
          return b.updatedAt.localeCompare(a.updatedAt);
        }
        return b.entryDate.localeCompare(a.entryDate);
      }),
    [costCodeFilter, projectFilter, scopedState, supplierFilter]
  );

  const draftAccess = evaluateLocalProjectAccess(
    projectAccessState,
    "cashflow.write",
    projectId || undefined
  );
  const confirmAccess = evaluateLocalProjectAccess(
    projectAccessState,
    "cashflow.approve",
    projectId || undefined
  );

  return (
    <section className="workspace-hub cashflow-app" aria-label={copy.heroTitle}>
      <div className="module-hero">
        <div>
          <h1>{copy.heroTitle}</h1>
          <p>{copy.heroDetail}</p>
        </div>
        <div className="module-actions">
          <button className="secondary-button" onClick={() => onSelectApp("hub")} type="button">
            <Home size={18} />
            {copy.backToHub}
          </button>
        </div>
      </div>

      {currentTab === "overview" && (
        <>
          <div className="summary-grid hub-summary-grid hub-summary-grid--wide">
            <SummaryTile label={copy.summaryMonthIncome} value={money.format(summary.monthIncome)} />
            <SummaryTile
              label={copy.summaryMonthExpense}
              value={money.format(summary.monthExpense)}
            />
            <SummaryTile
              label={copy.summaryMonthNet}
              value={money.format(summary.monthNet)}
              strong={summary.monthNet >= 0}
            />
            <SummaryTile label={copy.summaryDraftCount} value={`${summary.draftCount}`} />
            <SummaryTile label={copy.summaryTotalEntries} value={`${summary.entryCount}`} />
            <SummaryTile label={copy.summaryLastEntry} value={summary.lastEntryDate || "-"} />
          </div>

          {summary.monthNet < 0 && (
            <div className="cashflow-warning-board" role="status">
              <span className="cashflow-warning-icon" aria-hidden="true">
                <AlertTriangle size={18} />
              </span>
              <span className="cashflow-warning-copy">
                <strong>{copy.warningTitle}</strong>
                <small>{copy.warningDetail}</small>
              </span>
              <b>{money.format(Math.abs(summary.monthNet))}</b>
            </div>
          )}

          {hasProjectAccessConfig && (
            <ProjectAccessNotice>
              {copy.projectAccessActive}: {visibleProjects.length} / {projects.length}{" "}
              {copy.projectAccessVisibleProjects}
            </ProjectAccessNotice>
          )}

          <div className="module-board cashflow-add-board">
            <PageHeader title={copy.addFormTitle} detail={copy.addFormDetail} />
            <div className="cashflow-form">
              <div className="cashflow-form-row cashflow-direction-toggle">
                <button
                  className={direction === "income" ? "cashflow-pill on" : "cashflow-pill"}
                  onClick={() => setDirection("income")}
                  type="button"
                >
                  {copy.directionIncome}
                </button>
                <button
                  className={direction === "expense" ? "cashflow-pill on" : "cashflow-pill"}
                  onClick={() => setDirection("expense")}
                  type="button"
                >
                  {copy.directionExpense}
                </button>
              </div>

              <label className="cashflow-field">
                <span>{copy.categoryLabel}</span>
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value as CashflowCategory)}
                >
                  {availableCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cashflowCategoryCopy[cat][language]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="cashflow-field">
                <span>{copy.projectLabel}</span>
                <select value={projectId} onChange={(event) => setProjectId(event.target.value)}>
                  <option value="">{copy.noProjectOption}</option>
                  {visibleProjects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.code ? `${project.code} - ${project.name}` : project.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="cashflow-field">
                <span>{copy.costCodeLabel}</span>
                <select
                  value={costCodeId}
                  onChange={(event) => setCostCodeId(event.target.value)}
                >
                  <option value="">{copy.noCostCodeOption}</option>
                  {activeCostCodes.map((code) => (
                    <option key={code.id} value={code.id}>
                      {code.code} - {language === "th" ? code.name : code.nameEn || code.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="cashflow-field">
                <span>{copy.supplierLabel}</span>
                <select value={supplierId} onChange={(event) => setSupplierId(event.target.value)}>
                  <option value="">{copy.noSupplierOption}</option>
                  {activeSuppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.shortName ? `${supplier.shortName} - ${supplier.name}` : supplier.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="cashflow-field">
                <span>{copy.amountLabel}</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={amountText}
                  onChange={(event) => {
                    setAmountText(event.target.value);
                    setFormError("");
                  }}
                  placeholder={copy.amountPlaceholder}
                />
              </label>

              <label className="cashflow-field">
                <span>{copy.qtyLabel}</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={quantityText}
                  onChange={(event) => setQuantityText(event.target.value)}
                  placeholder="0"
                />
              </label>

              <label className="cashflow-field">
                <span>{copy.unitLabel}</span>
                <input
                  type="text"
                  value={unitActual}
                  onChange={(event) => setUnitActual(event.target.value)}
                  placeholder={
                    costCodeId && costCodeById.get(costCodeId)
                      ? costCodeById.get(costCodeId)?.defaultUnit === "custom"
                        ? costCodeById.get(costCodeId)?.customUnit
                        : costCodeUnitCopy[costCodeById.get(costCodeId)!.defaultUnit].short
                      : "-"
                  }
                />
              </label>

              <label className="cashflow-field cashflow-field--description">
                <span>{copy.descriptionLabel}</span>
                <input
                  type="text"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder={copy.descriptionPlaceholder}
                />
              </label>

              <label className="cashflow-field">
                <span>{copy.entryDateLabel}</span>
                <input
                  type="date"
                  value={entryDate}
                  onChange={(event) => setEntryDate(event.target.value || today)}
                />
              </label>

              <div className="cashflow-form-actions">
                <button
                  className="secondary-button"
                  disabled={!draftAccess.allowed}
                  onClick={() => submit("draft")}
                  title={
                    draftAccess.allowed
                      ? undefined
                      : `${copy.projectAccessWriteBlocked}: ${getProjectAccessDecisionText(draftAccess)}`
                  }
                  type="button"
                >
                  <FilePlus2 size={16} />
                  {copy.submitDraft}
                </button>
                <button
                  className="primary-button"
                  disabled={!confirmAccess.allowed}
                  onClick={() => submit("confirmed")}
                  title={
                    confirmAccess.allowed
                      ? undefined
                      : `${copy.projectAccessApproveBlocked}: ${getProjectAccessDecisionText(confirmAccess)}`
                  }
                  type="button"
                >
                  <Check size={16} />
                  {copy.submitConfirm}
                </button>
              </div>
              {formError && <p className="cashflow-form-error">{formError}</p>}
            </div>
          </div>

          <div className="module-board cashflow-list-board">
            <PageHeader title={copy.listTitle} detail={copy.listDetail} />
            <div className="cashflow-filters" aria-label={copy.filtersTitle}>
              <strong>{copy.filtersTitle}</strong>
              <select value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)}>
                <option value="all">{copy.filterAllProjects}</option>
                {visibleProjects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.code ? `${project.code} - ${project.name}` : project.name}
                  </option>
                ))}
              </select>
              <select
                value={costCodeFilter}
                onChange={(event) => setCostCodeFilter(event.target.value)}
              >
                <option value="all">{copy.filterAllCostCodes}</option>
                {activeCostCodes.map((code) => (
                  <option key={code.id} value={code.id}>
                    {code.code} - {language === "th" ? code.name : code.nameEn || code.name}
                  </option>
                ))}
              </select>
              <select
                value={supplierFilter}
                onChange={(event) => setSupplierFilter(event.target.value)}
              >
                <option value="all">{copy.filterAllSuppliers}</option>
                {activeSuppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.shortName ? `${supplier.shortName} - ${supplier.name}` : supplier.name}
                  </option>
                ))}
              </select>
            </div>
            {sortedEntries.length === 0 ? (
              <div className="hub-action-empty">
                <Banknote size={18} />
                <strong>{copy.listEmpty}</strong>
                <span>-</span>
              </div>
            ) : (
              <div className="cashflow-table">
                <div className="cashflow-table-head">
                  <span>{copy.listColDate}</span>
                  <span>{copy.listColCategory}</span>
                  <span>{copy.listColDescription}</span>
                  <span>{copy.listColAmount}</span>
                  <span>{copy.listColStatus}</span>
                  <span />
                </div>
                {sortedEntries.map((entry) => {
                  const statusLabel =
                    entry.status === "draft"
                      ? copy.statusDraft
                      : entry.status === "void"
                        ? copy.statusVoid
                        : copy.statusConfirmed;
                  const isIncome = entry.direction === "income";
                  const linkedProject = entry.projectId ? projectById.get(entry.projectId) : null;
                  const linkedCostCode = entry.costCodeId ? costCodeById.get(entry.costCodeId) : null;
                  const linkedSupplier = entry.supplierId ? supplierById.get(entry.supplierId) : null;
                  const entryConfirmAccess = evaluateLocalProjectAccess(
                    projectAccessState,
                    "cashflow.approve",
                    entry.projectId || undefined
                  );
                  const entryWriteAccess = evaluateLocalProjectAccess(
                    projectAccessState,
                    "cashflow.write",
                    entry.projectId || undefined
                  );
                  return (
                    <div
                      className={`cashflow-row cashflow-row--${entry.direction} cashflow-row--${entry.status}`}
                      key={entry.id}
                    >
                      <span className="cashflow-cell-date">{entry.entryDate}</span>
                      <span>{cashflowCategoryCopy[entry.category][language]}</span>
                      <span className="cashflow-cell-description">
                        <span>{entry.description || "-"}</span>
                        <small className="cashflow-link-chips">
                          {linkedProject && (
                            <em>
                              {linkedProject.code ? `${linkedProject.code} ` : ""}
                              {linkedProject.name}
                            </em>
                          )}
                          {linkedCostCode && <em>{linkedCostCode.code}</em>}
                          {linkedSupplier && <em>{linkedSupplier.shortName || linkedSupplier.name}</em>}
                          {!linkedProject && !linkedCostCode && !linkedSupplier && (
                            <em>{copy.linkedMetaEmpty}</em>
                          )}
                        </small>
                      </span>
                      <span className="cashflow-cell-amount">
                        {isIncome ? "+" : "-"} {money.format(entry.amount)}
                      </span>
                      <span className={`cashflow-badge cashflow-badge--${entry.status}`}>
                        {statusLabel}
                      </span>
                      <span className="cashflow-row-actions">
                        {entry.status === "draft" && (
                          <button
                            className="cashflow-row-button"
                            disabled={!entryConfirmAccess.allowed}
                            onClick={() => confirmDraft(entry)}
                            title={
                              entryConfirmAccess.allowed
                                ? undefined
                                : `${copy.projectAccessApproveBlocked}: ${getProjectAccessDecisionText(entryConfirmAccess)}`
                            }
                            type="button"
                          >
                            <Check size={13} />
                            {copy.actionConfirm}
                          </button>
                        )}
                        <button
                          className="cashflow-row-button cashflow-row-button--danger"
                          disabled={!entryWriteAccess.allowed}
                          onClick={() => deleteEntry(entry.id)}
                          title={
                            entryWriteAccess.allowed
                              ? undefined
                              : `${copy.projectAccessWriteBlocked}: ${getProjectAccessDecisionText(entryWriteAccess)}`
                          }
                          type="button"
                        >
                          <Trash2 size={13} />
                          {copy.actionDelete}
                        </button>
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {currentTab === "forecast" && (
        <div className="module-board hub-empty-board">
          <PageHeader title={copy.forecastTitle} detail={copy.forecastDetail} />
        </div>
      )}

      {currentTab === "reports" && (
        <div className="module-board hub-empty-board">
          <PageHeader title={copy.reportsTitle} detail={copy.reportsDetail} />
        </div>
      )}
    </section>
  );
}
