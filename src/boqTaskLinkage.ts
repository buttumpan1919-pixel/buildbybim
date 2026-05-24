import { defaultStorageAdapter, readJson, writeJson } from "./storageAdapter";

export const BOQ_TASK_LINKAGE_STORAGE_KEY = "boq-data.task-linkage.v1";

export type BoqProjectTaskStatus = "planned" | "in_progress" | "done";

export type BoqTaskAllocationRecord = {
  id: string;
  recordId: string;
  boqItemId: string;
  keynote: string;
  boqKeynote: string;
  boqCode: string;
  item: string;
  boqItemName: string;
  boqName: string;
  unit: string;
  boqUnit: string;
  unitPrice: number;
  boqUnitPrice: number;
  costCodeId: string;
  costCodeCode: string;
  costCodeName: string;
  allocatedAmount: number;
  linkedAt: string;
  updatedAt: string;
};

export type BoqProjectTask = {
  id: string;
  name: string;
  projectId: string;
  status: BoqProjectTaskStatus;
  note: string;
  boqLinkage: BoqTaskAllocationRecord[];
  createdAt: string;
  updatedAt: string;
};

export type BoqTaskLinkageState = {
  tasks: BoqProjectTask[];
  updatedAt: string;
};

type BoqTaskLinkageStateInput = {
  tasks?: Partial<BoqProjectTask>[];
  updatedAt?: string;
};

type BoqCatalogLinkItem = {
  id: string;
  keynote: string;
  item: string;
  unit: string;
  unitPrice: number;
  costCodeId?: string;
  costCodeCode?: string;
  costCodeName?: string;
};

function createBoqTaskId(index = 0) {
  return `boq-task-${Date.now().toString(36)}-${index}-${Math.random().toString(16).slice(2)}`;
}

function normalizeBoqTaskStatus(status: unknown): BoqProjectTaskStatus {
  return status === "in_progress" || status === "done" || status === "planned" ? status : "planned";
}

function normalizeBoqTaskAllocation(
  allocation: Partial<BoqTaskAllocationRecord>,
  index = 0
): BoqTaskAllocationRecord {
  const now = new Date().toISOString();
  const recordId =
    allocation.recordId?.trim() ||
    allocation.boqItemId?.trim() ||
    allocation.id?.trim() ||
    `boq-item-${index}`;
  const keynote =
    allocation.keynote?.trim() ||
    allocation.boqKeynote?.trim() ||
    allocation.boqCode?.trim() ||
    "BOQ";
  const item =
    allocation.item?.trim() ||
    allocation.boqItemName?.trim() ||
    allocation.boqName?.trim() ||
    "BOQ item";
  const unit = allocation.unit?.trim() || allocation.boqUnit?.trim() || "item";
  const unitPrice =
    typeof allocation.unitPrice === "number"
      ? Math.max(0, allocation.unitPrice)
      : typeof allocation.boqUnitPrice === "number"
        ? Math.max(0, allocation.boqUnitPrice)
        : 0;

  return {
    id: allocation.id?.trim() || `${recordId}-${index}`,
    recordId,
    boqItemId: recordId,
    keynote,
    boqKeynote: keynote,
    boqCode: keynote,
    item,
    boqItemName: item,
    boqName: item,
    unit,
    boqUnit: unit,
    unitPrice,
    boqUnitPrice: unitPrice,
    costCodeId: allocation.costCodeId?.trim() || "",
    costCodeCode: allocation.costCodeCode?.trim() || "",
    costCodeName: allocation.costCodeName?.trim() || "",
    allocatedAmount:
      typeof allocation.allocatedAmount === "number"
        ? Math.max(0, allocation.allocatedAmount)
        : unitPrice,
    linkedAt: allocation.linkedAt ?? now,
    updatedAt: allocation.updatedAt ?? now
  };
}

function normalizeBoqProjectTask(task: Partial<BoqProjectTask>, index = 0): BoqProjectTask {
  const now = new Date().toISOString();

  return {
    id: task.id?.trim() || createBoqTaskId(index),
    name: task.name?.trim() || `Task ${index + 1}`,
    projectId: task.projectId?.trim() || "",
    status: normalizeBoqTaskStatus(task.status),
    note: task.note?.trim() || "",
    boqLinkage: Array.isArray(task.boqLinkage)
      ? task.boqLinkage.map((allocation, allocationIndex) =>
          normalizeBoqTaskAllocation(allocation, allocationIndex)
        )
      : [],
    createdAt: task.createdAt ?? now,
    updatedAt: task.updatedAt ?? now
  };
}

function normalizeBoqTaskLinkageState(state: BoqTaskLinkageStateInput): BoqTaskLinkageState {
  return {
    tasks: Array.isArray(state.tasks)
      ? state.tasks.map((task, index) => normalizeBoqProjectTask(task, index))
      : [],
    updatedAt: state.updatedAt ?? new Date().toISOString()
  };
}

export function loadBoqTaskLinkageState(): BoqTaskLinkageState {
  return readJson<BoqTaskLinkageState>(
    defaultStorageAdapter,
    BOQ_TASK_LINKAGE_STORAGE_KEY,
    { tasks: [], updatedAt: "" },
    (raw) => normalizeBoqTaskLinkageState(raw as BoqTaskLinkageStateInput)
  );
}

export function saveBoqTaskLinkageState(state: BoqTaskLinkageState) {
  writeJson(defaultStorageAdapter, BOQ_TASK_LINKAGE_STORAGE_KEY, normalizeBoqTaskLinkageState(state));
}

export function summarizeBoqTaskLinkage(state: BoqTaskLinkageState) {
  const normalizedState = normalizeBoqTaskLinkageState(state);
  const linkedItemsCount = normalizedState.tasks.reduce((sum, task) => sum + task.boqLinkage.length, 0);
  const totalAllocated = normalizedState.tasks.reduce(
    (sum, task) => sum + task.boqLinkage.reduce((taskSum, allocation) => taskSum + allocation.allocatedAmount, 0),
    0
  );

  return {
    taskCount: normalizedState.tasks.length,
    linkedItemCount: linkedItemsCount,
    linkedItemsCount,
    totalAllocated,
    updatedAt: normalizedState.updatedAt
  };
}

export function createBoqProjectTask(task: Partial<BoqProjectTask>) {
  const now = new Date().toISOString();

  return normalizeBoqProjectTask({
    ...task,
    id: task.id ?? createBoqTaskId(),
    createdAt: task.createdAt ?? now,
    updatedAt: task.updatedAt ?? now
  });
}

export function upsertBoqProjectTask(state: BoqTaskLinkageState, task: Partial<BoqProjectTask>) {
  const normalizedTask = normalizeBoqProjectTask({
    ...task,
    updatedAt: new Date().toISOString()
  });
  const hasExisting = state.tasks.some((item) => item.id === normalizedTask.id);

  return normalizeBoqTaskLinkageState({
    tasks: hasExisting
      ? state.tasks.map((item) => (item.id === normalizedTask.id ? normalizedTask : item))
      : [normalizedTask, ...state.tasks],
    updatedAt: new Date().toISOString()
  });
}

export function removeBoqProjectTask(state: BoqTaskLinkageState, taskId: string) {
  return normalizeBoqTaskLinkageState({
    tasks: state.tasks.filter((task) => task.id !== taskId),
    updatedAt: new Date().toISOString()
  });
}

export function upsertBoqTaskLinkage(
  state: BoqTaskLinkageState,
  taskId: string,
  item: BoqCatalogLinkItem,
  allocatedAmount: number
) {
  const now = new Date().toISOString();

  return normalizeBoqTaskLinkageState({
    tasks: state.tasks.map((task) => {
      if (task.id !== taskId) {
        return task;
      }

      const nextAllocation = normalizeBoqTaskAllocation({
        id: `${item.id}-${taskId}`,
        recordId: item.id,
        boqItemId: item.id,
        keynote: item.keynote,
        boqKeynote: item.keynote,
        boqCode: item.keynote,
        item: item.item,
        boqItemName: item.item,
        boqName: item.item,
        unit: item.unit,
        boqUnit: item.unit,
        unitPrice: item.unitPrice,
        boqUnitPrice: item.unitPrice,
        costCodeId: item.costCodeId,
        costCodeCode: item.costCodeCode,
        costCodeName: item.costCodeName,
        allocatedAmount,
        linkedAt: task.boqLinkage.find((allocation) => allocation.boqItemId === item.id)?.linkedAt ?? now,
        updatedAt: now
      });
      const hasExisting = task.boqLinkage.some((allocation) => allocation.boqItemId === item.id);

      return normalizeBoqProjectTask({
        ...task,
        boqLinkage: hasExisting
          ? task.boqLinkage.map((allocation) =>
              allocation.boqItemId === item.id ? nextAllocation : allocation
            )
          : [...task.boqLinkage, nextAllocation],
        updatedAt: now
      });
    }),
    updatedAt: now
  });
}

export function removeBoqTaskLinkage(state: BoqTaskLinkageState, taskId: string, boqItemId: string) {
  const now = new Date().toISOString();

  return normalizeBoqTaskLinkageState({
    tasks: state.tasks.map((task) =>
      task.id === taskId
        ? normalizeBoqProjectTask({
            ...task,
            boqLinkage: task.boqLinkage.filter((allocation) => allocation.boqItemId !== boqItemId),
            updatedAt: now
          })
        : task
    ),
    updatedAt: now
  });
}
