import { beforeEach, describe, expect, it } from "vitest";
import type { AppData } from "./storage";
import {
  calculateTotal,
  createDocumentRecord,
  initialAppData,
  loadWorkspaceData,
  normalizeImportedWorkspace,
  saveWorkspaceData
} from "./storage";

function resetStorage() {
  window.localStorage.clear();
}

function makeDocumentData(overrides: Partial<AppData> = {}): AppData {
  return {
    ...initialAppData,
    ...overrides,
    documentInfo: {
      ...initialAppData.documentInfo,
      clientName: "Client A",
      projectName: "Project A",
      ...overrides.documentInfo
    },
    items: overrides.items ?? [
      { id: 1, name: "Work A", unit: "job", qty: 2, price: 1000 },
      { id: 2, name: "Work B", unit: "sqm", qty: 1.5, price: 2000 }
    ],
    milestones: overrides.milestones ?? initialAppData.milestones
  };
}

describe("calculateTotal", () => {
  it("adds VAT and subtracts withholding from subtotal", () => {
    const total = calculateTotal(
      makeDocumentData({
        vatEnabled: true,
        withholdingEnabled: true
      })
    );

    expect(total).toBe(5200);
  });

  it("uses the selected milestone percent for invoice totals", () => {
    const total = calculateTotal(
      makeDocumentData({
        docType: "invoice",
        vatEnabled: false,
        withholdingEnabled: false,
        selectedBillingMilestoneId: 2,
        milestones: [
          { id: 1, name: "Deposit", percent: 30, due: "start", status: "paid" },
          { id: 2, name: "Structure", percent: 40, due: "mid", status: "ready" }
        ]
      })
    );

    expect(total).toBe(2000);
  });

  it("does not use milestone percent for quote totals", () => {
    const total = calculateTotal(
      makeDocumentData({
        docType: "quote",
        vatEnabled: false,
        withholdingEnabled: false,
        selectedBillingMilestoneId: 2,
        milestones: [
          { id: 1, name: "Deposit", percent: 30, due: "start", status: "paid" },
          { id: 2, name: "Structure", percent: 40, due: "mid", status: "ready" }
        ]
      })
    );

    expect(total).toBe(5000);
  });
});

describe("workspace normalization", () => {
  beforeEach(resetStorage);

  it("loads an initial workspace when storage is empty", () => {
    const workspace = loadWorkspaceData();

    expect(workspace.documents.length).toBeGreaterThan(0);
    expect(workspace.activeDocumentId).toBe(workspace.documents[0].id);
    expect(workspace.clients.length).toBeGreaterThan(0);
    expect(workspace.projects.length).toBeGreaterThan(0);
  });

  it("normalizes imported workspace documents, active id, people, teams, and defects", () => {
    const older = createDocumentRecord(makeDocumentData(), {
      id: "doc-old",
      title: "Old",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z"
    });
    const newer = createDocumentRecord(
      makeDocumentData({
        documentInfo: {
          ...initialAppData.documentInfo,
          clientName: "Client B",
          projectName: "Project B"
        }
      }),
      {
        id: "doc-new",
        title: "New",
        createdAt: "2024-03-01T00:00:00.000Z",
        updatedAt: "2024-03-01T00:00:00.000Z"
      }
    );

    const workspace = normalizeImportedWorkspace({
      activeDocumentId: "missing-id",
      documents: [older, newer],
      clients: [],
      projects: [],
      employees: [
        {
          id: "employee-1",
          name: "Site Lead",
          team: "site",
          teamName: "Team Alpha",
          dailyWage: "bad",
          benefit: "bad",
          workDays: "bad",
          assignedProjectIds: ["project-1", 99],
          status: "unknown"
        }
      ],
      defects: [
        {
          id: "defect-1",
          projectKey: "project-1",
          title: "",
          severity: "critical",
          status: "done",
          photos: [
            {
              dataUrl: "data:image/png;base64,abc",
              stage: "invalid",
              size: "bad"
            }
          ]
        }
      ]
    });

    expect(workspace.documents.map((document) => document.id)).toEqual(["doc-new", "doc-old"]);
    expect(workspace.activeDocumentId).toBe("doc-new");
    expect(workspace.clients.map((client) => client.name)).toContain("Client B");
    expect(workspace.projects.map((project) => project.name)).toContain("Project B");
    expect(workspace.employees[0]).toMatchObject({
      id: "employee-1",
      team: "site",
      dailyWage: 650,
      benefit: 80,
      workDays: 26,
      assignedProjectIds: ["project-1"],
      status: "active"
    });
    expect(workspace.siteTeams[0]).toMatchObject({
      name: "Team Alpha",
      projectId: "project-1"
    });
    expect(workspace.defects[0]).toMatchObject({
      id: "defect-1",
      projectKey: "project-1",
      severity: "medium",
      status: "open"
    });
    expect(workspace.defects[0].photos[0]).toMatchObject({
      stage: "checkpoint",
      size: 0
    });
  });

  it("preserves site teams when saving a partial legacy-shaped workspace", () => {
    const current = loadWorkspaceData();
    const withTeam = {
      ...current,
      siteTeams: [
        {
          id: "site-team-1",
          name: "Saved Team",
          projectId: "project-1",
          updatedAt: "2024-01-01T00:00:00.000Z"
        }
      ]
    };
    saveWorkspaceData(withTeam);
    saveWorkspaceData({
      activeDocumentId: withTeam.activeDocumentId,
      documents: withTeam.documents,
      clients: withTeam.clients,
      projects: withTeam.projects,
      employees: withTeam.employees,
      defects: withTeam.defects
    });

    expect(loadWorkspaceData().siteTeams).toEqual(withTeam.siteTeams);
  });

  it("rejects invalid backup payloads", () => {
    expect(() => normalizeImportedWorkspace(null)).toThrow();
    expect(() => normalizeImportedWorkspace("bad")).toThrow();
  });
});
