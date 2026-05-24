import { describe, expect, it } from "vitest";
import type { DefectRecord } from "../../../storage";
import { MemoryAdapter } from "../../../storageAdapter";
import {
  DEFECT_STORAGE_KEY,
  buildSiteReportEvents,
  buildSiteReportEvidenceTags,
  buildSiteReportLocationPins,
  createSiteCoordinationReportText,
  createDefectPhotoFromFile,
  defectPhotoStageLabels,
  defectPhotoStages,
  defectSeverityLabels,
  defectStatusLabels,
  filterSiteReportEvents,
  formatCapturedAt,
  formatFileSize,
  getSiteReportEvidenceLocation,
  getSiteReportEvidenceLocationPinId,
  siteReportEvidenceKindLabels,
  loadDefectRecords,
  removeLegacyDefectRecords,
  summarizeSiteReportEvents
} from "./defectService";

describe("defectService", () => {
  it("loads and normalizes legacy defects through the storage adapter", () => {
    const adapter = new MemoryAdapter();
    adapter.write(
      DEFECT_STORAGE_KEY,
      JSON.stringify([
        {
          id: "legacy-1",
          projectKey: "project-a",
          title: "  Crack wall  ",
          severity: "high",
          status: "review",
          photos: [
            {
              id: "photo-1",
              dataUrl: "data:image/jpeg;base64,abc",
              stage: "before",
              size: 1200
            }
          ]
        },
        {
          id: "missing-project",
          projectKey: "",
          title: "Should be filtered"
        }
      ])
    );

    const loaded = loadDefectRecords([], adapter);

    expect(loaded).toHaveLength(1);
    expect(loaded[0]).toMatchObject({
      id: "legacy-1",
      projectKey: "project-a",
      title: "Crack wall",
      severity: "high",
      status: "review"
    });
    expect(loaded[0].photos[0]).toMatchObject({
      id: "photo-1",
      stage: "before",
      size: 1200
    });
  });

  it("prefers stored workspace defects over legacy storage and removes legacy data", () => {
    const adapter = new MemoryAdapter();
    adapter.write(DEFECT_STORAGE_KEY, JSON.stringify([{ id: "legacy", projectKey: "legacy" }]));
    const stored: DefectRecord[] = [
      {
        id: "stored",
        projectKey: "workspace",
        documentId: null,
        title: "Stored defect",
        area: "A",
        due: "Today",
        owner: "Owner",
        note: "",
        severity: "medium",
        status: "open",
        photos: [],
        createdAt: "2026-05-24T00:00:00.000Z",
        updatedAt: "2026-05-24T00:00:00.000Z"
      }
    ];

    expect(loadDefectRecords(stored, adapter)).toBe(stored);
    removeLegacyDefectRecords(adapter);
    expect(adapter.read(DEFECT_STORAGE_KEY)).toBeNull();
  });

  it("exposes labels and formatters used by the panel", () => {
    expect(defectSeverityLabels.high).toBe("ด่วน");
    expect(defectStatusLabels.closed).toBe("แก้แล้ว");
    expect(defectPhotoStages).toEqual(["before", "after", "checkpoint"]);
    expect(defectPhotoStageLabels.checkpoint).toBe("จุดตรวจ");
    expect(siteReportEvidenceKindLabels["360"]).toBe("360");
    expect(buildSiteReportEvidenceTags("360", {
      floor: "2",
      room: "Living",
      zone: "A",
      viewpoint: "VP-01"
    })).toEqual([
      "site-report",
      "site-kind:360",
      "site-floor:2",
      "site-room:Living",
      "site-zone:A",
      "site-viewpoint:VP-01"
    ]);
    expect(formatFileSize(999)).toBe("999 B");
    expect(formatFileSize(1_200)).toBe("1 KB");
    expect(formatFileSize(1_250_000)).toBe("1.3 MB");
    expect(formatCapturedAt("not-a-date")).toBe("-");
  });

  it("rejects non-image uploads before image processing", async () => {
    const file = new File(["hello"], "note.txt", { type: "text/plain" });

    await expect(createDefectPhotoFromFile(file, "before")).rejects.toThrow("รูปภาพ");
  });

  it("builds filtered site coordination report events from defects, photos, and milestones", () => {
    const defects: DefectRecord[] = [
      {
        id: "defect-open",
        projectKey: "project-a",
        documentId: "doc-1",
        title: "ผนังแตกร้าว",
        area: "ชั้น 2",
        due: "2026-05-25",
        owner: "Site engineer",
        note: "",
        severity: "high",
        status: "open",
        photos: [
          {
            id: "photo-before",
            name: "before.jpg",
            dataUrl: "data:image/jpeg;base64,abc",
            mimeType: "image/jpeg",
            size: 1200,
            stage: "before",
            caption: "ก่อนซ่อม",
            capturedAt: "2026-05-24T09:00:00.000Z"
          }
        ],
        createdAt: "2026-05-24T08:00:00.000Z",
        updatedAt: "2026-05-24T10:00:00.000Z"
      },
      {
        id: "defect-closed",
        projectKey: "project-a",
        documentId: null,
        title: "เก็บสีขอบหน้าต่าง",
        area: "ห้องนอน",
        due: "",
        owner: "Foreman",
        note: "",
        severity: "low",
        status: "closed",
        photos: [],
        createdAt: "2026-05-23T08:00:00.000Z",
        updatedAt: "2026-05-23T12:00:00.000Z"
      }
    ];

    const events = buildSiteReportEvents(
      defects,
      [{ id: 1, name: "งวดงานโครงสร้าง", due: "2026-05-22", percent: 40, status: "ready" }],
      [
        {
          id: "evidence-360",
          workspaceId: "local-workspace",
          type: "site_360",
          status: "draft",
          title: "360 view",
          description: "",
          fileName: "360 view",
          mimeType: "",
          size: 0,
          dataUrl: "",
          storageBucket: "",
          storagePath: "",
          amount: 0,
          currency: "THB",
          capturedAt: "2026-05-24T11:00:00.000Z",
          uploadedAt: "2026-05-24T11:00:00.000Z",
          uploadedBy: "",
          verifiedAt: "",
          verifiedBy: "",
          rejectedReason: "",
          sourceAppId: "defectTracker",
          sourceDocumentId: "",
          tags: ["site-report", "site-kind:360", "site-floor:2", "site-room:โถงกลาง", "site-zone:A"],
          links: [{ id: "link-project", targetType: "project", targetId: "project-a", label: "Project A", createdAt: "2026-05-24T11:00:00.000Z" }],
          createdAt: "2026-05-24T11:00:00.000Z",
          updatedAt: "2026-05-24T11:00:00.000Z"
        }
      ]
    );
    const summary = summarizeSiteReportEvents(events);

    expect(events).toHaveLength(5);
    expect(events[0]).toMatchObject({
      title: "360 view",
      detail: "ชั้น 2 · ห้อง โถงกลาง · โซน A"
    });
    expect(filterSiteReportEvents(events, "needs-reply")).toHaveLength(1);
    expect(filterSiteReportEvents(events, "answered")).toHaveLength(1);
    expect(filterSiteReportEvents(events, "evidence")).toHaveLength(2);
    expect(summary).toEqual({
      totalEvents: 5,
      needsReply: 1,
      answered: 1,
      evidence: 2,
      milestones: 1
    });
  });

  it("falls back to legacy location tag for older site evidence", () => {
    expect(
      getSiteReportEvidenceLocation({
        id: "legacy-evidence",
        workspaceId: "local-workspace",
        type: "site_file",
        status: "draft",
        title: "Old evidence",
        description: "",
        fileName: "",
        mimeType: "",
        size: 0,
        dataUrl: "",
        storageBucket: "",
        storagePath: "",
        amount: 0,
        currency: "THB",
        capturedAt: "",
        uploadedAt: "",
        uploadedBy: "",
        verifiedAt: "",
        verifiedBy: "",
        rejectedReason: "",
        sourceAppId: "defectTracker",
        sourceDocumentId: "",
        tags: ["site-report", "location:ชั้น 1 / โถง"],
        links: [],
        createdAt: "",
        updatedAt: ""
      })
    ).toBe("ชั้น 1 / โถง");
  });

  it("groups site report evidence into location pins", () => {
    const baseAsset = {
      workspaceId: "local-workspace",
      status: "draft" as const,
      description: "",
      fileName: "",
      mimeType: "",
      size: 0,
      dataUrl: "",
      storageBucket: "",
      storagePath: "",
      amount: 0,
      currency: "THB",
      capturedAt: "",
      uploadedAt: "",
      uploadedBy: "",
      verifiedAt: "",
      verifiedBy: "",
      rejectedReason: "",
      sourceAppId: "defectTracker",
      sourceDocumentId: "",
      links: [],
      createdAt: "2026-05-24T09:00:00.000Z",
      updatedAt: "2026-05-24T09:00:00.000Z"
    };
    const firstAsset = {
      ...baseAsset,
      id: "asset-1",
      type: "site_360" as const,
      title: "Viewpoint 1",
      tags: ["site-report", "site-kind:360", "site-floor:2", "site-room:Living", "site-zone:A", "site-viewpoint:VP-01"],
      updatedAt: "2026-05-24T10:00:00.000Z"
    };
    const secondAsset = {
      ...baseAsset,
      id: "asset-2",
      type: "site_file" as const,
      title: "Weekly PDF",
      tags: ["site-report", "site-kind:pdf", "site-floor:2", "site-room:Living", "site-zone:A", "site-viewpoint:VP-01"],
      updatedAt: "2026-05-24T12:00:00.000Z"
    };
    const legacyAsset = {
      ...baseAsset,
      id: "asset-3",
      type: "site_file" as const,
      title: "Legacy location",
      tags: ["site-report", "location:เธเธฑเนเธ 1 / เนเธ–เธ"],
      updatedAt: "2026-05-24T08:00:00.000Z"
    };
    const noLocationAsset = {
      ...baseAsset,
      id: "asset-4",
      type: "site_file" as const,
      title: "No location",
      tags: ["site-report", "site-kind:file"]
    };

    const pins = buildSiteReportLocationPins([
      firstAsset,
      secondAsset,
      legacyAsset,
      noLocationAsset
    ]);

    expect(getSiteReportEvidenceLocationPinId(firstAsset)).toBe(
      getSiteReportEvidenceLocationPinId(secondAsset)
    );
    expect(pins).toHaveLength(2);
    expect(pins[0]).toMatchObject({
      floor: "2",
      room: "Living",
      zone: "A",
      viewpoint: "VP-01",
      assetCount: 2,
      assetIds: ["asset-1", "asset-2"],
      latestAt: "2026-05-24T12:00:00.000Z"
    });
    expect(pins[0].label).toContain("Living");
    expect(pins[0].label).toContain("VP-01");
    expect(pins[0].evidenceKinds).toEqual(["360", "pdf"]);
    expect(pins[1]).toMatchObject({
      assetCount: 1,
      assetIds: ["asset-3"]
    });
  });

  it("formats a site coordination report for copy/export", () => {
    const report = createSiteCoordinationReportText({
      projectName: "บ้านพัก A",
      clientName: "คุณเอ",
      generatedAt: "2026-05-24T12:00:00.000Z",
      events: [
        {
          id: "defect-1",
          type: "comment",
          title: "ตรวจผนัง",
          detail: "ชั้น 1",
          status: "needs-reply",
          statusLabel: "ต้องตอบกลับ",
          sourceLabel: "ด่วน",
          owner: "Site engineer",
          occurredAt: "2026-05-24T11:00:00.000Z",
          actionId: "defect-1",
          evidenceCount: 2
        }
      ]
    });

    expect(report).toContain("Site Coordination Report");
    expect(report).toContain("Project: บ้านพัก A");
    expect(report).toContain("[ต้องตอบกลับ] ตรวจผนัง - ชั้น 1 / Site engineer");
  });
});
