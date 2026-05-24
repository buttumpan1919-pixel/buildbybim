import { beforeEach, describe, expect, it } from "vitest";
import {
  APP_VERSION_SELECTION_STORAGE_KEY,
  buildWorkspaceRoute,
  getWorkspaceAppIdFromPath,
  getWorkspaceRouteFromLocation,
  loadWorkspaceAppVersionSelection,
  normalizeSubnavKey,
  normalizeWorkspaceAppVersionId,
  saveWorkspaceAppVersionSelection
} from "./workspaceRouting";

describe("workspaceRouting", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.replaceState({}, "", "/hub?tab=overview&version=0.1");
  });

  it("resolves workspace apps from route bases", () => {
    expect(getWorkspaceAppIdFromPath("/")).toBe("hub");
    expect(getWorkspaceAppIdFromPath("/hub")).toBe("hub");
    expect(getWorkspaceAppIdFromPath("/hub/overview")).toBe("hub");
    expect(getWorkspaceAppIdFromPath("/boq-data/task")).toBe("boqData");
    expect(getWorkspaceAppIdFromPath("/cost-codes/catalog")).toBe("costCodes");
    expect(getWorkspaceAppIdFromPath("/suppliers/detail")).toBe("suppliers");
    expect(getWorkspaceAppIdFromPath("/project-control/reports")).toBe("projectControl");
    expect(getWorkspaceAppIdFromPath("/evidence/intake")).toBe("evidence");
    expect(getWorkspaceAppIdFromPath("/construction-planner")).toBe("constructionPlanner");
    expect(getWorkspaceAppIdFromPath("/unknown")).toBe("hub");
  });

  it("normalizes subnav keys per app", () => {
    expect(normalizeSubnavKey("builddocs", "clients")).toBe("clients");
    expect(normalizeSubnavKey("builddocs", "bad")).toBe("documents");
    expect(normalizeSubnavKey("designStudio", "gallery")).toBe("gallery");
    expect(normalizeSubnavKey("designStudio", "bad")).toBe("envision");
    expect(normalizeSubnavKey("library", "trash")).toBe("trash");
    expect(normalizeSubnavKey("library", "bad")).toBe("images");
    expect(normalizeSubnavKey("suppliers", "price-history")).toBe("price-history");
    expect(normalizeSubnavKey("suppliers", "bad")).toBe("directory");
    expect(normalizeSubnavKey("projectControl", "reports")).toBe("reports");
    expect(normalizeSubnavKey("projectControl", "bad")).toBe("dashboard");
    expect(normalizeSubnavKey("constructionPlanner", "schedule")).toBe("schedule");
    expect(normalizeSubnavKey("constructionPlanner", "bad")).toBe("overview");
    expect(normalizeSubnavKey("defectTracker", "site-report")).toBe("site-report");
    expect(normalizeSubnavKey("defectTracker", "bad")).toBe("overview");
    expect(normalizeSubnavKey("evidence", "intake")).toBe("intake");
    expect(normalizeSubnavKey("evidence", "bad")).toBe("library");
    expect(normalizeSubnavKey("admin", "project-access")).toBe("project-access");
    expect(normalizeSubnavKey("admin", "bad")).toBe("overview");
  });

  it("builds stable routes with normalized tab and version query", () => {
    expect(buildWorkspaceRoute("suppliers", "price-history", "0.1")).toBe(
      "/suppliers?tab=price-history&version=0.1"
    );
    expect(buildWorkspaceRoute("suppliers", "bad", "missing")).toBe(
      "/suppliers?tab=directory&version=0.1"
    );
    expect(buildWorkspaceRoute("boqData", "database")).toBe("/boq-data?tab=database&version=0.1");
    expect(buildWorkspaceRoute("projectControl", "reports")).toBe(
      "/project-control?tab=reports&version=0.1"
    );
    expect(buildWorkspaceRoute("constructionPlanner", "curve")).toBe(
      "/construction-planner?tab=curve&version=0.1"
    );
    expect(buildWorkspaceRoute("evidence", "links")).toBe(
      "/evidence?tab=links&version=0.1"
    );
    expect(buildWorkspaceRoute("defectTracker", "site-report")).toBe(
      "/defect?tab=site-report&version=0.1"
    );
    expect(buildWorkspaceRoute("admin", "project-access")).toBe(
      "/admin?tab=project-access&version=0.1"
    );
  });

  it("reads and normalizes route state from window.location", () => {
    window.history.replaceState({}, "", "/suppliers?tab=price-history&version=0.1");

    expect(getWorkspaceRouteFromLocation()).toEqual({
      appId: "suppliers",
      tabKey: "price-history",
      versionId: "0.1"
    });

    window.history.replaceState({}, "", "/suppliers?tab=bad&version=bad");

    expect(getWorkspaceRouteFromLocation()).toEqual({
      appId: "suppliers",
      tabKey: "directory",
      versionId: "0.1"
    });
  });

  it("normalizes app version ids", () => {
    expect(normalizeWorkspaceAppVersionId("suppliers", "0.1")).toBe("0.1");
    expect(normalizeWorkspaceAppVersionId("suppliers", "missing")).toBe("0.1");
    expect(normalizeWorkspaceAppVersionId("suppliers", null)).toBe("0.1");
  });

  it("loads and saves app version selections defensively", () => {
    window.localStorage.setItem(APP_VERSION_SELECTION_STORAGE_KEY, "{bad json");
    expect(loadWorkspaceAppVersionSelection()).toEqual({});

    saveWorkspaceAppVersionSelection({
      suppliers: "0.1",
      boqData: "missing"
    });

    expect(loadWorkspaceAppVersionSelection()).toMatchObject({
      suppliers: "0.1",
      boqData: "0.1"
    });
  });
});
