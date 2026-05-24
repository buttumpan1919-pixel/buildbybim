import { describe, expect, it } from "vitest";
import { MemoryAdapter } from "../../../storageAdapter";
import {
  SITE_REPORT_PINS_STORAGE_KEY,
  SITE_REPORT_PLANS_STORAGE_KEY,
  createSiteReportPlan,
  createSiteReportPlanPin,
  filterSiteReportPinsByPlan,
  filterSiteReportPlansByProject,
  loadSiteReportPlanPins,
  loadSiteReportPlans,
  nextSiteReportPinNo,
  saveSiteReportPlanPins,
  saveSiteReportPlans,
  upsertSiteReportPlan,
  upsertSiteReportPlanPin
} from "./siteReportService";

describe("siteReportService", () => {
  it("normalizes and persists Site Report plans", () => {
    const adapter = new MemoryAdapter();
    adapter.write(
      SITE_REPORT_PLANS_STORAGE_KEY,
      JSON.stringify([
        {
          id: "plan-1",
          projectId: "project-a",
          name: "  Floor 2  ",
          planType: "floor_plan",
          floor: "2",
          revision: "R1",
          imageUrl: "https://example.com/floor-2.png",
          createdAt: "2026-05-25T00:00:00.000Z",
          updatedAt: "2026-05-25T00:00:00.000Z"
        },
        {
          id: "missing-project",
          projectId: "",
          name: "Should be ignored"
        }
      ])
    );

    const plans = loadSiteReportPlans(adapter);

    expect(plans).toHaveLength(1);
    expect(plans[0]).toMatchObject({
      id: "plan-1",
      projectId: "project-a",
      name: "Floor 2",
      floor: "2",
      imageUrl: "https://example.com/floor-2.png"
    });

    saveSiteReportPlans(plans, adapter);
    expect(adapter.read(SITE_REPORT_PLANS_STORAGE_KEY)).toContain("Floor 2");
  });

  it("creates and upserts project-scoped plan pins with clamped coordinates", () => {
    const plan = createSiteReportPlan({
      id: "plan-a",
      projectId: "project-a",
      name: "Main plan"
    });
    const pin = createSiteReportPlanPin({
      id: "pin-a",
      projectId: "project-a",
      planId: plan.id,
      pinNo: 2,
      label: "Living",
      x: 140,
      y: -10,
      linkedLocationPinId: "site-location:2:living:a:vp-01:"
    });

    const nextPlans = upsertSiteReportPlan([], plan);
    const nextPins = upsertSiteReportPlanPin([], pin);

    expect(nextPlans).toHaveLength(1);
    expect(nextPins[0]).toMatchObject({
      id: "pin-a",
      pinNo: 2,
      label: "Living",
      x: 100,
      y: 0,
      linkedLocationPinId: "site-location:2:living:a:vp-01:"
    });
  });

  it("filters pins by active plan and suggests the next pin number", () => {
    const pins = [
      createSiteReportPlanPin({ id: "pin-1", projectId: "project-a", planId: "plan-a", pinNo: 1 }),
      createSiteReportPlanPin({ id: "pin-2", projectId: "project-a", planId: "plan-a", pinNo: 3 }),
      createSiteReportPlanPin({ id: "pin-3", projectId: "project-a", planId: "plan-b", pinNo: 2 })
    ];

    expect(filterSiteReportPinsByPlan(pins, "plan-a")).toHaveLength(2);
    expect(nextSiteReportPinNo(pins, "plan-a")).toBe(4);
    expect(nextSiteReportPinNo(pins, "new-plan")).toBe(1);
  });

  it("saves and loads pins through the storage adapter", () => {
    const adapter = new MemoryAdapter();
    const pins = [
      createSiteReportPlanPin({
        id: "pin-a",
        projectId: "project-a",
        planId: "plan-a",
        pinNo: 1,
        floor: "2",
        room: "Living"
      })
    ];

    saveSiteReportPlanPins(pins, adapter);

    expect(adapter.read(SITE_REPORT_PINS_STORAGE_KEY)).not.toBeNull();
    expect(loadSiteReportPlanPins(adapter)[0]).toMatchObject({
      id: "pin-a",
      floor: "2",
      room: "Living"
    });
  });

  it("filters plans by project", () => {
    const plans = [
      createSiteReportPlan({ id: "plan-a", projectId: "project-a", name: "A" }),
      createSiteReportPlan({ id: "plan-b", projectId: "project-b", name: "B" })
    ];

    expect(filterSiteReportPlansByProject(plans, "project-a")).toEqual([plans[0]]);
  });
});
