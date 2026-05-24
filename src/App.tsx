import {
  type ChangeEvent,
  type ClipboardEvent,
  type Dispatch,
  type FocusEvent,
  type KeyboardEvent,
  type SetStateAction,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import {
  AlertTriangle,
  Banknote,
  Bug,
  Building2,
  Camera,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Copy,
  Database,
  Download,
  Edit3,
  ExternalLink,
  FileCheck2,
  FilePlus2,
  FileSignature,
  FileText,
  FolderOpen,
  FolderPlus,
  Heart,
  Home,
  Image as ImageIcon,
  LayoutGrid,
  LineChart,
  MessageCircle,
  MapPin,
  Maximize2,
  MoreHorizontal,
  Plus,
  RefreshCw,
  ReceiptText,
  RotateCcw,
  Send,
  Sheet,
  Share2,
  Search,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Stamp,
  ThumbsUp,
  Trash2,
  Upload,
  UserRound,
  Users,
  WandSparkles,
  X
} from "lucide-react";
import {
  BoqCatalogRow,
  ContractTemplate,
  DocumentInfo,
  DocumentType,
  LineItem,
  Milestone,
  contractTemplates,
  createLineItemFromBoqRow,
  documentLabels,
  getBoqRowUnitPrice,
} from "./data";
import { getSampleSheetCsv, parseSheetCsv, toGoogleSheetCsvUrl } from "./sheets";
import {
  AppData,
  ClientRecord,
  ProjectRecord,
  StoredDocument,
  calculateTotal,
  createBlankDocument,
  createBillingDocument,
  createClientRecordFromDocument,
  createDefectRecord,
  createDocumentRecord,
  createProjectRecordFromDocument,
  createPurchaseOrderDocument,
  createQuoteDocument,
  createReceiptDocument,
  duplicateDocument,
  getDocumentTitle,
  initialAppData,
  loadWorkspaceData,
  normalizeDefectPhotoRecord,
  normalizeDefectRecord,
  normalizeImportedWorkspace,
  saveWorkspaceData
} from "./storage";
import type {
  DefectPhotoRecord,
  DefectPhotoStage,
  DefectRecord,
  DefectSeverity,
  DefectStatus,
  EmployeeRecord,
  EmployeeSiteTeamRecord,
  EmployeeStatus,
  EmployeeTeamType
} from "./storage";
import {
  createEvidenceAsset,
  loadEvidenceState,
  removeEvidenceAsset as removeEvidenceAssetFromState,
  saveEvidenceState,
  upsertEvidenceAsset,
  type EvidenceState
} from "./evidence";
import {
  defaultWorkspaceAppId,
  getDefaultWorkspaceAppVersion,
  getWorkspaceApp,
  getWorkspaceAppVersion,
  workspaceApps
} from "./apps";
import type {
  WorkspaceAppDefinition,
  WorkspaceAppId,
  WorkspaceAppStatus,
  WorkspaceAppVersionDefinition
} from "./apps";
import {
  getWorkspaceAppCopy,
  getWorkspaceGroupCopy,
  getWorkspaceSubnavCopy,
  workspaceShellCopy
} from "./workspace/shell/workspaceCopy";
import {
  workspaceAppGroups,
  workspaceAppIcons
} from "./workspace/shell/workspaceGroups";
import {
  getWorkspaceLanguageDirection,
  getWorkspaceLanguageCopy,
  getWorkspaceLanguageLocale,
  loadWorkspaceLanguage,
  saveWorkspaceLanguage,
  type WorkspaceLanguage,
  workspaceLanguages
} from "./workspace/shell/workspaceLanguage";
import {
  buildWorkspaceRoute,
  getDefaultSubnavKey,
  getWorkspaceRouteFromLocation,
  isAppPage,
  isDesignWorkflowId,
  isLibraryTabId,
  loadWorkspaceAppVersionSelection,
  normalizeSubnavKey,
  normalizeWorkspaceAppVersionId,
  saveWorkspaceAppVersionSelection,
  workspaceAppSubnavItems,
  type AppPage,
  type DesignWorkflowId,
  type LibraryTabId,
  type WorkspaceSubnavItem
} from "./workspace/shell/workspaceRouting";
import { calculateBoqAllocationState, summarizeBoqAllocations } from "./boqAllocation";
import type { BoqAllocationItem } from "./boqAllocation";
import {
  BOQ_TASK_LINKAGE_STORAGE_KEY,
  createBoqProjectTask,
  loadBoqTaskLinkageState,
  removeBoqProjectTask,
  removeBoqTaskLinkage,
  saveBoqTaskLinkageState,
  summarizeBoqTaskLinkage,
  upsertBoqProjectTask,
  upsertBoqTaskLinkage
} from "./boqTaskLinkage";
import type { BoqProjectTask, BoqProjectTaskStatus, BoqTaskLinkageState } from "./boqTaskLinkage";
import {
  formatHubCount,
  formatHubRelativeTime,
  hubDashboardCopy
} from "./hubDashboardCopy";
import {
  buildDocsCopy,
  formatBuildDocsTemplate,
  getBuildDocsInvoiceTitle
} from "./buildDocsCopy";
import {
  cashflowCategoryCopy,
  loadCashflowState,
  summarizeCashflow
} from "./cashflow";
import {
  LOCAL_PROJECT_ACCESS_ACTOR,
  applyDocumentAuthorityAction,
  buildDocumentAuthorityStamp,
  canApplyDocumentAuthorityAction,
  ensureDocumentAuthority,
  evaluateDocumentAuthorityActionAccess,
  evaluateProjectAccessGuard,
  loadDocumentAuthorityState,
  loadProjectAccessState,
  saveDocumentAuthorityState,
  upsertDocumentAuthority,
  type DocumentAuthorityAction,
  type DocumentAuthorityRecord,
  type DocumentAuthorityState,
  type DocumentAuthorityStatus,
  type ProjectAccessDecision,
  type ProjectPermission
} from "./projectAccess";
import { ensureSeedCostCodes } from "./costCodes";
import { resetDemoScenario, seedDemoScenario } from "./demoData";
import { evaluateAppAccess } from "./membership";
import AdminPanel from "./AdminPanel";
import { AgentChatPanel } from "./workspace/apps/agent-chat/AgentChatPanel";
import {
  BOQ_IMPORT_TEMPLATE_HEADERS,
  BOQ_IMPORT_TEMPLATE_ROWS,
  BOQ_VERSION_ALL,
  buildBoqImportTemplateCsv,
  type BoqDraft,
  type BoqFilterOption,
  type BoqInlineEditableField,
  type BoqImportCell,
  type BoqPublishStatus,
  type BoqPriceStatus,
  boqFilterOptions,
  boqPublishStatusLabels,
  boqPriceStatusLabels,
  createBlankBoqDraft,
  getBoqRecordId,
  getBoqSearchText,
  loadCustomBoqRows,
  mergeBoqCatalogRows,
  normalizeBoqRow,
  parseBoqCsv,
  parseSpreadsheetClipboard,
  parseBoqWorkbookSheets,
  saveCustomBoqRows,
  validateBoqInlineCellValue
} from "./workspace/apps/boq-data/boqDataService";
import {
  loadBoqCostCodeMappings,
  removeBoqCostCodeMapping,
  resolveBoqCostCode,
  saveBoqCostCodeMappings,
  summarizeBoqCostCodeCoverage,
  upsertBoqCostCodeMapping
} from "./workspace/apps/boq-data/boqCostCodeMapping";
import { CashflowPanel } from "./workspace/apps/cashflow/CashflowPanel";
import { ConstructionPlannerPanel } from "./workspace/apps/construction-planner/ConstructionPlannerPanel";
import { ProjectsPanel } from "./workspace/apps/projects/ProjectsPanel";
import { CostCodesPanel } from "./workspace/apps/cost-codes/CostCodesPanel";
import { SuppliersPanel } from "./workspace/apps/suppliers/SuppliersPanel";
import { ProcurementPanel } from "./workspace/apps/procurement/ProcurementPanel";
import { ProjectControlPanel } from "./workspace/apps/project-control/ProjectControlPanel";
import { ApprovalCenterPanel } from "./workspace/apps/approvals/ApprovalCenterPanel";
import { EvidencePanel } from "./workspace/apps/evidence/EvidencePanel";
import {
  buildSiteReportEvents,
  buildSiteReportEvidenceTags,
  buildSiteReportLocationPins,
  createSiteCoordinationReportText,
  createDefectPhotoFromFile,
  defectPhotoStageLabels,
  defectPhotoStages,
  defectSeverityLabels,
  defectStatusLabels,
  filterSiteReportEvents,
  formatCapturedAt,
  formatFileSize,
  getSiteReportEvidenceKind,
  getSiteReportEvidenceLocation,
  getSiteReportEvidenceLocationPinId,
  loadDefectRecords,
  removeLegacyDefectRecords,
  siteReportEvidenceKindLabels,
  siteReportEvidenceKindToAssetType,
  summarizeSiteReportEvents,
  type SiteReportEventFilter,
  type SiteReportEvidenceKind
} from "./workspace/apps/defects/defectService";
import { DesignStudioPanel } from "./workspace/apps/design-studio/DesignStudioPanel";
import {
  DEFAULT_SITE_TEAM_NAME,
  OFFICE_TEAM_NAME,
  clampNumber,
  createEmployeeSiteTeamRecord,
  getEmployeeAppStats,
  getEmployeeAssignedProjectIds,
  getEmployeeMonthlyBenefit,
  getEmployeeMonthlyTotal,
  getEmployeeMonthlyWage,
  getEmployeeProjectAllocationCount,
  getEmployeeProjectOptions,
  getEmployeeTeamName,
  loadEmployeeRecords,
  loadEmployeeSiteTeamRecords,
  normalizeEmployeeRecord,
  removeLegacyEmployeeRecords
} from "./workspace/apps/employees/employeeService";
import { LibraryPanel } from "./workspace/apps/library/LibraryPanel";
import {
  createSocialComment,
  createSocialPost,
  createSocialPostImageFromFile,
  formatSocialPostTime,
  getSocialFeedStats,
  getSocialSearchText,
  loadSocialFeedData,
  normalizeSocialProfile,
  saveSocialFeedData,
  socialNetworkMembers,
  socialPostCategories
} from "./workspace/apps/social-feed/socialFeedService";
import type {
  NetworkMember,
  SocialFeedData,
  SocialFeedTab,
  SocialPost,
  SocialPostCategory,
  SocialPostImage,
  SocialProfile
} from "./workspace/apps/social-feed/socialFeedService";
import { PageHeader } from "./workspace/shared/PageHeader";
import { SummaryTile } from "./workspace/shared/SummaryTile";
import { FirstRunChecklist } from "./workspace/shared/FirstRunChecklist";
const money = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 0
});

const siteReportFilterOptions: Array<{ id: SiteReportEventFilter; label: string }> = [
  { id: "all", label: "ทุกเหตุการณ์" },
  { id: "needs-reply", label: "ต้องตอบกลับ" },
  { id: "answered", label: "ตอบแล้ว/ปิดแล้ว" },
  { id: "evidence", label: "Evidence" },
  { id: "milestone", label: "Milestone" }
];

const siteEvidenceKindOptions: Array<{ id: SiteReportEvidenceKind; label: string }> = [
  { id: "360", label: "360 link" },
  { id: "photo", label: "Photo" },
  { id: "video", label: "Video" },
  { id: "pdf", label: "PDF" },
  { id: "receipt", label: "Receipt" },
  { id: "file", label: "File" }
];

const documentAuthorityStatusLabels: Record<DocumentAuthorityStatus, string> = {
  draft: "ร่าง",
  submitted: "ส่งตรวจ",
  checked: "ตรวจแล้ว",
  approved: "อนุมัติแล้ว",
  issued: "ออกเอกสารแล้ว",
  void: "ยกเลิก"
};

const documentAuthorityActionLabels: Record<DocumentAuthorityAction, string> = {
  submit: "ส่งตรวจ",
  check: "ตรวจ",
  approve: "อนุมัติ",
  issue: "ออกเอกสาร",
  void: "ยกเลิก"
};

const projectAccessDecisionLabels: Record<ProjectAccessDecision["reason"], string> = {
  workspace_admin: "workspace admin",
  no_configured_grants: "project access is not configured yet",
  role_allows: "role allows this action",
  extra_permission: "extra permission allows this action",
  denied_permission: "permission denied by override",
  supplier_mismatch: "supplier scope does not match",
  no_active_grant: "no active project grant",
  no_permission: "role does not include this permission"
};

function getProjectAccessDecisionText(decision: ProjectAccessDecision) {
  return projectAccessDecisionLabels[decision.reason] ?? decision.reason;
}

const documentAuthorityActions: DocumentAuthorityAction[] = [
  "submit",
  "check",
  "approve",
  "issue",
  "void"
];

type DocumentAuthorityStamp = ReturnType<typeof buildDocumentAuthorityStamp>;

function getProjectSyncKey(projectName: string, clientName: string) {
  return `${projectName.trim()}::${clientName.trim()}`.toLocaleLowerCase("th-TH");
}

function getFullDocumentTotal(data: AppData) {
  const subtotal = data.items.reduce((sum, item) => sum + item.qty * item.price, 0);
  const vat = data.vatEnabled ? subtotal * 0.07 : 0;
  const withholding = data.withholdingEnabled ? subtotal * 0.03 : 0;

  return subtotal + vat - withholding;
}

function downloadBlobFile(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function downloadTextFile(filename: string, content: string, type = "text/csv;charset=utf-8") {
  downloadBlobFile(filename, new Blob([content], { type }));
}

async function parseSheetJsBoqWorkbook(file: File, sourcePrefix: "xls" | "xlsx") {
  const XLSX = await import("@e965/xlsx");
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
  const sheets = workbook.SheetNames.map((sheet) => ({
    sheet,
    data: XLSX.utils.sheet_to_json(workbook.Sheets[sheet], {
      header: 1,
      raw: true,
      defval: ""
    }) as BoqImportCell[][]
  }));

  return parseBoqWorkbookSheets(sheets, {
    sourcePrefix,
    priceVersionPrefix: sourcePrefix,
    idPrefix: sourcePrefix
  });
}

async function buildBoqImportTemplateXlsxBlob() {
  const XLSX = await import("@e965/xlsx");
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet([
    Array.from(BOQ_IMPORT_TEMPLATE_HEADERS),
    ...BOQ_IMPORT_TEMPLATE_ROWS
  ]);

  worksheet["!cols"] = [
    { wch: 14 },
    { wch: 16 },
    { wch: 8 },
    { wch: 28 },
    { wch: 36 },
    { wch: 10 },
    { wch: 16 },
    { wch: 14 },
    { wch: 10 },
    { wch: 10 },
    { wch: 68 },
    { wch: 14 }
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, "All items");
  const output = XLSX.write(workbook, { bookType: "xlsx", type: "array" }) as BlobPart;
  return new Blob([output], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });
}

const builderPages: AppPage[] = ["documents", "contracts", "sheets"];

function isBuilderPage(page: AppPage) {
  return builderPages.includes(page);
}

function milestoneAmount(total: number, percent: number) {
  return (total * percent) / 100;
}

function getStatusLabel(status: Milestone["status"]) {
  if (status === "paid") {
    return "รับเงินแล้ว";
  }

  if (status === "ready") {
    return "พร้อมวางบิล";
  }

  return "รอเรียกเก็บ";
}

function getSocialInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const initials = parts.slice(0, 2).map((part) => Array.from(part)[0] ?? "").join("");
  return initials || "CF";
}

type SocialAvatarProps = {
  image?: SocialPostImage | null;
  name: string;
  size?: "compact" | "default" | "large";
};

function SocialAvatar({ image, name, size = "default" }: SocialAvatarProps) {
  const className = size === "default" ? "social-avatar" : `social-avatar ${size}`;

  return (
    <span className={className}>
      {image ? <img src={image.dataUrl} alt={`${name} avatar`} /> : getSocialInitials(name)}
    </span>
  );
}

type SocialFeedPanelProps = {
  activeTab: string;
  onSelectApp: (id: WorkspaceAppId) => void;
  onSelectAppTab: (appId: WorkspaceAppId, tabKey: string) => void;
};

function SocialFeedPanel({ activeTab, onSelectApp, onSelectAppTab }: SocialFeedPanelProps) {
  const [feedData, setFeedData] = useState<SocialFeedData>(() => loadSocialFeedData());
  const [postDraft, setPostDraft] = useState("");
  const [postCategory, setPostCategory] = useState<SocialPostCategory>(socialPostCategories[0]);
  const [postProject, setPostProject] = useState("รีโนเวทบ้านพัก 2 ชั้น");
  const [postImage, setPostImage] = useState<SocialPostImage | null>(null);
  const [postImageStatus, setPostImageStatus] = useState("");
  const [isPostImageProcessing, setIsPostImageProcessing] = useState(false);
  const [feedSearchQuery, setFeedSearchQuery] = useState("");
  const [feedCategoryFilter, setFeedCategoryFilter] = useState<SocialPostCategory | "all">("all");
  const [commentDraftByPost, setCommentDraftByPost] = useState<Record<string, string>>({});
  const currentTab: SocialFeedTab =
    activeTab === "network" || activeTab === "profile" ? activeTab : "feed";
  const connectedMembers = socialNetworkMembers.filter((member) =>
    feedData.connectedIds.includes(member.id)
  );
  const hiringPosts = feedData.posts.filter((post) => post.category === "หาทีมงาน").length;
  const ownPosts = feedData.posts.filter((post) => post.authorId === "self");
  const filteredPosts = useMemo(() => {
    const normalizedQuery = feedSearchQuery.trim().toLocaleLowerCase("th-TH");

    return feedData.posts.filter((post) => {
      const matchesCategory =
        feedCategoryFilter === "all" || post.category === feedCategoryFilter;
      const matchesSearch =
        !normalizedQuery || getSocialSearchText(post).includes(normalizedQuery);

      return matchesCategory && matchesSearch;
    });
  }, [feedCategoryFilter, feedData.posts, feedSearchQuery]);

  useEffect(() => {
    saveSocialFeedData(feedData);
  }, [feedData]);

  const updateProfile = (patch: Partial<SocialProfile>) => {
    setFeedData((current) => {
      const nextProfile = normalizeSocialProfile({ ...current.profile, ...patch });

      return {
        ...current,
        profile: nextProfile,
        posts: current.posts.map((post) =>
          post.authorId === "self"
            ? {
                ...post,
                authorName: nextProfile.name,
                authorRole: nextProfile.role,
                authorCompany: nextProfile.company,
                authorImage: nextProfile.avatarImage
              }
            : post
        )
      };
    });
  };

  const submitPost = () => {
    if (!postDraft.trim() && !postImage) {
      return;
    }

    const nextPost = createSocialPost(
      feedData.profile,
      postDraft,
      postCategory,
      postProject,
      postImage
    );
    setFeedData((current) => ({
      ...current,
      profile: {
        ...current.profile,
        followers: current.profile.followers + 1
      },
      posts: [nextPost, ...current.posts]
    }));
    setPostDraft("");
    setPostImage(null);
    setPostImageStatus("");
  };

  const selectPostImage = async (file: File | null) => {
    if (!file) {
      return;
    }

    setIsPostImageProcessing(true);
    setPostImageStatus("กำลังเตรียมรูป...");

    try {
      const image = await createSocialPostImageFromFile(file);
      setPostImage(image);
      setPostImageStatus(
        `พร้อมโพสต์ ${image.width}x${image.height}px · ${formatFileSize(image.size)}`
      );
    } catch (error) {
      setPostImage(null);
      setPostImageStatus(error instanceof Error ? error.message : "เพิ่มรูปไม่สำเร็จ");
    } finally {
      setIsPostImageProcessing(false);
    }
  };

  const deletePost = (postId: string) => {
    setFeedData((current) => ({
      ...current,
      posts: current.posts.filter((post) => post.id !== postId || post.authorId !== "self")
    }));
  };

  const toggleLike = (postId: string) => {
    setFeedData((current) => ({
      ...current,
      posts: current.posts.map((post) =>
        post.id === postId
          ? {
              ...post,
              liked: !post.liked,
              likes: Math.max(0, post.likes + (post.liked ? -1 : 1))
            }
          : post
      )
    }));
  };

  const addComment = (postId: string) => {
    const draft = commentDraftByPost[postId]?.trim();

    if (!draft) {
      return;
    }

    setFeedData((current) => ({
      ...current,
      posts: current.posts.map((post) =>
        post.id === postId
          ? {
              ...post,
              commentCount: post.commentCount + 1,
              comments: [createSocialComment(current.profile, draft), ...post.comments]
            }
          : post
      )
    }));
    setCommentDraftByPost((current) => ({ ...current, [postId]: "" }));
  };

  const toggleConnection = (memberId: string) => {
    setFeedData((current) => {
      const isConnected = current.connectedIds.includes(memberId);
      const connectedIds = isConnected
        ? current.connectedIds.filter((id) => id !== memberId)
        : [...current.connectedIds, memberId];

      return {
        ...current,
        connectedIds,
        profile: {
          ...current.profile,
          following: Math.max(0, current.profile.following + (isConnected ? -1 : 1))
        }
      };
    });
  };

  const sharePost = (postId: string) => {
    setFeedData((current) => ({
      ...current,
      posts: current.posts.map((post) =>
        post.id === postId ? { ...post, shares: post.shares + 1 } : post
      )
    }));
  };

  return (
    <section className="workspace-hub social-feed-app" aria-label="Feed รับเหมา">
      <div className="module-hero social-feed-hero">
        <div>
          <h1>Feed รับเหมา</h1>
          <p>
            พื้นที่โพสต์งานหน้างาน หาเครือข่ายผู้รับเหมา ทีมช่าง ซัพพลายเออร์
            และแสดง Profile ธุรกิจของบัญชีตัวเองในรูปแบบฟีดสังคม
          </p>
          <div className="social-profile-strip">
            <SocialAvatar
              image={feedData.profile.avatarImage}
              name={feedData.profile.name}
              size="compact"
            />
            <strong>{feedData.profile.company}</strong>
            <small>{feedData.profile.role} · {feedData.profile.location}</small>
          </div>
        </div>
        <div className="module-actions">
          <button
            className="primary-button"
            onClick={() => onSelectAppTab("socialFeed", "profile")}
            type="button"
          >
            <UserRound size={18} />
            แก้ Profile
          </button>
          <button className="secondary-button" onClick={() => onSelectApp("hub")} type="button">
            <Home size={18} />
            กลับ Hub
          </button>
        </div>
      </div>

      <div className="summary-grid social-summary-grid">
        <SummaryTile label="โพสต์ทั้งหมด" value={`${feedData.posts.length} โพสต์`} strong />
        <SummaryTile label="เครือข่ายที่ติดตาม" value={`${feedData.connectedIds.length} ราย`} />
        <SummaryTile label="Follower" value={`${feedData.profile.followers} คน`} />
        <SummaryTile label="โพสต์หาทีม" value={`${hiringPosts} งาน`} />
      </div>

      <div className={currentTab === "profile" ? "social-layout profile-mode" : "social-layout"}>
        <SocialProfileCard
          connectedCount={connectedMembers.length}
          profile={feedData.profile}
          onOpenProfile={() => onSelectAppTab("socialFeed", "profile")}
        />

        {currentTab === "profile" ? (
          <SocialProfileEditor
            posts={ownPosts}
            profile={feedData.profile}
            onChange={updateProfile}
            onDeletePost={deletePost}
          />
        ) : (
          <main className="social-feed-column" aria-label="โพสต์ใน Feed รับเหมา">
            <SocialComposer
              category={postCategory}
              content={postDraft}
              image={postImage}
              imageStatus={postImageStatus}
              isImageProcessing={isPostImageProcessing}
              project={postProject}
              profile={feedData.profile}
              onCategoryChange={setPostCategory}
              onContentChange={setPostDraft}
              onImageRemove={() => {
                setPostImage(null);
                setPostImageStatus("");
              }}
              onImageSelect={selectPostImage}
              onProjectChange={setPostProject}
              onSubmit={submitPost}
            />
            <SocialFeedControls
              categoryFilter={feedCategoryFilter}
              resultCount={filteredPosts.length}
              searchQuery={feedSearchQuery}
              totalCount={feedData.posts.length}
              onCategoryFilterChange={setFeedCategoryFilter}
              onSearchQueryChange={setFeedSearchQuery}
            />
            <div className="social-post-list">
              {filteredPosts.length === 0 && (
                <div className="social-empty-state">
                  <Search size={18} />
                  <strong>ไม่พบโพสต์ที่ตรงกับตัวกรอง</strong>
                  <span>ลองล้างคำค้นหรือเลือกประเภทโพสต์อื่น</span>
                </div>
              )}
              {filteredPosts.map((post) => (
                <SocialPostCard
                  commentDraft={commentDraftByPost[post.id] ?? ""}
                  key={post.id}
                  post={post}
                  onCommentDraftChange={(value) =>
                    setCommentDraftByPost((current) => ({ ...current, [post.id]: value }))
                  }
                  onLike={() => toggleLike(post.id)}
                  onShare={() => sharePost(post.id)}
                  onSubmitComment={() => addComment(post.id)}
                />
              ))}
            </div>
          </main>
        )}

        <SocialNetworkPanel
          connectedIds={feedData.connectedIds}
          members={socialNetworkMembers}
          mode={currentTab}
          onToggleConnection={toggleConnection}
        />
      </div>
    </section>
  );
}

type SocialProfileCardProps = {
  connectedCount: number;
  profile: SocialProfile;
  onOpenProfile: () => void;
};

function SocialProfileCard({ connectedCount, profile, onOpenProfile }: SocialProfileCardProps) {
  return (
    <aside className="social-profile-card" aria-label="Profile ของบัญชี">
      <div className={profile.coverImage ? "social-cover has-image" : "social-cover"} aria-hidden="true">
        {profile.coverImage && <img src={profile.coverImage.dataUrl} alt="" />}
      </div>
      <div className="social-profile-main">
        <SocialAvatar image={profile.avatarImage} name={profile.name} size="large" />
        <strong>{profile.name}</strong>
        <span>{profile.role}</span>
        <small>{profile.company}</small>
      </div>
      <p>{profile.bio}</p>
      <div className="social-specialty-list">
        {profile.specialties.map((specialty) => (
          <span key={specialty}>{specialty}</span>
        ))}
      </div>
      <div className="social-profile-stats">
        <span>
          <Heart size={15} />
          {profile.followers} follower
        </span>
        <span>
          <Users size={15} />
          {connectedCount} connected
        </span>
      </div>
      <button className="secondary-button" onClick={onOpenProfile} type="button">
        <UserRound size={16} />
        จัดการ Profile
      </button>
    </aside>
  );
}

type SocialFeedControlsProps = {
  categoryFilter: SocialPostCategory | "all";
  resultCount: number;
  searchQuery: string;
  totalCount: number;
  onCategoryFilterChange: (value: SocialPostCategory | "all") => void;
  onSearchQueryChange: (value: string) => void;
};

function SocialFeedControls({
  categoryFilter,
  resultCount,
  searchQuery,
  totalCount,
  onCategoryFilterChange,
  onSearchQueryChange
}: SocialFeedControlsProps) {
  return (
    <section className="social-feed-controls" aria-label="ค้นหาและกรองโพสต์">
      <label className="social-feed-search">
        <Search size={16} />
        <input
          value={searchQuery}
          onChange={(event) => onSearchQueryChange(event.target.value)}
          placeholder="ค้นหาโพสต์ ผู้รับเหมา โครงการ หรือวัสดุ"
        />
      </label>
      <label>
        <span>ประเภทโพสต์</span>
        <select
          value={categoryFilter}
          onChange={(event) =>
            onCategoryFilterChange(event.target.value as SocialPostCategory | "all")
          }
        >
          <option value="all">ทั้งหมด</option>
          {socialPostCategories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </label>
      <span className="social-feed-result">
        แสดง {resultCount}/{totalCount} โพสต์
      </span>
    </section>
  );
}

type SocialComposerProps = {
  category: SocialPostCategory;
  content: string;
  image: SocialPostImage | null;
  imageStatus: string;
  isImageProcessing: boolean;
  project: string;
  profile: SocialProfile;
  onCategoryChange: (value: SocialPostCategory) => void;
  onContentChange: (value: string) => void;
  onImageRemove: () => void;
  onImageSelect: (file: File | null) => void;
  onProjectChange: (value: string) => void;
  onSubmit: () => void;
};

function SocialComposer({
  category,
  content,
  image,
  imageStatus,
  isImageProcessing,
  project,
  profile,
  onCategoryChange,
  onContentChange,
  onImageRemove,
  onImageSelect,
  onProjectChange,
  onSubmit
}: SocialComposerProps) {
  return (
    <section className="social-composer" aria-label="สร้างโพสต์ใหม่">
      <div className="social-composer-head">
        <SocialAvatar image={profile.avatarImage} name={profile.name} />
        <textarea
          value={content}
          onChange={(event) => onContentChange(event.target.value)}
          placeholder="โพสต์อัปเดตไซต์งาน หาแรงงาน ถามราคาวัสดุ หรือแชร์ผลงาน..."
        />
      </div>
      {image && (
        <div className="social-composer-image-preview">
          <img src={image.dataUrl} alt={image.name} />
          <div>
            <strong>{image.name}</strong>
            <span>
              {image.width}x{image.height}px · {formatFileSize(image.size)}
            </span>
          </div>
          <button className="social-icon-button" onClick={onImageRemove} title="ลบรูป" type="button">
            <X size={16} />
          </button>
        </div>
      )}
      {imageStatus && !image && <span className="social-image-status">{imageStatus}</span>}
      <div className="social-composer-tools">
        <label>
          <span>ประเภท</span>
          <select
            value={category}
            onChange={(event) => onCategoryChange(event.target.value as SocialPostCategory)}
          >
            {socialPostCategories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>โครงการ/งาน</span>
          <input value={project} onChange={(event) => onProjectChange(event.target.value)} />
        </label>
        <label className={isImageProcessing ? "secondary-button social-upload-button disabled" : "secondary-button social-upload-button"}>
          <ImageIcon size={16} />
          {isImageProcessing ? "กำลังเตรียมรูป" : image ? "เปลี่ยนรูป" : "รูปไซต์งาน"}
          <input
            accept="image/*"
            disabled={isImageProcessing}
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              onImageSelect(event.currentTarget.files?.[0] ?? null);
              event.currentTarget.value = "";
            }}
            type="file"
          />
        </label>
        <button
          className="primary-button"
          disabled={(!content.trim() && !image) || isImageProcessing}
          onClick={onSubmit}
          type="button"
        >
          <Send size={16} />
          โพสต์
        </button>
      </div>
    </section>
  );
}

type SocialPostCardProps = {
  commentDraft: string;
  post: SocialPost;
  onCommentDraftChange: (value: string) => void;
  onLike: () => void;
  onShare: () => void;
  onSubmitComment: () => void;
};

function SocialPostCard({
  commentDraft,
  post,
  onCommentDraftChange,
  onLike,
  onShare,
  onSubmitComment
}: SocialPostCardProps) {
  return (
    <article className="social-post-card">
      <header className="social-post-header">
        <SocialAvatar image={post.authorImage} name={post.authorName} />
        <div>
          <strong>{post.authorName}</strong>
          <small>
            {post.authorRole} · {post.authorCompany} · {formatSocialPostTime(post.createdAt)}
          </small>
        </div>
        <button className="social-icon-button" title="เพิ่มเติม" type="button">
          <MoreHorizontal size={18} />
        </button>
      </header>

      <p>{post.content}</p>

      <div className="social-post-tags">
        <span>{post.category}</span>
        <span>{post.project}</span>
      </div>

      {post.image ? (
        <figure className="social-post-photo">
          <img src={post.image.dataUrl} alt={post.image.name} />
          <figcaption>
            {post.image.name} · {post.image.width}x{post.image.height}px
          </figcaption>
        </figure>
      ) : post.imageTone !== "none" && (
        <div className={`social-post-visual ${post.imageTone}`} aria-label="ภาพประกอบโพสต์งานก่อสร้าง">
          <span />
          <strong>{post.project}</strong>
          <small>{post.category}</small>
        </div>
      )}

      <div className="social-post-counts">
        <span>{post.likes} ถูกใจ</span>
        <span>
          {post.commentCount} ความเห็น · {post.shares} แชร์
        </span>
      </div>

      <div className="social-post-actions">
        <button className={post.liked ? "active" : ""} onClick={onLike} type="button">
          <ThumbsUp size={16} />
          ถูกใจ
        </button>
        <button type="button">
          <MessageCircle size={16} />
          ความเห็น
        </button>
        <button onClick={onShare} type="button">
          <Share2 size={16} />
          แชร์
        </button>
      </div>

      {post.comments.length > 0 && (
        <div className="social-comment-list">
          {post.commentCount > post.comments.length && (
            <span className="social-comment-more">
              ดูอีก {post.commentCount - post.comments.length} ความเห็นก่อนหน้า
            </span>
          )}
          {post.comments.slice(0, 3).map((comment) => (
            <div className="social-comment" key={comment.id}>
              <SocialAvatar name={comment.authorName} size="compact" />
              <div>
                <strong>{comment.authorName}</strong>
                <small>
                  {comment.authorRole} · {formatSocialPostTime(comment.createdAt)}
                </small>
                <p>{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="social-comment-row">
        <input
          value={commentDraft}
          onChange={(event) => onCommentDraftChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              onSubmitComment();
            }
          }}
          placeholder="เขียนความเห็นสั้น ๆ"
        />
        <button disabled={!commentDraft.trim()} onClick={onSubmitComment} type="button">
          <Send size={15} />
        </button>
      </div>
    </article>
  );
}

type SocialNetworkPanelProps = {
  connectedIds: string[];
  members: NetworkMember[];
  mode: SocialFeedTab;
  onToggleConnection: (id: string) => void;
};

function SocialNetworkPanel({
  connectedIds,
  members,
  mode,
  onToggleConnection
}: SocialNetworkPanelProps) {
  return (
    <aside className="social-network-panel" aria-label="แนะนำเครือข่ายผู้รับเหมา">
      <PageHeader
        title={mode === "network" ? "เครือข่ายรับเหมา" : "แนะนำให้เชื่อมต่อ"}
        detail="ทีมช่าง ซัพพลายเออร์ และผู้รับเหมาที่เกี่ยวข้องกับงานหน้างาน"
      />
      <div className="social-network-list">
        {members.map((member) => {
          const isConnected = connectedIds.includes(member.id);
          return (
            <article className="social-network-card" key={member.id}>
              <SocialAvatar name={member.name} />
              <div>
                <strong>{member.name}</strong>
                <span>{member.role}</span>
                <small>
                  {member.company} · {member.location}
                </small>
                <em>{member.specialty}</em>
                <small>{member.mutual}</small>
              </div>
              <button
                className={isConnected ? "secondary-button connected" : "primary-button"}
                onClick={() => onToggleConnection(member.id)}
                type="button"
              >
                {isConnected ? <Check size={15} /> : <Plus size={15} />}
                {isConnected ? "ติดตามแล้ว" : "เชื่อมต่อ"}
              </button>
            </article>
          );
        })}
      </div>
    </aside>
  );
}

type SocialProfileEditorProps = {
  posts: SocialPost[];
  profile: SocialProfile;
  onChange: (patch: Partial<SocialProfile>) => void;
  onDeletePost: (id: string) => void;
};

function SocialProfileEditor({ posts, profile, onChange, onDeletePost }: SocialProfileEditorProps) {
  const [avatarStatus, setAvatarStatus] = useState("");
  const [coverStatus, setCoverStatus] = useState("");
  const [isAvatarProcessing, setIsAvatarProcessing] = useState(false);
  const [isCoverProcessing, setIsCoverProcessing] = useState(false);

  const selectProfileMedia = async (file: File | null, kind: "avatar" | "cover") => {
    if (!file) {
      return;
    }

    const isAvatar = kind === "avatar";
    const setStatus = isAvatar ? setAvatarStatus : setCoverStatus;
    const setProcessing = isAvatar ? setIsAvatarProcessing : setIsCoverProcessing;

    setProcessing(true);
    setStatus("กำลังเตรียมรูป...");

    try {
      const image = await createSocialPostImageFromFile(file, isAvatar ? 720 : 1400);
      onChange(isAvatar ? { avatarImage: image } : { coverImage: image });
      setStatus(
        `${isAvatar ? "รูปโปรไฟล์" : "รูป Cover"} พร้อมใช้ ${image.width}x${image.height}px - ${formatFileSize(image.size)}`
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "เพิ่มรูปไม่สำเร็จ");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <section className="social-profile-editor" aria-label="แก้ไข Profile">
      <PageHeader
        title="Profile บัญชีของฉัน"
        detail="ข้อมูลนี้จะแสดงในโพสต์และการ์ดเครือข่ายของ Feed รับเหมา"
      />
      <div className="social-profile-media-panel">
        <div
          className={
            profile.coverImage
              ? "social-cover social-cover-editor has-image"
              : "social-cover social-cover-editor"
          }
          aria-label="ตัวอย่าง Cover"
        >
          {profile.coverImage ? <img src={profile.coverImage.dataUrl} alt={profile.coverImage.name} /> : <span>Cover</span>}
        </div>
        <div className="social-profile-media-row">
          <SocialAvatar image={profile.avatarImage} name={profile.name} size="large" />
          <div>
            <strong>รูปโปรไฟล์และ Cover</strong>
            <small>รูปนี้จะแสดงใน Profile card และโพสต์ของบัญชีนี้</small>
            <div className="social-profile-media-actions">
              <label
                className={
                  isAvatarProcessing
                    ? "secondary-button social-upload-button disabled"
                    : "secondary-button social-upload-button"
                }
              >
                <Camera size={16} />
                {isAvatarProcessing
                  ? "กำลังเตรียมรูป"
                  : profile.avatarImage
                  ? "เปลี่ยนรูปโปรไฟล์"
                  : "เพิ่มรูปโปรไฟล์"}
                <input
                  accept="image/*"
                  disabled={isAvatarProcessing}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => {
                    selectProfileMedia(event.currentTarget.files?.[0] ?? null, "avatar");
                    event.currentTarget.value = "";
                  }}
                  type="file"
                />
              </label>
              <label
                className={
                  isCoverProcessing
                    ? "secondary-button social-upload-button disabled"
                    : "secondary-button social-upload-button"
                }
              >
                <ImageIcon size={16} />
                {isCoverProcessing ? "กำลังเตรียมรูป" : profile.coverImage ? "เปลี่ยน Cover" : "เพิ่ม Cover"}
                <input
                  accept="image/*"
                  disabled={isCoverProcessing}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => {
                    selectProfileMedia(event.currentTarget.files?.[0] ?? null, "cover");
                    event.currentTarget.value = "";
                  }}
                  type="file"
                />
              </label>
              {profile.avatarImage && (
                <button
                  className="secondary-button"
                  onClick={() => {
                    onChange({ avatarImage: null });
                    setAvatarStatus("");
                  }}
                  type="button"
                >
                  <X size={16} />
                  ลบรูปโปรไฟล์
                </button>
              )}
              {profile.coverImage && (
                <button
                  className="secondary-button"
                  onClick={() => {
                    onChange({ coverImage: null });
                    setCoverStatus("");
                  }}
                  type="button"
                >
                  <X size={16} />
                  ลบ Cover
                </button>
              )}
            </div>
            {(avatarStatus || coverStatus) && (
              <div className="social-profile-media-status">
                {avatarStatus && <span>{avatarStatus}</span>}
                {coverStatus && <span>{coverStatus}</span>}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="social-profile-form">
        <label>
          <span>ชื่อบัญชี</span>
          <input value={profile.name} onChange={(event) => onChange({ name: event.target.value })} />
        </label>
        <label>
          <span>ตำแหน่ง/บทบาท</span>
          <input value={profile.role} onChange={(event) => onChange({ role: event.target.value })} />
        </label>
        <label>
          <span>บริษัท/ทีม</span>
          <input value={profile.company} onChange={(event) => onChange({ company: event.target.value })} />
        </label>
        <label>
          <span>พื้นที่รับงาน</span>
          <input value={profile.location} onChange={(event) => onChange({ location: event.target.value })} />
        </label>
        <label>
          <span>โทรศัพท์</span>
          <input value={profile.phone} onChange={(event) => onChange({ phone: event.target.value })} />
        </label>
        <label>
          <span>ความถนัด</span>
          <input
            value={profile.specialties.join(", ")}
            onChange={(event) =>
              onChange({
                specialties: event.target.value
                  .split(",")
                  .map((item) => item.trim())
                  .filter(Boolean)
              })
            }
          />
        </label>
        <label className="social-profile-bio">
          <span>แนะนำตัว</span>
          <textarea value={profile.bio} onChange={(event) => onChange({ bio: event.target.value })} />
        </label>
      </div>
      <div className="social-profile-preview">
        <SocialAvatar image={profile.avatarImage} name={profile.name} size="large" />
        <div>
          <strong>{profile.company}</strong>
          <small>{profile.role} · {profile.location}</small>
          <p>{profile.bio}</p>
        </div>
        <span>
          <Camera size={16} />
          รูปโปรไฟล์
        </span>
      </div>
      <div className="social-profile-posts">
        <PageHeader
          title="โพสต์ของฉัน"
          detail="จัดการโพสต์ที่สร้างจากบัญชีนี้โดยตรง"
        />
        {posts.length === 0 ? (
          <div className="social-empty-state compact">
            <MessageCircle size={18} />
            <strong>ยังไม่มีโพสต์จากบัญชีนี้</strong>
            <span>กลับไปหน้า Feed แล้วสร้างโพสต์แรกได้ทันที</span>
          </div>
        ) : (
          <div className="social-my-post-list">
            {posts.map((post) => (
              <article className={post.image ? "social-my-post has-image" : "social-my-post"} key={post.id}>
                {post.image && <img className="social-my-post-thumb" src={post.image.dataUrl} alt={post.image.name} />}
                <div>
                  <strong>{post.project}</strong>
                  <span>{post.category} · {formatSocialPostTime(post.createdAt)}</span>
                  <p>{post.content}</p>
                  <small>
                    {post.likes} ถูกใจ · {post.commentCount} ความเห็น · {post.shares} แชร์
                  </small>
                </div>
                <button
                  className="secondary-button danger-action"
                  onClick={() => onDeletePost(post.id)}
                  type="button"
                >
                  <Trash2 size={15} />
                  ลบโพสต์
                </button>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function App() {
  const [initialRoute] = useState(() => getWorkspaceRouteFromLocation());
  const [initialWorkspace] = useState(() => loadWorkspaceData());
  const initialDocument =
    initialWorkspace.documents.find(
      (document) => document.id === initialWorkspace.activeDocumentId
    ) ?? initialWorkspace.documents[0];
  const [documents, setDocuments] = useState<StoredDocument[]>(initialWorkspace.documents);
  const [activeDocumentId, setActiveDocumentId] = useState(initialWorkspace.activeDocumentId);
  const [activePage, setActivePage] = useState<AppPage>(
    initialRoute.appId === "builddocs" && isAppPage(initialRoute.tabKey)
      ? initialRoute.tabKey
      : "documents"
  );
  const [activeWorkspaceApp, setActiveWorkspaceApp] =
    useState<WorkspaceAppId>(initialRoute.appId);
  const [activeDesignWorkflowId, setActiveDesignWorkflowId] =
    useState<DesignWorkflowId>(
      initialRoute.appId === "designStudio" && isDesignWorkflowId(initialRoute.tabKey)
        ? initialRoute.tabKey
        : "envision"
    );
  const [activeLibraryTab, setActiveLibraryTab] = useState<LibraryTabId>(
    initialRoute.appId === "library" && isLibraryTabId(initialRoute.tabKey)
      ? initialRoute.tabKey
      : "images"
  );
  const [activeGenericSubnavByApp, setActiveGenericSubnavByApp] = useState<
    Partial<Record<WorkspaceAppId, string>>
  >(
    initialRoute.appId !== "builddocs" &&
      initialRoute.appId !== "designStudio" &&
      initialRoute.appId !== "library"
      ? { [initialRoute.appId]: initialRoute.tabKey }
      : {}
  );
  const [selectedVersionByApp, setSelectedVersionByApp] = useState<
    Partial<Record<WorkspaceAppId, string>>
  >(() => ({
    ...loadWorkspaceAppVersionSelection(),
    [initialRoute.appId]: initialRoute.versionId
  }));
  const [workspaceLanguage, setWorkspaceLanguage] = useState<WorkspaceLanguage>(() =>
    loadWorkspaceLanguage()
  );
  const buildDocsUiCopy = getWorkspaceLanguageCopy(buildDocsCopy, workspaceLanguage);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const backupInputRef = useRef<HTMLInputElement>(null);
  const [clients, setClients] = useState<ClientRecord[]>(initialWorkspace.clients);
  const [projects, setProjects] = useState<ProjectRecord[]>(initialWorkspace.projects);
  const initialEmployeeProjectOptions = getEmployeeProjectOptions(initialWorkspace.projects);
  const [initialEmployeeRecords] = useState<EmployeeRecord[]>(() =>
    loadEmployeeRecords(
      initialEmployeeProjectOptions,
      initialWorkspace.employees
    )
  );
  const [employees, setEmployees] = useState<EmployeeRecord[]>(initialEmployeeRecords);
  const [siteTeams, setSiteTeams] = useState<EmployeeSiteTeamRecord[]>(() =>
    loadEmployeeSiteTeamRecords(
      initialWorkspace.siteTeams,
      initialEmployeeRecords,
      initialEmployeeProjectOptions
    )
  );
  const [defects, setDefects] = useState<DefectRecord[]>(() =>
    loadDefectRecords(initialWorkspace.defects)
  );
  const [initialData] = useState<AppData>(() => initialDocument);
  const initialDocType =
    initialRoute.appId === "builddocs" && initialRoute.tabKey === "contracts"
      ? "contract"
      : initialDocument.docType;
  const [documentInfo, setDocumentInfo] = useState(initialData.documentInfo);
  const [docType, setDocType] = useState<DocumentType>(initialDocType);
  const [items, setItems] = useState<LineItem[]>(initialData.items);
  const [milestones, setMilestones] = useState<Milestone[]>(initialData.milestones);
  const [vatEnabled, setVatEnabled] = useState(initialData.vatEnabled);
  const [withholdingEnabled, setWithholdingEnabled] = useState(initialData.withholdingEnabled);
  const [selectedContractId, setSelectedContractId] = useState(initialData.selectedContractId);
  const [selectedBillingMilestoneId, setSelectedBillingMilestoneId] = useState(
    initialData.selectedBillingMilestoneId
  );
  const [documentStatus, setDocumentStatus] = useState(initialData.documentStatus);
  const [relationship, setRelationship] = useState(initialData.relationship);
  const [documentAuthorityState, setDocumentAuthorityState] = useState(() =>
    loadDocumentAuthorityState()
  );
  const [sheetUrl, setSheetUrl] = useState("");
  const [importStatus, setImportStatus] = useState(
    "รองรับคอลัมน์: รายการ, หน่วย, จำนวน, ราคา/หน่วย"
  );
  const [isImporting, setIsImporting] = useState(false);
  const [isSheetImportOpen, setIsSheetImportOpen] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(initialData.savedAt);
  const [toast, setToast] = useState("");
  const selectedWorkspaceApp = getWorkspaceApp(activeWorkspaceApp);
  const activeWorkspaceVersion = getWorkspaceAppVersion(
    selectedWorkspaceApp,
    selectedVersionByApp[activeWorkspaceApp]
  );

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.qty * item.price, 0),
    [items]
  );
  const vat = vatEnabled ? subtotal * 0.07 : 0;
  const withholding = withholdingEnabled ? subtotal * 0.03 : 0;
  const grandTotal = subtotal + vat - withholding;
  const selectedContract = useMemo(
    () =>
      contractTemplates.find((template) => template.id === selectedContractId) ??
      contractTemplates[0],
    [selectedContractId]
  );
  const selectedBillingMilestone = useMemo(
    () =>
      milestones.find((milestone) => milestone.id === selectedBillingMilestoneId) ??
      milestones[0],
    [milestones, selectedBillingMilestoneId]
  );
  const isMilestoneDocument =
    docType === "invoice" || (docType === "receipt" && relationship.kind === "receipt");
  const documentBillingRatio =
    isMilestoneDocument && selectedBillingMilestone
      ? selectedBillingMilestone.percent / 100
      : 1;
  const previewSubtotal = subtotal * documentBillingRatio;
  const previewVat = vat * documentBillingRatio;
  const previewWithholding = withholding * documentBillingRatio;
  const previewGrandTotal = grandTotal * documentBillingRatio;
  const billingSourceDocumentId =
    relationship.kind === "billing" && relationship.sourceDocumentId
      ? relationship.sourceDocumentId
      : activeDocumentId;
  const relatedBillingDocuments = useMemo(
    () =>
      documents.filter(
        (document) =>
          document.relationship.kind === "billing" &&
          document.relationship.sourceDocumentId === billingSourceDocumentId
      ),
    [documents, billingSourceDocumentId]
  );
  const relatedReceiptDocuments = useMemo(
    () =>
      documents.filter(
        (document) => document.relationship.kind === "receipt"
      ),
    [documents]
  );
  const activeReceiptDocument = useMemo(
    () =>
      documents.find(
        (document) =>
          document.relationship.kind === "receipt" &&
          document.relationship.sourceDocumentId === activeDocumentId
      ),
    [documents, activeDocumentId]
  );
  const currentProjectDocuments = useMemo(() => {
    const projectKey = getProjectSyncKey(documentInfo.projectName, documentInfo.clientName);

    return documents.filter(
      (document) =>
        getProjectSyncKey(
          document.documentInfo.projectName,
          document.documentInfo.clientName
        ) === projectKey
    );
  }, [documents, documentInfo.clientName, documentInfo.projectName]);
  const activeStoredDocument = useMemo(
    () => documents.find((document) => document.id === activeDocumentId) ?? documents[0],
    [documents, activeDocumentId]
  );
  const activeDocumentNo = docType === "contract" ? documentInfo.contractNo : documentInfo.documentNo;
  const activeDocumentProjectId = useMemo(() => {
    const projectKey = getProjectSyncKey(documentInfo.projectName, documentInfo.clientName);
    return (
      projects.find((project) => getProjectSyncKey(project.name, project.clientName) === projectKey)
        ?.id ?? projectKey
    );
  }, [documentInfo.clientName, documentInfo.projectName, projects]);
  const authorityActorName =
    documentInfo.signerName || documentInfo.companyName || "Build By BIM User";
  const activeDocumentAuthority = useMemo<DocumentAuthorityRecord>(() => {
    const { authority } = ensureDocumentAuthority(documentAuthorityState, {
      documentId: activeDocumentId,
      documentNo: activeDocumentNo,
      documentType: docType,
      projectId: activeDocumentProjectId,
      preparedBy: { actorId: "local-user", actorName: authorityActorName }
    });

    return {
      ...authority,
      documentNo: activeDocumentNo,
      documentType: docType,
      projectId: activeDocumentProjectId,
      preparedById: authority.preparedById || "local-user",
      preparedByName: authority.preparedByName || authorityActorName
    };
  }, [
    documentAuthorityState,
    activeDocumentId,
    activeDocumentNo,
    activeDocumentProjectId,
    authorityActorName,
    docType
  ]);
  const activeDocumentAuthorityStamp = useMemo(
    () => buildDocumentAuthorityStamp(activeDocumentAuthority),
    [activeDocumentAuthority]
  );
  const documentAuthorityAccessState = loadProjectAccessState();
  const documentAuthorityAccessByAction = documentAuthorityActions.reduce<
    Record<DocumentAuthorityAction, ProjectAccessDecision>
  >((result, action) => {
    result[action] = evaluateDocumentAuthorityActionAccess(documentAuthorityAccessState, {
      action,
      memberId: LOCAL_PROJECT_ACCESS_ACTOR.memberId,
      workspaceRole: LOCAL_PROJECT_ACCESS_ACTOR.workspaceRole,
      projectId: activeDocumentProjectId
    });
    return result;
  }, {} as Record<DocumentAuthorityAction, ProjectAccessDecision>);
  const activeDocumentExportAccess = evaluateProjectAccessGuard(documentAuthorityAccessState, {
    memberId: LOCAL_PROJECT_ACCESS_ACTOR.memberId,
    workspaceRole: LOCAL_PROJECT_ACCESS_ACTOR.workspaceRole,
    projectId: activeDocumentProjectId,
    permission: "document.export"
  });
  const workspaceBackupAccess = evaluateProjectAccessGuard(documentAuthorityAccessState, {
    memberId: LOCAL_PROJECT_ACCESS_ACTOR.memberId,
    workspaceRole: LOCAL_PROJECT_ACCESS_ACTOR.workspaceRole,
    permission: "settings.manage"
  });
  const activeDocumentExportBlockedTitle = `Project Access: ${getProjectAccessDecisionText(activeDocumentExportAccess)}`;
  const workspaceBackupBlockedTitle = `Project Access: ${getProjectAccessDecisionText(workspaceBackupAccess)}`;
  const projectQuoteDocument = useMemo(
    () =>
      docType === "quote"
        ? activeStoredDocument
        : currentProjectDocuments.find((document) => document.docType === "quote"),
    [activeStoredDocument, currentProjectDocuments, docType]
  );
  const projectPurchaseOrderDocument = useMemo(
    () =>
      docType === "purchaseOrder"
        ? activeStoredDocument
        : currentProjectDocuments.find((document) => document.docType === "purchaseOrder"),
    [activeStoredDocument, currentProjectDocuments, docType]
  );

  const paidAmount =
    docType === "receipt" && relationship.kind === "receipt"
      ? previewGrandTotal
      : docType === "receipt"
      ? milestones
          .filter((milestone) => milestone.status === "paid" || milestone.status === "ready")
          .reduce((sum, milestone) => sum + (grandTotal * milestone.percent) / 100, 0)
      : 0;

  const currentData = useMemo<AppData>(
    () => ({
      documentInfo,
      docType,
      items,
      milestones,
      vatEnabled,
      withholdingEnabled,
      selectedContractId,
      selectedBillingMilestoneId,
      documentStatus,
      relationship,
      savedAt: lastSavedAt
    }),
    [
      documentInfo,
      docType,
      items,
      milestones,
      vatEnabled,
      withholdingEnabled,
      selectedContractId,
      selectedBillingMilestoneId,
      documentStatus,
      relationship,
      lastSavedAt
    ]
  );

  const syncWorkspaceUrl = (
    appId: WorkspaceAppId,
    tabKey: string,
    mode: "push" | "replace" = "push",
    versionId = selectedVersionByApp[appId]
  ) => {
    if (typeof window === "undefined") {
      return;
    }

    const normalizedVersionId = normalizeWorkspaceAppVersionId(appId, versionId);
    const nextRoute = buildWorkspaceRoute(appId, tabKey, normalizedVersionId);
    const currentRoute = `${window.location.pathname}${window.location.search}`;

    if (currentRoute === nextRoute) {
      return;
    }

    if (mode === "replace") {
      window.history.replaceState({ appId, tabKey, versionId: normalizedVersionId }, "", nextRoute);
      return;
    }

    window.history.pushState({ appId, tabKey, versionId: normalizedVersionId }, "", nextRoute);
  };

  useEffect(() => {
    const handlePopState = () => {
      const nextRoute = getWorkspaceRouteFromLocation();
      setActiveWorkspaceApp(nextRoute.appId);
      setSelectedVersionByApp((current) => {
        const next = { ...current, [nextRoute.appId]: nextRoute.versionId };
        saveWorkspaceAppVersionSelection(next);
        return next;
      });

      if (nextRoute.appId === "builddocs" && isAppPage(nextRoute.tabKey)) {
        setActivePage(nextRoute.tabKey);

        if (nextRoute.tabKey === "contracts") {
          setDocType("contract");
        }

        if (nextRoute.tabKey === "sheets") {
          setIsSheetImportOpen(true);
        }

        return;
      }

      if (nextRoute.appId === "designStudio" && isDesignWorkflowId(nextRoute.tabKey)) {
        setActiveDesignWorkflowId(nextRoute.tabKey);
        return;
      }

      if (nextRoute.appId === "library" && isLibraryTabId(nextRoute.tabKey)) {
        setActiveLibraryTab(nextRoute.tabKey);
        return;
      }

      setActiveGenericSubnavByApp((current) => ({
        ...current,
        [nextRoute.appId]: nextRoute.tabKey
      }));
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    setDocumentAuthorityState((current) => {
      const { state, authority } = ensureDocumentAuthority(current, {
        documentId: activeDocumentId,
        documentNo: activeDocumentNo,
        documentType: docType,
        projectId: activeDocumentProjectId,
        preparedBy: { actorId: "local-user", actorName: authorityActorName }
      });
      const nextAuthority: DocumentAuthorityRecord = {
        ...authority,
        documentNo: activeDocumentNo,
        documentType: docType,
        projectId: activeDocumentProjectId,
        preparedById: authority.preparedById || "local-user",
        preparedByName: authority.preparedByName || authorityActorName
      };

      const isUnchanged =
        authority.documentNo === nextAuthority.documentNo &&
        authority.documentType === nextAuthority.documentType &&
        authority.projectId === nextAuthority.projectId &&
        authority.preparedById === nextAuthority.preparedById &&
        authority.preparedByName === nextAuthority.preparedByName;

      if (isUnchanged && state === current) {
        return current;
      }

      const nextState = upsertDocumentAuthority(state, nextAuthority);
      saveDocumentAuthorityState(nextState);
      return nextState;
    });
  }, [activeDocumentId, activeDocumentNo, activeDocumentProjectId, authorityActorName, docType]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const savedAt = new Date().toISOString();
      const nextData = { ...currentData, savedAt };
      setDocuments((currentDocuments) => {
        const nextDocuments = currentDocuments
          .map((document) =>
            document.id === activeDocumentId
              ? createDocumentRecord(nextData, {
                  ...document,
                  title: getDocumentTitle(nextData),
                  updatedAt: savedAt,
                  total: calculateTotal(nextData)
                })
              : document
          )
          .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
        saveWorkspaceData({
          activeDocumentId,
          documents: nextDocuments,
          clients,
          projects,
          employees,
          siteTeams,
          defects
        });
        return nextDocuments;
      });
      setLastSavedAt(savedAt);
    }, 450);

    return () => window.clearTimeout(timeout);
  }, [
    documentInfo,
    docType,
    items,
    milestones,
    vatEnabled,
    withholdingEnabled,
    selectedContractId,
    selectedBillingMilestoneId,
    documentStatus,
    relationship,
    activeDocumentId,
    grandTotal,
    clients,
    projects,
    employees,
    siteTeams,
    defects
  ]);

  useEffect(() => {
    const projectOptions = getEmployeeProjectOptions(projects);
    const validProjectIds = new Set(projectOptions.map((project) => project.id));

    setEmployees((current) => {
      let didChange = false;
      const nextEmployees = current.map((employee) => {
        const assignedProjectIds = getEmployeeAssignedProjectIds(
          employee.team,
          projectOptions,
          employee.assignedProjectIds
        );

        if (assignedProjectIds.join("|") === employee.assignedProjectIds.join("|")) {
          return employee;
        }

        didChange = true;
        return { ...employee, assignedProjectIds };
      });

      return didChange ? nextEmployees : current;
    });

    setSiteTeams((current) => {
      let didChange = false;
      const nextTeams = current.map((team) => {
        if (validProjectIds.has(team.projectId)) {
          return team;
        }

        didChange = true;
        return { ...team, projectId: projectOptions[0]?.id ?? "", updatedAt: new Date().toISOString() };
      });

      return didChange ? nextTeams : current;
    });
  }, [projects]);

  useEffect(() => {
    saveWorkspaceData({
      activeDocumentId,
      documents,
      clients,
      projects,
      employees,
      siteTeams,
      defects
    });
    removeLegacyEmployeeRecords();
  }, [employees, siteTeams]);

  useEffect(() => {
    saveWorkspaceData({
      activeDocumentId,
      documents,
      clients,
      projects,
      employees,
      siteTeams,
      defects
    });
    removeLegacyDefectRecords();
  }, [defects]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeout = window.setTimeout(() => setToast(""), 2800);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const updateItem = (id: number, patch: Partial<LineItem>) => {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  };

  const removeItem = (id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
  };

  const addItem = () => {
    setItems((current) => {
      const nextId = current.reduce((maxId, item) => Math.max(maxId, item.id), 0) + 1;
      return [
        ...current,
        {
          id: nextId,
          name: "รายการงานใหม่",
          unit: "งาน",
          qty: 1,
          price: 0
        }
      ];
    });
  };

  const openBoqDatabase = () => {
    setActiveWorkspaceApp("boqData");
    setActiveGenericSubnavByApp((current) => ({ ...current, boqData: "database" }));
    syncWorkspaceUrl("boqData", "database");
    setToast("เปิด BOQ Data เพื่อเลือกรายการเข้าเอกสาร");
  };

  const applyAuthorityWorkflowAction = (action: DocumentAuthorityAction) => {
    const access = evaluateDocumentAuthorityActionAccess(loadProjectAccessState(), {
      action,
      memberId: LOCAL_PROJECT_ACCESS_ACTOR.memberId,
      workspaceRole: LOCAL_PROJECT_ACCESS_ACTOR.workspaceRole,
      projectId: activeDocumentProjectId
    });
    if (!access.allowed) {
      setToast(`Project Access blocked: ${getProjectAccessDecisionText(access)}`);
      return;
    }

    const actor = {
      actorId: LOCAL_PROJECT_ACCESS_ACTOR.memberId,
      actorName: LOCAL_PROJECT_ACCESS_ACTOR.memberName || authorityActorName
    };

    setDocumentAuthorityState((current) => {
      const { state, authority } = ensureDocumentAuthority(current, {
        documentId: activeDocumentId,
        documentNo: activeDocumentNo,
        documentType: docType,
        projectId: activeDocumentProjectId,
        preparedBy: actor
      });
      const currentAuthority: DocumentAuthorityRecord = {
        ...authority,
        documentNo: activeDocumentNo,
        documentType: docType,
        projectId: activeDocumentProjectId,
        preparedById: authority.preparedById || actor.actorId,
        preparedByName: authority.preparedByName || actor.actorName
      };
      const updatedAuthority = applyDocumentAuthorityAction(currentAuthority, action, actor, {
        writeAudit: true
      });
      const nextState = upsertDocumentAuthority(state, updatedAuthority);
      saveDocumentAuthorityState(nextState);
      return nextState;
    });

    if (action === "submit") setDocumentStatus("sent");
    if (action === "approve") setDocumentStatus("approved");
    if (action === "void") setDocumentStatus("cancelled");

    setToast(`Document Authority: ${documentAuthorityActionLabels[action]} แล้ว`);
  };

  const evaluateBuildDocsProjectAccess = (permission: ProjectPermission, projectId?: string) =>
    evaluateProjectAccessGuard(loadProjectAccessState(), {
      memberId: LOCAL_PROJECT_ACCESS_ACTOR.memberId,
      workspaceRole: LOCAL_PROJECT_ACCESS_ACTOR.workspaceRole,
      projectId,
      permission
    });

  const guardBuildDocsProjectAccess = (
    decision: ProjectAccessDecision,
    actionLabel: string
  ) => {
    if (decision.allowed) return true;
    setToast(`Project Access blocked ${actionLabel}: ${getProjectAccessDecisionText(decision)}`);
    return false;
  };

  const addBoqItemToDocument = (row: BoqCatalogRow) => {
    addBoqItemsToDocument([row]);
  };

  const addBoqItemsToDocument = (rows: BoqCatalogRow[]) => {
    const usableRows = rows.filter((row) => getBoqRowUnitPrice(row) > 0);

    if (!usableRows.length) {
      setToast("รายการที่เลือกเป็นหมวดหลัก ยังเพิ่มเข้าเอกสารไม่ได้");
      return;
    }

    setItems((current) => {
      const nextId = current.reduce((maxId, item) => Math.max(maxId, item.id), 0) + 1;
      const nextItems = usableRows.map((row, index) =>
        createLineItemFromBoqRow(row, nextId + index)
      );

      return [...current, ...nextItems];
    });
    setActiveWorkspaceApp("builddocs");
    setActivePage("documents");
    syncWorkspaceUrl("builddocs", "documents");
    setToast(
      usableRows.length === 1
        ? `เพิ่ม ${usableRows[0].keynote} จาก BOQ Data เข้าเอกสารแล้ว`
        : `เพิ่ม ${usableRows.length} รายการจาก BOQ Data เข้าเอกสารแล้ว`
    );
  };

  const updateMilestone = (id: number, patch: Partial<Milestone>) => {
    setMilestones((current) =>
      current.map((milestone) =>
        milestone.id === id ? { ...milestone, ...patch } : milestone
      )
    );
  };

  const updateDocumentInfo = (field: keyof typeof documentInfo, value: string) => {
    setDocumentInfo((current) => ({ ...current, [field]: value }));
  };

  const loadDocumentToEditor = (document: AppData) => {
    setDocumentInfo(document.documentInfo);
    setDocType(document.docType);
    setItems(document.items);
    setMilestones(document.milestones);
    setVatEnabled(document.vatEnabled);
    setWithholdingEnabled(document.withholdingEnabled);
    setSelectedContractId(document.selectedContractId);
    setSelectedBillingMilestoneId(document.selectedBillingMilestoneId);
    setDocumentStatus(document.documentStatus);
    setRelationship(document.relationship);
    setLastSavedAt(document.savedAt);
  };

  const saveDocuments = (
    nextDocuments: StoredDocument[],
    nextActiveDocumentId = activeDocumentId,
    nextClients = clients,
    nextProjects = projects,
    nextEmployees = employees,
    nextSiteTeams = siteTeams,
    nextDefects = defects
  ) => {
    const sortedDocuments = [...nextDocuments].sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt)
    );
    setDocuments(sortedDocuments);
    setActiveDocumentId(nextActiveDocumentId);
    saveWorkspaceData({
      activeDocumentId: nextActiveDocumentId,
      documents: sortedDocuments,
      clients: nextClients,
      projects: nextProjects,
      employees: nextEmployees,
      siteTeams: nextSiteTeams,
      defects: nextDefects
    });
  };

  const getSavedActiveDocumentSnapshot = () => {
    const savedAt = new Date().toISOString();
    const activeData = { ...currentData, savedAt };
    const activeDocument = documents.find((document) => document.id === activeDocumentId);
    const activeRecord = createDocumentRecord(activeData, {
      ...activeDocument,
      title: getDocumentTitle(activeData),
      updatedAt: savedAt,
      total: calculateTotal(activeData)
    });
    const savedDocuments = documents.some((document) => document.id === activeDocumentId)
      ? documents.map((document) =>
          document.id === activeDocumentId ? activeRecord : document
        )
      : [activeRecord, ...documents];

    return { activeRecord, savedDocuments, savedAt };
  };

  const activateDocument = (document: StoredDocument, page?: AppPage) => {
    const nextPage = page ?? (document.docType === "contract" ? "contracts" : "documents");
    setActiveDocumentId(document.id);
    saveWorkspaceData({
      activeDocumentId: document.id,
      documents,
      clients,
      projects,
      employees,
      siteTeams,
      defects
    });
    loadDocumentToEditor(document);
    setActivePage(nextPage);

    if (activeWorkspaceApp === "builddocs") {
      syncWorkspaceUrl("builddocs", nextPage);
    }
  };

  const selectDocument = (id: string) => {
    const document = documents.find((item) => item.id === id);

    if (!document || document.id === activeDocumentId) {
      return;
    }

    activateDocument(document);
    setToast("เปิดเอกสารที่บันทึกไว้แล้ว");
  };

  const openSyncedDocument = (id: string) => {
    const document = documents.find((item) => item.id === id);

    if (!document) {
      setToast("ไม่พบเอกสารที่เชื่อมกับโครงการนี้");
      return;
    }

    const nextPage = document.docType === "contract" ? "contracts" : "documents";
    activateDocument(document, nextPage);
    setActiveWorkspaceApp("builddocs");
    syncWorkspaceUrl("builddocs", nextPage);
    setToast("ซิงก์ข้อมูลจาก Defect ไป Docs แล้ว");
  };

  const openQuoteWorkflowCard = () => {
    const { activeRecord, savedDocuments } = getSavedActiveDocumentSnapshot();

    if (activeRecord.docType === "quote") {
      saveDocuments(savedDocuments, activeRecord.id);
      loadDocumentToEditor(activeRecord);
      setActivePage("documents");
      syncWorkspaceUrl("builddocs", "documents");
      setToast("เปิดใบเสนอราคาปัจจุบันแล้ว");
      return;
    }

    const projectKey = getProjectSyncKey(
      activeRecord.documentInfo.projectName,
      activeRecord.documentInfo.clientName
    );
    const existingQuote = savedDocuments.find(
      (document) =>
        document.docType === "quote" &&
        getProjectSyncKey(
          document.documentInfo.projectName,
          document.documentInfo.clientName
        ) === projectKey
    );

    if (existingQuote) {
      saveDocuments(savedDocuments, existingQuote.id);
      loadDocumentToEditor(existingQuote);
      setActivePage("documents");
      syncWorkspaceUrl("builddocs", "documents");
      setToast("เปิดใบเสนอราคาที่เชื่อมกับโครงการนี้แล้ว");
      return;
    }

    const quoteDocument = createQuoteDocument(activeRecord);
    saveDocuments([quoteDocument, ...savedDocuments], quoteDocument.id);
    loadDocumentToEditor(quoteDocument);
    setActivePage("documents");
    syncWorkspaceUrl("builddocs", "documents");
    setImportStatus("สร้างใบเสนอราคาจากข้อมูลเอกสารปัจจุบันแล้ว");
    setToast("สร้างใบเสนอราคาแล้ว");
  };

  const openPurchaseOrderWorkflowCard = () => {
    const { activeRecord, savedDocuments } = getSavedActiveDocumentSnapshot();

    if (activeRecord.docType === "purchaseOrder") {
      saveDocuments(savedDocuments, activeRecord.id);
      loadDocumentToEditor(activeRecord);
      setActivePage("documents");
      syncWorkspaceUrl("builddocs", "documents");
      setToast("เปิดใบสั่งซื้อปัจจุบันแล้ว");
      return;
    }

    const projectKey = getProjectSyncKey(
      activeRecord.documentInfo.projectName,
      activeRecord.documentInfo.clientName
    );
    const existingQuote =
      activeRecord.docType === "quote"
        ? activeRecord
        : savedDocuments.find(
            (document) =>
              document.docType === "quote" &&
              getProjectSyncKey(
                document.documentInfo.projectName,
                document.documentInfo.clientName
              ) === projectKey
          );
    const sourceQuote = existingQuote ?? createQuoteDocument(activeRecord);
    const savedDocumentsWithQuote = existingQuote ? savedDocuments : [sourceQuote, ...savedDocuments];
    const existingPurchaseOrder = savedDocumentsWithQuote.find(
      (document) =>
        document.docType === "purchaseOrder" &&
        document.relationship.kind === "purchase" &&
        document.relationship.sourceDocumentId === sourceQuote.id
    );

    if (existingPurchaseOrder) {
      saveDocuments(savedDocumentsWithQuote, existingPurchaseOrder.id);
      loadDocumentToEditor(existingPurchaseOrder);
      setActivePage("documents");
      syncWorkspaceUrl("builddocs", "documents");
      setToast("เปิดใบสั่งซื้อที่เชื่อมกับใบเสนอราคาแล้ว");
      return;
    }

    const purchaseOrderDocument = createPurchaseOrderDocument(sourceQuote);
    saveDocuments([purchaseOrderDocument, ...savedDocumentsWithQuote], purchaseOrderDocument.id);
    loadDocumentToEditor(purchaseOrderDocument);
    setActivePage("documents");
    syncWorkspaceUrl("builddocs", "documents");
    setImportStatus("สร้างใบสั่งซื้อและเชื่อมกับเอกสารต้นทางแล้ว");
    setToast(
      existingQuote
        ? "สร้างใบสั่งซื้อจากใบเสนอราคาแล้ว"
        : "สร้างใบเสนอราคาและใบสั่งซื้อจากข้อมูลปัจจุบันแล้ว"
    );
  };

  const openDefectTracker = () => {
    const savedAt = new Date().toISOString();
    const activeData = { ...currentData, savedAt };
    const activeDocument = documents.find((document) => document.id === activeDocumentId);
    const activeRecord = createDocumentRecord(activeData, {
      ...activeDocument,
      title: getDocumentTitle(activeData),
      updatedAt: savedAt,
      total: calculateTotal(activeData)
    });
    const nextDocuments = documents
      .map((document) => (document.id === activeDocumentId ? activeRecord : document))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

    setDocuments(nextDocuments);
    setLastSavedAt(savedAt);
    saveWorkspaceData({ activeDocumentId, documents: nextDocuments, clients, projects, employees, defects });
    setActiveWorkspaceApp("defectTracker");
    setActiveGenericSubnavByApp((current) => ({ ...current, defectTracker: "overview" }));
    syncWorkspaceUrl("defectTracker", "overview");
    setToast("เปิด Defect พร้อมซิงก์โครงการปัจจุบันแล้ว");
  };

  const createNewDocument = () => {
    const document = createBlankDocument(documentInfo);
    saveDocuments([document, ...documents], document.id);
    loadDocumentToEditor(document);
    setActivePage("documents");
    syncWorkspaceUrl("builddocs", "documents");
    setImportStatus("สร้างเอกสารใหม่แล้ว");
    setToast("สร้างเอกสารใหม่แล้ว");
  };

  const duplicateActiveDocument = () => {
    const document = duplicateDocument(currentData);
    const nextPage = document.docType === "contract" ? "contracts" : "documents";
    saveDocuments([document, ...documents], document.id);
    loadDocumentToEditor(document);
    setActivePage(nextPage);
    syncWorkspaceUrl("builddocs", nextPage);
    setToast("คัดลอกเอกสารแล้ว");
  };

  const openPage = (page: AppPage) => {
    if (page === "contracts" && relationship.kind === "billing" && relationship.sourceDocumentId) {
      const sourceDocument = documents.find((document) => document.id === relationship.sourceDocumentId);

      if (sourceDocument) {
        activateDocument(sourceDocument, "contracts");
        syncWorkspaceUrl("builddocs", "contracts");
        setToast("เปิดสัญญาต้นทางของใบวางบิลแล้ว");
        return;
      }
    }

    setActivePage(page);

    if (page === "contracts") {
      setDocType("contract");
    }

    if (page === "sheets") {
      setIsSheetImportOpen(true);
    }

    syncWorkspaceUrl("builddocs", page);
  };

  const openBillingInvoice = (milestoneId: number) => {
    const savedAt = new Date().toISOString();
    const activeData = { ...currentData, savedAt };
    const activeDocument = documents.find((document) => document.id === activeDocumentId);
    const activeRecord = createDocumentRecord(activeData, {
      ...activeDocument,
      title: getDocumentTitle(activeData),
      updatedAt: savedAt,
      total: calculateTotal(activeData)
    });
    const savedDocuments = documents.map((document) =>
      document.id === activeDocumentId ? activeRecord : document
    );
    const sourceDocumentId =
      activeData.relationship.kind === "billing" && activeData.relationship.sourceDocumentId
        ? activeData.relationship.sourceDocumentId
        : activeDocumentId;
    const sourceDocument =
      savedDocuments.find((document) => document.id === sourceDocumentId) ?? activeRecord;
    const existingBillingDocument = savedDocuments.find(
      (document) =>
        document.relationship.kind === "billing" &&
        document.relationship.sourceDocumentId === sourceDocument.id &&
        document.relationship.sourceMilestoneId === milestoneId
    );

    if (existingBillingDocument) {
      saveDocuments(savedDocuments, existingBillingDocument.id);
      loadDocumentToEditor(existingBillingDocument);
      setActivePage("documents");
      syncWorkspaceUrl("builddocs", "documents");
      setToast("เปิดใบวางบิลของงวดนี้แล้ว");
      return;
    }

    const billedSourceData = {
      ...sourceDocument,
      documentStatus: "billed" as const,
      milestones: sourceDocument.milestones.map((milestone) =>
        milestone.id === milestoneId && milestone.status !== "paid"
          ? { ...milestone, status: "ready" as const }
          : milestone
      ),
      savedAt
    };
    const billedSourceDocument = createDocumentRecord(billedSourceData, {
      ...sourceDocument,
      updatedAt: savedAt,
      total: calculateTotal(billedSourceData)
    });
    const billingDocument = createBillingDocument(billedSourceDocument, milestoneId);
    const documentsWithBilledSource = savedDocuments.map((document) =>
      document.id === billedSourceDocument.id ? billedSourceDocument : document
    );
    saveDocuments([billingDocument, ...documentsWithBilledSource], billingDocument.id);
    loadDocumentToEditor(billingDocument);
    setActivePage("documents");
    syncWorkspaceUrl("builddocs", "documents");
    setImportStatus("สร้างใบวางบิลแยกจากงวดงานแล้ว");
    setToast("สร้างใบวางบิลแยกจากสัญญาแล้ว");
  };

  const openContractBilling = () => {
    if (relationship.kind === "billing" && relationship.sourceDocumentId) {
      const sourceDocument = documents.find((document) => document.id === relationship.sourceDocumentId);

      if (sourceDocument) {
        activateDocument(sourceDocument, "contracts");
        setToast("เปิดสัญญาต้นทางของใบวางบิลแล้ว");
        return;
      }
    }

    setDocType("contract");
    setActivePage("contracts");
    syncWorkspaceUrl("builddocs", "contracts");
    setToast("เปิดสัญญาพร้อมงวดวางบิลแล้ว");
  };

  const openRelatedSourceDocument = () => {
    if (!relationship.sourceDocumentId) {
      return;
    }

    const sourceDocument = documents.find((document) => document.id === relationship.sourceDocumentId);

    if (!sourceDocument) {
      setToast("ไม่พบเอกสารต้นทาง");
      return;
    }

    activateDocument(sourceDocument, sourceDocument.docType === "contract" ? "contracts" : "documents");
    setToast("เปิดเอกสารต้นทางแล้ว");
  };

  const createReceiptFromActiveInvoice = () => {
    if (docType !== "invoice" || relationship.kind !== "billing") {
      setToast("ออกใบเสร็จได้จากใบวางบิลเท่านั้น");
      return;
    }

    const savedAt = new Date().toISOString();
    const activeData = { ...currentData, savedAt };
    const activeDocument = documents.find((document) => document.id === activeDocumentId);
    const activeRecord = createDocumentRecord(activeData, {
      ...activeDocument,
      title: getDocumentTitle(activeData),
      updatedAt: savedAt,
      total: calculateTotal(activeData)
    });
    const savedDocuments = documents.map((document) =>
      document.id === activeDocumentId ? activeRecord : document
    );
    const existingReceipt = savedDocuments.find(
      (document) =>
        document.relationship.kind === "receipt" &&
        document.relationship.sourceDocumentId === activeRecord.id
    );

    if (existingReceipt) {
      saveDocuments(savedDocuments, existingReceipt.id);
      loadDocumentToEditor(existingReceipt);
      setActivePage("documents");
      setToast("เปิดใบเสร็จของใบวางบิลนี้แล้ว");
      return;
    }

    const receiptDocument = createReceiptDocument(activeRecord);
    const paidInvoiceData = {
      ...activeRecord,
      documentStatus: "paid" as const,
      savedAt
    };
    const paidInvoice = createDocumentRecord(paidInvoiceData, {
      ...activeRecord,
      updatedAt: savedAt,
      total: calculateTotal(paidInvoiceData)
    });
    const sourceContractId = activeRecord.relationship.sourceDocumentId;
    const sourceMilestoneId = activeRecord.relationship.sourceMilestoneId;
    const updatedDocuments = savedDocuments.map((document) => {
      if (document.id === activeRecord.id) {
        return paidInvoice;
      }

      if (sourceContractId && document.id === sourceContractId && sourceMilestoneId) {
        const paidContractData = {
          ...document,
          milestones: document.milestones.map((milestone) =>
            milestone.id === sourceMilestoneId ? { ...milestone, status: "paid" as const } : milestone
          ),
          savedAt
        };

        return createDocumentRecord(paidContractData, {
          ...document,
          updatedAt: savedAt,
          total: calculateTotal(paidContractData)
        });
      }

      return document;
    });

    saveDocuments([receiptDocument, ...updatedDocuments], receiptDocument.id);
    loadDocumentToEditor(receiptDocument);
    setActivePage("documents");
    setImportStatus("สร้างใบเสร็จรับเงินจากใบวางบิลแล้ว");
    setToast("สร้างใบเสร็จรับเงินแล้ว");
  };

  const saveCurrentClientRecord = () => {
    const existingClient = clients.find(
      (client) =>
        client.name.toLocaleLowerCase("th-TH") ===
        documentInfo.clientName.toLocaleLowerCase("th-TH")
    );
    const nextClient = createClientRecordFromDocument(currentData, existingClient);
    const nextClients = [
      nextClient,
      ...clients.filter((client) => client.id !== nextClient.id)
    ].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

    setClients(nextClients);
    saveWorkspaceData({ activeDocumentId, documents, clients: nextClients, projects, employees, defects });
    setToast("บันทึกลูกค้าเข้าฐานข้อมูลแล้ว");
  };

  const applyClientRecord = (client: ClientRecord) => {
    setDocumentInfo((current) => ({
      ...current,
      clientName: client.name,
      clientAddress: client.address,
      clientPhone: client.phone
    }));
    openPage("documents");
    setToast("นำข้อมูลลูกค้ามาใช้กับเอกสารแล้ว");
  };

  const saveCurrentProjectRecord = () => {
    const existingClient = clients.find(
      (client) =>
        client.name.toLocaleLowerCase("th-TH") ===
        documentInfo.clientName.toLocaleLowerCase("th-TH")
    );
    const nextClient = createClientRecordFromDocument(currentData, existingClient);
    const nextClients = [
      nextClient,
      ...clients.filter((client) => client.id !== nextClient.id)
    ].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    const existingProject = projects.find(
      (project) =>
        project.name.toLocaleLowerCase("th-TH") ===
          documentInfo.projectName.toLocaleLowerCase("th-TH") &&
        project.clientName.toLocaleLowerCase("th-TH") ===
          documentInfo.clientName.toLocaleLowerCase("th-TH")
    );
    const nextProject = createProjectRecordFromDocument(
      currentData,
      nextClient.id,
      existingProject
    );
    const nextProjects = [
      nextProject,
      ...projects.filter((project) => project.id !== nextProject.id)
    ].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

    setClients(nextClients);
    setProjects(nextProjects);
    saveWorkspaceData({
      activeDocumentId,
      documents,
      clients: nextClients,
      projects: nextProjects,
      employees,
      defects
    });
    setToast("บันทึกโครงการเข้าฐานข้อมูลแล้ว");
  };

  const applyProjectRecord = (project: ProjectRecord) => {
    const client = project.clientId
      ? clients.find((item) => item.id === project.clientId)
      : clients.find((item) => item.name === project.clientName);

    setDocumentInfo((current) => ({
      ...current,
      projectName: project.name,
      templateName: project.templateName || current.templateName,
      paymentTerms: project.paymentTerms || current.paymentTerms,
      notes: project.notes || current.notes,
      clientName: client?.name ?? project.clientName,
      clientAddress: client?.address ?? current.clientAddress,
      clientPhone: client?.phone ?? current.clientPhone
    }));
    openPage("documents");
    setToast("นำข้อมูลโครงการมาใช้กับเอกสารแล้ว");
  };

  const updateClientRecord = (
    clientId: string,
    patch: Pick<ClientRecord, "name" | "address" | "phone" | "taxId">
  ) => {
    const existingClient = clients.find((client) => client.id === clientId);
    const nextName = patch.name.trim();

    if (!existingClient) {
      setToast("ไม่พบลูกค้าที่ต้องการแก้ไข");
      return false;
    }

    if (!nextName) {
      setToast("กรุณากรอกชื่อลูกค้า");
      return false;
    }

    const updatedAt = new Date().toISOString();
    const nextClient: ClientRecord = {
      ...existingClient,
      name: nextName,
      address: patch.address.trim(),
      phone: patch.phone.trim(),
      taxId: patch.taxId.trim(),
      updatedAt
    };
    const nextClients = [
      nextClient,
      ...clients.filter((client) => client.id !== clientId)
    ].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    const nextProjects = projects
      .map((project) =>
        project.clientId === clientId
          ? { ...project, clientName: nextClient.name, updatedAt }
          : project
      )
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

    setClients(nextClients);
    setProjects(nextProjects);
    saveWorkspaceData({
      activeDocumentId,
      documents,
      clients: nextClients,
      projects: nextProjects,
      employees,
      defects
    });
    setToast("แก้ไขข้อมูลลูกค้าแล้ว");
    return true;
  };

  const deleteClientRecord = (clientId: string) => {
    const existingClient = clients.find((client) => client.id === clientId);

    if (!existingClient) {
      setToast("ไม่พบลูกค้าที่ต้องการลบ");
      return;
    }

    const updatedAt = new Date().toISOString();
    const nextClients = clients.filter((client) => client.id !== clientId);
    const nextProjects = projects.map((project) =>
      project.clientId === clientId
        ? { ...project, clientId: null, clientName: existingClient.name, updatedAt }
        : project
    );

    setClients(nextClients);
    setProjects(nextProjects);
    saveWorkspaceData({
      activeDocumentId,
      documents,
      clients: nextClients,
      projects: nextProjects,
      employees,
      defects
    });
    setToast("ลบลูกค้าแล้ว โครงการเดิมยังเก็บชื่อลูกค้าไว้");
  };

  const updateProjectRecord = (
    projectId: string,
    patch: Pick<
      ProjectRecord,
      "name" | "clientId" | "clientName" | "templateName" | "paymentTerms" | "notes"
    >
  ) => {
    const existingProject = projects.find((project) => project.id === projectId);
    const nextName = patch.name.trim();

    if (!existingProject) {
      setToast("ไม่พบโครงการที่ต้องการแก้ไข");
      return false;
    }

    if (!nextName) {
      setToast("กรุณากรอกชื่อโครงการ");
      return false;
    }

    const linkedClient = patch.clientId
      ? clients.find((client) => client.id === patch.clientId)
      : null;
    const updatedAt = new Date().toISOString();
    const nextProject: ProjectRecord = {
      ...existingProject,
      name: nextName,
      clientId: linkedClient?.id ?? null,
      clientName: linkedClient?.name ?? patch.clientName.trim(),
      templateName: patch.templateName.trim(),
      paymentTerms: patch.paymentTerms.trim(),
      notes: patch.notes.trim(),
      updatedAt
    };
    const nextProjects = [
      nextProject,
      ...projects.filter((project) => project.id !== projectId)
    ].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

    setProjects(nextProjects);
    saveWorkspaceData({
      activeDocumentId,
      documents,
      clients,
      projects: nextProjects,
      employees,
      defects
    });
    setToast("แก้ไขข้อมูลโครงการแล้ว");
    return true;
  };

  const deleteProjectRecord = (projectId: string) => {
    const existingProject = projects.find((project) => project.id === projectId);

    if (!existingProject) {
      setToast("ไม่พบโครงการที่ต้องการลบ");
      return;
    }

    const nextProjects = projects.filter((project) => project.id !== projectId);

    setProjects(nextProjects);
    saveWorkspaceData({
      activeDocumentId,
      documents,
      clients,
      projects: nextProjects,
      employees,
      defects
    });
    setToast("ลบโครงการแล้ว");
  };

  const saveNow = () => {
    const savedAt = new Date().toISOString();
    const nextData = { ...currentData, savedAt };
    const nextDocuments = documents.map((document) =>
      document.id === activeDocumentId
        ? createDocumentRecord(nextData, {
            ...document,
            title: getDocumentTitle(nextData),
            updatedAt: savedAt,
            total: calculateTotal(nextData)
          })
        : document
    );
    saveDocuments(nextDocuments);
    setLastSavedAt(savedAt);
    setToast("บันทึกเอกสารแล้ว");
  };

  const resetDemo = () => {
    const resetData = {
      ...initialAppData,
      documentInfo: {
        ...initialAppData.documentInfo,
        companyName: documentInfo.companyName,
        companyAddress: documentInfo.companyAddress,
        companyTaxId: documentInfo.companyTaxId,
        companyPhone: documentInfo.companyPhone,
        signerName: documentInfo.signerName
      }
    };
    loadDocumentToEditor(resetData);
    setImportStatus("รีเซ็ตเอกสารนี้เป็นข้อมูลตัวอย่างแล้ว");
    setToast("รีเซ็ตเอกสารนี้แล้ว");
  };

  const exportWorkspaceBackup = () => {
    if (
      !guardBuildDocsProjectAccess(
        evaluateBuildDocsProjectAccess("settings.manage", undefined),
        "workspace backup export"
      )
    ) {
      return;
    }

    const savedAt = new Date().toISOString();
    const activeData = { ...currentData, savedAt };
    const nextDocuments = documents.map((document) =>
      document.id === activeDocumentId
        ? createDocumentRecord(activeData, {
            ...document,
            title: getDocumentTitle(activeData),
            updatedAt: savedAt,
            total: calculateTotal(activeData)
          })
        : document
    );
    const payload = {
      version: 1,
      exportedAt: savedAt,
      workspace: {
        activeDocumentId,
        documents: nextDocuments,
        clients,
        projects,
        employees,
        siteTeams,
        defects
      }
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `builddocs-backup-${savedAt.slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    saveDocuments(nextDocuments);
    setLastSavedAt(savedAt);
    setToast("ดาวน์โหลดไฟล์ backup แล้ว");
  };

  const importWorkspaceBackup = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    try {
      const imported = normalizeImportedWorkspace(JSON.parse(await file.text()));
      const activeDocument =
        imported.documents.find((document) => document.id === imported.activeDocumentId) ??
        imported.documents[0];
      const importedEmployees = loadEmployeeRecords(
        getEmployeeProjectOptions(imported.projects),
        imported.employees
      );
      const importedSiteTeams = loadEmployeeSiteTeamRecords(
        imported.siteTeams,
        importedEmployees,
        getEmployeeProjectOptions(imported.projects)
      );
      const importedDefects = loadDefectRecords(imported.defects);
      setClients(imported.clients);
      setProjects(imported.projects);
      setEmployees(importedEmployees);
      setSiteTeams(importedSiteTeams);
      setDefects(importedDefects);
      saveDocuments(
        imported.documents,
        activeDocument.id,
        imported.clients,
        imported.projects,
        importedEmployees,
        importedSiteTeams,
        importedDefects
      );
      loadDocumentToEditor(activeDocument);
      setToast(
        `นำเข้า backup แล้ว ${imported.documents.length} เอกสาร / ${importedDefects.length} defect`
      );
    } catch (error) {
      setToast(error instanceof Error ? error.message : "นำเข้า backup ไม่สำเร็จ");
    }
  };

  const printDocument = () => {
    if (
      !guardBuildDocsProjectAccess(
        evaluateBuildDocsProjectAccess("document.export", activeDocumentProjectId),
        "print/PDF"
      )
    ) {
      return;
    }
    window.print();
  };

  const shareDocument = async () => {
    if (
      !guardBuildDocsProjectAccess(
        evaluateBuildDocsProjectAccess("document.export", activeDocumentProjectId),
        "share/send"
      )
    ) {
      return;
    }

    const summary = `${documentLabels[docType]} ${documentInfo.documentNo}
ลูกค้า: ${documentInfo.clientName}
โครงการ: ${documentInfo.projectName}
ยอดสุทธิ: ${money.format(previewGrandTotal)}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${documentLabels[docType]} ${documentInfo.documentNo}`,
          text: summary
        });
        setToast("เปิดระบบแชร์แล้ว");
        return;
      }

      await navigator.clipboard.writeText(summary);
      setToast("คัดลอกข้อความสำหรับส่ง LINE แล้ว");
    } catch {
      setToast("แชร์ไม่สำเร็จ ลองใช้ปุ่มพิมพ์/PDF แทน");
    }
  };

  const applyCsvImport = (csvText: string, label: string) => {
    const result = parseSheetCsv(csvText);
    setItems(result.items);
    setImportStatus(`${result.sourceLabel} จาก ${label}`);
  };

  const importSampleSheet = () => {
    try {
      applyCsvImport(getSampleSheetCsv(), "ตัวอย่าง Google Sheet");
    } catch (error) {
      setImportStatus(error instanceof Error ? error.message : "นำเข้าข้อมูลไม่สำเร็จ");
    }
  };

  const importGoogleSheet = async () => {
    const csvUrl = toGoogleSheetCsvUrl(sheetUrl);

    if (!csvUrl) {
      setImportStatus("ใส่ Google Sheet URL หรือ CSV URL ก่อน");
      return;
    }

    setIsImporting(true);
    setImportStatus("กำลังดึงข้อมูลจาก Google Sheet...");

    try {
      const response = await fetch(csvUrl);

      if (!response.ok) {
        throw new Error("ดึงข้อมูลไม่ได้ ตรวจว่า Sheet publish/share เป็น CSV แล้ว");
      }

      applyCsvImport(await response.text(), "Google Sheet");
    } catch (error) {
      setImportStatus(error instanceof Error ? error.message : "นำเข้าข้อมูลไม่สำเร็จ");
    } finally {
      setIsImporting(false);
    }
  };

  const getCurrentSubnavKeyForApp = (appId: WorkspaceAppId) => {
    if (appId === "builddocs") {
      return activePage;
    }

    if (appId === "designStudio") {
      return activeDesignWorkflowId;
    }

    if (appId === "library") {
      return activeLibraryTab;
    }

    return activeGenericSubnavByApp[appId] ?? getDefaultSubnavKey(appId);
  };

  const activeSubnavKey = getCurrentSubnavKeyForApp(activeWorkspaceApp);
  const activeSubnavItem =
    workspaceAppSubnavItems[activeWorkspaceApp].find((item) => item.key === activeSubnavKey) ??
    workspaceAppSubnavItems[activeWorkspaceApp][0];
  const sidebarAppSwitcherApps = useMemo(
    () =>
      workspaceApps.filter(
        (app) => app.id !== "library" && app.id !== "socialFeed" && app.id !== "agentChat"
      ),
    []
  );

  useEffect(() => {
    saveWorkspaceLanguage(workspaceLanguage);
    document.documentElement.lang = workspaceLanguage;
    document.documentElement.dir = getWorkspaceLanguageDirection(workspaceLanguage);
  }, [workspaceLanguage]);

  useEffect(() => {
    syncWorkspaceUrl(activeWorkspaceApp, activeSubnavKey, "replace", activeWorkspaceVersion.id);
  }, []);

  const selectWorkspaceApp = (appId: WorkspaceAppId) => {
    const tabKey = getCurrentSubnavKeyForApp(appId);
    setActiveWorkspaceApp(appId);
    syncWorkspaceUrl(appId, tabKey);
  };

  const selectWorkspaceAppTab = (appId: WorkspaceAppId, tabKey: string) => {
    setActiveWorkspaceApp(appId);

    if (appId === "builddocs" && isAppPage(tabKey)) {
      setActivePage(tabKey);
    } else if (appId === "designStudio" && isDesignWorkflowId(tabKey)) {
      setActiveDesignWorkflowId(tabKey);
    } else if (appId === "library" && isLibraryTabId(tabKey)) {
      setActiveLibraryTab(tabKey);
    } else {
      setActiveGenericSubnavByApp((current) => ({
        ...current,
        [appId]: normalizeSubnavKey(appId, tabKey)
      }));
    }

    syncWorkspaceUrl(appId, tabKey);
  };

  const selectWorkspaceAppVersion = (appId: WorkspaceAppId, versionId: string) => {
    const app = getWorkspaceApp(appId);
    const version = getWorkspaceAppVersion(app, versionId);

    setSelectedVersionByApp((current) => {
      const next = { ...current, [appId]: version.id };
      saveWorkspaceAppVersionSelection(next);
      return next;
    });

    if (appId === activeWorkspaceApp) {
      syncWorkspaceUrl(appId, getCurrentSubnavKeyForApp(appId), "replace", version.id);
    }

    setToast(`${app.shortLabel} ${version.label}`);
  };

  const selectDesignWorkflow = (id: DesignWorkflowId) => {
    setActiveDesignWorkflowId(id);

    if (activeWorkspaceApp === "designStudio") {
      syncWorkspaceUrl("designStudio", id);
    }
  };

  const selectLibraryTab = (id: LibraryTabId) => {
    setActiveLibraryTab(id);

    if (activeWorkspaceApp === "library") {
      syncWorkspaceUrl("library", id);
    }
  };

  const selectWorkspaceSubnav = (key: string) => {
    if (activeWorkspaceApp === "builddocs" && isAppPage(key)) {
      openPage(key);
      return;
    }

    if (activeWorkspaceApp === "designStudio" && isDesignWorkflowId(key)) {
      selectDesignWorkflow(key);
      return;
    }

    if (activeWorkspaceApp === "library" && isLibraryTabId(key)) {
      selectLibraryTab(key);
      return;
    }

    setActiveGenericSubnavByApp((current) => ({
      ...current,
      [activeWorkspaceApp]: key
    }));
    syncWorkspaceUrl(activeWorkspaceApp, key);
  };

  return (
    <div className={isSidebarCollapsed ? "app-shell sidebar-collapsed" : "app-shell"}>
      <aside className="sidebar" data-collapsed={isSidebarCollapsed}>
        <div className="brand">
          <div className="brand-mark">
            <Home size={20} />
          </div>
          <div>
            <strong>Build By BIM</strong>
            <span>OPERATING STUDIO</span>
          </div>
        </div>

        <div className="sidebar-scroll">
          <WorkspaceSidebarPinnedApps
            activeAppId={activeWorkspaceApp}
            items={[
              {
                appId: "socialFeed",
                label: "Social",
                icon: MessageCircle
              },
              {
                appId: "agentChat",
                label: "Agent",
                icon: WandSparkles
              },
              {
                appId: "library",
                label: "Library",
                icon: FolderOpen
              }
            ]}
            language={workspaceLanguage}
            onSelect={selectWorkspaceApp}
          />

          <WorkspaceAppSwitcher
            activeAppId={activeWorkspaceApp}
            apps={sidebarAppSwitcherApps}
            language={workspaceLanguage}
            onSelect={selectWorkspaceApp}
          />

          <div aria-hidden="true" className="sidebar-divider" />

          <WorkspaceAppSubnav
            activeApp={selectedWorkspaceApp}
            activeKey={activeSubnavKey}
            language={workspaceLanguage}
            onSelect={selectWorkspaceSubnav}
          />

          {activeWorkspaceApp === "builddocs" && (
            <div className="sidebar-app-extra">
              <div aria-hidden="true" className="sidebar-divider subtle" />
              <span className="sidebar-section-label">
                {getWorkspaceAppCopy(getWorkspaceApp("library"), workspaceLanguage).shortLabel}
              </span>
              <DocumentLibrary
                documents={documents}
                activeDocumentId={activeDocumentId}
                language={workspaceLanguage}
                onCreate={createNewDocument}
                onSelect={selectDocument}
              />
            </div>
          )}

          <WorkspaceSidebarSummary
            activeApp={selectedWorkspaceApp}
            activeVersion={activeWorkspaceVersion}
            apps={workspaceApps}
            documents={documents}
            itemCount={items.length}
            language={workspaceLanguage}
            total={activeWorkspaceApp === "builddocs" ? previewGrandTotal : undefined}
          />
        </div>
      </aside>

      <main className={activeWorkspaceApp === "builddocs" ? "workspace" : "workspace hub-workspace"}>
        <WorkspaceTopbar
          activeApp={selectedWorkspaceApp}
          activeSubnavItem={activeSubnavItem}
          activeVersion={activeWorkspaceVersion}
          isSidebarCollapsed={isSidebarCollapsed}
          language={workspaceLanguage}
          onOpenMap={() => selectWorkspaceApp("hub")}
          onSelectApp={() => selectWorkspaceApp(activeWorkspaceApp)}
          onSelectLanguage={setWorkspaceLanguage}
          onSelectSubnav={() => selectWorkspaceSubnav(activeSubnavItem.key)}
          onSelectVersion={(versionId) => selectWorkspaceAppVersion(activeWorkspaceApp, versionId)}
          onToggleSidebar={() => setIsSidebarCollapsed((current) => !current)}
        />
        {activeWorkspaceApp === "builddocs" ? (
        <>
        <header className="topbar">
          <div className="doc-heading">
            <span className="crumb">โครงการ / {documentInfo.projectName}</span>
            <div>
              <h1>
                {getBuildDocsInvoiceTitle(docType, selectedBillingMilestone, workspaceLanguage)}{" "}
                <small>({docType === "contract" ? documentInfo.contractNo : documentInfo.documentNo})</small>
              </h1>
              <button className="mini-icon" title="แก้ชื่อเอกสาร">
                <Edit3 size={16} />
              </button>
                <select
                  className="status-select"
                  value={documentStatus}
                  onChange={(event) =>
                    setDocumentStatus(event.target.value as AppData["documentStatus"])
                  }
                  aria-label={buildDocsUiCopy.documentStatusAria}
                >
                  <option value="draft">{buildDocsUiCopy.statusLabels.draft}</option>
                  <option value="sent">{buildDocsUiCopy.statusLabels.sent}</option>
                  <option value="approved">{buildDocsUiCopy.statusLabels.approved}</option>
                  <option value="billed">{buildDocsUiCopy.statusLabels.billed}</option>
                  <option value="paid">{buildDocsUiCopy.statusLabels.paid}</option>
                  <option value="cancelled">{buildDocsUiCopy.statusLabels.cancelled}</option>
                </select>
              {relationship.kind === "billing" && (
                <button
                  className="relation-chip"
                  data-testid="relation-source-button"
                  onClick={openRelatedSourceDocument}
                >
                  {buildDocsUiCopy.relationReference} {relationship.sourceDocumentNo} /{" "}
                  {relationship.sourceMilestoneName}
                </button>
              )}
              {relationship.kind === "receipt" && (
                <button
                  className="relation-chip"
                  data-testid="relation-source-button"
                  onClick={openRelatedSourceDocument}
                >
                  {buildDocsUiCopy.relationReceiptFrom} {relationship.sourceDocumentNo} /{" "}
                  {relationship.sourceMilestoneName}
                </button>
              )}
              {relationship.kind === "purchase" && (
                <button
                  className="relation-chip"
                  data-testid="relation-source-button"
                  onClick={openRelatedSourceDocument}
                >
                  {buildDocsUiCopy.relationPurchaseFrom} {relationship.sourceDocumentNo}
                </button>
              )}
              <span className="saved-chip">
                {lastSavedAt
                  ? `${buildDocsUiCopy.lastSavedPrefix} ${new Date(lastSavedAt).toLocaleTimeString(getWorkspaceLanguageLocale(workspaceLanguage), {
                      hour: "2-digit",
                      minute: "2-digit"
                    })}`
                  : buildDocsUiCopy.neverSaved}
              </span>
            </div>
          </div>
          <div className="top-actions">
            <button className="secondary-button" onClick={createNewDocument}>
              <FilePlus2 size={18} />
              {buildDocsUiCopy.newDocument}
            </button>
            <label className="search-box">
              <Search size={16} />
              <input placeholder={buildDocsUiCopy.searchPlaceholder} />
            </label>
            <button
              className="icon-button"
              title={
                activeDocumentExportAccess.allowed
                  ? buildDocsUiCopy.printOrSavePdf
                  : activeDocumentExportBlockedTitle
              }
              onClick={printDocument}
              disabled={!activeDocumentExportAccess.allowed}
            >
              <Download size={18} />
            </button>
            <button className="icon-button" title={buildDocsUiCopy.duplicateDocument} onClick={duplicateActiveDocument}>
              <Copy size={18} />
            </button>
            <button className="icon-button" title={buildDocsUiCopy.importBackup} onClick={() => backupInputRef.current?.click()}>
              <Upload size={18} />
            </button>
            <button
              className="icon-button"
              title={
                workspaceBackupAccess.allowed
                  ? buildDocsUiCopy.exportBackup
                  : workspaceBackupBlockedTitle
              }
              onClick={exportWorkspaceBackup}
              disabled={!workspaceBackupAccess.allowed}
            >
              <FileText size={18} />
            </button>
            <input
              ref={backupInputRef}
              className="hidden-file"
              type="file"
              accept="application/json"
              onChange={importWorkspaceBackup}
            />
            <button className="secondary-button" onClick={saveNow}>
              <Check size={18} />
              {buildDocsUiCopy.save}
            </button>
            <button className="secondary-button" onClick={resetDemo}>
              <RotateCcw size={18} />
              {buildDocsUiCopy.reset}
            </button>
            {docType === "invoice" && relationship.kind === "billing" && (
              <button
                className={activeReceiptDocument ? "secondary-button" : "primary-button"}
                data-testid="receipt-action-button"
                onClick={createReceiptFromActiveInvoice}
              >
                <ReceiptText size={18} />
                {activeReceiptDocument ? buildDocsUiCopy.openReceipt : buildDocsUiCopy.issueReceipt}
              </button>
            )}
            {docType === "receipt" && relationship.kind === "receipt" && (
              <button
                className="secondary-button"
                data-testid="open-source-document-button"
                onClick={openRelatedSourceDocument}
              >
                <Banknote size={18} />
                {buildDocsUiCopy.openBilling}
              </button>
            )}
            {docType === "quote" && (
              <button
                className={projectPurchaseOrderDocument ? "secondary-button" : "primary-button"}
                data-testid="purchase-order-action-button"
                onClick={openPurchaseOrderWorkflowCard}
              >
                <FileCheck2 size={18} />
                {projectPurchaseOrderDocument ? buildDocsUiCopy.openPurchaseOrder : buildDocsUiCopy.issuePurchaseOrder}
              </button>
            )}
            {docType === "purchaseOrder" && relationship.kind === "purchase" && (
              <button
                className="secondary-button"
                data-testid="open-purchase-source-button"
                onClick={openRelatedSourceDocument}
              >
                <ClipboardList size={18} />
                {buildDocsUiCopy.openQuote}
              </button>
            )}
            <button
              className="primary-button"
              onClick={shareDocument}
              disabled={!activeDocumentExportAccess.allowed}
              title={activeDocumentExportAccess.allowed ? buildDocsUiCopy.sendDocument : activeDocumentExportBlockedTitle}
            >
              <MessageCircle size={18} />
              {buildDocsUiCopy.sendDocument}
            </button>
          </div>
        </header>

        <section className="document-tabs" aria-label={buildDocsUiCopy.documentTypesAria}>
          {(Object.keys(documentLabels) as DocumentType[]).map((type) => (
            <button
              className={docType === type ? "doc-tab active" : "doc-tab"}
              key={type}
              onClick={() => {
                if (type !== docType) {
                  setDocumentStatus("draft");
                  setRelationship(initialAppData.relationship);
                }
                const nextPage = type === "contract" ? "contracts" : "documents";
                setDocType(type);
                setActivePage(nextPage);
                syncWorkspaceUrl("builddocs", nextPage);
              }}
            >
              {type === "quote" && <ClipboardList size={18} />}
              {type === "purchaseOrder" && <FileCheck2 size={18} />}
              {type === "invoice" && <Banknote size={18} />}
              {type === "receipt" && <ReceiptText size={18} />}
              {type === "contract" && <FileSignature size={18} />}
              {buildDocsUiCopy.documentTypeLabels[type]}
            </button>
          ))}
        </section>

        <DocumentWorkflowCards
          activeType={docType}
          language={workspaceLanguage}
          purchaseOrderDocument={projectPurchaseOrderDocument}
          quoteDocument={projectQuoteDocument}
          onOpenPurchaseOrder={openPurchaseOrderWorkflowCard}
          onOpenQuote={openQuoteWorkflowCard}
        />

        <DocumentAuthorityPanel
          accessByAction={documentAuthorityAccessByAction}
          authority={activeDocumentAuthority}
          stamp={activeDocumentAuthorityStamp}
          onAction={applyAuthorityWorkflowAction}
        />

        {isBuilderPage(activePage) ? (
        <div className="content-grid">
          <section className="builder-panel" aria-label="Document builder">
            {activePage !== "documents" && (
              <PageContextBanner
                activePage={activePage}
                selectedMilestone={selectedBillingMilestone}
                selectedMilestoneAmount={milestoneAmount(
                  grandTotal,
                  selectedBillingMilestone?.percent ?? 0
                )}
              />
            )}

            <div className="panel-header">
              <div>
                <h2>ข้อมูลเอกสาร</h2>
                <p>เอกสารเลขที่ BD-2026-0522</p>
              </div>
              <button className="secondary-button">
                <Stamp size={17} />
                ตั้งค่าลายเซ็น
              </button>
            </div>

            <div className="form-grid">
              <label>
                ลูกค้า
                <input
                  value={documentInfo.clientName}
                  onChange={(event) => updateDocumentInfo("clientName", event.target.value)}
                />
              </label>
              <label>
                โครงการ
                <input
                  value={documentInfo.projectName}
                  onChange={(event) => updateDocumentInfo("projectName", event.target.value)}
                />
              </label>
              <label>
                Template
                <span className="select-like">
                  {documentInfo.templateName}
                  <ChevronDown size={16} />
                </span>
                <select
                  value={documentInfo.templateName}
                  onChange={(event) => updateDocumentInfo("templateName", event.target.value)}
                  aria-label="Template"
                >
                  <option>งานรีโนเวทบ้าน</option>
                  <option>งานต่อเติมครัว</option>
                  <option>งานระบบ MEP</option>
                </select>
              </label>
              <label>
                เครดิตชำระเงิน
                <input
                  value={documentInfo.creditTerms}
                  onChange={(event) => updateDocumentInfo("creditTerms", event.target.value)}
                />
              </label>
            </div>

            <div className="form-grid secondary-fields">
              <label>
                เลขเอกสาร
                <input
                  value={documentInfo.documentNo}
                  onChange={(event) => updateDocumentInfo("documentNo", event.target.value)}
                />
              </label>
              <label>
                วันที่
                <input
                  value={documentInfo.issueDate}
                  onChange={(event) => updateDocumentInfo("issueDate", event.target.value)}
                />
              </label>
              <label>
                ที่อยู่ลูกค้า
                <input
                  value={documentInfo.clientAddress}
                  onChange={(event) => updateDocumentInfo("clientAddress", event.target.value)}
                />
              </label>
              <label>
                หมายเหตุ
                <input
                  value={documentInfo.notes}
                  onChange={(event) => updateDocumentInfo("notes", event.target.value)}
                />
              </label>
            </div>

            <details className="profile-panel">
              <summary>
                <Building2 size={17} />
                <span>ข้อมูลผู้รับเหมา / บริษัท</span>
              </summary>
              <div className="form-grid profile-fields">
                <label>
                  ชื่อบริษัท / ผู้รับเหมา
                  <input
                    value={documentInfo.companyName}
                    onChange={(event) => updateDocumentInfo("companyName", event.target.value)}
                  />
                </label>
                <label>
                  โทรศัพท์
                  <input
                    value={documentInfo.companyPhone}
                    onChange={(event) => updateDocumentInfo("companyPhone", event.target.value)}
                  />
                </label>
                <label>
                  เลขผู้เสียภาษี
                  <input
                    value={documentInfo.companyTaxId}
                    onChange={(event) => updateDocumentInfo("companyTaxId", event.target.value)}
                  />
                </label>
                <label>
                  ผู้ลงนาม
                  <input
                    value={documentInfo.signerName}
                    onChange={(event) => updateDocumentInfo("signerName", event.target.value)}
                  />
                </label>
                <label className="wide-field">
                  ที่อยู่บริษัท
                  <input
                    value={documentInfo.companyAddress}
                    onChange={(event) => updateDocumentInfo("companyAddress", event.target.value)}
                  />
                </label>
              </div>
            </details>

            {docType === "contract" && (
              <ContractTemplatePanel
                selectedContract={selectedContract}
                onSelect={setSelectedContractId}
              />
            )}

            {(docType === "invoice" || docType === "contract") && (
              <BillingSchedulePanel
                milestones={milestones}
                selectedMilestoneId={selectedBillingMilestoneId}
                billingDocuments={relatedBillingDocuments}
                receiptDocuments={relatedReceiptDocuments}
                grandTotal={grandTotal}
                onSelect={setSelectedBillingMilestoneId}
                onCreateInvoice={openBillingInvoice}
                onOpenContract={openContractBilling}
              />
            )}

            <SheetImportPanel
              sheetUrl={sheetUrl}
              importStatus={importStatus}
              isImporting={isImporting}
              isOpen={isSheetImportOpen}
              onSheetUrlChange={setSheetUrl}
              onImportGoogleSheet={importGoogleSheet}
              onImportSampleSheet={importSampleSheet}
              onToggle={() => setIsSheetImportOpen((current) => !current)}
            />

            <div className="section-title-row">
              <div>
                <h3>รายการงาน</h3>
                <span>{items.length} รายการ</span>
              </div>
              <div className="section-actions">
                <button className="secondary-button" onClick={openBoqDatabase} type="button">
                  <Database size={17} />
                  ดึงจาก BOQ Data
                </button>
                <button className="text-button" onClick={addItem} type="button">
                  <Plus size={17} />
                  เพิ่มรายการ
                </button>
              </div>
            </div>

            <div className="line-table" role="table" aria-label="รายการงาน">
              <div className="line-row table-head" role="row">
                <span>รายการ</span>
                <span>จำนวน</span>
                <span>หน่วย</span>
                <span>ราคา/หน่วย</span>
                <span>รวม</span>
                <span />
              </div>
              {items.map((item) => (
                <div className="line-row" role="row" key={item.id}>
                  <input
                    value={item.name}
                    onChange={(event) => updateItem(item.id, { name: event.target.value })}
                    aria-label="ชื่อรายการ"
                  />
                  <input
                    type="number"
                    min="0"
                    value={item.qty}
                    onChange={(event) =>
                      updateItem(item.id, { qty: Number(event.target.value) })
                    }
                    aria-label="จำนวน"
                  />
                  <input
                    value={item.unit}
                    onChange={(event) => updateItem(item.id, { unit: event.target.value })}
                    aria-label="หน่วย"
                  />
                  <input
                    type="number"
                    min="0"
                    value={item.price}
                    onChange={(event) =>
                      updateItem(item.id, { price: Number(event.target.value) })
                    }
                    aria-label="ราคา"
                  />
                  <strong>{money.format(item.qty * item.price)}</strong>
                  <button
                    className="icon-button danger"
                    title="ลบรายการ"
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <div className="billing-grid">
              <div className="billing-options">
                <h3>ภาษีและการหัก ณ ที่จ่าย</h3>
                <label className="toggle-row">
                  <span>
                    VAT 7%
                    <small>ใช้เมื่อบริษัทจด VAT</small>
                  </span>
                  <input
                    type="checkbox"
                    checked={vatEnabled}
                    onChange={(event) => setVatEnabled(event.target.checked)}
                  />
                </label>
                <label className="toggle-row">
                  <span>
                    หัก ณ ที่จ่าย 3%
                    <small>สำหรับงานบริการตามเงื่อนไขภาษี</small>
                  </span>
                  <input
                    type="checkbox"
                    checked={withholdingEnabled}
                    onChange={(event) => setWithholdingEnabled(event.target.checked)}
                  />
                </label>
              </div>

              <div className="milestone-panel">
                <h3>งวดชำระเงิน</h3>
                {milestones.map((milestone) => (
                  <div className="milestone-row" key={milestone.id}>
                    <div>
                      <strong>{milestone.name}</strong>
                      <span>{milestone.due}</span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={milestone.percent}
                      onChange={(event) =>
                        updateMilestone(milestone.id, {
                          percent: Number(event.target.value)
                        })
                      }
                      aria-label="เปอร์เซ็นต์งวด"
                    />
                    <select
                      value={milestone.status}
                      onChange={(event) =>
                        updateMilestone(milestone.id, {
                          status: event.target.value as Milestone["status"]
                        })
                      }
                    >
                      <option value="pending">รอเรียกเก็บ</option>
                      <option value="ready">พร้อมวางบิล</option>
                      <option value="paid">รับเงินแล้ว</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <aside className="preview-panel" aria-label="Document preview">
            <div className="preview-toolbar">
              <span>Live Preview</span>
              <div>
                <button
                  className="icon-button"
                  title={
                    activeDocumentExportAccess.allowed
                      ? buildDocsUiCopy.printOrSavePdf
                      : activeDocumentExportBlockedTitle
                  }
                  onClick={printDocument}
                  disabled={!activeDocumentExportAccess.allowed}
                >
                  <Download size={17} />
                </button>
                <button className="icon-button" title={buildDocsUiCopy.save} onClick={saveNow}>
                  <FileCheck2 size={17} />
                </button>
              </div>
            </div>

            <DocumentPreview
              docType={docType}
              language={workspaceLanguage}
              subtotal={previewSubtotal}
              vat={previewVat}
              withholding={previewWithholding}
              grandTotal={previewGrandTotal}
              fullGrandTotal={grandTotal}
              paidAmount={paidAmount}
              items={items}
              milestones={milestones}
              selectedBillingMilestone={selectedBillingMilestone}
              selectedContract={selectedContract}
              relationship={relationship}
              documentInfo={documentInfo}
              authorityStamp={activeDocumentAuthorityStamp}
            />
          </aside>
        </div>
        ) : (
          <LinkedPagePanel
            activePage={activePage}
            documents={documents}
            currentData={currentData}
            grandTotal={grandTotal}
            subtotal={subtotal}
            vat={vat}
            withholding={withholding}
            milestones={milestones}
            selectedBillingMilestoneId={selectedBillingMilestoneId}
            billingDocuments={relatedBillingDocuments}
            receiptDocuments={relatedReceiptDocuments}
            clients={clients}
            projects={projects}
            onSelectDocument={selectDocument}
            onOpenPage={openPage}
            onSelectBilling={setSelectedBillingMilestoneId}
            onCreateInvoice={openBillingInvoice}
            onSaveCurrentClient={saveCurrentClientRecord}
            onApplyClient={applyClientRecord}
            onUpdateClient={updateClientRecord}
            onDeleteClient={deleteClientRecord}
            onSaveCurrentProject={saveCurrentProjectRecord}
            onApplyProject={applyProjectRecord}
            onUpdateProject={updateProjectRecord}
            onDeleteProject={deleteProjectRecord}
            onOpenDefect={openDefectTracker}
            onExportBackup={exportWorkspaceBackup}
            onImportBackup={() => backupInputRef.current?.click()}
          />
        )}
        </>
        ) : (
          <WorkspaceAppPanel
            activeApp={selectedWorkspaceApp}
            activeSubnavKey={activeSubnavKey}
            activeVersion={activeWorkspaceVersion}
            activeDesignWorkflowId={activeDesignWorkflowId}
            activeLibraryTab={activeLibraryTab}
            activeDocumentId={activeDocumentId}
            apps={workspaceApps}
            selectedVersionByApp={selectedVersionByApp}
            documents={documents}
            defects={defects}
            employees={employees}
            siteTeams={siteTeams}
            grandTotal={grandTotal}
            milestones={milestones}
            projects={projects}
            language={workspaceLanguage}
            onDefectsChange={setDefects}
            onDocumentAuthorityChange={(nextState) => {
              setDocumentAuthorityState(nextState);
              saveDocumentAuthorityState(nextState);
            }}
            onDocumentsChange={saveDocuments}
            onEmployeesChange={setEmployees}
            onSiteTeamsChange={setSiteTeams}
            onOpenDocument={openSyncedDocument}
            onUseBoqItems={addBoqItemsToDocument}
            onSelectDesignWorkflow={selectDesignWorkflow}
            onSelectApp={selectWorkspaceApp}
            onSelectAppTab={selectWorkspaceAppTab}
            onSelectAppVersion={selectWorkspaceAppVersion}
            onSelectLibraryTab={selectLibraryTab}
          />
        )}
      </main>
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

type WorkspaceAppSwitcherProps = {
  activeAppId: WorkspaceAppId;
  apps: WorkspaceAppDefinition[];
  language: WorkspaceLanguage;
  onSelect: (id: WorkspaceAppId) => void;
};

type WorkspaceSidebarPinnedApp = {
  appId: WorkspaceAppId;
  label: string;
  icon: typeof FileText;
};

type WorkspaceSidebarPinnedAppsProps = {
  activeAppId: WorkspaceAppId;
  items: WorkspaceSidebarPinnedApp[];
  language: WorkspaceLanguage;
  onSelect: (appId: WorkspaceAppId) => void;
};

function WorkspaceSidebarPinnedApps({
  activeAppId,
  items,
  language,
  onSelect
}: WorkspaceSidebarPinnedAppsProps) {
  const copy = getWorkspaceLanguageCopy(workspaceShellCopy, language);

  return (
    <nav className="workspace-shortcut-section" aria-label={copy.pinnedApps}>
      <div className="workspace-shortcut-list">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeAppId === item.appId;
          const appCopy = getWorkspaceAppCopy(getWorkspaceApp(item.appId), language);

          return (
            <button
              aria-current={isActive ? "page" : undefined}
              className={isActive ? "workspace-shortcut-item active" : "workspace-shortcut-item"}
              key={item.appId}
              onClick={() => onSelect(item.appId)}
              type="button"
            >
              <Icon size={15} />
              <span className="workspace-shortcut-copy">
                <strong>{appCopy.shortLabel}</strong>
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function WorkspaceAppSwitcher({ activeAppId, apps, language, onSelect }: WorkspaceAppSwitcherProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [collapsedGroupIds, setCollapsedGroupIds] = useState<Set<string>>(() => new Set());
  const copy = getWorkspaceLanguageCopy(workspaceShellCopy, language);
  const activeApp = getWorkspaceApp(activeAppId);
  const activeAppCopy = getWorkspaceAppCopy(activeApp, language);
  const appById = useMemo(() => new globalThis.Map(apps.map((app) => [app.id, app])), [apps]);
  const groupedApps = useMemo(() => {
    const groupedAppIds = new Set<WorkspaceAppId>();
    const groups: Array<{
      id: string;
      label: string;
      detail: string;
      appIds: WorkspaceAppId[];
      apps: WorkspaceAppDefinition[];
    }> = workspaceAppGroups
      .map((group) => {
        const groupApps = group.appIds
          .map((appId) => appById.get(appId))
          .filter((app): app is WorkspaceAppDefinition => Boolean(app));

        groupApps.forEach((app) => groupedAppIds.add(app.id));

        return {
          ...group,
          apps: groupApps
        };
      })
      .filter((group) => group.apps.length > 0);
    const moreApps = apps.filter((app) => !groupedAppIds.has(app.id));

    if (moreApps.length > 0) {
      groups.push({
        id: "more",
        label: "More Apps",
        detail: "New modules",
        appIds: moreApps.map((app) => app.id),
        apps: moreApps
      });
    }

    return groups;
  }, [appById, apps]);

  const toggleGroup = (groupId: string) => {
    setCollapsedGroupIds((current) => {
      const next = new Set(current);

      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }

      return next;
    });
  };

  return (
    <section className="app-switcher" aria-label={copy.apps} data-collapsed={isCollapsed}>
      <div className="app-switcher-header">
        <span className="sidebar-section-label">{copy.apps}</span>
        <button
          aria-controls="workspace-app-switcher-list"
          aria-expanded={!isCollapsed}
          aria-label={isCollapsed ? copy.expandApps : copy.collapseApps}
          className="app-switcher-toggle"
          onClick={() => setIsCollapsed((current) => !current)}
          title={isCollapsed ? copy.expandApps : copy.collapseApps}
          type="button"
        >
          {isCollapsed ? "+" : "-"}
        </button>
        <span className="app-switcher-actions">
          <button
            aria-label={copy.expandApps}
            className="app-switcher-icon-button"
            onClick={() => setIsCollapsed(false)}
            title={copy.expandApps}
            type="button"
          >
            <Maximize2 size={13} />
          </button>
          <button
            aria-expanded={isManageOpen}
            aria-label={copy.manageApps}
            className="app-switcher-icon-button"
            onClick={() => setIsManageOpen((current) => !current)}
            title={copy.manageApps}
            type="button"
          >
            <MoreHorizontal size={14} />
          </button>
          <button
            aria-label={copy.manageApps}
            className="app-switcher-icon-button"
            onClick={() => {
              setIsCollapsed(false);
              setIsManageOpen(true);
            }}
            title={copy.manageApps}
            type="button"
          >
            <FolderPlus size={14} />
          </button>
        </span>
        {isManageOpen && (
          <div className="app-switcher-menu" role="menu">
            <button type="button">{copy.addApp}</button>
            <button type="button">{copy.sortApps}</button>
            <button type="button">{copy.versionManagement}</button>
          </div>
        )}
      </div>
      {isCollapsed && (
        <button className="app-switcher-collapsed-state" onClick={() => setIsCollapsed(false)} type="button">
          <FolderOpen size={15} />
          <span>{activeAppCopy.shortLabel}</span>
          <small>
            {apps.length} {copy.apps}
          </small>
        </button>
      )}
      {!isCollapsed && (
        <div className="app-switcher-list" id="workspace-app-switcher-list">
          {groupedApps.map((group) => {
            const isGroupCollapsed = collapsedGroupIds.has(group.id);
            const isGroupActive = group.apps.some((app) => app.id === activeAppId);
            const groupCopy = getWorkspaceGroupCopy(group, language);

            return (
              <div className="app-switcher-group" data-active={isGroupActive} key={group.id}>
                <button
                  aria-expanded={!isGroupCollapsed}
                  className="app-switcher-group-header"
                  onClick={() => toggleGroup(group.id)}
                  type="button"
                >
                  {isGroupCollapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
                  <span className="app-switcher-group-copy">
                    <strong>{groupCopy.label}</strong>
                    <small>{groupCopy.detail}</small>
                  </span>
                  <em>{group.apps.length}</em>
                </button>
                {!isGroupCollapsed && (
                  <div className="app-switcher-group-list">
                    {group.apps.map((app) => {
                      const Icon = workspaceAppIcons[app.id] ?? Database;
                      const appCopy = getWorkspaceAppCopy(app, language);

                      return (
                        <button
                          className={activeAppId === app.id ? "app-switcher-item active" : "app-switcher-item"}
                          key={app.id}
                          onClick={() => onSelect(app.id)}
                          type="button"
                        >
                          <Icon size={18} />
                          <span>{appCopy.shortLabel}</span>
                          <small>{app.statusLabel}</small>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

type WorkspaceAppSubnavProps = {
  activeApp: WorkspaceAppDefinition;
  activeKey: string;
  language: WorkspaceLanguage;
  onSelect: (key: string) => void;
};

function WorkspaceAppSubnav({ activeApp, activeKey, language, onSelect }: WorkspaceAppSubnavProps) {
  const activeAppCopy = getWorkspaceAppCopy(activeApp, language);
  const copy = getWorkspaceLanguageCopy(workspaceShellCopy, language);
  const items = workspaceAppSubnavItems[activeApp.id];

  return (
    <section className="workspace-subnav-section" aria-label={`${activeAppCopy.shortLabel} tabs`}>
      <span className="sidebar-section-label">{copy.activeAppTabs}</span>
      <div className="workspace-subnav">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeKey === item.key;
          const itemCopy = getWorkspaceSubnavCopy(activeApp.id, item, language);

          return (
            <button
              aria-current={isActive ? "page" : undefined}
              className={isActive ? "workspace-subnav-item active" : "workspace-subnav-item"}
              key={item.key}
              onClick={() => onSelect(item.key)}
              type="button"
            >
              <span className="workspace-subnav-dot" />
              <span className="workspace-subnav-text">
                <span className="workspace-subnav-label">
                  <Icon size={12} />
                  {itemCopy.label}
                </span>
                <span className="workspace-subnav-detail">{itemCopy.detail}</span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

type WorkspaceTopbarProps = {
  activeApp: WorkspaceAppDefinition;
  activeSubnavItem: WorkspaceSubnavItem;
  activeVersion: WorkspaceAppVersionDefinition;
  isSidebarCollapsed: boolean;
  language: WorkspaceLanguage;
  onOpenMap: () => void;
  onSelectApp: () => void;
  onSelectLanguage: (language: WorkspaceLanguage) => void;
  onSelectSubnav: () => void;
  onSelectVersion: (versionId: string) => void;
  onToggleSidebar: () => void;
};

function WorkspaceTopbar({
  activeApp,
  activeSubnavItem,
  activeVersion,
  isSidebarCollapsed,
  language,
  onOpenMap,
  onSelectApp,
  onSelectLanguage,
  onSelectSubnav,
  onSelectVersion,
  onToggleSidebar
}: WorkspaceTopbarProps) {
  const appCopy = getWorkspaceAppCopy(activeApp, language);
  const copy = getWorkspaceLanguageCopy(workspaceShellCopy, language);
  const subnavCopy = getWorkspaceSubnavCopy(activeApp.id, activeSubnavItem, language);

  return (
    <header className="cf-topbar" aria-label="Workspace topbar">
      <div className="cf-topbar-inner">
        <div className="cf-topbar-lead">
          <button
            aria-label={isSidebarCollapsed ? copy.expandSidebar : copy.collapseSidebar}
            aria-pressed={isSidebarCollapsed}
            className="cf-sidebar-toggle"
            onClick={onToggleSidebar}
            title={isSidebarCollapsed ? copy.expandSidebar : copy.collapseSidebar}
            type="button"
          >
            <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 18 18" width="16">
              <rect height="11" rx="2" stroke="currentColor" strokeWidth="1.4" width="13" x="2.5" y="3.5" />
              <line stroke="currentColor" strokeWidth="1.4" x1="7" x2="7" y1="3.5" y2="14.5" />
              <path
                d={isSidebarCollapsed ? "M10 7l2 2-2 2" : "M12 7l-2 2 2 2"}
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.4"
              />
            </svg>
          </button>

          <a
            aria-label={copy.backToPublicSite}
            className="cf-public-bridge"
            href="/"
            onClick={(event) => {
              event.preventDefault();
              if (typeof window !== "undefined") {
                window.location.href = "/";
              }
            }}
            title={copy.backToPublicSite}
            type="button"
          >
            <ChevronLeft size={14} aria-hidden="true" />
            <span>{copy.publicSite}</span>
          </a>

          <nav aria-label="breadcrumb" className="cf-topbar-title">
            <a
              className="cf-breadcrumb-link cf-breadcrumb-root"
              href="/hub"
              onClick={(event) => {
                event.preventDefault();
                onOpenMap();
              }}
            >
              BUILD BY BIM
            </a>
            <span className="cf-breadcrumb-separator">›</span>
            <a
              className="cf-breadcrumb-link"
              href={activeApp.routeBase}
              onClick={(event) => {
                event.preventDefault();
                onSelectApp();
              }}
            >
              {appCopy.shortLabel.toUpperCase()}
            </a>
            <span className="cf-breadcrumb-separator">›</span>
            <a
              className="cf-breadcrumb-link"
              href={buildWorkspaceRoute(activeApp.id, activeSubnavItem.key, activeVersion.id)}
              onClick={(event) => {
                event.preventDefault();
                onSelectSubnav();
              }}
            >
              {subnavCopy.label.toUpperCase()}
            </a>
            <span className="cf-breadcrumb-separator">›</span>
            <span aria-current="page" className="cf-breadcrumb-current">
              {subnavCopy.detail}
            </span>
          </nav>
        </div>

        <div className="cf-topbar-actions">
          <label className="cf-version-select">
            <span>{copy.version}</span>
            <select
              aria-label={`${appCopy.shortLabel} ${copy.version}`}
              value={activeVersion.id}
              onChange={(event) => onSelectVersion(event.target.value)}
            >
              {activeApp.versions.map((version) => (
                <option key={version.id} value={version.id}>
                  {version.label}
                </option>
              ))}
            </select>
          </label>
          <div
            aria-label={copy.languageLabel}
            className="cf-language-toggle"
            role="group"
            title={copy.languageLabel}
          >
            {workspaceLanguages.map((item) => (
              <button
                aria-pressed={language === item.id}
                className={language === item.id ? "active" : undefined}
                key={item.id}
                onClick={() => onSelectLanguage(item.id)}
                type="button"
              >
                {item.label}
              </button>
            ))}
          </div>
          <a
            className="cf-map-link"
            href="/map"
            onClick={(event) => {
              event.preventDefault();
              onOpenMap();
            }}
            title={copy.map}
          >
            <svg fill="none" height="14" viewBox="0 0 14 14" width="14">
              <path
                d="M2 3.5L5 2.5L9 3.5L12 2.5V10.5L9 11.5L5 10.5L2 11.5V3.5Z"
                stroke="currentColor"
                strokeLinejoin="round"
                strokeWidth="1.4"
              />
              <path d="M5 2.5V10.5M9 3.5V11.5" stroke="currentColor" strokeWidth="1.4" />
            </svg>
            <span>{copy.map}</span>
          </a>
          <div className="cf-system-pill">
            <span />
            <strong>{copy.systemNormal}</strong>
          </div>
          <div className="cf-command-pill">{copy.command}</div>
        </div>
      </div>
    </header>
  );
}

type WorkspaceSidebarSummaryProps = {
  activeApp: WorkspaceAppDefinition;
  activeVersion: WorkspaceAppVersionDefinition;
  apps: WorkspaceAppDefinition[];
  documents: StoredDocument[];
  itemCount?: number;
  language: WorkspaceLanguage;
  total?: number;
};

function WorkspaceSidebarSummary({
  activeApp,
  activeVersion,
  apps,
  documents,
  itemCount,
  language,
  total
}: WorkspaceSidebarSummaryProps) {
  const activeAppCopy = getWorkspaceAppCopy(activeApp, language);
  const copy = getWorkspaceLanguageCopy(workspaceShellCopy, language);
  const readyCount = apps.filter((app) => app.status === "ready").length;
  const isBuildDocs = activeApp.id === "builddocs";
  const documentSummary = copy.documentsInBuildDocs.replace("{count}", String(documents.length));
  const buildDocsSummary = copy.buildDocsSidebarSummary
    .replace("{version}", activeVersion.shortLabel)
    .replace("{documents}", String(documents.length))
    .replace("{items}", String(itemCount ?? 0));

  return (
    <div className="sidebar-summary">
      <span>{isBuildDocs ? copy.documentTotal : activeAppCopy.label}</span>
      <strong>{typeof total === "number" ? money.format(total) : `${readyCount}/${apps.length}`}</strong>
      <small>
        {isBuildDocs ? buildDocsSummary : documentSummary}
      </small>
    </div>
  );
}

type WorkspaceAppPanelProps = {
  activeApp: WorkspaceAppDefinition;
  activeSubnavKey: string;
  activeVersion: WorkspaceAppVersionDefinition;
  activeDesignWorkflowId: DesignWorkflowId;
  activeLibraryTab: LibraryTabId;
  activeDocumentId: string;
  apps: WorkspaceAppDefinition[];
  selectedVersionByApp: Partial<Record<WorkspaceAppId, string>>;
  documents: StoredDocument[];
  defects: DefectRecord[];
  employees: EmployeeRecord[];
  siteTeams: EmployeeSiteTeamRecord[];
  grandTotal: number;
  language: WorkspaceLanguage;
  milestones: Milestone[];
  projects: ProjectRecord[];
  onDefectsChange: Dispatch<SetStateAction<DefectRecord[]>>;
  onDocumentAuthorityChange: (state: DocumentAuthorityState) => void;
  onDocumentsChange: (documents: StoredDocument[]) => void;
  onEmployeesChange: Dispatch<SetStateAction<EmployeeRecord[]>>;
  onSiteTeamsChange: Dispatch<SetStateAction<EmployeeSiteTeamRecord[]>>;
  onOpenDocument: (id: string) => void;
  onUseBoqItems: (rows: BoqCatalogRow[]) => void;
  onSelectDesignWorkflow: (id: DesignWorkflowId) => void;
  onSelectApp: (id: WorkspaceAppId) => void;
  onSelectAppTab: (appId: WorkspaceAppId, tabKey: string) => void;
  onSelectAppVersion: (appId: WorkspaceAppId, versionId: string) => void;
  onSelectLibraryTab: (id: LibraryTabId) => void;
};

function getDocumentAppStats(documents: StoredDocument[]) {
  return {
    total: documents.length,
    quotes: documents.filter((document) => document.docType === "quote").length,
    purchaseOrders: documents.filter((document) => document.docType === "purchaseOrder").length,
    invoices: documents.filter((document) => document.docType === "invoice").length
  };
}

function csvCell(value: string | number) {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

type WorkspaceAccessGateProps = {
  activeApp: WorkspaceAppDefinition;
  language: WorkspaceLanguage;
  onSelectApp: (id: WorkspaceAppId) => void;
};

function WorkspaceAccessGate({ activeApp, language, onSelectApp }: WorkspaceAccessGateProps) {
  const appCopy = getWorkspaceAppCopy(activeApp, language);
  const copy = getWorkspaceLanguageCopy(workspaceShellCopy, language);
  const accessAria = copy.accessRequiredAria.replace("{app}", appCopy.label);
  const accessTitle = copy.accessRequiredTitle.replace("{app}", appCopy.label);

  return (
    <section className="workspace-hub" aria-label={accessAria}>
      <div className="module-hero">
        <div>
          <h1>{accessTitle}</h1>
          <p>{copy.accessRequiredDetail}</p>
        </div>
        <div className="module-actions">
          <button
            className="primary-button"
            onClick={() => {
              if (typeof window !== "undefined") window.location.href = "/support-plans";
            }}
            type="button"
          >
            <Banknote size={18} />
            {copy.viewPlans}
          </button>
          <button className="secondary-button" onClick={() => onSelectApp("hub")} type="button">
            <Home size={18} />
            {copy.backToHub}
          </button>
        </div>
      </div>

      <div className="module-board">
        <PageHeader
          title={copy.accessOptionsTitle}
          detail={copy.accessOptionsDetail}
        />
        <ul className="hub-action-list">
          <li>
            <button
              className="hub-action-row hub-action-info"
              onClick={() => {
                if (typeof window !== "undefined") window.location.href = "/support-plans";
              }}
              type="button"
            >
              <span className="hub-action-icon">
                <Banknote size={16} />
              </span>
              <span className="hub-action-copy">
                <strong>{copy.accessPlanTitle}</strong>
                <small>{copy.accessPlanDetail}</small>
              </span>
              <ChevronRight size={16} />
            </button>
          </li>
          <li>
            <button
              className="hub-action-row hub-action-warn"
              onClick={() => onSelectApp("admin")}
              type="button"
            >
              <span className="hub-action-icon">
                <Settings size={16} />
              </span>
              <span className="hub-action-copy">
                <strong>{copy.accessAdminTitle}</strong>
                <small>{copy.accessAdminDetail}</small>
              </span>
              <ChevronRight size={16} />
            </button>
          </li>
          <li>
            <button
              className="hub-action-row hub-action-info"
              onClick={() => {
                if (typeof window !== "undefined") window.location.href = "/apps";
              }}
              type="button"
            >
              <span className="hub-action-icon">
                <LayoutGrid size={16} />
              </span>
              <span className="hub-action-copy">
                <strong>{copy.accessCatalogTitle}</strong>
                <small>{copy.accessCatalogDetail}</small>
              </span>
              <ChevronRight size={16} />
            </button>
          </li>
        </ul>
      </div>
    </section>
  );
}

function WorkspaceAppPanel({
  activeApp,
  activeSubnavKey,
  activeVersion,
  activeDesignWorkflowId,
  activeLibraryTab,
  activeDocumentId,
  apps,
  selectedVersionByApp,
  documents,
  defects,
  employees,
  siteTeams,
  grandTotal,
  language,
  milestones,
  projects,
  onDefectsChange,
  onDocumentAuthorityChange,
  onDocumentsChange,
  onEmployeesChange,
  onSiteTeamsChange,
  onOpenDocument,
  onUseBoqItems,
  onSelectDesignWorkflow,
  onSelectApp,
  onSelectAppTab,
  onSelectAppVersion,
  onSelectLibraryTab
}: WorkspaceAppPanelProps) {
  const activeAppCopy = getWorkspaceAppCopy(activeApp, language);
  const shellCopy = getWorkspaceLanguageCopy(workspaceShellCopy, language);
  const hubCopy = getWorkspaceLanguageCopy(hubDashboardCopy, language);
  const readyCount = apps.filter((app) => app.status === "ready").length;
  const isHub = activeApp.id === "hub";

  // Access gate per MEMBERSHIP_ACCESS_PRD.md Section 5
  // Hub + admin always reachable (hub = workspace landing, admin = managed via override later)
  const skipAccessGate = activeApp.id === "hub" || activeApp.id === "admin";
  const accessDecision = useMemo(
    () =>
      skipAccessGate
        ? null
        : evaluateAppAccess({ appId: activeApp.id }),
    [skipAccessGate, activeApp.id]
  );
  // Treat preview/none as blocked-for-use even though the data layer reports allow=true on preview
  // (preview = "see the page exists" — user must upgrade for actual workspace use)
  const blockedByAccessGate =
    accessDecision !== null &&
    (!accessDecision.allow ||
      accessDecision.accessLevel === "preview" ||
      accessDecision.accessLevel === "none");

  if (blockedByAccessGate) {
    return (
      <WorkspaceAccessGate
        activeApp={activeApp}
        language={language}
        onSelectApp={onSelectApp}
      />
    );
  }
  const hubTab = isHub
    ? activeSubnavKey === "ready" || activeSubnavKey === "pipeline"
      ? activeSubnavKey
      : "overview"
    : "overview";
  const documentAppStats = getDocumentAppStats(documents);
  const employeeAppStats = getEmployeeAppStats(employees, siteTeams);
  const socialFeedStats = getSocialFeedStats();
  const hubBoqLinkageState = useMemo(
    () => (isHub ? loadBoqTaskLinkageState() : { tasks: [], updatedAt: "" }),
    [isHub]
  );
  const hubBoqSummary = useMemo(
    () => summarizeBoqTaskLinkage(hubBoqLinkageState),
    [hubBoqLinkageState]
  );
  const hubCashflowState = useMemo(
    () => (isHub ? loadCashflowState() : { entries: [], updatedAt: "" }),
    [isHub]
  );
  const hubCashflowSummary = useMemo(
    () => summarizeCashflow(hubCashflowState),
    [hubCashflowState]
  );
  const unallocatedBoqTasks = isHub
    ? hubBoqLinkageState.tasks.filter(
        (task) => task.status !== "done" && task.boqLinkage.length === 0
      )
    : [];
  const openDefects = defects.filter((defect) => defect.status !== "closed");
  const highSeverityDefects = openDefects.filter((defect) => defect.severity === "high");
  const draftQuotes = documents.filter(
    (doc) => doc.docType === "quote" && doc.documentStatus === "draft"
  );
  const sentInvoices = documents.filter(
    (doc) => doc.docType === "invoice" && doc.documentStatus === "sent"
  );
  const readyMilestoneDocs = documents.filter((doc) =>
    doc.milestones.some((milestone) => milestone.status === "ready")
  );
  const readyMilestoneCount = documents.reduce(
    (sum, doc) => sum + doc.milestones.filter((m) => m.status === "ready").length,
    0
  );
  const activeProjects = projects.length;
  const activeBoqTasks = hubBoqLinkageState.tasks.filter((task) => task.status !== "done");
  const linkedBoqTasks = hubBoqLinkageState.tasks.filter((task) => task.boqLinkage.length > 0);
  const cashflowConfirmedEntries = hubCashflowState.entries.filter(
    (entry) => entry.status === "confirmed"
  );
  const cashflowDraftEntries = hubCashflowState.entries.filter((entry) => entry.status === "draft");
  const hubPendingActions = [
    highSeverityDefects.length > 0 && {
      key: "defects-high",
      label: formatHubCount(hubCopy.actionDefectsHigh, highSeverityDefects.length),
      detail: hubCopy.actionDefectsHighDetail,
      icon: AlertTriangle,
      tone: "alert" as const,
      onClick: () => onSelectAppTab("defectTracker", "defects")
    },
    openDefects.length > 0 && {
      key: "defects-open",
      label: formatHubCount(hubCopy.actionDefectsOpen, openDefects.length),
      detail: hubCopy.actionDefectsOpenDetail,
      icon: Bug,
      tone: "warn" as const,
      onClick: () => onSelectApp("defectTracker")
    },
    draftQuotes.length > 0 && {
      key: "quote-draft",
      label: formatHubCount(hubCopy.actionQuoteDraft, draftQuotes.length),
      detail: hubCopy.actionQuoteDraftDetail,
      icon: FileText,
      tone: "info" as const,
      onClick: () => onSelectApp("builddocs")
    },
    sentInvoices.length > 0 && {
      key: "invoice-sent",
      label: formatHubCount(hubCopy.actionInvoiceSent, sentInvoices.length),
      detail: hubCopy.actionInvoiceSentDetail,
      icon: ReceiptText,
      tone: "info" as const,
      onClick: () => onSelectApp("builddocs")
    },
    readyMilestoneCount > 0 && {
      key: "milestone-ready",
      label: formatHubCount(hubCopy.actionMilestoneReady, readyMilestoneCount),
      detail: hubCopy.actionMilestoneReadyDetail,
      icon: Stamp,
      tone: "info" as const,
      onClick: () =>
        readyMilestoneDocs[0]
          ? onOpenDocument(readyMilestoneDocs[0].id)
          : onSelectApp("builddocs")
    },
    unallocatedBoqTasks.length > 0 && {
      key: "boq-unallocated",
      label: formatHubCount(hubCopy.actionBoqOverbudget, unallocatedBoqTasks.length),
      detail: hubCopy.actionBoqOverbudgetDetail,
      icon: ClipboardList,
      tone: "warn" as const,
      onClick: () => onSelectAppTab("boqData", "task-linkage")
    },
    hubCashflowSummary.monthNet < 0 && {
      key: "cashflow-negative",
      label: formatHubCount(
        hubCopy.actionCashflowNegative,
        money.format(Math.abs(hubCashflowSummary.monthNet))
      ),
      detail: hubCopy.actionCashflowNegativeDetail,
      icon: LineChart,
      tone: "alert" as const,
      onClick: () => onSelectAppTab("cashflow", "overview")
    },
    hubCashflowSummary.draftCount > 0 && {
      key: "cashflow-draft",
      label: formatHubCount(hubCopy.actionCashflowDraft, hubCashflowSummary.draftCount),
      detail: hubCopy.actionCashflowDraftDetail,
      icon: Banknote,
      tone: "info" as const,
      onClick: () => onSelectApp("cashflow")
    },
    employees.length === 0 && {
      key: "no-employees",
      label: hubCopy.actionNoEmployees,
      detail: hubCopy.actionNoEmployeesDetail,
      icon: Users,
      tone: "info" as const,
      onClick: () => onSelectApp("employees")
    }
  ].filter(Boolean) as Array<{
    key: string;
    label: string;
    detail: string;
    icon: typeof Bug;
    tone: "alert" | "warn" | "info";
    onClick: () => void;
  }>;
  const recentActivity = [
    ...documents.map((doc) => ({
      key: `doc-${doc.id}`,
      type: "document" as const,
      title: doc.title || documentLabels[doc.docType],
      detail: `${documentLabels[doc.docType]} · ${money.format(doc.total)}`,
      updatedAt: doc.updatedAt || doc.createdAt,
      icon: FileText,
      onClick: () => onOpenDocument(doc.id)
    })),
    ...defects.map((defect) => ({
      key: `defect-${defect.id}`,
      type: "defect" as const,
      title: defect.title || "Defect",
      detail: `${defect.area || hubCopy.activityUnknownArea} · ${defect.severity} · ${defect.status}`,
      updatedAt: defect.updatedAt || defect.createdAt,
      icon: Bug,
      onClick: () => onSelectApp("defectTracker")
    })),
    ...hubBoqLinkageState.tasks.map((task) => ({
      key: `boq-task-${task.id}`,
      type: "boq-task" as const,
      title: task.name || hubCopy.activityBoqTask,
      detail: `${task.status.replace("_", " ")} · ${task.boqLinkage.length} ${hubCopy.activityLinkedItems} · ${money.format(
        task.boqLinkage.reduce((sum, allocation) => sum + allocation.allocatedAmount, 0)
      )}`,
      updatedAt: task.updatedAt || task.createdAt,
      icon: ClipboardList,
      onClick: () => onSelectAppTab("boqData", "task-linkage")
    })),
    ...hubCashflowState.entries.map((entry) => ({
      key: `cashflow-${entry.id}`,
      type: "cashflow" as const,
      title: entry.description || cashflowCategoryCopy[entry.category][language],
      detail: `${entry.status} · ${entry.direction} · ${money.format(entry.amount)}`,
      updatedAt: entry.updatedAt || entry.createdAt,
      icon: Banknote,
      onClick: () => onSelectAppTab("cashflow", "overview")
    }))
  ]
    .filter((item) => item.updatedAt)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 6);
  const appsWithUsage = apps.filter((app) => {
    if (app.id === "hub") return false;
    if (app.id === "builddocs") return documents.length > 0;
    if (app.id === "boqData") return hubBoqSummary.taskCount > 0 || hubBoqSummary.linkedItemCount > 0;
    if (app.id === "defectTracker") return defects.length > 0;
    if (app.id === "employees") return employees.length > 0 || siteTeams.length > 0;
    if (app.id === "cashflow") return hubCashflowSummary.entryCount > 0;
    return false;
  });
  const appCardMetricsByApp: Partial<Record<WorkspaceAppId, Array<{ label: string; value: string }>>> = {
    builddocs: [
      { label: hubCopy.metricDocuments, value: `${documentAppStats.total} ${hubCopy.unitDocs}` },
      { label: hubCopy.metricQuotes, value: `${documentAppStats.quotes} ${hubCopy.unitDocs}` },
      { label: hubCopy.metricPurchaseOrders, value: `${documentAppStats.purchaseOrders} ${hubCopy.unitDocs}` },
      { label: hubCopy.metricInvoices, value: `${documentAppStats.invoices} ${hubCopy.unitDocs}` }
    ],
    boqData: [
      { label: hubCopy.metricTasks, value: `${hubBoqSummary.taskCount}` },
      { label: hubCopy.metricActive, value: `${activeBoqTasks.length}` },
      { label: hubCopy.metricLinked, value: `${linkedBoqTasks.length}` },
      { label: hubCopy.metricAllocated, value: money.format(hubBoqSummary.totalAllocated) }
    ],
    employees: [
      { label: hubCopy.metricEmployees, value: `${employeeAppStats.total} ${hubCopy.unitPeople}` },
      { label: hubCopy.metricOffice, value: `${employeeAppStats.office} ${hubCopy.unitPeople}` },
      { label: hubCopy.metricSiteTeams, value: `${employeeAppStats.siteTeams} ${hubCopy.unitTeams}` },
      { label: hubCopy.metricMonthlyLaborShort, value: money.format(employeeAppStats.monthly) }
    ],
    socialFeed: [
      { label: hubCopy.metricPosts, value: `${socialFeedStats.posts} ${hubCopy.metricPosts}` },
      { label: hubCopy.metricNetwork, value: `${socialFeedStats.connections} ${hubCopy.unitConnections}` },
      { label: hubCopy.metricFollowers, value: `${socialFeedStats.followers} ${hubCopy.unitPeople}` },
      { label: hubCopy.metricHiring, value: `${socialFeedStats.hiringPosts} ${hubCopy.unitTasks}` }
    ],
    agentChat: [
      { label: hubCopy.metricWebchat, value: hubCopy.valueReadyToChat },
      { label: hubCopy.metricFiles, value: hubCopy.valueDropIn },
      { label: hubCopy.metricApi, value: hubCopy.valueFourChannels },
      { label: hubCopy.metricAction, value: hubCopy.valueOrganizeData }
    ],
    cashflow: [
      { label: hubCopy.metricNetMonth, value: money.format(hubCashflowSummary.monthNet) },
      { label: hubCopy.metricDraft, value: `${cashflowDraftEntries.length}` },
      { label: hubCopy.metricConfirmed, value: `${cashflowConfirmedEntries.length}` },
      { label: hubCopy.metricEntries, value: `${hubCashflowSummary.entryCount}` }
    ]
  };
  const appCardQuickActionsByApp: Partial<Record<WorkspaceAppId, Array<{ label: string; onSelect: () => void }>>> = {
    employees: [
      {
        label: hubCopy.quickTeams,
        onSelect: () => onSelectAppTab("employees", "teams")
      },
      {
        label: hubCopy.quickPayroll,
        onSelect: () => onSelectAppTab("employees", "payroll")
      }
    ],
    socialFeed: [
      {
        label: hubCopy.quickFeed,
        onSelect: () => onSelectAppTab("socialFeed", "feed")
      },
      {
        label: hubCopy.quickProfile,
        onSelect: () => onSelectAppTab("socialFeed", "profile")
      }
    ],
    agentChat: [
      {
        label: hubCopy.quickChat,
        onSelect: () => onSelectAppTab("agentChat", "chat")
      },
      {
        label: hubCopy.quickApi,
        onSelect: () => onSelectAppTab("agentChat", "channels")
      }
    ]
  };
  const pipelineGroups: Array<{
    key: WorkspaceAppStatus;
    label: string;
    detail: string;
  }> = [
    { key: "prototype", label: hubCopy.pipelinePrototype, detail: hubCopy.pipelinePrototypeDetail },
    { key: "next", label: hubCopy.pipelineNext, detail: hubCopy.pipelineNextDetail },
    { key: "planned", label: hubCopy.pipelinePlanned, detail: hubCopy.pipelinePlannedDetail }
  ];

  const loadDemoData = () => {
    seedDemoScenario();
    if (typeof window !== "undefined") {
      window.location.assign(buildWorkspaceRoute("projectControl", "dashboard", "0.1"));
    } else {
      onSelectAppTab("projectControl", "dashboard");
    }
  };

  const resetDemoData = () => {
    resetDemoScenario();
    if (typeof window !== "undefined") {
      window.location.assign(buildWorkspaceRoute("hub", "overview", "0.1"));
    } else {
      onSelectAppTab("hub", "overview");
    }
  };

  if (activeApp.id === "boqData") {
    return (
      <BoqDataPanel
        activeTab={activeSubnavKey}
        onSelectApp={onSelectApp}
        projects={projects}
        onUseItems={onUseBoqItems}
      />
    );
  }

  if (activeApp.id === "designStudio") {
    return (
      <DesignStudioPanel
        activeWorkflowId={activeDesignWorkflowId}
        onSelectApp={onSelectApp}
        onSelectWorkflow={onSelectDesignWorkflow}
      />
    );
  }

  if (activeApp.id === "library") {
    return (
      <LibraryPanel
        activeTab={activeLibraryTab}
        onSelectApp={onSelectApp}
        onSelectTab={onSelectLibraryTab}
      />
    );
  }

  if (activeApp.id === "defectTracker") {
    return (
      <DefectTrackerPanel
        activeTab={activeSubnavKey}
        activeDocumentId={activeDocumentId}
        defects={defects}
        documents={documents}
        grandTotal={grandTotal}
        milestones={milestones}
        projects={projects}
        onDefectsChange={onDefectsChange}
        onOpenDocument={onOpenDocument}
        onSelectApp={onSelectApp}
      />
    );
  }

  if (activeApp.id === "employees") {
    return (
      <EmployeePanel
        activeTab={activeSubnavKey}
        employees={employees}
        siteTeams={siteTeams}
        projects={projects}
        onEmployeesChange={onEmployeesChange}
        onSiteTeamsChange={onSiteTeamsChange}
        onSelectApp={onSelectApp}
      />
    );
  }

  if (activeApp.id === "socialFeed") {
    return (
      <SocialFeedPanel
        activeTab={activeSubnavKey}
        onSelectApp={onSelectApp}
        onSelectAppTab={onSelectAppTab}
      />
    );
  }

  if (activeApp.id === "agentChat") {
    return (
      <AgentChatPanel
        activeTab={activeSubnavKey}
        onSelectApp={onSelectApp}
        onSelectAppTab={onSelectAppTab}
      />
    );
  }

  if (activeApp.id === "cashflow") {
    return (
      <CashflowPanel
        activeTab={activeSubnavKey}
        language={language}
        onSelectApp={onSelectApp}
      />
    );
  }

  if (activeApp.id === "constructionPlanner") {
    return (
      <ConstructionPlannerPanel
        activeTab={activeSubnavKey}
        language={language}
        onSelectApp={onSelectApp}
        onSelectAppTab={onSelectAppTab}
      />
    );
  }

  if (activeApp.id === "projects") {
    return (
      <ProjectsPanel
        activeTab={activeSubnavKey}
        language={language}
        onSelectApp={onSelectApp}
      />
    );
  }

  if (activeApp.id === "costCodes") {
    return (
      <CostCodesPanel
        activeTab={activeSubnavKey}
        language={language}
        onSelectApp={onSelectApp}
      />
    );
  }

  if (activeApp.id === "suppliers") {
    return (
      <SuppliersPanel
        activeTab={activeSubnavKey}
        language={language}
        onSelectApp={onSelectApp}
      />
    );
  }

  if (activeApp.id === "procurement") {
    return (
      <ProcurementPanel
        activeTab={activeSubnavKey}
        language={language}
        onSelectApp={onSelectApp}
      />
    );
  }

  if (activeApp.id === "projectControl") {
    return (
      <ProjectControlPanel
        activeTab={activeSubnavKey}
        language={language}
        onSelectApp={onSelectApp}
        onSelectAppTab={onSelectAppTab}
      />
    );
  }

  if (activeApp.id === "approvals") {
    return (
      <ApprovalCenterPanel
        activeTab={activeSubnavKey}
        documents={documents}
        language={language}
        onDocumentAuthorityChange={onDocumentAuthorityChange}
        onDocumentsChange={onDocumentsChange}
        onOpenDocument={onOpenDocument}
        onSelectApp={onSelectApp}
        onSelectAppTab={onSelectAppTab}
      />
    );
  }

  if (activeApp.id === "evidence") {
    return (
      <EvidencePanel
        activeTab={activeSubnavKey}
        language={language}
        onSelectApp={onSelectApp}
        onSelectAppTab={onSelectAppTab}
      />
    );
  }

  if (activeApp.id === "admin") {
    return (
      <AdminPanel
        activeTab={activeSubnavKey}
        language={language}
        onSelectApp={onSelectApp}
      />
    );
  }

  return (
    <section className="workspace-hub" aria-label={activeAppCopy.label}>
      <div className="module-hero">
        <div>
          <h1>{isHub ? hubCopy.workspaceHubTitle : activeAppCopy.label}</h1>
          <p>{activeAppCopy.description}</p>
        </div>
        <div className="module-actions">
          <button className="primary-button" onClick={() => onSelectApp("builddocs")} type="button">
            <FileText size={18} />
            {shellCopy.buildDocsAction}
          </button>
          {!isHub && (
            <button className="secondary-button" onClick={() => onSelectApp("hub")} type="button">
              <Home size={18} />
              {shellCopy.backToHub}
            </button>
          )}
        </div>
      </div>

      {isHub ? (
        <>
          <FirstRunChecklist
            language={language}
            projectCount={projects.length}
            cashflowEntryCount={hubCashflowState.entries.length}
            onCreateProject={() => onSelectApp("projects")}
            onOpenCostCodes={() => onSelectApp("costCodes")}
            onRecordCashflow={() => onSelectApp("cashflow")}
            onOpenDashboard={() => onSelectAppTab("projectControl", "dashboard")}
          />
          <div className="summary-grid hub-summary-grid hub-summary-grid--wide">
            <SummaryTile
              label={hubCopy.summaryDocs}
              value={`${documents.length} ${hubCopy.unitDocs}`}
              strong
            />
            <SummaryTile label={hubCopy.summaryDocValue} value={money.format(grandTotal)} />
            <SummaryTile
              label={hubCopy.summaryDefectsOpen}
              value={`${openDefects.length} / ${defects.length}`}
            />
            <SummaryTile
              label={hubCopy.summaryActiveEmployees}
              value={`${employeeAppStats.active} ${hubCopy.unitPeople}`}
            />
            <SummaryTile
              label={hubCopy.summaryMonthlyLabor}
              value={money.format(employeeAppStats.monthly)}
            />
            <SummaryTile
              label={hubCopy.summaryProjects}
              value={`${activeProjects} ${hubCopy.unitProjects}`}
            />
            <SummaryTile
              label={hubCopy.summaryBoqAllocated}
              value={money.format(hubBoqSummary.totalAllocated)}
            />
            <SummaryTile
              label={hubCopy.summaryCashflowNet}
              value={money.format(hubCashflowSummary.monthNet)}
            />
          </div>

          {hubTab === "overview" && (
            <div className="module-board hub-demo-board">
              <PageHeader
                title={hubCopy.demoSeedTitle}
                detail={hubCopy.demoSeedDetail}
              />
              <div className="module-actions">
                <button className="primary-button" onClick={loadDemoData} type="button">
                  <Database size={17} />
                  {hubCopy.demoSeedAction}
                </button>
                <button
                  className="secondary-button"
                  onClick={() => onSelectAppTab("projectControl", "dashboard")}
                  type="button"
                >
                  <LineChart size={17} />
                  {hubCopy.demoSeedOpenProjectControl}
                </button>
                <button
                  className="secondary-button danger-action"
                  onClick={resetDemoData}
                  type="button"
                >
                  <Trash2 size={16} />
                  {hubCopy.demoSeedResetAction}
                </button>
              </div>
              <div className="hub-demo-notes">
                <small className="hub-tab-header-note">{hubCopy.demoSeedNote}</small>
                <small className="hub-tab-header-note">{hubCopy.demoSeedResetNote}</small>
              </div>
            </div>
          )}

          <div className="hub-tab-header">
            <div className="hub-tab-header-copy">
              <strong>
                {hubTab === "ready"
                  ? hubCopy.tabReadyLabel
                  : hubTab === "pipeline"
                    ? hubCopy.tabPipelineLabel
                    : hubCopy.tabActiveLabel}
              </strong>
              <span>
                {hubTab === "ready"
                  ? hubCopy.tabReadyDetail
                  : hubTab === "pipeline"
                    ? hubCopy.tabPipelineDetail
                    : hubCopy.tabActiveDetail
                        .replace("{totalApps}", String(apps.length - 1))
                        .replace("{readyCount}", String(readyCount))
                        .replace("{activeCount}", String(appsWithUsage.length))}
              </span>
            </div>
            <small className="hub-tab-header-note">
              {hubCopy.tabSourceLabel} · {hubCopy.tabSourceValue}
            </small>
          </div>

          {hubTab === "ready" && appsWithUsage.length === 0 && (
            <div className="module-board hub-empty-board">
              <PageHeader
                title={hubCopy.readyEmptyTitle}
                detail={hubCopy.readyEmptyDetail}
              />
              <div className="module-actions">
                <button
                  className="primary-button"
                  onClick={() => onSelectApp("builddocs")}
                  type="button"
                >
                  <FileText size={16} />
                  {hubCopy.readyEmptyOpenDocs}
                </button>
                <button
                  className="secondary-button"
                  onClick={() => onSelectApp("defectTracker")}
                  type="button"
                >
                  <Bug size={16} />
                  {hubCopy.readyEmptyOpenDefect}
                </button>
              </div>
            </div>
          )}

          {hubTab === "pipeline" ? (
            <div className="hub-pipeline">
              {pipelineGroups.map((group) => {
                const groupApps = apps.filter(
                  (app) => app.id !== "hub" && app.status === group.key
                );
                if (groupApps.length === 0) return null;
                return (
                  <div className="hub-pipeline-group" key={group.key}>
                    <div className="hub-pipeline-head">
                      <strong>{group.label}</strong>
                      <span>{group.detail}</span>
                      <small>{groupApps.length} {hubCopy.unitApps}</small>
                    </div>
                    <div className="app-card-grid">
                      {groupApps.map((app) => (
                        <WorkspaceAppCard
                          app={app}
                          key={app.id}
                          language={language}
                          onSelect={() => onSelectApp(app.id)}
                          onSelectVersion={(versionId) =>
                            onSelectAppVersion(app.id, versionId)
                          }
                          selectedVersion={getWorkspaceAppVersion(
                            app,
                            selectedVersionByApp[app.id]
                          )}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="app-card-grid">
              {(hubTab === "ready" ? appsWithUsage : apps.filter((app) => app.id !== "hub"))
              .map((app) => (
                <WorkspaceAppCard
                  app={app}
                  key={app.id}
                  language={language}
                  metrics={appCardMetricsByApp[app.id]}
                  onSelect={() => onSelectApp(app.id)}
                  quickActions={appCardQuickActionsByApp[app.id]}
                  onSelectVersion={(versionId) => onSelectAppVersion(app.id, versionId)}
                  selectedVersion={getWorkspaceAppVersion(app, selectedVersionByApp[app.id])}
                />
              ))}
            </div>
          )}

          {hubTab === "overview" && (
            <div className="hub-dashboard-grid">
              <div className="module-board hub-action-board">
                <PageHeader
                  title={hubCopy.actionsTitle}
                  detail={hubCopy.actionsDetail}
                />
                {hubPendingActions.length === 0 ? (
                  <div className="hub-action-empty">
                    <Check size={18} />
                    <strong>{hubCopy.actionsEmptyTitle}</strong>
                    <span>{hubCopy.actionsEmptyDetail}</span>
                  </div>
                ) : (
                  <ul className="hub-action-list">
                    {hubPendingActions.map((action) => {
                      const Icon = action.icon;
                      return (
                        <li key={action.key}>
                          <button
                            className={`hub-action-row hub-action-${action.tone}`}
                            onClick={action.onClick}
                            type="button"
                          >
                            <span className="hub-action-icon">
                              <Icon size={16} />
                            </span>
                            <span className="hub-action-copy">
                              <strong>{action.label}</strong>
                              <small>{action.detail}</small>
                            </span>
                            <ChevronRight size={16} />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div className="module-board hub-activity-board">
                <PageHeader
                  title={hubCopy.activityTitle}
                  detail={hubCopy.activityDetail}
                />
                {recentActivity.length === 0 ? (
                  <div className="hub-action-empty">
                    <ClipboardList size={18} />
                    <strong>{hubCopy.activityEmptyTitle}</strong>
                    <span>{hubCopy.activityEmptyDetail}</span>
                  </div>
                ) : (
                  <ul className="hub-activity-list">
                    {recentActivity.map((item) => {
                      const Icon = item.icon;
                      return (
                        <li key={item.key}>
                          <button
                            className="hub-activity-row"
                            onClick={item.onClick}
                            type="button"
                          >
                            <span className="hub-activity-icon">
                              <Icon size={15} />
                            </span>
                            <span className="hub-activity-copy">
                              <strong>{item.title}</strong>
                              <small>{item.detail}</small>
                            </span>
                            <time>{formatHubRelativeTime(item.updatedAt, language, hubCopy)}</time>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="module-grid">
          <div className="module-board">
            <PageHeader
              title="ขอบเขตแอป"
              detail="เตรียมเป็น module แยก เพื่อให้เพิ่ม state, storage, import/export และหน้าจอของตัวเองได้โดยไม่ชน BuildDocs"
            />
            <div className="module-route-list">
              <SummaryTile label="Route" value={activeApp.routeBase} />
              <SummaryTile label="Storage key" value={activeVersion.storageKey} />
              <SummaryTile label="Version" value={activeVersion.label} />
              <SummaryTile label="สถานะ" value={activeApp.statusLabel} strong />
            </div>
          </div>

          <div className="module-board">
            <PageHeader title="งานถัดไป" detail="เริ่มจาก component ของแอปนี้ แล้วค่อยต่อข้อมูลจริงทีละส่วน" />
            <div className="module-lane">
              <span>1. สร้าง folder เฉพาะแอป</span>
              <span>2. แยก localStorage key และ type ของข้อมูล</span>
              <span>3. เพิ่มหน้าหลัก รายการ และรายงานของแอปนั้น</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

type EmployeePanelProps = {
  activeTab: string;
  employees: EmployeeRecord[];
  siteTeams: EmployeeSiteTeamRecord[];
  projects: ProjectRecord[];
  onEmployeesChange: Dispatch<SetStateAction<EmployeeRecord[]>>;
  onSiteTeamsChange: Dispatch<SetStateAction<EmployeeSiteTeamRecord[]>>;
  onSelectApp: (id: WorkspaceAppId) => void;
};

function EmployeePanel({
  activeTab,
  employees,
  siteTeams,
  projects,
  onEmployeesChange,
  onSiteTeamsChange,
  onSelectApp
}: EmployeePanelProps) {
  const projectOptions = useMemo(() => getEmployeeProjectOptions(projects), [projects]);
  const currentTab = activeTab === "teams" || activeTab === "payroll" ? activeTab : "overview";

  const officeTeam = employees.filter((employee) => employee.team === "office");
  const siteTeam = employees.filter((employee) => employee.team === "site");
  const storedSiteTeamNames = new Set(siteTeams.map((team) => team.name));
  const derivedSiteTeams = Array.from(
    new Set(siteTeam.map((employee) => getEmployeeTeamName(employee)))
  )
    .filter((teamName) => !storedSiteTeamNames.has(teamName))
    .map((teamName, index) =>
      createEmployeeSiteTeamRecord(
        teamName,
        siteTeam.find((employee) => getEmployeeTeamName(employee) === teamName)
          ?.assignedProjectIds[0] ?? projectOptions[0]?.id ?? "",
        siteTeams.length + index
      )
    );
  const siteTeamChoices = [...siteTeams, ...derivedSiteTeams];
  const siteTeamGroups = siteTeamChoices.map((team) => ({
    team,
    teamName: team.name,
    employees: siteTeam.filter((employee) => getEmployeeTeamName(employee) === team.name)
  }));
  const activeEmployees = employees.filter((employee) => employee.status === "active");
  const monthlyWageCost = activeEmployees.reduce(
    (sum, employee) => sum + getEmployeeMonthlyWage(employee),
    0
  );
  const monthlyBenefitCost = activeEmployees.reduce(
    (sum, employee) => sum + getEmployeeMonthlyBenefit(employee),
    0
  );
  const monthlyLaborReserve = monthlyWageCost + monthlyBenefitCost;
  const projectPayrollRows = projectOptions.map((project) => {
    const assignedEmployees = activeEmployees.filter((employee) =>
      employee.assignedProjectIds.includes(project.id)
    );
    const wageTotal = assignedEmployees.reduce(
      (sum, employee) =>
        sum + getEmployeeMonthlyWage(employee) / getEmployeeProjectAllocationCount(employee),
      0
    );
    const benefitTotal = assignedEmployees.reduce(
      (sum, employee) =>
        sum + getEmployeeMonthlyBenefit(employee) / getEmployeeProjectAllocationCount(employee),
      0
    );

    return {
      project,
      assignedEmployees,
      wageTotal,
      benefitTotal,
      monthlyTotal: wageTotal + benefitTotal
    };
  });
  const payrollGrandTotal = projectPayrollRows.reduce((sum, row) => sum + row.monthlyTotal, 0);
  const teamPayrollRows = [
    {
      id: "office",
      name: OFFICE_TEAM_NAME,
      projectName: "หลายโครงการ",
      employees: activeEmployees.filter((employee) => employee.team === "office")
    },
    ...siteTeamGroups.map((teamGroup) => ({
      id: teamGroup.team.id,
      name: teamGroup.team.name,
      projectName: getProjectName(teamGroup.team.projectId),
      employees: teamGroup.employees.filter((employee) => employee.status === "active")
    }))
  ].map((row) => {
    const wageTotal = row.employees.reduce(
      (sum, employee) => sum + getEmployeeMonthlyWage(employee),
      0
    );
    const benefitTotal = row.employees.reduce(
      (sum, employee) => sum + getEmployeeMonthlyBenefit(employee),
      0
    );

    return {
      ...row,
      wageTotal,
      benefitTotal,
      monthlyTotal: wageTotal + benefitTotal
    };
  });
  const employeePayrollRows = activeEmployees.map((employee) => ({
    employee,
    teamName: getEmployeeTeamName(employee),
    projectLabel: getProjectLabel(employee),
    wageTotal: getEmployeeMonthlyWage(employee),
    benefitTotal: getEmployeeMonthlyBenefit(employee),
    monthlyTotal: getEmployeeMonthlyTotal(employee)
  }));

  function getProjectName(projectId: string) {
    return projectOptions.find((project) => project.id === projectId)?.name ?? "ยังไม่เลือกโครงการ";
  }

  function getProjectLabel(employee: EmployeeRecord) {
    if (employee.team === "site") {
      return getProjectName(employee.assignedProjectIds[0] ?? "");
    }

    if (employee.assignedProjectIds.length === projectOptions.length) {
      return "ทุกโครงการ";
    }

    return employee.assignedProjectIds.map(getProjectName).join(", ");
  }

  const updateEmployee = (id: string, patch: Partial<EmployeeRecord>) => {
    onEmployeesChange((current) =>
      current.map((employee) => {
        if (employee.id !== id) {
          return employee;
        }

        const nextEmployee = { ...employee, ...patch };
        const rawTeamName =
          patch.teamName ?? (patch.team && patch.team !== employee.team ? "" : nextEmployee.teamName);
        const teamName =
          nextEmployee.team === "office"
            ? OFFICE_TEAM_NAME
            : rawTeamName.trim() || siteTeamChoices[0]?.name || DEFAULT_SITE_TEAM_NAME;
        const assignedProjectIds =
          patch.team || patch.assignedProjectIds
            ? getEmployeeAssignedProjectIds(
                nextEmployee.team,
                projectOptions,
                patch.assignedProjectIds ?? employee.assignedProjectIds
              )
            : nextEmployee.assignedProjectIds;

        return {
          ...nextEmployee,
          teamName,
          assignedProjectIds
        };
      })
    );
  };

  const addEmployee = () => {
    const defaultSiteTeam = siteTeamChoices[0];

    onEmployeesChange((current) => [
      normalizeEmployeeRecord(
        {
          id: `emp-${Date.now()}`,
          name: "พนักงานใหม่",
          team: "site",
          teamName: defaultSiteTeam?.name ?? DEFAULT_SITE_TEAM_NAME,
          position: "ช่างประจำไซต์",
          dailyWage: 650,
          benefit: 80,
          workDays: 26,
          assignedProjectIds: [defaultSiteTeam?.projectId || projectOptions[0]?.id || ""],
          status: "active"
        },
        projectOptions,
        current.length
      ),
      ...current
    ]);
  };

  const removeEmployee = (id: string) => {
    onEmployeesChange((current) => current.filter((employee) => employee.id !== id));
  };

  const addSiteTeam = () => {
    onSiteTeamsChange((current) => {
      const usedNames = new Set(current.map((team) => team.name));
      let nextIndex = current.length + 1;
      let nextName = `ทีมหน้างาน ${nextIndex}`;

      while (usedNames.has(nextName)) {
        nextIndex += 1;
        nextName = `ทีมหน้างาน ${nextIndex}`;
      }

      return [
        ...current,
        createEmployeeSiteTeamRecord(nextName, projectOptions[0]?.id ?? "", current.length)
      ];
    });
  };

  const updateSiteTeam = (teamId: string, patch: Partial<EmployeeSiteTeamRecord>) => {
    const existingTeam = siteTeamChoices.find((team) => team.id === teamId);

    if (!existingTeam) {
      return;
    }

    const nextName = patch.name?.trim() ?? existingTeam.name;
    const nextProjectId = patch.projectId ?? existingTeam.projectId;

    if (!nextName) {
      return;
    }

    const isDuplicateName = siteTeamChoices.some(
      (team) => team.id !== teamId && team.name === nextName
    );

    if (isDuplicateName) {
      return;
    }

    const updatedAt = new Date().toISOString();
    onSiteTeamsChange((current) =>
      current.map((team) =>
        team.id === teamId
          ? { ...team, ...patch, name: nextName, projectId: nextProjectId, updatedAt }
          : team
      )
    );
    onEmployeesChange((current) =>
      current.map((employee) => {
        if (employee.team !== "site" || getEmployeeTeamName(employee) !== existingTeam.name) {
          return employee;
        }

        return {
          ...employee,
          teamName: nextName,
          assignedProjectIds: nextProjectId ? [nextProjectId] : employee.assignedProjectIds
        };
      })
    );
  };

  const removeSiteTeam = (teamId: string) => {
    const existingTeam = siteTeamChoices.find((team) => team.id === teamId);

    if (!existingTeam) {
      return;
    }

    const hasMembers = employees.some(
      (employee) => employee.team === "site" && getEmployeeTeamName(employee) === existingTeam.name
    );

    if (hasMembers) {
      return;
    }

    onSiteTeamsChange((current) => current.filter((team) => team.id !== teamId));
  };

  const toggleEmployeeProject = (
    employee: EmployeeRecord,
    projectId: string,
    isChecked: boolean
  ) => {
    const nextProjectIds = isChecked
      ? [...new Set([...employee.assignedProjectIds, projectId])]
      : employee.assignedProjectIds.filter((id) => id !== projectId);

    updateEmployee(employee.id, {
      assignedProjectIds: nextProjectIds.length ? nextProjectIds : [projectId]
    });
  };

  const exportPayrollCsv = () => {
    const headers = [
      "Project",
      "Client",
      "Assigned employees",
      "Monthly wage",
      "Monthly benefit",
      "Monthly total"
    ];
    const rows = projectPayrollRows.map((row) => [
      row.project.name,
      row.project.clientName || "",
      row.assignedEmployees.length,
      Math.round(row.wageTotal),
      Math.round(row.benefitTotal),
      Math.round(row.monthlyTotal)
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map(csvCell).join(","))
      .join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `team-payroll-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportEmployeePayrollCsv = () => {
    const headers = [
      "Employee",
      "Team type",
      "Team name",
      "Position",
      "Projects",
      "Daily wage",
      "Daily benefit",
      "Work days",
      "Monthly wage",
      "Monthly benefit",
      "Monthly total",
      "Status"
    ];
    const rows = employees.map((employee) => [
      employee.name,
      employee.team === "office" ? "Office" : "Site",
      getEmployeeTeamName(employee),
      employee.position,
      getProjectLabel(employee),
      employee.dailyWage,
      employee.benefit,
      employee.workDays,
      getEmployeeMonthlyWage(employee),
      getEmployeeMonthlyBenefit(employee),
      getEmployeeMonthlyTotal(employee),
      employee.status
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map(csvCell).join(","))
      .join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `employee-payroll-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="workspace-hub employee-dashboard" aria-label="จัดการพนักงาน">
      <div className="module-hero employee-hero">
        <div>
          <h1>พนักงาน</h1>
          <p>
            จัดการแรงงานในโครงการ แยกทีมออฟฟิศที่ทำงานหลายโครงการ และทีมหน้างานหลายชุดที่ผูกกับไซต์ที่มอบหมาย
          </p>
        </div>
        <div className="module-actions">
          <button className="primary-button" onClick={addEmployee} type="button">
            <Plus size={18} />
            เพิ่มพนักงาน
          </button>
          <button className="secondary-button" onClick={() => onSelectApp("builddocs")} type="button">
            <Building2 size={18} />
            เปิดโครงการ
          </button>
        </div>
      </div>

      <div className="summary-grid employee-summary-grid">
        <SummaryTile label="พนักงานทั้งหมด" value={`${employees.length} คน`} />
        <SummaryTile label="ออฟฟิศ" value={`${officeTeam.length} คน`} />
        <SummaryTile label="ทีมหน้างาน" value={`${siteTeamGroups.length} ทีม / ${siteTeam.length} คน`} />
        <SummaryTile label="สำรองค่าแรง/เดือน" value={money.format(monthlyLaborReserve)} strong />
      </div>

      {currentTab === "payroll" ? (
        <div className="employee-layout">
          <div className="module-board">
            <div className="section-title-row">
              <div>
                <h3>ค่าแรงตามโครงการ</h3>
                <span>ทีมออฟฟิศแบ่งต้นทุนตามจำนวนโครงการ ทีมหน้างานลงเต็มโครงการที่มอบหมาย</span>
              </div>
              <div className="inline-actions">
                <button className="secondary-button small-action" onClick={exportPayrollCsv} type="button">
                  <Download size={16} />
                  Export โครงการ
                </button>
                <button className="secondary-button small-action" onClick={exportEmployeePayrollCsv} type="button">
                  <Download size={16} />
                  Export รายคน
                </button>
              </div>
            </div>
            <div className="employee-payroll-list">
              {projectPayrollRows.map((row) => (
                <div className="employee-payroll-row" key={row.project.id}>
                  <div>
                    <span>{row.project.clientName || "ไม่ระบุลูกค้า"}</span>
                    <strong>{row.project.name}</strong>
                    <small>{row.assignedEmployees.length} คนที่ถูกมอบหมาย</small>
                  </div>
                  <div>
                    <span>ค่าแรง/เดือน</span>
                    <strong>{money.format(row.wageTotal)}</strong>
                  </div>
                  <div>
                    <span>สวัสดิการ/เดือน</span>
                    <strong>{money.format(row.benefitTotal)}</strong>
                  </div>
                  <div>
                    <span>รวม/เดือน</span>
                    <strong>{money.format(row.monthlyTotal)}</strong>
                  </div>
                </div>
              ))}
              <div className="employee-payroll-row employee-payroll-total">
                <div>
                  <span>รวมทุกโครงการ</span>
                  <strong>Payroll reserve</strong>
                  <small>ยอดหลังแบ่งต้นทุนทีมออฟฟิศ</small>
                </div>
                <div>
                  <span>ค่าแรง/เดือน</span>
                  <strong>{money.format(monthlyWageCost)}</strong>
                </div>
                <div>
                  <span>สวัสดิการ/เดือน</span>
                  <strong>{money.format(monthlyBenefitCost)}</strong>
                </div>
                <div>
                  <span>รวม/เดือน</span>
                  <strong>{money.format(payrollGrandTotal)}</strong>
                </div>
              </div>
            </div>
            <div className="employee-detail-section">
              <h4>Payroll รายคน</h4>
              <div className="employee-detail-table" aria-label="Payroll รายคน">
                <div className="employee-detail-row employee-detail-head">
                  <span>พนักงาน</span>
                  <span>ทีม</span>
                  <span>โครงการ</span>
                  <span>ค่าแรง/เดือน</span>
                  <span>รวม/เดือน</span>
                </div>
                {employeePayrollRows.map((row) => (
                  <div className="employee-detail-row" key={row.employee.id}>
                    <div>
                      <strong>{row.employee.name}</strong>
                      <small>{row.employee.position}</small>
                    </div>
                    <span>{row.teamName}</span>
                    <span>{row.projectLabel}</span>
                    <span>{money.format(row.wageTotal)}</span>
                    <strong>{money.format(row.monthlyTotal)}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="module-board">
            <PageHeader
              title="สวัสดิการรวม"
              detail="ใช้ประเมินเงินกินอยู่ ค่าเดินทาง หรือค่าไซต์อื่น ๆ ที่จ่ายประจำ"
            />
            <div className="module-route-list employee-benefit-grid">
              <SummaryTile label="ค่าแรง/เดือน" value={money.format(monthlyWageCost)} />
              <SummaryTile label="สวัสดิการ/เดือน" value={money.format(monthlyBenefitCost)} />
              <SummaryTile label="รวม payroll/เดือน" value={money.format(monthlyLaborReserve)} strong />
              <SummaryTile label="พนักงานทำงานอยู่" value={`${activeEmployees.length} คน`} />
            </div>
            <div className="module-lane">
              <span>ออฟฟิศเลือกได้หลายโครงการ เพื่อกระจายต้นทุนงานกลางหรือผู้ประสานงาน</span>
              <span>ทีมหน้างานสร้างได้หลายทีม แต่ละคนเลือกได้ครั้งละ 1 โครงการ และย้ายมอบหมายได้จากช่องโครงการ</span>
              <span>ตำแหน่ง ค่าแรง และสวัสดิการแก้ได้จากแท็บ Teams</span>
            </div>
            <div className="employee-team-payroll">
              <h4>Payroll รายทีม</h4>
              {teamPayrollRows.map((row) => (
                <div className="employee-team-payroll-row" key={row.id}>
                  <div>
                    <strong>{row.name}</strong>
                    <small>{row.projectName} · {row.employees.length} คน</small>
                  </div>
                  <span>{money.format(row.monthlyTotal)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : currentTab === "teams" ? (
        <div className="employee-management-grid">
          <div className="module-board employee-roster-board">
          <div className="section-title-row">
            <div>
              <h3>ทะเบียนพนักงาน</h3>
              <span>ตั้งทีม ตำแหน่ง โครงการ ค่าแรง และสวัสดิการ</span>
            </div>
            <button className="text-button" onClick={addEmployee} type="button">
              <Plus size={17} />
              เพิ่มแถว
            </button>
          </div>

          <div className="employee-table" role="table" aria-label="ทะเบียนพนักงาน">
            <div className="employee-row employee-row-head" role="row">
              <span>ชื่อ</span>
              <span>ทีม</span>
              <span>ชื่อทีม</span>
              <span>ตำแหน่ง</span>
              <span>โครงการที่รับผิดชอบ</span>
              <span>ค่าแรง/วัน</span>
              <span>สวัสดิการ/วัน</span>
              <span>วัน/เดือน</span>
              <span>สถานะ</span>
              <span />
            </div>
            {employees.map((employee) => (
              <div className="employee-row" role="row" key={employee.id}>
                <input
                  aria-label="ชื่อพนักงาน"
                  value={employee.name}
                  onChange={(event) => updateEmployee(employee.id, { name: event.target.value })}
                />
                <select
                  aria-label="ประเภททีม"
                  value={employee.team}
                  onChange={(event) => {
                    const nextTeam = event.target.value as EmployeeTeamType;
                    const defaultSiteTeam = siteTeamChoices[0];

                    updateEmployee(employee.id, {
                      team: nextTeam,
                      teamName:
                        nextTeam === "office"
                          ? OFFICE_TEAM_NAME
                          : defaultSiteTeam?.name ?? DEFAULT_SITE_TEAM_NAME,
                      assignedProjectIds:
                        nextTeam === "site"
                          ? [defaultSiteTeam?.projectId || employee.assignedProjectIds[0] || projectOptions[0]?.id || ""]
                          : employee.assignedProjectIds
                    });
                  }}
                >
                  <option value="office">ออฟฟิศ</option>
                  <option value="site">ทีมหน้างาน</option>
                </select>
                {employee.team === "office" ? (
                  <input aria-label="ชื่อทีม" disabled value={OFFICE_TEAM_NAME} />
                ) : (
                  <select
                    aria-label="ชื่อทีม"
                    value={getEmployeeTeamName(employee)}
                    onChange={(event) => {
                      const selectedTeam = siteTeamChoices.find(
                        (team) => team.name === event.target.value
                      );

                      updateEmployee(employee.id, {
                        teamName: event.target.value,
                        assignedProjectIds: [
                          selectedTeam?.projectId ||
                            employee.assignedProjectIds[0] ||
                            projectOptions[0]?.id ||
                            ""
                        ]
                      });
                    }}
                  >
                    {siteTeamChoices.map((team) => (
                      <option key={team.id} value={team.name}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                )}
                <input
                  aria-label="ตำแหน่ง"
                  value={employee.position}
                  onChange={(event) =>
                    updateEmployee(employee.id, { position: event.target.value })
                  }
                />
                {employee.team === "office" ? (
                  <div className="employee-project-checks">
                    {projectOptions.map((project) => (
                      <label key={project.id}>
                        <input
                          checked={employee.assignedProjectIds.includes(project.id)}
                          onChange={(event: ChangeEvent<HTMLInputElement>) =>
                            toggleEmployeeProject(employee, project.id, event.target.checked)
                          }
                          type="checkbox"
                        />
                        <span>{project.name}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <select
                    aria-label="โครงการที่ได้รับมอบหมาย"
                    value={employee.assignedProjectIds[0] ?? projectOptions[0]?.id}
                    onChange={(event) =>
                      updateEmployee(employee.id, {
                        assignedProjectIds: [event.target.value]
                      })
                    }
                  >
                    {projectOptions.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                )}
                <input
                  aria-label="ค่าแรงต่อวัน"
                  min="0"
                  type="number"
                  value={employee.dailyWage}
                  onChange={(event) =>
                    updateEmployee(employee.id, { dailyWage: Number(event.target.value) })
                  }
                />
                <input
                  aria-label="สวัสดิการต่อวัน"
                  min="0"
                  type="number"
                  value={employee.benefit}
                  onChange={(event) =>
                    updateEmployee(employee.id, { benefit: Number(event.target.value) })
                  }
                />
                <input
                  aria-label="วันทำงานต่อเดือน"
                  max="31"
                  min="0"
                  type="number"
                  value={employee.workDays}
                  onChange={(event) =>
                    updateEmployee(employee.id, {
                      workDays: clampNumber(Number(event.target.value), 0, 31)
                    })
                  }
                />
                <select
                  aria-label="สถานะ"
                  value={employee.status}
                  onChange={(event) =>
                    updateEmployee(employee.id, {
                      status: event.target.value as EmployeeStatus
                    })
                  }
                >
                  <option value="active">ทำงานอยู่</option>
                  <option value="standby">พักงาน</option>
                </select>
                <button
                  className="icon-button danger"
                  title="ลบพนักงาน"
                  onClick={() => removeEmployee(employee.id)}
                  type="button"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
          </div>

          <div className="module-board employee-team-master">
            <div className="section-title-row">
              <div>
                <h3>Team Master</h3>
                <span>สร้างทีมหน้างาน กำหนดโครงการ และย้ายทั้งทีมได้จากจุดเดียว</span>
              </div>
              <button className="text-button" onClick={addSiteTeam} type="button">
                <Plus size={17} />
                เพิ่มทีม
              </button>
            </div>

            <div className="employee-site-team-list">
              {siteTeamChoices.map((team) => {
                const memberCount = employees.filter(
                  (employee) => employee.team === "site" && getEmployeeTeamName(employee) === team.name
                ).length;

                return (
                  <div className="employee-site-team-row" key={team.id}>
                    <input
                      aria-label={`ชื่อทีม ${team.name}`}
                      defaultValue={team.name}
                      onBlur={(event) => {
                        const nextName = event.currentTarget.value.trim();

                        if (!nextName) {
                          event.currentTarget.value = team.name;
                          return;
                        }

                        updateSiteTeam(team.id, { name: nextName });
                      }}
                    />
                    <select
                      aria-label={`โครงการประจำทีม ${team.name}`}
                      value={team.projectId || projectOptions[0]?.id || ""}
                      onChange={(event) =>
                        updateSiteTeam(team.id, { projectId: event.target.value })
                      }
                    >
                      {projectOptions.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                    <div>
                      <strong>{memberCount} คน</strong>
                      <small>{memberCount ? "ใช้งานอยู่" : "ยังไม่มีสมาชิก"}</small>
                    </div>
                    <button
                      className="icon-button danger"
                      disabled={memberCount > 0}
                      title={memberCount > 0 ? "ลบได้เมื่อไม่มีสมาชิก" : "ลบทีม"}
                      onClick={() => removeSiteTeam(team.id)}
                      type="button"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="module-lane">
              <span>เลือกโครงการใน Team Master เพื่อย้ายสมาชิกทั้งทีมไปโครงการใหม่</span>
              <span>พนักงานทีมหน้างานเลือกชื่อทีมจาก master list เพื่อลดการพิมพ์ผิด</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="employee-layout">
          <div className="module-board">
            <PageHeader
              title="ทีมแรงงาน"
              detail="มุมมองรวมสำหรับดูว่าพนักงานแต่ละกลุ่มถูกผูกกับโครงการใด"
            />
            <div className="employee-team-columns">
              <EmployeeTeamColumn
                employees={officeTeam}
                getProjectLabel={getProjectLabel}
                title="ออฟฟิศ"
                subtitle="ทีมหลัก · ทำงานได้หลายโครงการ"
              />
              {siteTeamGroups.map((teamGroup) => (
                <EmployeeTeamColumn
                  employees={teamGroup.employees}
                  getProjectLabel={getProjectLabel}
                  key={teamGroup.teamName}
                  title={teamGroup.teamName}
                  subtitle={`ทีมหน้างาน · ${teamGroup.employees.length} คน`}
                />
              ))}
            </div>
          </div>

          <div className="module-board">
            <PageHeader
              title="กติกาการมอบหมายงาน"
              detail="ใช้แยกแรงงานประจำทีมกลางออกจากแรงงานประจำไซต์"
            />
            <div className="module-lane">
              <span>ออฟฟิศ: เป็นทีมหลักของระบบ เลือกโครงการได้หลายรายการเพื่อแบ่งต้นทุนงานกลาง</span>
              <span>ทีมหน้างาน: สร้างได้หลายทีม ระบุชื่อทีมเอง และผูกได้ 1 โครงการต่อคน</span>
              <span>ตำแหน่ง: กำหนดเองได้ เช่น ผู้จัดการโครงการ ธุรการไซต์ หัวหน้าช่าง ช่างปูน ช่างไฟ หรือผู้ช่วยช่าง</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

type EmployeeTeamColumnProps = {
  title: string;
  subtitle: string;
  employees: EmployeeRecord[];
  getProjectLabel: (employee: EmployeeRecord) => string;
};

function EmployeeTeamColumn({
  title,
  subtitle,
  employees,
  getProjectLabel
}: EmployeeTeamColumnProps) {
  return (
    <div className="employee-team-board">
      <div className="employee-team-title">
        <strong>{title}</strong>
        <span>{subtitle}</span>
      </div>
      <div className="employee-card-list">
        {employees.map((employee) => (
          <div className="employee-card" key={employee.id}>
            <span className={`employee-badge ${employee.team}`}>
              {employee.team === "office" ? "ออฟฟิศ" : "หน้างาน"}
            </span>
            <strong>{employee.name}</strong>
            <small>{employee.position}</small>
            <span>{getEmployeeTeamName(employee)}</span>
            <span>{getProjectLabel(employee)}</span>
            <em>
              {money.format(getEmployeeMonthlyTotal(employee))} / เดือน · {employee.workDays} วัน
            </em>
          </div>
        ))}
      </div>
    </div>
  );
}

type DefectTrackerPanelProps = {
  activeTab: string;
  activeDocumentId: string;
  defects: DefectRecord[];
  documents: StoredDocument[];
  grandTotal: number;
  milestones: Milestone[];
  projects: ProjectRecord[];
  onDefectsChange: Dispatch<SetStateAction<DefectRecord[]>>;
  onOpenDocument: (id: string) => void;
  onSelectApp: (id: WorkspaceAppId) => void;
};

function DefectTrackerPanel({
  activeTab,
  activeDocumentId,
  defects: defectRecords,
  documents,
  grandTotal,
  milestones,
  projects,
  onDefectsChange: setDefectRecords,
  onOpenDocument,
  onSelectApp
}: DefectTrackerPanelProps) {
  const activeDocument =
    documents.find((document) => document.id === activeDocumentId) ?? documents[0];
  const activeProjectKey = activeDocument
    ? getProjectSyncKey(
        activeDocument.documentInfo.projectName,
        activeDocument.documentInfo.clientName
      )
    : projects[0]
      ? getProjectSyncKey(projects[0].name, projects[0].clientName)
      : "";
  const syncedProjects = useMemo(() => {
    const projectMap = new globalThis.Map<
      string,
      {
        key: string;
        name: string;
        clientName: string;
        templateName: string;
        notes: string;
        updatedAt: string;
        documents: StoredDocument[];
      }
    >();

    projects.forEach((project) => {
      const key = getProjectSyncKey(project.name, project.clientName);
      projectMap.set(key, {
        key,
        name: project.name,
        clientName: project.clientName,
        templateName: project.templateName,
        notes: project.notes,
        updatedAt: project.updatedAt,
        documents: []
      });
    });

    documents.forEach((document) => {
      const key = getProjectSyncKey(
        document.documentInfo.projectName,
        document.documentInfo.clientName
      );
      const existing = projectMap.get(key);
      const target =
        existing ??
        {
          key,
          name: document.documentInfo.projectName,
          clientName: document.documentInfo.clientName,
          templateName: document.documentInfo.templateName,
          notes: document.documentInfo.notes,
          updatedAt: document.updatedAt,
          documents: []
        };

      target.documents.push(document);

      if (document.updatedAt > target.updatedAt) {
        target.updatedAt = document.updatedAt;
        target.templateName = document.documentInfo.templateName || target.templateName;
        target.notes = document.documentInfo.notes || target.notes;
      }

      projectMap.set(key, target);
    });

    return [...projectMap.values()]
      .map((project) => ({
        ...project,
        documents: project.documents.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      }))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [documents, projects]);
  const [selectedProjectKey, setSelectedProjectKey] = useState(
    activeProjectKey || syncedProjects[0]?.key || ""
  );
  const selectedProject =
    syncedProjects.find((project) => project.key === selectedProjectKey) ??
    syncedProjects.find((project) => project.key === activeProjectKey) ??
    syncedProjects[0];
  const activeProject = selectedProject;
  const sourceDocument =
    selectedProject?.documents.find(
      (document) => document.relationship.kind === "standard" && document.docType === "contract"
    ) ??
    selectedProject?.documents.find(
      (document) => document.relationship.kind === "standard" && document.docType === "quote"
    ) ??
    selectedProject?.documents.find((document) => document.docType === "contract") ??
    selectedProject?.documents[0] ??
    activeDocument;
  const syncedMilestones = sourceDocument?.milestones.length
    ? sourceDocument.milestones
    : milestones;
  const projectTotal = sourceDocument ? getFullDocumentTotal(sourceDocument) : grandTotal;
  const projectName =
    activeProject?.name || activeDocument?.documentInfo.projectName || "ยังไม่มีโครงการ";
  const clientName =
    activeProject?.clientName || activeDocument?.documentInfo.clientName || "ยังไม่ระบุลูกค้า";
  const progressPercent = Math.min(
    100,
    syncedMilestones.reduce(
      (sum, milestone) => sum + (milestone.status === "pending" ? 0 : milestone.percent),
      0
    )
  );
  const paidPercent = Math.min(
    100,
    syncedMilestones.reduce(
      (sum, milestone) => sum + (milestone.status === "paid" ? milestone.percent : 0),
      0
    )
  );
  const nextMilestone =
    syncedMilestones.find((milestone) => milestone.status === "pending") ??
    syncedMilestones[syncedMilestones.length - 1];
  const projectDocumentCount = selectedProject?.documents.length ?? documents.length;

  const [defectDraft, setDefectDraft] = useState({
    title: "",
    area: "",
    due: "",
    owner: "",
    note: "",
    severity: "medium" as DefectSeverity
  });
  const [uploadingDefectId, setUploadingDefectId] = useState<string | null>(null);
  const [photoUploadError, setPhotoUploadError] = useState("");
  const [evidenceState, setEvidenceState] = useState<EvidenceState>(() => loadEvidenceState());
  const [evidenceDraft, setEvidenceDraft] = useState({
    fileKind: "360" as SiteReportEvidenceKind,
    name: "",
    url: "",
    floor: "",
    room: "",
    zone: "",
    viewpoint: "",
    note: ""
  });
  const projectDefects = useMemo(() => {
    const currentProjectKey = selectedProject?.key ?? "";

    return defectRecords
      .filter((record) => record.projectKey === currentProjectKey)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [defectRecords, selectedProject?.key]);
  const projectEvidenceAssets = useMemo(() => {
    const currentProjectKey = selectedProject?.key ?? "";

    return evidenceState.assets
      .filter((asset) =>
        asset.links.some((link) => link.targetType === "project" && link.targetId === currentProjectKey)
      )
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [evidenceState.assets, selectedProject?.key]);
  const projectPhotoCount = projectDefects.reduce((sum, defect) => sum + defect.photos.length, 0);
  const projectPhotoStats = useMemo(
    () =>
      projectDefects.reduce<Record<DefectPhotoStage, number>>(
        (stats, defect) => {
          defect.photos.forEach((photo) => {
            stats[photo.stage] += 1;
          });

          return stats;
        },
        { before: 0, after: 0, checkpoint: 0 }
      ),
    [projectDefects]
  );
  const projectPhotoGallery = useMemo(
    () =>
      projectDefects
        .flatMap((defect) =>
          defect.photos.map((photo) => ({
            defectId: defect.id,
            defectTitle: defect.title,
            photo
          }))
        )
        .sort((first, second) => second.photo.capturedAt.localeCompare(first.photo.capturedAt))
        .slice(0, 12),
    [projectDefects]
  );

  const addProjectDefect = () => {
    if (!selectedProject || !defectDraft.title.trim()) {
      return;
    }

    const nextDefect = createDefectRecord({
      ...defectDraft,
      projectKey: selectedProject.key,
      documentId: sourceDocument?.id ?? null
    });

    setDefectRecords((current) => [nextDefect, ...current]);
    setDefectDraft({
      title: "",
      area: "",
      due: "",
      owner: "",
      note: "",
      severity: "medium"
    });
  };

  const updateProjectDefect = (id: string, patch: Partial<DefectRecord>) => {
    const updatedAt = new Date().toISOString();

    setDefectRecords((current) =>
      current.map((record) =>
        record.id === id ? normalizeDefectRecord({ ...record, ...patch, updatedAt }) : record
      )
    );
  };

  const removeProjectDefect = (id: string) => {
    setDefectRecords((current) => current.filter((record) => record.id !== id));
  };

  const uploadDefectPhotos = async (
    defectId: string,
    event: ChangeEvent<HTMLInputElement>,
    stage: DefectPhotoStage
  ) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (!files.length) {
      return;
    }

    setPhotoUploadError("");
    setUploadingDefectId(defectId);

    try {
      const photos = await Promise.all(files.map((file) => createDefectPhotoFromFile(file, stage)));
      const updatedAt = new Date().toISOString();

      setDefectRecords((current) =>
        current.map((record) =>
          record.id === defectId
            ? normalizeDefectRecord({
                ...record,
                photos: [...record.photos, ...photos],
                updatedAt
              })
            : record
        )
      );
    } catch (error) {
      setPhotoUploadError(error instanceof Error ? error.message : "อัปโหลดรูปไม่สำเร็จ");
    } finally {
      setUploadingDefectId(null);
    }
  };

  const removeDefectPhoto = (defectId: string, photoId: string) => {
    const updatedAt = new Date().toISOString();

    setDefectRecords((current) =>
      current.map((record) =>
        record.id === defectId
          ? normalizeDefectRecord({
              ...record,
              photos: record.photos.filter((photo) => photo.id !== photoId),
              updatedAt
            })
          : record
      )
    );
  };

  const updateDefectPhoto = (
    defectId: string,
    photoId: string,
    patch: Partial<Pick<DefectPhotoRecord, "caption" | "stage">>
  ) => {
    const updatedAt = new Date().toISOString();

    setDefectRecords((current) =>
      current.map((record) =>
        record.id === defectId
          ? normalizeDefectRecord({
              ...record,
              photos: record.photos.map((photo) =>
                photo.id === photoId ? normalizeDefectPhotoRecord({ ...photo, ...patch }) : photo
              ),
              updatedAt
            })
          : record
      )
    );
  };

  const persistEvidenceState = (nextState: EvidenceState) => {
    saveEvidenceState(nextState);
    setEvidenceState(nextState);
  };

  const addEvidenceAsset = () => {
    if (!selectedProject || (!evidenceDraft.name.trim() && !evidenceDraft.url.trim())) {
      return;
    }

    const title = evidenceDraft.name.trim() || evidenceDraft.url.trim() || "Site evidence";
    const nextAsset = createEvidenceAsset({
      type: siteReportEvidenceKindToAssetType(evidenceDraft.fileKind),
      title,
      description: evidenceDraft.note,
      fileName: title,
      dataUrl: evidenceDraft.url,
      sourceAppId: "defectTracker",
      tags: buildSiteReportEvidenceTags(evidenceDraft.fileKind, {
        floor: evidenceDraft.floor,
        room: evidenceDraft.room,
        zone: evidenceDraft.zone,
        viewpoint: evidenceDraft.viewpoint
      }),
      links: [
        {
          targetType: "project",
          targetId: selectedProject.key,
          label: selectedProject.name || selectedProject.key
        }
      ]
    });

    persistEvidenceState(upsertEvidenceAsset(evidenceState, nextAsset));
    setEvidenceDraft({
      fileKind: "360",
      name: "",
      url: "",
      floor: "",
      room: "",
      zone: "",
      viewpoint: "",
      note: ""
    });
  };

  const removeEvidenceAsset = (assetId: string) => {
    persistEvidenceState(removeEvidenceAssetFromState(evidenceState, assetId));
  };

  const storedOpenDefectCount = projectDefects.filter((item) => item.status !== "closed").length;
  const storedHandoverItems = [
    {
      label: "รูปถ่ายก่อน-หลังแก้ defect",
      done: projectPhotoStats.before > 0 && projectPhotoStats.after > 0 && storedOpenDefectCount <= 1
    },
    { label: "สรุป milestone ที่ตรวจผ่าน", done: progressPercent >= 70 },
    { label: "ยอดเอกสารและงวดชำระตรงกัน", done: projectTotal > 0 },
    {
      label: "รายการค้างส่งมอบมีผู้รับผิดชอบ",
      done:
        projectDefects.length > 0 &&
        projectDefects.every((item) => item.owner !== "ยังไม่ระบุผู้รับผิดชอบ")
    }
  ];
  const [siteReportFilter, setSiteReportFilter] = useState<SiteReportEventFilter>("all");
  const [selectedSiteLocationPinId, setSelectedSiteLocationPinId] = useState("all");
  const [siteReportStatus, setSiteReportStatus] = useState("");
  const siteReportLocationPins = useMemo(
    () => buildSiteReportLocationPins(projectEvidenceAssets),
    [projectEvidenceAssets]
  );
  const activeSiteLocationPinId =
    selectedSiteLocationPinId === "all" ||
    siteReportLocationPins.some((pin) => pin.id === selectedSiteLocationPinId)
      ? selectedSiteLocationPinId
      : "all";
  const siteReportEvents = useMemo(
    () => buildSiteReportEvents(projectDefects, syncedMilestones, projectEvidenceAssets),
    [projectDefects, projectEvidenceAssets, syncedMilestones]
  );
  const scopedSiteReportEvents = useMemo(
    () =>
      activeSiteLocationPinId === "all"
        ? siteReportEvents
        : siteReportEvents.filter((event) => event.locationPinId === activeSiteLocationPinId),
    [activeSiteLocationPinId, siteReportEvents]
  );
  const siteReportSummary = useMemo(
    () => summarizeSiteReportEvents(scopedSiteReportEvents),
    [scopedSiteReportEvents]
  );
  const filteredSiteReportEvents = useMemo(
    () => filterSiteReportEvents(scopedSiteReportEvents, siteReportFilter).slice(0, 12),
    [scopedSiteReportEvents, siteReportFilter]
  );
  const visibleProjectEvidenceAssets = useMemo(
    () =>
      activeSiteLocationPinId === "all"
        ? projectEvidenceAssets
        : projectEvidenceAssets.filter(
            (asset) => getSiteReportEvidenceLocationPinId(asset) === activeSiteLocationPinId
          ),
    [activeSiteLocationPinId, projectEvidenceAssets]
  );
  const latestBeforePhoto = useMemo(
    () =>
      projectDefects
        .flatMap((defect) =>
          defect.photos
            .filter((photo) => photo.stage === "before")
            .map((photo) => ({ defect, photo }))
        )
        .sort((first, second) => second.photo.capturedAt.localeCompare(first.photo.capturedAt))[0],
    [projectDefects]
  );
  const latestAfterPhoto = useMemo(
    () =>
      projectDefects
        .flatMap((defect) =>
          defect.photos
            .filter((photo) => photo.stage === "after" || photo.stage === "checkpoint")
            .map((photo) => ({ defect, photo }))
        )
        .sort((first, second) => second.photo.capturedAt.localeCompare(first.photo.capturedAt))[0],
    [projectDefects]
  );
  const siteReportUrl =
    typeof window === "undefined"
      ? "/defect?tab=site-report&version=0.1"
      : `${window.location.origin}/defect?tab=site-report&version=0.1`;
  const showSiteReport = activeTab === "site-report";

  const jumpToDefect = (defectId: string) => {
    document.getElementById(`defect-${defectId}`)?.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  };

  const copySiteReport = async () => {
    const reportText = createSiteCoordinationReportText({
      projectName,
      clientName,
      generatedAt: new Date().toISOString(),
      events: filteredSiteReportEvents
    });

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(reportText);
        setSiteReportStatus("คัดลอกรายงานแล้ว");
        return;
      }

      setSiteReportStatus("เบราว์เซอร์นี้ไม่รองรับ clipboard ให้ใช้ Print/PDF แทน");
    } catch {
      setSiteReportStatus("คัดลอกไม่สำเร็จ ให้ใช้ Print/PDF แทน");
    }
  };

  return (
    <section className="workspace-hub defect-dashboard" aria-label="Defect project progress">
      <div className="module-hero defect-hero">
        <div>
          <h1>Defect</h1>
          <p>ตรวจสอบความคืบหน้าโครงการ ติดตามรายการแก้ไข และเตรียม checklist ก่อนส่งมอบงาน</p>
          <div className="defect-project-line">
            <Building2 size={16} />
            <strong>{projectName}</strong>
            <span>{clientName}</span>
          </div>
        </div>
        <div className="module-actions">
          <button
            className="primary-button"
            onClick={() => (sourceDocument ? onOpenDocument(sourceDocument.id) : onSelectApp("builddocs"))}
            type="button"
          >
            <FileText size={18} />
            เปิดเอกสารโครงการ
          </button>
          <button className="secondary-button" onClick={() => onSelectApp("hub")} type="button">
            <Home size={18} />
            กลับ Hub
          </button>
        </div>
      </div>

      <div className="module-board defect-sync-board">
        <PageHeader
          title="Doc sync"
          detail="เลือกโครงการเพื่อดึงเอกสาร งวดงาน และยอดงานจาก Docs มาใช้ตรวจ Defect"
        />
        <div className="defect-sync-row">
          <label className="defect-sync-select">
            <span>โครงการที่ซิงก์</span>
            <select
              value={selectedProject?.key ?? ""}
              onChange={(event) => setSelectedProjectKey(event.target.value)}
            >
              {syncedProjects.map((project) => (
                <option key={project.key} value={project.key}>
                  {project.name} / {project.clientName || "ไม่ระบุลูกค้า"}
                </option>
              ))}
            </select>
          </label>
          <div className="defect-sync-source">
            <span>เอกสารต้นทาง</span>
            <strong>{sourceDocument?.documentInfo.documentNo ?? "-"}</strong>
            <small>{sourceDocument ? documentLabels[sourceDocument.docType] : "ยังไม่มีเอกสาร"}</small>
          </div>
          <button
            className="secondary-button"
            disabled={!sourceDocument}
            onClick={() => sourceDocument && onOpenDocument(sourceDocument.id)}
            type="button"
          >
            <ExternalLink size={17} />
            เปิดใน Docs
          </button>
        </div>
        <div className="defect-doc-list">
          {(selectedProject?.documents ?? []).map((document) => (
            <button
              className={document.id === sourceDocument?.id ? "defect-doc-row active" : "defect-doc-row"}
              key={document.id}
              onClick={() => onOpenDocument(document.id)}
              type="button"
            >
              <span>{documentLabels[document.docType]}</span>
              <strong>{document.documentInfo.documentNo}</strong>
              <small>{money.format(document.total)}</small>
            </button>
          ))}
        </div>
      </div>

      <div className="summary-grid hub-summary-grid">
        <SummaryTile label="ความคืบหน้า" value={`${progressPercent}%`} strong />
        <SummaryTile label="รับเงินแล้ว" value={`${paidPercent}%`} />
        <SummaryTile label="Defect เปิดอยู่" value={`${storedOpenDefectCount} รายการ`} />
        <SummaryTile label="รูปหน้างาน" value={`${projectPhotoCount} รูป`} />
        <SummaryTile label="Evidence assets" value={`${projectEvidenceAssets.length} รายการ`} />
        <SummaryTile label="ก่อน/หลังแก้" value={`${projectPhotoStats.before}/${projectPhotoStats.after} รูป`} />
        <SummaryTile label="เอกสารโครงการ" value={`${projectDocumentCount} ฉบับ`} />
      </div>

      {showSiteReport && (
        <div className="module-board site-report-board">
          <div className="site-report-header">
            <PageHeader
              title="Site coordination report"
              detail="สรุป comment, evidence, milestone และจุดที่ต้องตอบกลับ เพื่อใช้ประชุมหรือ export เป็น PDF"
            />
            <div className="module-actions">
              <button className="secondary-button" onClick={copySiteReport} type="button">
                <Copy size={17} />
                Copy
              </button>
              <button className="primary-button" onClick={() => window.print()} type="button">
                <Download size={17} />
                Print / PDF
              </button>
            </div>
          </div>
          <div className="site-report-summary-grid">
            <SummaryTile label="เหตุการณ์ทั้งหมด" value={`${siteReportSummary.totalEvents}`} strong />
            <SummaryTile label="ต้องตอบกลับ" value={`${siteReportSummary.needsReply}`} />
            <SummaryTile label="ตอบแล้ว" value={`${siteReportSummary.answered}`} />
            <SummaryTile label="Evidence" value={`${siteReportSummary.evidence}`} />
            <SummaryTile label="Milestone" value={`${siteReportSummary.milestones}`} />
          </div>
          {siteReportStatus && <div className="site-report-status">{siteReportStatus}</div>}
          <div className="site-location-board">
            <div className="site-location-head">
              <div>
                <span>Location pins</span>
                <strong>
                  {siteReportLocationPins.length} pins / {projectEvidenceAssets.length} evidence
                </strong>
              </div>
              <button
                aria-pressed={activeSiteLocationPinId === "all"}
                className={activeSiteLocationPinId === "all" ? "site-location-chip active" : "site-location-chip"}
                onClick={() => setSelectedSiteLocationPinId("all")}
                type="button"
              >
                <MapPin size={15} />
                All locations
              </button>
            </div>
            {siteReportLocationPins.length === 0 ? (
              <div className="site-location-empty">
                <MapPin size={18} />
                <div>
                  <strong>No location pins yet</strong>
                  <span>Add floor, room, zone, or viewpoint to Evidence assets.</span>
                </div>
              </div>
            ) : (
              <div className="site-location-pin-grid">
                {siteReportLocationPins.map((pin) => (
                  <button
                    aria-pressed={activeSiteLocationPinId === pin.id}
                    className={
                      activeSiteLocationPinId === pin.id
                        ? "site-location-pin active"
                        : "site-location-pin"
                    }
                    key={pin.id}
                    onClick={() => setSelectedSiteLocationPinId(pin.id)}
                    type="button"
                  >
                    <span>
                      <MapPin size={15} />
                      {pin.label}
                    </span>
                    <strong>{pin.assetCount} evidence</strong>
                    <small>
                      {pin.evidenceKinds.map((kind) => siteReportEvidenceKindLabels[kind]).join(" / ")}
                      {pin.latestAt ? ` · ${formatCapturedAt(pin.latestAt)}` : ""}
                    </small>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="site-report-grid">
            <div className="site-report-events">
              <div className="site-report-filter-row">
                <strong>
                  เหตุการณ์ในรายงาน
                  {activeSiteLocationPinId !== "all" ? " / filtered by pin" : ""}
                </strong>
                <select
                  aria-label="กรองเหตุการณ์รายงานไซต์"
                  value={siteReportFilter}
                  onChange={(event) => setSiteReportFilter(event.target.value as SiteReportEventFilter)}
                >
                  {siteReportFilterOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              {filteredSiteReportEvents.length === 0 ? (
                <div className="defect-empty">
                  <strong>ยังไม่มีเหตุการณ์สำหรับออกรายงาน</strong>
                  <span>เพิ่ม defect, milestone หรือรูป evidence แล้วข้อมูลจะมาอยู่ในรายงานนี้</span>
                </div>
              ) : (
                filteredSiteReportEvents.map((event) => (
                  <article className={`site-report-event ${event.status}`} key={event.id}>
                    <div>
                      <span>{event.sourceLabel}</span>
                      <strong>{event.title}</strong>
                      <small>{event.detail}</small>
                    </div>
                    <div className="site-report-event-meta">
                      <span>{event.statusLabel}</span>
                      <small>{event.owner}</small>
                      {event.evidenceCount > 0 && <em>{event.evidenceCount} evidence</em>}
                    </div>
                    {event.actionId && (
                      <button
                        className="secondary-button"
                        onClick={() => jumpToDefect(event.actionId ?? "")}
                        type="button"
                      >
                        <Maximize2 size={14} />
                        Go to
                      </button>
                    )}
                  </article>
                ))
              )}
            </div>
            <div className="site-report-compare">
              <PageHeader
                title="Time compare"
                detail="จำลอง workflow แบบ BUILK360: เทียบภาพก่อนหน้าและภาพปัจจุบันจาก evidence ที่แนบไว้"
              />
              <div className="site-report-compare-grid">
                {[latestBeforePhoto, latestAfterPhoto].map((entry, index) => (
                  <div className="site-report-view" key={index === 0 ? "before" : "after"}>
                    <span>{index === 0 ? "Reference view" : "Current view"}</span>
                    {entry ? (
                      <>
                        <img
                          alt={`${entry.defect.title} - ${entry.photo.name}`}
                          src={entry.photo.dataUrl}
                        />
                        <strong>{entry.defect.title}</strong>
                        <small>{formatCapturedAt(entry.photo.capturedAt)}</small>
                      </>
                    ) : (
                      <div className="site-report-view-empty">
                        <Camera size={20} />
                        <strong>{index === 0 ? "รอรูปก่อนแก้" : "รอรูปหลังแก้/จุดตรวจ"}</strong>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="site-report-reference">
                <div className="site-report-qr" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
                <div>
                  <span>Report deep link</span>
                  <strong>{siteReportUrl}</strong>
                  <small>ใช้แทน QR link ไปยังรายงานโครงการใน v0.1 ก่อนต่อ 360 viewer จริง</small>
                </div>
              </div>
              <div className="site-evidence-panel">
                <PageHeader
                  title="Evidence assets"
                  detail="เก็บลิงก์ 360, รูป, PDF, receipt หรือไฟล์อ้างอิงของโครงการไว้ใน Evidence layer กลาง"
                />
                <div className="site-evidence-form">
                  <select
                    aria-label="ชนิด evidence"
                    value={evidenceDraft.fileKind}
                    onChange={(event) =>
                      setEvidenceDraft((current) => ({
                        ...current,
                        fileKind: event.target.value as SiteReportEvidenceKind
                      }))
                    }
                  >
                    {siteEvidenceKindOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <input
                    aria-label="ชื่อ evidence"
                    onChange={(event) =>
                      setEvidenceDraft((current) => ({ ...current, name: event.target.value }))
                    }
                    placeholder="ชื่อ evidence"
                    value={evidenceDraft.name}
                  />
                  <input
                    aria-label="ลิงก์ evidence"
                    onChange={(event) =>
                      setEvidenceDraft((current) => ({ ...current, url: event.target.value }))
                    }
                    placeholder="URL / 360 link / Drive link"
                    value={evidenceDraft.url}
                  />
                  <input
                    aria-label="ชั้น evidence"
                    onChange={(event) =>
                      setEvidenceDraft((current) => ({ ...current, floor: event.target.value }))
                    }
                    placeholder="ชั้น"
                    value={evidenceDraft.floor}
                  />
                  <input
                    aria-label="ห้อง evidence"
                    onChange={(event) =>
                      setEvidenceDraft((current) => ({ ...current, room: event.target.value }))
                    }
                    placeholder="ห้อง"
                    value={evidenceDraft.room}
                  />
                  <input
                    aria-label="โซน evidence"
                    onChange={(event) =>
                      setEvidenceDraft((current) => ({ ...current, zone: event.target.value }))
                    }
                    placeholder="โซน"
                    value={evidenceDraft.zone}
                  />
                  <input
                    aria-label="viewpoint evidence"
                    onChange={(event) =>
                      setEvidenceDraft((current) => ({ ...current, viewpoint: event.target.value }))
                    }
                    placeholder="Viewpoint / Pin"
                    value={evidenceDraft.viewpoint}
                  />
                  <input
                    aria-label="หมายเหตุ evidence"
                    onChange={(event) =>
                      setEvidenceDraft((current) => ({ ...current, note: event.target.value }))
                    }
                    placeholder="หมายเหตุ"
                    value={evidenceDraft.note}
                  />
                  <button
                    className="primary-button"
                    disabled={!selectedProject || (!evidenceDraft.name.trim() && !evidenceDraft.url.trim())}
                    onClick={addEvidenceAsset}
                    type="button"
                  >
                    <Plus size={15} />
                    Add
                  </button>
                </div>
                <div className="site-evidence-list">
                  {visibleProjectEvidenceAssets.length === 0 ? (
                    <div className="defect-empty">
                      <strong>ยังไม่มี evidence asset</strong>
                      <span>เพิ่ม 360 link หรือไฟล์อ้างอิง แล้วรายการจะเข้า report events อัตโนมัติ</span>
                    </div>
                  ) : (
                    visibleProjectEvidenceAssets.map((asset) => (
                      <article className="site-evidence-row" key={asset.id}>
                        <span>{siteReportEvidenceKindLabels[getSiteReportEvidenceKind(asset)]}</span>
                        <div>
                          <strong>{asset.title}</strong>
                          <small>
                            {getSiteReportEvidenceLocation(asset) ||
                              asset.description ||
                              asset.dataUrl ||
                              "Project evidence"}
                          </small>
                        </div>
                        {asset.dataUrl && (
                          <a className="secondary-button" href={asset.dataUrl} rel="noreferrer" target="_blank">
                            <ExternalLink size={14} />
                            Open
                          </a>
                        )}
                        {asset.sourceAppId === "defectTracker" && (
                          <button
                            aria-label={`ลบ evidence ${asset.title}`}
                            className="secondary-button danger-action"
                            onClick={() => removeEvidenceAsset(asset.id)}
                            type="button"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </article>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="defect-main-grid">
        <div className="module-board">
          <PageHeader
            title="Milestone progress"
            detail={`งวดถัดไป: ${nextMilestone?.name ?? "พร้อมส่งมอบ"} / มูลค่างาน ${money.format(
              projectTotal
            )}`}
          />
          <div className="defect-progress-list">
            {syncedMilestones.map((milestone) => {
              const fill =
                milestone.status === "paid" ? 100 : milestone.status === "ready" ? 78 : 24;
              const statusLabel =
                milestone.status === "paid"
                  ? "จบแล้ว"
                  : milestone.status === "ready"
                    ? "พร้อมตรวจ"
                    : "รอดำเนินการ";

              return (
                <div className={`defect-progress-row ${milestone.status}`} key={milestone.id}>
                  <div className="defect-progress-meta">
                    <div>
                      <strong>{milestone.name}</strong>
                      <span>{milestone.due}</span>
                    </div>
                    <small>
                      {milestone.percent}% / {statusLabel}
                    </small>
                  </div>
                  <div className="defect-progress-track" aria-hidden="true">
                    <span style={{ width: `${fill}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="module-board">
          <PageHeader
            title="Defect ที่ต้องเคลียร์"
            detail="เพิ่มและติดตามรายการจริงของโครงการ พร้อมบันทึกสถานะไว้ใช้งานต่อ"
          />
          <div className="defect-entry-form">
            <input
              aria-label="หัวข้อ defect"
              value={defectDraft.title}
              onChange={(event) =>
                setDefectDraft((current) => ({ ...current, title: event.target.value }))
              }
              placeholder="หัวข้อ defect"
            />
            <input
              aria-label="พื้นที่"
              value={defectDraft.area}
              onChange={(event) =>
                setDefectDraft((current) => ({ ...current, area: event.target.value }))
              }
              placeholder="พื้นที่ / ห้อง / จุดตรวจ"
            />
            <input
              aria-label="ผู้รับผิดชอบ"
              value={defectDraft.owner}
              onChange={(event) =>
                setDefectDraft((current) => ({ ...current, owner: event.target.value }))
              }
              placeholder="ผู้รับผิดชอบ"
            />
            <input
              aria-label="กำหนดแก้"
              value={defectDraft.due}
              onChange={(event) =>
                setDefectDraft((current) => ({ ...current, due: event.target.value }))
              }
              placeholder="กำหนดแก้"
            />
            <select
              aria-label="ระดับความเร่งด่วน"
              value={defectDraft.severity}
              onChange={(event) =>
                setDefectDraft((current) => ({
                  ...current,
                  severity: event.target.value as DefectSeverity
                }))
              }
            >
              <option value="high">ด่วน</option>
              <option value="medium">กลาง</option>
              <option value="low">เบา</option>
            </select>
            <button
              className="primary-button"
              disabled={!selectedProject || !defectDraft.title.trim()}
              onClick={addProjectDefect}
              type="button"
            >
              <Plus size={16} />
              เพิ่ม
            </button>
          </div>
          {photoUploadError && <div className="defect-upload-error">{photoUploadError}</div>}
          <div className="defect-list">
            {projectDefects.length === 0 && (
              <div className="defect-empty">
                <strong>ยังไม่มี defect ของโครงการนี้</strong>
                <span>เพิ่มรายการจากแบบฟอร์มด้านบน แล้วข้อมูลจะถูกบันทึกไว้ใน workspace backup</span>
              </div>
            )}
            {projectDefects.map((item) => (
              <article className={`defect-item ${item.severity}`} id={`defect-${item.id}`} key={item.id}>
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.area}</span>
                </div>
                <div className="defect-item-meta">
                  <span className={`defect-tag ${item.severity}`}>
                    {defectSeverityLabels[item.severity]}
                  </span>
                  <span className="defect-status">{defectStatusLabels[item.status]}</span>
                </div>
                <small>
                  {item.due} · {item.owner}
                </small>
                <div className="defect-item-controls">
                  <select
                    aria-label={`สถานะ ${item.title}`}
                    value={item.status}
                    onChange={(event) =>
                      updateProjectDefect(item.id, { status: event.target.value as DefectStatus })
                    }
                  >
                    <option value="open">รอแก้</option>
                    <option value="fixing">กำลังแก้</option>
                    <option value="review">ตรวจซ้ำ</option>
                    <option value="closed">แก้แล้ว</option>
                  </select>
                  <button
                    className="secondary-button"
                    disabled={!item.documentId}
                    onClick={() => item.documentId && onOpenDocument(item.documentId)}
                    type="button"
                  >
                    <ExternalLink size={14} />
                    Docs
                  </button>
                  <button
                    className="secondary-button danger-action"
                    onClick={() => removeProjectDefect(item.id)}
                    type="button"
                  >
                    <Trash2 size={14} />
                    ลบ
                  </button>
                </div>
                <div className="defect-photo-strip">
                  <div className="defect-photo-toolbar">
                    <span>
                      <Camera size={14} />
                      รูปหน้างาน {item.photos.length} รูป
                    </span>
                    <div className="defect-photo-actions">
                      {defectPhotoStages.map((stage) => (
                        <label
                          className={
                            uploadingDefectId === item.id
                              ? `defect-photo-upload ${stage} loading`
                              : `defect-photo-upload ${stage}`
                          }
                          key={stage}
                        >
                          <Upload size={14} />
                          {uploadingDefectId === item.id ? "กำลังอัปโหลด" : defectPhotoStageLabels[stage]}
                          <input
                            accept="image/*"
                            aria-label={`อัปโหลดรูป${defectPhotoStageLabels[stage]} ${item.title}`}
                            capture="environment"
                            multiple
                            onChange={(event) => uploadDefectPhotos(item.id, event, stage)}
                            type="file"
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                  {item.photos.length > 0 ? (
                    <div className="defect-photo-grid">
                      {item.photos.map((photo) => (
                        <figure className="defect-photo-card" key={photo.id}>
                          <img alt={`${item.title} - ${photo.name}`} src={photo.dataUrl} />
                          <figcaption>
                            <div className="defect-photo-meta-line">
                              <span className={`defect-photo-stage ${photo.stage}`}>
                                {defectPhotoStageLabels[photo.stage]}
                              </span>
                              <small>{formatCapturedAt(photo.capturedAt)}</small>
                            </div>
                            <span>{photo.name}</span>
                            <input
                              aria-label={`หมายเหตุรูป ${photo.name}`}
                              className="defect-photo-caption"
                              onChange={(event) =>
                                updateDefectPhoto(item.id, photo.id, { caption: event.target.value })
                              }
                              placeholder="หมายเหตุรูป / จุดถ่าย"
                              value={photo.caption}
                            />
                            <small>{formatFileSize(photo.size)}</small>
                          </figcaption>
                          <button
                            aria-label={`ลบรูป ${photo.name}`}
                            className="defect-photo-remove"
                            onClick={() => removeDefectPhoto(item.id, photo.id)}
                            type="button"
                          >
                            <X size={13} />
                          </button>
                        </figure>
                      ))}
                    </div>
                  ) : (
                    <small className="defect-photo-empty">แนบรูปก่อนแก้ / หลังแก้ หรือจุดตรวจจากหน้างาน</small>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      <div className="module-board defect-photo-board">
        <PageHeader
          title="รูปจากหน้างาน"
          detail="รวมรูปที่แนบกับ defect ของโครงการนี้ เพื่อใช้ตรวจซ้ำและเตรียมส่งมอบ"
        />
        {projectPhotoGallery.length > 0 ? (
          <div className="defect-gallery-grid">
            {projectPhotoGallery.map(({ defectId, defectTitle, photo }) => (
              <figure className="defect-gallery-card" key={photo.id}>
                <img alt={`${defectTitle} - ${photo.name}`} src={photo.dataUrl} />
                <figcaption>
                  <span className={`defect-photo-stage ${photo.stage}`}>
                    {defectPhotoStageLabels[photo.stage]}
                  </span>
                  <strong>{defectTitle}</strong>
                  <span>{photo.caption || photo.name}</span>
                  <small>{formatCapturedAt(photo.capturedAt)} · {formatFileSize(photo.size)}</small>
                </figcaption>
                <button
                  aria-label={`ลบรูป ${photo.name}`}
                  className="defect-photo-remove"
                  onClick={() => removeDefectPhoto(defectId, photo.id)}
                  type="button"
                >
                  <X size={13} />
                </button>
              </figure>
            ))}
          </div>
        ) : (
          <div className="defect-gallery-empty">
            <ImageIcon size={22} />
            <div>
              <strong>ยังไม่มีรูปจากหน้างาน</strong>
              <span>เพิ่ม defect แล้วกดอัปโหลดรูปในรายการนั้น รูปจะรวมอยู่ที่นี่และติดไปกับ backup</span>
            </div>
          </div>
        )}
      </div>

      <div className="module-board">
        <PageHeader
          title="Checklist ก่อนส่งมอบ"
          detail="ใช้ดูความพร้อมแบบเร็วว่าควรตรวจอะไรต่อก่อนปิดโครงการ"
        />
        <div className="handover-checklist">
          {storedHandoverItems.map((item) => (
            <div className={item.done ? "handover-check done" : "handover-check"} key={item.label}>
              <Check size={15} />
              <span>{item.label}</span>
              <strong>{item.done ? "พร้อม" : "ต้องตรวจ"}</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

type BoqDataPanelProps = {
  activeTab: string;
  projects: ProjectRecord[];
  onSelectApp: (id: WorkspaceAppId) => void;
  onUseItems: (rows: BoqCatalogRow[]) => void;
};

type BoqUndoSnapshot = {
  label: string;
  rows: BoqCatalogRow[];
};

type BoqReviewFilter = "all" | "edited" | "error" | "current";

type BoqPastePreview = {
  cellCount: number;
  invalidCellCount: number;
  nextCellErrors: Record<string, string>;
  rowCount: number;
  samples: Array<{
    field: BoqInlineEditableField;
    keynote: string;
    value: string;
  }>;
  startField: BoqInlineEditableField;
  startRecordId: string;
  updatedIds: string[];
  updatedRows: BoqCatalogRow[];
};

type BoqImportPreview = {
  label: string;
  rows: BoqCatalogRow[];
  samples: Array<{
    keynote: string;
    item: string;
    unit: string;
    unitPrice: number;
  }>;
};

type BoqTableColumnId =
  | "costCode"
  | "item"
  | "brand"
  | "supplier"
  | "status"
  | "publishStatus"
  | "priceVersion"
  | "source"
  | "dataOwner"
  | "license"
  | "updatedAt"
  | "unit"
  | "allowance"
  | "material"
  | "labor"
  | "total";

type BoqTableColumnDefinition = {
  id: BoqTableColumnId;
  label: string;
  width: number;
  field?: BoqInlineEditableField;
};

const BOQ_VISIBLE_COLUMNS_STORAGE_KEY = "boq-data.visible-columns.v1";
const BOQ_PRIMARY_FILTER_STORAGE_KEY = "boq-data.primary-filter.v1";
const BOQ_HIDE_DISABLED_ACTIONS_STORAGE_KEY = "boq-data.hide-disabled-actions.v1";

const boqTableColumns: BoqTableColumnDefinition[] = [
  { id: "costCode", label: "Cost Code", width: 118 },
  { id: "item", label: "รายการ", width: 220, field: "item" },
  { id: "brand", label: "ยี่ห้อ/สเปก", width: 132, field: "brand" },
  { id: "supplier", label: "ร้านค้า", width: 132, field: "supplier" },
  { id: "status", label: "สถานะ", width: 116 },
  { id: "publishStatus", label: "เผยแพร่", width: 104 },
  { id: "priceVersion", label: "เวอร์ชัน", width: 116, field: "priceVersion" },
  { id: "source", label: "แหล่งข้อมูล", width: 128, field: "source" },
  { id: "dataOwner", label: "เจ้าของข้อมูล", width: 128, field: "dataOwner" },
  { id: "license", label: "License", width: 112, field: "license" },
  { id: "updatedAt", label: "อัปเดต", width: 112, field: "updatedAt" },
  { id: "unit", label: "หน่วย", width: 86, field: "unit" },
  { id: "allowance", label: "%เผื่อ", width: 86, field: "allowance" },
  { id: "material", label: "ราคาวัสดุ", width: 112, field: "material" },
  { id: "labor", label: "ราคาแรงงาน", width: 112, field: "labor" },
  { id: "total", label: "รวม/หน่วย", width: 120 }
];

const defaultBoqVisibleColumnIds = boqTableColumns.map((column) => column.id);
const boqTableColumnIdSet = new Set<BoqTableColumnId>(defaultBoqVisibleColumnIds);
const boqAlwaysVisibleTableWidth = 52 + 132 + 190;
const boqColumnIdsAddedForPublishing: BoqTableColumnId[] = ["publishStatus", "source", "dataOwner", "license"];
const legacyAllBoqVisibleColumnIds = defaultBoqVisibleColumnIds.filter(
  (columnId) => !boqColumnIdsAddedForPublishing.includes(columnId)
);

const boqColumnPresets: Array<{ id: string; label: string; columns: BoqTableColumnId[] }> = [
  { id: "all", label: "All columns", columns: defaultBoqVisibleColumnIds },
  { id: "pricing", label: "Pricing", columns: ["item", "unit", "allowance", "material", "labor", "total"] },
  { id: "source", label: "Source", columns: ["item", "brand", "supplier", "status", "publishStatus", "priceVersion", "source", "dataOwner", "license", "updatedAt"] },
  { id: "codes", label: "Codes", columns: ["costCode", "item", "status", "total"] }
];

function normalizeBoqVisibleColumnIds(value: unknown): BoqTableColumnId[] {
  if (!Array.isArray(value)) {
    return defaultBoqVisibleColumnIds;
  }

  const normalizedColumnIds = boqTableColumns
    .map((column) => column.id)
    .filter((id) => value.includes(id) && boqTableColumnIdSet.has(id));

  if (legacyAllBoqVisibleColumnIds.every((id) => value.includes(id))) {
    return defaultBoqVisibleColumnIds;
  }

  return normalizedColumnIds;
}

function loadBoqVisibleColumnIds() {
  if (typeof window === "undefined") {
    return defaultBoqVisibleColumnIds;
  }

  try {
    const storedValue = window.localStorage.getItem(BOQ_VISIBLE_COLUMNS_STORAGE_KEY);
    return storedValue ? normalizeBoqVisibleColumnIds(JSON.parse(storedValue)) : defaultBoqVisibleColumnIds;
  } catch {
    return defaultBoqVisibleColumnIds;
  }
}

function saveBoqVisibleColumnIds(columnIds: BoqTableColumnId[]) {
  try {
    window.localStorage.setItem(BOQ_VISIBLE_COLUMNS_STORAGE_KEY, JSON.stringify(columnIds));
  } catch {
    // Ignore private-mode storage failures; the table still works for the current session.
  }
}

function normalizeBoqPrimaryFilter(value: unknown): BoqFilterOption {
  return typeof value === "string" && boqFilterOptions.includes(value as BoqFilterOption)
    ? (value as BoqFilterOption)
    : "all";
}

function loadBoqPrimaryFilter() {
  if (typeof window === "undefined") {
    return "all";
  }

  try {
    return normalizeBoqPrimaryFilter(window.localStorage.getItem(BOQ_PRIMARY_FILTER_STORAGE_KEY));
  } catch {
    return "all";
  }
}

function saveBoqPrimaryFilter(filter: BoqFilterOption) {
  try {
    window.localStorage.setItem(BOQ_PRIMARY_FILTER_STORAGE_KEY, filter);
  } catch {
    // Ignore private-mode storage failures; the filter still applies for the current session.
  }
}

function loadBoqHideDisabledActions() {
  if (typeof window === "undefined") {
    return true;
  }

  try {
    return window.localStorage.getItem(BOQ_HIDE_DISABLED_ACTIONS_STORAGE_KEY) !== "false";
  } catch {
    return true;
  }
}

function saveBoqHideDisabledActions(shouldHide: boolean) {
  try {
    window.localStorage.setItem(BOQ_HIDE_DISABLED_ACTIONS_STORAGE_KEY, shouldHide ? "true" : "false");
  } catch {
    // Ignore private-mode storage failures; the action column still works for the current session.
  }
}

type BoqTaskLinkageRouteContext = {
  projectId: string;
  taskId: string;
  boqItemId: string;
  costCode: string;
};

function getBoqTaskLinkageRouteContext(): BoqTaskLinkageRouteContext {
  if (typeof window === "undefined") {
    return { projectId: "", taskId: "", boqItemId: "", costCode: "" };
  }

  const params = new URLSearchParams(window.location.search);
  return {
    projectId: params.get("projectId") ?? "",
    taskId: params.get("taskId") ?? "",
    boqItemId: params.get("boqItemId") ?? "",
    costCode: params.get("costCode") ?? ""
  };
}

function formatBoqFilterLabel(filter: BoqFilterOption) {
  return filter === "all" ? "ทุก Level" : filter;
}

const boqReviewFilterOptions: Array<{ id: BoqReviewFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "edited", label: "Edited" },
  { id: "error", label: "Error" },
  { id: "current", label: "Current" }
];

const boqTestEditPattern = /\b(test|qa|inline)\b/i;

function isBoqTestEditRow(row: BoqCatalogRow) {
  return [
    row.keynote,
    row.item,
    row.brand,
    row.supplier,
    row.priceVersion,
    row.source,
    row.note
  ].some((value) => boqTestEditPattern.test(value ?? ""));
}

function BoqDataPanel({ activeTab, projects, onSelectApp, onUseItems }: BoqDataPanelProps) {
  const [taskLinkageRouteContext, setTaskLinkageRouteContext] = useState(() =>
    getBoqTaskLinkageRouteContext()
  );
  const [customRows, setCustomRows] = useState<BoqCatalogRow[]>(() => loadCustomBoqRows());
  const [costCodeState] = useState(() => ensureSeedCostCodes());
  const [costCodeMappingState, setCostCodeMappingState] = useState(() => loadBoqCostCodeMappings());
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<BoqFilterOption>(() => loadBoqPrimaryFilter());
  const [versionFilterId, setVersionFilterId] = useState(BOQ_VERSION_ALL);
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);
  const [importStatus, setImportStatus] = useState(
    "รองรับ Google Sheet, CSV, XLSX, XLS: keynote, item, unit, allowance/loss, material, labor, level, brand, supplier, cost_code, version, status"
  );
  const [sheetUrl, setSheetUrl] = useState("");
  const [isSheetImporting, setIsSheetImporting] = useState(false);
  const [isDraftOpen, setIsDraftOpen] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [draft, setDraft] = useState<BoqDraft>(() => createBlankBoqDraft());
  const projectOptions = useMemo(() => getEmployeeProjectOptions(projects), [projects]);
  const [taskLinkageState, setTaskLinkageState] = useState<BoqTaskLinkageState>(() => loadBoqTaskLinkageState());
  const [activeTaskId, setActiveTaskId] = useState(taskLinkageRouteContext.taskId);
  const [taskDraft, setTaskDraft] = useState({
    name: "งานโครงสร้างชั้น 1",
    projectId: projectOptions[0]?.id ?? "",
    note: ""
  });
  const [linkageSearchQuery, setLinkageSearchQuery] = useState(taskLinkageRouteContext.costCode);
  const [selectedLinkRecordId, setSelectedLinkRecordId] = useState(taskLinkageRouteContext.boqItemId);
  const [allocationAmount, setAllocationAmount] = useState("");
  const [boqUndoStack, setBoqUndoStack] = useState<BoqUndoSnapshot[]>([]);
  const [recentlySavedRecordId, setRecentlySavedRecordId] = useState("");
  const [boqCellErrors, setBoqCellErrors] = useState<Record<string, string>>({});
  const [boqPastePreview, setBoqPastePreview] = useState<BoqPastePreview | null>(null);
  const [boqImportPreview, setBoqImportPreview] = useState<BoqImportPreview | null>(null);
  const [boqReviewFilter, setBoqReviewFilter] = useState<BoqReviewFilter>("all");
  const [visibleBoqColumnIds, setVisibleBoqColumnIds] = useState<BoqTableColumnId[]>(() => loadBoqVisibleColumnIds());
  const [hideDisabledBoqActions, setHideDisabledBoqActions] = useState(() => loadBoqHideDisabledActions());
  const savedRecordTimerRef = useRef<number | null>(null);
  const boqTasks = taskLinkageState.tasks;
  const baseRows = useMemo(() => mergeBoqCatalogRows(customRows), [customRows]);
  const visibleBoqColumnIdSet = useMemo(() => new Set(visibleBoqColumnIds), [visibleBoqColumnIds]);
  const visibleBoqColumns = useMemo(
    () => boqTableColumns.filter((column) => visibleBoqColumnIdSet.has(column.id)),
    [visibleBoqColumnIdSet]
  );
  const visibleBoqInlineFields = useMemo(() => {
    const fields: BoqInlineEditableField[] = ["keynote"];

    visibleBoqColumns.forEach((column) => {
      if (column.field) {
        fields.push(column.field);
      }
    });

    return fields;
  }, [visibleBoqColumns]);
  const boqTableMinWidth = Math.max(
    620,
    Math.min(1480, boqAlwaysVisibleTableWidth + visibleBoqColumns.reduce((sum, column) => sum + column.width, 0))
  );
  const activeCostCodes = useMemo(
    () => costCodeState.codes.filter((costCode) => costCode.active),
    [costCodeState.codes]
  );
  const versionOptions = useMemo(
    () => [
      { id: BOQ_VERSION_ALL, label: "ทุกเวอร์ชันราคา" },
      ...Array.from(
        new Set(baseRows.map((row) => row.priceVersion?.trim()).filter(Boolean) as string[])
      ).map((version) => ({ id: version, label: version }))
    ],
    [baseRows]
  );
  const rows = useMemo(
    () =>
      versionFilterId === BOQ_VERSION_ALL
        ? baseRows
        : baseRows.filter((row) => row.priceVersion === versionFilterId),
    [baseRows, versionFilterId]
  );
  const selectableRows = rows.filter((row) => getBoqRowUnitPrice(row) > 0);
  const uniqueKeynoteCount = new Set(rows.map((row) => row.keynote)).size;
  const currentPriceCount = rows.filter((row) => row.priceStatus === "current" && getBoqRowUnitPrice(row) > 0).length;
  const supplierCount = new Set(rows.map((row) => row.supplier?.trim()).filter(Boolean)).size;
  const sourceCount = useMemo(
    () => new Set(rows.map((row) => row.source?.trim()).filter(Boolean)).size,
    [rows]
  );
  const latestPriceUpdate = useMemo(() => {
    const dates = rows
      .map((row) => row.updatedAt?.trim())
      .filter((date): date is string => Boolean(date))
      .sort();

    return dates[dates.length - 1] ?? "-";
  }, [rows]);
  const publicDatasetRows = useMemo(
    () =>
      rows.filter(
        (row) =>
          (row.publishStatus || "public") === "public" &&
          (row.level < 3 || (row.priceStatus || "current") === "current")
      ),
    [rows]
  );
  const publicDownloadCount = publicDatasetRows.filter((row) => getBoqRowUnitPrice(row) > 0).length;
  const reviewDatasetCount = rows.filter((row) => (row.publishStatus || "public") === "review").length;
  const privateDatasetCount = rows.filter((row) => (row.publishStatus || "public") === "private").length;
  const sourceUpdateRows = useMemo(() => {
    const sourceMap = new Map<
      string,
      {
        count: number;
        latest: string;
        publicCount: number;
      }
    >();

    rows.forEach((row) => {
      const sourceName = row.source?.trim() || row.supplier?.trim() || "manual";
      const current = sourceMap.get(sourceName) ?? { count: 0, latest: "", publicCount: 0 };
      current.count += 1;
      current.publicCount += (row.publishStatus || "public") === "public" ? 1 : 0;
      current.latest = [current.latest, row.updatedAt || ""].sort()[1] ?? "";
      sourceMap.set(sourceName, current);
    });

    return Array.from(sourceMap.entries())
      .map(([source, value]) => ({ source, ...value }))
      .sort((a, b) => b.latest.localeCompare(a.latest) || b.count - a.count)
      .slice(0, 4);
  }, [rows]);
  const customRecordIdSet = useMemo(
    () => new Set(customRows.map((row, index) => getBoqRecordId(row, index))),
    [customRows]
  );
  const errorRecordIdSet = useMemo(
    () => new Set(Object.keys(boqCellErrors).map((cellKey) => cellKey.split(":")[0])),
    [boqCellErrors]
  );
  const visibleRows = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase("th-TH");

    return rows.filter((row, index) => {
      const recordId = getBoqRecordId(row, index);
      const matchesQuery = query ? getBoqSearchText(row).includes(query) : true;
      const matchesFilter =
        activeFilter === "all"
          ? true
          : activeFilter === "L1"
            ? row.level === 1
            : activeFilter === "L2"
              ? row.level === 2
              : activeFilter === "L3+"
                ? row.level === 3
                : getBoqSearchText(row).includes(activeFilter.toLocaleLowerCase("th-TH"));
      const matchesReviewFilter =
        boqReviewFilter === "all"
          ? true
          : boqReviewFilter === "edited"
            ? customRecordIdSet.has(recordId)
            : boqReviewFilter === "error"
              ? errorRecordIdSet.has(recordId)
              : row.priceStatus === "current" && getBoqRowUnitPrice(row) > 0;

      return matchesQuery && matchesFilter && matchesReviewFilter;
    });
  }, [activeFilter, boqReviewFilter, customRecordIdSet, errorRecordIdSet, rows, searchQuery]);
  const selectedRows = rows.filter(
    (row, index) => selectedRecordIds.includes(getBoqRecordId(row, index)) && getBoqRowUnitPrice(row) > 0
  );
  const errorCellCount = Object.keys(boqCellErrors).length;
  const testEditRows = useMemo(() => customRows.filter(isBoqTestEditRow), [customRows]);
  const tableSaveState = errorCellCount
    ? `${errorCellCount} cell error`
    : boqPastePreview || boqImportPreview
      ? boqImportPreview
        ? "Import preview pending"
        : "Paste preview pending"
      : recentlySavedRecordId
        ? "Saved"
        : "All changes saved";
  const activeTask = taskLinkageState.tasks.find((task) => task.id === activeTaskId) ?? taskLinkageState.tasks[0] ?? null;
  const routeProjectLabel =
    projectOptions.find((project) => project.id === taskLinkageRouteContext.projectId)?.name ??
    taskLinkageRouteContext.projectId;
  const hasTaskLinkageRouteContext = Boolean(
    taskLinkageRouteContext.projectId ||
      taskLinkageRouteContext.taskId ||
      taskLinkageRouteContext.boqItemId ||
      taskLinkageRouteContext.costCode
  );
  const taskSearchText = linkageSearchQuery.trim().toLocaleLowerCase("th-TH");
  const catalogRecords = useMemo(
    () =>
      rows
        .map((row, index) => ({
          recordId: getBoqRecordId(row, index),
          row,
          unitPrice: getBoqRowUnitPrice(row)
        }))
        .filter((record) => record.unitPrice > 0),
    [rows]
  );
  const taskPickerRows = useMemo(
    () =>
      catalogRecords
        .filter((record) => (taskSearchText ? getBoqSearchText(record.row).includes(taskSearchText) : true))
        .slice(0, 10),
    [catalogRecords, taskSearchText]
  );
  const selectedLinkRecord = catalogRecords.find((record) => record.recordId === selectedLinkRecordId) ?? taskPickerRows[0] ?? null;
  const activeTaskBudget = activeTask?.boqLinkage.reduce((sum, item) => sum + item.boqUnitPrice, 0) ?? 0;
  const activeTaskAllocated =
    activeTask?.boqLinkage.reduce((sum, item) => sum + item.allocatedAmount, 0) ?? 0;
  const activeTaskRemaining = activeTaskBudget - activeTaskAllocated;
  const savedAllocationItems = useMemo(
    () =>
      rows
        .map((row, index): BoqAllocationItem | null => {
          const totalPrice = getBoqRowUnitPrice(row);

          if (totalPrice <= 0) {
            return null;
          }

          const recordId = getBoqRecordId(row, index);
          const taskAllocations = taskLinkageState.tasks.flatMap((task) =>
            task.boqLinkage
              .filter((allocation) => allocation.boqItemId === recordId)
              .map((allocation) => ({
                taskId: task.id,
                taskName: task.name,
                projectId: task.projectId,
                allocatedAmount: allocation.allocatedAmount
              }))
          );

          return {
            id: recordId,
            code: row.keynote,
            name: row.item,
            unit: row.unit,
            totalPrice,
            spentBudget: 0,
            taskAllocations
          };
        })
        .filter((item): item is BoqAllocationItem => Boolean(item)),
    [rows, taskLinkageState.tasks]
  );
  const savedAllocationSummary = useMemo(
    () => summarizeBoqAllocations(savedAllocationItems),
    [savedAllocationItems]
  );
  const taskLinkageSummary = useMemo(() => summarizeBoqTaskLinkage(taskLinkageState), [taskLinkageState]);
  const costCodeCoverage = useMemo(
    () => summarizeBoqCostCodeCoverage(rows, costCodeMappingState, activeCostCodes),
    [activeCostCodes, costCodeMappingState, rows]
  );
  const selectedAllocationItem = savedAllocationItems.find((item) => item.id === selectedLinkRecord?.recordId) ?? null;
  const selectedCostCodeResolution = selectedLinkRecord
    ? resolveBoqCostCode(selectedLinkRecord.row, costCodeMappingState, activeCostCodes)
    : null;
  const selectedCostCode = selectedCostCodeResolution?.costCode ?? null;
  const selectedAllocationState = selectedAllocationItem ? calculateBoqAllocationState(selectedAllocationItem) : null;
  const selectedExistingLink = activeTask?.boqLinkage.find(
    (link) => link.boqItemId === selectedLinkRecord?.recordId
  );
  const selectedRequestedAmount = Number(allocationAmount.replace(/,/g, ""));
  const selectedAllocatedByOtherTasks =
    selectedAllocationItem?.taskAllocations
      ?.filter((allocation) => allocation.taskId !== activeTask?.id)
      .reduce((sum, allocation) => sum + allocation.allocatedAmount, 0) ?? 0;
  const selectedAvailableAmount = selectedLinkRecord
    ? Math.max(0, selectedLinkRecord.unitPrice - selectedAllocatedByOtherTasks)
    : 0;
  const selectedOverAmount = Math.max(
    0,
    (Number.isFinite(selectedRequestedAmount) ? selectedRequestedAmount : 0) - selectedAvailableAmount
  );
  const activeTaskOverCount =
    activeTask?.boqLinkage.filter((item) => {
      const allocationItem = savedAllocationItems.find((savedItem) => savedItem.id === item.boqItemId);
      return allocationItem
        ? calculateBoqAllocationState(allocationItem).overAllocatedAmount > 0
        : item.allocatedAmount > item.boqUnitPrice;
    }).length ?? 0;
  const allocationSummary = savedAllocationSummary;

  useEffect(() => {
    if (activeTab !== "task-linkage") {
      return;
    }

    const nextContext = getBoqTaskLinkageRouteContext();
    setTaskLinkageRouteContext(nextContext);
    if (nextContext.boqItemId) {
      setSelectedLinkRecordId(nextContext.boqItemId);
    }
    if (nextContext.costCode && !nextContext.boqItemId) {
      setLinkageSearchQuery(nextContext.costCode);
    }
  }, [activeTab]);

  useEffect(() => {
    if (!taskLinkageState.tasks.length) {
      setActiveTaskId("");
      return;
    }

    const routeTask = taskLinkageRouteContext.taskId
      ? taskLinkageState.tasks.find((task) => task.id === taskLinkageRouteContext.taskId)
      : null;
    const routeProjectTask = taskLinkageRouteContext.projectId
      ? taskLinkageState.tasks.find((task) => task.projectId === taskLinkageRouteContext.projectId)
      : null;
    const routeTargetTask = routeTask ?? routeProjectTask;

    if (routeTargetTask && activeTaskId !== routeTargetTask.id) {
      setActiveTaskId(routeTargetTask.id);
      return;
    }

    if (!taskLinkageState.tasks.some((task) => task.id === activeTaskId)) {
      setActiveTaskId(taskLinkageState.tasks[0].id);
    }
  }, [activeTaskId, taskLinkageRouteContext, taskLinkageState.tasks]);

  useEffect(() => {
    if (!selectedLinkRecord) {
      setSelectedLinkRecordId(taskPickerRows[0]?.recordId ?? "");
      return;
    }

    if (!allocationAmount) {
      setAllocationAmount(String(selectedExistingLink?.allocatedAmount ?? selectedLinkRecord.unitPrice));
    }
  }, [allocationAmount, selectedExistingLink?.allocatedAmount, selectedLinkRecord, taskPickerRows]);

  useEffect(() => {
    if (!taskDraft.projectId && projectOptions[0]) {
      setTaskDraft((current) => ({ ...current, projectId: projectOptions[0].id }));
    }
  }, [projectOptions, taskDraft.projectId]);

  useEffect(
    () => () => {
      if (savedRecordTimerRef.current) {
        window.clearTimeout(savedRecordTimerRef.current);
      }
    },
    []
  );

  const commitVisibleBoqColumns = (columnIds: BoqTableColumnId[]) => {
    const normalizedColumnIds = normalizeBoqVisibleColumnIds(columnIds);
    setVisibleBoqColumnIds(normalizedColumnIds);
    saveBoqVisibleColumnIds(normalizedColumnIds);
  };

  const commitActiveBoqFilter = (filter: BoqFilterOption) => {
    setActiveFilter(filter);
    saveBoqPrimaryFilter(filter);
  };

  const commitHideDisabledBoqActions = (shouldHide: boolean) => {
    setHideDisabledBoqActions(shouldHide);
    saveBoqHideDisabledActions(shouldHide);
  };

  const toggleVisibleBoqColumn = (columnId: BoqTableColumnId, checked: boolean) => {
    commitVisibleBoqColumns(
      checked
        ? [...visibleBoqColumnIds, columnId]
        : visibleBoqColumnIds.filter((currentColumnId) => currentColumnId !== columnId)
    );
  };

  const isBoqColumnVisible = (columnId: BoqTableColumnId) => visibleBoqColumnIdSet.has(columnId);

  const commitCustomRows = (nextRows: BoqCatalogRow[]) => {
    const normalizedRows = nextRows.map((row, index) => normalizeBoqRow(row, index));
    setCustomRows(normalizedRows);
    saveCustomBoqRows(normalizedRows);
  };

  const commitTaskLinkageState = (nextState: BoqTaskLinkageState) => {
    setTaskLinkageState(nextState);
    saveBoqTaskLinkageState(nextState);
  };

  const commitCostCodeMappingState = (nextState: typeof costCodeMappingState) => {
    setCostCodeMappingState(nextState);
    saveBoqCostCodeMappings(nextState);
  };

  const getBoqCellKey = (recordId: string, field: BoqInlineEditableField) => `${recordId}:${field}`;

  const focusInlineBoqCell = (
    recordId: string,
    field: BoqInlineEditableField,
    options: { rowOffset?: number; fieldOffset?: number; linearOffset?: number } = {}
  ) => {
    const startRowIndex = visibleRows.findIndex((candidate, index) => getBoqRecordId(candidate, index) === recordId);
    const startFieldIndex = visibleBoqInlineFields.indexOf(field);

    if (startRowIndex < 0 || startFieldIndex < 0) {
      return;
    }

    const fieldCount = visibleBoqInlineFields.length;
    const linearIndex = startRowIndex * fieldCount + startFieldIndex;
    const targetLinearIndex =
      options.linearOffset === undefined
        ? (startRowIndex + (options.rowOffset ?? 0)) * fieldCount + startFieldIndex + (options.fieldOffset ?? 0)
        : linearIndex + options.linearOffset;
    const targetRowIndex = Math.floor(targetLinearIndex / fieldCount);
    const targetFieldIndex = targetLinearIndex % fieldCount;
    const targetRow = visibleRows[targetRowIndex];
    const targetField = visibleBoqInlineFields[targetFieldIndex];

    if (!targetRow || !targetField || targetRowIndex < 0 || targetFieldIndex < 0) {
      return;
    }

    const targetRecordId = getBoqRecordId(targetRow, targetRowIndex);
    window.setTimeout(() => {
      const targetInput = Array.from(document.querySelectorAll<HTMLInputElement>(".boq-inline-input")).find(
        (input) => input.dataset.boqRecordId === targetRecordId && input.dataset.boqField === targetField
      );

      targetInput?.focus();
      targetInput?.select();
    }, 0);
  };

  const pushBoqUndoSnapshot = (label: string) => {
    setBoqUndoStack((current) => [{ label, rows: customRows }, ...current].slice(0, 5));
  };

  const markBoqRecordSaved = (recordId: string) => {
    setRecentlySavedRecordId(recordId);
    if (savedRecordTimerRef.current) {
      window.clearTimeout(savedRecordTimerRef.current);
    }
    savedRecordTimerRef.current = window.setTimeout(() => setRecentlySavedRecordId(""), 2000);
  };

  const restoreLastBoqEdit = () => {
    const [lastSnapshot, ...remainingSnapshots] = boqUndoStack;

    if (!lastSnapshot) {
      return;
    }

    commitCustomRows(lastSnapshot.rows);
    setBoqUndoStack(remainingSnapshots);
    setRecentlySavedRecordId("");
    setBoqCellErrors({});
    setBoqPastePreview(null);
    setBoqImportPreview(null);
    setImportStatus(`ย้อนกลับ ${lastSnapshot.label} แล้ว`);
  };

  const clearBoqTestEdits = () => {
    if (!testEditRows.length) {
      setImportStatus("ไม่พบค่าทดลองที่มี Test/QA/INLINE");
      return;
    }

    pushBoqUndoSnapshot(`clear ${testEditRows.length} test edits`);
    commitCustomRows(customRows.filter((row) => !isBoqTestEditRow(row)));
    setBoqCellErrors({});
    setBoqPastePreview(null);
    setBoqImportPreview(null);
    setRecentlySavedRecordId("");
    setImportStatus(`ล้างค่าทดลองแล้ว ${testEditRows.length} record`);
  };

  const upsertInlineBoqRow = (
    recordId: string,
    row: BoqCatalogRow,
    patch: Partial<BoqCatalogRow>,
    options: { trackUndo?: boolean; statusLabel?: string } = {}
  ) => {
    if (options.trackUndo !== false) {
      pushBoqUndoSnapshot(options.statusLabel ?? `แก้ ${row.keynote}`);
    }

    const nextRow = normalizeBoqRow(
      {
        ...row,
        ...patch,
        id: recordId,
        updatedAt: patch.updatedAt ?? new Date().toISOString().slice(0, 10)
      },
      customRows.length + 1
    );
    const nextRows = [
      nextRow,
      ...customRows.filter((customRow, index) => getBoqRecordId(customRow, index) !== recordId)
    ];

    commitCustomRows(nextRows);
    setBoqPastePreview(null);
    setBoqImportPreview(null);
    markBoqRecordSaved(recordId);
    setImportStatus(options.statusLabel ?? `อัปเดต ${nextRow.keynote} ในตารางแล้ว`);
  };

  const commitInlineBoqField = (
    recordId: string,
    row: BoqCatalogRow,
    field: BoqInlineEditableField,
    value: string
  ) => {
    const validation = validateBoqInlineCellValue(field, value);
    const cellKey = getBoqCellKey(recordId, field);

    if (!validation.valid) {
      setBoqCellErrors((current) => ({ ...current, [cellKey]: validation.message }));
      setImportStatus(`${row.keynote}: ${validation.message}`);
      return false;
    }

    const currentValue = String(row[field] ?? "").trim();

    if (validation.value === currentValue) {
      setBoqCellErrors((current) => {
        const next = { ...current };
        delete next[cellKey];
        return next;
      });
      return true;
    }

    upsertInlineBoqRow(recordId, row, { [field]: validation.value });
    setBoqCellErrors((current) => {
      const next = { ...current };
      delete next[cellKey];
      return next;
    });
    return true;
  };

  const pasteInlineBoqCells = (
    recordId: string,
    field: BoqInlineEditableField,
    clipboardText: string
  ) => {
    const clipboardRows = parseSpreadsheetClipboard(clipboardText);
    const hasMultipleCells = clipboardRows.length > 1 || (clipboardRows[0]?.length ?? 0) > 1;

    if (!hasMultipleCells) {
      return false;
    }

    const startRowIndex = visibleRows.findIndex((candidate, index) => getBoqRecordId(candidate, index) === recordId);
    const startFieldIndex = visibleBoqInlineFields.indexOf(field);

    if (startRowIndex < 0 || startFieldIndex < 0) {
      return false;
    }

    const today = new Date().toISOString().slice(0, 10);
    const updatedRows: BoqCatalogRow[] = [];
    const updatedIds = new globalThis.Set<string>();
    const nextCellErrors = { ...boqCellErrors };
    const samples: BoqPastePreview["samples"] = [];
    let invalidCellCount = 0;
    let cellCount = 0;

    clipboardRows.forEach((clipboardRow, rowOffset) => {
      const targetRow = visibleRows[startRowIndex + rowOffset];

      if (!targetRow) {
        return;
      }

      const targetRecordId = getBoqRecordId(targetRow, startRowIndex + rowOffset);
      const patch: Partial<BoqCatalogRow> = {};

      clipboardRow.forEach((cellValue, columnOffset) => {
        cellCount += 1;
        const targetField = visibleBoqInlineFields[startFieldIndex + columnOffset];

        if (!targetField) {
          return;
        }

        const validation = validateBoqInlineCellValue(targetField, cellValue);
        const cellKey = getBoqCellKey(targetRecordId, targetField);

        if (!validation.valid) {
          nextCellErrors[cellKey] = validation.message;
          invalidCellCount += 1;
          return;
        }

        delete nextCellErrors[cellKey];

        if (validation.value !== String(targetRow[targetField] ?? "").trim()) {
          patch[targetField] = validation.value;
          if (samples.length < 6) {
            samples.push({
              field: targetField,
              keynote: targetRow.keynote,
              value: validation.value
            });
          }
        }
      });

      if (Object.keys(patch).length) {
        updatedRows.push(
          normalizeBoqRow(
            {
              ...targetRow,
              ...patch,
              id: targetRecordId,
              updatedAt: patch.updatedAt ?? today
            },
            customRows.length + updatedRows.length + 1
          )
        );
        updatedIds.add(targetRecordId);
      }
    });

    if (!updatedRows.length) {
      setBoqPastePreview(null);
      setImportStatus(
        invalidCellCount
          ? `Paste preview พบ ${invalidCellCount} cell ที่ format ไม่ถูก`
          : "Paste แล้ว แต่ไม่มีค่าที่เปลี่ยนจากข้อมูลเดิม"
      );
      return true;
    }

    setBoqPastePreview({
      cellCount,
      invalidCellCount,
      nextCellErrors,
      rowCount: clipboardRows.length,
      samples,
      startField: field,
      startRecordId: recordId,
      updatedIds: Array.from(updatedIds),
      updatedRows
    });
    setImportStatus(
      `Paste preview: ${updatedRows.length} record / ${cellCount} cell${
        invalidCellCount ? `, ข้าม ${invalidCellCount} cell ที่ format ไม่ถูก` : ""
      }`
    );
    return true;
  };

  const applyBoqPastePreview = () => {
    if (!boqPastePreview) {
      return;
    }

    pushBoqUndoSnapshot(`paste ${boqPastePreview.updatedRows.length} แถว`);
    commitCustomRows([
      ...boqPastePreview.updatedRows,
      ...customRows.filter((customRow, index) => !boqPastePreview.updatedIds.includes(getBoqRecordId(customRow, index)))
    ]);
    setBoqCellErrors(boqPastePreview.nextCellErrors);
    markBoqRecordSaved(boqPastePreview.updatedRows[0]?.id ?? boqPastePreview.startRecordId);
    setImportStatus(
      `Apply paste แล้ว ${boqPastePreview.updatedRows.length} record${
        boqPastePreview.invalidCellCount ? `, ข้าม ${boqPastePreview.invalidCellCount} cell ที่ format ไม่ถูก` : ""
      }`
    );
    setBoqPastePreview(null);
  };

  const cancelBoqPastePreview = () => {
    setBoqPastePreview(null);
    setImportStatus("ยกเลิก paste preview แล้ว");
  };

  const commitInlineBoqStatus = (recordId: string, row: BoqCatalogRow, priceStatus: BoqPriceStatus) => {
    if ((row.priceStatus || "current") === priceStatus) {
      return;
    }

    upsertInlineBoqRow(recordId, row, { priceStatus });
  };

  const handleInlineCellPaste = (
    event: ClipboardEvent<HTMLInputElement>,
    recordId: string,
    field: BoqInlineEditableField
  ) => {
    const clipboardText = event.clipboardData.getData("text/plain");

    if (pasteInlineBoqCells(recordId, field, clipboardText)) {
      event.preventDefault();
    }
  };

  const handleInlineCellBlur = (
    event: FocusEvent<HTMLInputElement>,
    recordId: string,
    row: BoqCatalogRow,
    field: BoqInlineEditableField
  ) => {
    const committed = commitInlineBoqField(recordId, row, field, event.target.value);

    if (!committed) {
      event.currentTarget.value = String(row[field] ?? "");
    }
  };

  const handleInlineCellKeyDown = (
    event: KeyboardEvent<HTMLInputElement>,
    recordId: string,
    field: BoqInlineEditableField
  ) => {
    if (event.key === "Enter") {
      event.preventDefault();
      event.currentTarget.blur();
      focusInlineBoqCell(recordId, field, { rowOffset: event.shiftKey ? -1 : 1 });
      return;
    }

    if (event.key === "Tab") {
      event.preventDefault();
      event.currentTarget.blur();
      focusInlineBoqCell(recordId, field, { linearOffset: event.shiftKey ? -1 : 1 });
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      event.currentTarget.blur();
      focusInlineBoqCell(recordId, field, { rowOffset: event.key === "ArrowUp" ? -1 : 1 });
      return;
    }

    if (event.key === "Escape") {
      event.currentTarget.value = event.currentTarget.defaultValue;
      setBoqCellErrors((current) => {
        const next = { ...current };
        delete next[getBoqCellKey(recordId, field)];
        return next;
      });
      event.currentTarget.blur();
    }
  };

  const renderInlineInput = (
    recordId: string,
    row: BoqCatalogRow,
    field: BoqInlineEditableField,
    label: string,
    options: { className?: string; placeholder?: string; indent?: boolean } = {}
  ) => {
    const cellError = boqCellErrors[getBoqCellKey(recordId, field)];

    return (
      <input
        aria-invalid={cellError ? "true" : undefined}
        aria-label={`${label} ${row.keynote}`}
        className={`boq-inline-input${options.className ? ` ${options.className}` : ""}${cellError ? " invalid" : ""}`}
        data-boq-field={field}
        data-boq-record-id={recordId}
        defaultValue={String(row[field] ?? "")}
        key={`${recordId}-${field}-${String(row[field] ?? "")}`}
        onBlur={(event) => handleInlineCellBlur(event, recordId, row, field)}
        onKeyDown={(event) => handleInlineCellKeyDown(event, recordId, field)}
        onPaste={(event) => handleInlineCellPaste(event, recordId, field)}
        placeholder={options.placeholder}
        style={options.indent ? { paddingLeft: row.level > 1 ? 24 : undefined } : undefined}
        title={cellError || "Enter: ลงแถวถัดไป / Tab: ช่องถัดไป / Paste: หลายเซลล์"}
      />
    );
  };

  const mapBoqRowToCostCode = (recordId: string, row: BoqCatalogRow, costCodeId: string) => {
    const costCode = activeCostCodes.find((code) => code.id === costCodeId || code.code === costCodeId);

    if (!costCodeId) {
      commitCostCodeMappingState(removeBoqCostCodeMapping(costCodeMappingState, { boqRecordId: recordId }));
      setImportStatus(`Removed Cost Code mapping for ${row.keynote}`);
      return;
    }

    commitCostCodeMappingState(
      upsertBoqCostCodeMapping(costCodeMappingState, {
        keynote: row.keynote,
        boqRecordId: recordId,
        costCodeId,
        confidence: "manual",
        note: costCode ? `${costCode.code} ${costCode.name}` : ""
      })
    );
    setImportStatus(`Mapped ${row.keynote} to ${costCode?.code ?? costCodeId}`);
  };

  const createTask = () => {
    const name = taskDraft.name.trim();

    if (!name) {
      setImportStatus("กรุณากรอกชื่อ task ก่อนสร้าง Task Linkage");
      return;
    }

    const nextTask = createBoqProjectTask({
      name,
      projectId: taskDraft.projectId || projectOptions[0]?.id || "",
      note: taskDraft.note
    });

    commitTaskLinkageState(upsertBoqProjectTask(taskLinkageState, nextTask));
    setActiveTaskId(nextTask.id);
    setTaskDraft((current) => ({
      ...current,
      name: `Task ${boqTasks.length + 2}`,
      note: ""
    }));
    setImportStatus(`สร้าง task ${nextTask.name} แล้ว`);
  };

  const updateTask = (taskId: string, patch: Partial<BoqProjectTask>) => {
    const task = taskLinkageState.tasks.find((item) => item.id === taskId);

    if (!task) {
      return;
    }

    commitTaskLinkageState(upsertBoqProjectTask(taskLinkageState, { ...task, ...patch }));
  };

  const deleteTask = (taskId: string) => {
    const nextState = removeBoqProjectTask(taskLinkageState, taskId);
    commitTaskLinkageState(nextState);
    const nextTasks = nextState.tasks;
    setActiveTaskId(nextTasks[0]?.id ?? "");
    setImportStatus("ลบ task linkage แล้ว");
  };

  const addSelectedBoqRowToTask = () => {
    if (!activeTask) {
      setImportStatus("สร้างหรือเลือก task ก่อนเชื่อม BOQ");
      return;
    }

    if (!selectedLinkRecord) {
      setImportStatus("เลือกรายการ BOQ ก่อนบันทึก linkage");
      return;
    }

    const requestedAmount = Number(allocationAmount.replace(/,/g, ""));

    if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) {
      setImportStatus("กรุณากรอกงบที่ต้องการจัดสรรมากกว่า 0");
      return;
    }

    commitTaskLinkageState(
      upsertBoqTaskLinkage(
        taskLinkageState,
        activeTask.id,
        {
          id: selectedLinkRecord.recordId,
          keynote: selectedLinkRecord.row.keynote,
          item: selectedLinkRecord.row.item,
          unit: selectedLinkRecord.row.unit,
          unitPrice: selectedLinkRecord.unitPrice,
          costCodeId: selectedCostCode?.id ?? selectedCostCodeResolution?.costCodeId ?? "",
          costCodeCode: selectedCostCode?.code ?? "",
          costCodeName: selectedCostCode?.name ?? ""
        },
        requestedAmount
      )
    );
    setImportStatus(
      selectedOverAmount > 0
        ? `บันทึก ${selectedLinkRecord.row.keynote} แล้ว แต่เกินงบ ${money.format(selectedOverAmount)}`
        : `เชื่อม ${selectedLinkRecord.row.keynote} เข้ากับ ${activeTask.name} แล้ว`
    );
  };

  const removeTaskAllocation = (taskId: string, boqItemId: string) => {
    commitTaskLinkageState(removeBoqTaskLinkage(taskLinkageState, taskId, boqItemId));
    setImportStatus("ลบ linkage ออกจาก task แล้ว");
  };

  const toggleSelectedRecord = (recordId: string, checked: boolean) => {
    setSelectedRecordIds((current) =>
      checked
        ? Array.from(new Set([...current, recordId]))
        : current.filter((id) => id !== recordId)
    );
  };

  const startDraft = (row?: BoqCatalogRow, cloneAsNew = false) => {
    const normalized = row ? normalizeBoqRow(row) : createBlankBoqDraft();
    const today = new Date().toISOString().slice(0, 10);

    setDraft(
      row && cloneAsNew
        ? {
            ...normalized,
            id: undefined,
            priceStatus: "current",
            publishStatus: "review",
            priceVersion: `manual-${today}`,
            source: "manual",
            updatedAt: today,
            note: normalized.note ? `${normalized.note} / เพิ่มราคาใหม่` : "เพิ่มราคาใหม่จากรายการเดิม"
          }
        : normalized
    );
    setEditingRecordId(row && !cloneAsNew ? getBoqRecordId(normalized) : null);
    setIsDraftOpen(true);
  };

  const saveDraft = () => {
    const nextRow = normalizeBoqRow(
      {
        ...draft,
        id: editingRecordId ?? draft.id ?? `manual-${Date.now().toString(36)}`
      },
      customRows.length + 1
    );

    if (!nextRow.keynote || !nextRow.item) {
      setImportStatus("กรุณากรอก Keynote และรายการ");
      return;
    }

    const nextRows = [
      nextRow,
      ...customRows.filter((row, index) => getBoqRecordId(row, index) !== (editingRecordId ?? nextRow.id))
    ];

    commitCustomRows(nextRows);
    setSelectedRecordIds((current) => current.filter((id) => id !== editingRecordId));
    setEditingRecordId(null);
    setIsDraftOpen(false);
    setImportStatus(`บันทึกราคา ${nextRow.keynote} / ${nextRow.supplier || "ไม่ระบุร้านค้า"} เข้า BOQ Data แล้ว`);
  };

  const removeCustomRow = (recordId: string, keynote: string) => {
    commitCustomRows(customRows.filter((row, index) => getBoqRecordId(row, index) !== recordId));
    setSelectedRecordIds((current) => current.filter((id) => id !== recordId));
    setImportStatus(`ลบ record custom ของ ${keynote} แล้ว`);
  };

  const downloadBoqTemplateCsv = () => {
    downloadTextFile("buildbybim-boq-template.csv", buildBoqImportTemplateCsv());
    setImportStatus("ดาวน์โหลด Template CSV แล้ว นำไฟล์นี้ไปกรอกข้อมูลแล้ว import กลับมาได้");
  };

  const downloadBoqTemplateXlsx = async () => {
    try {
      const blob = await buildBoqImportTemplateXlsxBlob();
      downloadBlobFile("buildbybim-boq-template.xlsx", blob);
      setImportStatus("ดาวน์โหลด Template XLSX แล้ว ใช้ sheet All items สำหรับนำเข้าข้อมูล");
    } catch (error) {
      setImportStatus(`สร้าง Template XLSX ไม่สำเร็จ: ${error instanceof Error ? error.message : "ตรวจ dependency Excel writer"}`);
    }
  };

  const createBoqImportPreview = (label: string, importRows: BoqCatalogRow[]) => {
    setBoqImportPreview({
      label,
      rows: importRows,
      samples: importRows.slice(0, 6).map((row) => ({
        keynote: row.keynote,
        item: row.item,
        unit: row.unit,
        unitPrice: getBoqRowUnitPrice(row)
      }))
    });
    setImportStatus(`Import preview: ${label} ${importRows.length} records`);
  };

  const applyBoqImportPreview = () => {
    if (!boqImportPreview) {
      return;
    }

    pushBoqUndoSnapshot(`import ${boqImportPreview.rows.length} records`);
    commitCustomRows([...boqImportPreview.rows, ...customRows]);
    setBoqImportPreview(null);
    setBoqPastePreview(null);
    setBoqCellErrors({});
    markBoqRecordSaved(boqImportPreview.rows[0]?.id ?? "");
    setImportStatus(`นำเข้า ${boqImportPreview.label} แล้ว ${boqImportPreview.rows.length} record โดยไม่ทับประวัติราคาเดิม`);
  };

  const cancelBoqImportPreview = () => {
    setBoqImportPreview(null);
    setImportStatus("ยกเลิก import preview แล้ว");
  };

  const importBoqFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const normalizedFileName = file.name.toLocaleLowerCase("th-TH");
      const isXlsxFile =
        normalizedFileName.endsWith(".xlsx") ||
        file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      const isXlsFile = normalizedFileName.endsWith(".xls");
      const importResult = isXlsxFile
        ? await import("read-excel-file/browser").then(async ({ default: readExcelFile }) => {
            const workbook = await readExcelFile(file);
            const parsedWorkbook = parseBoqWorkbookSheets(workbook);
            return {
              label: `Excel:${parsedWorkbook.sheetName || file.name}`,
              rows: parsedWorkbook.rows
            };
          })
        : isXlsFile
          ? await parseSheetJsBoqWorkbook(file, "xls").then((parsedWorkbook) => ({
              label: `Excel:${parsedWorkbook.sheetName || file.name}`,
              rows: parsedWorkbook.rows
            }))
        : {
            label: "CSV",
            rows: parseBoqCsv(await file.text())
          };

      if (!importResult.rows.length) {
        setImportStatus("ไม่พบข้อมูลที่นำเข้าได้ กรุณาตรวจหัวคอลัมน์ CSV/XLSX/XLS");
        event.target.value = "";
        return;
      }

      createBoqImportPreview(importResult.label, importResult.rows);
    } catch (error) {
      setImportStatus(`นำเข้าไฟล์ไม่สำเร็จ: ${error instanceof Error ? error.message : "ตรวจไฟล์ CSV/XLSX/XLS"}`);
    } finally {
      event.target.value = "";
    }
  };

  const importGoogleSheet = async () => {
    const csvUrl = toGoogleSheetCsvUrl(sheetUrl);

    if (!csvUrl) {
      setImportStatus("กรุณาใส่ Google Sheet URL หรือ CSV URL ก่อน");
      return;
    }

    setIsSheetImporting(true);
    setImportStatus("กำลังดึงข้อมูลจาก Google Sheet...");

    try {
      const response = await fetch(csvUrl);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const text = await response.text();
      const importedRows = parseBoqCsv(text);

      if (!importedRows.length) {
        setImportStatus("ดึง Sheet ได้ แต่ไม่พบคอลัมน์ BOQ ที่นำเข้าได้");
        return;
      }

      createBoqImportPreview("Google Sheet", importedRows);
    } catch (error) {
      setImportStatus(
        `ดึง Google Sheet ไม่สำเร็จ: ${error instanceof Error ? error.message : "ตรวจ URL หรือสิทธิ์การแชร์ Sheet"}`
      );
    } finally {
      setIsSheetImporting(false);
    }
  };

  const exportCsv = () => {
    const header = [
      "id",
      "keynote",
      "item",
      "unit",
      "allowance",
      "material",
      "labor",
      "level",
      "brand",
      "supplier",
      "price_status",
      "publish_status",
      "version",
      "source",
      "data_owner",
      "license",
      "cost_code",
      "cost_code_source",
      "updated_at",
      "note"
    ];
    const body = rows.map((row, index) => {
      const costCodeResolution = resolveBoqCostCode(row, costCodeMappingState, activeCostCodes, index);
      return [
        getBoqRecordId(row),
        row.keynote,
        row.item,
        row.unit,
        row.allowance,
        row.material,
        row.labor,
        row.level,
        row.brand || "",
        row.supplier || "",
        row.priceStatus || "current",
        row.publishStatus || "public",
        row.priceVersion || "",
        row.source || "",
        row.dataOwner || "",
        row.license || "",
        costCodeResolution.costCode?.code || costCodeResolution.costCodeId || "",
        costCodeResolution.source,
        row.updatedAt || "",
        row.note || ""
      ]
        .map((value) => `"${String(value).replace(/"/g, "\"\"")}"`)
        .join(",");
    });

    downloadTextFile("builddocs-boq-data.csv", [header.join(","), ...body].join("\n"));
  };

  const exportPublicCsv = () => {
    const header = [
      "keynote",
      "item",
      "unit",
      "material",
      "labor",
      "total",
      "level",
      "brand",
      "supplier",
      "price_status",
      "publish_status",
      "version",
      "source",
      "data_owner",
      "license",
      "updated_at"
    ];
    const body = publicDatasetRows.map((row) =>
      [
        row.keynote,
        row.item,
        row.unit,
        row.material,
        row.labor,
        getBoqRowUnitPrice(row),
        row.level,
        row.brand || "",
        row.supplier || "",
        row.priceStatus || "current",
        row.publishStatus || "public",
        row.priceVersion || "",
        row.source || "",
        row.dataOwner || "",
        row.license || "",
        row.updatedAt || ""
      ]
        .map((value) => `"${String(value).replace(/"/g, "\"\"")}"`)
        .join(",")
    );

    downloadTextFile("buildbybim-public-price-database.csv", [header.join(","), ...body].join("\n"));
    setImportStatus(`ดาวน์โหลด Public CSV แล้ว ${publicDownloadCount.toLocaleString("th-TH")} รายการราคา`);
  };

  const sendSelectedRows = () => {
    if (!selectedRows.length) {
      setImportStatus("เลือก L3+ อย่างน้อย 1 รายการก่อนส่งเข้าเอกสาร");
      return;
    }

    onUseItems(selectedRows);
    setSelectedRecordIds([]);
  };

  if (activeTab === "task-linkage") {
    return (
      <section className="workspace-hub" aria-label="BOQ Task Linkage">
        <div className="boq-panel">
          <div className="boq-header">
            <div>
              <h1>BOQ Task Linkage</h1>
              <p>สร้าง task ของโครงการ แล้วเชื่อม BOQ item พร้อมกำหนดยอด allocated budget ต่อรายการ</p>
            </div>
            <div className="boq-actions">
              <span className="boq-pill success">localStorage</span>
              <span className="boq-pill">{taskLinkageState.tasks.length} tasks</span>
              <span className="boq-pill">{savedAllocationSummary.linkedItemsCount} linked items</span>
              <button className="boq-action" onClick={() => onSelectApp("builddocs")} type="button">
                กลับ Docs
              </button>
            </div>
          </div>

          <div className="boq-allocation-card" aria-label="Saved BOQ task allocation summary">
            <div className="boq-allocation-title">
              <span>Saved task allocation</span>
              <strong>{BOQ_TASK_LINKAGE_STORAGE_KEY}</strong>
            </div>
            <div className="boq-allocation-grid">
              <div>
                <small>Budget pool</small>
                <strong>{money.format(savedAllocationSummary.totalBudget)}</strong>
              </div>
              <div>
                <small>Allocated</small>
                <strong>{money.format(savedAllocationSummary.totalAllocated)}</strong>
              </div>
              <div>
                <small>Remaining</small>
                <strong>{money.format(savedAllocationSummary.totalRemaining)}</strong>
              </div>
              <div data-alert={savedAllocationSummary.overAllocatedCount > 0 ? "true" : "false"}>
                <small>Over budget</small>
                <strong>{savedAllocationSummary.overAllocatedCount}</strong>
              </div>
              <div>
                <small>Task total</small>
                <strong>{taskLinkageSummary.taskCount}</strong>
              </div>
              <div>
                <small>Storage</small>
                <strong>{taskLinkageSummary.linkedItemsCount} links</strong>
              </div>
            </div>
          </div>

          {hasTaskLinkageRouteContext && (
            <div className="boq-task-route-context" data-testid="boq-task-route-context">
              <div>
                <small>Opened from Project Control</small>
                <strong>
                  {routeProjectLabel || "Project"} · {taskLinkageRouteContext.costCode || "BOQ linkage"}
                </strong>
                <span>
                  {taskLinkageRouteContext.taskId ? `Task ${taskLinkageRouteContext.taskId}` : "Project task scope"}
                  {taskLinkageRouteContext.boqItemId ? ` · BOQ ${taskLinkageRouteContext.boqItemId}` : ""}
                </span>
              </div>
              <button
                className="boq-action"
                onClick={() => {
                  setTaskLinkageRouteContext({ projectId: "", taskId: "", boqItemId: "", costCode: "" });
                  setLinkageSearchQuery("");
                  setSelectedLinkRecordId("");
                }}
                type="button"
              >
                Clear focus
              </button>
            </div>
          )}

          <div className="boq-task-create-row">
            <input
              aria-label="ชื่อ task ใหม่"
              onChange={(event) =>
                setTaskDraft((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="ชื่องาน เช่น งานโครงสร้างชั้น 1"
              value={taskDraft.name}
            />
            <select
              aria-label="โครงการของ task ใหม่"
              onChange={(event) =>
                setTaskDraft((current) => ({ ...current, projectId: event.target.value }))
              }
              value={taskDraft.projectId}
            >
              {projectOptions.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            <input
              aria-label="หมายเหตุ task ใหม่"
              onChange={(event) =>
                setTaskDraft((current) => ({ ...current, note: event.target.value }))
              }
              placeholder="หมายเหตุ"
              value={taskDraft.note}
            />
            <button className="boq-action primary" onClick={createTask} type="button">
              สร้าง task
            </button>
          </div>

          <div className="boq-task-linkage-layout">
            <div className="boq-task-list" aria-label="Task list">
              {taskLinkageState.tasks.map((task) => {
                const taskAllocated = task.boqLinkage.reduce(
                  (sum, allocation) => sum + allocation.allocatedAmount,
                  0
                );

                return (
                  <button
                    className={task.id === activeTask?.id ? "active" : ""}
                    key={task.id}
                    onClick={() => setActiveTaskId(task.id)}
                    type="button"
                  >
                    <span>{task.status.replace("_", " ")}</span>
                    <strong>{task.name}</strong>
                    <small>
                      {task.boqLinkage.length} items · {money.format(taskAllocated)}
                    </small>
                  </button>
                );
              })}
              {!taskLinkageState.tasks.length && (
                <div className="boq-task-empty">สร้าง task แรกเพื่อเริ่มเชื่อม BOQ item</div>
              )}
            </div>

            <div className="boq-task-detail">
              {activeTask ? (
                <>
                  <div className="boq-task-editor">
                    <label>
                      ชื่อ task
                      <input
                        value={activeTask.name}
                        onChange={(event) =>
                          updateTask(activeTask.id, { name: event.target.value })
                        }
                      />
                    </label>
                    <label>
                      โครงการ
                      <select
                        value={activeTask.projectId}
                        onChange={(event) =>
                          updateTask(activeTask.id, { projectId: event.target.value })
                        }
                      >
                        {projectOptions.map((project) => (
                          <option key={project.id} value={project.id}>
                            {project.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      สถานะ
                      <select
                        value={activeTask.status}
                        onChange={(event) =>
                          updateTask(activeTask.id, {
                            status: event.target.value as BoqProjectTaskStatus
                          })
                        }
                      >
                        <option value="planned">planned</option>
                        <option value="in_progress">in progress</option>
                        <option value="done">done</option>
                      </select>
                    </label>
                    <label className="wide">
                      หมายเหตุ
                      <input
                        value={activeTask.note}
                        onChange={(event) =>
                          updateTask(activeTask.id, { note: event.target.value })
                        }
                      />
                    </label>
                    <button className="boq-action danger" onClick={() => deleteTask(activeTask.id)} type="button">
                      ลบ task
                    </button>
                  </div>

                  <div className="boq-task-summary">
                    <div>
                      <small>Task budget</small>
                      <strong>{money.format(activeTaskBudget)}</strong>
                    </div>
                    <div>
                      <small>Allocated</small>
                      <strong>{money.format(activeTaskAllocated)}</strong>
                    </div>
                    <div data-alert={activeTaskRemaining < 0 ? "true" : "false"}>
                      <small>Remaining</small>
                      <strong>{money.format(activeTaskRemaining)}</strong>
                    </div>
                    <div data-alert={activeTaskOverCount > 0 ? "true" : "false"}>
                      <small>Over item</small>
                      <strong>{activeTaskOverCount}</strong>
                    </div>
                  </div>

                  <div className="boq-task-picker">
                    <label className="boq-search">
                      <Search size={14} />
                      <input
                        onChange={(event) => setLinkageSearchQuery(event.target.value)}
                        placeholder="ค้นหา BOQ item เช่น A3000, คอนกรีต, เหล็ก"
                        type="search"
                        value={linkageSearchQuery}
                      />
                    </label>
                    {selectedLinkRecord && (
                      <div className="boq-task-selected-link">
                        <div>
                          <small>Selected BOQ item</small>
                          <strong>{selectedLinkRecord.row.keynote} · {selectedLinkRecord.row.item}</strong>
                          <span>
                            Available {money.format(selectedAvailableAmount)}
                            {selectedAllocationState ? ` · Allocated ${money.format(selectedAllocationState.allocatedAmount)}` : ""}
                          </span>
                        </div>
                        <label>
                          Cost Code
                          <select
                            value={selectedCostCode?.id ?? ""}
                            onChange={(event) =>
                              mapBoqRowToCostCode(
                                selectedLinkRecord.recordId,
                                selectedLinkRecord.row,
                                event.target.value
                              )
                            }
                          >
                            <option value="">Unmapped</option>
                            {activeCostCodes.map((code) => (
                              <option key={code.id} value={code.id}>
                                {code.code} ยท {code.name}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          Allocated budget
                          <input
                            min="0"
                            onChange={(event) => setAllocationAmount(event.target.value)}
                            type="number"
                            value={allocationAmount}
                          />
                        </label>
                        <button className="boq-action primary" onClick={addSelectedBoqRowToTask} type="button">
                          {selectedExistingLink ? "อัปเดตงบ" : "บันทึก linkage"}
                        </button>
                        {selectedOverAmount > 0 && (
                          <span className="boq-task-warning">เกินงบ {money.format(selectedOverAmount)}</span>
                        )}
                      </div>
                    )}
                    <div className="boq-task-picker-list">
                      {taskPickerRows.map((record) => {
                        const { recordId, row, unitPrice } = record;
                        const isLinked = activeTask.boqLinkage.some(
                          (allocation) => allocation.boqItemId === recordId
                        );
                        const isSelected = selectedLinkRecord?.recordId === recordId;
                        const rowCostCode = resolveBoqCostCode(row, costCodeMappingState, activeCostCodes);

                        return (
                          <div className={isSelected ? "boq-task-picker-row active" : "boq-task-picker-row"} key={recordId}>
                            <div>
                              <strong>{row.keynote}</strong>
                              <span>{row.item}</span>
                              <small>
                                Cost Code: {rowCostCode.costCode ? `${rowCostCode.costCode.code} ยท ${rowCostCode.costCode.name}` : "unmapped"}
                              </small>
                              <small>{row.unit} · {money.format(unitPrice)}</small>
                            </div>
                            <button
                              className="boq-action"
                              onClick={() => {
                                const existingLink = activeTask.boqLinkage.find((link) => link.boqItemId === recordId);

                                setSelectedLinkRecordId(recordId);
                                setAllocationAmount(String(existingLink?.allocatedAmount ?? unitPrice));
                              }}
                              type="button"
                            >
                              {isLinked ? "แก้ยอด" : "เลือก"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="boq-task-linked-table">
                    <div className="boq-task-linked-row head">
                      <span>BOQ item</span>
                      <span>Cost Code</span>
                      <span>Budget</span>
                      <span>Allocated</span>
                      <span>Remaining</span>
                      <span />
                    </div>
                    {activeTask.boqLinkage.map((allocation) => {
                      const remaining = allocation.boqUnitPrice - allocation.allocatedAmount;

                      return (
                        <div
                          className={
                            allocation.boqItemId === taskLinkageRouteContext.boqItemId
                              ? "boq-task-linked-row active"
                              : "boq-task-linked-row"
                          }
                          data-alert={remaining < 0 ? "true" : "false"}
                          key={allocation.id}
                        >
                          <div>
                            <strong>{allocation.boqKeynote}</strong>
                            <small>{allocation.boqItemName}</small>
                          </div>
                          <span>{allocation.costCodeCode || allocation.costCodeId || "-"}</span>
                          <span>{money.format(allocation.boqUnitPrice)}</span>
                          <input
                            aria-label={`Allocated ${allocation.boqKeynote}`}
                            min="0"
                            onChange={(event) =>
                              commitTaskLinkageState(
                                upsertBoqTaskLinkage(
                                  taskLinkageState,
                                  activeTask.id,
                                  {
                                    id: allocation.boqItemId,
                                    keynote: allocation.boqKeynote,
                                    item: allocation.boqItemName,
                                    unit: allocation.unit,
                                    unitPrice: allocation.boqUnitPrice,
                                    costCodeId: allocation.costCodeId,
                                    costCodeCode: allocation.costCodeCode,
                                    costCodeName: allocation.costCodeName
                                  },
                                  Math.max(0, Number(event.target.value))
                                )
                              )
                            }
                            type="number"
                            value={allocation.allocatedAmount}
                          />
                          <span>{money.format(remaining)}</span>
                          <button
                            className="icon-button danger"
                            onClick={() => removeTaskAllocation(activeTask.id, allocation.boqItemId)}
                            title="Remove linkage"
                            type="button"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      );
                    })}
                    {!activeTask.boqLinkage.length && (
                      <div className="boq-task-empty">ยังไม่มี BOQ item ใน task นี้</div>
                    )}
                  </div>
                </>
              ) : (
                <div className="boq-task-empty">เลือกหรือสร้าง task เพื่อเริ่ม linkage</div>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  };

  return (
    <section className="workspace-hub" aria-label="BOQ Data prototype">
      <div className="boq-panel">
        <div className="boq-header">
          <div>
            <h1>BOQ database</h1>
            <p>ฐานข้อมูลกลางสำหรับอัปเดตราคาปัจจุบัน ค่าวัสดุ ค่าแรง ร้านค้า และยี่ห้อ ให้แต่ละโครงการดึงไปใช้</p>
          </div>
          <div className="boq-actions">
            <span className="boq-pill success">Master price data</span>
            <span className="boq-pill">tab: {activeTab}</span>
            <span className="boq-pill">{uniqueKeynoteCount} Keynote</span>
            <span className="boq-pill">{costCodeCoverage.coveragePct}% mapped</span>
            <span className="boq-pill">{currentPriceCount} ราคาปัจจุบัน</span>
            <button className="boq-action primary" onClick={() => startDraft()} type="button">เพิ่มราคา</button>
            <button className="boq-action" onClick={importGoogleSheet} type="button">
              {isSheetImporting ? "กำลังดึง..." : "ดึง Google Sheet"}
            </button>
            <button className="boq-action export" onClick={exportPublicCsv} type="button">Public CSV</button>
            <button className="boq-action export" onClick={exportCsv} type="button">Export CSV</button>
            <button className="boq-action" onClick={() => onSelectApp("builddocs")} type="button">กลับ Docs</button>
          </div>
        </div>

        <div className="boq-bridge-banner">
          <Database size={18} />
          <div>
            <strong>ข้อมูลพื้นฐานกลางของทุกโครงการ</strong>
            <span>Keynote เดียวกันเก็บได้หลาย record เช่น หลายร้านค้า หลายยี่ห้อ หลายราคา และหลายเวอร์ชัน โดยไม่ทับประวัติเดิม</span>
          </div>
          <button className="boq-action primary" onClick={() => onSelectApp("builddocs")} type="button">
            ดูเอกสารโครงการ
          </button>
        </div>

        <div className="boq-public-data-card" aria-label="Public BOQ price database">
          <div className="boq-public-data-title">
            <span>Public data hub</span>
            <strong>ฐานข้อมูลราคาใช้ในระบบ และดาวน์โหลดไปใช้ต่อได้</strong>
          </div>
          <div className="boq-public-data-grid">
            <div>
              <small>พร้อมเผยแพร่</small>
              <strong>{publicDownloadCount.toLocaleString("th-TH")}</strong>
              <span>current price items</span>
            </div>
            <div>
              <small>รอตรวจ</small>
              <strong>{reviewDatasetCount.toLocaleString("th-TH")}</strong>
              <span>review before publish</span>
            </div>
            <div>
              <small>ข้อมูลภายใน</small>
              <strong>{privateDatasetCount.toLocaleString("th-TH")}</strong>
              <span>not exported public</span>
            </div>
            <div>
              <small>แหล่งราคา</small>
              <strong>{sourceCount || supplierCount}</strong>
              <span>source / supplier</span>
            </div>
            <div>
              <small>อัปเดตล่าสุด</small>
              <strong>{latestPriceUpdate}</strong>
              <span>จากข้อมูลที่ import</span>
            </div>
            <div>
              <small>ไฟล์แจก</small>
              <strong>CSV</strong>
              <span>clean public schema</span>
            </div>
          </div>
          <div className="boq-source-log" aria-label="Source update log">
            <div className="boq-source-log-head">
              <strong>Source update log</strong>
              <span>ตรวจว่าแต่ละแหล่งมีรายการ public เท่าไรและอัปเดตล่าสุดเมื่อไร</span>
            </div>
            <div className="boq-source-log-list">
              {sourceUpdateRows.map((source) => (
                <div key={source.source}>
                  <strong>{source.source}</strong>
                  <span>{source.publicCount}/{source.count} public</span>
                  <small>{source.latest || "-"}</small>
                </div>
              ))}
            </div>
          </div>
          <div className="boq-public-data-actions">
            <button className="boq-action export" onClick={exportPublicCsv} type="button">
              <Download size={14} aria-hidden="true" />
              Download Public CSV
            </button>
            <button className="boq-action" onClick={downloadBoqTemplateXlsx} type="button">
              <Download size={14} aria-hidden="true" />
              Template XLSX
            </button>
          </div>
        </div>

        <div className="boq-allocation-card" aria-label="Local-first BOQ allocation summary">
          <div className="boq-allocation-title">
            <span>Local-first allocation</span>
            <strong>No Firebase dependency</strong>
          </div>
          <div className="boq-allocation-grid">
            <div>
              <small>Budget pool</small>
              <strong>{money.format(allocationSummary.totalBudget)}</strong>
            </div>
            <div>
              <small>Draft allocated</small>
              <strong>{money.format(allocationSummary.totalAllocated)}</strong>
            </div>
            <div>
              <small>Remaining</small>
              <strong>{money.format(allocationSummary.totalRemaining)}</strong>
            </div>
            <div>
              <small>Linked items</small>
              <strong>
                {allocationSummary.linkedItemsCount}/{allocationSummary.itemsCount}
              </strong>
            </div>
            <div>
              <small>Allocation rate</small>
              <strong>{allocationSummary.allocatedPercentage}%</strong>
            </div>
            <div data-alert={allocationSummary.overAllocatedCount > 0 ? "true" : "false"}>
              <small>Over budget</small>
              <strong>{allocationSummary.overAllocatedCount}</strong>
            </div>
          </div>
        </div>

        <div className="boq-stat-strip">
          <strong>ทั้งหมด {rows.length.toLocaleString("th-TH")} price records</strong>
          <span>Keynote · {uniqueKeynoteCount}</span>
          <span>L1 · {rows.filter((row) => row.level === 1).length}</span>
          <span>L2 · {rows.filter((row) => row.level === 2).length}</span>
          <span>L3+ · {selectableRows.length}</span>
          <span>ร้านค้า · {supplierCount}</span>
          <span>เลือกแล้ว {selectedRows.length}</span>
          <small>{importStatus}</small>
        </div>

        <div className="boq-filter-row">
          <label className="boq-search">
            <Search size={14} />
            <input
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="ค้นหา Keynote/รายการ เช่น A1000, ขุดดิน"
              type="search"
              value={searchQuery}
            />
          </label>
          {boqFilterOptions.map((filter) => (
            <button
              className={filter === activeFilter ? "boq-filter active" : "boq-filter"}
              key={filter}
              onClick={() => commitActiveBoqFilter(filter)}
              type="button"
            >
              {formatBoqFilterLabel(filter)}
            </button>
          ))}
          <div className="boq-filter-settings" aria-label="ตั้งค่า Filter หลัก" title="ระบบจำ filter ล่าสุดเป็น Filter หลัก">
            <Settings size={14} aria-hidden="true" />
            <span>Filter หลัก: {formatBoqFilterLabel(activeFilter)}</span>
            <button disabled={activeFilter === "all"} onClick={() => commitActiveBoqFilter("all")} type="button">
              Reset
            </button>
          </div>
        </div>

        <div className="boq-import-row">
          <button onClick={downloadBoqTemplateCsv} type="button">
            <Download size={14} aria-hidden="true" />
            Template CSV
          </button>
          <button onClick={downloadBoqTemplateXlsx} type="button">
            <Download size={14} aria-hidden="true" />
            Template XLSX
          </button>
          <input
            accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            onChange={importBoqFile}
            type="file"
          />
          <input
            className="boq-sheet-url"
            onChange={(event) => setSheetUrl(event.target.value)}
            placeholder="Google Sheet URL หรือ CSV URL"
            type="url"
            value={sheetUrl}
          />
          <select
            aria-label="Price version"
            onChange={(event) => setVersionFilterId(event.target.value)}
            value={versionFilterId}
          >
            {versionOptions.map((version) => (
              <option key={version.id} value={version.id}>
                {version.label}
              </option>
            ))}
          </select>
          <button className="boq-action primary" onClick={sendSelectedRows} type="button">
            ส่งเข้าเอกสาร {selectedRows.length ? `(${selectedRows.length})` : ""}
          </button>
        </div>

        {isDraftOpen && (
          <div className="boq-draft-panel">
            <label>
              Keynote
              <input
                value={draft.keynote}
                onChange={(event) => setDraft((current) => ({ ...current, keynote: event.target.value }))}
              />
            </label>
            <label className="wide">
              รายการ
              <input
                value={draft.item}
                onChange={(event) => setDraft((current) => ({ ...current, item: event.target.value }))}
              />
            </label>
            <label>
              ยี่ห้อ/สเปก
              <input
                value={draft.brand || ""}
                onChange={(event) => setDraft((current) => ({ ...current, brand: event.target.value }))}
              />
            </label>
            <label>
              ร้านค้า/ผู้ขาย
              <input
                value={draft.supplier || ""}
                onChange={(event) => setDraft((current) => ({ ...current, supplier: event.target.value }))}
              />
            </label>
            <label>
              หน่วย
              <input
                value={draft.unit}
                onChange={(event) => setDraft((current) => ({ ...current, unit: event.target.value }))}
              />
            </label>
            <label>
              %เผื่อ
              <input
                value={draft.allowance}
                onChange={(event) => setDraft((current) => ({ ...current, allowance: event.target.value }))}
              />
            </label>
            <label>
              วัสดุ
              <input
                value={draft.material}
                onChange={(event) => setDraft((current) => ({ ...current, material: event.target.value }))}
              />
            </label>
            <label>
              แรงงาน
              <input
                value={draft.labor}
                onChange={(event) => setDraft((current) => ({ ...current, labor: event.target.value }))}
              />
            </label>
            <label>
              สถานะราคา
              <select
                value={draft.priceStatus || "current"}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    priceStatus: event.target.value as BoqPriceStatus
                  }))
                }
              >
                <option value="current">ราคาปัจจุบัน</option>
                <option value="watch">ติดตามราคา</option>
                <option value="archived">ประวัติราคา</option>
              </select>
            </label>
            <label>
              สถานะเผยแพร่
              <select
                value={draft.publishStatus || "review"}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    publishStatus: event.target.value as BoqPublishStatus
                  }))
                }
              >
                {Object.entries(boqPublishStatusLabels).map(([status, label]) => (
                  <option key={status} value={status}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              เวอร์ชันราคา
              <input
                value={draft.priceVersion || ""}
                onChange={(event) => setDraft((current) => ({ ...current, priceVersion: event.target.value }))}
              />
            </label>
            <label>
              แหล่งข้อมูล
              <input
                value={draft.source || ""}
                onChange={(event) => setDraft((current) => ({ ...current, source: event.target.value }))}
              />
            </label>
            <label>
              เจ้าของข้อมูล
              <input
                value={draft.dataOwner || ""}
                onChange={(event) => setDraft((current) => ({ ...current, dataOwner: event.target.value }))}
              />
            </label>
            <label>
              License
              <input
                value={draft.license || ""}
                onChange={(event) => setDraft((current) => ({ ...current, license: event.target.value }))}
              />
            </label>
            <label>
              วันที่อัปเดต
              <input
                type="date"
                value={draft.updatedAt || ""}
                onChange={(event) => setDraft((current) => ({ ...current, updatedAt: event.target.value }))}
              />
            </label>
            <label>
              Level
              <select
                value={draft.level}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, level: Number(event.target.value) as BoqCatalogRow["level"] }))
                }
              >
                <option value={1}>L1</option>
                <option value={2}>L2</option>
                <option value={3}>L3+</option>
              </select>
            </label>
            <label className="wide">
              หมายเหตุ
              <input
                value={draft.note || ""}
                onChange={(event) => setDraft((current) => ({ ...current, note: event.target.value }))}
              />
            </label>
            <div className="boq-draft-actions">
              <button className="boq-action" onClick={() => setIsDraftOpen(false)} type="button">ยกเลิก</button>
              <button className="boq-action primary" onClick={saveDraft} type="button">
                {editingRecordId ? "บันทึก record" : "บันทึกเป็นราคาใหม่"}
              </button>
            </div>
          </div>
        )}

        <div className="boq-table-status" aria-label="BOQ table status">
          <span className={errorCellCount ? "danger" : boqPastePreview ? "pending" : recentlySavedRecordId ? "saved" : "ok"}>
            {tableSaveState}
          </span>
          <span>{customRows.length} edited records</span>
          <span>{testEditRows.length} test edits</span>
          <span>{boqUndoStack.length ? `Undo ${boqUndoStack.length}` : "No undo"}</span>
          <span>{boqImportPreview ? `${boqImportPreview.rows.length} import records waiting` : "No pending import"}</span>
          <span>{boqPastePreview ? `${boqPastePreview.updatedRows.length} paste records waiting` : "No pending paste"}</span>
        </div>

        <div className="boq-table-tools">
          <button
            onClick={() => setSelectedRecordIds(selectableRows.map((row, index) => getBoqRecordId(row, index)))}
            type="button"
          >
            เลือก L3+ ทั้งหมด
          </button>
          <button onClick={() => setSelectedRecordIds([])} type="button">ล้างที่เลือก</button>
          <button disabled={!boqUndoStack.length} onClick={restoreLastBoqEdit} type="button">
            <RotateCcw size={14} aria-hidden="true" />
            Undo {boqUndoStack.length ? `(${boqUndoStack.length})` : ""}
          </button>
          <button disabled={!testEditRows.length} onClick={clearBoqTestEdits} type="button">
            <Trash2 size={14} aria-hidden="true" />
            Clear test edits {testEditRows.length ? `(${testEditRows.length})` : ""}
          </button>
          <details className="boq-column-picker">
            <summary>
              <SlidersHorizontal size={14} aria-hidden="true" />
              Columns {visibleBoqColumnIds.length}/{boqTableColumns.length}
            </summary>
            <div className="boq-column-menu">
              <div className="boq-column-menu-head">
                <strong>เลือกคอลัมน์ที่ต้องการแสดง</strong>
                <span>Keynote, เลือก และ Actions จะแสดงตลอด</span>
              </div>
              <div className="boq-column-presets" aria-label="BOQ column presets">
                {boqColumnPresets.map((preset) => (
                  <button
                    data-boq-column-preset={preset.id}
                    key={preset.id}
                    onClick={() => commitVisibleBoqColumns(preset.columns)}
                    type="button"
                  >
                    {preset.label}
                  </button>
                ))}
                <button data-boq-column-preset="minimal" onClick={() => commitVisibleBoqColumns([])} type="button">
                  Minimal
                </button>
              </div>
              <div className="boq-column-options">
                {boqTableColumns.map((column) => (
                  <label key={column.id}>
                    <input
                      checked={isBoqColumnVisible(column.id)}
                      data-boq-column-id={column.id}
                      onChange={(event) => toggleVisibleBoqColumn(column.id, event.target.checked)}
                      type="checkbox"
                    />
                    <span>{column.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </details>
          <label className="boq-action-compact-toggle" title="ซ่อนปุ่มที่ใช้ไม่ได้ในคอลัมน์ Actions">
            <input
              checked={hideDisabledBoqActions}
              onChange={(event) => commitHideDisabledBoqActions(event.target.checked)}
              type="checkbox"
            />
            <span>ซ่อนปุ่มที่ใช้ไม่ได้</span>
          </label>
          <div className="boq-review-filter" aria-label="BOQ review filter">
            {boqReviewFilterOptions.map((filter) => (
              <button
                aria-pressed={boqReviewFilter === filter.id}
                className={boqReviewFilter === filter.id ? "active" : undefined}
                key={filter.id}
                onClick={() => setBoqReviewFilter(filter.id)}
                type="button"
              >
                {filter.label}
              </button>
            ))}
          </div>
          <div aria-label="โทนตาราง" className="boq-tone-switch">
            <span>โทนตาราง</span>
            {["paper", "clean", "green", "blue"].map((tone, index) => (
              <button aria-label={tone} aria-pressed={index === 0} key={tone} type="button">
                <span className={`boq-tone-dot tone-${tone}`} />
              </button>
            ))}
          </div>
          <small>คลิกเซลล์เพื่อแก้ไข • Enter/Tab/ลูกศรเลื่อนเซลล์ • paste จาก Excel/Sheet ได้ • แสดง {visibleRows.length}/{rows.length} รายการ</small>
        </div>

        {boqPastePreview && (
          <div className="boq-paste-preview" role="status">
            <div>
              <strong>Paste preview</strong>
              <span>
                {boqPastePreview.rowCount} rows / {boqPastePreview.cellCount} cells / {boqPastePreview.updatedRows.length} records
                {boqPastePreview.invalidCellCount ? ` / ${boqPastePreview.invalidCellCount} invalid` : ""}
              </span>
            </div>
            <ul>
              {boqPastePreview.samples.map((sample) => (
                <li key={`${sample.keynote}-${sample.field}-${sample.value}`}>
                  <code>{sample.keynote}</code>
                  <span>{sample.field}</span>
                  <strong>{sample.value || "-"}</strong>
                </li>
              ))}
            </ul>
            <footer>
              <button className="boq-action primary" onClick={applyBoqPastePreview} type="button">
                Apply paste
              </button>
              <button className="boq-action" onClick={cancelBoqPastePreview} type="button">
                Cancel
              </button>
            </footer>
          </div>
        )}

        {boqImportPreview && (
          <div className="boq-import-preview" role="status">
            <div>
              <strong>Import preview</strong>
              <span>
                {boqImportPreview.label} / {boqImportPreview.rows.length} records
              </span>
            </div>
            <ul>
              {boqImportPreview.samples.map((sample) => (
                <li key={`${sample.keynote}-${sample.item}`}>
                  <code>{sample.keynote}</code>
                  <span>{sample.item}</span>
                  <strong>{sample.unitPrice ? money.format(sample.unitPrice) : sample.unit || "-"}</strong>
                </li>
              ))}
            </ul>
            <footer>
              <button className="boq-action primary" onClick={applyBoqImportPreview} type="button">
                Apply import
              </button>
              <button className="boq-action" onClick={cancelBoqImportPreview} type="button">
                Cancel
              </button>
            </footer>
          </div>
        )}

        <div className="boq-table-wrap">
          <table className="boq-table" style={{ minWidth: `${boqTableMinWidth}px` }}>
            <thead>
              <tr>
                <th>เลือก</th>
                <th>Keynote</th>
                {boqTableColumns.map((column) =>
                  isBoqColumnVisible(column.id) ? <th key={column.id}>{column.label}</th> : null
                )}
                <th className="boq-actions-heading">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row, index) => {
                const recordId = getBoqRecordId(row, index);
                const unitPrice = getBoqRowUnitPrice(row);
                const isCustomRecord = customRecordIdSet.has(recordId);
                const isRecentlySaved = recentlySavedRecordId === recordId;
                const hasCellError = Object.keys(boqCellErrors).some((cellKey) => cellKey.startsWith(`${recordId}:`));
                const rowCostCode = resolveBoqCostCode(row, costCodeMappingState, activeCostCodes, index);

                return (
                <tr className={isRecentlySaved ? "boq-row-saved" : undefined} key={recordId}>
                  <td>
                    <input
                      aria-label={`เลือก ${row.keynote}`}
                      checked={selectedRecordIds.includes(recordId)}
                      disabled={unitPrice <= 0}
                      onChange={(event) => toggleSelectedRecord(recordId, event.target.checked)}
                      type="checkbox"
                    />
                  </td>
                  <td className="boq-keynote">
                    <span>{row.level < 3 ? "▸" : ""}</span>
                    {renderInlineInput(recordId, row, "keynote", "Keynote", { className: "code" })}
                  </td>
                  {isBoqColumnVisible("costCode") && (
                    <td>
                      <select
                        aria-label={`Cost Code ${row.keynote}`}
                        className="boq-cost-code-select"
                        disabled={row.level < 3}
                        onChange={(event) => mapBoqRowToCostCode(recordId, row, event.target.value)}
                        title={rowCostCode.reason}
                        value={rowCostCode.costCode?.id ?? ""}
                      >
                        <option value="">Auto / unmapped</option>
                        {activeCostCodes.map((code) => (
                          <option key={code.id} value={code.id}>
                            {code.code}
                          </option>
                        ))}
                      </select>
                    </td>
                  )}
                  {isBoqColumnVisible("item") && (
                    <td>{renderInlineInput(recordId, row, "item", "รายการ", { indent: true })}</td>
                  )}
                  {isBoqColumnVisible("brand") && (
                    <td>{renderInlineInput(recordId, row, "brand", "ยี่ห้อ/สเปก", { placeholder: "-" })}</td>
                  )}
                  {isBoqColumnVisible("supplier") && (
                    <td>{renderInlineInput(recordId, row, "supplier", "ร้านค้า", { placeholder: "-" })}</td>
                  )}
                  {isBoqColumnVisible("status") && (
                    <td>
                      <select
                        aria-label={`สถานะ ${row.keynote}`}
                        className={`boq-inline-select boq-status-select ${row.priceStatus || "current"}`}
                        onChange={(event) => commitInlineBoqStatus(recordId, row, event.target.value as BoqPriceStatus)}
                        value={row.priceStatus || "current"}
                      >
                        {Object.entries(boqPriceStatusLabels).map(([status, label]) => (
                          <option key={status} value={status}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </td>
                  )}
                  {isBoqColumnVisible("publishStatus") && (
                    <td>
                      <select
                        aria-label={`เผยแพร่ ${row.keynote}`}
                        className={`boq-inline-select boq-publish-select ${row.publishStatus || "public"}`}
                        onChange={(event) =>
                          upsertInlineBoqRow(recordId, row, {
                            publishStatus: event.target.value as BoqPublishStatus
                          })
                        }
                        value={row.publishStatus || "public"}
                      >
                        {Object.entries(boqPublishStatusLabels).map(([status, label]) => (
                          <option key={status} value={status}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </td>
                  )}
                  {isBoqColumnVisible("priceVersion") && (
                    <td>{renderInlineInput(recordId, row, "priceVersion", "เวอร์ชัน", { placeholder: "-" })}</td>
                  )}
                  {isBoqColumnVisible("source") && (
                    <td>{renderInlineInput(recordId, row, "source", "แหล่งข้อมูล", { placeholder: "-" })}</td>
                  )}
                  {isBoqColumnVisible("dataOwner") && (
                    <td>{renderInlineInput(recordId, row, "dataOwner", "เจ้าของข้อมูล", { placeholder: "-" })}</td>
                  )}
                  {isBoqColumnVisible("license") && (
                    <td>{renderInlineInput(recordId, row, "license", "License", { placeholder: "-" })}</td>
                  )}
                  {isBoqColumnVisible("updatedAt") && (
                    <td>{renderInlineInput(recordId, row, "updatedAt", "อัปเดต", { placeholder: "YYYY-MM-DD" })}</td>
                  )}
                  {isBoqColumnVisible("unit") && (
                    <td>{renderInlineInput(recordId, row, "unit", "หน่วย")}</td>
                  )}
                  {isBoqColumnVisible("allowance") && (
                    <td className="boq-number">
                      {renderInlineInput(recordId, row, "allowance", "%เผื่อ", { className: "number" })}
                    </td>
                  )}
                  {isBoqColumnVisible("material") && (
                    <td className="boq-number">
                      {renderInlineInput(recordId, row, "material", "ราคาวัสดุ", { className: "number" })}
                    </td>
                  )}
                  {isBoqColumnVisible("labor") && (
                    <td className="boq-number">
                      {renderInlineInput(recordId, row, "labor", "ราคาแรงงาน", { className: "number" })}
                    </td>
                  )}
                  {isBoqColumnVisible("total") && (
                    <td className="boq-number boq-calculated-total">{unitPrice ? money.format(unitPrice) : "-"}</td>
                  )}
                  <td className="boq-row-actions">
                    <div className="boq-row-action-strip">
                      {hasCellError ? (
                        <span className="boq-row-chip error" title="มีช่องที่ต้องแก้">ERR</span>
                      ) : isRecentlySaved ? (
                        <span className="boq-row-chip saved" title="บันทึกล่าสุด">SVD</span>
                      ) : isCustomRecord ? (
                        <span className="boq-row-chip" title="แก้ไขแล้ว">EDT</span>
                      ) : (
                        <span className="boq-row-chip placeholder" aria-hidden="true">---</span>
                      )}
                      {unitPrice > 0 ? (
                        <button
                          aria-label={`ใช้ ${row.keynote} ในเอกสาร`}
                          className="boq-row-action-button primary"
                          onClick={() => onUseItems([row])}
                          title="ใช้ในเอกสาร"
                          type="button"
                        >
                          <FileCheck2 size={15} aria-hidden="true" />
                        </button>
                      ) : hideDisabledBoqActions ? (
                        <span className="boq-row-action-button placeholder" aria-hidden="true" />
                      ) : (
                        <button
                          aria-label={`${row.keynote} เป็นหมวดหลัก ใช้ในเอกสารไม่ได้`}
                          className="boq-row-action-button"
                          disabled
                          title="หมวดหลัก"
                          type="button"
                        >
                          <FolderOpen size={15} aria-hidden="true" />
                        </button>
                      )}
                      <button
                        aria-label={`เพิ่มราคาใหม่จาก ${row.keynote}`}
                        className="boq-row-action-button"
                        onClick={() => startDraft(row, true)}
                        title="เพิ่มราคา"
                        type="button"
                      >
                        <FilePlus2 size={15} aria-hidden="true" />
                      </button>
                      <button
                        aria-label={`แก้ไข ${row.keynote}`}
                        className="boq-row-action-button"
                        onClick={() => startDraft(row)}
                        title="แก้ไข"
                        type="button"
                      >
                          <Edit3 size={15} aria-hidden="true" />
                        </button>
                      {isCustomRecord || !hideDisabledBoqActions ? (
                        <button
                          aria-label={`ลบ ${row.keynote}`}
                          className="boq-row-action-button danger"
                          disabled={!isCustomRecord}
                          onClick={() => removeCustomRow(recordId, row.keynote)}
                          title={isCustomRecord ? "ลบ" : "ลบได้เฉพาะ record ที่แก้ไข/เพิ่มเอง"}
                          type="button"
                        >
                          <Trash2 size={15} aria-hidden="true" />
                        </button>
                      ) : (
                        <span className="boq-row-action-button placeholder" aria-hidden="true" />
                      )}
                    </div>
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

type WorkspaceAppCardProps = {
  app: WorkspaceAppDefinition;
  language: WorkspaceLanguage;
  metrics?: Array<{
    label: string;
    value: string;
  }>;
  onSelect: () => void;
  onSelectVersion: (versionId: string) => void;
  quickActions?: Array<{
    label: string;
    onSelect: () => void;
  }>;
  selectedVersion: WorkspaceAppVersionDefinition;
};

function WorkspaceAppCard({
  app,
  language,
  metrics,
  onSelect,
  onSelectVersion,
  quickActions,
  selectedVersion
}: WorkspaceAppCardProps) {
  const appCopy = getWorkspaceAppCopy(app, language);
  const copy = getWorkspaceLanguageCopy(workspaceShellCopy, language);
  const Icon = workspaceAppIcons[app.id] ?? Database;

  return (
    <article className={app.id === "employees" ? "app-card app-card-team" : "app-card"}>
      <button className="app-card-open" onClick={onSelect} type="button">
        <span className="app-card-icon">
          <Icon size={22} />
        </span>
        <span className="app-card-copy">
          <strong>{appCopy.label}</strong>
          <small>{appCopy.description}</small>
        </span>
      </button>
      {metrics?.length ? (
        <span className="app-card-insights">
          {metrics.map((metric) => (
            <span className="app-card-insight" key={metric.label}>
              <small>{metric.label}</small>
              <strong>{metric.value}</strong>
            </span>
          ))}
        </span>
      ) : null}
      {quickActions?.length ? (
        <span className="app-card-actions">
          {quickActions.map((action) => (
            <button key={action.label} onClick={action.onSelect} type="button">
              {action.label}
            </button>
          ))}
        </span>
      ) : null}
      <span className="app-card-meta">
        <span className={`app-status ${app.status}`}>{app.statusLabel}</span>
        <label className="app-version-control">
          <span>{copy.version}</span>
          <select
            aria-label={`${appCopy.shortLabel} ${copy.version}`}
            value={selectedVersion.id}
            onChange={(event) => onSelectVersion(event.target.value)}
          >
            {app.versions.map((version) => (
              <option key={version.id} value={version.id}>
                {version.label}
              </option>
            ))}
          </select>
        </label>
      </span>
    </article>
  );
}

type PageContextBannerProps = {
  activePage: AppPage;
  selectedMilestone?: Milestone;
  selectedMilestoneAmount: number;
};

function PageContextBanner({
  activePage,
  selectedMilestone,
  selectedMilestoneAmount
}: PageContextBannerProps) {
  const title = activePage === "contracts" ? "หน้าสัญญาและงวดงาน" : "นำเข้าข้อมูลจาก Google Sheet";
  const detail =
    activePage === "contracts" && selectedMilestone
      ? `งวดที่เลือก: ${selectedMilestone.name} มูลค่า ${money.format(selectedMilestoneAmount)}`
      : "หน้านี้เชื่อมกับรายการงานในเอกสาร เมื่อ import แล้ว preview และยอดรวมจะอัปเดตทันที";

  return (
    <section className="context-banner">
      <strong>{title}</strong>
      <span>{detail}</span>
    </section>
  );
}

type BillingSchedulePanelProps = {
  milestones: Milestone[];
  selectedMilestoneId: number;
  billingDocuments: StoredDocument[];
  receiptDocuments: StoredDocument[];
  grandTotal: number;
  onSelect: (id: number) => void;
  onCreateInvoice: (id: number) => void;
  onOpenContract: () => void;
};

function BillingSchedulePanel({
  milestones,
  selectedMilestoneId,
  billingDocuments,
  receiptDocuments,
  grandTotal,
  onSelect,
  onCreateInvoice,
  onOpenContract
}: BillingSchedulePanelProps) {
  return (
    <section className="billing-split-panel" aria-label="แยกใบวางบิลตามงวดงาน">
      <div className="section-title-row billing-title-row">
        <div>
          <h3>แยกใบวางบิลตามงวดงาน</h3>
          <span>เลือกงวดเพื่อออกใบวางบิล/ใบแจ้งหนี้เฉพาะยอดของงวดนั้น</span>
        </div>
        <button className="secondary-button" onClick={onOpenContract}>
          <FileSignature size={17} />
          เปิดสัญญา
        </button>
      </div>

      <div className="billing-milestone-list">
        {milestones.map((milestone) => {
          const isActive = milestone.id === selectedMilestoneId;
          const billingDocument = billingDocuments.find(
            (document) => document.relationship.sourceMilestoneId === milestone.id
          );
          const receiptDocument = billingDocument
            ? receiptDocuments.find(
                (document) => document.relationship.sourceDocumentId === billingDocument.id
              )
            : undefined;
          return (
            <button
              className={isActive ? "billing-milestone active" : "billing-milestone"}
              key={milestone.id}
              onClick={() => onSelect(milestone.id)}
            >
              <span>{milestone.percent}% · {getStatusLabel(milestone.status)}</span>
              <strong>{milestone.name}</strong>
              <small>{milestone.due}</small>
              <b>{money.format(milestoneAmount(grandTotal, milestone.percent))}</b>
              {billingDocument && (
                <small className="billing-linked-doc">
                  สร้างแล้ว {billingDocument.documentInfo.documentNo} ·{" "}
                  {money.format(billingDocument.total)}
                </small>
              )}
              {receiptDocument && (
                <small className="billing-linked-doc paid">
                  รับเงินแล้ว {receiptDocument.documentInfo.documentNo} ·{" "}
                  {money.format(receiptDocument.total)}
                </small>
              )}
              <em
                role="button"
                tabIndex={0}
                onClick={(event) => {
                  event.stopPropagation();
                  onCreateInvoice(milestone.id);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    event.stopPropagation();
                    onCreateInvoice(milestone.id);
                  }
                }}
              >
                {billingDocument ? "เปิดใบวางบิล" : "ทำใบวางบิล"}
              </em>
            </button>
          );
        })}
      </div>
    </section>
  );
}

type LinkedPagePanelProps = {
  activePage: AppPage;
  documents: StoredDocument[];
  currentData: AppData;
  subtotal: number;
  vat: number;
  withholding: number;
  grandTotal: number;
  milestones: Milestone[];
  selectedBillingMilestoneId: number;
  billingDocuments: StoredDocument[];
  receiptDocuments: StoredDocument[];
  clients: ClientRecord[];
  projects: ProjectRecord[];
  onSelectDocument: (id: string) => void;
  onOpenPage: (page: AppPage) => void;
  onSelectBilling: (id: number) => void;
  onCreateInvoice: (id: number) => void;
  onSaveCurrentClient: () => void;
  onApplyClient: (client: ClientRecord) => void;
  onUpdateClient: (
    clientId: string,
    patch: Pick<ClientRecord, "name" | "address" | "phone" | "taxId">
  ) => boolean;
  onDeleteClient: (clientId: string) => void;
  onSaveCurrentProject: () => void;
  onApplyProject: (project: ProjectRecord) => void;
  onUpdateProject: (
    projectId: string,
    patch: Pick<
      ProjectRecord,
      "name" | "clientId" | "clientName" | "templateName" | "paymentTerms" | "notes"
    >
  ) => boolean;
  onDeleteProject: (projectId: string) => void;
  onOpenDefect: () => void;
  onExportBackup: () => void;
  onImportBackup: () => void;
};

type ClientRecordDraft = Pick<ClientRecord, "name" | "address" | "phone" | "taxId">;

type ProjectRecordDraft = Pick<
  ProjectRecord,
  "name" | "clientName" | "templateName" | "paymentTerms" | "notes"
> & {
  clientId: string;
};

function LinkedPagePanel({
  activePage,
  documents,
  currentData,
  subtotal,
  vat,
  withholding,
  grandTotal,
  milestones,
  selectedBillingMilestoneId,
  billingDocuments,
  receiptDocuments,
  clients,
  projects,
  onSelectDocument,
  onOpenPage,
  onSelectBilling,
  onCreateInvoice,
  onSaveCurrentClient,
  onApplyClient,
  onUpdateClient,
  onDeleteClient,
  onSaveCurrentProject,
  onApplyProject,
  onUpdateProject,
  onDeleteProject,
  onOpenDefect,
  onExportBackup,
  onImportBackup
}: LinkedPagePanelProps) {
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [clientDraft, setClientDraft] = useState<ClientRecordDraft>({
    name: "",
    address: "",
    phone: "",
    taxId: ""
  });
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [confirmingClientDeleteId, setConfirmingClientDeleteId] = useState<string | null>(null);
  const [confirmingProjectDeleteId, setConfirmingProjectDeleteId] = useState<string | null>(null);
  const [projectDraft, setProjectDraft] = useState<ProjectRecordDraft>({
    name: "",
    clientId: "",
    clientName: "",
    templateName: "",
    paymentTerms: "",
    notes: ""
  });

  const startEditingClient = (client: ClientRecord) => {
    setEditingProjectId(null);
    setConfirmingClientDeleteId(null);
    setConfirmingProjectDeleteId(null);
    setEditingClientId(client.id);
    setClientDraft({
      name: client.name,
      address: client.address,
      phone: client.phone,
      taxId: client.taxId
    });
  };

  const saveClientDraft = () => {
    if (!editingClientId) {
      return;
    }

    const didSave = onUpdateClient(editingClientId, clientDraft);

    if (didSave) {
      setEditingClientId(null);
    }
  };

  const startEditingProject = (project: ProjectRecord) => {
    setEditingClientId(null);
    setConfirmingClientDeleteId(null);
    setConfirmingProjectDeleteId(null);
    setEditingProjectId(project.id);
    setProjectDraft({
      name: project.name,
      clientId: project.clientId ?? "",
      clientName: project.clientName,
      templateName: project.templateName,
      paymentTerms: project.paymentTerms,
      notes: project.notes
    });
  };

  const saveProjectDraft = () => {
    if (!editingProjectId) {
      return;
    }

    const didSave = onUpdateProject(editingProjectId, {
      ...projectDraft,
      clientId: projectDraft.clientId || null
    });

    if (didSave) {
      setEditingProjectId(null);
    }
  };

  if (activePage === "clients") {
    return (
      <section className="linked-page">
        <PageHeader title="ลูกค้า" detail="ฐานข้อมูลลูกค้า แยกจากเอกสาร และนำกลับมาใช้ซ้ำได้" />
        <div className="settings-actions">
          <button className="primary-button" onClick={onSaveCurrentClient}>
            <Users size={17} />
            บันทึกลูกค้าปัจจุบัน
          </button>
          <button className="secondary-button" onClick={() => onOpenPage("documents")}>
            <FileText size={17} />
            กลับไปเอกสาร
          </button>
        </div>
        <div className="linked-list">
          {clients.map((client) => (
            <article className="linked-card" data-testid="client-record-card" key={client.id}>
              <div className="linked-card-header">
                <div className="linked-card-main">
                  <span>ข้อมูลลูกค้า</span>
                  <strong>{client.name}</strong>
                  <small>{client.phone || "ยังไม่มีเบอร์"} · {client.address || "ยังไม่มีที่อยู่"}</small>
                  {client.taxId && <small>เลขผู้เสียภาษี: {client.taxId}</small>}
                </div>
                <div className="linked-card-actions">
                  <button
                    className="secondary-button"
                    onClick={() => onApplyClient(client)}
                    type="button"
                  >
                    <FileText size={16} />
                    ใช้ข้อมูล
                  </button>
                  <button
                    className="icon-button"
                    onClick={() => startEditingClient(client)}
                    title="แก้ไขลูกค้า"
                    type="button"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    className="icon-button danger"
                    onClick={() => {
                      setEditingClientId(null);
                      setConfirmingClientDeleteId(client.id);
                    }}
                    title="ลบลูกค้า"
                    type="button"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              {confirmingClientDeleteId === client.id && (
                <div className="delete-confirm-row">
                  <span>ยืนยันลบลูกค้านี้ออกจากฐานข้อมูล?</span>
                  <button
                    className="secondary-button"
                    onClick={() => setConfirmingClientDeleteId(null)}
                    type="button"
                  >
                    ยกเลิก
                  </button>
                  <button
                    className="primary-button"
                    onClick={() => {
                      onDeleteClient(client.id);
                      setConfirmingClientDeleteId(null);
                    }}
                    type="button"
                  >
                    ยืนยันลบ
                  </button>
                </div>
              )}
              {editingClientId === client.id && (
                <div className="master-edit-form">
                  <label>
                    ชื่อลูกค้า
                    <input
                      value={clientDraft.name}
                      onChange={(event) =>
                        setClientDraft((current) => ({ ...current, name: event.target.value }))
                      }
                    />
                  </label>
                  <label>
                    เบอร์โทร
                    <input
                      value={clientDraft.phone}
                      onChange={(event) =>
                        setClientDraft((current) => ({ ...current, phone: event.target.value }))
                      }
                    />
                  </label>
                  <label>
                    เลขผู้เสียภาษี
                    <input
                      value={clientDraft.taxId}
                      onChange={(event) =>
                        setClientDraft((current) => ({ ...current, taxId: event.target.value }))
                      }
                    />
                  </label>
                  <label className="full">
                    ที่อยู่
                    <input
                      value={clientDraft.address}
                      onChange={(event) =>
                        setClientDraft((current) => ({ ...current, address: event.target.value }))
                      }
                    />
                  </label>
                  <div className="master-edit-actions">
                    <button
                      className="secondary-button"
                      onClick={() => setEditingClientId(null)}
                      type="button"
                    >
                      <X size={16} />
                      ยกเลิก
                    </button>
                    <button className="primary-button" onClick={saveClientDraft} type="button">
                      <Check size={16} />
                      บันทึก
                    </button>
                  </div>
                </div>
              )}
            </article>
          ))}
          {clients.length === 0 && (
            <div className="empty-state">ยังไม่มีลูกค้า กดบันทึกลูกค้าปัจจุบันเพื่อเริ่มฐานข้อมูล</div>
          )}
        </div>
      </section>
    );
  }

  if (activePage === "projects") {
    return (
      <section className="linked-page">
        <PageHeader title="โครงการ" detail="ฐานข้อมูลโครงการ สำหรับเติมชื่อลูกค้า template และเงื่อนไขกลับไปที่เอกสาร" />
        <div className="settings-actions">
          <button className="primary-button" onClick={onSaveCurrentProject}>
            <FolderPlus size={17} />
            บันทึกโครงการปัจจุบัน
          </button>
          <button className="secondary-button" onClick={() => onOpenPage("documents")}>
            <FileText size={17} />
            กลับไปเอกสาร
          </button>
        </div>
        <button className="secondary-button" onClick={onOpenDefect}>
          <Bug size={17} />
          เปิด Defect
        </button>
        <div className="linked-list">
          {projects.map((project) => (
            <article className="linked-card" data-testid="project-record-card" key={project.id}>
              <div className="linked-card-header">
                <div className="linked-card-main">
                  <span>{project.clientName || "ยังไม่ผูกลูกค้า"}</span>
                  <strong>{project.name}</strong>
                  <small>{project.templateName || "ยังไม่มี template"} · {project.paymentTerms || "ยังไม่มีเงื่อนไข"}</small>
                </div>
                <div className="linked-card-actions">
                  <button
                    className="secondary-button"
                    onClick={() => onApplyProject(project)}
                    type="button"
                  >
                    <FileText size={16} />
                    ใช้ข้อมูล
                  </button>
                  <button
                    className="icon-button"
                    onClick={() => startEditingProject(project)}
                    title="แก้ไขโครงการ"
                    type="button"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    className="icon-button danger"
                    onClick={() => {
                      setEditingProjectId(null);
                      setConfirmingProjectDeleteId(project.id);
                    }}
                    title="ลบโครงการ"
                    type="button"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              {confirmingProjectDeleteId === project.id && (
                <div className="delete-confirm-row">
                  <span>ยืนยันลบโครงการนี้ออกจากฐานข้อมูล?</span>
                  <button
                    className="secondary-button"
                    onClick={() => setConfirmingProjectDeleteId(null)}
                    type="button"
                  >
                    ยกเลิก
                  </button>
                  <button
                    className="primary-button"
                    onClick={() => {
                      onDeleteProject(project.id);
                      setConfirmingProjectDeleteId(null);
                    }}
                    type="button"
                  >
                    ยืนยันลบ
                  </button>
                </div>
              )}
              {editingProjectId === project.id && (
                <div className="master-edit-form">
                  <label>
                    ชื่อโครงการ
                    <input
                      value={projectDraft.name}
                      onChange={(event) =>
                        setProjectDraft((current) => ({ ...current, name: event.target.value }))
                      }
                    />
                  </label>
                  <label>
                    ผูกลูกค้า
                    <select
                      value={projectDraft.clientId}
                      onChange={(event) => {
                        const client = clients.find((item) => item.id === event.target.value);
                        setProjectDraft((current) => ({
                          ...current,
                          clientId: event.target.value,
                          clientName: client?.name ?? current.clientName
                        }));
                      }}
                    >
                      <option value="">ไม่ผูกลูกค้า</option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    ชื่อลูกค้า
                    <input
                      value={projectDraft.clientName}
                      onChange={(event) =>
                        setProjectDraft((current) => ({
                          ...current,
                          clientId: "",
                          clientName: event.target.value
                        }))
                      }
                    />
                  </label>
                  <label>
                    Template
                    <input
                      value={projectDraft.templateName}
                      onChange={(event) =>
                        setProjectDraft((current) => ({
                          ...current,
                          templateName: event.target.value
                        }))
                      }
                    />
                  </label>
                  <label>
                    เงื่อนไขชำระเงิน
                    <input
                      value={projectDraft.paymentTerms}
                      onChange={(event) =>
                        setProjectDraft((current) => ({
                          ...current,
                          paymentTerms: event.target.value
                        }))
                      }
                    />
                  </label>
                  <label className="full">
                    หมายเหตุ
                    <input
                      value={projectDraft.notes}
                      onChange={(event) =>
                        setProjectDraft((current) => ({ ...current, notes: event.target.value }))
                      }
                    />
                  </label>
                  <div className="master-edit-actions">
                    <button
                      className="secondary-button"
                      onClick={() => setEditingProjectId(null)}
                      type="button"
                    >
                      <X size={16} />
                      ยกเลิก
                    </button>
                    <button className="primary-button" onClick={saveProjectDraft} type="button">
                      <Check size={16} />
                      บันทึก
                    </button>
                  </div>
                </div>
              )}
            </article>
          ))}
          {projects.length === 0 && (
            <div className="empty-state">ยังไม่มีโครงการ กดบันทึกโครงการปัจจุบันเพื่อเริ่มฐานข้อมูล</div>
          )}
        </div>
      </section>
    );
  }

  if (activePage === "costs") {
    return (
      <section className="linked-page">
        <PageHeader title="ต้นทุนและยอดเอกสาร" detail="สรุปยอดจากรายการงาน ภาษี และงวดวางบิลของเอกสารปัจจุบัน" />
        <div className="summary-grid">
          <SummaryTile label="รวมก่อนภาษี" value={money.format(subtotal)} />
          <SummaryTile label="VAT" value={money.format(vat)} />
          <SummaryTile label="หัก ณ ที่จ่าย" value={`- ${money.format(withholding)}`} />
          <SummaryTile label="ยอดสุทธิ" value={money.format(grandTotal)} strong />
        </div>
        <BillingSchedulePanel
          milestones={milestones}
          selectedMilestoneId={selectedBillingMilestoneId}
          billingDocuments={billingDocuments}
          receiptDocuments={receiptDocuments}
          grandTotal={grandTotal}
          onSelect={onSelectBilling}
          onCreateInvoice={onCreateInvoice}
          onOpenContract={() => onOpenPage("contracts")}
        />
      </section>
    );
  }

  return (
    <section className="linked-page">
      <PageHeader title="ตั้งค่า" detail="ข้อมูลหลักของผู้รับเหมาและไฟล์สำรองข้อมูล" />
      <div className="summary-grid">
        <SummaryTile label="ชื่อผู้รับเหมา" value={currentData.documentInfo.companyName} />
        <SummaryTile label="โทรศัพท์" value={currentData.documentInfo.companyPhone} />
        <SummaryTile label="ลูกค้า/โครงการ" value={`${clients.length} / ${projects.length}`} />
        <SummaryTile label="จำนวนเอกสาร" value={`${documents.length} เอกสาร`} strong />
      </div>
      <div className="settings-actions">
        <button className="secondary-button" onClick={onImportBackup}>
          <Upload size={17} />
          นำเข้า backup
        </button>
        <button className="primary-button" onClick={onExportBackup}>
          <FileText size={17} />
          ดาวน์โหลด backup
        </button>
      </div>
    </section>
  );
}

type DocumentWorkflowCardsProps = {
  activeType: DocumentType;
  language: WorkspaceLanguage;
  quoteDocument?: StoredDocument;
  purchaseOrderDocument?: StoredDocument;
  onOpenQuote: () => void;
  onOpenPurchaseOrder: () => void;
};

function DocumentWorkflowCards({
  activeType,
  language,
  quoteDocument,
  purchaseOrderDocument,
  onOpenQuote,
  onOpenPurchaseOrder
}: DocumentWorkflowCardsProps) {
  const copy = getWorkspaceLanguageCopy(buildDocsCopy, language);
  const cards = [
    {
      type: "quote" as const,
      title: copy.documentTypeLabels.quote,
      detail: copy.workflowQuoteDetail,
      meta: quoteDocument
        ? `${quoteDocument.documentInfo.documentNo} · ${money.format(quoteDocument.total)}`
        : copy.workflowQuoteEmpty,
      actionLabel:
        activeType === "quote" ? copy.workflowCurrent : quoteDocument ? copy.workflowOpenQuote : copy.workflowCreateQuote,
      icon: ClipboardList,
      onSelect: onOpenQuote
    },
    {
      type: "purchaseOrder" as const,
      title: copy.documentTypeLabels.purchaseOrder,
      detail: copy.workflowPurchaseDetail,
      meta: purchaseOrderDocument
        ? `${purchaseOrderDocument.documentInfo.documentNo} · ${money.format(purchaseOrderDocument.total)}`
        : quoteDocument
          ? formatBuildDocsTemplate(copy.workflowPurchaseReadyFrom, {
              documentNo: quoteDocument.documentInfo.documentNo
            })
          : copy.workflowPurchaseEmpty,
      actionLabel:
        activeType === "purchaseOrder"
          ? copy.workflowCurrent
          : purchaseOrderDocument
            ? copy.workflowOpenPurchaseOrder
            : copy.workflowCreatePurchaseOrder,
      icon: FileCheck2,
      onSelect: onOpenPurchaseOrder
    }
  ];

  return (
    <section className="doc-workflow-grid" aria-label={copy.workflowAria}>
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <button
            className={activeType === card.type ? "doc-workflow-card active" : "doc-workflow-card"}
            data-testid={`doc-workflow-${card.type}`}
            key={card.type}
            onClick={card.onSelect}
            type="button"
          >
            <span className="doc-workflow-icon">
              <Icon size={18} />
            </span>
            <span className="doc-workflow-copy">
              <strong>{card.title}</strong>
              <small>{card.detail}</small>
              <em>{card.meta}</em>
            </span>
            <span className="doc-workflow-action">{card.actionLabel}</span>
          </button>
        );
      })}
    </section>
  );
}

type DocumentLibraryProps = {
  documents: StoredDocument[];
  activeDocumentId: string;
  language: WorkspaceLanguage;
  onCreate: () => void;
  onSelect: (id: string) => void;
};

function DocumentLibrary({
  documents,
  activeDocumentId,
  language,
  onCreate,
  onSelect
}: DocumentLibraryProps) {
  const copy = getWorkspaceLanguageCopy(workspaceShellCopy, language);
  const dateLocale = getWorkspaceLanguageLocale(language);
  const documentTypeLabels: Record<DocumentType, string> = {
    quote: copy.quoteDocument,
    purchaseOrder: copy.purchaseOrderDocument,
    invoice: copy.invoiceDocument,
    receipt: copy.receiptDocument,
    contract: copy.contractDocument
  };

  return (
    <section className="document-library" aria-label={copy.savedDocuments}>
      <div className="library-header">
        <span>{copy.savedDocuments}</span>
        <button className="mini-icon" title={copy.createDocument} onClick={onCreate}>
          <Plus size={15} />
        </button>
      </div>

      <div className="library-list">
        {documents.slice(0, 8).map((document) => {
          const isBillingDocument = document.relationship.kind === "billing";
          const isReceiptDocument = document.relationship.kind === "receipt";
          const isPurchaseDocument = document.relationship.kind === "purchase";
          const documentTypeLabel = isReceiptDocument
            ? copy.billingReceiptDocument
            : isBillingDocument
              ? copy.billingDocument
              : isPurchaseDocument
                ? copy.purchaseDocument
                : documentTypeLabels[document.docType];
          return (
            <button
              className={
                document.id === activeDocumentId ? "library-item active" : "library-item"
              }
              key={document.id}
              onClick={() => onSelect(document.id)}
            >
              <span>
                {documentTypeLabel} · {document.documentInfo.documentNo}
              </span>
              <strong>{document.title}</strong>
              <small>
                {document.relationship.kind !== "standard"
                  ? `${copy.documentReference} ${document.relationship.sourceDocumentNo} · `
                  : ""}
                {money.format(document.total)} ·{" "}
                {new Date(document.updatedAt).toLocaleDateString(dateLocale, {
                  day: "2-digit",
                  month: "short"
                })}
              </small>
            </button>
          );
        })}
      </div>
    </section>
  );
}

type ContractTemplatePanelProps = {
  selectedContract: ContractTemplate;
  onSelect: (id: string) => void;
};

function ContractTemplatePanel({ selectedContract, onSelect }: ContractTemplatePanelProps) {
  return (
    <section className="contract-panel" aria-label="แบบสัญญารับเหมา">
      <div className="section-title-row contract-title-row">
        <div>
          <h3>แบบสัญญารับเหมา</h3>
          <span>เลือก template ตามลักษณะงาน แล้วแนบรายการงาน/งวดชำระจากเอกสารนี้ได้</span>
        </div>
      </div>

      <div className="contract-template-list">
        {contractTemplates.map((template) => (
          <button
            className={
              template.id === selectedContract.id
                ? "contract-template active"
                : "contract-template"
            }
            key={template.id}
            onClick={() => onSelect(template.id)}
          >
            <strong>{template.name}</strong>
            <span>{template.subtitle}</span>
          </button>
        ))}
      </div>

      <div className="contract-detail-grid">
        <div>
          <span>ใช้กับงาน</span>
          <strong>{selectedContract.useCase}</strong>
        </div>
        <div>
          <span>ระยะเวลา</span>
          <strong>{selectedContract.duration}</strong>
        </div>
        <div>
          <span>ประกันผลงาน</span>
          <strong>{selectedContract.warranty}</strong>
        </div>
        <div>
          <span>เงินประกัน</span>
          <strong>{selectedContract.retention}</strong>
        </div>
      </div>
    </section>
  );
}

type SheetImportPanelProps = {
  sheetUrl: string;
  importStatus: string;
  isImporting: boolean;
  isOpen: boolean;
  onSheetUrlChange: (value: string) => void;
  onImportGoogleSheet: () => void;
  onImportSampleSheet: () => void;
  onToggle: () => void;
};

function SheetImportPanel({
  sheetUrl,
  importStatus,
  isImporting,
  isOpen,
  onSheetUrlChange,
  onImportGoogleSheet,
  onImportSampleSheet,
  onToggle
}: SheetImportPanelProps) {
  return (
    <section className="sheet-import-panel" aria-label="นำเข้าข้อมูลจาก Google Sheet">
      <div className="sheet-import-compact-row">
        <button className="sheet-import-toggle" onClick={onToggle} type="button">
          <Sheet size={18} />
          Google Sheet
        </button>
        <span className="sheet-import-status compact">{importStatus}</span>
      </div>

      {isOpen && (
        <div className="sheet-import-controls">
          <input
            value={sheetUrl}
            onChange={(event) => onSheetUrlChange(event.target.value)}
            placeholder="วาง Google Sheet URL หรือ CSV export URL"
          />
          <button className="secondary-button small-action" onClick={onImportSampleSheet}>
            ใช้ตัวอย่าง
          </button>
          <button
            className="primary-button small-action"
            onClick={onImportGoogleSheet}
            disabled={isImporting}
          >
            {isImporting ? "กำลังดึง..." : "ดึงข้อมูล"}
          </button>
        </div>
      )}

      {isOpen && (
        <p className="sheet-import-help">
          ใช้ Sheet ที่ publish/share เป็น CSV แล้วมีคอลัมน์ รายการ, หน่วย, จำนวน, ราคา/หน่วย
        </p>
      )}
    </section>
  );
}

type PreviewProps = {
  documentInfo: DocumentInfo;
  docType: DocumentType;
  language: WorkspaceLanguage;
  subtotal: number;
  vat: number;
  withholding: number;
  grandTotal: number;
  fullGrandTotal: number;
  paidAmount: number;
  items: LineItem[];
  milestones: Milestone[];
  selectedBillingMilestone?: Milestone;
  selectedContract: ContractTemplate;
  relationship: AppData["relationship"];
  authorityStamp: DocumentAuthorityStamp;
};

type DocumentAuthorityPanelProps = {
  accessByAction: Record<DocumentAuthorityAction, ProjectAccessDecision>;
  authority: DocumentAuthorityRecord;
  stamp: DocumentAuthorityStamp;
  onAction: (action: DocumentAuthorityAction) => void;
};

function DocumentAuthorityPanel({ accessByAction, authority, stamp, onAction }: DocumentAuthorityPanelProps) {
  const blockedAction = documentAuthorityActions.find((action) => !accessByAction[action]?.allowed);
  const blockedDecision = blockedAction ? accessByAction[blockedAction] : null;

  return (
    <section className="document-authority-panel" data-testid="document-authority-panel">
      <div className="document-authority-head">
        <div>
          <span>Document Authority</span>
          <strong>{documentAuthorityStatusLabels[authority.status]}</strong>
          <small>
            {authority.documentNo || "-"} · {authority.documentType || "document"}
          </small>
        </div>
        <span className={`authority-status authority-status-${authority.status}`}>
          {documentAuthorityStatusLabels[authority.status]}
        </span>
      </div>

      <DocumentAuthorityStampGrid stamp={stamp} />

      <div className="authority-actions" aria-label="Document authority actions">
        {documentAuthorityActions.map((action) => {
          const access = accessByAction[action];
          const workflowDisabled = !canApplyDocumentAuthorityAction(authority.status, action);
          const accessDisabled = access ? !access.allowed : false;
          const disabled = workflowDisabled || accessDisabled;
          const title = accessDisabled
            ? `Project Access: ${getProjectAccessDecisionText(access)}`
            : workflowDisabled
              ? `Action is not available from ${authority.status}`
              : undefined;
          return (
            <button
              className={action === "approve" || action === "issue" ? "primary-button" : "secondary-button"}
              disabled={disabled}
              key={action}
              onClick={() => onAction(action)}
              title={title}
              type="button"
            >
              {action === "approve" && <Check size={16} />}
              {action === "issue" && <Send size={16} />}
              {action === "void" && <X size={16} />}
              {action !== "approve" && action !== "issue" && action !== "void" && <Stamp size={16} />}
              {documentAuthorityActionLabels[action]}
            </button>
          );
        })}
      </div>
      {blockedDecision && (
        <small className="authority-access-note">
          Project Access: {getProjectAccessDecisionText(blockedDecision)}
        </small>
      )}
    </section>
  );
}

function DocumentAuthorityStampGrid({ stamp }: { stamp: DocumentAuthorityStamp }) {
  const cells = [
    { label: "ผู้จัดทำ", value: stamp.preparedBy },
    { label: "ผู้ส่งตรวจ", value: stamp.submittedBy },
    { label: "ผู้ตรวจ", value: stamp.checkedBy },
    { label: "ผู้อนุมัติ", value: stamp.approvedBy },
    { label: "ผู้ออกเอกสาร", value: stamp.issuedBy }
  ];

  return (
    <div className="authority-stamp-grid">
      {cells.map((cell) => (
        <div key={cell.label}>
          <span>{cell.label}</span>
          <strong>{cell.value}</strong>
        </div>
      ))}
    </div>
  );
}

function DocumentPreview({
  documentInfo,
  docType,
  language,
  subtotal,
  vat,
  withholding,
  grandTotal,
  fullGrandTotal,
  paidAmount,
  items,
  milestones,
  selectedBillingMilestone,
  selectedContract,
  relationship,
  authorityStamp
}: PreviewProps) {
  if (docType === "contract") {
    return (
      <ContractPreview
        selectedContract={selectedContract}
        documentInfo={documentInfo}
        grandTotal={fullGrandTotal}
        items={items}
        milestones={milestones}
        authorityStamp={authorityStamp}
      />
    );
  }

  const isMilestoneScopedPreview =
    (docType === "invoice" || relationship.kind === "receipt") && selectedBillingMilestone;
  const billingItems =
    isMilestoneScopedPreview && selectedBillingMilestone
      ? [
          {
            id: selectedBillingMilestone.id,
            name:
              docType === "receipt"
                ? `รับชำระงวด: ${selectedBillingMilestone.name}`
                : `วางบิลงวด: ${selectedBillingMilestone.name}`,
            unit: "%",
            qty: selectedBillingMilestone.percent,
            price: selectedBillingMilestone.percent ? subtotal / selectedBillingMilestone.percent : 0
          }
        ]
      : items;
  const counterpartyLabel = docType === "purchaseOrder" ? "คู่ค้า/ผู้ขาย" : "ลูกค้า";
  const projectLabel = docType === "purchaseOrder" ? "อ้างอิงโครงการ" : "โครงการ";
  const termsLabel =
    docType === "purchaseOrder" ? "เงื่อนไขการสั่งซื้อ" : "เงื่อนไขการชำระ";
  const signerLabel =
    docType === "purchaseOrder" ? "ผู้สั่งซื้อ" : "ผู้เสนอราคา / ผู้รับเงิน";
  const approverLabel =
    docType === "purchaseOrder" ? "ผู้รับคำสั่งซื้อ" : "ผู้อนุมัติ / ผู้จ่ายเงิน";

  return (
    <div className="paper">
      <div className="paper-header">
        <div>
          <div className="company-logo">BD</div>
          <strong>{documentInfo.companyName}</strong>
          <span>{documentInfo.companyAddress}</span>
          <span>โทร. {documentInfo.companyPhone}</span>
          <span>เลขผู้เสียภาษี {documentInfo.companyTaxId}</span>
        </div>
        <div className="document-title">
          <h2>{getBuildDocsInvoiceTitle(docType, selectedBillingMilestone, language)}</h2>
          <span>เลขที่ {documentInfo.documentNo}</span>
          <span>วันที่ {documentInfo.issueDate}</span>
        </div>
      </div>

      <div className="paper-meta">
        <div>
          <span>{counterpartyLabel}</span>
          <strong>{documentInfo.clientName}</strong>
          <small>{documentInfo.clientAddress}</small>
        </div>
        <div>
          <span>{projectLabel}</span>
          <strong>{documentInfo.projectName}</strong>
          <small>เครดิต {documentInfo.creditTerms}</small>
        </div>
        {docType === "invoice" && selectedBillingMilestone && (
          <div>
            <span>งวดที่วางบิล</span>
            <strong>{selectedBillingMilestone.name}</strong>
            <small>
              {selectedBillingMilestone.percent}% · {getStatusLabel(selectedBillingMilestone.status)}
            </small>
            {relationship.kind === "billing" && (
              <small>อ้างอิง {relationship.sourceDocumentNo}</small>
            )}
          </div>
        )}
        {docType === "receipt" && relationship.kind === "receipt" && selectedBillingMilestone && (
          <div>
            <span>อ้างอิงใบวางบิล</span>
            <strong>{relationship.sourceDocumentNo}</strong>
            <small>
              {selectedBillingMilestone.name} · {selectedBillingMilestone.percent}%
            </small>
          </div>
        )}
        {docType === "purchaseOrder" && relationship.kind === "purchase" && (
          <div>
            <span>อ้างอิงใบเสนอราคา</span>
            <strong>{relationship.sourceDocumentNo}</strong>
            <small>{relationship.sourceDocumentTitle}</small>
          </div>
        )}
      </div>

      <DocumentAuthorityStampGrid stamp={authorityStamp} />

      <table>
        <thead>
          <tr>
            <th>รายการ</th>
            <th>จำนวน</th>
            <th>ราคา</th>
            <th>รวม</th>
          </tr>
        </thead>
        <tbody>
          {billingItems.map((item) => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td>
                {item.qty} {item.unit}
              </td>
              <td>{money.format(item.price)}</td>
              <td>{money.format(item.qty * item.price)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="paper-bottom">
        <div className="terms-box">
          <strong>{termsLabel}</strong>
          <span>{documentInfo.notes}</span>
          {docType === "purchaseOrder" ? (
            <>
              <span>{documentInfo.paymentTerms}</span>
              {relationship.kind === "purchase" && (
                <span>อ้างอิงใบเสนอราคาเลขที่ {relationship.sourceDocumentNo}</span>
              )}
            </>
          ) : docType === "invoice" && selectedBillingMilestone ? (
            <span>
              เรียกเก็บ {selectedBillingMilestone.name} {selectedBillingMilestone.percent}% -{" "}
              {selectedBillingMilestone.due}
            </span>
          ) : docType === "receipt" && relationship.kind === "receipt" && selectedBillingMilestone ? (
            <span>
              รับชำระจากใบวางบิลเลขที่ {relationship.sourceDocumentNo} /{" "}
              {selectedBillingMilestone.name} {selectedBillingMilestone.percent}%
            </span>
          ) : (
            milestones.map((milestone) => (
              <span key={milestone.id}>
                {milestone.name} {milestone.percent}% - {milestone.due}
              </span>
            ))
          )}
        </div>
        <div className="total-box">
          <div>
            <span>รวมก่อนภาษี</span>
            <strong>{money.format(subtotal)}</strong>
          </div>
          <div>
            <span>VAT</span>
            <strong>{money.format(vat)}</strong>
          </div>
          <div>
            <span>หัก ณ ที่จ่าย</span>
            <strong>- {money.format(withholding)}</strong>
          </div>
          <div className="grand">
            <span>ยอดสุทธิ</span>
            <strong>{money.format(grandTotal)}</strong>
          </div>
          {docType === "receipt" && (
            <div className="paid">
              <Check size={16} />
              รับเงินแล้ว {money.format(paidAmount)}
            </div>
          )}
        </div>
      </div>

      <div className="signature-row">
        <div>
          <span>{signerLabel}</span>
          <strong>{documentInfo.signerName || documentInfo.companyName}</strong>
          <small>{documentInfo.companyName}</small>
        </div>
        <div>
          <span>{approverLabel}</span>
          <strong>{authorityStamp.approvedBy === "-" ? "................................" : authorityStamp.approvedBy}</strong>
          <small>{authorityStamp.status === "issued" ? "Issued" : documentAuthorityStatusLabels[authorityStamp.status]}</small>
        </div>
      </div>
    </div>
  );
}

type ContractPreviewProps = {
  selectedContract: ContractTemplate;
  documentInfo: DocumentInfo;
  grandTotal: number;
  items: LineItem[];
  milestones: Milestone[];
  authorityStamp: DocumentAuthorityStamp;
};

function ContractPreview({
  selectedContract,
  documentInfo,
  grandTotal,
  items,
  milestones,
  authorityStamp
}: ContractPreviewProps) {
  return (
    <div className="paper contract-paper">
      <div className="paper-header">
        <div>
          <div className="company-logo">BD</div>
          <strong>{documentInfo.companyName}</strong>
          <span>{documentInfo.companyAddress}</span>
          <span>โทร. {documentInfo.companyPhone}</span>
          <span>เลขผู้เสียภาษี {documentInfo.companyTaxId}</span>
        </div>
        <div className="document-title">
          <h2>สัญญารับเหมาก่อสร้าง</h2>
          <span>เลขที่ {documentInfo.contractNo}</span>
          <span>{selectedContract.name}</span>
        </div>
      </div>

      <div className="contract-intro">
        <strong>คู่สัญญา</strong>
        <p>
          สัญญาฉบับนี้ทำขึ้นระหว่าง {documentInfo.clientName} ในฐานะผู้ว่าจ้าง
          และ {documentInfo.companyName} ในฐานะผู้รับจ้าง สำหรับโครงการ
          {documentInfo.projectName} ตามแบบ รายการงาน และเอกสารแนบท้ายสัญญา
        </p>
      </div>

      <div className="contract-terms">
        <div>
          <span>มูลค่างาน</span>
          <strong>{money.format(grandTotal)}</strong>
        </div>
        <div>
          <span>ระยะเวลา</span>
          <strong>{selectedContract.duration}</strong>
        </div>
        <div>
          <span>ประกันผลงาน</span>
          <strong>{selectedContract.warranty}</strong>
        </div>
      </div>

      <section className="contract-section">
        <h3>1. ขอบเขตงาน</h3>
        <ol>
          {items.slice(0, 4).map((item) => (
            <li key={item.id}>
              {item.name} จำนวน {item.qty} {item.unit}
            </li>
          ))}
        </ol>
      </section>

      <section className="contract-section">
        <h3>2. งวดชำระเงิน</h3>
        <ol>
          {milestones.map((milestone) => (
            <li key={milestone.id}>
              {milestone.name} {milestone.percent}% - {milestone.due}
            </li>
          ))}
        </ol>
      </section>

      <section className="contract-section">
        <h3>3. เงื่อนไขหลัก</h3>
        <ol>
          {selectedContract.clauses.map((clause) => (
            <li key={clause}>{clause}</li>
          ))}
          <li>{selectedContract.retention}</li>
        </ol>
      </section>

      <DocumentAuthorityStampGrid stamp={authorityStamp} />

      <div className="contract-warning">
        แบบร่างนี้ใช้สำหรับเตรียมเอกสารและต้องตรวจรายละเอียดจริงก่อนลงนาม
      </div>

      <div className="signature-row contract-signature">
        <div>
          <span>ผู้ว่าจ้าง</span>
          <strong>................................</strong>
        </div>
        <div>
          <span>ผู้รับจ้าง</span>
          <strong>{documentInfo.signerName || documentInfo.companyName}</strong>
          <small>{documentInfo.companyName}</small>
        </div>
      </div>
    </div>
  );
}

export default App;
