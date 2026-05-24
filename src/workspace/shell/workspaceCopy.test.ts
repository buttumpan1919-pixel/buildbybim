import { describe, expect, it } from "vitest";

import { getWorkspaceApp } from "../../apps";
import { getWorkspaceAppCopy, getWorkspaceGroupCopy, getWorkspaceSubnavCopy, workspaceShellCopy } from "./workspaceCopy";
import { workspaceAppGroups } from "./workspaceGroups";
import { workspaceAppSubnavItems } from "./workspaceRouting";

describe("workspaceCopy", () => {
  it("returns localized app labels for sidebar and breadcrumbs", () => {
    const evidenceApp = getWorkspaceApp("evidence");
    const constructionPlannerApp = getWorkspaceApp("constructionPlanner");

    expect(getWorkspaceAppCopy(evidenceApp, "th")).toMatchObject({
      label: "หลักฐาน",
      shortLabel: "หลักฐาน"
    });
    expect(getWorkspaceAppCopy(evidenceApp, "en")).toMatchObject({
      label: "Evidence",
      shortLabel: "Evidence"
    });
    expect(getWorkspaceAppCopy(constructionPlannerApp, "th")).toMatchObject({
      label: "แผนงานก่อสร้าง",
      shortLabel: "แผนงาน"
    });
    expect(getWorkspaceAppCopy(constructionPlannerApp, "en")).toMatchObject({
      label: "Construction Planner",
      shortLabel: "Plan"
    });
  });

  it("returns localized group labels for the app switcher", () => {
    const projectGroup = workspaceAppGroups.find((group) => group.id === "project");

    expect(projectGroup).toBeDefined();
    expect(getWorkspaceGroupCopy(projectGroup!, "th")).toEqual({
      label: "งานโครงการ",
      detail: "Hub · แผนงาน · เอกสาร · BOQ"
    });
    expect(getWorkspaceGroupCopy(projectGroup!, "en")).toEqual({
      label: "Project Work",
      detail: "Hub · Plan · Docs · BOQ"
    });
  });

  it("returns localized subnav labels for active app tabs", () => {
    const evidenceLibraryTab = workspaceAppSubnavItems.evidence[0];
    const plannerScheduleTab = workspaceAppSubnavItems.constructionPlanner[1];
    const adminProjectAccessTab = workspaceAppSubnavItems.admin.find((item) => item.key === "project-access");

    expect(getWorkspaceSubnavCopy("evidence", evidenceLibraryTab, "th")).toEqual({
      label: "คลัง",
      detail: "ไฟล์ · หลักฐาน"
    });
    expect(getWorkspaceSubnavCopy("evidence", evidenceLibraryTab, "en")).toEqual(evidenceLibraryTab);
    expect(getWorkspaceSubnavCopy("constructionPlanner", plannerScheduleTab, "th")).toEqual({
      label: "แผนงาน",
      detail: "Gantt · งาน"
    });
    expect(getWorkspaceSubnavCopy("constructionPlanner", plannerScheduleTab, "en")).toEqual({
      label: "Schedule",
      detail: "Gantt · Tasks"
    });
    expect(adminProjectAccessTab).toBeDefined();
    expect(getWorkspaceSubnavCopy("admin", adminProjectAccessTab!, "th")).toEqual({
      label: "สิทธิ์โครงการ",
      detail: "บทบาท · สิทธิ์"
    });
  });

  it("uses Thai copy for shared sidebar shell labels", () => {
    expect(workspaceShellCopy.th.apps).toBe("แอป");
    expect(workspaceShellCopy.th.publicSite).toBe("เว็บหลัก");
    expect(workspaceShellCopy.th.documentsInBuildDocs).toBe("{count} เอกสารใน BuildDocs");
    expect(workspaceShellCopy.th.accessRequiredTitle).toBe("{app} ต้องอัปเกรดก่อนใช้งาน");
    expect(workspaceShellCopy.th.viewPlans).toBe("ดูแผน Support");
    expect(workspaceShellCopy.th.languageLabel).toBe("ภาษา");
    expect(workspaceShellCopy.th.savedDocuments).toBe("เอกสารที่บันทึก");
    expect(workspaceShellCopy.th.billingDocument).toBe("ใบวางบิลงวดงาน");
    expect(workspaceShellCopy.en.apps).toBe("Apps");
    expect(workspaceShellCopy.en.publicSite).toBe("Public");
    expect(workspaceShellCopy.en.documentsInBuildDocs).toBe("{count} documents in BuildDocs");
    expect(workspaceShellCopy.en.accessRequiredTitle).toBe("{app} requires an upgrade");
    expect(workspaceShellCopy.en.viewPlans).toBe("View plans");
    expect(workspaceShellCopy.en.languageLabel).toBe("Language");
    expect(workspaceShellCopy.en.savedDocuments).toBe("Saved documents");
    expect(workspaceShellCopy.en.billingDocument).toBe("Progress billing");
  });
});
