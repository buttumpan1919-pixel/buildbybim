import { describe, expect, it } from "vitest";

import { formatHubCount, hubDashboardCopy } from "./hubDashboardCopy";

describe("hubDashboardCopy", () => {
  it("keeps app card metric labels localized", () => {
    expect(hubDashboardCopy.th.metricDocuments).toBe("เอกสาร");
    expect(hubDashboardCopy.th.metricSiteTeams).toBe("ทีมหน้างาน");
    expect(hubDashboardCopy.th.quickProfile).toBe("โปรไฟล์");

    expect(hubDashboardCopy.en.metricDocuments).toBe("Documents");
    expect(hubDashboardCopy.en.metricSiteTeams).toBe("Site teams");
    expect(hubDashboardCopy.en.quickProfile).toBe("Profile");
  });

  it("keeps recent activity fallback labels localized", () => {
    expect(hubDashboardCopy.th.activityUnknownArea).toBe("พื้นที่ไม่ระบุ");
    expect(hubDashboardCopy.th.activityBoqTask).toBe("งาน BOQ");
    expect(hubDashboardCopy.en.activityUnknownArea).toBe("Unspecified area");
    expect(hubDashboardCopy.en.activityBoqTask).toBe("BOQ task");
  });

  it("formats count templates without hardcoding language at call sites", () => {
    expect(formatHubCount(hubDashboardCopy.th.actionCashflowDraft, 3)).toBe(
      "Cashflow รอ confirm 3 รายการ"
    );
    expect(formatHubCount(hubDashboardCopy.en.actionCashflowDraft, 3)).toBe(
      "3 cashflow entries pending confirm"
    );
  });
});
