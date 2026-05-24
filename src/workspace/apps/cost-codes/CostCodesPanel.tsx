// CostCodesPanel — Sprint 1 (Builk parity)
// Spec: docs/COST_CODES_PRD.md Section 6
// Mockup reference: src/MockupGallery.tsx CostCodesMockup
//
// Routes:
//   /cost-codes?tab=catalog&version=0.1   (default) tree + search + add/edit
//   /cost-codes?tab=import&version=0.1    CSV import wizard
//   /cost-codes?tab=export&version=0.1    CSV export
//   /cost-codes?tab=usage&version=0.1     placeholder (Sprint 6)

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Download,
  EyeOff,
  Home,
  Plus,
  Trash2,
  Upload
} from "lucide-react";
import type { WorkspaceAppId } from "../../../apps";
import {
  applyCsvImport,
  costCodeCategoryCopy,
  costCodeUnitCopy,
  deactivateCostCode,
  ensureSeedCostCodes,
  exportCostCodesToCsv,
  parseCostCodeCsv,
  saveCostCodes,
  searchCostCodes,
  summarizeCostCodes,
  upsertCostCode,
  validateCostCode,
  type CostCode,
  type CostCodeCategory,
  type CostCodeState,
  type CostCodeUnit,
  type CsvImportResult,
  type ImportMode
} from "../../../costCodes";
import { PageHeader } from "../../shared/PageHeader";
import { SummaryTile } from "../../shared/SummaryTile";

type WorkspaceLanguage = "th" | "en";

type CostCodesPanelProps = {
  activeTab: string;
  language: WorkspaceLanguage;
  onSelectApp: (id: WorkspaceAppId) => void;
};

const money = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 0
});

const COPY: Record<
  WorkspaceLanguage,
  {
    heroTitle: string;
    heroDetail: string;
    backToHub: string;
    summarySeed: string;
    summaryCustom: string;
    summaryActive: string;
    summaryInactive: string;
    catalogTitle: string;
    catalogDetail: string;
    searchPlaceholder: string;
    addCode: string;
    importCsv: string;
    exportCsv: string;
    emptyTitle: string;
    emptyDetail: string;
    systemSeedBadge: string;
    inactiveBadge: string;
    deactivate: string;
    edit: string;
    cancel: string;
    save: string;
    confirmDeactivate: string;
    importTitle: string;
    importDetail: string;
    importPasteLabel: string;
    importParseButton: string;
    importPreviewTitle: string;
    importModeLabel: string;
    importModeSkip: string;
    importModeUpdate: string;
    importApplyButton: string;
    importResultPrefix: string;
    importValid: string;
    importInvalid: string;
    exportTitle: string;
    exportDetail: string;
    exportActiveOnly: string;
    exportDownload: string;
    exportFilename: string;
    usageTitle: string;
    usagePlaceholder: string;
    formTitleAdd: string;
    formTitleEdit: string;
    fieldCode: string;
    fieldName: string;
    fieldNameEn: string;
    fieldDescription: string;
    fieldCategory: string;
    fieldParent: string;
    fieldDefaultUnit: string;
    fieldCustomUnit: string;
    fieldDefaultPrice: string;
    fieldActive: string;
  }
> = {
  th: {
    heroTitle: "หมวดต้นทุน (Cost Codes / CBS)",
    heroDetail: "spine ของระบบ Cost Control · ทุก PR/RFQ/บันทึกต้นทุน ผูกกับ code นี้",
    backToHub: "กลับ Hub",
    summarySeed: "System seeds",
    summaryCustom: "Custom",
    summaryActive: "Active",
    summaryInactive: "Inactive",
    catalogTitle: "Catalog",
    catalogDetail: "Tree view · คลิกหมวดเพื่อพับ/ขยาย · ค้นหาข้าม category",
    searchPlaceholder: "ค้นหา code หรือชื่องาน...",
    addCode: "+ เพิ่ม Code",
    importCsv: "Import CSV",
    exportCsv: "Export CSV",
    emptyTitle: "ไม่พบ code ที่ตรงคำค้น",
    emptyDetail: "ลองค้นด้วยคำอื่น หรือดู catalog ทั้งหมด",
    systemSeedBadge: "SEED",
    inactiveBadge: "INACTIVE",
    deactivate: "ระงับใช้งาน",
    edit: "แก้ไข",
    cancel: "ยกเลิก",
    save: "บันทึก",
    confirmDeactivate: 'ระงับใช้งาน code นี้?',
    importTitle: "Import CSV",
    importDetail: "วาง CSV หรือเลือกไฟล์ · รองรับ Builk format (code, name, parent_code, unit, price)",
    importPasteLabel: "วาง CSV ที่นี่ หรือเลือกไฟล์",
    importParseButton: "Preview",
    importPreviewTitle: "Preview",
    importModeLabel: "ถ้ามี code อยู่แล้ว",
    importModeSkip: "ข้าม (เก็บของเดิม)",
    importModeUpdate: "ทับ (overwrite)",
    importApplyButton: "Apply Import",
    importResultPrefix: "Import เสร็จ —",
    importValid: "valid",
    importInvalid: "invalid",
    exportTitle: "Export CSV",
    exportDetail: "บันทึกเป็น CSV ใช้ที่อื่น หรือสำรองข้อมูล",
    exportActiveOnly: "เฉพาะ active",
    exportDownload: "Download CSV",
    exportFilename: "cost-codes-th",
    usageTitle: "Usage analytics",
    usagePlaceholder: "จะเปิดใช้งานใน Sprint 6 (Project Control + reports)",
    formTitleAdd: "เพิ่ม Cost Code",
    formTitleEdit: "แก้ไข Cost Code",
    fieldCode: "Code",
    fieldName: "ชื่อ (Thai)",
    fieldNameEn: "ชื่อ (English)",
    fieldDescription: "คำอธิบาย",
    fieldCategory: "หมวด",
    fieldParent: "Parent code",
    fieldDefaultUnit: "หน่วย",
    fieldCustomUnit: "หน่วยกำหนดเอง",
    fieldDefaultPrice: "ราคา default (THB)",
    fieldActive: "ใช้งาน"
  },
  en: {
    heroTitle: "Cost Codes (CBS)",
    heroDetail: "Spine of Cost Control — every PR, RFQ, and cost recording binds to a code",
    backToHub: "Back to Hub",
    summarySeed: "System seeds",
    summaryCustom: "Custom",
    summaryActive: "Active",
    summaryInactive: "Inactive",
    catalogTitle: "Catalog",
    catalogDetail: "Tree view — click category to expand/collapse, search spans categories",
    searchPlaceholder: "Search code or name...",
    addCode: "+ Add code",
    importCsv: "Import CSV",
    exportCsv: "Export CSV",
    emptyTitle: "No code matches your search",
    emptyDetail: "Try a different query or clear the search box",
    systemSeedBadge: "SEED",
    inactiveBadge: "INACTIVE",
    deactivate: "Deactivate",
    edit: "Edit",
    cancel: "Cancel",
    save: "Save",
    confirmDeactivate: "Deactivate this cost code?",
    importTitle: "Import CSV",
    importDetail: "Paste CSV or pick a file — Builk format supported (code, name, parent_code, unit, price)",
    importPasteLabel: "Paste CSV here or choose a file",
    importParseButton: "Preview",
    importPreviewTitle: "Preview",
    importModeLabel: "On duplicate code",
    importModeSkip: "Skip (keep existing)",
    importModeUpdate: "Update (overwrite)",
    importApplyButton: "Apply import",
    importResultPrefix: "Import complete —",
    importValid: "valid",
    importInvalid: "invalid",
    exportTitle: "Export CSV",
    exportDetail: "Save as CSV for backup or external use",
    exportActiveOnly: "Active only",
    exportDownload: "Download CSV",
    exportFilename: "cost-codes",
    usageTitle: "Usage analytics",
    usagePlaceholder: "Sprint 6 — pairs with Project Control + reports",
    formTitleAdd: "Add cost code",
    formTitleEdit: "Edit cost code",
    fieldCode: "Code",
    fieldName: "Name (Thai)",
    fieldNameEn: "Name (English)",
    fieldDescription: "Description",
    fieldCategory: "Category",
    fieldParent: "Parent code",
    fieldDefaultUnit: "Unit",
    fieldCustomUnit: "Custom unit",
    fieldDefaultPrice: "Default price (THB)",
    fieldActive: "Active"
  }
};

const LOCAL_WORKSPACE_ID = "local-workspace";
const CATEGORY_ORDER: CostCodeCategory[] = [
  "site",
  "structure",
  "architecture",
  "mep",
  "finishing",
  "external",
  "indirect",
  "custom"
];

export function CostCodesPanel({ activeTab, language, onSelectApp }: CostCodesPanelProps) {
  const copy = COPY[language];
  const [state, setState] = useState<CostCodeState>(() => ensureSeedCostCodes());

  useEffect(() => {
    saveCostCodes(state);
  }, [state]);

  const summary = useMemo(() => summarizeCostCodes(state), [state]);

  const handleUpsert = (candidate: Partial<CostCode>): string[] => {
    const errors = validateCostCode(
      { ...candidate, workspaceId: candidate.workspaceId ?? LOCAL_WORKSPACE_ID },
      state
    );
    if (errors.length > 0) return errors;
    setState((current) =>
      upsertCostCode(current, {
        ...candidate,
        workspaceId: candidate.workspaceId ?? LOCAL_WORKSPACE_ID
      })
    );
    return [];
  };

  const handleDeactivate = (id: string) => {
    setState((current) => deactivateCostCode(current, id));
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
        <SummaryTile label={copy.summarySeed} value={summary.systemSeed.toString()} />
        <SummaryTile label={copy.summaryCustom} value={summary.custom.toString()} strong />
        <SummaryTile label={copy.summaryActive} value={summary.active.toString()} />
        <SummaryTile label={copy.summaryInactive} value={summary.inactive.toString()} />
      </div>

      {activeTab === "import" ? (
        <ImportTab
          copy={copy}
          state={state}
          onApply={(applyResult) => setState(applyResult.state)}
        />
      ) : activeTab === "export" ? (
        <ExportTab copy={copy} state={state} />
      ) : activeTab === "usage" ? (
        <UsageStub copy={copy} />
      ) : (
        <CatalogTab
          copy={copy}
          state={state}
          summary={summary}
          onUpsert={handleUpsert}
          onDeactivate={handleDeactivate}
          language={language}
        />
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Catalog tab
// ---------------------------------------------------------------------------

function CatalogTab({
  copy,
  state,
  summary,
  onUpsert,
  onDeactivate,
  language
}: {
  copy: (typeof COPY)["th"];
  state: CostCodeState;
  summary: ReturnType<typeof summarizeCostCodes>;
  onUpsert: (candidate: Partial<CostCode>) => string[];
  onDeactivate: (id: string) => void;
  language: WorkspaceLanguage;
}) {
  const [search, setSearch] = useState("");
  const [openCategories, setOpenCategories] = useState<Set<CostCodeCategory>>(
    () => new Set(CATEGORY_ORDER.filter((c) => summary.byCategory[c] > 0))
  );
  const [editingCode, setEditingCode] = useState<CostCode | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const matching = useMemo(() => searchCostCodes(state, search), [state, search]);

  const toggleCategory = (cat: CostCodeCategory) => {
    setOpenCategories((current) => {
      const next = new Set(current);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const grouped = useMemo(() => {
    const byCat = new Map<CostCodeCategory, CostCode[]>();
    for (const code of matching) {
      const list = byCat.get(code.category) ?? [];
      list.push(code);
      byCat.set(code.category, list);
    }
    // sort each list by code
    for (const list of byCat.values()) {
      list.sort((a, b) => a.code.localeCompare(b.code));
    }
    return CATEGORY_ORDER.map((cat) => ({
      category: cat,
      codes: byCat.get(cat) ?? []
    })).filter((g) => g.codes.length > 0);
  }, [matching]);

  return (
    <div className="module-board" style={{ padding: 18, marginTop: 12 }}>
      <PageHeader title={copy.catalogTitle} detail={copy.catalogDetail} />

      <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={copy.searchPlaceholder}
          style={{
            flex: "1 1 280px",
            padding: "9px 12px",
            border: "1px solid var(--line)",
            borderRadius: 7,
            fontFamily: "inherit",
            fontSize: 14
          }}
        />
        <button
          className="primary-button"
          type="button"
          onClick={() => {
            setShowAddForm(true);
            setEditingCode(null);
          }}
        >
          <Plus size={16} /> {copy.addCode}
        </button>
      </div>

      {(showAddForm || editingCode) && (
        <CodeForm
          copy={copy}
          state={state}
          mode={editingCode ? "edit" : "add"}
          initial={editingCode ?? undefined}
          onCancel={() => {
            setShowAddForm(false);
            setEditingCode(null);
          }}
          onSubmit={(candidate) => {
            const errors = onUpsert(candidate);
            if (errors.length === 0) {
              setShowAddForm(false);
              setEditingCode(null);
            }
            return errors;
          }}
          language={language}
        />
      )}

      {grouped.length === 0 ? (
        <div
          style={{
            marginTop: 18,
            padding: "30px 14px",
            textAlign: "center",
            color: "var(--ink-5)",
            background: "var(--panel-soft, #F4F4F2)",
            borderRadius: 8
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 4 }}>{copy.emptyTitle}</div>
          <div style={{ fontSize: 12 }}>{copy.emptyDetail}</div>
        </div>
      ) : (
        <div
          style={{
            marginTop: 18,
            border: "1px solid var(--line)",
            borderRadius: 8,
            overflow: "hidden"
          }}
        >
          {grouped.map((group) => {
            const catCopy = costCodeCategoryCopy[group.category];
            const isOpen = openCategories.has(group.category);
            const total = summary.byCategory[group.category];
            return (
              <div key={group.category} style={{ borderBottom: "1px solid var(--line)" }}>
                <button
                  type="button"
                  onClick={() => toggleCategory(group.category)}
                  style={{
                    width: "100%",
                    display: "grid",
                    gridTemplateColumns: "16px 28px 1fr auto",
                    gap: 12,
                    padding: "12px 16px",
                    background: "var(--panel-soft, #F4F4F2)",
                    border: 0,
                    cursor: "pointer",
                    textAlign: "left",
                    fontFamily: "inherit",
                    fontSize: 14
                  }}
                >
                  <span style={{ color: "var(--ink-3)" }}>{isOpen ? "▼" : "▶"}</span>
                  <span>{catCopy.emoji}</span>
                  <strong>
                    {catCopy[language]} ({catCopy.codePrefix})
                  </strong>
                  <span
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: 11,
                      color: "var(--ink-5)"
                    }}
                  >
                    {group.codes.length} / {total}
                  </span>
                </button>
                {isOpen &&
                  group.codes.map((c) => (
                    <CodeRow
                      key={c.id}
                      code={c}
                      copy={copy}
                      onEdit={() => {
                        setEditingCode(c);
                        setShowAddForm(false);
                      }}
                      onDeactivate={() => {
                        if (
                          typeof window !== "undefined" &&
                          window.confirm(copy.confirmDeactivate)
                        ) {
                          onDeactivate(c.id);
                        }
                      }}
                      language={language}
                    />
                  ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CodeRow({
  code,
  copy,
  onEdit,
  onDeactivate,
  language
}: {
  code: CostCode;
  copy: (typeof COPY)["th"];
  onEdit: () => void;
  onDeactivate: () => void;
  language: WorkspaceLanguage;
}) {
  const isSeed = code.workspaceId === "";
  const isRoot = !code.parentCode;
  const unitLabel =
    code.defaultUnit === "custom"
      ? code.customUnit || "—"
      : costCodeUnitCopy[code.defaultUnit].short;
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: isRoot
          ? "16px 90px 1fr 100px 120px 100px"
          : "16px 90px 1fr 100px 120px 100px",
        gap: 12,
        padding: isRoot ? "10px 16px" : "10px 16px 10px 44px",
        borderTop: "1px solid var(--line)",
        background: !code.active ? "var(--panel-soft, #F4F4F2)" : "var(--panel)",
        fontSize: 13,
        opacity: code.active ? 1 : 0.55,
        alignItems: "center"
      }}
    >
      <span />
      <span
        style={{
          fontFamily: "var(--mono)",
          color: "var(--ink-3)",
          fontWeight: isRoot ? 700 : 500
        }}
      >
        {code.code}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        <span style={{ fontWeight: isRoot ? 700 : 500 }}>{code.name}</span>
        {code.nameEn && language === "en" && (
          <span style={{ color: "var(--ink-5)", fontSize: 11 }}>· {code.nameEn}</span>
        )}
        {isSeed && (
          <span
            style={{
              fontFamily: "var(--mono)",
              fontSize: 9,
              padding: "1px 5px",
              border: "1px solid var(--line-strong, #C7C7C2)",
              borderRadius: 3,
              color: "var(--ink-4)"
            }}
          >
            {copy.systemSeedBadge}
          </span>
        )}
        {!code.active && (
          <span
            style={{
              fontFamily: "var(--mono)",
              fontSize: 9,
              padding: "1px 5px",
              background: "#FFE6E1",
              color: "#B23E1F",
              borderRadius: 3
            }}
          >
            {copy.inactiveBadge}
          </span>
        )}
      </div>
      <span
        style={{
          fontFamily: "var(--mono)",
          fontSize: 12,
          color: "var(--ink-4)"
        }}
      >
        {isRoot ? "—" : unitLabel}
      </span>
      <span
        style={{
          fontFamily: "var(--mono)",
          fontWeight: 700,
          textAlign: "right"
        }}
      >
        {code.defaultUnitPrice > 0 ? money.format(code.defaultUnitPrice) : "—"}
      </span>
      <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
        <button
          type="button"
          onClick={onEdit}
          style={iconButtonStyle}
          aria-label={copy.edit}
          title={copy.edit}
        >
          <Check size={12} />
        </button>
        {code.active && !isRoot && (
          <button
            type="button"
            onClick={onDeactivate}
            style={{ ...iconButtonStyle, color: "#B23E1F" }}
            aria-label={copy.deactivate}
            title={copy.deactivate}
          >
            <EyeOff size={12} />
          </button>
        )}
      </div>
    </div>
  );
}

const iconButtonStyle: React.CSSProperties = {
  border: "1px solid var(--line)",
  background: "var(--panel)",
  borderRadius: 4,
  padding: "4px 8px",
  cursor: "pointer",
  fontSize: 11,
  fontFamily: "var(--mono)",
  color: "var(--ink-3)"
};

// ---------------------------------------------------------------------------
// Form (add / edit)
// ---------------------------------------------------------------------------

function CodeForm({
  copy,
  state,
  mode,
  initial,
  onCancel,
  onSubmit,
  language
}: {
  copy: (typeof COPY)["th"];
  state: CostCodeState;
  mode: "add" | "edit";
  initial?: CostCode;
  onCancel: () => void;
  onSubmit: (candidate: Partial<CostCode>) => string[];
  language: WorkspaceLanguage;
}) {
  const [code, setCode] = useState(initial?.code ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [nameEn, setNameEn] = useState(initial?.nameEn ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [category, setCategory] = useState<CostCodeCategory>(initial?.category ?? "custom");
  const [parentCode, setParentCode] = useState(initial?.parentCode ?? "");
  const [defaultUnit, setDefaultUnit] = useState<CostCodeUnit>(initial?.defaultUnit ?? "sq_m");
  const [customUnit, setCustomUnit] = useState(initial?.customUnit ?? "");
  const [defaultUnitPrice, setDefaultUnitPrice] = useState(
    initial?.defaultUnitPrice?.toString() ?? ""
  );
  const [active, setActive] = useState<boolean>(initial?.active ?? true);
  const [errors, setErrors] = useState<string[]>([]);

  const parentOptions = useMemo(
    () =>
      state.codes
        .filter((c) => c.id !== initial?.id && c.active)
        .map((c) => ({ value: c.code, label: `${c.code} ${c.name}` }))
        .sort((a, b) => a.value.localeCompare(b.value)),
    [state.codes, initial?.id]
  );

  const handleSubmit = () => {
    const candidate: Partial<CostCode> = {
      id: initial?.id,
      workspaceId: initial?.workspaceId ?? LOCAL_WORKSPACE_ID,
      code,
      name,
      nameEn,
      description,
      category,
      parentCode,
      defaultUnit,
      customUnit,
      defaultUnitPrice: parseFloat(defaultUnitPrice) || 0,
      active
    };
    const result = onSubmit(candidate);
    setErrors(result);
  };

  return (
    <div
      style={{
        marginTop: 14,
        padding: 16,
        border: "1px solid var(--line)",
        borderRadius: 8,
        background: "var(--panel)"
      }}
    >
      <PageHeader
        title={mode === "add" ? copy.formTitleAdd : copy.formTitleEdit}
        detail=""
      />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 12,
          marginTop: 14
        }}
      >
        <FormField label={copy.fieldCode} required>
          <input value={code} onChange={(e) => setCode(e.target.value)} style={inputStyle} />
        </FormField>
        <FormField label={copy.fieldName} required>
          <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
        </FormField>
        <FormField label={copy.fieldNameEn}>
          <input value={nameEn} onChange={(e) => setNameEn(e.target.value)} style={inputStyle} />
        </FormField>
        <FormField label={copy.fieldCategory}>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as CostCodeCategory)}
            style={inputStyle}
          >
            {CATEGORY_ORDER.map((c) => (
              <option key={c} value={c}>
                {costCodeCategoryCopy[c].emoji} {costCodeCategoryCopy[c][language]}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label={copy.fieldParent}>
          <select
            value={parentCode}
            onChange={(e) => setParentCode(e.target.value)}
            style={inputStyle}
          >
            <option value="">—</option>
            {parentOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label={copy.fieldDefaultUnit}>
          <select
            value={defaultUnit}
            onChange={(e) => setDefaultUnit(e.target.value as CostCodeUnit)}
            style={inputStyle}
          >
            {(Object.keys(costCodeUnitCopy) as CostCodeUnit[]).map((u) => (
              <option key={u} value={u}>
                {costCodeUnitCopy[u][language]} ({costCodeUnitCopy[u].short})
              </option>
            ))}
          </select>
        </FormField>
        {defaultUnit === "custom" && (
          <FormField label={copy.fieldCustomUnit} required>
            <input
              value={customUnit}
              onChange={(e) => setCustomUnit(e.target.value)}
              style={inputStyle}
            />
          </FormField>
        )}
        <FormField label={copy.fieldDefaultPrice}>
          <input
            type="number"
            min="0"
            value={defaultUnitPrice}
            onChange={(e) => setDefaultUnitPrice(e.target.value)}
            style={inputStyle}
          />
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
      <FormField label={copy.fieldDescription}>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
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

// ---------------------------------------------------------------------------
// Import tab
// ---------------------------------------------------------------------------

function ImportTab({
  copy,
  state,
  onApply
}: {
  copy: (typeof COPY)["th"];
  state: CostCodeState;
  onApply: (result: ReturnType<typeof applyCsvImport>) => void;
}) {
  const [csvText, setCsvText] = useState("");
  const [preview, setPreview] = useState<CsvImportResult | null>(null);
  const [mode, setMode] = useState<ImportMode>("skip_duplicates");
  const [resultMsg, setResultMsg] = useState<string>("");
  const fileRef = useRef<HTMLInputElement | null>(null);

  const handlePreview = () => {
    setPreview(parseCostCodeCsv(csvText, LOCAL_WORKSPACE_ID));
    setResultMsg("");
  };

  const handleApply = () => {
    if (!preview) return;
    const applied = applyCsvImport(state, preview.rows, mode, LOCAL_WORKSPACE_ID);
    onApply(applied);
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
    setPreview(parseCostCodeCsv(text, LOCAL_WORKSPACE_ID));
    setResultMsg("");
  };

  return (
    <div className="module-board" style={{ padding: 18, marginTop: 12 }}>
      <PageHeader title={copy.importTitle} detail={copy.importDetail} />

      <div style={{ marginTop: 14 }}>
        <label
          style={{
            fontFamily: "var(--mono)",
            fontSize: 10,
            color: "var(--ink-5)",
            textTransform: "uppercase"
          }}
        >
          {copy.importPasteLabel}
        </label>
        <textarea
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          rows={8}
          placeholder="code,name,parent_code,unit,price&#10;01-100,ปรับระดับ,01,ตร.ม.,120"
          style={{
            ...inputStyle,
            fontFamily: "var(--mono)",
            fontSize: 12,
            marginTop: 6
          }}
        />
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
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
        <div style={{ marginTop: 18 }}>
          <PageHeader
            title={copy.importPreviewTitle}
            detail={`${preview.validRows.length} ${copy.importValid} · ${preview.invalidRows.length} ${copy.importInvalid}`}
          />
          <div style={{ overflowX: "auto", marginTop: 10 }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 12,
                minWidth: 720
              }}
            >
              <thead>
                <tr>
                  {["#", "code", "name", "parent", "unit", "price", "status"].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left",
                        padding: "8px 10px",
                        background: "var(--panel-soft, #F4F4F2)",
                        fontFamily: "var(--mono)",
                        fontSize: 10,
                        textTransform: "uppercase"
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
                      <td style={{ padding: "8px 10px", fontFamily: "var(--mono)" }}>
                        {row.rowIndex + 1}
                      </td>
                      <td style={{ padding: "8px 10px", fontFamily: "var(--mono)" }}>
                        {p.code ?? "—"}
                      </td>
                      <td style={{ padding: "8px 10px" }}>{p.name ?? "—"}</td>
                      <td style={{ padding: "8px 10px", fontFamily: "var(--mono)" }}>
                        {p.parentCode ?? "—"}
                      </td>
                      <td style={{ padding: "8px 10px", fontFamily: "var(--mono)" }}>
                        {p.defaultUnit ?? "—"}
                        {p.defaultUnit === "custom" && p.customUnit ? ` (${p.customUnit})` : ""}
                      </td>
                      <td style={{ padding: "8px 10px", fontFamily: "var(--mono)", textAlign: "right" }}>
                        {p.defaultUnitPrice ?? 0}
                      </td>
                      <td style={{ padding: "8px 10px", color: ok ? "#2A6D45" : "#B23E1F" }}>
                        {ok ? "OK" : row.errors.join(", ")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {preview.rows.length > 30 && (
              <div
                style={{
                  marginTop: 6,
                  color: "var(--ink-5)",
                  fontFamily: "var(--mono)",
                  fontSize: 11
                }}
              >
                + {preview.rows.length - 30} more rows
              </div>
            )}
          </div>

          <div
            style={{
              display: "flex",
              gap: 14,
              alignItems: "center",
              flexWrap: "wrap",
              marginTop: 14
            }}
          >
            <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--ink-5)" }}>
              {copy.importModeLabel}:
            </span>
            <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
              <input
                type="radio"
                checked={mode === "skip_duplicates"}
                onChange={() => setMode("skip_duplicates")}
              />
              {copy.importModeSkip}
            </label>
            <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
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
            marginTop: 14,
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

// ---------------------------------------------------------------------------
// Export tab
// ---------------------------------------------------------------------------

function ExportTab({
  copy,
  state
}: {
  copy: (typeof COPY)["th"];
  state: CostCodeState;
}) {
  const [activeOnly, setActiveOnly] = useState(true);

  const handleDownload = () => {
    const csv = exportCostCodesToCsv(state, { activeOnly });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `${copy.exportFilename}-${date}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="module-board" style={{ padding: 18, marginTop: 12 }}>
      <PageHeader title={copy.exportTitle} detail={copy.exportDetail} />
      <div style={{ display: "flex", gap: 14, alignItems: "center", marginTop: 14 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={(e) => setActiveOnly(e.target.checked)}
          />
          {copy.exportActiveOnly}
        </label>
        <button className="primary-button" type="button" onClick={handleDownload}>
          <Download size={16} /> {copy.exportDownload}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Usage placeholder
// ---------------------------------------------------------------------------

function UsageStub({ copy }: { copy: (typeof COPY)["th"] }) {
  return (
    <div
      className="module-board"
      style={{
        padding: 30,
        marginTop: 12,
        textAlign: "center",
        color: "var(--ink-5)",
        fontStyle: "italic"
      }}
    >
      <h3 style={{ margin: 0, fontSize: 16, color: "var(--ink)" }}>{copy.usageTitle}</h3>
      <p style={{ marginTop: 8 }}>{copy.usagePlaceholder}</p>
    </div>
  );
}
