import type {
  EmployeeRecord,
  EmployeeSiteTeamRecord,
  EmployeeStatus,
  EmployeeTeamType,
  ProjectRecord
} from "../../../storage";
import { getStorageAdapter, readJson, type StorageAdapter } from "../../../storageAdapter";

export const EMPLOYEE_STORAGE_KEY = "employees.workspace.v1";

export type EmployeeProjectOption = Pick<ProjectRecord, "id" | "name" | "clientName">;

export const OFFICE_TEAM_NAME = "ออฟฟิศ";
export const DEFAULT_SITE_TEAM_NAME = "ทีมหน้างาน 1";

export const fallbackEmployeeProjects: EmployeeProjectOption[] = [
  { id: "project-renovate", name: "รีโนเวทบ้านพัก 2 ชั้น", clientName: "ลูกค้าหลัก" },
  { id: "project-mep", name: "งานระบบ MEP", clientName: "ไซต์ย่อย" },
  { id: "project-extension", name: "ต่อเติมครัวหลังบ้าน", clientName: "งานระยะสั้น" }
];

export function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
}

export function getEmployeeProjectOptions(projects: ProjectRecord[]): EmployeeProjectOption[] {
  return projects.length
    ? projects.map((project) => ({
        id: project.id,
        name: project.name,
        clientName: project.clientName
      }))
    : fallbackEmployeeProjects;
}

export function getEmployeeAssignedProjectIds(
  team: EmployeeTeamType,
  projectOptions: EmployeeProjectOption[],
  assignedProjectIds: string[] = []
) {
  const validProjectIds = new Set(projectOptions.map((project) => project.id));
  const validAssignments = assignedProjectIds.filter((id) => validProjectIds.has(id));

  if (team === "site") {
    return [validAssignments[0] ?? projectOptions[0]?.id ?? ""].filter(Boolean);
  }

  return validAssignments.length
    ? validAssignments
    : projectOptions.slice(0, Math.min(2, projectOptions.length)).map((project) => project.id);
}

export function normalizeEmployeeRecord(
  record: Partial<EmployeeRecord>,
  projectOptions: EmployeeProjectOption[],
  index = 0
): EmployeeRecord {
  const team: EmployeeTeamType = record.team === "site" ? "site" : "office";
  const status: EmployeeStatus = record.status === "standby" ? "standby" : "active";
  const teamName =
    team === "office" ? OFFICE_TEAM_NAME : record.teamName?.trim() || DEFAULT_SITE_TEAM_NAME;

  return {
    id: record.id ?? `employee-${Date.now()}-${index}`,
    name: record.name?.trim() || "พนักงานใหม่",
    team,
    teamName,
    position: record.position?.trim() || (team === "office" ? "ธุรการออฟฟิศ" : "ช่างประจำไซต์"),
    dailyWage: typeof record.dailyWage === "number" ? Math.max(0, record.dailyWage) : 650,
    benefit: typeof record.benefit === "number" ? Math.max(0, record.benefit) : 80,
    workDays: typeof record.workDays === "number" ? clampNumber(record.workDays, 0, 31) : 26,
    assignedProjectIds: getEmployeeAssignedProjectIds(
      team,
      projectOptions,
      record.assignedProjectIds
    ),
    status
  };
}

export function createEmployeeSiteTeamRecord(
  name: string,
  projectId: string,
  index = 0
): EmployeeSiteTeamRecord {
  return {
    id: `site-team-${Date.now()}-${index}-${Math.random().toString(16).slice(2)}`,
    name: name.trim() || DEFAULT_SITE_TEAM_NAME,
    projectId,
    updatedAt: new Date().toISOString()
  };
}

export function getEmployeeTeamName(employee: Pick<EmployeeRecord, "team" | "teamName">) {
  return employee.team === "office"
    ? OFFICE_TEAM_NAME
    : employee.teamName.trim() || DEFAULT_SITE_TEAM_NAME;
}

export function loadEmployeeSiteTeamRecords(
  storedSiteTeams: Partial<EmployeeSiteTeamRecord>[] = [],
  employees: EmployeeRecord[] = [],
  projectOptions: EmployeeProjectOption[] = []
) {
  const fallbackProjectId = projectOptions[0]?.id ?? "";
  const records: EmployeeSiteTeamRecord[] = [];
  const names = new Set<string>();

  storedSiteTeams.forEach((record, index) => {
    const name = record.name?.trim();

    if (!name || names.has(name)) {
      return;
    }

    names.add(name);
    records.push({
      id: record.id ?? `site-team-${Date.now()}-${index}`,
      name,
      projectId:
        projectOptions.some((project) => project.id === record.projectId)
          ? record.projectId ?? fallbackProjectId
          : fallbackProjectId,
      updatedAt: record.updatedAt ?? new Date().toISOString()
    });
  });

  employees
    .filter((employee) => employee.team === "site")
    .forEach((employee, index) => {
      const name = getEmployeeTeamName(employee);

      if (names.has(name)) {
        return;
      }

      names.add(name);
      records.push(
        createEmployeeSiteTeamRecord(
          name,
          employee.assignedProjectIds[0] ?? fallbackProjectId,
          records.length + index
        )
      );
    });

  if (!records.length) {
    records.push(createEmployeeSiteTeamRecord(DEFAULT_SITE_TEAM_NAME, fallbackProjectId, 0));
  }

  return records.sort((a, b) => a.name.localeCompare(b.name, "th-TH"));
}

export function createInitialEmployeeRecords(projectOptions: EmployeeProjectOption[]): EmployeeRecord[] {
  const firstProject = projectOptions[0]?.id ?? "";
  const secondProject = projectOptions[1]?.id ?? firstProject;
  const allProjects = projectOptions.map((project) => project.id);

  return [
    normalizeEmployeeRecord(
      {
        id: "emp-office-project-manager",
        name: "สมชาย ผู้จัดการโครงการ",
        team: "office",
        teamName: OFFICE_TEAM_NAME,
        position: "ผู้จัดการโครงการ",
        dailyWage: 950,
        benefit: 140,
        workDays: 26,
        assignedProjectIds: allProjects,
        status: "active"
      },
      projectOptions,
      0
    ),
    normalizeEmployeeRecord(
      {
        id: "emp-office-admin",
        name: "อนันต์ ธุรการไซต์",
        team: "office",
        teamName: OFFICE_TEAM_NAME,
        position: "ประสานงานโครงการ",
        dailyWage: 760,
        benefit: 100,
        workDays: 26,
        assignedProjectIds: [firstProject, secondProject],
        status: "active"
      },
      projectOptions,
      1
    ),
    normalizeEmployeeRecord(
      {
        id: "emp-site-helper",
        name: "วิทยา ผู้ช่วยไซต์",
        team: "site",
        teamName: "ทีมโครงสร้าง",
        position: "ผู้ช่วยช่าง",
        dailyWage: 520,
        benefit: 70,
        workDays: 26,
        assignedProjectIds: [firstProject],
        status: "active"
      },
      projectOptions,
      2
    ),
    normalizeEmployeeRecord(
      {
        id: "emp-site-mep",
        name: "พรชัย ช่างระบบ",
        team: "site",
        teamName: "ทีมระบบ",
        position: "ช่างไฟ/สุขาภิบาล",
        dailyWage: 690,
        benefit: 90,
        workDays: 24,
        assignedProjectIds: [secondProject],
        status: "active"
      },
      projectOptions,
      3
    )
  ];
}

export function getLegacyEmployeeRecords(adapter: StorageAdapter = getStorageAdapter()) {
  return readJson<unknown[]>(adapter, EMPLOYEE_STORAGE_KEY, [], (raw) =>
    Array.isArray(raw) ? raw : []
  );
}

export function removeLegacyEmployeeRecords(adapter: StorageAdapter = getStorageAdapter()) {
  try {
    adapter.remove(EMPLOYEE_STORAGE_KEY);
  } catch {
    // Storage adapter already guards failures, but keep this helper no-throw.
  }
}

export function loadEmployeeRecords(
  projectOptions: EmployeeProjectOption[],
  storedEmployees: unknown[] = [],
  adapter: StorageAdapter = getStorageAdapter()
) {
  const sourceEmployees = storedEmployees.length ? storedEmployees : getLegacyEmployeeRecords(adapter);

  if (sourceEmployees.length) {
    return sourceEmployees.map((record, index) =>
      normalizeEmployeeRecord(record as Partial<EmployeeRecord>, projectOptions, index)
    );
  }

  return createInitialEmployeeRecords(projectOptions);
}

export function getEmployeeMonthlyWage(employee: EmployeeRecord) {
  return employee.dailyWage * employee.workDays;
}

export function getEmployeeMonthlyBenefit(employee: EmployeeRecord) {
  return employee.benefit * employee.workDays;
}

export function getEmployeeMonthlyTotal(employee: EmployeeRecord) {
  return getEmployeeMonthlyWage(employee) + getEmployeeMonthlyBenefit(employee);
}

export function getEmployeeProjectAllocationCount(employee: EmployeeRecord) {
  return Math.max(1, employee.assignedProjectIds.length);
}

export function getEmployeeAppStats(
  employees: EmployeeRecord[],
  siteTeams: EmployeeSiteTeamRecord[] = []
) {
  const activeEmployees = employees.filter((employee) => employee.status === "active");
  const employeeSiteTeamCount = new Set(
    employees
      .filter((employee) => employee.team === "site")
      .map((employee) => employee.teamName.trim())
      .filter(Boolean)
  ).size;

  return {
    total: employees.length,
    office: employees.filter((employee) => employee.team === "office").length,
    site: employees.filter((employee) => employee.team === "site").length,
    siteTeams: Math.max(siteTeams.length, employeeSiteTeamCount),
    active: activeEmployees.length,
    monthly: activeEmployees.reduce(
      (sum, employee) => sum + getEmployeeMonthlyTotal(employee),
      0
    )
  };
}
