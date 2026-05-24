import { type ChangeEvent, useRef, useState } from "react";
import { FilePlus2, FileText, Home, Send, Upload, Zap } from "lucide-react";
import type { WorkspaceAppId } from "../../../apps";
import { PageHeader } from "../../shared/PageHeader";
import { SummaryTile } from "../../shared/SummaryTile";

type AgentChatTab = "chat" | "files" | "channels";

type AgentChatPanelProps = {
  activeTab: string;
  onSelectApp: (id: WorkspaceAppId) => void;
  onSelectAppTab: (appId: WorkspaceAppId, tabKey: string) => void;
};

type AgentChatMessage = {
  id: string;
  role: "user" | "agent";
  text: string;
  meta?: string;
};

type AgentChatFileItem = {
  id: string;
  name: string;
  size: string;
  type: string;
  action: string;
};

const agentChatChannels = [
  {
    label: "Webchat",
    detail: "ฝัง widget ในเว็บแอปและรับไฟล์จากหน้าเว็บ",
    endpoint: "/api/agent-chat/webchat",
    status: "พร้อมออกแบบ API"
  },
  {
    label: "LINE Chat",
    detail: "ต่อ Messaging API สำหรับแชตลูกค้าและทีมช่าง",
    endpoint: "/api/agent-chat/line",
    status: "รอ token"
  },
  {
    label: "Telegram Chat",
    detail: "ต่อ Bot API สำหรับรับไฟล์และคำสั่งจากมือถือ",
    endpoint: "/api/agent-chat/telegram",
    status: "รอ bot token"
  },
  {
    label: "Discord Chat",
    detail: "ต่อ webhook/bot สำหรับทีมปฏิบัติการ",
    endpoint: "/api/agent-chat/discord",
    status: "รอ app id"
  }
];

const agentQuickPrompts = [
  "สรุปไฟล์นี้เป็นรายการงาน",
  "แยกข้อมูลลูกค้าและโปรเจกต์",
  "สร้าง task จากเอกสารที่อัปโหลด",
  "เตรียมข้อมูลส่งเข้า BOQ"
];

function resolveAgentChatTab(activeTab: string): AgentChatTab {
  if (activeTab === "files" || activeTab === "channels") {
    return activeTab;
  }

  return "chat";
}

function formatFileSize(size: number) {
  if (size >= 1_000_000) {
    return `${(size / 1_000_000).toFixed(1)} MB`;
  }

  if (size >= 1_000) {
    return `${Math.round(size / 1_000)} KB`;
  }

  return `${size} B`;
}

function getAgentFileAction(file: File) {
  const extension = file.name.split(".").pop()?.toLocaleLowerCase("th-TH") ?? "";

  if (["csv", "xls", "xlsx"].includes(extension)) {
    return "อ่านตารางและจัดหมวดข้อมูล";
  }

  if (["pdf", "doc", "docx", "txt"].includes(extension)) {
    return "สรุปเอกสารและดึง field สำคัญ";
  }

  if (file.type.startsWith("image/")) {
    return "อ่านรูปหน้างานและสร้าง defect/task";
  }

  return "รับไฟล์เข้า queue วิเคราะห์";
}

export function AgentChatPanel({ activeTab, onSelectApp, onSelectAppTab }: AgentChatPanelProps) {
  const currentTab = resolveAgentChatTab(activeTab);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [draft, setDraft] = useState("");
  const [files, setFiles] = useState<AgentChatFileItem[]>([]);
  const [messages, setMessages] = useState<AgentChatMessage[]>([
    {
      id: "seed-agent",
      role: "agent",
      text:
        "พร้อมรับคำสั่งหรือไฟล์แล้ว เลือกไฟล์/พิมพ์โจทย์มาได้เลย ผมจะจัดข้อมูลให้เป็นงาน เอกสาร หรือรายการที่นำไปใช้ต่อได้",
      meta: "Agent Chat - local prototype"
    }
  ]);

  const appendAgentReply = (userText: string, meta?: string) => {
    const timestamp = Date.now();

    setMessages((current) => [
      ...current,
      {
        id: `user-${timestamp}`,
        role: "user",
        text: userText,
        meta
      },
      {
        id: `agent-${timestamp}`,
        role: "agent",
        text:
          "รับข้อมูลแล้ว ขั้นถัดไปคือแยกประเภทข้อมูล ตรวจ field สำคัญ แล้วเตรียม action ให้ต่อกับเอกสาร, BOQ, task หรือช่องทางแชตที่เลือก",
        meta: "พร้อมต่อ API จริงเมื่อมี backend/token"
      }
    ]);
  };

  const sendDraft = (prompt = draft) => {
    const trimmed = prompt.trim();

    if (!trimmed) {
      return;
    }

    appendAgentReply(trimmed, "Webchat");
    setDraft("");
  };

  const selectFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);

    if (!selectedFiles.length) {
      return;
    }

    const timestamp = Date.now();
    const nextFiles = selectedFiles.map((file, index) => ({
      id: `agent-file-${timestamp}-${index}`,
      name: file.name,
      size: formatFileSize(file.size),
      type: file.type || file.name.split(".").pop()?.toLocaleUpperCase("th-TH") || "FILE",
      action: getAgentFileAction(file)
    }));

    setFiles((current) => [...nextFiles, ...current].slice(0, 8));
    appendAgentReply(
      `อัปโหลด ${nextFiles.map((file) => file.name).join(", ")}`,
      `${nextFiles.length} file${nextFiles.length > 1 ? "s" : ""}`
    );
    event.target.value = "";
  };

  return (
    <section className="workspace-hub agent-chat-app" aria-label="Agent Chat">
      <div className="module-hero agent-chat-hero">
        <div>
          <h1>Agent Chat</h1>
          <p>
            ระบบแชตกับ AI agent สำหรับโยนไฟล์ คุยสั่งงาน และจัดข้อมูลให้พร้อมนำไปใช้ในเอกสาร
            BOQ, task, CRM หรือช่องทาง Webchat/LINE/Telegram/Discord ผ่าน API
          </p>
          <div className="agent-channel-strip" aria-label="Agent chat channels">
            {agentChatChannels.map((channel) => (
              <button
                className={currentTab === "channels" ? "agent-channel-chip active" : "agent-channel-chip"}
                key={channel.label}
                onClick={() => onSelectAppTab("agentChat", "channels")}
                type="button"
              >
                {channel.label}
              </button>
            ))}
          </div>
        </div>
        <div className="module-actions">
          <button className="primary-button" onClick={() => fileInputRef.current?.click()} type="button">
            <Upload size={18} />
            โยนไฟล์ให้ Agent
          </button>
          <button className="secondary-button" onClick={() => onSelectApp("hub")} type="button">
            <Home size={18} />
            กลับ Hub
          </button>
        </div>
      </div>

      <div className="summary-grid agent-summary-grid">
        <SummaryTile label="Webchat" value="พร้อมคุย" strong />
        <SummaryTile label="ไฟล์ในคิว" value={`${files.length} ไฟล์`} />
        <SummaryTile label="ช่องทาง API" value={`${agentChatChannels.length} ช่องทาง`} />
        <SummaryTile label="สถานะ" value="Prototype" />
      </div>

      <div className="agent-chat-layout">
        <div className="module-board agent-chat-board">
          <PageHeader
            title={currentTab === "files" ? "File-to-Data Chat" : "Webchat"}
            detail="คุยกับ agent หรืออัปโหลดไฟล์เพื่อให้ระบบเตรียมข้อมูล/action ต่อทันที"
          />

          <div className="agent-message-list" aria-live="polite">
            {messages.map((message) => (
              <div className={`agent-message ${message.role}`} key={message.id}>
                <strong>{message.role === "agent" ? "Agent AI" : "คุณ"}</strong>
                <span>{message.text}</span>
                {message.meta && <small>{message.meta}</small>}
              </div>
            ))}
          </div>

          <div className="agent-composer">
            <input
              hidden
              multiple
              ref={fileInputRef}
              type="file"
              accept=".csv,.xls,.xlsx,.pdf,.doc,.docx,.txt,image/*"
              onChange={selectFiles}
            />
            <button className="secondary-button" onClick={() => fileInputRef.current?.click()} type="button">
              <FilePlus2 size={16} />
              แนบไฟล์
            </button>
            <input
              aria-label="ข้อความถึง Agent Chat"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  sendDraft();
                }
              }}
              placeholder="พิมพ์คำสั่ง เช่น สรุปไฟล์นี้เป็นรายการงาน..."
            />
            <button className="primary-button" onClick={() => sendDraft()} type="button">
              <Send size={16} />
              ส่ง
            </button>
          </div>

          <div className="agent-quick-prompts" aria-label="คำสั่งลัด Agent Chat">
            {agentQuickPrompts.map((prompt) => (
              <button key={prompt} onClick={() => sendDraft(prompt)} type="button">
                <Zap size={13} />
                {prompt}
              </button>
            ))}
          </div>
        </div>

        <aside className="module-board agent-context-board">
          <PageHeader
            title={currentTab === "channels" ? "API Channels" : "Data Actions"}
            detail={
              currentTab === "channels"
                ? "เตรียมจุดเชื่อมต่อสำหรับ Webchat, LINE, Telegram และ Discord"
                : "ไฟล์ที่โยนเข้ามาจะถูกจัดเป็น action ที่ส่งต่อไปยัง module อื่นได้"
            }
          />

          <div className="agent-channel-list">
            {agentChatChannels.map((channel) => (
              <div className="agent-channel-card" key={channel.label}>
                <div>
                  <strong>{channel.label}</strong>
                  <span>{channel.detail}</span>
                </div>
                <code>{channel.endpoint}</code>
                <small>{channel.status}</small>
              </div>
            ))}
          </div>

          <div className="agent-file-list">
            {files.length ? (
              files.map((file) => (
                <div className="agent-file-card" key={file.id}>
                  <FileText size={16} />
                  <div>
                    <strong>{file.name}</strong>
                    <span>{file.size} - {file.type}</span>
                    <small>{file.action}</small>
                  </div>
                </div>
              ))
            ) : (
              <div className="agent-empty-file">
                <Upload size={18} />
                <strong>ยังไม่มีไฟล์</strong>
                <span>กด "โยนไฟล์ให้ Agent" เพื่อเริ่มจัดข้อมูลจากไฟล์</span>
              </div>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}
