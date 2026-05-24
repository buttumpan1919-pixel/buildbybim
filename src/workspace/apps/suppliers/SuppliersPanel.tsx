// SuppliersPanel — Sprint 2 (Builk parity)
// Spec: docs/SUPPLIERS_PRD.md Section 6
// Mockup reference: src/MockupGallery.tsx SuppliersMockup
//
// Routes:
//   /suppliers?tab=directory&version=0.1     (default) split-view list + detail
//   /suppliers?tab=price-history             cross-supplier price table
//   /suppliers?tab=import                    CSV import
//   /suppliers?tab=analytics                 top spend / drift (Sprint 6)

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Download,
  Home,
  Plus,
  Star,
  Trash2,
  Upload,
  Users
} from "lucide-react";
import type { WorkspaceAppId } from "../../../apps";
import {
  loadCostCodes,
  type CostCode
} from "../../../costCodes";
import {
  addPriceHistoryEntry,
  applySupplierCsvImport,
  computeAllSupplierSummaries,
  deactivateSupplier,
  detectSupplierType,
  ensureSeedSuppliers,
  formatThaiTaxId,
  loadSuppliers,
  parseSuppliersCsv,
  recentPricesForSupplier,
  removePriceHistoryEntry,
  removeSupplier,
  saveSuppliers,
  searchSuppliers,
  sortSuppliers,
  supplierTypeCopy,
  summarizeSupplierDirectory,
  upsertSupplier,
  validateSupplier,
  type PriceHistorySource,
  type Supplier,
  type SupplierState,
  type SupplierType
} from "../../../suppliers";
import { PageHeader } from "../../shared/PageHeader";
import { SummaryTile } from "../../shared/SummaryTile";

type WorkspaceLanguage = "th" | "en";

type SuppliersPanelProps = {
  activeTab: string;
  language: WorkspaceLanguage;
  onSelectApp: (id: WorkspaceAppId) => void;
};

const money = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 0
});

const shortMoney = (n: number) => {
  if (Math.abs(n) >= 1_000_000) return `฿${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `฿${(n / 1_000).toFixed(0)}K`;
  return money.format(n);
};

const LOCAL_WORKSPACE_ID = "local-workspace";

const COPY: Record<
  WorkspaceLanguage,
  {
    heroTitle: string;
    heroDetail: string;
    backToHub: string;
    summaryTotal: string;
    summaryActive: string;
    summaryHighRated: string;
    summarySpend: string;

    directoryTitle: string;
    directoryDetail: string;
    addSupplier: string;
    searchPlaceholder: string;
    sortLabel: string;
    sortName: string;
    sortSpend: string;
    sortLastOrder: string;
    sortRating: string;
    typeAll: string;

    emptyTitle: string;
    seedFirst: string;
    seedAction: string;

    detailNoSelection: string;
    detailNoSelectionHint: string;
    addPriceTitle: string;
    addPriceCta: string;
    recentPricesTitle: string;
    recentPricesEmpty: string;
    formTitleCreate: string;
    formTitleEdit: string;
    fieldName: string;
    fieldShortName: string;
    fieldType: string;
    fieldTaxId: string;
    fieldAddress: string;
    fieldCity: string;
    fieldProvince: string;
    fieldPostalCode: string;
    fieldPhone: string;
    fieldEmail: string;
    fieldLineId: string;
    fieldPaymentTerms: string;
    fieldRating: string;
    fieldNotes: string;
    fieldTags: string;
    tagsPlaceholder: string;
    fieldActive: string;
    save: string;
    cancel: string;
    edit: string;
    deactivate: string;
    confirmDelete: string;

    priceFieldCostCode: string;
    priceFieldDescription: string;
    priceFieldUnitPrice: string;
    priceFieldUnit: string;
    priceFieldQuantity: string;
    priceFieldDate: string;
    priceFieldSource: string;
    priceFieldNote: string;
    priceFieldNone: string;

    importTitle: string;
    importDetail: string;
    importPasteLabel: string;
    importParseButton: string;
    importPreviewTitle: string;
    importModeLabel: string;
    importModeSkip: string;
    importModeUpdate: string;
    importApplyButton: string;
    importValid: string;
    importInvalid: string;
    importResultPrefix: string;

    analyticsTitle: string;
    analyticsPlaceholder: string;

    priceHistoryTitle: string;
    priceHistoryEmpty: string;
    thWhen: string;
    thSupplier: string;
    thCostCode: string;
    thItem: string;
    thUnitPrice: string;
    thQty: string;
    thTotal: string;
    thSource: string;
  }
> = {
  th: {
    heroTitle: "Suppliers",
    heroDetail: "ไดเรคทอรี supplier + price history · spine ของ RFQ และบันทึกต้นทุน",
    backToHub: "กลับ Hub",
    summaryTotal: "Suppliers",
    summaryActive: "Active",
    summaryHighRated: "5⭐",
    summarySpend: "Spend 12 เดือน",

    directoryTitle: "ไดเรคทอรี",
    directoryDetail: "เลือกซัพ→ดู detail · เพิ่ม price history · เปิดปิดสถานะ",
    addSupplier: "+ เพิ่ม Supplier",
    searchPlaceholder: "ค้นหา ชื่อ/แท็ก/เมือง/เลข VAT...",
    sortLabel: "จัดเรียง",
    sortName: "ชื่อ",
    sortSpend: "Spend สูง",
    sortLastOrder: "เคยใช้ล่าสุด",
    sortRating: "Rating สูง",
    typeAll: "ทุกประเภท",

    emptyTitle: "ยังไม่มี supplier",
    seedFirst: "ใช้ตัวอย่าง 5 supplier ไทย (SCC / TPI / Insee / NorthMat / ThaiSteel) เริ่มต้นก่อนได้",
    seedAction: "ใช้ seed ตัวอย่าง",

    detailNoSelection: "ยังไม่ได้เลือก supplier",
    detailNoSelectionHint: "คลิกซัพในรายการเพื่อดูรายละเอียดและ price history",
    addPriceTitle: "เพิ่มราคาที่เคยซื้อ",
    addPriceCta: "+ Price history",
    recentPricesTitle: "ราคาที่เคยบันทึก",
    recentPricesEmpty: "ยังไม่มี price history · เพิ่มได้จากปุ่มด้านบน",
    formTitleCreate: "เพิ่ม Supplier",
    formTitleEdit: "แก้ไข Supplier",
    fieldName: "ชื่อเต็ม",
    fieldShortName: "ชื่อย่อ",
    fieldType: "ประเภท",
    fieldTaxId: "เลข VAT (13 หลัก)",
    fieldAddress: "ที่อยู่",
    fieldCity: "เมือง / อำเภอ",
    fieldProvince: "จังหวัด",
    fieldPostalCode: "รหัสไปรษณีย์",
    fieldPhone: "โทรศัพท์",
    fieldEmail: "อีเมล",
    fieldLineId: "LINE ID",
    fieldPaymentTerms: "เครดิตเทอม",
    fieldRating: "Rating",
    fieldNotes: "บันทึก",
    fieldTags: "แท็ก (คั่นด้วย comma)",
    tagsPlaceholder: "ปูน, main supplier, fast delivery",
    fieldActive: "ใช้งาน",
    save: "บันทึก",
    cancel: "ยกเลิก",
    edit: "แก้ไข",
    deactivate: "ระงับใช้งาน",
    confirmDelete: "ระงับ supplier นี้?",

    priceFieldCostCode: "Cost Code",
    priceFieldDescription: "รายการ",
    priceFieldUnitPrice: "ราคา/หน่วย",
    priceFieldUnit: "หน่วย",
    priceFieldQuantity: "จำนวน",
    priceFieldDate: "วันที่",
    priceFieldSource: "ที่มา",
    priceFieldNote: "หมายเหตุ",
    priceFieldNone: "—",

    importTitle: "Import CSV",
    importDetail: "วาง CSV หรือเลือกไฟล์ — รองรับ name, short_name, type, tax_id, city, phone, email, rating, tags",
    importPasteLabel: "วาง CSV ที่นี่",
    importParseButton: "Preview",
    importPreviewTitle: "Preview",
    importModeLabel: "ถ้ามี supplier อยู่แล้ว",
    importModeSkip: "ข้าม (เก็บของเดิม)",
    importModeUpdate: "ทับ (overwrite)",
    importApplyButton: "Apply Import",
    importValid: "valid",
    importInvalid: "invalid",
    importResultPrefix: "Import เสร็จ —",

    analyticsTitle: "Top spend / Price drift",
    analyticsPlaceholder: "Sprint 6 — pair กับ Project Control + reports",

    priceHistoryTitle: "Price History รวม",
    priceHistoryEmpty: "ยังไม่มี price history บันทึกในระบบ",
    thWhen: "วันที่",
    thSupplier: "Supplier",
    thCostCode: "Code",
    thItem: "รายการ",
    thUnitPrice: "ราคา/หน่วย",
    thQty: "จำนวน",
    thTotal: "รวม",
    thSource: "ที่มา"
  },
  en: {
    heroTitle: "Suppliers",
    heroDetail: "Supplier directory + price history — spine of RFQ and cost recording",
    backToHub: "Back to Hub",
    summaryTotal: "Suppliers",
    summaryActive: "Active",
    summaryHighRated: "5★",
    summarySpend: "12-mo spend",

    directoryTitle: "Directory",
    directoryDetail: "Pick a supplier → see detail · log a price history entry · toggle active",
    addSupplier: "+ Add supplier",
    searchPlaceholder: "Search name / tag / city / tax id...",
    sortLabel: "Sort",
    sortName: "Name",
    sortSpend: "Highest spend",
    sortLastOrder: "Most recent",
    sortRating: "Top rated",
    typeAll: "All types",

    emptyTitle: "No suppliers yet",
    seedFirst: "Seed 5 sample Thai suppliers (SCC / TPI / Insee / NorthMat / ThaiSteel) to get started",
    seedAction: "Use seed data",

    detailNoSelection: "Pick a supplier from the list",
    detailNoSelectionHint: "Click a supplier to see detail and price history",
    addPriceTitle: "Log a price history entry",
    addPriceCta: "+ Price history",
    recentPricesTitle: "Recent prices",
    recentPricesEmpty: "No price history yet — add one with the button above",
    formTitleCreate: "Add supplier",
    formTitleEdit: "Edit supplier",
    fieldName: "Full name",
    fieldShortName: "Short name",
    fieldType: "Type",
    fieldTaxId: "Tax ID (13 digits)",
    fieldAddress: "Address",
    fieldCity: "City / District",
    fieldProvince: "Province",
    fieldPostalCode: "Postal code",
    fieldPhone: "Phone",
    fieldEmail: "Email",
    fieldLineId: "LINE ID",
    fieldPaymentTerms: "Payment terms",
    fieldRating: "Rating",
    fieldNotes: "Notes",
    fieldTags: "Tags (comma-separated)",
    tagsPlaceholder: "cement, main supplier, fast delivery",
    fieldActive: "Active",
    save: "Save",
    cancel: "Cancel",
    edit: "Edit",
    deactivate: "Deactivate",
    confirmDelete: "Deactivate this supplier?",

    priceFieldCostCode: "Cost code",
    priceFieldDescription: "Item",
    priceFieldUnitPrice: "Unit price",
    priceFieldUnit: "Unit",
    priceFieldQuantity: "Quantity",
    priceFieldDate: "Date",
    priceFieldSource: "Source",
    priceFieldNote: "Note",
    priceFieldNone: "—",

    importTitle: "Import CSV",
    importDetail: "Paste CSV or pick a file — accepts name, short_name, type, tax_id, city, phone, email, rating, tags",
    importPasteLabel: "Paste CSV here",
    importParseButton: "Preview",
    importPreviewTitle: "Preview",
    importModeLabel: "On duplicate",
    importModeSkip: "Skip (keep existing)",
    importModeUpdate: "Update (overwrite)",
    importApplyButton: "Apply import",
    importValid: "valid",
    importInvalid: "invalid",
    importResultPrefix: "Import complete —",

    analyticsTitle: "Top spend / Price drift",
    analyticsPlaceholder: "Sprint 6 — pairs with Project Control + reports",

    priceHistoryTitle: "Price History (all)",
    priceHistoryEmpty: "No price history recorded yet",
    thWhen: "Date",
    thSupplier: "Supplier",
    thCostCode: "Code",
    thItem: "Item",
    thUnitPrice: "Unit price",
    thQty: "Qty",
    thTotal: "Total",
    thSource: "Source"
  }
};

type SortKey = "name" | "spend" | "lastOrder" | "rating";

const TYPE_ORDER: SupplierType[] = [
  "manufacturer",
  "distributor",
  "subcontractor",
  "service",
  "other"
];

export function SuppliersPanel({ activeTab, language, onSelectApp }: SuppliersPanelProps) {
  const copy = COPY[language];
  const [state, setState] = useState<SupplierState>(() => loadSuppliers());

  useEffect(() => {
    saveSuppliers(state);
  }, [state]);

  const summary = useMemo(() => summarizeSupplierDirectory(state), [state]);

  const seedNow = () => {
    setState(ensureSeedSuppliers(LOCAL_WORKSPACE_ID));
  };

  return (
    <section className="workspace-hub" aria-label={copy.heroTitle}>
      <div className="module-hero">
        <div>
          <h1>{copy.heroTitle}</h1>
          <p>{copy.heroDetail}</p>
        </div>
        <div className="module-actions">
          <button
            className="secondary-button"
            type="button"
            onClick={() => onSelectApp("hub")}
          >
            <Home size={18} /> {copy.backToHub}
          </button>
        </div>
      </div>

      <div className="summary-grid hub-summary-grid hub-summary-grid--wide">
        <SummaryTile label={copy.summaryTotal} value={summary.totalSuppliers.toString()} strong />
        <SummaryTile label={copy.summaryActive} value={summary.active.toString()} />
        <SummaryTile label={copy.summaryHighRated} value={summary.highRated.toString()} />
        <SummaryTile label={copy.summarySpend} value={shortMoney(summary.totalSpend)} />
      </div>

      {activeTab === "import" ? (
        <ImportTab copy={copy} state={state} onApply={(s) => setState(s)} />
      ) : activeTab === "price-history" ? (
        <PriceHistoryTab copy={copy} state={state} />
      ) : activeTab === "analytics" ? (
        <AnalyticsStub copy={copy} />
      ) : (
        <DirectoryTab
          copy={copy}
          state={state}
          setState={setState}
          onSeed={seedNow}
          language={language}
        />
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Directory tab — split-view list + detail
// ---------------------------------------------------------------------------

function DirectoryTab({
  copy,
  state,
  setState,
  onSeed,
  language
}: {
  copy: (typeof COPY)["th"];
  state: SupplierState;
  setState: React.Dispatch<React.SetStateAction<SupplierState>>;
  onSeed: () => void;
  language: WorkspaceLanguage;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<SupplierType | "all">("all");
  const [sortKey, setSortKey] = useState<SortKey>("spend");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const summaries = useMemo(() => computeAllSupplierSummaries(state), [state]);

  const filtered = useMemo(() => {
    const list = searchSuppliers(state, search).filter((s) => {
      if (typeFilter !== "all" && s.type !== typeFilter) return false;
      return true;
    });
    return sortSuppliers(list, summaries, sortKey);
  }, [state, search, typeFilter, sortKey, summaries]);

  const selectedSupplier =
    selectedId === null ? null : state.suppliers.find((s) => s.id === selectedId) ?? null;

  const handleUpsert = (candidate: Partial<Supplier>): string[] => {
    const errors = validateSupplier(candidate);
    if (errors.length > 0) return errors;
    const detectedType = candidate.type ?? detectSupplierType(candidate.name ?? "");
    setState((current) =>
      upsertSupplier(current, {
        ...candidate,
        type: detectedType,
        workspaceId: candidate.workspaceId ?? LOCAL_WORKSPACE_ID
      })
    );
    return [];
  };

  const handleDeactivate = (id: string) => {
    setState((current) => deactivateSupplier(current, id));
  };

  if (state.suppliers.length === 0 && !showCreateForm) {
    return (
      <div
        className="module-board"
        style={{
          padding: 30,
          marginTop: 14,
          textAlign: "center",
          color: "var(--ink-5)"
        }}
      >
        <Users size={28} style={{ opacity: 0.4, marginBottom: 8 }} />
        <div style={{ fontWeight: 700, fontSize: 16, color: "var(--ink)" }}>{copy.emptyTitle}</div>
        <p style={{ marginTop: 6, fontSize: 13 }}>{copy.seedFirst}</p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 14 }}>
          <button className="primary-button" type="button" onClick={() => setShowCreateForm(true)}>
            <Plus size={16} /> {copy.addSupplier}
          </button>
          <button className="secondary-button" type="button" onClick={onSeed}>
            {copy.seedAction}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 14, marginTop: 14 }}>
      {(showCreateForm || editingSupplier) && (
        <SupplierForm
          copy={copy}
          mode={editingSupplier ? "edit" : "create"}
          initial={editingSupplier ?? undefined}
          onCancel={() => {
            setShowCreateForm(false);
            setEditingSupplier(null);
          }}
          onSubmit={(candidate) => {
            const errors = handleUpsert(candidate);
            if (errors.length === 0) {
              setShowCreateForm(false);
              setEditingSupplier(null);
            }
            return errors;
          }}
          language={language}
        />
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(300px, 1fr) minmax(400px, 1.4fr)",
          gap: 14
        }}
      >
        <div className="module-board" style={{ padding: 16 }}>
          <PageHeader title={copy.directoryTitle} detail={copy.directoryDetail} />

          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={copy.searchPlaceholder}
              style={inputStyle}
            />
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as SupplierType | "all")}
              style={{ ...inputStyle, flex: "1 1 140px" }}
            >
              <option value="all">{copy.typeAll}</option>
              {TYPE_ORDER.map((t) => (
                <option key={t} value={t}>
                  {supplierTypeCopy[t][language]}
                </option>
              ))}
            </select>
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              style={{ ...inputStyle, flex: "1 1 140px" }}
            >
              <option value="spend">{copy.sortLabel}: {copy.sortSpend}</option>
              <option value="lastOrder">{copy.sortLabel}: {copy.sortLastOrder}</option>
              <option value="rating">{copy.sortLabel}: {copy.sortRating}</option>
              <option value="name">{copy.sortLabel}: {copy.sortName}</option>
            </select>
            <button
              className="primary-button"
              type="button"
              onClick={() => {
                setShowCreateForm(true);
                setEditingSupplier(null);
              }}
            >
              <Plus size={16} /> {copy.addSupplier}
            </button>
          </div>

          <div style={{ display: "grid", gap: 6, marginTop: 14 }}>
            {filtered.map((s) => {
              const summary = summaries.get(s.id);
              const isActive = selectedId === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedId(s.id)}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    gap: 8,
                    alignItems: "center",
                    padding: "10px 12px",
                    border: isActive ? "1px solid var(--ink)" : "1px solid var(--line)",
                    borderRadius: 6,
                    background: isActive ? "#F4F4F2" : "var(--panel)",
                    cursor: "pointer",
                    textAlign: "left",
                    font: "inherit",
                    color: "inherit",
                    opacity: s.active ? 1 : 0.55
                  }}
                >
                  <div style={{ display: "grid", gap: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <RatingStars rating={s.rating} size={11} />
                      <strong style={{ fontSize: 13 }}>{s.shortName || s.name}</strong>
                      {!s.active && (
                        <span
                          style={{
                            fontFamily: "var(--mono)",
                            fontSize: 9,
                            padding: "1px 4px",
                            background: "#FFE6E1",
                            color: "#B23E1F",
                            borderRadius: 3
                          }}
                        >
                          INACTIVE
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--ink-5)",
                        fontFamily: "var(--mono)"
                      }}
                    >
                      {supplierTypeCopy[s.type][language]} · {s.city || "—"}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontFamily: "var(--mono)",
                        fontSize: 12,
                        fontWeight: 700
                      }}
                    >
                      {shortMoney(summary?.totalSpend ?? 0)}
                    </div>
                    <div
                      style={{ fontSize: 10, color: "var(--ink-5)", fontFamily: "var(--mono)" }}
                    >
                      {summary && summary.orderCount > 0 ? `${summary.orderCount} orders` : "—"}
                    </div>
                  </div>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: 16,
                  color: "var(--ink-5)",
                  fontSize: 13
                }}
              >
                {copy.emptyTitle}
              </div>
            )}
          </div>
        </div>

        <div className="module-board" style={{ padding: 16, minHeight: 320 }}>
          {selectedSupplier ? (
            <DetailPane
              copy={copy}
              supplier={selectedSupplier}
              state={state}
              setState={setState}
              onEdit={() => setEditingSupplier(selectedSupplier)}
              onDeactivate={() => {
                if (
                  typeof window !== "undefined" &&
                  window.confirm(copy.confirmDelete)
                ) {
                  handleDeactivate(selectedSupplier.id);
                }
              }}
              language={language}
            />
          ) : (
            <div style={{ textAlign: "center", padding: 40, color: "var(--ink-5)" }}>
              <Users size={28} style={{ opacity: 0.4, marginBottom: 8 }} />
              <div style={{ fontWeight: 700 }}>{copy.detailNoSelection}</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>{copy.detailNoSelectionHint}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailPane({
  copy,
  supplier,
  state,
  setState,
  onEdit,
  onDeactivate,
  language
}: {
  copy: (typeof COPY)["th"];
  supplier: Supplier;
  state: SupplierState;
  setState: React.Dispatch<React.SetStateAction<SupplierState>>;
  onEdit: () => void;
  onDeactivate: () => void;
  language: WorkspaceLanguage;
}) {
  const [showPriceForm, setShowPriceForm] = useState(false);
  const costCodeState = useMemo(() => loadCostCodes(), []);
  const recent = useMemo(
    () => recentPricesForSupplier(state, supplier.id, 10),
    [state, supplier.id]
  );

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18 }}>{supplier.name}</h2>
          <div
            style={{
              marginTop: 4,
              fontFamily: "var(--mono)",
              fontSize: 12,
              color: "var(--ink-5)"
            }}
          >
            {supplier.shortName && <>{supplier.shortName} · </>}
            {supplierTypeCopy[supplier.type][language]} ·{" "}
            {supplier.taxId ? formatThaiTaxId(supplier.taxId) : "no tax id"}
          </div>
        </div>
        <RatingStars rating={supplier.rating} size={16} />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 8,
          fontSize: 12
        }}
      >
        <DetailField label={copy.fieldCity} value={supplier.city} />
        <DetailField label={copy.fieldProvince} value={supplier.province} />
        <DetailField label={copy.fieldPhone} value={supplier.phone} />
        <DetailField label={copy.fieldEmail} value={supplier.email} />
        <DetailField label={copy.fieldLineId} value={supplier.lineId} />
        <DetailField label={copy.fieldPaymentTerms} value={supplier.paymentTerms} />
      </div>

      {supplier.tags.length > 0 && (
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {supplier.tags.map((t) => (
            <span
              key={t}
              style={{
                fontSize: 11,
                padding: "2px 8px",
                background: "#EAEAE7",
                borderRadius: 999,
                fontFamily: "var(--mono)"
              }}
            >
              {t}
            </span>
          ))}
        </div>
      )}

      {supplier.notes && (
        <div
          style={{
            fontSize: 12,
            padding: 10,
            border: "1px dashed var(--line)",
            borderRadius: 6,
            color: "var(--ink-4)",
            whiteSpace: "pre-wrap"
          }}
        >
          {supplier.notes}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button className="secondary-button" type="button" onClick={onEdit}>
          {copy.edit}
        </button>
        {supplier.active && (
          <button
            className="secondary-button"
            type="button"
            onClick={onDeactivate}
            style={{ color: "#B23E1F" }}
          >
            <Trash2 size={14} /> {copy.deactivate}
          </button>
        )}
        <button
          className="primary-button"
          type="button"
          onClick={() => setShowPriceForm(true)}
          style={{ marginLeft: "auto" }}
        >
          <Plus size={14} /> {copy.addPriceCta}
        </button>
      </div>

      {showPriceForm && (
        <PriceHistoryForm
          copy={copy}
          supplier={supplier}
          costCodes={costCodeState.codes}
          onCancel={() => setShowPriceForm(false)}
          onSave={(entry) => {
            setState((current) =>
              addPriceHistoryEntry(current, {
                ...entry,
                supplierId: supplier.id,
                workspaceId: supplier.workspaceId
              })
            );
            setShowPriceForm(false);
          }}
          language={language}
        />
      )}

      <div style={{ marginTop: 6 }}>
        <PageHeader title={copy.recentPricesTitle} detail="" />
        {recent.length === 0 ? (
          <p
            style={{
              marginTop: 8,
              color: "var(--ink-5)",
              fontSize: 12,
              fontStyle: "italic"
            }}
          >
            {copy.recentPricesEmpty}
          </p>
        ) : (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 12,
              marginTop: 8
            }}
          >
            <thead>
              <tr>
                {[copy.thWhen, copy.thCostCode, copy.thItem, copy.thUnitPrice, copy.thSource, ""].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: "6px 8px",
                      fontFamily: "var(--mono)",
                      fontSize: 10,
                      color: "var(--ink-5)",
                      textTransform: "uppercase"
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.map((rp) => (
                <tr key={rp.entry.id} style={{ borderTop: "1px solid var(--line)" }}>
                  <td style={{ padding: "6px 8px", fontFamily: "var(--mono)" }}>
                    {rp.entry.quotedAt}
                  </td>
                  <td style={{ padding: "6px 8px", fontFamily: "var(--mono)" }}>
                    {rp.entry.costCodeId || "—"}
                  </td>
                  <td style={{ padding: "6px 8px" }}>{rp.entry.itemDescription || "—"}</td>
                  <td
                    style={{ padding: "6px 8px", fontFamily: "var(--mono)", textAlign: "right" }}
                  >
                    {money.format(rp.entry.unitPrice)} / {rp.entry.unit}
                    {rp.driftPct !== null && (
                      <span
                        style={{
                          marginLeft: 6,
                          color: rp.driftPct > 0 ? "#B23E1F" : "#2A6D45",
                          fontSize: 11
                        }}
                      >
                        {rp.driftPct > 0 ? "+" : ""}
                        {rp.driftPct.toFixed(1)}%
                        {rp.driftPct > 0 ? " ↑" : " ↓"}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "6px 8px", fontSize: 11, color: "var(--ink-5)" }}>
                    {rp.entry.sourceType}
                  </td>
                  <td style={{ padding: "6px 8px", textAlign: "right" }}>
                    <button
                      type="button"
                      onClick={() =>
                        setState((current) => removePriceHistoryEntry(current, rp.entry.id))
                      }
                      style={{
                        border: 0,
                        background: "transparent",
                        cursor: "pointer",
                        color: "var(--ink-5)"
                      }}
                      aria-label="remove price"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "grid", gap: 2 }}>
      <span
        style={{
          fontFamily: "var(--mono)",
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: "var(--ink-5)"
        }}
      >
        {label}
      </span>
      <span style={{ fontSize: 13, color: value ? "var(--ink)" : "var(--ink-5)" }}>
        {value || "—"}
      </span>
    </div>
  );
}

function RatingStars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span style={{ display: "inline-flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          fill={i <= rating ? "#92651A" : "none"}
          stroke={i <= rating ? "#92651A" : "#C7C7C2"}
          strokeWidth={1.5}
        />
      ))}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Supplier form
// ---------------------------------------------------------------------------

function SupplierForm({
  copy,
  mode,
  initial,
  onCancel,
  onSubmit,
  language
}: {
  copy: (typeof COPY)["th"];
  mode: "create" | "edit";
  initial?: Supplier;
  onCancel: () => void;
  onSubmit: (candidate: Partial<Supplier>) => string[];
  language: WorkspaceLanguage;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [shortName, setShortName] = useState(initial?.shortName ?? "");
  const [type, setType] = useState<SupplierType>(initial?.type ?? "other");
  const [taxId, setTaxId] = useState(initial?.taxId ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [province, setProvince] = useState(initial?.province ?? "");
  const [postalCode, setPostalCode] = useState(initial?.postalCode ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [lineId, setLineId] = useState(initial?.lineId ?? "");
  const [paymentTerms, setPaymentTerms] = useState(initial?.paymentTerms ?? "");
  const [rating, setRating] = useState<number>(initial?.rating ?? 0);
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [tagsInput, setTagsInput] = useState(initial?.tags.join(", ") ?? "");
  const [active, setActive] = useState<boolean>(initial?.active ?? true);
  const [errors, setErrors] = useState<string[]>([]);

  const handleNameChange = (value: string) => {
    setName(value);
    if (!initial && type === "other") {
      setType(detectSupplierType(value));
    }
  };

  const handleSubmit = () => {
    const candidate: Partial<Supplier> = {
      id: initial?.id,
      workspaceId: initial?.workspaceId,
      name,
      shortName,
      type,
      taxId,
      address,
      city,
      province,
      postalCode,
      phone,
      email,
      lineId,
      paymentTerms,
      rating,
      notes,
      tags: tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      active
    };
    const result = onSubmit(candidate);
    setErrors(result);
  };

  return (
    <div
      style={{
        padding: 16,
        border: "1px solid var(--line)",
        borderRadius: 8,
        background: "var(--panel)"
      }}
    >
      <PageHeader title={mode === "create" ? copy.formTitleCreate : copy.formTitleEdit} detail="" />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 12,
          marginTop: 14
        }}
      >
        <FormField label={copy.fieldName} required>
          <input value={name} onChange={(e) => handleNameChange(e.target.value)} style={inputStyle} />
        </FormField>
        <FormField label={copy.fieldShortName}>
          <input value={shortName} onChange={(e) => setShortName(e.target.value)} style={inputStyle} />
        </FormField>
        <FormField label={copy.fieldType}>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as SupplierType)}
            style={inputStyle}
          >
            {TYPE_ORDER.map((t) => (
              <option key={t} value={t}>
                {supplierTypeCopy[t][language]}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label={copy.fieldTaxId}>
          <input
            value={taxId}
            onChange={(e) => setTaxId(e.target.value)}
            onBlur={(e) => {
              const digits = e.target.value.replace(/\D/g, "");
              if (digits.length === 13) setTaxId(formatThaiTaxId(digits));
            }}
            style={inputStyle}
            placeholder="0-1057-12345-67-8"
          />
        </FormField>
        <FormField label={copy.fieldPhone}>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle} />
        </FormField>
        <FormField label={copy.fieldEmail}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />
        </FormField>
        <FormField label={copy.fieldLineId}>
          <input value={lineId} onChange={(e) => setLineId(e.target.value)} style={inputStyle} />
        </FormField>
        <FormField label={copy.fieldPaymentTerms}>
          <input
            value={paymentTerms}
            onChange={(e) => setPaymentTerms(e.target.value)}
            list="payment-terms-suggestions"
            style={inputStyle}
            placeholder="Cash / 30 days / 45 days"
          />
          <datalist id="payment-terms-suggestions">
            <option value="Cash" />
            <option value="7 days" />
            <option value="15 days" />
            <option value="30 days" />
            <option value="45 days" />
            <option value="60 days" />
            <option value="90 days" />
          </datalist>
        </FormField>
        <FormField label={copy.fieldCity}>
          <input value={city} onChange={(e) => setCity(e.target.value)} style={inputStyle} />
        </FormField>
        <FormField label={copy.fieldProvince}>
          <input value={province} onChange={(e) => setProvince(e.target.value)} style={inputStyle} />
        </FormField>
        <FormField label={copy.fieldPostalCode}>
          <input
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            style={inputStyle}
          />
        </FormField>
        <FormField label={copy.fieldRating}>
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            {[0, 1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                style={{
                  background: "transparent",
                  border: 0,
                  cursor: "pointer",
                  padding: 2,
                  fontFamily: "var(--mono)",
                  fontSize: 12,
                  color: n === rating ? "#92651A" : "var(--ink-5)"
                }}
              >
                {n === 0 ? "—" : "★".repeat(n)}
              </button>
            ))}
          </div>
        </FormField>
        <FormField label={copy.fieldActive}>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
            />
            {active ? "active" : "inactive"}
          </label>
        </FormField>
      </div>
      <FormField label={copy.fieldAddress}>
        <input value={address} onChange={(e) => setAddress(e.target.value)} style={inputStyle} />
      </FormField>
      <FormField label={copy.fieldTags}>
        <input
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder={copy.tagsPlaceholder}
          style={inputStyle}
        />
      </FormField>
      <FormField label={copy.fieldNotes}>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          style={{ ...inputStyle, resize: "vertical" }}
        />
      </FormField>
      {errors.length > 0 && (
        <div
          style={{
            marginTop: 10,
            padding: 10,
            background: "#FFE6E1",
            color: "#B23E1F",
            borderRadius: 6,
            fontSize: 13
          }}
        >
          <AlertTriangle size={14} style={{ verticalAlign: "middle", marginRight: 6 }} />
          {errors.join(" · ")}
        </div>
      )}
      <div style={{ display: "flex", gap: 8, marginTop: 14, justifyContent: "flex-end" }}>
        <button className="secondary-button" type="button" onClick={onCancel}>
          {copy.cancel}
        </button>
        <button className="primary-button" type="button" onClick={handleSubmit}>
          {copy.save}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Price history form (inline in detail pane)
// ---------------------------------------------------------------------------

function PriceHistoryForm({
  copy,
  supplier,
  costCodes,
  onCancel,
  onSave,
  language
}: {
  copy: (typeof COPY)["th"];
  supplier: Supplier;
  costCodes: CostCode[];
  onCancel: () => void;
  onSave: (entry: {
    costCodeId: string;
    itemDescription: string;
    unitPrice: number;
    unit: string;
    quantity: number;
    quotedAt: string;
    sourceType: PriceHistorySource;
    note: string;
  }) => void;
  language: WorkspaceLanguage;
}) {
  const [costCodeId, setCostCodeId] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [unit, setUnit] = useState("");
  const [quantity, setQuantity] = useState("");
  const [quotedAt, setQuotedAt] = useState(new Date().toISOString().slice(0, 10));
  const [sourceType, setSourceType] = useState<PriceHistorySource>("manual");
  const [note, setNote] = useState("");

  const handleSubmit = () => {
    const price = parseFloat(unitPrice);
    if (!Number.isFinite(price) || price <= 0) return;
    onSave({
      costCodeId,
      itemDescription,
      unitPrice: price,
      unit,
      quantity: parseFloat(quantity) || 0,
      quotedAt,
      sourceType,
      note
    });
  };

  return (
    <div
      style={{
        padding: 14,
        border: "1px solid var(--line)",
        borderRadius: 6,
        background: "var(--panel-soft, #F4F4F2)"
      }}
    >
      <strong style={{ fontSize: 14 }}>
        {copy.addPriceTitle} — {supplier.shortName || supplier.name}
      </strong>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 8,
          marginTop: 10
        }}
      >
        <FormField label={copy.priceFieldCostCode}>
          <select
            value={costCodeId}
            onChange={(e) => setCostCodeId(e.target.value)}
            style={inputStyle}
          >
            <option value="">{copy.priceFieldNone}</option>
            {costCodes
              .filter((c) => c.active)
              .map((c) => (
                <option key={c.id} value={c.code}>
                  {c.code} · {c.name}
                </option>
              ))}
          </select>
        </FormField>
        <FormField label={copy.priceFieldDescription}>
          <input
            value={itemDescription}
            onChange={(e) => setItemDescription(e.target.value)}
            style={inputStyle}
          />
        </FormField>
        <FormField label={copy.priceFieldUnitPrice} required>
          <input
            type="number"
            min="0"
            value={unitPrice}
            onChange={(e) => setUnitPrice(e.target.value)}
            style={inputStyle}
          />
        </FormField>
        <FormField label={copy.priceFieldUnit}>
          <input
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="ถุง / kg / ตัน"
            style={inputStyle}
          />
        </FormField>
        <FormField label={copy.priceFieldQuantity}>
          <input
            type="number"
            min="0"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            style={inputStyle}
          />
        </FormField>
        <FormField label={copy.priceFieldDate}>
          <input
            type="date"
            value={quotedAt}
            onChange={(e) => setQuotedAt(e.target.value)}
            style={inputStyle}
          />
        </FormField>
        <FormField label={copy.priceFieldSource}>
          <select
            value={sourceType}
            onChange={(e) => setSourceType(e.target.value as PriceHistorySource)}
            style={inputStyle}
          >
            <option value="manual">manual</option>
            <option value="rfq">rfq</option>
            <option value="po">po</option>
            <option value="line_intake">line</option>
          </select>
        </FormField>
      </div>
      <FormField label={copy.priceFieldNote}>
        <input value={note} onChange={(e) => setNote(e.target.value)} style={inputStyle} />
      </FormField>
      <div style={{ display: "flex", gap: 8, marginTop: 10, justifyContent: "flex-end" }}>
        <button className="secondary-button" type="button" onClick={onCancel}>
          {copy.cancel}
        </button>
        <button className="primary-button" type="button" onClick={handleSubmit}>
          {copy.save}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Other tabs
// ---------------------------------------------------------------------------

function PriceHistoryTab({
  copy,
  state
}: {
  copy: (typeof COPY)["th"];
  state: SupplierState;
}) {
  const sorted = useMemo(
    () => [...state.priceHistory].sort((a, b) => b.quotedAt.localeCompare(a.quotedAt)),
    [state.priceHistory]
  );
  const supplierById = useMemo(() => {
    const map = new Map<string, Supplier>();
    for (const s of state.suppliers) map.set(s.id, s);
    return map;
  }, [state.suppliers]);

  return (
    <div className="module-board" style={{ padding: 18, marginTop: 14 }}>
      <PageHeader title={copy.priceHistoryTitle} detail="" />
      {sorted.length === 0 ? (
        <p style={{ marginTop: 14, color: "var(--ink-5)", fontStyle: "italic" }}>
          {copy.priceHistoryEmpty}
        </p>
      ) : (
        <div style={{ overflowX: "auto", marginTop: 14 }}>
          <table
            style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 760 }}
          >
            <thead>
              <tr>
                {[
                  copy.thWhen,
                  copy.thSupplier,
                  copy.thCostCode,
                  copy.thItem,
                  copy.thUnitPrice,
                  copy.thQty,
                  copy.thTotal,
                  copy.thSource
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: "8px 10px",
                      background: "var(--panel-soft, #F4F4F2)",
                      fontFamily: "var(--mono)",
                      fontSize: 10,
                      textTransform: "uppercase",
                      color: "var(--ink-5)"
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((p) => (
                <tr key={p.id} style={{ borderTop: "1px solid var(--line)" }}>
                  <td style={{ padding: "8px 10px", fontFamily: "var(--mono)" }}>
                    {p.quotedAt}
                  </td>
                  <td style={{ padding: "8px 10px" }}>
                    {supplierById.get(p.supplierId)?.shortName ||
                      supplierById.get(p.supplierId)?.name ||
                      "—"}
                  </td>
                  <td style={{ padding: "8px 10px", fontFamily: "var(--mono)" }}>
                    {p.costCodeId || "—"}
                  </td>
                  <td style={{ padding: "8px 10px" }}>{p.itemDescription || "—"}</td>
                  <td style={{ padding: "8px 10px", fontFamily: "var(--mono)", textAlign: "right" }}>
                    {money.format(p.unitPrice)} / {p.unit}
                  </td>
                  <td style={{ padding: "8px 10px", fontFamily: "var(--mono)", textAlign: "right" }}>
                    {p.quantity || "—"}
                  </td>
                  <td
                    style={{
                      padding: "8px 10px",
                      fontFamily: "var(--mono)",
                      fontWeight: 700,
                      textAlign: "right"
                    }}
                  >
                    {money.format(p.totalAmount)}
                  </td>
                  <td style={{ padding: "8px 10px", fontSize: 11, color: "var(--ink-5)" }}>
                    {p.sourceType}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ImportTab({
  copy,
  state,
  onApply
}: {
  copy: (typeof COPY)["th"];
  state: SupplierState;
  onApply: (state: SupplierState) => void;
}) {
  const [csvText, setCsvText] = useState("");
  const [preview, setPreview] = useState<ReturnType<typeof parseSuppliersCsv> | null>(null);
  const [mode, setMode] = useState<"skip_duplicates" | "update_existing">("skip_duplicates");
  const [resultMsg, setResultMsg] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);

  const handlePreview = () => {
    setPreview(parseSuppliersCsv(csvText, LOCAL_WORKSPACE_ID));
    setResultMsg("");
  };

  const handleApply = () => {
    if (!preview) return;
    const applied = applySupplierCsvImport(state, preview.rows, mode, LOCAL_WORKSPACE_ID);
    onApply(applied.state);
    setResultMsg(
      `${copy.importResultPrefix} added ${applied.added} · updated ${applied.updated} · skipped ${applied.skipped}`
    );
    setPreview(null);
    setCsvText("");
  };

  const handleFile = async (file: File | null) => {
    if (!file) return;
    const text = await file.text();
    setCsvText(text);
    setPreview(parseSuppliersCsv(text, LOCAL_WORKSPACE_ID));
    setResultMsg("");
  };

  return (
    <div className="module-board" style={{ padding: 18, marginTop: 14 }}>
      <PageHeader title={copy.importTitle} detail={copy.importDetail} />
      <textarea
        value={csvText}
        onChange={(e) => setCsvText(e.target.value)}
        rows={6}
        placeholder="name,short_name,type,tax_id,city,phone,rating&#10;บจก. SCC,SCC,manufacturer,0105000000001,Bangkok,02-100-1000,5"
        style={{ ...inputStyle, fontFamily: "var(--mono)", fontSize: 12, marginTop: 10 }}
      />
      <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          style={{ display: "none" }}
        />
        <button
          className="secondary-button"
          type="button"
          onClick={() => fileRef.current?.click()}
        >
          <Upload size={16} /> CSV file
        </button>
        <button
          className="primary-button"
          type="button"
          onClick={handlePreview}
          disabled={!csvText.trim()}
        >
          {copy.importParseButton}
        </button>
      </div>

      {preview && (
        <div style={{ marginTop: 14 }}>
          <PageHeader
            title={copy.importPreviewTitle}
            detail={`${preview.validRows.length} ${copy.importValid} · ${preview.invalidRows.length} ${copy.importInvalid}`}
          />
          <table
            style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginTop: 8 }}
          >
            <thead>
              <tr>
                {["#", "name", "type", "tax_id", "city", "rating", "status"].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: "6px 8px",
                      background: "var(--panel-soft, #F4F4F2)",
                      fontFamily: "var(--mono)",
                      fontSize: 10,
                      textTransform: "uppercase",
                      color: "var(--ink-5)"
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.rows.slice(0, 30).map((row) => {
                const p = row.parsed ?? {};
                const ok = row.errors.length === 0;
                return (
                  <tr
                    key={row.rowIndex}
                    style={{
                      borderTop: "1px solid var(--line)",
                      background: ok ? "transparent" : "#FFE6E1"
                    }}
                  >
                    <td style={{ padding: "6px 8px", fontFamily: "var(--mono)" }}>
                      {row.rowIndex + 1}
                    </td>
                    <td style={{ padding: "6px 8px" }}>{p.name ?? "—"}</td>
                    <td style={{ padding: "6px 8px", fontSize: 11, color: "var(--ink-5)" }}>
                      {p.type ?? "—"}
                    </td>
                    <td style={{ padding: "6px 8px", fontFamily: "var(--mono)" }}>
                      {p.taxId ?? "—"}
                    </td>
                    <td style={{ padding: "6px 8px" }}>{p.city ?? "—"}</td>
                    <td style={{ padding: "6px 8px", fontFamily: "var(--mono)" }}>
                      {p.rating ?? "—"}
                    </td>
                    <td style={{ padding: "6px 8px", color: ok ? "#2A6D45" : "#B23E1F" }}>
                      {ok ? "OK" : row.errors.join(", ")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              flexWrap: "wrap",
              marginTop: 14
            }}
          >
            <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--ink-5)" }}>
              {copy.importModeLabel}:
            </span>
            <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}>
              <input
                type="radio"
                checked={mode === "skip_duplicates"}
                onChange={() => setMode("skip_duplicates")}
              />
              {copy.importModeSkip}
            </label>
            <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}>
              <input
                type="radio"
                checked={mode === "update_existing"}
                onChange={() => setMode("update_existing")}
              />
              {copy.importModeUpdate}
            </label>
            <button
              className="primary-button"
              type="button"
              onClick={handleApply}
              disabled={preview.validRows.length === 0}
            >
              {copy.importApplyButton}
            </button>
          </div>
        </div>
      )}

      {resultMsg && (
        <div
          style={{
            marginTop: 12,
            padding: 10,
            background: "#E1F0E5",
            color: "#2A6D45",
            borderRadius: 6,
            fontSize: 13
          }}
        >
          {resultMsg}
        </div>
      )}
    </div>
  );
}

function AnalyticsStub({ copy }: { copy: (typeof COPY)["th"] }) {
  return (
    <div
      className="module-board"
      style={{
        padding: 30,
        marginTop: 14,
        textAlign: "center",
        color: "var(--ink-5)",
        fontStyle: "italic"
      }}
    >
      <h3 style={{ margin: 0, color: "var(--ink)" }}>{copy.analyticsTitle}</h3>
      <p style={{ marginTop: 8 }}>{copy.analyticsPlaceholder}</p>
    </div>
  );
}

function FormField({
  label,
  required,
  children
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: "grid", gap: 4, marginTop: 8 }}>
      <span
        style={{
          fontFamily: "var(--mono)",
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: "var(--ink-5)"
        }}
      >
        {label} {required && <span style={{ color: "#B23E1F" }}>*</span>}
      </span>
      {children}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  border: "1px solid var(--line)",
  borderRadius: 6,
  fontFamily: "inherit",
  fontSize: 13
};
