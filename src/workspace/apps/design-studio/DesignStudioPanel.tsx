import {
  Camera,
  Check,
  ClipboardList,
  Copy,
  Home,
  Image as ImageIcon,
  LayoutGrid,
  RefreshCw,
  Send,
  Shuffle,
  SlidersHorizontal,
  Sparkles,
  Upload,
  WandSparkles,
  Zap
} from "lucide-react";
import type { WorkspaceAppId } from "../../../apps";

type DesignWorkflowId =
  | "envision"
  | "redesign"
  | "diy"
  | "outpaint"
  | "analyzer"
  | "gallery"
  | "angles";

type DesignStudioPanelProps = {
  activeWorkflowId: DesignWorkflowId;
  onSelectApp: (id: WorkspaceAppId) => void;
  onSelectWorkflow: (id: DesignWorkflowId) => void;
};

type DesignWorkflow = {
  id: DesignWorkflowId;
  label: string;
  description: string;
  icon: typeof Sparkles;
  step: number;
  seed: string;
  prompt: string;
  previewTitle: string;
  helper: string;
};

const designOptionGroups = [
  ["Render type", "Exterior", "Interior", "Landscape", "Renovation", "Moodboard"],
  ["Style", "Modern Thai", "Tropical", "Minimal", "Japanese warm", "Luxury resort"],
  ["Lighting", "Golden hour", "Soft daylight", "Night warm light", "Overcast calm"],
  ["Mood", "calm", "premium", "family friendly", "natural", "professional"],
  ["Material", "teak wood", "fair-faced concrete", "glass", "stone", "white plaster"],
  ["Palette", "warm neutral", "wood + cream", "green landscape", "black + teak"]
] as const;

const designWorkflows: DesignWorkflow[] = [
  {
    id: "envision",
    label: "Envision",
    description: "Text -> Concept",
    icon: Sparkles,
    step: 5,
    seed:
      "บ้านพักชั้นเดียวสไตล์ไทยโมเดิร์น อยู่ในบริบทชนบท มีเฉลียงกว้าง เปิดรับธรรมชาติ และใช้วัสดุไม้กับคอนกรีต",
    prompt:
      "Envision workflow, exterior architectural render of a single-story Modern Thai rural house, wide veranda, low-pitched roof, teak wood and fair-faced concrete, tropical planting, warm neutral palette, golden hour lighting, realistic architectural perspective. Aspect ratio 16:9.",
    previewTitle: "พร้อมเริ่มสร้างภาพ",
    helper: "เติม prompt หรือกดสุ่ม Prompt แล้วกดสร้างภาพ"
  },
  {
    id: "redesign",
    label: "ReDesign",
    description: "Image -> Restyle",
    icon: RefreshCw,
    step: 4,
    seed:
      "ปรับภาพบ้านเดิมให้เป็นไทยโมเดิร์น อบอุ่นขึ้น เพิ่มเฉลียงไม้ กันสาดบาง และจัด landscape ให้ดูใช้งานจริง",
    prompt:
      "ReDesign workflow, restyle the existing house image into a warm Modern Thai architectural proposal, preserve massing and camera angle, add teak veranda, thin roof eaves, tropical planting, clean material palette, realistic before-after design intent.",
    previewTitle: "พร้อมรีดีไซน์จากภาพเดิม",
    helper: "อัปโหลด reference แล้วเลือกสไตล์ที่ต้องการปรับ"
  },
  {
    id: "diy",
    label: "DIY Editor",
    description: "Mask + Prompt",
    icon: WandSparkles,
    step: 3,
    seed:
      "เลือกบางส่วนของภาพ เช่น ผนัง หลังคา พื้น หรือเฟอร์นิเจอร์ แล้วสั่งเปลี่ยนวัสดุเฉพาะจุด",
    prompt:
      "DIY Editor workflow, targeted architectural edit on selected mask area, keep surrounding geometry unchanged, apply precise material replacement, realistic lighting match, clean edges, no text overlay.",
    previewTitle: "พร้อมแก้เฉพาะจุด",
    helper: "เลือก mask แล้วใส่คำสั่งเปลี่ยนวัสดุหรือองค์ประกอบ"
  },
  {
    id: "outpaint",
    label: "Outpaint",
    description: "Extend frame",
    icon: ImageIcon,
    step: 3,
    seed:
      "ขยายภาพ render ให้เห็นบริบทด้านข้าง เพิ่มสวน ทางเดิน และพื้นที่หน้าบ้านโดยคงมุมกล้องเดิม",
    prompt:
      "Outpaint workflow, extend the architectural render beyond the current frame, continue perspective lines, add coherent garden context, driveway, planting, sky and shadows, seamless edge continuation.",
    previewTitle: "พร้อมขยายเฟรมภาพ",
    helper: "เลือกรูปและสัดส่วนปลายทางเพื่อสร้างพื้นที่ต่อเนื่อง"
  },
  {
    id: "analyzer",
    label: "Analyzer",
    description: "Image -> Report",
    icon: ClipboardList,
    step: 2,
    seed:
      "วิเคราะห์ภาพอ้างอิงเพื่อสรุป style, materials, lighting, composition และข้อควรแก้ก่อนนำไปสร้างภาพต่อ",
    prompt:
      "Analyzer workflow, inspect architectural image reference, extract style, material palette, lighting direction, composition, camera angle, design opportunities and generation-ready prompt notes.",
    previewTitle: "พร้อมวิเคราะห์ภาพ",
    helper: "อัปโหลดภาพแล้วให้ระบบสรุปเป็น brief/prompt"
  },
  {
    id: "gallery",
    label: "Gallery",
    description: "Asset / Upscale",
    icon: LayoutGrid,
    step: 4,
    seed:
      "จัดชุดภาพที่สร้างแล้วเป็น gallery คัดภาพเด่น ทำ upscale และเตรียมส่งต่อเข้าบอร์ดนำเสนอ",
    prompt:
      "Gallery workflow, curate generated architectural assets, select hero image, prepare upscale variants, group by aspect ratio and use-case, generate presentation-ready set.",
    previewTitle: "พร้อมจัด Gallery",
    helper: "เลือกภาพจากคลังเพื่อคัดชุดและทำบอร์ดต่อ"
  },
  {
    id: "angles",
    label: "Angles",
    description: "มุมเพิ่มเติม / วิดีโอ",
    icon: Camera,
    step: 4,
    seed:
      "สร้างมุมมองเพิ่มจากภาพเดิม เช่น front, side, aerial, interior approach และ cinematic walkthrough",
    prompt:
      "Angles workflow, generate consistent additional architectural camera angles from the source concept, preserve design language, materials and site context, create front view, side view, aerial view and approach perspective.",
    previewTitle: "พร้อมสร้างมุมมองใหม่",
    helper: "เลือกภาพต้นฉบับแล้วกำหนดมุมที่ต้องการต่อยอด"
  }
];

const detailSteps = [
  "อธิบายวิสัยทัศน์ของคุณ",
  "เลือกองค์ประกอบดีไซน์",
  "ปรับแต่งรายละเอียด",
  "สร้างจากรูปภาพ",
  "ปรับแต่งด้วย AI",
  "เลือกโมเดลและสร้างภาพ"
];

export function DesignStudioPanel({
  activeWorkflowId,
  onSelectApp,
  onSelectWorkflow
}: DesignStudioPanelProps) {
  const activeWorkflow =
    designWorkflows.find((workflow) => workflow.id === activeWorkflowId) ?? designWorkflows[0];
  const ActiveWorkflowIcon = activeWorkflow.icon;

  return (
    <section className="workspace-hub" aria-label="Design Studio prototype">
      <div className="design-studio-panel">
        <div className="design-header">
          <div className="design-title">
            <ActiveWorkflowIcon size={19} />
            <h1>{activeWorkflow.label} Studio</h1>
            <span>-</span>
            <small>High</small>
          </div>
          <div className="design-ready-chip">
            <strong>{activeWorkflow.step}</strong>
            <span>Prompt</span>
            <small>พร้อมส่งสร้างภาพ</small>
          </div>
          <button className="secondary-button" onClick={() => onSelectApp("hub")} type="button">
            <Home size={16} />
            กลับ Hub
          </button>
        </div>

        <div className="design-workflow-tabs" aria-label="Design workflows">
          {designWorkflows.map((workflow) => {
            const Icon = workflow.icon;
            return (
              <button
                aria-pressed={workflow.id === activeWorkflow.id}
                className={workflow.id === activeWorkflow.id ? "active" : ""}
                key={workflow.id}
                onClick={() => onSelectWorkflow(workflow.id)}
                type="button"
              >
                <Icon size={14} />
                <span>{workflow.label}</span>
                <small>{workflow.description}</small>
              </button>
            );
          })}
        </div>

        <div className="render-prompt-grid">
          <div className="design-control-stack">
            <div className="design-card">
              <div className="design-card-title">
                <Sparkles size={16} />
                <strong>1. อธิบายวิสัยทัศน์ของคุณ</strong>
              </div>
              <p>เขียนคำอธิบายสั้น ๆ เกี่ยวกับพื้นที่หรืออาคารที่ต้องการสร้าง</p>
              <textarea
                defaultValue={activeWorkflow.seed}
                key={`${activeWorkflow.id}-seed`}
                rows={4}
              />
            </div>

            <div className="design-card">
              <div className="design-card-title">
                <SlidersHorizontal size={16} />
                <strong>2. เลือกองค์ประกอบดีไซน์</strong>
              </div>
              <p>เลือกสไตล์ แสง อารมณ์ วัสดุ และพาเลทสีเพื่อรวมเป็น Prompt</p>
              <div className="design-option-list">
                {designOptionGroups.map(([label, ...options]) => (
                  <div className="design-option-row" key={label}>
                    <span>{label}</span>
                    <div>
                      {options.map((option, index) => (
                        <button aria-pressed={index === 0} className={index === 0 ? "active" : ""} key={option} type="button">
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="design-card">
              <div className="design-card-title">
                <RefreshCw size={16} />
                <strong>3. ปรับแต่งรายละเอียด</strong>
              </div>
              <textarea
                defaultValue="wide veranda, low-pitched roof, tropical planting, realistic architectural perspective"
                rows={2}
              />
              <textarea
                defaultValue="low quality, distorted perspective, unrealistic structure, messy furniture, watermark, text overlay"
                rows={2}
              />
              <div className="design-aspect-row">
                {["1:1", "4:5", "16:9", "9:16"].map((ratio) => (
                  <button className={ratio === "16:9" ? "active" : ""} key={ratio} type="button">
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            <div className="design-card">
              <div className="design-card-title">
                <ImageIcon size={16} />
                <strong>4. สร้างจากรูปภาพ</strong>
              </div>
              <label className="design-upload">
                <Upload size={16} />
                <span>
                  <strong>เลือก reference image</strong>
                  <small>ไม่บังคับ - PNG / JPG / WEBP</small>
                </span>
                <input accept="image/png,image/jpeg,image/webp" type="file" />
              </label>
            </div>
          </div>

          <div className="design-output-stack">
            <div className="design-card">
              <div className="design-card-title">
                <WandSparkles size={16} />
                <strong>5. ปรับแต่งด้วย AI</strong>
              </div>
              <textarea
                className="design-final-prompt"
                defaultValue={activeWorkflow.prompt}
                key={`${activeWorkflow.id}-prompt`}
                rows={7}
              />
              <div className="design-action-row">
                <button type="button"><Shuffle size={14} />สุ่ม Prompt</button>
                <button className="primary" type="button"><Zap size={14} />สุ่ม + สร้างเลย</button>
                <button type="button"><WandSparkles size={14} />Generate Professional Prompt</button>
                <button type="button"><Copy size={14} />Copy prompt</button>
              </div>
            </div>

            <div className="design-card">
              <div className="design-card-title">
                <Sparkles size={16} />
                <strong>6. เลือกโมเดลและสร้างภาพ</strong>
              </div>
              <div className="design-model-grid">
                {[
                  ["Draft", "ลอง composition เร็ว"],
                  ["High", "preview พร้อมคัดเลือก"],
                  ["Premium", "ภาพ publish-ready"]
                ].map(([name, detail]) => (
                  <button className={name === "High" ? "active" : ""} key={name} type="button">
                    <strong>{name}</strong>
                    <small>{detail}</small>
                  </button>
                ))}
              </div>
              <div className="design-generate-row">
                <button className="primary" type="button"><Sparkles size={15} />สร้างภาพ</button>
                <button disabled type="button"><Send size={15} />Send to Image Queue</button>
              </div>
            </div>

            <div className="design-preview">
              <header>
                <span />
                <strong>{activeWorkflow.label} workspace</strong>
                <small>High - 16:9</small>
              </header>
              <div className="design-preview-canvas">
                <div>
                  <span>ฉบับร่าง</span>
                  <strong>{activeWorkflow.previewTitle}</strong>
                  <small>{activeWorkflow.helper}</small>
                </div>
              </div>
              <footer>
                <button type="button"><RefreshCw size={13} />สร้างใหม่</button>
              </footer>
            </div>

            <div className="design-step-list">
              {detailSteps.map((step, index) => (
                <span className={index < 4 ? "done" : ""} key={step}>
                  {index < 4 && <Check size={10} />}
                  {step}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
