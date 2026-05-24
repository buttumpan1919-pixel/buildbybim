import { describe, expect, it } from "vitest";
import type { EmployeeRecord, ProjectRecord } from "../../../storage";
import { MemoryAdapter } from "../../../storageAdapter";
import {
  DEFAULT_SITE_TEAM_NAME,
  EMPLOYEE_STORAGE_KEY,
  OFFICE_TEAM_NAME,
  getEmployeeAppStats,
  getEmployeeAssignedProjectIds,
  getEmployeeMonthlyTotal,
  getEmployeeProjectOptions,
  loadEmployeeRecords,
  loadEmployeeSiteTeamRecords,
  normalizeEmployeeRecord,
  removeLegacyEmployeeRecords
} from "./employeeService";

function createProject(id: string, name: string): ProjectRecord {
  return {
    id,
    name,
    clientId: null,
    clientName: `${name} client`,
    templateName: "",
    paymentTerms: "",
    notes: "",
    updatedAt: "2026-05-24T00:00:00.000Z"
  };
}

describe("employeeService", () => {
  const projects = [createProject("p1", "Project 1"), createProject("p2", "Project 2")];
  const projectOptions = getEmployeeProjectOptions(projects);

  it("uses fallback project options when workspace projects are empty", () => {
    const options = getEmployeeProjectOptions([]);

    expect(options).toHaveLength(3);
    expect(options[0].id).toBe("project-renovate");
  });

  it("normalizes employee records with project assignment rules", () => {
    const siteEmployee = normalizeEmployeeRecord(
      {
        id: "site-1",
        name: " Site Worker ",
        team: "site",
        teamName: "",
        dailyWage: -500,
        benefit: -10,
        workDays: 99,
        assignedProjectIds: ["unknown"],
        status: "paused" as never
      },
      projectOptions
    );
    const officeEmployee = normalizeEmployeeRecord(
      { id: "office-1", team: "office", assignedProjectIds: [] },
      projectOptions
    );

    expect(siteEmployee.name).toBe("Site Worker");
    expect(siteEmployee.teamName).toBe(DEFAULT_SITE_TEAM_NAME);
    expect(siteEmployee.dailyWage).toBe(0);
    expect(siteEmployee.benefit).toBe(0);
    expect(siteEmployee.workDays).toBe(31);
    expect(siteEmployee.assignedProjectIds).toEqual(["p1"]);
    expect(siteEmployee.status).toBe("active");
    expect(officeEmployee.teamName).toBe(OFFICE_TEAM_NAME);
    expect(officeEmployee.assignedProjectIds).toEqual(["p1", "p2"]);
  });

  it("loads legacy employees through the storage adapter and can remove the legacy key", () => {
    const adapter = new MemoryAdapter();
    adapter.write(
      EMPLOYEE_STORAGE_KEY,
      JSON.stringify([
        {
          id: "legacy-site",
          team: "site",
          teamName: " Legacy Team ",
          position: "Foreman",
          dailyWage: 700,
          benefit: 100,
          workDays: 20,
          assignedProjectIds: ["p2"]
        }
      ])
    );

    const loaded = loadEmployeeRecords(projectOptions, [], adapter);

    expect(loaded).toHaveLength(1);
    expect(loaded[0]).toMatchObject({
      id: "legacy-site",
      team: "site",
      teamName: "Legacy Team",
      assignedProjectIds: ["p2"]
    });

    removeLegacyEmployeeRecords(adapter);
    expect(adapter.read(EMPLOYEE_STORAGE_KEY)).toBeNull();
  });

  it("derives site teams from employees and filters invalid stored projects", () => {
    const employees: EmployeeRecord[] = [
      normalizeEmployeeRecord(
        {
          id: "site-a",
          name: "A",
          team: "site",
          teamName: "Team A",
          assignedProjectIds: ["p2"]
        },
        projectOptions
      ),
      normalizeEmployeeRecord(
        {
          id: "site-b",
          name: "B",
          team: "site",
          teamName: "Team B",
          assignedProjectIds: ["p1"]
        },
        projectOptions
      )
    ];

    const teams = loadEmployeeSiteTeamRecords(
      [{ id: "stored", name: "Team A", projectId: "bad", updatedAt: "old" }],
      employees,
      projectOptions
    );

    expect(teams.map((team) => team.name).sort()).toEqual(["Team A", "Team B"]);
    expect(teams.find((team) => team.name === "Team A")?.projectId).toBe("p1");
    expect(teams.find((team) => team.name === "Team B")?.projectId).toBe("p1");
  });

  it("summarizes employee app stats and monthly cost", () => {
    const employees = [
      normalizeEmployeeRecord(
        {
          id: "office",
          team: "office",
          dailyWage: 1000,
          benefit: 100,
          workDays: 20,
          assignedProjectIds: ["p1", "p2"]
        },
        projectOptions
      ),
      normalizeEmployeeRecord(
        {
          id: "site",
          team: "site",
          teamName: "Team Site",
          dailyWage: 500,
          benefit: 50,
          workDays: 10,
          assignedProjectIds: ["p1"],
          status: "standby"
        },
        projectOptions
      )
    ];

    expect(getEmployeeAssignedProjectIds("site", projectOptions, [])).toEqual(["p1"]);
    expect(getEmployeeMonthlyTotal(employees[0])).toBe(22_000);
    expect(getEmployeeAppStats(employees, [])).toEqual({
      total: 2,
      office: 1,
      site: 1,
      siteTeams: 1,
      active: 1,
      monthly: 22_000
    });
  });
});
