import { describe, expect, it } from "vitest";

import {
  buildDocsCopy,
  formatBuildDocsTemplate,
  getBuildDocsInvoiceTitle
} from "./buildDocsCopy";

describe("buildDocsCopy", () => {
  it("keeps document actions and workflow labels localized", () => {
    expect(buildDocsCopy.th.newDocument).toBe("เอกสารใหม่");
    expect(buildDocsCopy.th.workflowOpenPurchaseOrder).toBe("เปิดใบสั่งซื้อ");
    expect(buildDocsCopy.th.documentTypeLabels.quote).toBe("ใบเสนอราคา");

    expect(buildDocsCopy.en.newDocument).toBe("New document");
    expect(buildDocsCopy.en.workflowOpenPurchaseOrder).toBe("Open purchase order");
    expect(buildDocsCopy.en.documentTypeLabels.quote).toBe("Quote");
  });

  it("formats milestone invoice titles by language", () => {
    expect(getBuildDocsInvoiceTitle("invoice", { id: 1 }, "th")).toBe("ใบวางบิล/ใบแจ้งหนี้");
    expect(getBuildDocsInvoiceTitle("invoice", { id: 1 }, "en")).toBe("Progress billing / Invoice");
    expect(getBuildDocsInvoiceTitle("quote", undefined, "en")).toBe("Quote");
  });

  it("formats copy templates without leaking placeholders", () => {
    expect(
      formatBuildDocsTemplate(buildDocsCopy.en.workflowPurchaseReadyFrom, {
        documentNo: "QT-001"
      })
    ).toBe("Ready to create from QT-001");
  });
});
