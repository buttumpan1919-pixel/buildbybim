# Pojjaman ERP Research For Buildbybim.space

Updated: 2026-05-24
Source: https://www.pojjaman.com/
Status: Benchmark note for full ERP direction
Companion reference: `docs/POJJAMAN_CODEX_REFERENCE.md`

## 1. Positioning

Pojjaman is the full ERP benchmark in the BUILK ONE ecosystem. Compared with BUILK Cost Control, Pojjaman is positioned for project-based organizations that need accounting, document approval, cost control, procurement, inventory, reporting, and business controls in one system.

Core message:

```text
Project-Based ERP = accounting + documents + approval + cost + procurement + inventory + reporting + security
```

For Buildbybim.space, this means the long-term ERP target is not only:

```text
Project -> Cost Code -> PR/RFQ -> Cost Entry
```

but must become:

```text
Project
  -> Budget / Cost Code / BOQ
  -> PR / RFQ / PO / Receiving
  -> Inventory / Site Issue / Resource
  -> AP / AR / Billing / Retention / Cashflow
  -> Approval / Role / Audit / Document Control
  -> Dashboard / Reports / Close Period
```

## 2. Full ERP Module Map

| Pojjaman-grade area | Meaning | Buildbybim status |
|---|---|---|
| Project Accounting | แยกต้นทุน รายได้ กำไร-ขาดทุน รายโครงการ | partial: `projects`, `cashflow`, `builddocs` |
| Project Cost Control | budget vs committed vs actual vs remaining | partial: `projects`, `costCodes`, `boqData` |
| Procurement | PR, RFQ, PO, supplier compare, approval | prototype slot: `procurement`; needs detail workflow |
| Inventory | รับ-จ่ายสินค้า คลังหลายไซต์ เบิกใช้หน้างาน | missing |
| AP/AR | เจ้าหนี้ ลูกหนี้ รายรับค้างรับ รายจ่ายค้างจ่าย | partial: `builddocs`, `cashflow`; no ledger yet |
| Approval Workflow | ลำดับอนุมัติ เอกสาร งบประมาณ มือถือ | partial: access rules only; no document approval chain |
| Role & Permission | สิทธิ์ตามบทบาทและข้อมูล | partial: membership/admin; needs workspace role scopes |
| Audit & Log | tracking ประวัติการแก้ไขและการอนุมัติ | partial: membership audit only |
| Financial Close | ปิดงบ ยื่นผู้ตรวจสอบบัญชี/สรรพากร | missing |
| Dashboard/BI | real-time report by project/unit/campaign | partial: hub/cashflow; needs project dashboard |
| Implementation Service | blueprint, migration, UAT, go-live | should become support plan / custom ERP service |

## 3. Role Map

Pojjaman speaks to five enterprise roles. Buildbybim should keep these roles in the product model:

| Role | Needs | Buildbybim app focus |
|---|---|---|
| Business Owner | ภาพรวมโครงการ งบ กำไร รายงานตัดสินใจ | `hub`, `projects`, `projectDashboard` |
| Project Owner / PM | คุมต้นทุน ความคืบหน้า แผนงาน | `projects`, `procurement`, `defectTracker`, `SiteOps` |
| Procurement | PR/PO/RFQ, supplier compare, budget compliance | `procurement`, `suppliers`, `costCodes` |
| Inventory / Site Store | รับ-จ่ายวัสดุ คลังหลายไซต์ เบิกหน้างาน | new `inventory` app |
| Accounting & Finance | AR/AP, ledger, close month, tax-ready docs | `cashflow`, `builddocs`, future `accounting` |

## 4. Project-Based ERP Data Spine

Use this as the target data relationship:

```text
Workspace
  -> Company
  -> Project
    -> Unit / Phase / Zone / Site
    -> BudgetLine / CostCode / BOQItem
    -> Supplier / Subcontractor
    -> PR
      -> RFQ
      -> PO
      -> GoodsReceipt / ServiceReceipt
      -> APInvoice / Payment
    -> Contract / BillingMilestone
      -> ARInvoice / Receipt / Retention
    -> InventoryMovement
    -> WorkProgress / Defect / EvidenceAsset
    -> ApprovalRequest
    -> AuditLog
```

Important design rule: every transaction must answer these questions:

- which project?
- which cost code / BOQ line?
- committed or actual?
- payable or receivable?
- approved by whom?
- what document/evidence proves it?
- does it affect cashflow, margin, or inventory?

## 5. Roadmap Upgrade From Builk Parity To Pojjaman-Grade ERP

### Phase A: Finish cost-control operations

1. Complete `procurement` detail workflow: PR -> RFQ -> PO.
2. Extend `cashflow` into project cost/revenue entries.
3. Build `projectDashboard`: budget, committed, actual, paid, unpaid, remaining, margin.

### Phase B: Add approval and audit

1. Add approval state machine for PR/PO/invoice/payment.
2. Add role scopes: owner, manager, procurement, accounting, site, viewer.
3. Add document-level audit log.

### Phase C: Add inventory/site store

1. Create `inventory` app.
2. Track warehouse/site stock.
3. Link PO receiving -> inventory movement -> site issue -> actual cost.

### Phase D: Add accounting bridge

1. Add AR/AP aging.
2. Add billing milestone -> invoice -> receipt -> retention.
3. Add payable invoice -> payment.
4. Export accounting-ready CSV instead of trying to replace full accounting on day one.

### Phase E: Add implementation service layer

Pojjaman sells implementation, not only software. Buildbybim should package:

- setup workshop
- cost code migration
- project data import
- form/document template setup
- approval workflow setup
- dashboard/report setup
- first-month support

This can become a paid support plan before full SaaS billing is mature.

## 6. Strategic Difference For Buildbybim

Do not try to beat Pojjaman by being a larger ERP. Pojjaman is already strong at enterprise ERP.

Buildbybim should win by being:

- easier for small contractors, architects, freelancers, and small developers to start
- design/BOQ/document aware from day one
- AI-assisted for data entry, cost coding, variance explanation, and document drafting
- BIM-ready later, but not BIM-heavy at first use
- migration-friendly for people who outgrow spreadsheets but are not ready for enterprise ERP implementation

Recommended positioning:

```text
Buildbybim.space is a lightweight AI-assisted construction ERP workspace
for teams that need project numbers, documents, site evidence, and decisions
in one place before they are ready for enterprise ERP.
```

## 7. Immediate Product Decisions

1. Treat `Builk parity` as MVP workflow.
2. Treat `Pojjaman` as full ERP north star.
3. Add `inventory`, `approval`, `audit`, and `accounting bridge` as named future modules.
4. Keep `clientOps` as CRM, but do not let CRM become the ERP core.
5. Make `projectDashboard` the next proof of ERP value after PR/RFQ/PO.

## 8. Source Links

- Pojjaman homepage: https://www.pojjaman.com/
- Construction ERP: https://www.pojjaman.com/construction-erp/
- Real Estate ERP: https://www.pojjaman.com/real-estate-erp/
- Media/Event ERP: https://www.pojjaman.com/event-agency-organizer-erp/
- Software House ERP: https://www.pojjaman.com/software-house-business-erp/
- FAQ: https://www.pojjaman.com/faq/
