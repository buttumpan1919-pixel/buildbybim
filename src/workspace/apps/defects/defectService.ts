import {
  normalizeDefectPhotoRecord,
  normalizeDefectRecord,
  type DefectPhotoRecord,
  type DefectPhotoStage,
  type DefectRecord,
  type DefectSeverity,
  type DefectStatus
} from "../../../storage";
import type { EvidenceAsset, EvidenceAssetType } from "../../../evidence";
import { getStorageAdapter, readJson, type StorageAdapter } from "../../../storageAdapter";

export const DEFECT_STORAGE_KEY = "defect-tracker.records.v1";

export type SiteReportEventType = "comment" | "evidence" | "milestone";
export type SiteReportEventFilter = "all" | "needs-reply" | "answered" | "evidence" | "milestone";

export type SiteReportMilestoneInput = {
  id: string | number;
  name: string;
  due: string;
  percent: number;
  status: string;
};

export type SiteReportEvent = {
  id: string;
  type: SiteReportEventType;
  title: string;
  detail: string;
  status: "needs-reply" | "answered" | "evidence" | "milestone";
  statusLabel: string;
  sourceLabel: string;
  owner: string;
  occurredAt: string;
  actionId: string | null;
  evidenceCount: number;
  locationPinId?: string;
};

export type SiteReportSummary = {
  totalEvents: number;
  needsReply: number;
  answered: number;
  evidence: number;
  milestones: number;
};

export type SiteReportEvidenceKind = "photo" | "video" | "360" | "pdf" | "receipt" | "file";
export type SiteReportEvidenceLocationInput = {
  floor?: string;
  room?: string;
  zone?: string;
  viewpoint?: string;
};

export type SiteReportLocationPin = {
  id: string;
  label: string;
  floor: string;
  room: string;
  zone: string;
  viewpoint: string;
  assetCount: number;
  assetIds: string[];
  evidenceKinds: SiteReportEvidenceKind[];
  latestAt: string;
};

const siteReportEvidenceKindSet = new Set<SiteReportEvidenceKind>([
  "photo",
  "video",
  "360",
  "pdf",
  "receipt",
  "file"
]);

const siteReportKindTagPrefix = "site-kind:";
const siteReportLocationTagPrefix = "location:";
const siteReportFloorTagPrefix = "site-floor:";
const siteReportRoomTagPrefix = "site-room:";
const siteReportZoneTagPrefix = "site-zone:";
const siteReportViewpointTagPrefix = "site-viewpoint:";

export const siteReportEvidenceKindLabels: Record<SiteReportEvidenceKind, string> = {
  photo: "Photo",
  video: "Video",
  "360": "360",
  pdf: "PDF",
  receipt: "Receipt",
  file: "File"
};

export function siteReportEvidenceKindToAssetType(kind: SiteReportEvidenceKind): EvidenceAssetType {
  if (kind === "360") return "site_360";
  if (kind === "photo") return "site_photo";
  if (kind === "receipt") return "receipt";

  return "site_file";
}

function cleanSiteReportLocationValue(value: string | undefined) {
  return (value ?? "").trim();
}

function tagValue(tags: string[], prefix: string) {
  return tags
    .find((tag) => tag.startsWith(prefix))
    ?.slice(prefix.length)
    .trim() ?? "";
}

function getLatestAssetTimestamp(asset: EvidenceAsset) {
  return asset.capturedAt || asset.updatedAt || asset.uploadedAt || asset.createdAt || "";
}

export function buildSiteReportEvidenceTags(
  kind: SiteReportEvidenceKind,
  location: SiteReportEvidenceLocationInput | string = ""
) {
  const locationParts =
    typeof location === "string"
      ? { legacy: cleanSiteReportLocationValue(location) }
      : {
          floor: cleanSiteReportLocationValue(location.floor),
          room: cleanSiteReportLocationValue(location.room),
          zone: cleanSiteReportLocationValue(location.zone),
          viewpoint: cleanSiteReportLocationValue(location.viewpoint)
        };

  return [
    "site-report",
    `${siteReportKindTagPrefix}${kind}`,
    ...("legacy" in locationParts && locationParts.legacy
      ? [`${siteReportLocationTagPrefix}${locationParts.legacy}`]
      : []),
    ...(!("legacy" in locationParts) && locationParts.floor
      ? [`${siteReportFloorTagPrefix}${locationParts.floor}`]
      : []),
    ...(!("legacy" in locationParts) && locationParts.room
      ? [`${siteReportRoomTagPrefix}${locationParts.room}`]
      : []),
    ...(!("legacy" in locationParts) && locationParts.zone
      ? [`${siteReportZoneTagPrefix}${locationParts.zone}`]
      : []),
    ...(!("legacy" in locationParts) && locationParts.viewpoint
      ? [`${siteReportViewpointTagPrefix}${locationParts.viewpoint}`]
      : [])
  ];
}

export function getSiteReportEvidenceKind(asset: EvidenceAsset): SiteReportEvidenceKind {
  const taggedKind = asset.tags
    .find((tag) => tag.startsWith(siteReportKindTagPrefix))
    ?.slice(siteReportKindTagPrefix.length);

  if (taggedKind && siteReportEvidenceKindSet.has(taggedKind as SiteReportEvidenceKind)) {
    return taggedKind as SiteReportEvidenceKind;
  }

  if (asset.type === "site_360") return "360";
  if (asset.type === "site_photo" || asset.type === "defect_photo") return "photo";
  if (asset.type === "receipt") return "receipt";
  if (asset.mimeType.includes("pdf")) return "pdf";
  if (asset.mimeType.startsWith("video/")) return "video";

  return "file";
}

export function getSiteReportEvidenceLocation(asset: EvidenceAsset) {
  const floor = tagValue(asset.tags, siteReportFloorTagPrefix);
  const room = tagValue(asset.tags, siteReportRoomTagPrefix);
  const zone = tagValue(asset.tags, siteReportZoneTagPrefix);
  const viewpoint = tagValue(asset.tags, siteReportViewpointTagPrefix);
  const formattedLocation = [
    floor ? `ชั้น ${floor}` : "",
    room ? `ห้อง ${room}` : "",
    zone ? `โซน ${zone}` : "",
    viewpoint ? `Viewpoint ${viewpoint}` : ""
  ].filter(Boolean).join(" · ");

  return formattedLocation || tagValue(asset.tags, siteReportLocationTagPrefix);
}

export function getSiteReportEvidenceLocationPinId(asset: EvidenceAsset) {
  const floor = tagValue(asset.tags, siteReportFloorTagPrefix);
  const room = tagValue(asset.tags, siteReportRoomTagPrefix);
  const zone = tagValue(asset.tags, siteReportZoneTagPrefix);
  const viewpoint = tagValue(asset.tags, siteReportViewpointTagPrefix);
  const legacy = tagValue(asset.tags, siteReportLocationTagPrefix);

  if (!floor && !room && !zone && !viewpoint && !legacy) {
    return "";
  }

  return ["site-location", floor, room, zone, viewpoint, legacy]
    .map((part) => encodeURIComponent(part.toLocaleLowerCase("th-TH")))
    .join(":");
}

export function buildSiteReportLocationPins(assets: EvidenceAsset[]): SiteReportLocationPin[] {
  const pins = new Map<string, SiteReportLocationPin & { kindSet: Set<SiteReportEvidenceKind> }>();

  assets.forEach((asset) => {
    const id = getSiteReportEvidenceLocationPinId(asset);
    const label = getSiteReportEvidenceLocation(asset);

    if (!id || !label) {
      return;
    }

    const kind = getSiteReportEvidenceKind(asset);
    const latestAt = getLatestAssetTimestamp(asset);
    const existing = pins.get(id);

    if (existing) {
      existing.assetCount += 1;
      existing.assetIds.push(asset.id);
      existing.kindSet.add(kind);
      if (latestAt > existing.latestAt) {
        existing.latestAt = latestAt;
      }
      return;
    }

    pins.set(id, {
      id,
      label,
      floor: tagValue(asset.tags, siteReportFloorTagPrefix),
      room: tagValue(asset.tags, siteReportRoomTagPrefix),
      zone: tagValue(asset.tags, siteReportZoneTagPrefix),
      viewpoint: tagValue(asset.tags, siteReportViewpointTagPrefix),
      assetCount: 1,
      assetIds: [asset.id],
      evidenceKinds: [kind],
      kindSet: new Set([kind]),
      latestAt
    });
  });

  return [...pins.values()]
    .map(({ kindSet, ...pin }) => ({
      ...pin,
      evidenceKinds: [...kindSet].sort()
    }))
    .sort((first, second) => second.latestAt.localeCompare(first.latestAt));
}

export const defectSeverityLabels: Record<DefectSeverity, string> = {
  high: "ด่วน",
  medium: "กลาง",
  low: "เบา"
};

export const defectStatusLabels: Record<DefectStatus, string> = {
  open: "รอแก้",
  fixing: "กำลังแก้",
  review: "ตรวจซ้ำ",
  closed: "แก้แล้ว"
};

export const defectPhotoStages: DefectPhotoStage[] = ["before", "after", "checkpoint"];

export const defectPhotoStageLabels: Record<DefectPhotoStage, string> = {
  before: "ก่อนแก้",
  after: "หลังแก้",
  checkpoint: "จุดตรวจ"
};

function getDefectReportStatus(status: DefectStatus): SiteReportEvent["status"] {
  return status === "closed" || status === "review" ? "answered" : "needs-reply";
}

function getDefectReportStatusLabel(status: DefectStatus) {
  if (status === "closed") return "ปิดประเด็นแล้ว";
  if (status === "review") return "รอตรวจซ้ำ";
  if (status === "fixing") return "กำลังตอบ/แก้ไข";

  return "ต้องตอบกลับ";
}

function getMilestoneReportStatusLabel(status: string) {
  if (status === "paid") return "จ่ายแล้ว";
  if (status === "ready") return "พร้อมตรวจ";

  return "รอตรวจ";
}

export function getLegacyDefectRecords(adapter: StorageAdapter = getStorageAdapter()) {
  return readJson<DefectRecord[]>(adapter, DEFECT_STORAGE_KEY, [], (raw) =>
    Array.isArray(raw)
      ? raw
          .map((record, index) => normalizeDefectRecord(record as Partial<DefectRecord>, index))
          .filter((record) => record.projectKey)
      : []
  );
}

export function removeLegacyDefectRecords(adapter: StorageAdapter = getStorageAdapter()) {
  try {
    adapter.remove(DEFECT_STORAGE_KEY);
  } catch {
    // Storage adapter already guards failures, but keep this helper no-throw.
  }
}

export function loadDefectRecords(
  storedDefects: DefectRecord[] = [],
  adapter: StorageAdapter = getStorageAdapter()
) {
  return storedDefects.length ? storedDefects : getLegacyDefectRecords(adapter);
}

export function formatFileSize(size: number) {
  if (size >= 1_000_000) {
    return `${(size / 1_000_000).toFixed(1)} MB`;
  }

  if (size >= 1_000) {
    return `${Math.round(size / 1_000)} KB`;
  }

  return `${size} B`;
}

export function formatCapturedAt(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(date);
}

export function buildSiteReportEvents(
  defects: DefectRecord[],
  milestones: SiteReportMilestoneInput[] = [],
  evidenceAssets: EvidenceAsset[] = []
) {
  const defectEvents: SiteReportEvent[] = defects.map((defect) => ({
    id: `defect-${defect.id}`,
    type: "comment",
    title: defect.title || "Defect",
    detail: defect.area || defect.note || "ยังไม่ระบุพื้นที่",
    status: getDefectReportStatus(defect.status),
    statusLabel: getDefectReportStatusLabel(defect.status),
    sourceLabel: defectSeverityLabels[defect.severity],
    owner: defect.owner || "ยังไม่ระบุผู้รับผิดชอบ",
    occurredAt: defect.updatedAt || defect.createdAt,
    actionId: defect.id,
    evidenceCount: defect.photos.length
  }));

  const evidenceEvents: SiteReportEvent[] = defects.flatMap((defect) =>
    defect.photos.map((photo) => ({
      id: `photo-${photo.id}`,
      type: "evidence" as const,
      title: photo.caption || photo.name || defect.title || "Site photo",
      detail: defect.area || defect.title || "รูปแนบหน้างาน",
      status: "evidence" as const,
      statusLabel: defectPhotoStageLabels[photo.stage],
      sourceLabel: "Evidence",
      owner: defect.owner || "หน้างาน",
      occurredAt: photo.capturedAt,
      actionId: defect.id,
      evidenceCount: 1
    }))
  );

  const milestoneEvents: SiteReportEvent[] = milestones.map((milestone) => ({
    id: `milestone-${milestone.id}`,
    type: "milestone",
    title: milestone.name || "Milestone",
    detail: milestone.due || "ไม่มีกำหนดตรวจ",
    status: "milestone",
    statusLabel: getMilestoneReportStatusLabel(milestone.status),
    sourceLabel: `${milestone.percent}%`,
    owner: "Project",
    occurredAt: milestone.due || "",
    actionId: null,
    evidenceCount: 0
  }));

  const assetEvents: SiteReportEvent[] = evidenceAssets.map((asset) => {
    const kind = getSiteReportEvidenceKind(asset);
    const location = getSiteReportEvidenceLocation(asset);
    const linkedDefect = asset.links.find((link) => link.targetType === "defect");

    return {
      id: `evidence-${asset.id}`,
      type: "evidence",
      title: asset.title || asset.fileName || "Site evidence",
      detail: [location, asset.description, asset.dataUrl].filter(Boolean).join(" · ") || "Evidence asset",
      status: "evidence",
      statusLabel: siteReportEvidenceKindLabels[kind],
      sourceLabel: asset.sourceAppId || "Evidence",
      owner: asset.uploadedBy || "Evidence",
      occurredAt: asset.capturedAt || asset.updatedAt || asset.uploadedAt,
      actionId: linkedDefect?.targetId ?? null,
      evidenceCount: 1,
      locationPinId: getSiteReportEvidenceLocationPinId(asset)
    };
  });

  return [...defectEvents, ...evidenceEvents, ...assetEvents, ...milestoneEvents].sort((first, second) =>
    second.occurredAt.localeCompare(first.occurredAt)
  );
}

export function filterSiteReportEvents(
  events: SiteReportEvent[],
  filter: SiteReportEventFilter
) {
  if (filter === "all") return events;

  return events.filter((event) => event.status === filter || event.type === filter);
}

export function summarizeSiteReportEvents(events: SiteReportEvent[]): SiteReportSummary {
  return events.reduce<SiteReportSummary>(
    (summary, event) => {
      summary.totalEvents += 1;
      if (event.status === "needs-reply") summary.needsReply += 1;
      if (event.status === "answered") summary.answered += 1;
      if (event.type === "evidence") summary.evidence += 1;
      if (event.type === "milestone") summary.milestones += 1;

      return summary;
    },
    { totalEvents: 0, needsReply: 0, answered: 0, evidence: 0, milestones: 0 }
  );
}

export function createSiteCoordinationReportText(args: {
  projectName: string;
  clientName: string;
  generatedAt: string;
  events: SiteReportEvent[];
}) {
  const rows = args.events.length
    ? args.events.map(
        (event, index) =>
          `${index + 1}. [${event.statusLabel}] ${event.title} - ${event.detail} / ${event.owner}`
      )
    : ["ยังไม่มีเหตุการณ์สำหรับออกรายงาน"];

  return [
    `Site Coordination Report`,
    `Project: ${args.projectName}`,
    `Client: ${args.clientName}`,
    `Generated: ${formatCapturedAt(args.generatedAt)}`,
    "",
    ...rows
  ].join("\n");
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("อ่านไฟล์รูปไม่สำเร็จ"));
    reader.readAsDataURL(file);
  });
}

function loadImageElement(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("โหลดรูปไม่สำเร็จ"));
    image.src = src;
  });
}

export async function createDefectPhotoFromFile(
  file: File,
  stage: DefectPhotoStage
): Promise<DefectPhotoRecord> {
  if (!file.type.startsWith("image/")) {
    throw new Error("รองรับเฉพาะไฟล์รูปภาพ");
  }

  const sourceDataUrl = await readFileAsDataUrl(file);
  const image = await loadImageElement(sourceDataUrl);
  const maxSide = 1600;
  const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("ประมวลผลรูปไม่สำเร็จ");
  }

  context.drawImage(image, 0, 0, width, height);
  const mimeType = file.type === "image/png" ? "image/png" : "image/jpeg";
  const dataUrl = canvas.toDataURL(mimeType, 0.86);

  return normalizeDefectPhotoRecord({
    id: `defect-photo-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: file.name,
    dataUrl,
    mimeType,
    size: file.size,
    stage,
    caption: "",
    capturedAt: new Date().toISOString()
  });
}
