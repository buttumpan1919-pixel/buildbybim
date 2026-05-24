export type BoqTaskAllocation = {
  taskId: string;
  taskName: string;
  projectId?: string;
  allocatedAmount: number;
  linkedAt?: string;
  updatedAt?: string;
};

export type BoqAllocationItem = {
  id: string;
  code: string;
  name: string;
  unit: string;
  totalPrice: number;
  spentBudget?: number;
  taskAllocations?: BoqTaskAllocation[];
};

export type BoqAllocationState = BoqAllocationItem & {
  allocatedAmount: number;
  remainingAmount: number;
  allocatedPercentage: number;
  spentPercentage: number;
  overAllocatedAmount: number;
  linkedTasksCount: number;
};

export type BoqAllocationSummary = {
  totalBudget: number;
  totalAllocated: number;
  totalSpent: number;
  totalRemaining: number;
  allocatedPercentage: number;
  spentPercentage: number;
  itemsCount: number;
  linkedItemsCount: number;
  overAllocatedCount: number;
};

export type BoqAllocationValidation = {
  valid: boolean;
  availableAmount: number;
  overAmount: number;
  message: string;
};

function clampMoney(value: number) {
  return Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
}

function getAllocationTotal(allocations: BoqTaskAllocation[] = [], excludeTaskId?: string) {
  return allocations.reduce((sum, allocation) => {
    if (excludeTaskId && allocation.taskId === excludeTaskId) {
      return sum;
    }

    return sum + clampMoney(allocation.allocatedAmount);
  }, 0);
}

function getPercentage(value: number, total: number) {
  if (total <= 0) {
    return 0;
  }

  return Math.round((value / total) * 100);
}

export function calculateBoqAllocationState(item: BoqAllocationItem): BoqAllocationState {
  const totalPrice = clampMoney(item.totalPrice);
  const spentBudget = clampMoney(item.spentBudget ?? 0);
  const allocatedAmount = getAllocationTotal(item.taskAllocations);
  const remainingAmount = totalPrice - allocatedAmount - spentBudget;

  return {
    ...item,
    totalPrice,
    spentBudget,
    allocatedAmount,
    remainingAmount,
    allocatedPercentage: getPercentage(allocatedAmount, totalPrice),
    spentPercentage: getPercentage(spentBudget, totalPrice),
    overAllocatedAmount: Math.max(0, Math.abs(Math.min(remainingAmount, 0))),
    linkedTasksCount: item.taskAllocations?.length ?? 0
  };
}

export function summarizeBoqAllocations(items: BoqAllocationItem[]): BoqAllocationSummary {
  const states = items.map(calculateBoqAllocationState);
  const totalBudget = states.reduce((sum, item) => sum + item.totalPrice, 0);
  const totalAllocated = states.reduce((sum, item) => sum + item.allocatedAmount, 0);
  const totalSpent = states.reduce((sum, item) => sum + clampMoney(item.spentBudget ?? 0), 0);
  const totalRemaining = totalBudget - totalAllocated - totalSpent;

  return {
    totalBudget,
    totalAllocated,
    totalSpent,
    totalRemaining,
    allocatedPercentage: getPercentage(totalAllocated, totalBudget),
    spentPercentage: getPercentage(totalSpent, totalBudget),
    itemsCount: states.length,
    linkedItemsCount: states.filter((item) => item.linkedTasksCount > 0).length,
    overAllocatedCount: states.filter((item) => item.overAllocatedAmount > 0).length
  };
}

export function validateBoqAllocation(
  item: BoqAllocationItem,
  requestedAmount: number,
  excludeTaskId?: string
): BoqAllocationValidation {
  const totalPrice = clampMoney(item.totalPrice);
  const spentBudget = clampMoney(item.spentBudget ?? 0);
  const allocatedWithoutCurrentTask = getAllocationTotal(item.taskAllocations, excludeTaskId);
  const availableAmount = Math.max(0, totalPrice - spentBudget - allocatedWithoutCurrentTask);
  const normalizedRequest = clampMoney(requestedAmount);
  const overAmount = Math.max(0, normalizedRequest - availableAmount);

  return {
    valid: overAmount === 0,
    availableAmount,
    overAmount,
    message:
      overAmount === 0
        ? "Allocation is within available BOQ budget."
        : `Allocation exceeds available BOQ budget by ${overAmount}.`
  };
}

export function upsertBoqTaskAllocation(
  item: BoqAllocationItem,
  allocation: BoqTaskAllocation
): BoqAllocationItem {
  const now = new Date().toISOString();
  const existingAllocations = item.taskAllocations ?? [];
  const nextAllocation: BoqTaskAllocation = {
    ...allocation,
    allocatedAmount: clampMoney(allocation.allocatedAmount),
    linkedAt: allocation.linkedAt ?? now,
    updatedAt: now
  };
  const hasExisting = existingAllocations.some((entry) => entry.taskId === allocation.taskId);

  return {
    ...item,
    taskAllocations: hasExisting
      ? existingAllocations.map((entry) => (entry.taskId === allocation.taskId ? nextAllocation : entry))
      : [...existingAllocations, nextAllocation]
  };
}

export function removeBoqTaskAllocation(item: BoqAllocationItem, taskId: string): BoqAllocationItem {
  return {
    ...item,
    taskAllocations: (item.taskAllocations ?? []).filter((allocation) => allocation.taskId !== taskId)
  };
}
