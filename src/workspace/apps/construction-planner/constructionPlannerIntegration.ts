import type { BoqCatalogRow } from "../../../data";
import {
  createBoqProjectTask,
  loadBoqTaskLinkageState,
  saveBoqTaskLinkageState,
  upsertBoqProjectTask,
  type BoqTaskAllocationRecord
} from "../../../boqTaskLinkage";
import {
  createProject,
  loadProjects,
  saveProjects,
  suggestNextProjectCode,
  upsertProject,
  type Project
} from "../../../projects";
import {
  loadCustomBoqRows,
  normalizeBoqRow,
  saveCustomBoqRows
} from "../boq-data/boqDataService";
import {
  CONSTRUCTION_PLANNER_STORAGE_KEY,
  formatBuddhistDate,
  type ConstructionBoqItem,
  type ConstructionPlanPreview,
  type ConstructionTask
} from "./constructionPlannerService";

const PROJECT_NOTE_START = "[construction-planner-sync]";
const PROJECT_NOTE_END = "[/construction-planner-sync]";

export type ConstructionPlannerWorkspaceSyncResult = {
  project: Project;
  projectCreated: boolean;
  projectUpdated: boolean;
  taskCount: number;
  boqCatalogCount: number;
  linkedBoqItemsCount: number;
  projectControlReady: boolean;
};

export function syncConstructionPlannerToWorkspace(
  preview: ConstructionPlanPreview
): ConstructionPlannerWorkspaceSyncResult {
  const projectResult = syncPlannerProject(preview);
  const boqCatalogCount = syncPlannerBoqCatalog(preview);
  const taskResult = syncPlannerTasks(preview, projectResult.project.id);

  return {
    project: projectResult.project,
    projectCreated: projectResult.projectCreated,
    projectUpdated: !projectResult.projectCreated,
    taskCount: taskResult.taskCount,
    boqCatalogCount,
    linkedBoqItemsCount: taskResult.linkedBoqItemsCount,
    projectControlReady: true
  };
}

export function syncPlannerProject(preview: ConstructionPlanPreview) {
  const state = loadProjects();
  const projectId = buildPlannerProjectId(preview);
  const existingProject = state.projects.find((project) => project.id === projectId);
  const projectName = preview.project.projectName || preview.project.title || "Construction Planner Project";
  const referenceDate = parseReferenceDate(preview.project.startDate);
  const projectCode =
    existingProject?.code ||
    suggestNextProjectCode(state.projects, "cp-", referenceDate);
  const projectNotes = mergePlannerNotes(
    existingProject?.notes ?? "",
    buildPlannerProjectNotes(preview)
  );
  const project = createProject({
    ...existingProject,
    id: projectId,
    workspaceId: existingProject?.workspaceId || "local-workspace",
    code: projectCode,
    name: projectName,
    clientName: existingProject?.clientName || "Construction Planner Import",
    customerType: existingProject?.customerType ?? null,
    contractValue: preview.project.totalAmount,
    plannedCost: preview.project.totalAmount,
    actualCost: existingProject?.actualCost ?? 0,
    plannedRevenue: preview.project.totalAmount,
    actualRevenue: existingProject?.actualRevenue ?? 0,
    startDate: preview.project.startDate,
    endDate: preview.project.endDate,
    status: existingProject?.status ?? "draft",
    hasBudget: preview.project.totalAmount > 0,
    notes: projectNotes,
    createdAt: existingProject?.createdAt
  });

  const nextState = upsertProject(state, project);
  saveProjects(nextState);

  return {
    project,
    projectCreated: !existingProject
  };
}

export function syncPlannerTasks(preview: ConstructionPlanPreview, projectId: string) {
  const taskState = loadBoqTaskLinkageState();
  const boqItemsByRow = new Map(preview.boqItems.map((item) => [item.row, item]));
  const projectHash = hashText(projectId);
  let nextState = taskState;
  let linkedBoqItemsCount = 0;

  preview.tasks.forEach((task) => {
    const linkedItems = buildTaskBoqAllocations(task, boqItemsByRow, projectHash);
    linkedBoqItemsCount += linkedItems.length;

    nextState = upsertBoqProjectTask(
      nextState,
      createBoqProjectTask({
        id: buildPlannerTaskId(projectId, task),
        projectId,
        name: formatPlannerTaskName(task),
        status: "planned",
        note: buildPlannerTaskNote(preview, task),
        boqLinkage: linkedItems
      })
    );
  });

  saveBoqTaskLinkageState(nextState);

  return {
    taskCount: preview.tasks.length,
    linkedBoqItemsCount
  };
}

export function syncPlannerBoqCatalog(preview: ConstructionPlanPreview) {
  const projectHash = hashText(buildPlannerProjectId(preview));
  const existingRows = loadCustomBoqRows();
  const rowsById = new Map<string, BoqCatalogRow>();

  existingRows.forEach((row, index) => {
    const id = row.id || `custom-${index}`;
    rowsById.set(id, row);
  });

  preview.boqItems.forEach((item, index) => {
    const row = buildBoqCatalogRow(preview, item, projectHash, index);
    rowsById.set(row.id as string, row);
  });

  saveCustomBoqRows([...rowsById.values()]);

  return preview.boqItems.length;
}

export function buildPlannerProjectId(preview: ConstructionPlanPreview) {
  const source = [
    preview.project.contractNo,
    preview.project.projectName,
    preview.project.title,
    preview.project.startDate
  ]
    .filter(Boolean)
    .join("|");

  return `construction-planner-project-${hashText(source || preview.sourceLabel)}`;
}

function buildPlannerTaskId(projectId: string, task: ConstructionTask) {
  return `${projectId}-task-${task.row}`;
}

function buildPlannerBoqId(projectHash: string, item: ConstructionBoqItem) {
  return `construction-planner-boq-${projectHash}-${item.row}`;
}

function buildBoqCatalogRow(
  preview: ConstructionPlanPreview,
  item: ConstructionBoqItem,
  projectHash: string,
  index: number
) {
  const materialUnit = item.materialUnit ?? item.materialAmount ?? 0;
  const laborUnit = item.laborUnit ?? item.laborAmount ?? 0;

  return normalizeBoqRow(
    {
      id: buildPlannerBoqId(projectHash, item),
      keynote: item.code || `ROW-${item.row}`,
      item: item.name,
      unit: item.unit || "work",
      allowance: "0%",
      material: formatAmountForBoq(materialUnit),
      labor: formatAmountForBoq(laborUnit),
      level: item.level,
      priceStatus: "current",
      priceVersion: `construction-planner-${preview.importedAt.slice(0, 10)}`,
      source: `construction-planner:${preview.sourceLabel}`,
      updatedAt: preview.importedAt.slice(0, 10),
      note: [
        `Source row: BOQ!${item.row}`,
        `Quantity: ${item.quantity ?? "-"}`,
        `Material amount: ${item.materialAmount ?? 0}`,
        `Labor amount: ${item.laborAmount ?? 0}`,
        `Total amount: ${item.totalAmount ?? 0}`,
        item.totalFormula ? `Formula: ${item.totalFormula}` : ""
      ]
        .filter(Boolean)
        .join(" | ")
    },
    index
  );
}

function buildTaskBoqAllocations(
  task: ConstructionTask,
  boqItemsByRow: Map<number, ConstructionBoqItem>,
  projectHash: string
): BoqTaskAllocationRecord[] {
  const rows = parseBoqRowsFromFormula(task.amountFormula);

  return rows
    .map((row, index) => {
      const item = boqItemsByRow.get(row);
      if (!item) {
        return null;
      }

      const boqItemId = buildPlannerBoqId(projectHash, item);
      const unitPrice = (item.materialUnit ?? 0) + (item.laborUnit ?? 0);
      const allocatedAmount = item.totalAmount ?? task.amount ?? 0;
      const now = new Date().toISOString();

      return {
        id: `${boqItemId}-${task.row}`,
        recordId: boqItemId,
        boqItemId,
        keynote: item.code || `ROW-${item.row}`,
        boqKeynote: item.code || `ROW-${item.row}`,
        boqCode: item.code || `ROW-${item.row}`,
        item: item.name,
        boqItemName: item.name,
        boqName: item.name,
        unit: item.unit || "work",
        boqUnit: item.unit || "work",
        unitPrice,
        boqUnitPrice: unitPrice,
        costCodeId: "",
        costCodeCode: "",
        costCodeName: "",
        allocatedAmount,
        linkedAt: now,
        updatedAt: now
      } satisfies BoqTaskAllocationRecord;
    })
    .filter((allocation): allocation is BoqTaskAllocationRecord => Boolean(allocation));
}

export function parseBoqRowsFromFormula(formula: string) {
  const rows = new Set<number>();
  const rangePattern = /BOQ!\$?[A-Z]+\$?(\d+)\s*:\s*\$?[A-Z]+\$?(\d+)/gi;
  const cellPattern = /BOQ!\$?[A-Z]+\$?(\d+)/gi;
  let rangeMatch: RegExpExecArray | null;
  let cellMatch: RegExpExecArray | null;

  while ((rangeMatch = rangePattern.exec(formula)) !== null) {
    const start = Number(rangeMatch[1]);
    const end = Number(rangeMatch[2]);
    if (!Number.isFinite(start) || !Number.isFinite(end)) {
      continue;
    }

    const min = Math.min(start, end);
    const max = Math.max(start, end);
    for (let row = min; row <= max; row += 1) {
      rows.add(row);
    }
  }

  while ((cellMatch = cellPattern.exec(formula)) !== null) {
    const row = Number(cellMatch[1]);
    if (Number.isFinite(row)) {
      rows.add(row);
    }
  }

  return [...rows].sort((a, b) => a - b);
}

function buildPlannerProjectNotes(preview: ConstructionPlanPreview) {
  return [
    "Construction Planner sync",
    `Storage: ${CONSTRUCTION_PLANNER_STORAGE_KEY}`,
    `Source: ${preview.sourceLabel}`,
    `Contract: ${preview.project.contractNo || "-"}`,
    `Location: ${preview.project.location || "-"}`,
    `Schedule: ${formatBuddhistDate(preview.project.startDate)} - ${formatBuddhistDate(preview.project.endDate)}`,
    `Duration: ${preview.project.durationDays} days`,
    `Tasks: ${preview.tasks.length}`,
    `BOQ rows: ${preview.boqItems.length}`
  ].join("\n");
}

function buildPlannerTaskNote(preview: ConstructionPlanPreview, task: ConstructionTask) {
  return [
    `Construction Planner row: ${task.row}`,
    `Workbook: ${preview.sourceLabel}`,
    `Contract: ${preview.project.contractNo || "-"}`,
    `Code: ${task.code || "-"}`,
    `Dates: ${formatBuddhistDate(task.startDate)} - ${formatBuddhistDate(task.endDate)}`,
    `Duration: ${task.durationDays} days`,
    `Amount: ${task.amount}`,
    task.amountFormula ? `Formula: ${task.amountFormula}` : ""
  ]
    .filter(Boolean)
    .join(" | ");
}

function mergePlannerNotes(existingNotes: string, plannerNotes: string) {
  const pattern = new RegExp(
    `${escapeRegex(PROJECT_NOTE_START)}[\\s\\S]*?${escapeRegex(PROJECT_NOTE_END)}`,
    "g"
  );
  const cleaned = existingNotes.replace(pattern, "").trim();
  const block = `${PROJECT_NOTE_START}\n${plannerNotes}\n${PROJECT_NOTE_END}`;

  return [cleaned, block].filter(Boolean).join("\n\n");
}

function formatPlannerTaskName(task: ConstructionTask) {
  return task.code ? `${task.code} ${task.name}` : task.name;
}

function parseReferenceDate(isoDate: string) {
  const date = new Date(`${isoDate}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function formatAmountForBoq(value: number) {
  if (!Number.isFinite(value)) {
    return "0";
  }

  return value % 1 === 0 ? String(Math.round(value)) : value.toFixed(2);
}

function hashText(value: string) {
  let hash = 5381;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33) ^ value.charCodeAt(index);
  }

  return (hash >>> 0).toString(36);
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
