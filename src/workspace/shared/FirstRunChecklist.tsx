import { CheckCircle2, Circle, Sparkles } from "lucide-react";

type FirstRunStep = {
  key: string;
  label: string;
  detail: string;
  done: boolean;
  action: () => void;
  actionLabel: string;
};

type FirstRunChecklistProps = {
  language: "th" | "en";
  projectCount: number;
  cashflowEntryCount: number;
  onCreateProject: () => void;
  onOpenCostCodes: () => void;
  onRecordCashflow: () => void;
  onOpenDashboard: () => void;
};

const copy = {
  th: {
    title: "เริ่มต้นใช้งานใน 10 นาที",
    detail: "ทำตาม 4 ขั้นตอนนี้แล้วคุณจะเห็นต้นทุน vs ใช้จริงของโครงการแรกทันที",
    step1Label: "1. สร้างโครงการแรก",
    step1Detail: "ตั้งชื่อ + งบประมาณ + เจ้าของโครงการ — เริ่มต้นได้ใน 30 วินาที",
    step1Action: "ไปสร้างโครงการ",
    step2Label: "2. เลือก cost codes มาตรฐาน",
    step2Detail: "100 รายการพร้อมใช้ (งานโครงสร้าง / สถาปัตย์ / งานระบบ) ติ๊กเอาที่ใช้",
    step2Action: "ดู cost codes",
    step3Label: "3. บันทึกค่าใช้จ่ายแรก",
    step3Detail: "ผูกเข้าโครงการ + cost code → เห็น budget vs ใช้จริง real-time",
    step3Action: "บันทึก cashflow",
    step4Label: "4. ดู Dashboard",
    step4Detail: "7 KPIs + alert เกินงบ — เห็นภาพรวมโครงการทั้งหมดในจอเดียว",
    step4Action: "เปิด dashboard",
    done: "ครบแล้ว 🎉"
  },
  en: {
    title: "Get started in 10 minutes",
    detail: "Follow these 4 steps and you'll see budget vs actual for your first project instantly.",
    step1Label: "1. Create your first project",
    step1Detail: "Name + budget + owner — ready in 30 seconds.",
    step1Action: "Create project",
    step2Label: "2. Pick standard cost codes",
    step2Detail: "100 codes ready (structural / architectural / MEP) — tick what you use.",
    step2Action: "View cost codes",
    step3Label: "3. Record your first expense",
    step3Detail: "Link to project + cost code → see budget vs actual in real time.",
    step3Action: "Record cashflow",
    step4Label: "4. View dashboard",
    step4Detail: "7 KPIs + over-budget alerts — see all projects in one screen.",
    step4Action: "Open dashboard",
    done: "All set 🎉"
  }
} as const;

export function FirstRunChecklist({
  language,
  projectCount,
  cashflowEntryCount,
  onCreateProject,
  onOpenCostCodes,
  onRecordCashflow,
  onOpenDashboard
}: FirstRunChecklistProps) {
  if (projectCount > 0 && cashflowEntryCount > 0) {
    return null;
  }
  const text = copy[language] ?? copy.th;
  const projectDone = projectCount > 0;
  const cashflowDone = cashflowEntryCount > 0;

  const steps: FirstRunStep[] = [
    {
      key: "project",
      label: text.step1Label,
      detail: text.step1Detail,
      done: projectDone,
      action: onCreateProject,
      actionLabel: text.step1Action
    },
    {
      key: "cost-codes",
      label: text.step2Label,
      detail: text.step2Detail,
      done: projectDone,
      action: onOpenCostCodes,
      actionLabel: text.step2Action
    },
    {
      key: "cashflow",
      label: text.step3Label,
      detail: text.step3Detail,
      done: cashflowDone,
      action: onRecordCashflow,
      actionLabel: text.step3Action
    },
    {
      key: "dashboard",
      label: text.step4Label,
      detail: text.step4Detail,
      done: projectDone && cashflowDone,
      action: onOpenDashboard,
      actionLabel: text.step4Action
    }
  ];

  return (
    <section className="first-run-checklist" aria-labelledby="first-run-checklist-title">
      <header className="first-run-checklist__header">
        <Sparkles size={18} aria-hidden />
        <div>
          <h2 id="first-run-checklist-title">{text.title}</h2>
          <p>{text.detail}</p>
        </div>
      </header>
      <ol className="first-run-checklist__steps">
        {steps.map((step) => (
          <li
            key={step.key}
            className={
              step.done
                ? "first-run-checklist__step is-done"
                : "first-run-checklist__step"
            }
          >
            <span className="first-run-checklist__icon" aria-hidden>
              {step.done ? <CheckCircle2 size={20} /> : <Circle size={20} />}
            </span>
            <div className="first-run-checklist__body">
              <strong>{step.label}</strong>
              <span>{step.detail}</span>
            </div>
            <button
              type="button"
              className={step.done ? "secondary-button" : "primary-button"}
              onClick={step.action}
            >
              {step.actionLabel}
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}
