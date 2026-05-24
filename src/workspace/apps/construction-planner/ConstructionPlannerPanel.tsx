import { type CSSProperties, type ChangeEvent, useMemo, useState } from "react";
import {
  Database,
  FolderOpen,
  Home,
  LineChart,
  Link2,
  RefreshCw,
  Search,
  Upload
} from "lucide-react";

import type { WorkspaceAppId } from "../../../apps";
import type { WorkspaceLanguage } from "../../shell/workspaceLanguage";
import { SummaryTile } from "../../shared/SummaryTile";
import { constructionPlanningSeed } from "./constructionPlanningSeed";
import {
  formatBuddhistDate,
  loadConstructionPlanPreview,
  parseConstructionPlanWorkbook,
  removeConstructionPlanPreview,
  saveConstructionPlanPreview,
  summarizeConstructionPlan,
  type ConstructionBoqItem,
  type ConstructionImportCell,
  type ConstructionPlanPreview,
  type ConstructionTask,
  type ConstructionWorkbookSheet
} from "./constructionPlannerService";
import {
  syncConstructionPlannerToWorkspace,
  type ConstructionPlannerWorkspaceSyncResult
} from "./constructionPlannerIntegration";

type ConstructionPlannerPanelProps = {
  activeTab: string;
  language: WorkspaceLanguage;
  onSelectApp: (id: WorkspaceAppId) => void;
  onSelectAppTab: (id: WorkspaceAppId, tabKey: string) => void;
};

type ConstructionPlannerTab = "overview" | "schedule" | "boq" | "curve";

const money = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 0
});

const compactMoney = new Intl.NumberFormat("th-TH", {
  notation: "compact",
  maximumFractionDigits: 1
});

const numberFormat = new Intl.NumberFormat("th-TH", {
  maximumFractionDigits: 2
});

const constructionPlannerCopy: Record<
  WorkspaceLanguage,
  {
    backToHub: string;
    boqAmount: string;
    boqDetail: string;
    boqEmpty: string;
    boqTitle: string;
    colAmount: string;
    colCode: string;
    colDate: string;
    colDuration: string;
    colEnd: string;
    colFormula: string;
    colLabor: string;
    colMaterial: string;
    colName: string;
    colPlanned: string;
    colQty: string;
    colStart: string;
    colTotal: string;
    colUnit: string;
    contractNo: string;
    curveDetail: string;
    curveTitle: string;
    duration: string;
    formulaHint: string;
    heroDetail: string;
    heroTitle: string;
    importAction: string;
    importFailed: string;
    importReady: string;
    importSuccess: string;
    integrationDetail?: string;
    integrationReady?: string;
    integrationTitle?: string;
    lastImported: string;
    location: string;
    openBoqData?: string;
    openProjectControl?: string;
    openProjects?: string;
    overviewDetail: string;
    overviewTitle: string;
    phaseBreakdown: string;
    plannedCurve: string;
    projectAmount: string;
    projectDuration: string;
    resetSeed: string;
    scheduleDetail: string;
    scheduleEmpty: string;
    scheduleTitle: string;
    searchPlaceholder: string;
    seedSource: string;
    source: string;
    syncAction?: string;
    syncBoqLabel?: string;
    syncFailed?: string;
    syncLinkLabel?: string;
    syncProjectLabel?: string;
    syncSuccess?: string;
    syncTaskLabel?: string;
    taskCount: string;
    timeline: string;
    week: string;
  }
> = {
  th: {
    backToHub: "กลับ Hub",
    boqAmount: "ยอด BOQ",
    boqDetail: "ตาราง BOQ อ่านอย่างเดียว แยกค่าวัสดุ ค่าแรง และสูตรต้นทาง",
    boqEmpty: "ไม่พบรายการ BOQ ตามคำค้นหา",
    boqTitle: "BOQ Preview",
    colAmount: "มูลค่า",
    colCode: "รหัส",
    colDate: "วันที่",
    colDuration: "วัน",
    colEnd: "สิ้นสุด",
    colFormula: "สูตร",
    colLabor: "ค่าแรง",
    colMaterial: "วัสดุ",
    colName: "รายการ",
    colPlanned: "Planned",
    colQty: "ปริมาณ",
    colStart: "เริ่ม",
    colTotal: "รวม",
    colUnit: "หน่วย",
    contractNo: "เลขที่สัญญา",
    curveDetail: "คำนวณ cumulative planned value จากช่วงวันที่และมูลค่างาน ไม่อ่าน chart object จาก Excel",
    curveTitle: "Planned Curve",
    duration: "ระยะเวลา",
    formulaHint: "เก็บสูตรไว้เป็น reference แต่ v0.1 ยังไม่แก้สูตร/คำนวณกลับ Excel",
    heroDetail:
      "Preview แผนงานก่อสร้างจาก Construction Planning Spreadsheet.xlsx พร้อม Gantt, BOQ และ planned curve แบบ local-first",
    heroTitle: "Construction Planner Preview",
    importAction: "Import XLSX",
    importFailed: "นำเข้าไฟล์ไม่สำเร็จ",
    importReady: "ใช้ seed จาก workbook ใน Downloads และสามารถ import format เดียวกันเพื่อ preview ทับได้",
    importSuccess: "นำเข้า workbook แล้ว",
    integrationDetail: "ส่ง preview นี้เข้า Projects, BOQ Data task linkage, BOQ catalog และให้ Project Control อ่าน budget baseline ได้",
    integrationReady: "พร้อม sync แบบ local-first โดยไม่แก้ไฟล์ Excel ต้นทาง",
    integrationTitle: "เชื่อมข้อมูลกับ Workspace",
    lastImported: "อัปเดต",
    location: "สถานที่",
    openBoqData: "เปิด BOQ Data",
    openProjectControl: "เปิด Project Control",
    openProjects: "เปิด Projects",
    overviewDetail: "ข้อมูลโครงการ ระยะเวลา และมูลค่าที่ extract จาก workbook",
    overviewTitle: "Project Overview",
    phaseBreakdown: "Phase Breakdown",
    plannedCurve: "Planned curve",
    projectAmount: "มูลค่าโครงการ",
    projectDuration: "ระยะเวลาโครงการ",
    resetSeed: "คืนค่า seed",
    scheduleDetail: "ตารางงาน rows 7-63 พร้อม Gantt bar แบบ responsive",
    scheduleEmpty: "ไม่พบรายการงานตามคำค้นหา",
    scheduleTitle: "Schedule / Gantt",
    searchPlaceholder: "ค้นหารหัส รายการ หรือสูตร",
    seedSource: "Built-in seed",
    source: "แหล่งข้อมูล",
    syncAction: "Sync to Workspace",
    syncBoqLabel: "BOQ rows",
    syncFailed: "Sync ไม่สำเร็จ",
    syncLinkLabel: "BOQ links",
    syncProjectLabel: "project",
    syncSuccess: "Sync สำเร็จ",
    syncTaskLabel: "tasks",
    taskCount: "รายการงาน",
    timeline: "Timeline",
    week: "สัปดาห์"
  },
  en: {
    backToHub: "Back to Hub",
    boqAmount: "BOQ amount",
    boqDetail: "Read-only BOQ table with material, labor, total, and source formulas.",
    boqEmpty: "No BOQ rows match the search.",
    boqTitle: "BOQ Preview",
    colAmount: "Amount",
    colCode: "Code",
    colDate: "Date",
    colDuration: "Days",
    colEnd: "End",
    colFormula: "Formula",
    colLabor: "Labor",
    colMaterial: "Material",
    colName: "Item",
    colPlanned: "Planned",
    colQty: "Qty",
    colStart: "Start",
    colTotal: "Total",
    colUnit: "Unit",
    contractNo: "Contract no.",
    curveDetail: "Derived cumulative planned value from task dates and amounts, not the embedded Excel chart object.",
    curveTitle: "Planned Curve",
    duration: "Duration",
    formulaHint: "Formulas are retained as references. V0.1 does not edit formulas or export back to Excel.",
    heroDetail:
      "Preview the Construction Planning Spreadsheet.xlsx workbook with Gantt, BOQ, and planned curve in local-first mode.",
    heroTitle: "Construction Planner Preview",
    importAction: "Import XLSX",
    importFailed: "Workbook import failed",
    importReady: "Using the built-in seed from Downloads. Import the same workbook format to preview over it.",
    importSuccess: "Workbook imported",
    integrationDetail: "Send this preview into Projects, BOQ Data task linkage, the BOQ catalog, and the Project Control budget baseline.",
    integrationReady: "Ready to sync locally without modifying the source Excel file.",
    integrationTitle: "Workspace integration",
    lastImported: "Updated",
    location: "Location",
    openBoqData: "Open BOQ Data",
    openProjectControl: "Open Project Control",
    openProjects: "Open Projects",
    overviewDetail: "Project facts, duration, and amount extracted from the workbook.",
    overviewTitle: "Project Overview",
    phaseBreakdown: "Phase Breakdown",
    plannedCurve: "Planned curve",
    projectAmount: "Project amount",
    projectDuration: "Project duration",
    resetSeed: "Reset seed",
    scheduleDetail: "Rows 7-63 as a read-only schedule table with responsive Gantt bars.",
    scheduleEmpty: "No tasks match the search.",
    scheduleTitle: "Schedule / Gantt",
    searchPlaceholder: "Search code, item, or formula",
    seedSource: "Built-in seed",
    source: "Source",
    syncAction: "Sync to Workspace",
    syncBoqLabel: "BOQ rows",
    syncFailed: "Sync failed",
    syncLinkLabel: "BOQ links",
    syncProjectLabel: "project",
    syncSuccess: "Sync complete",
    syncTaskLabel: "tasks",
    taskCount: "Tasks",
    timeline: "Timeline",
    week: "Week"
  }
};

const constructionPlannerIntegrationDefaults = {
  th: {
    integrationDetail: "ส่ง preview นี้เข้า Projects, BOQ Data task linkage, BOQ catalog และให้ Project Control อ่าน budget baseline ได้",
    integrationReady: "พร้อม sync แบบ local-first โดยไม่แก้ไฟล์ Excel ต้นทาง",
    integrationTitle: "เชื่อมข้อมูลกับ Workspace",
    openBoqData: "เปิด BOQ Data",
    openProjectControl: "เปิด Project Control",
    openProjects: "เปิด Projects",
    syncAction: "Sync to Workspace",
    syncBoqLabel: "BOQ rows",
    syncFailed: "Sync ไม่สำเร็จ",
    syncLinkLabel: "BOQ links",
    syncProjectLabel: "project",
    syncSuccess: "Sync สำเร็จ",
    syncTaskLabel: "Tasks"
  },
  en: {
    integrationDetail: "Send this preview into Projects, BOQ Data task linkage, the BOQ catalog, and the Project Control budget baseline.",
    integrationReady: "Ready to sync locally without modifying the source Excel file.",
    integrationTitle: "Workspace integration",
    openBoqData: "Open BOQ Data",
    openProjectControl: "Open Project Control",
    openProjects: "Open Projects",
    syncAction: "Sync to Workspace",
    syncBoqLabel: "BOQ rows",
    syncFailed: "Sync failed",
    syncLinkLabel: "BOQ links",
    syncProjectLabel: "project",
    syncSuccess: "Sync complete",
    syncTaskLabel: "Tasks"
  }
} satisfies Record<
  WorkspaceLanguage,
  Record<
    | "integrationDetail"
    | "integrationReady"
    | "integrationTitle"
    | "openBoqData"
    | "openProjectControl"
    | "openProjects"
    | "syncAction"
    | "syncBoqLabel"
    | "syncFailed"
    | "syncLinkLabel"
    | "syncProjectLabel"
    | "syncSuccess"
    | "syncTaskLabel",
    string
  >
>;

function getConstructionPlannerCopy(language: WorkspaceLanguage) {
  return {
    ...constructionPlannerCopy[language],
    ...constructionPlannerIntegrationDefaults[language]
  };
}

function normalizePlannerTab(value: string): ConstructionPlannerTab {
  return value === "schedule" || value === "boq" || value === "curve" ? value : "overview";
}

function isoTime(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function dayDiff(startDate: string, endDate: string) {
  return Math.round((isoTime(endDate) - isoTime(startDate)) / 86_400_000);
}

function addIsoDays(startDate: string, days: number) {
  const date = new Date(isoTime(startDate) + days * 86_400_000);
  return [
    date.getUTCFullYear().toString().padStart(4, "0"),
    (date.getUTCMonth() + 1).toString().padStart(2, "0"),
    date.getUTCDate().toString().padStart(2, "0")
  ].join("-");
}

function amountText(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "-";
  }

  return money.format(value);
}

function lowerSearchText(...values: Array<string | number | null | undefined>) {
  return values.map((value) => String(value ?? "")).join(" ").toLocaleLowerCase("th-TH");
}

async function readWorkbookSheets(file: File): Promise<ConstructionWorkbookSheet[]> {
  const XLSX = await import("@e965/xlsx");
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });

  return workbook.SheetNames.map((sheet) => {
    const worksheet = workbook.Sheets[sheet];
    const formulas: Record<string, string> = {};

    Object.entries(worksheet as Record<string, { f?: string } | undefined>).forEach(([address, cell]) => {
      if (!address.startsWith("!") && cell?.f) {
        formulas[address] = cell.f;
      }
    });

    return {
      sheet,
      data: XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        raw: true,
        defval: "",
        range: 0
      }) as ConstructionImportCell[][],
      formulas
    };
  });
}

export function ConstructionPlannerPanel({
  activeTab,
  language,
  onSelectApp,
  onSelectAppTab
}: ConstructionPlannerPanelProps) {
  const copy = getConstructionPlannerCopy(language);
  const tab = normalizePlannerTab(activeTab);
  const [preview, setPreview] = useState<ConstructionPlanPreview>(
    () => loadConstructionPlanPreview() ?? constructionPlanningSeed
  );
  const [query, setQuery] = useState("");
  const [importStatus, setImportStatus] = useState(copy.importReady);
  const [syncStatus, setSyncStatus] = useState(copy.integrationReady);
  const [syncResult, setSyncResult] = useState<ConstructionPlannerWorkspaceSyncResult | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const summary = useMemo(() => summarizeConstructionPlan(preview), [preview]);
  const phases = useMemo(() => preview.tasks.filter((task) => task.level === 1), [preview.tasks]);
  const queryText = query.trim().toLocaleLowerCase("th-TH");
  const filteredTasks = useMemo(
    () =>
      queryText
        ? preview.tasks.filter((task) =>
            lowerSearchText(task.code, task.name, task.amountFormula).includes(queryText)
          )
        : preview.tasks,
    [preview.tasks, queryText]
  );
  const filteredBoqItems = useMemo(
    () =>
      queryText
        ? preview.boqItems.filter((item) =>
            lowerSearchText(item.code, item.name, item.unit, item.totalFormula).includes(queryText)
          )
        : preview.boqItems,
    [preview.boqItems, queryText]
  );
  const timelineDays = Math.max(dayDiff(preview.project.startDate, preview.project.endDate) + 1, 1);
  const sourceLabel =
    preview.sourceLabel === constructionPlanningSeed.sourceLabel ? copy.seedSource : preview.sourceLabel;

  const importWorkbook = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const sheets = await readWorkbookSheets(file);
      const nextPreview = parseConstructionPlanWorkbook(sheets, file.name);
      saveConstructionPlanPreview(nextPreview);
      setPreview(nextPreview);
      setImportStatus(
        `${copy.importSuccess}: ${nextPreview.tasks.length} tasks / ${nextPreview.boqItems.length} BOQ rows`
      );
      setSyncResult(null);
      setSyncStatus(copy.integrationReady);
    } catch (error) {
      setImportStatus(
        `${copy.importFailed}: ${error instanceof Error ? error.message : "check workbook format"}`
      );
    } finally {
      event.target.value = "";
    }
  };

  const resetSeed = () => {
    removeConstructionPlanPreview();
    setPreview(constructionPlanningSeed);
    setImportStatus(copy.importReady);
    setSyncResult(null);
    setSyncStatus(copy.integrationReady);
  };

  const syncWorkspaceData = () => {
    setIsSyncing(true);
    try {
      const result = syncConstructionPlannerToWorkspace(preview);
      setSyncResult(result);
      setSyncStatus(
        `${copy.syncSuccess}: ${result.project.name} · ${result.taskCount} ${copy.syncTaskLabel} · ${result.boqCatalogCount} ${copy.syncBoqLabel} · ${result.linkedBoqItemsCount} ${copy.syncLinkLabel}`
      );
    } catch (error) {
      setSyncStatus(
        `${copy.syncFailed}: ${error instanceof Error ? error.message : "check workspace storage"}`
      );
    } finally {
      setIsSyncing(false);
    }
  };

  const getTaskOffset = (task: ConstructionTask) => {
    const offset = Math.max(dayDiff(preview.project.startDate, task.startDate), 0);
    return Math.min((offset / timelineDays) * 100, 100);
  };

  const getTaskWidth = (task: ConstructionTask) => {
    const taskDays = Math.max(dayDiff(task.startDate, task.endDate) + 1, 1);
    return Math.max((taskDays / timelineDays) * 100, 2);
  };

  return (
    <section className="workspace-hub construction-planner" aria-label={copy.heroTitle}>
      <div className="module-hero construction-planner-hero">
        <div>
          <h1>{copy.heroTitle}</h1>
          <p>{copy.heroDetail}</p>
          <div className="construction-meta-row" aria-label={copy.source}>
            <span>{sourceLabel}</span>
            <span>{copy.lastImported}: {formatBuddhistDate(preview.importedAt.slice(0, 10))}</span>
          </div>
        </div>
        <div className="module-actions">
          <label className="secondary-button construction-import-button">
            <Upload size={18} aria-hidden="true" />
            {copy.importAction}
            <input
              accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              onChange={importWorkbook}
              type="file"
            />
          </label>
          <button className="secondary-button" onClick={resetSeed} type="button">
            <RefreshCw size={18} aria-hidden="true" />
            {copy.resetSeed}
          </button>
          <button className="secondary-button" onClick={() => onSelectApp("hub")} type="button">
            <Home size={18} aria-hidden="true" />
            {copy.backToHub}
          </button>
        </div>
      </div>

      <div className="summary-grid construction-summary-grid">
        <SummaryTile label={copy.projectAmount} value={money.format(preview.project.totalAmount)} strong />
        <SummaryTile label={copy.projectDuration} value={`${preview.project.durationDays} ${copy.colDuration}`} />
        <SummaryTile label={copy.taskCount} value={`${summary.taskCount} / ${summary.leafTaskCount}`} />
        <SummaryTile label={copy.boqAmount} value={`${summary.boqCount} rows`} />
      </div>

      <ConstructionPlannerIntegrationStrip
        copy={copy}
        isSyncing={isSyncing}
        onOpenBoqData={() => onSelectAppTab("boqData", "task-linkage")}
        onOpenProjectControl={() => onSelectAppTab("projectControl", "dashboard")}
        onOpenProjects={() => onSelectAppTab("projects", "list")}
        onSync={syncWorkspaceData}
        result={syncResult}
        status={syncStatus}
      />

      {tab === "overview" && (
        <OverviewTab
          copy={copy}
          phases={phases}
          preview={preview}
          summary={summary}
          importStatus={importStatus}
        />
      )}
      {tab === "schedule" && (
        <ScheduleTab
          copy={copy}
          filteredTasks={filteredTasks}
          getTaskOffset={getTaskOffset}
          getTaskWidth={getTaskWidth}
          preview={preview}
          query={query}
          setQuery={setQuery}
        />
      )}
      {tab === "boq" && (
        <BoqTab
          copy={copy}
          filteredBoqItems={filteredBoqItems}
          query={query}
          setQuery={setQuery}
          summary={summary}
        />
      )}
      {tab === "curve" && <CurveTab copy={copy} preview={preview} />}
    </section>
  );
}

type Copy = ReturnType<typeof getConstructionPlannerCopy>;

function ConstructionPlannerIntegrationStrip({
  copy,
  isSyncing,
  onOpenBoqData,
  onOpenProjectControl,
  onOpenProjects,
  onSync,
  result,
  status
}: {
  copy: Copy;
  isSyncing: boolean;
  onOpenBoqData: () => void;
  onOpenProjectControl: () => void;
  onOpenProjects: () => void;
  onSync: () => void;
  result: ConstructionPlannerWorkspaceSyncResult | null;
  status: string;
}) {
  return (
    <div className="construction-integration-strip">
      <div className="construction-integration-main">
        <span className="status-pill">
          <Link2 size={14} aria-hidden="true" />
          {copy.integrationTitle}
        </span>
        <div>
          <h2>{copy.integrationTitle}</h2>
          <p>{copy.integrationDetail}</p>
        </div>
        <small>{status}</small>
      </div>
      <div className="construction-integration-metrics" aria-label={copy.integrationTitle}>
        <span>
          <strong>{result ? 1 : "-"}</strong>
          {copy.syncProjectLabel}
        </span>
        <span>
          <strong>{result?.taskCount ?? "-"}</strong>
          {copy.syncTaskLabel}
        </span>
        <span>
          <strong>{result?.boqCatalogCount ?? "-"}</strong>
          {copy.syncBoqLabel}
        </span>
        <span>
          <strong>{result?.linkedBoqItemsCount ?? "-"}</strong>
          {copy.syncLinkLabel}
        </span>
      </div>
      <div className="construction-integration-actions">
        <button className="primary-button" disabled={isSyncing} onClick={onSync} type="button">
          <Database size={18} aria-hidden="true" />
          {copy.syncAction}
        </button>
        <button className="secondary-button" onClick={onOpenProjects} type="button">
          <FolderOpen size={18} aria-hidden="true" />
          {copy.openProjects}
        </button>
        <button className="secondary-button" onClick={onOpenBoqData} type="button">
          <Database size={18} aria-hidden="true" />
          {copy.openBoqData}
        </button>
        <button className="secondary-button" onClick={onOpenProjectControl} type="button">
          <LineChart size={18} aria-hidden="true" />
          {copy.openProjectControl}
        </button>
      </div>
    </div>
  );
}

const sheetMonthLabels = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec"
];

function formatSheetDate(isoDate: string) {
  const [, month, day] = isoDate.split("-").map(Number);
  return `${day}-${sheetMonthLabels[month - 1] ?? ""}`;
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(value, 100));
}

function getTimelinePercent(project: ConstructionPlanPreview["project"], isoDate: string) {
  const totalDays = Math.max(dayDiff(project.startDate, project.endDate) + 1, 1);
  return clampPercent((dayDiff(project.startDate, isoDate) / totalDays) * 100);
}

function buildSheetTicks(preview: ConstructionPlanPreview) {
  const totalDays = Math.max(dayDiff(preview.project.startDate, preview.project.endDate) + 1, 1);
  const targetTicks = 10;
  const step = Math.max(Math.floor(totalDays / (targetTicks - 1)), 1);
  const ticks = Array.from({ length: targetTicks }, (_, index) => {
    const dayOffset = index === targetTicks - 1 ? totalDays - 1 : Math.min(index * step, totalDays - 1);
    const date = addIsoDays(preview.project.startDate, dayOffset);
    return {
      date,
      label: formatSheetDate(date),
      left: clampPercent((dayOffset / totalDays) * 100)
    };
  });

  return ticks;
}

function buildSheetDependencyPath(tasks: ConstructionTask[], preview: ConstructionPlanPreview) {
  const points = tasks
    .map((task, index) => ({
      x: getTimelinePercent(preview.project, task.endDate),
      y: index + 0.5,
      task
    }))
    .filter((point) => point.task.level === 2 || point.task.level === 1);

  if (points.length < 2) {
    return "";
  }

  return points
    .map((point, index) => {
      if (index === 0) {
        return `M ${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
      }

      const previous = points[index - 1];
      return `H ${point.x.toFixed(2)} V ${point.y.toFixed(2)}`;
    })
    .join(" ");
}

function buildSheetCurvePath(preview: ConstructionPlanPreview, rowCount: number) {
  if (preview.curve.length < 2) {
    return "";
  }

  return preview.curve
    .map((point, index) => {
      const x = getTimelinePercent(preview.project, point.date);
      const y = Math.max(0.3, rowCount - (clampPercent(point.plannedPercent) / 100) * rowCount);
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function OverviewTab({
  copy,
  phases,
  preview,
  summary,
  importStatus
}: {
  copy: Copy;
  phases: ConstructionTask[];
  preview: ConstructionPlanPreview;
  summary: ReturnType<typeof summarizeConstructionPlan>;
  importStatus: string;
}) {
  return (
    <div className="module-board construction-sheet-board">
      <div className="page-header">
        <div>
          <h2>{copy.overviewTitle}</h2>
          <p>{copy.overviewDetail}</p>
        </div>
      </div>
      <WorkbookSheetPreview
        copy={copy}
        importStatus={importStatus}
        phases={phases}
        preview={preview}
        summary={summary}
      />
    </div>
  );
}

function WorkbookSheetPreview({
  copy,
  phases,
  preview,
  summary,
  importStatus
}: {
  copy: Copy;
  phases: ConstructionTask[];
  preview: ConstructionPlanPreview;
  summary: ReturnType<typeof summarizeConstructionPlan>;
  importStatus: string;
}) {
  const ticks = buildSheetTicks(preview);
  const rowCount = Math.max(preview.tasks.length, 1);
  const dependencyPath = buildSheetDependencyPath(preview.tasks, preview);
  const curvePath = buildSheetCurvePath(preview, rowCount);
  const progressPoint = preview.curve[Math.floor(preview.curve.length * 0.55)] ?? preview.curve[0];
  const progressLeft = progressPoint ? getTimelinePercent(preview.project, progressPoint.date) : 0;
  const sheetStyle = { "--sheet-row-count": rowCount } as CSSProperties;

  return (
    <div className="construction-sheet-scroll" role="region" aria-label="Construction plan sheet preview">
      <div className="construction-sheet-page">
        <div className="construction-sheet-header">
          <div className="construction-sheet-meta">
            <span>
              <strong>{copy.colName}:</strong> {preview.project.projectName || preview.project.title}
            </span>
            <span>
              <strong>{copy.location}:</strong> {preview.project.location || "-"}
            </span>
          </div>
          <div className="construction-sheet-title">
            <h2>{preview.project.title || copy.heroTitle}</h2>
            <p>CONSTRUCTION GANTT-CHART</p>
          </div>
          <div className="construction-sheet-meta right">
            <span>
              <strong>{copy.contractNo}:</strong> {preview.project.contractNo || "-"}
            </span>
            <span>
              <strong>{copy.duration}:</strong> {preview.project.durationDays} {copy.colDuration}
            </span>
          </div>
        </div>

        <div className="construction-sheet-toolbar">
          <span>{copy.source}: {preview.sourceLabel}</span>
          <span>{copy.projectAmount}: {amountText(preview.project.totalAmount)}</span>
          <span>{copy.taskCount}: {summary.taskCount}</span>
          <span>{copy.phaseBreakdown}: {phases.length}</span>
          <span>{importStatus}</span>
        </div>

        <div className="construction-sheet-main" style={sheetStyle}>
          <div className="construction-sheet-table-grid">
            <div className="construction-sheet-table-head">
              <span>ลำดับ</span>
              <span>รายการแผนงานก่อสร้าง</span>
              <span>วันที่เริ่ม</span>
              <span>วันที่เสร็จ</span>
              <span>เวลา</span>
              <span>งบประมาณ</span>
            </div>
            <div className="construction-sheet-table-rows">
              {preview.tasks.map((task) => (
                <div className={`construction-sheet-task-row level-${task.level}`} key={`${task.row}-${task.code}`}>
                  <span>{task.sequence}</span>
                  <strong>{task.code ? `${task.code} ` : ""}{task.name}</strong>
                  <span>{formatSheetDate(task.startDate)}</span>
                  <span>{formatSheetDate(task.endDate)}</span>
                  <span>{task.durationDays}</span>
                  <span>{numberFormat.format(task.amount)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="construction-sheet-chart-grid">
            <div className="construction-sheet-chart-head">
              {ticks.map((tick) => (
                <span key={tick.date} style={{ left: `${tick.left}%` }}>
                  {tick.label}
                </span>
              ))}
            </div>
            <div className="construction-sheet-chart-plot">
              <div className="construction-sheet-grid-lines">
                {ticks.map((tick) => (
                  <span key={tick.date} style={{ left: `${tick.left}%` }} />
                ))}
              </div>
              <div className="construction-sheet-row-lines">
                {preview.tasks.map((task) => (
                  <span key={`${task.row}-line`} />
                ))}
              </div>
              {preview.tasks.map((task, index) => {
                const left = getTimelinePercent(preview.project, task.startDate);
                const width = Math.max(
                  getTimelinePercent(preview.project, task.endDate) - left,
                  task.level === 2 ? 0.8 : 1.8
                );

                return (
                  <span
                    className={`construction-sheet-bar level-${task.level}`}
                    key={`${task.row}-bar`}
                    style={{
                      left: `${left}%`,
                      top: `calc(${index} * var(--sheet-row-height) + ${task.level === 2 ? 8 : 5}px)`,
                      width: `${width}%`
                    }}
                  />
                );
              })}
              {progressPoint && (
                <span
                  className="construction-sheet-progress-line"
                  style={{ left: `${progressLeft}%` }}
                  title={formatBuddhistDate(progressPoint.date)}
                />
              )}
              <svg
                className="construction-sheet-overlay"
                preserveAspectRatio="none"
                viewBox={`0 0 100 ${rowCount}`}
                aria-hidden="true"
              >
                {dependencyPath && <path className="construction-sheet-link-path" d={dependencyPath} />}
                {curvePath && <path className="construction-sheet-curve-path" d={curvePath} />}
              </svg>
              <div className="construction-sheet-callout">
                <strong>{copy.plannedCurve}</strong>
                <span>{amountText(preview.project.totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="construction-sheet-bottom">
          <div className="construction-sheet-signatures">
            <div>
              <span>ผู้จัดทำ</span>
              <strong>................................</strong>
            </div>
            <div>
              <span>ผู้ตรวจสอบ</span>
              <strong>................................</strong>
            </div>
            <div>
              <span>ผู้อนุมัติ</span>
              <strong>................................</strong>
            </div>
          </div>
          <div className="construction-sheet-week-wrap">
            <table className="construction-sheet-week-table">
              <thead>
                <tr>
                  <th>{copy.plannedCurve}</th>
                  {preview.curve.map((point) => (
                    <th key={`${point.week}-head`}>{copy.week} {point.week}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th>{copy.colDate}</th>
                  {preview.curve.map((point) => (
                    <td key={`${point.week}-date`}>{formatSheetDate(point.date)}</td>
                  ))}
                </tr>
                <tr>
                  <th>%</th>
                  {preview.curve.map((point) => (
                    <td key={`${point.week}-percent`}>{numberFormat.format(point.plannedPercent)}%</td>
                  ))}
                </tr>
                <tr>
                  <th>{copy.colAmount}</th>
                  {preview.curve.map((point) => (
                    <td key={`${point.week}-amount`}>{compactMoney.format(point.plannedAmount)}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="construction-sheet-side-summary">
        <div className="page-header">
          <div>
            <h2>{copy.phaseBreakdown}</h2>
            <p>{copy.formulaHint}</p>
          </div>
        </div>
        <div className="construction-phase-list">
          {phases.map((phase) => (
            <div className="construction-phase-row" key={`${phase.row}-${phase.code}`}>
              <span>{phase.code}</span>
              <strong>{phase.name}</strong>
              <em>{compactMoney.format(phase.amount)} THB</em>
              <small>
                {formatBuddhistDate(phase.startDate)} - {formatBuddhistDate(phase.endDate)}
              </small>
            </div>
          ))}
        </div>
        <div className="construction-total-strip">
          <span>{copy.colMaterial}: {amountText(summary.materialTotal)}</span>
          <span>{copy.colLabor}: {amountText(summary.laborTotal)}</span>
          <span>{copy.colTotal}: {amountText(summary.boqTotal)}</span>
        </div>
      </div>
    </div>
  );
}

function ScheduleTab({
  copy,
  filteredTasks,
  getTaskOffset,
  getTaskWidth,
  preview,
  query,
  setQuery
}: {
  copy: Copy;
  filteredTasks: ConstructionTask[];
  getTaskOffset: (task: ConstructionTask) => number;
  getTaskWidth: (task: ConstructionTask) => number;
  preview: ConstructionPlanPreview;
  query: string;
  setQuery: (query: string) => void;
}) {
  return (
    <div className="module-board">
      <div className="construction-toolbar">
        <div className="page-header">
          <div>
            <h2>{copy.scheduleTitle}</h2>
            <p>{copy.scheduleDetail}</p>
          </div>
        </div>
        <label className="construction-search">
          <Search size={16} aria-hidden="true" />
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder={copy.searchPlaceholder}
            value={query}
          />
        </label>
      </div>
      <div className="construction-gantt-window" role="region" aria-label={copy.scheduleTitle}>
        <div className="construction-gantt-scale">
          <span>{formatBuddhistDate(preview.project.startDate)}</span>
          <span>{copy.timeline}</span>
          <span>{formatBuddhistDate(preview.project.endDate)}</span>
        </div>
        {filteredTasks.length === 0 ? (
          <div className="empty-state">{copy.scheduleEmpty}</div>
        ) : (
          <div className="construction-gantt">
            {filteredTasks.map((task) => (
              <div className={`construction-gantt-row level-${task.level}`} key={`${task.row}-${task.code}`}>
                <div className="construction-gantt-label">
                  <span>{task.code || `row ${task.row}`}</span>
                  <strong>{task.name}</strong>
                  <small>
                    {formatBuddhistDate(task.startDate)} - {formatBuddhistDate(task.endDate)} · {task.durationDays} {copy.colDuration}
                  </small>
                </div>
                <div className="construction-gantt-track" aria-label={`${task.name} ${task.durationDays} days`}>
                  <span
                    className="construction-gantt-bar"
                    style={{
                      left: `${getTaskOffset(task)}%`,
                      width: `${getTaskWidth(task)}%`
                    }}
                  />
                </div>
                <div className="construction-gantt-meta">
                  <strong>{amountText(task.amount)}</strong>
                  <small>{task.amountFormula || "-"}</small>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BoqTab({
  copy,
  filteredBoqItems,
  query,
  setQuery,
  summary
}: {
  copy: Copy;
  filteredBoqItems: ConstructionBoqItem[];
  query: string;
  setQuery: (query: string) => void;
  summary: ReturnType<typeof summarizeConstructionPlan>;
}) {
  return (
    <div className="module-board">
      <div className="construction-toolbar">
        <div className="page-header">
          <div>
            <h2>{copy.boqTitle}</h2>
            <p>{copy.boqDetail}</p>
          </div>
        </div>
        <label className="construction-search">
          <Search size={16} aria-hidden="true" />
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder={copy.searchPlaceholder}
            value={query}
          />
        </label>
      </div>
      <div className="construction-total-strip">
        <span>{copy.colMaterial}: {amountText(summary.materialTotal)}</span>
        <span>{copy.colLabor}: {amountText(summary.laborTotal)}</span>
        <span>{copy.colTotal}: {amountText(summary.boqTotal)}</span>
      </div>
      {filteredBoqItems.length === 0 ? (
        <div className="empty-state">{copy.boqEmpty}</div>
      ) : (
        <div className="construction-table-wrap">
          <table className="construction-table">
            <thead>
              <tr>
                <th>{copy.colCode}</th>
                <th>{copy.colName}</th>
                <th>{copy.colUnit}</th>
                <th>{copy.colQty}</th>
                <th>{copy.colMaterial}</th>
                <th>{copy.colLabor}</th>
                <th>{copy.colTotal}</th>
                <th>{copy.colFormula}</th>
              </tr>
            </thead>
            <tbody>
              {filteredBoqItems.map((item) => (
                <tr className={`level-${item.level}`} key={`${item.row}-${item.code}-${item.name}`}>
                  <td>{item.code || "-"}</td>
                  <td>{item.name}</td>
                  <td>{item.unit || "-"}</td>
                  <td>{item.quantity === null ? "-" : numberFormat.format(item.quantity)}</td>
                  <td>{amountText(item.materialAmount)}</td>
                  <td>{amountText(item.laborAmount)}</td>
                  <td>{amountText(item.totalAmount)}</td>
                  <td>{item.totalFormula || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CurveTab({ copy, preview }: { copy: Copy; preview: ConstructionPlanPreview }) {
  return (
    <div className="module-board">
      <div className="page-header">
        <div>
          <h2>{copy.curveTitle}</h2>
          <p>{copy.curveDetail}</p>
        </div>
      </div>
      <div className="construction-curve-grid">
        {preview.curve.map((point) => (
          <div className="construction-curve-row" key={`${point.week}-${point.date}`}>
            <div>
              <strong>{copy.week} {point.week}</strong>
              <span>{formatBuddhistDate(point.date)}</span>
            </div>
            <div className="construction-curve-track">
              <span
                className="construction-curve-fill"
                style={{ width: `${Math.max(Math.min(point.plannedPercent, 100), 0)}%` }}
              />
            </div>
            <em>{amountText(point.plannedAmount)}</em>
            <small>{numberFormat.format(point.plannedPercent)}%</small>
          </div>
        ))}
      </div>
    </div>
  );
}
