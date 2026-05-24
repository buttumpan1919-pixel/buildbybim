import { getStorageAdapter, readJson, writeJson, type StorageAdapter } from "../../../storageAdapter";

export const SITE_REPORT_PLANS_STORAGE_KEY = "site-report.plans.v1";
export const SITE_REPORT_PINS_STORAGE_KEY = "site-report.pins.v1";

export type SiteReportPlanType = "floor_plan" | "elevation" | "section" | "site_plan" | "other";
export type SiteReportPlanPinStatus = "open" | "watching" | "done" | "archived";

export type SiteReportPlan = {
  id: string;
  projectId: string;
  name: string;
  planType: SiteReportPlanType;
  floor: string;
  revision: string;
  imageUrl: string;
  imageAssetId: string;
  createdAt: string;
  updatedAt: string;
};

export type SiteReportPlanPin = {
  id: string;
  projectId: string;
  planId: string;
  pinNo: number;
  label: string;
  floor: string;
  room: string;
  zone: string;
  viewpoint: string;
  x: number;
  y: number;
  yaw: number;
  pitch: number;
  linkedLocationPinId: string;
  status: SiteReportPlanPinStatus;
  createdAt: string;
  updatedAt: string;
};

export type SiteReportPlanInput = Partial<SiteReportPlan> & {
  projectId: string;
  name: string;
};

export type SiteReportPlanPinInput = Partial<SiteReportPlanPin> & {
  projectId: string;
  planId: string;
};

const planTypeSet = new Set<SiteReportPlanType>([
  "floor_plan",
  "elevation",
  "section",
  "site_plan",
  "other"
]);

const pinStatusSet = new Set<SiteReportPlanPinStatus>([
  "open",
  "watching",
  "done",
  "archived"
]);

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanDate(value: unknown, fallback: string) {
  const text = cleanText(value);
  return text || fallback;
}

function cleanNumber(value: unknown, fallback: number, min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function normalizeSiteReportPlan(raw: unknown): SiteReportPlan | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Partial<SiteReportPlan>;
  const projectId = cleanText(record.projectId);
  const name = cleanText(record.name);
  if (!projectId || !name) return null;

  const now = new Date().toISOString();
  const planType = planTypeSet.has(record.planType as SiteReportPlanType)
    ? (record.planType as SiteReportPlanType)
    : "floor_plan";

  return {
    id: cleanText(record.id) || createId("site-plan"),
    projectId,
    name,
    planType,
    floor: cleanText(record.floor),
    revision: cleanText(record.revision),
    imageUrl: cleanText(record.imageUrl),
    imageAssetId: cleanText(record.imageAssetId),
    createdAt: cleanDate(record.createdAt, now),
    updatedAt: cleanDate(record.updatedAt, now)
  };
}

export function normalizeSiteReportPlanPin(raw: unknown): SiteReportPlanPin | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Partial<SiteReportPlanPin>;
  const projectId = cleanText(record.projectId);
  const planId = cleanText(record.planId);
  if (!projectId || !planId) return null;

  const now = new Date().toISOString();
  const pinNo = Math.max(1, Math.round(cleanNumber(record.pinNo, 1)));
  const status = pinStatusSet.has(record.status as SiteReportPlanPinStatus)
    ? (record.status as SiteReportPlanPinStatus)
    : "open";

  return {
    id: cleanText(record.id) || createId("site-pin"),
    projectId,
    planId,
    pinNo,
    label: cleanText(record.label) || `Pin ${pinNo}`,
    floor: cleanText(record.floor),
    room: cleanText(record.room),
    zone: cleanText(record.zone),
    viewpoint: cleanText(record.viewpoint),
    x: cleanNumber(record.x, 50, 0, 100),
    y: cleanNumber(record.y, 50, 0, 100),
    yaw: cleanNumber(record.yaw, 0),
    pitch: cleanNumber(record.pitch, 0),
    linkedLocationPinId: cleanText(record.linkedLocationPinId),
    status,
    createdAt: cleanDate(record.createdAt, now),
    updatedAt: cleanDate(record.updatedAt, now)
  };
}

export function createSiteReportPlan(input: SiteReportPlanInput): SiteReportPlan {
  const now = new Date().toISOString();
  const plan = normalizeSiteReportPlan({
    ...input,
    id: input.id || createId("site-plan"),
    createdAt: input.createdAt || now,
    updatedAt: now
  });

  if (!plan) {
    throw new Error("Site Report plan requires projectId and name");
  }

  return plan;
}

export function createSiteReportPlanPin(input: SiteReportPlanPinInput): SiteReportPlanPin {
  const now = new Date().toISOString();
  const pin = normalizeSiteReportPlanPin({
    ...input,
    id: input.id || createId("site-pin"),
    createdAt: input.createdAt || now,
    updatedAt: now
  });

  if (!pin) {
    throw new Error("Site Report plan pin requires projectId and planId");
  }

  return pin;
}

export function normalizeSiteReportPlans(raw: unknown): SiteReportPlan[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => normalizeSiteReportPlan(item))
    .filter((item): item is SiteReportPlan => Boolean(item))
    .sort((first, second) => first.name.localeCompare(second.name, "th"));
}

export function normalizeSiteReportPlanPins(raw: unknown): SiteReportPlanPin[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => normalizeSiteReportPlanPin(item))
    .filter((item): item is SiteReportPlanPin => Boolean(item))
    .sort((first, second) => first.pinNo - second.pinNo || first.label.localeCompare(second.label, "th"));
}

export function loadSiteReportPlans(adapter: StorageAdapter = getStorageAdapter()) {
  return readJson<SiteReportPlan[]>(adapter, SITE_REPORT_PLANS_STORAGE_KEY, [], normalizeSiteReportPlans);
}

export function saveSiteReportPlans(plans: SiteReportPlan[], adapter: StorageAdapter = getStorageAdapter()) {
  writeJson(adapter, SITE_REPORT_PLANS_STORAGE_KEY, normalizeSiteReportPlans(plans));
}

export function loadSiteReportPlanPins(adapter: StorageAdapter = getStorageAdapter()) {
  return readJson<SiteReportPlanPin[]>(adapter, SITE_REPORT_PINS_STORAGE_KEY, [], normalizeSiteReportPlanPins);
}

export function saveSiteReportPlanPins(pins: SiteReportPlanPin[], adapter: StorageAdapter = getStorageAdapter()) {
  writeJson(adapter, SITE_REPORT_PINS_STORAGE_KEY, normalizeSiteReportPlanPins(pins));
}

export function filterSiteReportPlansByProject(plans: SiteReportPlan[], projectId: string) {
  return plans.filter((plan) => plan.projectId === projectId);
}

export function filterSiteReportPinsByPlan(pins: SiteReportPlanPin[], planId: string) {
  return pins.filter((pin) => pin.planId === planId);
}

export function nextSiteReportPinNo(pins: SiteReportPlanPin[], planId: string) {
  const used = pins.filter((pin) => pin.planId === planId).map((pin) => pin.pinNo);
  return used.length === 0 ? 1 : Math.max(...used) + 1;
}

export function upsertSiteReportPlan(plans: SiteReportPlan[], plan: SiteReportPlan) {
  const nextPlan = normalizeSiteReportPlan({
    ...plan,
    updatedAt: new Date().toISOString()
  });
  if (!nextPlan) return normalizeSiteReportPlans(plans);

  const found = plans.some((item) => item.id === nextPlan.id);
  return normalizeSiteReportPlans(found
    ? plans.map((item) => (item.id === nextPlan.id ? nextPlan : item))
    : [...plans, nextPlan]
  );
}

export function upsertSiteReportPlanPin(pins: SiteReportPlanPin[], pin: SiteReportPlanPin) {
  const nextPin = normalizeSiteReportPlanPin({
    ...pin,
    updatedAt: new Date().toISOString()
  });
  if (!nextPin) return normalizeSiteReportPlanPins(pins);

  const found = pins.some((item) => item.id === nextPin.id);
  return normalizeSiteReportPlanPins(found
    ? pins.map((item) => (item.id === nextPin.id ? nextPin : item))
    : [...pins, nextPin]
  );
}
