import { useState } from "react";
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  ExternalLink,
  FileText,
  FolderOpen,
  FolderPlus,
  Image as ImageIcon,
  LayoutGrid,
  Map,
  PanelRight,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  Upload,
  WandSparkles,
  X,
  ZoomIn
} from "lucide-react";
import type { WorkspaceAppId } from "../../../apps";

type LibraryTabId = "images" | "documents" | "prompts" | "trash";

type LibraryPanelProps = {
  activeTab: LibraryTabId;
  onSelectApp: (id: WorkspaceAppId) => void;
  onSelectTab: (id: LibraryTabId) => void;
};

type LibraryAsset = {
  name: string;
  date: string;
  size: string;
  background: string;
};

const libraryTabs = [
  { id: "images", label: "รูปภาพ", icon: ImageIcon },
  { id: "documents", label: "เอกสาร", icon: FileText },
  { id: "prompts", label: "Prompt", icon: WandSparkles },
  { id: "trash", label: "ถังขยะ", icon: Trash2 }
] satisfies Array<{ id: LibraryTabId; label: string; icon: typeof ImageIcon }>;

const libraryAssets: LibraryAsset[] = [
  {
    name: "bbb_20260520_132202_studio_angles_16x9_codex.png",
    date: "2026-05-20",
    size: "3.1 MB",
    background: "linear-gradient(135deg, #374151, #d1d5db 48%, #f9fafb)"
  },
  {
    name: "bbb_20260520_083440_studio_angles_1x1_codex.png",
    date: "2026-05-20",
    size: "2.8 MB",
    background: "linear-gradient(135deg, #1f2937, #cbd5e1 48%, #f3f4f6)"
  },
  {
    name: "bbb_20260520_024016_studio_envision_1x1_codex.png",
    date: "2026-05-19",
    size: "2.4 MB",
    background: "linear-gradient(135deg, #111827, #6b7280 50%, #d1d5db)"
  },
  {
    name: "bbb_20260518_133026_studio_angles_16x9_codex.png",
    date: "2026-05-18",
    size: "3.0 MB",
    background: "linear-gradient(135deg, #2f4d2c, #dde6d3 48%, #ffffff)"
  },
  {
    name: "bbb_20260518_114156_studio_angles_16x9_codex.png",
    date: "2026-05-18",
    size: "2.6 MB",
    background: "linear-gradient(135deg, #4b5563, #f3f4f6 48%, #9ca3af)"
  },
  {
    name: "bbb_20260518_102036_studio_envision_16x9_codex.png",
    date: "2026-05-18",
    size: "2.9 MB",
    background: "linear-gradient(135deg, #111827, #cbd5e1 50%, #e5e7eb)"
  },
  {
    name: "bbb_20260511_144040_studio_envision_16x9_codex.png",
    date: "2026-05-11",
    size: "2.2 MB",
    background: "linear-gradient(135deg, #374151, #e5e7eb 48%, #9ca3af)"
  },
  {
    name: "bbb_20260509_204440_studio_analyzer_16x9_codex.png",
    date: "2026-05-09",
    size: "2.7 MB",
    background: "linear-gradient(135deg, #1f2937, #9ca3af 48%, #d1d5db)"
  }
];

const libraryLists: Record<Exclude<LibraryTabId, "images">, string[]> = {
  documents: ["BOQ summary draft.pdf", "สัญญาว่าจ้างบ้านพัก.pdf", "ราคาเสนอ Modern Thai.xlsx"],
  prompts: ["Modern Thai rural house", "Warm interior daylight", "Landscape courtyard concept"],
  trash: ["ไฟล์ที่ถูกย้ายจะรอกู้คืนที่นี่"]
};

export function LibraryPanel({ activeTab, onSelectApp, onSelectTab }: LibraryPanelProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(1);
  const [generationCount, setGenerationCount] = useState(1);
  const selectedAsset = libraryAssets[selectedImageIndex] ?? libraryAssets[0];
  const selectedAssetHref = `/image-library/generated/${selectedAsset.date}/${selectedAsset.name}`;
  const listItems = activeTab === "images" ? [] : libraryLists[activeTab];

  const selectPreviousImage = () =>
    setSelectedImageIndex((current) => (current === 0 ? libraryAssets.length - 1 : current - 1));
  const selectNextImage = () =>
    setSelectedImageIndex((current) => (current === libraryAssets.length - 1 ? 0 : current + 1));

  return (
    <section className="workspace-hub library-stage" aria-label="Library prototype">
      <aside className="library-drawer" aria-label="Library drawer" data-side="left">
        <header className="library-drawer-header">
          <strong>คลัง - ภาพ + เอกสาร</strong>
          <button aria-label="Cozy" title="Cozy -> Spacious" type="button">M</button>
          <button aria-label="ย้ายไปฝั่งขวา" title="ย้ายไปฝั่งขวา" type="button"><PanelRight size={13} /></button>
          <button aria-label="ปิด" onClick={() => onSelectApp("hub")} title="ปิด" type="button"><X size={13} /></button>
        </header>

        <div className="library-tabs">
          {libraryTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                aria-pressed={activeTab === tab.id}
                className={activeTab === tab.id ? "active" : ""}
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                type="button"
              >
                <Icon size={12} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="library-toolbar">
          <label>
            <Search size={12} />
            <input
              placeholder={activeTab === "images" ? "ค้นหารูป (ชื่อไฟล์ / วันที่)..." : "ค้นหาในคลังข้อมูล..."}
              type="search"
            />
          </label>
          <button aria-label="รีเฟรช" title="รีเฟรช" type="button"><RefreshCw size={11} /></button>
          <input accept="image/png,image/jpeg,image/jpg,image/webp" multiple type="file" />
          <button className="import" title="เลือกไฟล์เพื่อย้ายเข้าคลัง" type="button">
            <Upload size={11} />
            นำเข้า
          </button>
        </div>

        <div className="library-scroll-area">
          {activeTab === "images" ? (
            <div className="library-grid">
              {libraryAssets.map((asset, index) => (
                <div className={index === selectedImageIndex ? "library-thumb active" : "library-thumb"} key={asset.name}>
                  <button onClick={() => setSelectedImageIndex(index)} title={`${asset.name}\n${asset.date}`} type="button">
                    <span className="library-thumb-art" style={{ background: asset.background }} />
                  </button>
                  <button aria-label="ย้ายไปถังขยะ" className="trash" title="ย้ายไปถังขยะ" type="button">
                    <Trash2 size={11} />
                  </button>
                  <span>{asset.date}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="library-list-panel">
              {listItems.map((item) => (
                <button key={item} type="button">
                  {activeTab === "trash" ? <Trash2 size={14} /> : activeTab === "prompts" ? <WandSparkles size={14} /> : <FileText size={14} />}
                  <span>{item}</span>
                  <small>{activeTab === "trash" ? "รอกู้คืน" : "ในคลัง"}</small>
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>

      {activeTab === "images" ? (
        <div className="image-viewer-panel" aria-label="Image actions prototype">
          <header>
            <ImageIcon size={14} />
            <div>
              <strong>{selectedAsset.name}</strong>
              <span>{selectedAsset.date} - {selectedAsset.size} - {selectedImageIndex + 1}/59</span>
            </div>
            <button aria-label="ปิด (Esc)" title="ปิด (Esc)" type="button">
              <X size={13} />
            </button>
          </header>

          <div className="image-viewer-body">
            <div className="image-viewer-canvas">
              <span style={{ background: selectedAsset.background }} />
              <button aria-label="ภาพก่อนหน้า" className="viewer-nav previous" onClick={selectPreviousImage} type="button">
                <ChevronLeft size={18} />
              </button>
              <button aria-label="ภาพถัดไป" className="viewer-nav next" onClick={selectNextImage} type="button">
                <ChevronRight size={18} />
              </button>
            </div>

            <footer className="image-action-panel">
              <button className="primary" type="button"><Sparkles size={13} />ใช้เป็นภาพต้นฉบับ</button>
              <button type="button"><FolderPlus size={13} />เก็บเข้าโปรเจค</button>

              <div className="image-action-section">สร้างเพิ่ม</div>
              <div className="image-count-row">
                <span>จำนวน</span>
                <div>
                  {[1, 2, 4, 6].map((count) => (
                    <button
                      className={generationCount === count ? "active" : ""}
                      key={count}
                      onClick={() => setGenerationCount(count)}
                      type="button"
                    >
                      {count}x
                    </button>
                  ))}
                </div>
              </div>
              <button type="button"><RefreshCw size={13} />สร้างใหม่ (prompt เดิม)</button>
              <button type="button"><Camera size={13} />เพิ่มมุมมองใหม่</button>
              <button type="button"><span />เลือกมุมเอง</button>
              <button type="button"><Map size={13} />เลือกผัง/มุมมอง <small>1</small></button>
              <button type="button"><ZoomIn size={13} />ขยายดีเทล</button>
              <button type="button"><WandSparkles size={13} />ปรับแต่งเอง</button>

              <div className="image-action-section">บอร์ดนำเสนอ</div>
              <button type="button"><LayoutGrid size={13} />บอร์ด - เร็ว</button>
              <button title="วิเคราะห์รูปต้นฉบับก่อน แล้วเจน 6 panel แยกกันก่อนประกอบเป็น board" type="button">
                <LayoutGrid size={13} />บอร์ด - แม่น
              </button>

              <div className="image-action-section">เครื่องมือ</div>
              <div className="image-tool-grid">
                <a aria-label="ดาวน์โหลด" download={selectedAsset.name} href={selectedAssetHref} title="ดาวน์โหลด">
                  <Download size={14} />
                </a>
                <a aria-label="เปิดต้นฉบับ" href={selectedAssetHref} rel="noreferrer" target="_blank" title="เปิดต้นฉบับ">
                  <ExternalLink size={14} />
                </a>
                <button aria-label="คัดลอก path" title="คัดลอก path" type="button">
                  <Copy size={14} />
                </button>
                <button aria-label="แสดง Prompt" title="แสดง Prompt" type="button">
                  <WandSparkles size={14} />
                </button>
              </div>

              <button className="danger" type="button"><Trash2 size={13} />ย้ายไปถังขยะ</button>
            </footer>
          </div>
        </div>
      ) : (
        <div className="library-context-panel">
          <FolderOpen size={28} />
          <h1>คลังข้อมูล</h1>
          <p>
            Prototype drawer สำหรับรวมรูปภาพ เอกสาร Prompt และถังขยะตาม reference จาก Build By BIM
            โดยยังใช้ข้อมูลจำลองใน phase แรก
          </p>
          <div>
            <span>Images - {libraryAssets.length}</span>
            <span>Documents - 3</span>
            <span>Prompts - 3</span>
          </div>
        </div>
      )}
    </section>
  );
}
