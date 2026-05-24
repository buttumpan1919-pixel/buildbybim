import type { ReactNode } from "react";
import { ShieldAlert, ShieldCheck } from "lucide-react";

type ProjectAccessNoticeProps = {
  children: ReactNode;
  tone?: "info" | "warning";
};

export function ProjectAccessNotice({ children, tone = "info" }: ProjectAccessNoticeProps) {
  const isWarning = tone === "warning";
  const Icon = isWarning ? ShieldAlert : ShieldCheck;
  return (
    <div
      role={isWarning ? "alert" : "status"}
      style={{
        alignItems: "center",
        background: isWarning ? "#FFEDE8" : "#EEF5F1",
        border: `1px solid ${isWarning ? "#F4B3A2" : "#BFD9C9"}`,
        borderRadius: 8,
        color: isWarning ? "#8F2F17" : "#255B3A",
        display: "flex",
        gap: 10,
        margin: "12px 0",
        padding: "10px 12px"
      }}
    >
      <Icon size={17} />
      <span style={{ fontSize: 13, lineHeight: 1.45 }}>{children}</span>
    </div>
  );
}
