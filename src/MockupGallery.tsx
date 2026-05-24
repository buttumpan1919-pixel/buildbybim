// MockupGallery — visual preview ของ Builk-parity modules
// ตัวอย่าง UI สำหรับ owner ตัดสิน + ใช้เป็น starting point ให้ Codex implement จริง
//
// ทั้งหมดเป็น static mockup — ใช้ Thai sample data, ไม่มี persistence
// CSS ใช้ class เดิมจาก styles.css (workspace-hub, module-board, cashflow-table) เพื่อความสอดคล้อง

import { useState, type ReactNode } from "react";

type MockupTab =
  | "project-list"
  | "project-detail"
  | "cost-codes"
  | "suppliers"
  | "procurement"
  | "rfq"
  | "project-control";

const tabs: Array<{ id: MockupTab; label: string; detail: string }> = [
  {
    id: "project-list",
    label: "Project List",
    detail: "Entry point — รวมโครงการทั้งหมด + carousel + 4 KPIs (Sprint 0)"
  },
  {
    id: "project-detail",
    label: "Project Detail",
    detail: "หน้าโครงการเดี่ยว — 6 tabs + overview KPIs + AI insights (Sprint 0)"
  },
  { id: "cost-codes", label: "Cost Codes", detail: "CBS spine — หมวดต้นทุนมาตรฐาน" },
  { id: "suppliers", label: "Suppliers", detail: "ไดเรคทอรี supplier + rating" },
  { id: "procurement", label: "Purchase Request", detail: "ใบขอซื้อ + state machine" },
  { id: "rfq", label: "RFQ Comparison", detail: "เปรียบเทียบราคา supplier" },
  {
    id: "project-control",
    label: "Project Control",
    detail: "Budget vs Actual per project"
  }
];

const moneyFmt = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 0
});
const shortMoney = (n: number) => {
  if (n >= 1_000_000) return `฿${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `฿${(n / 1_000).toFixed(0)}K`;
  return moneyFmt.format(n);
};

function MockupShell({
  title,
  detail,
  children
}: {
  title: string;
  detail: string;
  children: ReactNode;
}) {
  return (
    <section className="workspace-hub" aria-label={title}>
      <div className="module-hero">
        <div>
          <h1>{title}</h1>
          <p>{detail}</p>
        </div>
        <div className="module-actions">
          <a
            className="secondary-button"
            href="/mockup"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            ↑ Back to top
          </a>
        </div>
      </div>
      {children}
    </section>
  );
}

// ---------------------------------------------------------------------------
// 0. Project List (Sprint 0 — Builk entry point) mockup
// ---------------------------------------------------------------------------

type ProjectStatus = "normal" | "delayed" | "closed" | "cancelled" | "draft";

type SeedProject = {
  id: number;
  code: string;
  name: string;
  customerName: string | null;
  customerType: "individual" | "gov" | "corporate" | null;
  contractValue: number;
  plannedCost: number;
  actualCost: number;
  plannedRevenue: number;
  actualRevenue: number;
  marginPct: number | null;
  startDate: string;
  endDate: string;
  daysRemaining: number;
  status: ProjectStatus;
  hasBudget: boolean;
};

const seedProjects: SeedProject[] = [
  {
    id: 2861025,
    code: "j-2600",
    name: "งานบ้านเดี่ยวชั้นเดียวคุณสุขฤดี",
    customerName: "คุณสุขฤดี ถิ่นวังสะพุง",
    customerType: "individual",
    contractValue: 2_850_000,
    plannedCost: 2_100_000,
    actualCost: 1_580_000,
    plannedRevenue: 2_850_000,
    actualRevenue: 1_900_000,
    marginPct: 26.3,
    startDate: "2026-01-15",
    endDate: "2026-08-30",
    daysRemaining: 98,
    status: "normal",
    hasBudget: true
  },
  {
    id: 2861024,
    code: "j-2599",
    name: "อาคารพาณิชย์ 3 ชั้น เทพารักษ์",
    customerName: "บจก. ธ.ธ.ธ. พัฒนาที่ดิน",
    customerType: "corporate",
    contractValue: 8_500_000,
    plannedCost: 6_400_000,
    actualCost: 6_580_000,
    plannedRevenue: 8_500_000,
    actualRevenue: 7_650_000,
    marginPct: 9.8,
    startDate: "2025-08-01",
    endDate: "2026-04-30",
    daysRemaining: -24,
    status: "delayed",
    hasBudget: true
  },
  {
    id: 2861023,
    code: "j-2598",
    name: "งานปรับปรุง อบต. อุ่มเม่า",
    customerName: "องค์การบริหารส่วนตำบลอุ่มเม่า",
    customerType: "gov",
    contractValue: 1_200_000,
    plannedCost: 950_000,
    actualCost: 920_000,
    plannedRevenue: 1_200_000,
    actualRevenue: 1_200_000,
    marginPct: 23.3,
    startDate: "2025-11-10",
    endDate: "2026-03-15",
    daysRemaining: -70,
    status: "closed",
    hasBudget: true
  },
  {
    id: 2861022,
    code: "j-2597",
    name: "งานเพิ่มเติม j-2300 — งานสวน",
    customerName: "คุณธีรภัทร์ วราพัฒน์",
    customerType: "individual",
    contractValue: 380_000,
    plannedCost: 0,
    actualCost: 125_000,
    plannedRevenue: 380_000,
    actualRevenue: 200_000,
    marginPct: null,
    startDate: "2026-03-01",
    endDate: "2026-05-31",
    daysRemaining: 7,
    status: "normal",
    hasBudget: false
  },
  {
    id: 2861021,
    code: "j-2596",
    name: "สำนักงานใหญ่ 2025 — internal",
    customerName: null,
    customerType: null,
    contractValue: 0,
    plannedCost: 450_000,
    actualCost: 380_000,
    plannedRevenue: 0,
    actualRevenue: 0,
    marginPct: null,
    startDate: "2025-01-15",
    endDate: "2025-12-31",
    daysRemaining: -1331,
    status: "normal",
    hasBudget: true
  },
  {
    id: 2861020,
    code: "j-2595",
    name: "บ้าน 2 ชั้น คุณวรรณา (ยกเลิก)",
    customerName: "คุณวรรณา ศรีอนันต์",
    customerType: "individual",
    contractValue: 4_200_000,
    plannedCost: 3_100_000,
    actualCost: 280_000,
    plannedRevenue: 4_200_000,
    actualRevenue: 0,
    marginPct: null,
    startDate: "2026-02-01",
    endDate: "2026-12-30",
    daysRemaining: 220,
    status: "cancelled",
    hasBudget: true
  }
];

const projectStatusBadge: Record<
  ProjectStatus,
  { bg: string; color: string; label: string; dot: string }
> = {
  normal: { bg: "#E1F0E5", color: "#2A6D45", label: "ปกติ", dot: "#2A6D45" },
  delayed: { bg: "#FFF1CC", color: "#92651A", label: "ชะลอ", dot: "#92651A" },
  closed: { bg: "var(--bg-2, #EAEAE7)", color: "#4A4A47", label: "สิ้นสุด", dot: "#4A4A47" },
  cancelled: { bg: "#FFE6E1", color: "#B23E1F", label: "ยกเลิก", dot: "#B23E1F" },
  draft: { bg: "#E5EDF7", color: "#2A4F86", label: "ร่าง", dot: "#2A4F86" }
};

const seedCompanies = [
  { id: "c1", name: "ห้างหุ้นส่วนจำกัด กลมกล่อม กรุ๊ป", credits: 0 },
  { id: "c2", name: "บจก. สถาปนิก เอเอ", credits: 5 },
  { id: "c3", name: "ตัวเอง (freelance)", credits: 999 }
];

function ProjectListMockup() {
  const [statusFilter, setStatusFilter] = useState<"all" | ProjectStatus>("all");
  const [search, setSearch] = useState("");
  const [companyId, setCompanyId] = useState(seedCompanies[0].id);

  const filtered = seedProjects.filter(
    (p) =>
      (statusFilter === "all" || p.status === statusFilter) &&
      (!search ||
        p.code.toLowerCase().includes(search.toLowerCase()) ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.customerName ?? "").toLowerCase().includes(search.toLowerCase()))
  );

  const recentActive = seedProjects.filter((p) => p.status === "normal" || p.status === "delayed");
  const company = seedCompanies.find((c) => c.id === companyId) ?? seedCompanies[0];

  const statusCounts: Record<"all" | ProjectStatus, number> = {
    all: seedProjects.length,
    normal: seedProjects.filter((p) => p.status === "normal").length,
    delayed: seedProjects.filter((p) => p.status === "delayed").length,
    closed: seedProjects.filter((p) => p.status === "closed").length,
    cancelled: seedProjects.filter((p) => p.status === "cancelled").length,
    draft: seedProjects.filter((p) => p.status === "draft").length
  };

  return (
    <MockupShell
      title="Project List — ภาพรวมโครงการทั้งหมด"
      detail="Entry point ของ Cost Control · carousel + KPI cards + filterable table (mirror Builk's /costcontrol/project/search)"
    >
      {/* Company switcher row */}
      <div
        style={{
          display: "flex",
          gap: 14,
          alignItems: "center",
          padding: "10px 14px",
          background: "var(--panel)",
          border: "1px solid var(--line)",
          borderRadius: 8,
          flexWrap: "wrap"
        }}
      >
        <span
          style={{
            fontFamily: "var(--mono)",
            fontSize: 10,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--ink-5)"
          }}
        >
          กิจการ
        </span>
        <select
          value={companyId}
          onChange={(e) => setCompanyId(e.target.value)}
          style={{
            padding: "8px 12px",
            border: "1px solid var(--line)",
            borderRadius: 6,
            fontFamily: "inherit",
            fontSize: 14,
            fontWeight: 700,
            minWidth: 280
          }}
        >
          {seedCompanies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <span style={{ marginLeft: "auto", display: "flex", gap: 18, alignItems: "center" }}>
          <span
            style={{
              fontFamily: "var(--mono)",
              fontSize: 12,
              color: "var(--ink-4)"
            }}
          >
            โครงการทั้งหมด <strong style={{ color: "var(--ink)" }}>{seedProjects.length}</strong>
          </span>
          <span
            style={{
              fontFamily: "var(--mono)",
              fontSize: 12,
              color: company.credits === 0 ? "#B23E1F" : "var(--ink-4)"
            }}
          >
            เครดิตคงเหลือ{" "}
            <strong style={{ color: company.credits === 0 ? "#B23E1F" : "var(--ink)" }}>
              {company.credits}
            </strong>{" "}
            โครงการ
          </span>
        </span>
      </div>

      {/* Recent active projects carousel */}
      <div className="module-board" style={{ padding: 18 }}>
        <PageHeader
          title="โครงการเคลื่อนไหวล่าสุด"
          detail="โครงการที่กำลังดำเนินการ · KPI: งบคงเหลือ · ระยะเวลา · กำไรปัจจุบัน"
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 12,
            marginTop: 10
          }}
        >
          {recentActive.slice(0, 4).map((p) => {
            const budgetLeft = p.plannedCost - p.actualCost;
            const badge = projectStatusBadge[p.status];
            const overdue = p.daysRemaining < 0;
            return (
              <div
                key={p.id}
                style={{
                  padding: 16,
                  border: "1px solid var(--line)",
                  borderRadius: 8,
                  background: "var(--panel)",
                  display: "grid",
                  gap: 10,
                  cursor: "pointer",
                  transition: "border-color .15s, transform .15s",
                  position: "relative"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <span
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: 11,
                      letterSpacing: "0.06em",
                      color: "var(--ink-5)"
                    }}
                  >
                    {p.code}
                  </span>
                  <span
                    className="cashflow-badge"
                    style={{ background: badge.bg, color: badge.color, border: 0 }}
                  >
                    {badge.label}
                  </span>
                </div>
                <strong style={{ fontSize: 14, lineHeight: 1.35, minHeight: 38 }}>
                  {p.name}
                </strong>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--ink-5)",
                    fontFamily: "var(--mono)"
                  }}
                >
                  {p.customerName ?? "ไม่มีลูกค้า — internal"}
                </div>
                <div style={{ borderTop: "1px solid var(--line)", paddingTop: 10, display: "grid", gap: 6 }}>
                  <KpiRow
                    label="งบคงเหลือ"
                    value={p.hasBudget ? shortMoney(budgetLeft) : "ไม่มีงบประมาณ"}
                    warn={!p.hasBudget}
                  />
                  <KpiRow
                    label="เวลาคงเหลือ"
                    value={
                      overdue ? `เลย deadline ${Math.abs(p.daysRemaining).toLocaleString()} วัน` : `${p.daysRemaining} วัน`
                    }
                    warn={overdue}
                  />
                  <KpiRow
                    label="กำไรปัจจุบัน"
                    value={p.marginPct !== null ? `${p.marginPct.toFixed(1)}%` : "—"}
                    positive={p.marginPct !== null && p.marginPct >= 15}
                  />
                </div>
                <div
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 11,
                    color: "var(--ink-3)",
                    textAlign: "right"
                  }}
                >
                  มูลค่า {shortMoney(p.contractValue)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Status filter chips + search + create button */}
      <div className="module-board" style={{ padding: 18 }}>
        <PageHeader
          title="ข้อมูลโครงการ"
          detail="รายการทั้งหมด · sortable · click ไปหน้า project detail"
        />
        <div
          style={{
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
            alignItems: "center",
            marginBottom: 14
          }}
        >
          {(["all", "normal", "delayed", "closed", "cancelled"] as const).map((s) => {
            const isActive = statusFilter === s;
            const badge = s === "all" ? null : projectStatusBadge[s as ProjectStatus];
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                type="button"
                style={{
                  padding: "6px 14px",
                  borderRadius: 999,
                  border: isActive ? "1px solid var(--ink)" : "1px solid var(--line)",
                  background: isActive ? "var(--ink)" : "var(--panel)",
                  color: isActive ? "#fff" : "var(--ink-3)",
                  cursor: "pointer",
                  fontSize: 12,
                  fontFamily: "var(--mono)",
                  letterSpacing: "0.04em",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                {badge && (
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: badge.dot,
                      display: "inline-block"
                    }}
                  />
                )}
                {s === "all" ? "ทั้งหมด" : projectStatusBadge[s as ProjectStatus].label}
                <span style={{ opacity: 0.6 }}>{statusCounts[s]}</span>
              </button>
            );
          })}
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหา เลขที่/โครงการ/ลูกค้า..."
            style={{
              flex: "1 1 220px",
              padding: "8px 12px",
              border: "1px solid var(--line)",
              borderRadius: 6,
              fontFamily: "inherit",
              fontSize: 13,
              marginLeft: 8
            }}
          />
          <button className="primary-button" type="button">+ สร้างโครงการ</button>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 12,
              minWidth: 940
            }}
          >
            <thead>
              <tr style={{ borderBottom: "1px solid var(--line)" }}>
                {[
                  { label: "เลขที่", w: "70px" },
                  { label: "โครงการ", w: "auto" },
                  { label: "ลูกค้า", w: "160px" },
                  { label: "มูลค่าสัญญา", w: "100px", right: true },
                  { label: "ต้นทุนแผน", w: "100px", right: true },
                  { label: "ต้นทุนจริง", w: "100px", right: true },
                  { label: "กำไร %", w: "70px", right: true },
                  { label: "เวลา", w: "90px", right: true },
                  { label: "สถานะ", w: "80px" }
                ].map((c) => (
                  <th
                    key={c.label}
                    style={{
                      textAlign: c.right ? "right" : "left",
                      padding: "10px 12px",
                      background: "var(--panel-soft, #F4F4F2)",
                      fontFamily: "var(--mono)",
                      fontSize: 10,
                      letterSpacing: "0.06em",
                      color: "var(--ink-5)",
                      textTransform: "uppercase",
                      whiteSpace: "nowrap",
                      width: c.w
                    }}
                  >
                    {c.label} <span style={{ opacity: 0.4 }}>▼</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const badge = projectStatusBadge[p.status];
                const overdue = p.daysRemaining < 0;
                const overBudget = p.actualCost > p.plannedCost && p.hasBudget;
                return (
                  <tr
                    key={p.id}
                    style={{
                      borderBottom: "1px solid var(--line)",
                      cursor: "pointer"
                    }}
                  >
                    <td
                      style={{
                        padding: "10px 12px",
                        fontFamily: "var(--mono)",
                        fontWeight: 700,
                        color: "var(--ink-2)"
                      }}
                    >
                      {p.code}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <div style={{ fontWeight: 600 }}>{p.name}</div>
                    </td>
                    <td
                      style={{
                        padding: "10px 12px",
                        color: p.customerName ? "var(--ink-2)" : "var(--ink-5)",
                        fontStyle: p.customerName ? "normal" : "italic"
                      }}
                    >
                      {p.customerName ?? "ไม่มีลูกค้า"}
                      {p.customerType === "gov" && (
                        <span
                          style={{
                            marginLeft: 6,
                            fontSize: 9,
                            padding: "1px 5px",
                            border: "1px solid var(--line-strong)",
                            borderRadius: 3,
                            color: "var(--ink-4)"
                          }}
                        >
                          GOV
                        </span>
                      )}
                    </td>
                    <td
                      style={{
                        padding: "10px 12px",
                        textAlign: "right",
                        fontFamily: "var(--mono)"
                      }}
                    >
                      {p.contractValue > 0 ? moneyFmt.format(p.contractValue) : "—"}
                    </td>
                    <td
                      style={{
                        padding: "10px 12px",
                        textAlign: "right",
                        fontFamily: "var(--mono)",
                        color: p.hasBudget ? "var(--ink-4)" : "#B23E1F"
                      }}
                    >
                      {p.hasBudget ? moneyFmt.format(p.plannedCost) : "ไม่มีงบ"}
                    </td>
                    <td
                      style={{
                        padding: "10px 12px",
                        textAlign: "right",
                        fontFamily: "var(--mono)",
                        color: overBudget ? "#B23E1F" : "var(--ink-2)",
                        fontWeight: overBudget ? 700 : 500
                      }}
                    >
                      {moneyFmt.format(p.actualCost)} {overBudget && "⚠"}
                    </td>
                    <td
                      style={{
                        padding: "10px 12px",
                        textAlign: "right",
                        fontFamily: "var(--mono)",
                        color:
                          p.marginPct === null
                            ? "var(--ink-5)"
                            : p.marginPct >= 15
                              ? "#2A6D45"
                              : "#B23E1F",
                        fontWeight: 700
                      }}
                    >
                      {p.marginPct !== null ? `${p.marginPct.toFixed(1)}%` : "—"}
                    </td>
                    <td
                      style={{
                        padding: "10px 12px",
                        textAlign: "right",
                        fontFamily: "var(--mono)",
                        color: overdue ? "#B23E1F" : "var(--ink-3)"
                      }}
                    >
                      {p.daysRemaining}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <span
                        className="cashflow-badge"
                        style={{ background: badge.bg, color: badge.color, border: 0 }}
                      >
                        {badge.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div
          style={{
            marginTop: 12,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 12,
            color: "var(--ink-5)",
            fontFamily: "var(--mono)"
          }}
        >
          <span>
            แสดงรายการ 1 - {filtered.length} จาก {seedProjects.length}
          </span>
          <span>หน้า 1 จาก 1</span>
        </div>

        <div
          style={{
            marginTop: 14,
            padding: 12,
            borderRadius: 6,
            background: "#E5EDF7",
            color: "#2A4F86",
            fontSize: 13
          }}
        >
          💡 <strong>AI superpower (Phase 2):</strong>
          <ul style={{ margin: "6px 0 0 18px", padding: 0 }}>
            <li>"-1,331 วัน" → AI prompt "โครงการนี้ค้าง 3+ ปี ปิดงานหรือยกเลิก?"</li>
            <li>"ไม่มีงบประมาณ" badge → click → AI estimate จาก contract_value + standard cost ratio</li>
            <li>Natural search: "โครงการของคุณธีรภัทร์ที่ยังไม่ปิด" แทน keyword match</li>
            <li>Cross-project insight: "งานบ้าน 2 ชั้น margin เฉลี่ยของคุณคือ 22% — j-2599 ต่ำกว่าค่าเฉลี่ย 12%"</li>
          </ul>
        </div>
      </div>
    </MockupShell>
  );
}

function KpiRow({
  label,
  value,
  warn,
  positive
}: {
  label: string;
  value: ReactNode;
  warn?: boolean;
  positive?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: 12
      }}
    >
      <span
        style={{
          fontFamily: "var(--mono)",
          fontSize: 10,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "var(--ink-5)"
        }}
      >
        {label}
      </span>
      <strong
        style={{
          fontFamily: "var(--mono)",
          fontSize: 13,
          color: warn ? "#B23E1F" : positive ? "#2A6D45" : "var(--ink)"
        }}
      >
        {value}
      </strong>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 0.5 Project Detail (Sprint 0 — single project workspace) mockup
// ---------------------------------------------------------------------------

type ProjectDetailTab =
  | "overview"
  | "pr"
  | "rfq"
  | "po"
  | "cost"
  | "invoice"
  | "reports";

const projectDetailTabs: Array<{ id: ProjectDetailTab; label: string; badge?: number }> = [
  { id: "overview", label: "ภาพรวม" },
  { id: "pr", label: "ใบขอซื้อ (PR)", badge: 3 },
  { id: "rfq", label: "ขอราคา (RFQ)", badge: 1 },
  { id: "po", label: "จัดซื้อ (PO)", badge: 5 },
  { id: "cost", label: "บันทึกต้นทุน", badge: 28 },
  { id: "invoice", label: "ใบแจ้งหนี้", badge: 4 },
  { id: "reports", label: "รายงาน" }
];

function ProjectDetailMockup() {
  const [activeTab, setActiveTab] = useState<ProjectDetailTab>("overview");
  // pretend the user clicked project j-2599 from the list
  const project = seedProjects[1]; // อาคารพาณิชย์ 3 ชั้น เทพารักษ์ (delayed, over budget)
  const badge = projectStatusBadge[project.status];
  const overdue = project.daysRemaining < 0;
  const overBudget = project.actualCost > project.plannedCost;

  return (
    <MockupShell
      title={`${project.code} — ${project.name}`}
      detail={`Project Detail · ${project.customerName ?? "ไม่มีลูกค้า"} · ${
        project.customerType === "gov" ? "หน่วยงานราชการ" : project.customerType === "corporate" ? "นิติบุคคล" : "บุคคลธรรมดา"
      }`}
    >
      {/* Project header card */}
      <div
        style={{
          padding: 20,
          background: "var(--panel)",
          border: "1px solid var(--line)",
          borderRadius: 10,
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: 20,
          alignItems: "center"
        }}
      >
        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <span
              className="cashflow-badge"
              style={{ background: badge.bg, color: badge.color, border: 0 }}
            >
              ● {badge.label}
            </span>
            <span
              style={{
                fontFamily: "var(--mono)",
                fontSize: 11,
                color: "var(--ink-5)"
              }}
            >
              เริ่ม {project.startDate} → สิ้นสุด {project.endDate}
            </span>
            <span
              style={{
                fontFamily: "var(--mono)",
                fontSize: 12,
                fontWeight: 700,
                color: overdue ? "#B23E1F" : "var(--ink-3)"
              }}
            >
              {overdue
                ? `⚠ เลย deadline ${Math.abs(project.daysRemaining)} วัน`
                : `${project.daysRemaining} วันคงเหลือ`}
            </span>
          </div>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            <ProjectHeaderKpi label="มูลค่าสัญญา" value={moneyFmt.format(project.contractValue)} />
            <ProjectHeaderKpi
              label="ต้นทุนแผน"
              value={moneyFmt.format(project.plannedCost)}
            />
            <ProjectHeaderKpi
              label="ต้นทุนจริง"
              value={moneyFmt.format(project.actualCost)}
              warn={overBudget}
            />
            <ProjectHeaderKpi
              label="กำไร %"
              value={project.marginPct !== null ? `${project.marginPct.toFixed(1)}%` : "—"}
              positive={project.marginPct !== null && project.marginPct >= 15}
              warn={project.marginPct !== null && project.marginPct < 10}
            />
            <ProjectHeaderKpi
              label="งบคงเหลือ"
              value={shortMoney(project.plannedCost - project.actualCost)}
              warn={project.plannedCost - project.actualCost < 0}
            />
          </div>
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          <button className="primary-button" type="button">
            + บันทึกต้นทุน
          </button>
          <button className="secondary-button" type="button">
            + สร้าง PR
          </button>
          <button className="secondary-button" type="button">
            ⋯ More actions
          </button>
        </div>
      </div>

      {/* Tab navigation */}
      <div
        style={{
          display: "flex",
          gap: 4,
          borderBottom: "1px solid var(--line)",
          overflowX: "auto"
        }}
      >
        {projectDetailTabs.map((t) => {
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              type="button"
              style={{
                padding: "12px 18px",
                background: "transparent",
                border: 0,
                borderBottom: isActive ? "2px solid var(--ink)" : "2px solid transparent",
                color: isActive ? "var(--ink)" : "var(--ink-4)",
                fontWeight: isActive ? 700 : 500,
                fontSize: 13,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                whiteSpace: "nowrap"
              }}
            >
              {t.label}
              {t.badge !== undefined && (
                <span
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 10,
                    padding: "2px 7px",
                    borderRadius: 10,
                    background: isActive ? "var(--ink)" : "var(--bg-2, #EAEAE7)",
                    color: isActive ? "#fff" : "var(--ink-4)"
                  }}
                >
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {activeTab === "overview" && <ProjectOverviewTab project={project} />}
      {activeTab === "pr" && <ProjectListPanelStub label="Purchase Requests ของโครงการนี้" goToTab="procurement" />}
      {activeTab === "rfq" && <ProjectListPanelStub label="RFQ ของโครงการนี้" goToTab="rfq" />}
      {activeTab === "po" && <ProjectListPanelStub label="Purchase Orders (BuildDocs)" goToTab="procurement" />}
      {activeTab === "cost" && <ProjectListPanelStub label="บันทึกต้นทุน (Cashflow scoped to project)" goToTab="project-control" />}
      {activeTab === "invoice" && <ProjectListPanelStub label="ใบแจ้งหนี้ (BuildDocs)" goToTab="procurement" />}
      {activeTab === "reports" && <ProjectListPanelStub label="รายงานของโครงการนี้ (5 templates)" goToTab="project-control" />}
    </MockupShell>
  );
}

function ProjectHeaderKpi({
  label,
  value,
  warn,
  positive
}: {
  label: string;
  value: string;
  warn?: boolean;
  positive?: boolean;
}) {
  return (
    <div style={{ display: "grid", gap: 2 }}>
      <span
        style={{
          fontFamily: "var(--mono)",
          fontSize: 10,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "var(--ink-5)"
        }}
      >
        {label}
      </span>
      <strong
        style={{
          fontFamily: "var(--mono)",
          fontSize: 16,
          color: warn ? "#B23E1F" : positive ? "#2A6D45" : "var(--ink)"
        }}
      >
        {value} {warn && "⚠"}
      </strong>
    </div>
  );
}

function ProjectOverviewTab({ project }: { project: SeedProject }) {
  const costBreakdown = [
    { code: "01 Site", planned: 200_000, actual: 195_000 },
    { code: "02 Structure", planned: 2_800_000, actual: 3_100_000 }, // over
    { code: "03 Architecture", planned: 1_500_000, actual: 950_000 },
    { code: "04 MEP", planned: 1_200_000, actual: 850_000 },
    { code: "05 Finishing", planned: 600_000, actual: 380_000 },
    { code: "06 External", planned: 100_000, actual: 105_000 }
  ];

  const recentActivity = [
    { ts: "2 ชม. ที่แล้ว", action: "บันทึกต้นทุน", what: "ปูน 50kg × 50 ถุง — ฿12,000", actor: "ณรงค์ศักดิ์" },
    { ts: "เมื่อวาน", action: "PR approved", what: "PR-2026-007 ฿120,000", actor: "ผู้จัดการ" },
    { ts: "2 วันก่อน", action: "RFQ awarded", what: "RFQ-2026-002 → SCC ฿92,800", actor: "ณรงค์ศักดิ์" },
    { ts: "3 วันก่อน", action: "Invoice sent", what: "INV-2026-014 ฿850,000 (งวด 3)", actor: "ผู้จัดการ" },
    { ts: "4 วันก่อน", action: "บันทึกต้นทุน", what: "เหล็กเส้น 12mm × 2 ตัน — ฿35,000", actor: "ณรงค์ศักดิ์" }
  ];

  return (
    <>
      {/* Alert banners */}
      <div
        style={{
          padding: 14,
          borderRadius: 8,
          background: "#FFE6E1",
          border: "1px solid #F2BCAE",
          color: "#B23E1F",
          fontSize: 13,
          display: "flex",
          alignItems: "center",
          gap: 12
        }}
      >
        ⚠
        <div>
          <strong>โครงการเลย deadline {Math.abs(project.daysRemaining)} วัน</strong>
          <div style={{ fontSize: 12, marginTop: 2 }}>
            ปิดโครงการ / เลื่อน deadline / ยกเลิก
          </div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          <button className="cashflow-row-button" type="button">
            เลื่อน deadline
          </button>
          <button className="cashflow-row-button" type="button">
            ปิดงาน
          </button>
        </div>
      </div>

      <div
        style={{
          padding: 14,
          borderRadius: 8,
          background: "#FFF1CC",
          border: "1px solid #F4DD9C",
          color: "#92651A",
          fontSize: 13,
          display: "flex",
          alignItems: "center",
          gap: 12
        }}
      >
        ⚠
        <div>
          <strong>02 Structure ต้นทุนเกินงบ ฿300,000 (10.7%)</strong>
          <div style={{ fontSize: 12, marginTop: 2 }}>
            ต้นทุนจริง ฿3.10M / แผน ฿2.80M — ปรับงบ structure หรือ rebalance จาก code อื่น
          </div>
        </div>
      </div>

      {/* Cost breakdown panel */}
      <div className="module-board" style={{ padding: 18 }}>
        <PageHeader
          title="Cost Breakdown ตาม Cost Code"
          detail="ใช้ต้นทุนจริงเทียบกับแผน · click code เพื่อดู cashflow entries ใต้"
        />
        <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
          {costBreakdown.map((c) => {
            const over = c.actual > c.planned;
            const pct = Math.round((c.actual / c.planned) * 100);
            return (
              <div
                key={c.code}
                style={{
                  display: "grid",
                  gridTemplateColumns: "140px 1fr 100px 100px 70px",
                  gap: 12,
                  alignItems: "center",
                  padding: "10px 14px",
                  border: over ? "1px solid #F2BCAE" : "1px solid var(--line)",
                  borderRadius: 8,
                  background: over ? "#FFE6E1" : "var(--panel)"
                }}
              >
                <strong style={{ fontFamily: "var(--mono)", fontSize: 13 }}>{c.code}</strong>
                <div style={{ position: "relative", height: 8, borderRadius: 4, background: "var(--bg-2, #EAEAE7)" }}>
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: `${Math.min(100, pct)}%`,
                      background: over ? "#B23E1F" : "var(--ink)",
                      borderRadius: 4
                    }}
                  />
                </div>
                <span style={{ textAlign: "right", fontFamily: "var(--mono)", fontSize: 12, color: "var(--ink-4)" }}>
                  {shortMoney(c.planned)}
                </span>
                <span
                  style={{
                    textAlign: "right",
                    fontFamily: "var(--mono)",
                    fontSize: 13,
                    fontWeight: 700,
                    color: over ? "#B23E1F" : "var(--ink)"
                  }}
                >
                  {shortMoney(c.actual)}
                </span>
                <span
                  style={{
                    textAlign: "right",
                    fontFamily: "var(--mono)",
                    fontSize: 12,
                    color: over ? "#B23E1F" : "var(--ink-3)"
                  }}
                >
                  {pct}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 12 }}>
        {/* Recent activity */}
        <div className="module-board" style={{ padding: 18 }}>
          <PageHeader title="กิจกรรมล่าสุด" detail="ทุก action ของโครงการนี้ — สำหรับ audit" />
          <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
            {recentActivity.map((a, i) => (
              <div
                key={i}
                style={{
                  display: "grid",
                  gridTemplateColumns: "100px 110px 1fr 90px",
                  gap: 12,
                  alignItems: "center",
                  padding: "8px 12px",
                  borderBottom: i < recentActivity.length - 1 ? "1px solid var(--line)" : "none",
                  fontSize: 12
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 11,
                    color: "var(--ink-5)"
                  }}
                >
                  {a.ts}
                </span>
                <span
                  className="cashflow-badge"
                  style={{
                    border: "1px solid var(--line)",
                    background: "var(--paper)",
                    color: "var(--ink-3)"
                  }}
                >
                  {a.action}
                </span>
                <span>{a.what}</span>
                <span
                  style={{
                    textAlign: "right",
                    color: "var(--ink-5)",
                    fontSize: 11
                  }}
                >
                  {a.actor}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* AI insights */}
        <div
          className="module-board"
          style={{
            padding: 18,
            background: "var(--ink)",
            color: "#FAFAF9",
            borderColor: "var(--ink)"
          }}
        >
          <div style={{ marginBottom: 14 }}>
            <span
              style={{
                fontFamily: "var(--mono)",
                fontSize: 10,
                letterSpacing: "0.08em",
                color: "#9F9F9C",
                textTransform: "uppercase"
              }}
            >
              💡 AI Insights (Phase 2)
            </span>
            <h2 style={{ margin: "6px 0 0", fontSize: 18, color: "#fff" }}>คำแนะนำสำหรับโครงการนี้</h2>
          </div>
          <ul style={{ display: "grid", gap: 12, padding: 0, margin: 0, listStyle: "none" }}>
            <li style={{ paddingLeft: 22, position: "relative", fontSize: 13, lineHeight: 1.5 }}>
              <span style={{ position: "absolute", left: 0 }}>⚠</span>
              <strong style={{ color: "#FFE6E1" }}>02 Structure เกินงบ 10.7%</strong> —
              ใกล้เคียงค่าเฉลี่ยของโครงการที่เกินงบสุดท้าย 22% · แนะนำตรวจ supplier change ใน PO ล่าสุด
            </li>
            <li style={{ paddingLeft: 22, position: "relative", fontSize: 13, lineHeight: 1.5 }}>
              <span style={{ position: "absolute", left: 0 }}>📊</span>
              <strong style={{ color: "#E1F0E5" }}>กำไร 9.8% ต่ำกว่า benchmark</strong> —
              โครงการอาคารพาณิชย์ของคุณเฉลี่ย 18% · ดูสูตรคำนวณ
            </li>
            <li style={{ paddingLeft: 22, position: "relative", fontSize: 13, lineHeight: 1.5 }}>
              <span style={{ position: "absolute", left: 0 }}>📅</span>
              <strong style={{ color: "#FAFAF9" }}>เลย deadline 24 วัน</strong> —
              งวด 4 (final) ยังไม่ออก invoice · ออก partial billing ตามงาน completed?
            </li>
            <li style={{ paddingLeft: 22, position: "relative", fontSize: 13, lineHeight: 1.5 }}>
              <span style={{ position: "absolute", left: 0 }}>🔍</span>
              <strong style={{ color: "#FAFAF9" }}>03 Architecture ต่ำกว่าแผน 37%</strong> —
              ไม่ใช่ปัญหา · แต่ถ้าโครงการใกล้จบควรเร่ง finishing
            </li>
          </ul>
          <div
            style={{
              marginTop: 14,
              padding: 10,
              borderRadius: 6,
              background: "rgba(255,255,255,0.06)",
              fontSize: 11,
              fontFamily: "var(--mono)",
              color: "#9F9F9C"
            }}
          >
            ถามอะไรกับโครงการนี้ก็ได้: "ทำไม Structure เกินงบ?", "งวดถัดไปออก invoice ยอดเท่าไร?"
          </div>
        </div>
      </div>
    </>
  );
}

function ProjectListPanelStub({ label, goToTab }: { label: string; goToTab: MockupTab }) {
  return (
    <div className="hub-action-empty" style={{ padding: 30, textAlign: "center" }}>
      <ClipboardEmpty />
      <strong style={{ display: "block", margin: "10px 0", fontSize: 14 }}>
        {label}
      </strong>
      <span style={{ fontSize: 12 }}>
        ใน Sprint 3+ tab นี้จะ embed module ของจริง (
        <a
          href={`/mockup`}
          style={{ color: "var(--ink)", textDecoration: "underline" }}
        >
          ดู mockup standalone: {goToTab}
        </a>
        )
      </span>
    </div>
  );
}

function ClipboardEmpty() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="6" y="4" width="12" height="16" rx="2" />
      <line x1="9" y1="9" x2="15" y2="9" />
      <line x1="9" y1="13" x2="15" y2="13" />
      <line x1="9" y1="17" x2="13" y2="17" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// 1. Cost Codes (CBS) mockup
// ---------------------------------------------------------------------------

type SeedCostCode = {
  code: string;
  parent?: string;
  name: string;
  unit: string;
  defaultPrice: number;
  category: string;
};

const seedCostCodes: SeedCostCode[] = [
  { code: "01", parent: undefined, name: "Site Work — งานปรับพื้นที่", unit: "—", defaultPrice: 0, category: "site" },
  { code: "01-100", parent: "01", name: "งานปรับระดับ", unit: "ตร.ม.", defaultPrice: 120, category: "site" },
  { code: "01-200", parent: "01", name: "งานรื้อถอน", unit: "ตร.ม.", defaultPrice: 200, category: "site" },
  { code: "01-300", parent: "01", name: "งานขุดดิน", unit: "ลบ.ม.", defaultPrice: 85, category: "site" },
  { code: "02", parent: undefined, name: "Structure — โครงสร้าง", unit: "—", defaultPrice: 0, category: "structure" },
  { code: "02-100", parent: "02", name: "ฐานรากเสาเข็ม", unit: "ต้น", defaultPrice: 8500, category: "structure" },
  { code: "02-200", parent: "02", name: "เสาคอนกรีตเสริมเหล็ก", unit: "ลบ.ม.", defaultPrice: 3200, category: "structure" },
  { code: "02-300", parent: "02", name: "คานคอนกรีตเสริมเหล็ก", unit: "ลบ.ม.", defaultPrice: 3500, category: "structure" },
  { code: "02-400", parent: "02", name: "พื้นคอนกรีตเสริมเหล็ก", unit: "ตร.ม.", defaultPrice: 850, category: "structure" },
  { code: "03", parent: undefined, name: "Architecture — สถาปัตยกรรม", unit: "—", defaultPrice: 0, category: "architecture" },
  { code: "03-100", parent: "03", name: "งานผนังก่ออิฐ", unit: "ตร.ม.", defaultPrice: 380, category: "architecture" },
  { code: "03-200", parent: "03", name: "งานฉาบปูน", unit: "ตร.ม.", defaultPrice: 180, category: "architecture" },
  { code: "03-300", parent: "03", name: "งานติดตั้งประตู-หน้าต่าง", unit: "ชุด", defaultPrice: 4500, category: "architecture" },
  { code: "04", parent: undefined, name: "MEP — งานระบบ", unit: "—", defaultPrice: 0, category: "mep" },
  { code: "04-100", parent: "04", name: "งานเดินท่อประปา", unit: "เมตร", defaultPrice: 280, category: "mep" },
  { code: "04-200", parent: "04", name: "งานเดินสายไฟ", unit: "เมตร", defaultPrice: 150, category: "mep" },
  { code: "04-300", parent: "04", name: "งานติดตั้งสุขภัณฑ์", unit: "ชุด", defaultPrice: 3800, category: "mep" },
  { code: "05", parent: undefined, name: "Finishing — งานตกแต่ง", unit: "—", defaultPrice: 0, category: "finishing" },
  { code: "05-100", parent: "05", name: "ปูพื้นกระเบื้อง", unit: "ตร.ม.", defaultPrice: 520, category: "finishing" },
  { code: "05-200", parent: "05", name: "งานทาสี", unit: "ตร.ม.", defaultPrice: 95, category: "finishing" },
  { code: "05-300", parent: "05", name: "งานบิวท์อิน", unit: "เมตร", defaultPrice: 8500, category: "finishing" }
];

function CostCodesMockup() {
  const [search, setSearch] = useState("");
  const [openCategories, setOpenCategories] = useState<Set<string>>(
    new Set(["site", "structure", "architecture", "mep", "finishing"])
  );

  const toggleCategory = (cat: string) => {
    const next = new Set(openCategories);
    if (next.has(cat)) next.delete(cat);
    else next.add(cat);
    setOpenCategories(next);
  };

  const filtered = seedCostCodes.filter(
    (c) =>
      !search ||
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.name.toLowerCase().includes(search.toLowerCase())
  );

  const roots = filtered.filter((c) => !c.parent);
  const childrenOf = (parentCode: string) =>
    filtered.filter((c) => c.parent === parentCode);

  return (
    <MockupShell
      title="Cost Codes (CBS) — หมวดต้นทุนมาตรฐาน"
      detail="Spine ของ Builk-parity workflow · ทุก PR/cost recording/report ผูกกับ code นี้"
    >
      <div className="summary-grid hub-summary-grid hub-summary-grid--wide">
        <SummaryTile label="System seeds" value="5 หมวด" />
        <SummaryTile label="Sub-codes" value={`${seedCostCodes.filter((c) => c.parent).length} รายการ`} />
        <SummaryTile label="Custom codes" value="0" />
        <SummaryTile label="Last update" value="วันนี้" strong />
      </div>

      <div className="module-board">
        <PageHeader
          title="Catalog"
          detail="คลิกหมวดเพื่อพับ/ขยาย · กดที่ code เพื่อแก้ไข"
        />
        <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหา code หรือชื่องาน..."
            style={{
              flex: "1 1 280px",
              padding: "9px 12px",
              border: "1px solid var(--line)",
              borderRadius: 7,
              fontFamily: "inherit",
              fontSize: 14
            }}
          />
          <button className="secondary-button" type="button">+ เพิ่ม Code</button>
          <button className="secondary-button" type="button">Import CSV</button>
          <button className="secondary-button" type="button">Export</button>
        </div>

        <div style={{ border: "1px solid var(--line)", borderRadius: 8 }}>
          {roots.map((root) => {
            const isOpen = openCategories.has(root.category);
            const children = childrenOf(root.code);
            return (
              <div key={root.code} style={{ borderBottom: "1px solid var(--line)" }}>
                <button
                  onClick={() => toggleCategory(root.category)}
                  type="button"
                  style={{
                    width: "100%",
                    display: "grid",
                    gridTemplateColumns: "16px 80px 1fr auto",
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
                  <span style={{ fontFamily: "var(--mono, monospace)", fontWeight: 700 }}>
                    {root.code}
                  </span>
                  <strong>{root.name}</strong>
                  <span
                    style={{
                      fontFamily: "var(--mono, monospace)",
                      fontSize: 11,
                      color: "var(--ink-5)"
                    }}
                  >
                    {children.length} codes
                  </span>
                </button>
                {isOpen &&
                  children.map((child) => (
                    <div
                      key={child.code}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "16px 80px 1fr 100px 120px",
                        gap: 12,
                        padding: "10px 16px 10px 32px",
                        borderTop: "1px solid var(--line)",
                        background: "#fff",
                        cursor: "pointer",
                        fontSize: 13
                      }}
                    >
                      <span />
                      <span
                        style={{
                          fontFamily: "var(--mono, monospace)",
                          color: "var(--ink-3)"
                        }}
                      >
                        {child.code}
                      </span>
                      <span>{child.name}</span>
                      <span
                        style={{
                          fontFamily: "var(--mono, monospace)",
                          fontSize: 12,
                          color: "var(--ink-4)"
                        }}
                      >
                        {child.unit}
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--mono, monospace)",
                          fontWeight: 700,
                          textAlign: "right"
                        }}
                      >
                        {moneyFmt.format(child.defaultPrice)}
                      </span>
                    </div>
                  ))}
              </div>
            );
          })}
        </div>

        <div
          style={{
            marginTop: 14,
            padding: 12,
            borderRadius: 6,
            background: "#E5EDF7",
            color: "#2A4F86",
            fontSize: 13
          }}
        >
          💡 <strong>AI superpower (Phase 2):</strong> ถ่ายรูป BOQ ของผู้รับเหมาเดิม → AI suggest cost code ที่ตรงในระบบ + เติม unit price อัตโนมัติ
        </div>
      </div>
    </MockupShell>
  );
}

// ---------------------------------------------------------------------------
// 2. Suppliers mockup
// ---------------------------------------------------------------------------

type SeedSupplier = {
  id: string;
  name: string;
  short: string;
  taxId: string;
  city: string;
  paymentTerms: string;
  rating: number;
  lastOrder: string;
  totalSpend: number;
  topCategories: string[];
};

const seedSuppliers: SeedSupplier[] = [
  {
    id: "s1",
    name: "บจก. ปูนซิเมนต์ไทย",
    short: "SCC",
    taxId: "0105-xxx-1234",
    city: "Bangkok",
    paymentTerms: "30 days",
    rating: 5,
    lastOrder: "2026-04-15",
    totalSpend: 1_200_000,
    topCategories: ["ปูน", "คอนกรีต"]
  },
  {
    id: "s2",
    name: "บจก. TPI Polene",
    short: "TPI",
    taxId: "0107-xxx-5678",
    city: "Saraburi",
    paymentTerms: "45 days",
    rating: 4,
    lastOrder: "2026-03-22",
    totalSpend: 850_000,
    topCategories: ["ปูน", "เหล็ก"]
  },
  {
    id: "s3",
    name: "บจก. อินทรี (Insee)",
    short: "Insee",
    taxId: "0105-xxx-9012",
    city: "Bangkok",
    paymentTerms: "45 days",
    rating: 4,
    lastOrder: "2026-04-02",
    totalSpend: 620_000,
    topCategories: ["ปูน"]
  },
  {
    id: "s4",
    name: "บจก. ค้าวัสดุภาคเหนือ",
    short: "NorthMat",
    taxId: "0507-xxx-3456",
    city: "Chiang Mai",
    paymentTerms: "Cash",
    rating: 3,
    lastOrder: "2026-02-18",
    totalSpend: 280_000,
    topCategories: ["ทราย", "หิน"]
  },
  {
    id: "s5",
    name: "บจก. เหล็กไทย",
    short: "ThaiSteel",
    taxId: "0105-xxx-7890",
    city: "Samut Prakan",
    paymentTerms: "60 days",
    rating: 5,
    lastOrder: "2026-04-30",
    totalSpend: 2_100_000,
    topCategories: ["เหล็กเส้น", "เหล็กรูปพรรณ"]
  }
];

function SuppliersMockup() {
  const [selected, setSelected] = useState<string>(seedSuppliers[0].id);
  const supplier = seedSuppliers.find((s) => s.id === selected) ?? seedSuppliers[0];

  return (
    <MockupShell
      title="Suppliers Directory"
      detail="รวม supplier ทั้งหมด · price history · rating · last order"
    >
      <div className="summary-grid hub-summary-grid hub-summary-grid--wide">
        <SummaryTile label="Suppliers" value={`${seedSuppliers.length} ราย`} />
        <SummaryTile
          label="Total spend ทุกราย"
          value={shortMoney(seedSuppliers.reduce((s, x) => s + x.totalSpend, 0))}
          strong
        />
        <SummaryTile label="High rated (5⭐)" value={`${seedSuppliers.filter((s) => s.rating === 5).length} ราย`} />
        <SummaryTile label="ใช้บ่อยเดือนนี้" value="3 ราย" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 12 }}>
        <div className="module-board" style={{ padding: 16 }}>
          <PageHeader title="ทั้งหมด" detail="คลิกเพื่อดูรายละเอียด" />
          <div style={{ display: "grid", gap: 6, marginTop: 10 }}>
            {seedSuppliers.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelected(s.id)}
                type="button"
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr auto",
                  gap: 10,
                  alignItems: "center",
                  padding: "10px 12px",
                  border:
                    s.id === selected ? "1px solid var(--ink)" : "1px solid var(--line)",
                  borderRadius: 7,
                  background: s.id === selected ? "var(--paper)" : "var(--panel)",
                  cursor: "pointer",
                  textAlign: "left"
                }}
              >
                <span style={{ color: "#F4B400", fontSize: 13 }}>
                  {"⭐".repeat(s.rating)}
                </span>
                <span style={{ display: "grid", gap: 2 }}>
                  <strong style={{ fontSize: 13 }}>{s.short}</strong>
                  <small
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: 11,
                      color: "var(--ink-5)"
                    }}
                  >
                    {s.city}
                  </small>
                </span>
                <span
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "var(--ink)"
                  }}
                >
                  {shortMoney(s.totalSpend)}
                </span>
              </button>
            ))}
          </div>
          <div style={{ marginTop: 14 }}>
            <button className="primary-button" type="button">
              + เพิ่ม Supplier
            </button>
          </div>
        </div>

        <div className="module-board" style={{ padding: 18 }}>
          <PageHeader title={supplier.name} detail={`${supplier.short} · Tax ID ${supplier.taxId}`} />
          <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
            <Row label="City" value={supplier.city} />
            <Row label="Payment terms" value={supplier.paymentTerms} />
            <Row
              label="Rating"
              value={
                <span>
                  <span style={{ color: "#F4B400" }}>{"⭐".repeat(supplier.rating)}</span>
                  <span style={{ color: "var(--line-strong)" }}>
                    {"⭐".repeat(5 - supplier.rating)}
                  </span>
                </span>
              }
            />
            <Row label="Last order" value={supplier.lastOrder} />
            <Row
              label="Total spend"
              value={<strong>{moneyFmt.format(supplier.totalSpend)}</strong>}
            />
            <Row
              label="Top categories"
              value={supplier.topCategories.map((c) => (
                <span
                  key={c}
                  className="cashflow-badge"
                  style={{ marginRight: 4 }}
                >
                  {c}
                </span>
              ))}
            />
          </div>

          <div style={{ marginTop: 18 }}>
            <PageHeader title="Price history (mock)" detail="ราคาที่เคยเสนอจาก supplier นี้" />
            <div className="cashflow-table">
              <div
                className="cashflow-table-head"
                style={{
                  gridTemplateColumns: "100px 1fr 90px 110px 100px",
                  display: "grid"
                }}
              >
                <span>Date</span>
                <span>Item</span>
                <span>Unit</span>
                <span style={{ textAlign: "right" }}>Unit price</span>
                <span style={{ textAlign: "right" }}>vs avg</span>
              </div>
              {[
                { date: "2026-04-15", item: "ปูน 50kg", unit: "ถุง", price: 240, delta: -3 },
                { date: "2026-03-10", item: "ปูน 50kg", unit: "ถุง", price: 245, delta: -1 },
                { date: "2026-02-22", item: "ปูน 50kg", unit: "ถุง", price: 248, delta: 0 },
                { date: "2026-01-18", item: "ทรายหยาบ", unit: "ลบ.ม.", price: 480, delta: +2 }
              ].map((p, i) => (
                <div
                  key={i}
                  className="cashflow-row"
                  style={{
                    gridTemplateColumns: "100px 1fr 90px 110px 100px",
                    display: "grid"
                  }}
                >
                  <span className="cashflow-cell-date">{p.date}</span>
                  <span>{p.item}</span>
                  <span
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: 12,
                      color: "var(--ink-4)"
                    }}
                  >
                    {p.unit}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--mono)",
                      fontWeight: 700,
                      textAlign: "right"
                    }}
                  >
                    {moneyFmt.format(p.price)}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: 12,
                      textAlign: "right",
                      color:
                        p.delta < 0 ? "#2A6D45" : p.delta > 0 ? "#B23E1F" : "var(--ink-5)"
                    }}
                  >
                    {p.delta > 0 ? "+" : ""}
                    {p.delta}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MockupShell>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "130px 1fr",
        gap: 12,
        alignItems: "center",
        fontSize: 13
      }}
    >
      <span
        style={{
          fontFamily: "var(--mono)",
          fontSize: 11,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "var(--ink-5)"
        }}
      >
        {label}
      </span>
      <span>{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 3. Purchase Request mockup
// ---------------------------------------------------------------------------

type PRRow = {
  no: string;
  project: string;
  status: "draft" | "submitted" | "approved" | "ordered" | "received";
  amount: number;
  requestDate: string;
  neededBy: string;
  items: number;
};

const seedPRs: PRRow[] = [
  { no: "PR-2026-009", project: "บ้านพักคุณเอ - กรุงเทพ", status: "draft", amount: 85_000, requestDate: "2026-05-24", neededBy: "2026-06-01", items: 4 },
  { no: "PR-2026-008", project: "คอนโดสาทร เฟส 2", status: "submitted", amount: 320_000, requestDate: "2026-05-22", neededBy: "2026-06-05", items: 8 },
  { no: "PR-2026-007", project: "บ้านพักคุณเอ - กรุงเทพ", status: "approved", amount: 120_000, requestDate: "2026-05-20", neededBy: "2026-05-30", items: 5 },
  { no: "PR-2026-006", project: "บ้านพักคุณบี - เชียงใหม่", status: "ordered", amount: 1_500_000, requestDate: "2026-05-15", neededBy: "2026-06-15", items: 12 },
  { no: "PR-2026-005", project: "บ้านพักคุณบี - เชียงใหม่", status: "received", amount: 280_000, requestDate: "2026-05-08", neededBy: "2026-05-20", items: 3 }
];

const statusBadgeStyle: Record<PRRow["status"], { bg: string; color: string; label: string }> = {
  draft: { bg: "#FFF1CC", color: "#92651A", label: "Draft" },
  submitted: { bg: "#E5EDF7", color: "#2A4F86", label: "Submitted" },
  approved: { bg: "#E1F0E5", color: "#2A6D45", label: "Approved" },
  ordered: { bg: "#F0E5F7", color: "#5A2A86", label: "Ordered" },
  received: { bg: "var(--ink)", color: "#fff", label: "Received" }
};

function PRMockup() {
  const [filter, setFilter] = useState<"all" | PRRow["status"]>("all");
  const filtered = filter === "all" ? seedPRs : seedPRs.filter((p) => p.status === filter);

  return (
    <MockupShell
      title="Purchase Request (PR)"
      detail="ใบขอซื้อ · workflow: Draft → Submitted → Approved → Ordered → Received"
    >
      <div className="summary-grid hub-summary-grid hub-summary-grid--wide">
        <SummaryTile label="ทั้งหมดเดือนนี้" value={`${seedPRs.length} ใบ`} />
        <SummaryTile label="รออนุมัติ" value={`${seedPRs.filter((p) => p.status === "submitted").length} ใบ`} strong />
        <SummaryTile label="กำลังสั่ง" value={`${seedPRs.filter((p) => p.status === "ordered").length} ใบ`} />
        <SummaryTile
          label="ยอดรวมเดือนนี้"
          value={shortMoney(seedPRs.reduce((s, p) => s + p.amount, 0))}
        />
      </div>

      <div className="module-board" style={{ padding: 18 }}>
        <PageHeader title="รายการ PR" detail="คลิกเพื่อเปิดดูรายละเอียด · approve/reject inline" />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
          {(["all", "draft", "submitted", "approved", "ordered", "received"] as const).map(
            (s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                type="button"
                style={{
                  padding: "6px 14px",
                  borderRadius: 999,
                  border:
                    filter === s ? "1px solid var(--ink)" : "1px solid var(--line)",
                  background: filter === s ? "var(--ink)" : "var(--panel)",
                  color: filter === s ? "#fff" : "var(--ink-3)",
                  fontFamily: "var(--mono)",
                  fontSize: 11,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  cursor: "pointer"
                }}
              >
                {s === "all" ? "ทั้งหมด" : statusBadgeStyle[s].label}
              </button>
            )
          )}
          <button className="primary-button" type="button" style={{ marginLeft: "auto" }}>
            + สร้าง PR
          </button>
        </div>

        <div className="cashflow-table">
          <div
            className="cashflow-table-head"
            style={{
              gridTemplateColumns: "110px 1fr 100px 90px 110px 110px",
              display: "grid"
            }}
          >
            <span>PR No</span>
            <span>Project</span>
            <span style={{ textAlign: "center" }}>Status</span>
            <span style={{ textAlign: "right" }}>Items</span>
            <span style={{ textAlign: "right" }}>Amount</span>
            <span style={{ textAlign: "right" }}>Needed by</span>
          </div>
          {filtered.map((p) => {
            const badge = statusBadgeStyle[p.status];
            return (
              <div
                key={p.no}
                className="cashflow-row"
                style={{
                  gridTemplateColumns: "110px 1fr 100px 90px 110px 110px",
                  display: "grid",
                  cursor: "pointer"
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--mono)",
                    fontWeight: 700,
                    fontSize: 12
                  }}
                >
                  {p.no}
                </span>
                <span>{p.project}</span>
                <span style={{ textAlign: "center" }}>
                  <span
                    className="cashflow-badge"
                    style={{
                      background: badge.bg,
                      color: badge.color,
                      border: "0"
                    }}
                  >
                    {badge.label}
                  </span>
                </span>
                <span
                  style={{
                    textAlign: "right",
                    fontFamily: "var(--mono)",
                    fontSize: 12
                  }}
                >
                  {p.items}
                </span>
                <span
                  className="cashflow-cell-amount"
                  style={{ textAlign: "right", color: "var(--ink)" }}
                >
                  {moneyFmt.format(p.amount)}
                </span>
                <span
                  style={{
                    textAlign: "right",
                    fontFamily: "var(--mono)",
                    fontSize: 12,
                    color: "var(--ink-4)"
                  }}
                >
                  {p.neededBy}
                </span>
              </div>
            );
          })}
        </div>

        <div
          style={{
            marginTop: 14,
            padding: 12,
            borderRadius: 6,
            background: "#E5EDF7",
            color: "#2A4F86",
            fontSize: 13
          }}
        >
          💡 <strong>AI superpower (Phase 2):</strong> เปิด spec/drawing PDF → AI เสนอ items + quantity + supplier ที่เคยใช้ + draft PR ให้ทันที
        </div>
      </div>
    </MockupShell>
  );
}

// ---------------------------------------------------------------------------
// 4. RFQ Comparison mockup
// ---------------------------------------------------------------------------

type RFQItem = {
  item: string;
  unit: string;
  qty: number;
};

type RFQQuote = {
  itemPrices: number[];
  totalAmount: number;
  paymentTerms: string;
  delivery: string;
};

const seedRfqItems: RFQItem[] = [
  { item: "ปูน Portland 50kg", unit: "ถุง", qty: 200 },
  { item: "เหล็กเส้น 12mm SD40", unit: "ตัน", qty: 5 },
  { item: "ทรายหยาบ", unit: "ลบ.ม.", qty: 10 },
  { item: "หินคลุก 3/4\"", unit: "ลบ.ม.", qty: 8 }
];

const seedRfqQuotes: Record<string, RFQQuote> = {
  SCC: {
    itemPrices: [240, 17_600, 480, 850],
    totalAmount: 240 * 200 + 17_600 * 5 + 480 * 10 + 850 * 8,
    paymentTerms: "30 days",
    delivery: "7 days"
  },
  TPI: {
    itemPrices: [248, 17_500, 500, 880],
    totalAmount: 248 * 200 + 17_500 * 5 + 500 * 10 + 880 * 8,
    paymentTerms: "30 days",
    delivery: "10 days"
  },
  Insee: {
    itemPrices: [241, 17_800, 472, 820],
    totalAmount: 241 * 200 + 17_800 * 5 + 472 * 10 + 820 * 8,
    paymentTerms: "45 days",
    delivery: "8 days"
  }
};

function RFQMockup() {
  const suppliers = Object.keys(seedRfqQuotes);

  const findBest = (itemIndex: number) => {
    let best = "";
    let bestPrice = Infinity;
    for (const s of suppliers) {
      const price = seedRfqQuotes[s].itemPrices[itemIndex];
      if (price < bestPrice) {
        bestPrice = price;
        best = s;
      }
    }
    return best;
  };

  const bestTotal = suppliers.reduce(
    (acc, s) => (seedRfqQuotes[s].totalAmount < seedRfqQuotes[acc].totalAmount ? s : acc),
    suppliers[0]
  );

  return (
    <MockupShell
      title="RFQ Comparison — เทียบราคา supplier"
      detail="RFQ-2026-002 · ปูน + เหล็ก + ทราย + หิน · สำหรับ บ้านพักคุณเอ"
    >
      <div className="summary-grid hub-summary-grid hub-summary-grid--wide">
        <SummaryTile label="Suppliers invited" value={`${suppliers.length}`} />
        <SummaryTile label="Responses received" value={`${suppliers.length} / ${suppliers.length}`} strong />
        <SummaryTile label="Best total offer" value={shortMoney(seedRfqQuotes[bestTotal].totalAmount)} />
        <SummaryTile label="Saving vs avg" value="฿2,180" />
      </div>

      <div className="module-board" style={{ padding: 18, overflow: "auto" }}>
        <PageHeader title="Comparison Matrix" detail="⭐ = ราคาดีที่สุดในแต่ละแถว" />
        <div
          style={{
            border: "1px solid var(--line)",
            borderRadius: 8,
            overflow: "hidden",
            background: "#fff",
            marginTop: 10
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 13,
              minWidth: 640
            }}
          >
            <thead>
              <tr style={{ borderBottom: "1px solid var(--line)" }}>
                <th
                  style={{
                    textAlign: "left",
                    padding: "12px 14px",
                    background: "var(--panel-soft, #F4F4F2)",
                    fontFamily: "var(--mono)",
                    fontSize: 11,
                    letterSpacing: "0.06em",
                    color: "var(--ink-5)",
                    textTransform: "uppercase"
                  }}
                >
                  Item
                </th>
                <th
                  style={{
                    textAlign: "right",
                    padding: "12px 14px",
                    background: "var(--panel-soft, #F4F4F2)",
                    fontFamily: "var(--mono)",
                    fontSize: 11,
                    color: "var(--ink-5)"
                  }}
                >
                  Qty
                </th>
                {suppliers.map((s) => (
                  <th
                    key={s}
                    style={{
                      textAlign: "right",
                      padding: "12px 14px",
                      background:
                        s === bestTotal ? "var(--ink)" : "var(--panel-soft, #F4F4F2)",
                      color: s === bestTotal ? "#fff" : "var(--ink-5)",
                      fontFamily: "var(--mono)",
                      fontSize: 11,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      borderLeft: "1px solid var(--line)"
                    }}
                  >
                    {s}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {seedRfqItems.map((item, idx) => {
                const best = findBest(idx);
                return (
                  <tr key={idx} style={{ borderBottom: "1px solid var(--line)" }}>
                    <td style={{ padding: "10px 14px", fontWeight: 600 }}>
                      {item.item}
                      <div
                        style={{
                          fontFamily: "var(--mono)",
                          fontSize: 11,
                          color: "var(--ink-5)"
                        }}
                      >
                        {item.unit}
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "10px 14px",
                        fontFamily: "var(--mono)",
                        fontSize: 12,
                        textAlign: "right",
                        color: "var(--ink-4)"
                      }}
                    >
                      {item.qty}
                    </td>
                    {suppliers.map((s) => {
                      const price = seedRfqQuotes[s].itemPrices[idx];
                      const isBest = s === best;
                      return (
                        <td
                          key={s}
                          style={{
                            padding: "10px 14px",
                            fontFamily: "var(--mono)",
                            fontSize: 13,
                            textAlign: "right",
                            color: isBest ? "#2A6D45" : "var(--ink)",
                            fontWeight: isBest ? 700 : 500,
                            background: isBest ? "#E1F0E5" : "transparent",
                            borderLeft: "1px solid var(--line)"
                          }}
                        >
                          {moneyFmt.format(price)} {isBest && "⭐"}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              <tr style={{ borderTop: "2px solid var(--ink)", background: "var(--paper)" }}>
                <td style={{ padding: "12px 14px", fontWeight: 700 }} colSpan={2}>
                  รวม
                </td>
                {suppliers.map((s) => {
                  const isBest = s === bestTotal;
                  return (
                    <td
                      key={s}
                      style={{
                        padding: "12px 14px",
                        fontFamily: "var(--mono)",
                        fontSize: 14,
                        fontWeight: 700,
                        textAlign: "right",
                        color: isBest ? "#2A6D45" : "var(--ink)",
                        background: isBest ? "#E1F0E5" : "transparent",
                        borderLeft: "1px solid var(--line)"
                      }}
                    >
                      {moneyFmt.format(seedRfqQuotes[s].totalAmount)} {isBest && "⭐"}
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td
                  colSpan={2}
                  style={{
                    padding: "8px 14px",
                    fontSize: 11,
                    color: "var(--ink-5)",
                    fontFamily: "var(--mono)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em"
                  }}
                >
                  Payment terms
                </td>
                {suppliers.map((s) => (
                  <td
                    key={s}
                    style={{
                      padding: "8px 14px",
                      fontSize: 11,
                      textAlign: "right",
                      borderLeft: "1px solid var(--line)",
                      color: "var(--ink-4)"
                    }}
                  >
                    {seedRfqQuotes[s].paymentTerms}
                  </td>
                ))}
              </tr>
              <tr>
                <td
                  colSpan={2}
                  style={{
                    padding: "8px 14px",
                    fontSize: 11,
                    color: "var(--ink-5)",
                    fontFamily: "var(--mono)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em"
                  }}
                >
                  Delivery
                </td>
                {suppliers.map((s) => (
                  <td
                    key={s}
                    style={{
                      padding: "8px 14px",
                      fontSize: 11,
                      textAlign: "right",
                      borderLeft: "1px solid var(--line)",
                      color: "var(--ink-4)"
                    }}
                  >
                    {seedRfqQuotes[s].delivery}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        <div
          style={{
            marginTop: 14,
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            alignItems: "center"
          }}
        >
          <button className="primary-button" type="button">
            🏆 Award to {bestTotal} — {moneyFmt.format(seedRfqQuotes[bestTotal].totalAmount)}
          </button>
          <button className="secondary-button" type="button">
            ✏️ ปรับ quantity แล้ว recompare
          </button>
          <button className="secondary-button" type="button">
            ⤴️ Convert to PO (BuildDocs)
          </button>
        </div>

        <div
          style={{
            marginTop: 14,
            padding: 12,
            borderRadius: 6,
            background: "#E5EDF7",
            color: "#2A4F86",
            fontSize: 13
          }}
        >
          💡 <strong>AI superpower (Phase 2):</strong> ส่งรูป quotation จาก supplier ผ่าน LINE → auto-parse ราคา + เติมในตารางอัตโนมัติ ไม่ต้องคีย์
        </div>
      </div>
    </MockupShell>
  );
}

// ---------------------------------------------------------------------------
// 5. Project Control Dashboard mockup
// ---------------------------------------------------------------------------

type CostRow = {
  code: string;
  name: string;
  budget: number;
  committed: number;
  actual: number;
};

const seedProjectCosts: CostRow[] = [
  { code: "01", name: "Site Work", budget: 200_000, committed: 180_000, actual: 120_000 },
  { code: "02", name: "Structure", budget: 1_500_000, committed: 1_520_000, actual: 980_000 },
  { code: "03", name: "Architecture", budget: 800_000, committed: 600_000, actual: 200_000 },
  { code: "04", name: "MEP", budget: 1_000_000, committed: 800_000, actual: 450_000 },
  { code: "05", name: "Finishing", budget: 800_000, committed: 600_000, actual: 150_000 },
  { code: "06", name: "External", budget: 200_000, committed: 100_000, actual: 50_000 }
];

function ProjectControlMockup() {
  const total = seedProjectCosts.reduce(
    (acc, r) => ({
      budget: acc.budget + r.budget,
      committed: acc.committed + r.committed,
      actual: acc.actual + r.actual
    }),
    { budget: 0, committed: 0, actual: 0 }
  );
  const spentPct = Math.round((total.actual / total.budget) * 100);

  return (
    <MockupShell
      title="Project Control — บ้านพักคุณเอ - กรุงเทพ"
      detail="Budget vs Committed vs Actual ต่อ cost code · variance alert · real-time"
    >
      <div className="summary-grid hub-summary-grid hub-summary-grid--wide">
        <SummaryTile label="Total budget" value={shortMoney(total.budget)} />
        <SummaryTile label="Committed" value={shortMoney(total.committed)} />
        <SummaryTile
          label="Actual spent"
          value={`${shortMoney(total.actual)} (${spentPct}%)`}
          strong
        />
        <SummaryTile
          label="Remaining"
          value={shortMoney(total.budget - total.actual - (total.committed - total.actual))}
        />
      </div>

      <div className="module-board" style={{ padding: 18 }}>
        <PageHeader
          title="Cost breakdown ต่อ Cost Code"
          detail="Bar = committed · ⚠ = เกินงบ · กดดูรายการ underlying"
        />
        <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
          {seedProjectCosts.map((r) => {
            const overBudget = r.committed > r.budget;
            const committedPct = Math.min(100, (r.committed / r.budget) * 100);
            const actualPct = Math.min(100, (r.actual / r.budget) * 100);
            return (
              <div
                key={r.code}
                style={{
                  display: "grid",
                  gridTemplateColumns: "60px 1fr 180px",
                  gap: 14,
                  alignItems: "center",
                  padding: "12px 14px",
                  border: overBudget ? "1px solid #F2BCAE" : "1px solid var(--line)",
                  borderRadius: 8,
                  background: overBudget ? "#FFE6E1" : "var(--panel)"
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--mono)",
                    fontWeight: 700,
                    fontSize: 13,
                    color: "var(--ink-3)"
                  }}
                >
                  {r.code}
                </span>
                <div style={{ display: "grid", gap: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <strong style={{ fontSize: 14 }}>
                      {r.name} {overBudget && "⚠"}
                    </strong>
                    <span
                      style={{
                        fontFamily: "var(--mono)",
                        fontSize: 11,
                        color: overBudget ? "#B23E1F" : "var(--ink-5)"
                      }}
                    >
                      Budget {shortMoney(r.budget)} · Committed {shortMoney(r.committed)} · Actual {shortMoney(r.actual)}
                    </span>
                  </div>
                  <div
                    style={{
                      position: "relative",
                      height: 10,
                      borderRadius: 5,
                      background: "var(--bg-2, #EAEAE7)",
                      overflow: "hidden"
                    }}
                  >
                    {/* Committed track */}
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: `${committedPct}%`,
                        background: overBudget ? "#F2BCAE" : "var(--line-strong)"
                      }}
                    />
                    {/* Actual track */}
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: `${actualPct}%`,
                        background: overBudget ? "#B23E1F" : "var(--ink)"
                      }}
                    />
                  </div>
                </div>
                <span
                  style={{
                    textAlign: "right",
                    fontFamily: "var(--mono)",
                    fontSize: 12,
                    color: overBudget ? "#B23E1F" : "var(--ink-3)"
                  }}
                >
                  {overBudget ? (
                    <span>⚠ เกิน {shortMoney(r.committed - r.budget)}</span>
                  ) : (
                    <span>{Math.round((r.actual / r.budget) * 100)}% spent</span>
                  )}
                </span>
              </div>
            );
          })}
        </div>

        <div
          style={{
            marginTop: 18,
            padding: 12,
            borderRadius: 6,
            background: "#FFE6E1",
            color: "#B23E1F",
            fontSize: 13
          }}
        >
          ⚠ <strong>02 Structure</strong> committed เกินงบ ฿20,000 — เปิด PRs ของ code นี้เพื่อตรวจ / ปรับงบ
        </div>

        <div
          style={{
            marginTop: 8,
            padding: 12,
            borderRadius: 6,
            background: "#E5EDF7",
            color: "#2A4F86",
            fontSize: 13
          }}
        >
          💡 <strong>AI superpower (Phase 2):</strong> "ทำไม Structure เกินงบ?" → AI สรุปจาก PR + RFQ + actual + supplier change pattern → คำตอบเป็นข้อความ + ตัวเลข
        </div>
      </div>

      <div className="module-board" style={{ padding: 18 }}>
        <PageHeader title="Reports (MVP 5 ตัว)" detail="คลิกเพื่อ generate / export PDF/Excel" />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 10
          }}
        >
          {[
            { name: "Project P&L", detail: "รายรับ vs รายจ่าย ต่อโครงการ" },
            { name: "Cash flow forecast", detail: "90 วันถัดไป จาก confirmed + recurring" },
            { name: "Cost code variance", detail: "budget vs actual % แยกตาม code" },
            { name: "Supplier spend ranking", detail: "top 10 supplier โดย total spend" },
            { name: "PR aging", detail: "PR ที่ค้างเก่าสุด pending approval" }
          ].map((r) => (
            <div
              key={r.name}
              style={{
                padding: 14,
                border: "1px solid var(--line)",
                borderRadius: 8,
                background: "var(--panel)",
                cursor: "pointer"
              }}
            >
              <strong style={{ fontSize: 14 }}>{r.name}</strong>
              <p
                style={{
                  margin: "6px 0 10px",
                  color: "var(--ink-4)",
                  fontSize: 12
                }}
              >
                {r.detail}
              </p>
              <button
                className="cashflow-row-button"
                type="button"
                style={{ width: "100%", justifyContent: "center" }}
              >
                Generate →
              </button>
            </div>
          ))}
        </div>
      </div>
    </MockupShell>
  );
}

// ---------------------------------------------------------------------------
// Reusable mini components (mirror SummaryTile/PageHeader from App.tsx)
// ---------------------------------------------------------------------------

function SummaryTile({
  label,
  value,
  strong
}: {
  label: string;
  value: ReactNode;
  strong?: boolean;
}) {
  return (
    <div className={strong ? "summary-tile strong" : "summary-tile"}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function PageHeader({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="page-header">
      <div>
        <h2>{title}</h2>
        <p>{detail}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Index page + router
// ---------------------------------------------------------------------------

function MockupIndex({ onPick }: { onPick: (tab: MockupTab) => void }) {
  return (
    <section
      className="workspace-hub"
      aria-label="Builk-parity mockup gallery"
      style={{ maxWidth: 1280, margin: "0 auto" }}
    >
      <div className="module-hero">
        <div>
          <h1>Mockup Gallery — Builk-parity modules</h1>
          <p>
            ตัวอย่าง UI ของ 5 modules ใหม่ที่เสนอใน <code>docs/BUILK_PARITY_PLAN.md</code> · ใช้ Thai sample data, no persistence ·
            กดที่ card เพื่อดูแต่ละ module
          </p>
        </div>
        <div className="module-actions">
          <a
            className="secondary-button"
            href="/"
            onClick={(e) => {
              e.preventDefault();
              window.location.href = "/";
            }}
          >
            ← Public site
          </a>
          <a
            className="primary-button"
            href="/hub"
            onClick={(e) => {
              e.preventDefault();
              window.location.href = "/hub";
            }}
          >
            Open Workspace →
          </a>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 12
        }}
      >
        {tabs.map((t, i) => (
          <button
            key={t.id}
            onClick={() => onPick(t.id)}
            type="button"
            style={{
              padding: 22,
              border: "1px solid var(--line)",
              borderRadius: 10,
              background: "var(--panel)",
              cursor: "pointer",
              textAlign: "left",
              display: "grid",
              gap: 8
            }}
          >
            <span
              style={{
                fontFamily: "var(--mono)",
                fontSize: 11,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--ink-5)"
              }}
            >
              {i === 0
                ? "SPRINT 0 · LIST"
                : i === 1
                  ? "SPRINT 0 · DETAIL"
                  : `MODULE 0${i - 1}`}
            </span>
            <strong style={{ fontSize: 17 }}>{t.label}</strong>
            <span style={{ fontSize: 13, color: "var(--ink-3)", lineHeight: 1.5 }}>
              {t.detail}
            </span>
            <span
              style={{
                marginTop: 8,
                fontFamily: "var(--mono)",
                fontSize: 12,
                fontWeight: 700,
                color: "var(--ink)"
              }}
            >
              เปิดดู →
            </span>
          </button>
        ))}
      </div>

      <div className="module-board" style={{ padding: 18 }}>
        <PageHeader
          title="ใช้ mockup นี้ยังไง"
          detail="3 ผู้ใช้ + workflow ที่แนะนำ"
        />
        <ul style={{ lineHeight: 1.7, marginTop: 8 }}>
          <li>
            <strong>Owner (คุณ):</strong> ดูแต่ละ module → ตัดสิน Variant A/B/C ใน BUILK_PARITY_PLAN.md
          </li>
          <li>
            <strong>Alpha testers:</strong> แชร์ลิงก์ <code>/mockup</code> ให้ดู → ขอ feedback "อยากใช้มั้ย / pain ตรงนี้ตรงไหม"
          </li>
          <li>
            <strong>Codex (continue dev):</strong> ใช้ component structure ใน <code>src/MockupGallery.tsx</code> เป็น starting
            point สำหรับ implement จริง — extract sample data → seed file, hook ขึ้น storageAdapter, เพิ่ม CRUD
          </li>
        </ul>
      </div>
    </section>
  );
}

export default function MockupGallery() {
  const [tab, setTab] = useState<MockupTab | "index">("index");

  if (tab === "index") {
    return (
      <div style={{ padding: 24, background: "var(--paper)", minHeight: "100vh" }}>
        <MockupIndex onPick={setTab} />
      </div>
    );
  }

  return (
    <div style={{ padding: 24, background: "var(--paper)", minHeight: "100vh" }}>
      <nav
        style={{
          maxWidth: 1280,
          margin: "0 auto 18px",
          display: "flex",
          gap: 6,
          flexWrap: "wrap",
          alignItems: "center",
          padding: "10px 12px",
          background: "var(--panel)",
          border: "1px solid var(--line)",
          borderRadius: 999
        }}
      >
        <button
          onClick={() => setTab("index")}
          type="button"
          style={{
            padding: "6px 12px",
            border: "1px solid var(--line)",
            background: "var(--panel)",
            borderRadius: 999,
            cursor: "pointer",
            fontSize: 12,
            fontFamily: "var(--mono)"
          }}
        >
          ← Gallery
        </button>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            type="button"
            style={{
              padding: "6px 12px",
              border: tab === t.id ? "1px solid var(--ink)" : "1px solid transparent",
              background: tab === t.id ? "var(--ink)" : "transparent",
              color: tab === t.id ? "#fff" : "var(--ink-3)",
              borderRadius: 999,
              cursor: "pointer",
              fontSize: 12,
              fontFamily: "var(--mono)",
              letterSpacing: "0.04em"
            }}
          >
            {t.label}
          </button>
        ))}
        <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--ink-5)", fontFamily: "var(--mono)" }}>
          static mockup · no persistence
        </span>
      </nav>

      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        {tab === "project-list" && <ProjectListMockup />}
        {tab === "project-detail" && <ProjectDetailMockup />}
        {tab === "cost-codes" && <CostCodesMockup />}
        {tab === "suppliers" && <SuppliersMockup />}
        {tab === "procurement" && <PRMockup />}
        {tab === "rfq" && <RFQMockup />}
        {tab === "project-control" && <ProjectControlMockup />}
      </div>
    </div>
  );
}
