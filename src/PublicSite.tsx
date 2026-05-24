import { useEffect, useMemo, useState, type ReactNode } from "react";
import PublicStylePreview from "./PublicStylePreview";
import MockupGallery from "./MockupGallery";
import { RoadmapPage } from "./public/RoadmapPage";
import {
  workspaceApps,
  workspaceAppCategoryCopy,
  workspaceAppMonetizationCopy,
  workspaceAppPrivacyCopy,
  workspaceAppAiUsageCopy,
  type WorkspaceAppCategory,
  type WorkspaceAppId,
  type WorkspaceAppMonetization,
  type WorkspaceAppStatus
} from "./apps";
import {
  activateSubscription,
  evaluateAppAccess,
  loadPlansState,
  loadSubscriptionState,
  summarizeMembership,
  type Plan,
  type PlansState,
  type SubscriptionState
} from "./membership";
import {
  ensureWorkspace,
  getMyWorkspaces,
  onAuthChange,
  signInAnonymously,
  signInWithEmail,
  signOut,
  type AuthUser,
  type WorkspaceSummary
} from "./auth";
import { isSupabaseConfigured } from "./supabaseClient";
import {
  loadStylePreviewLanguage,
  saveStylePreviewLanguage,
  type StylePreviewLanguage
} from "./stylePreviewI18n";

export const PUBLIC_ROUTES = [
  "/",
  "/apps",
  "/tools",
  "/prompts",
  "/workflows",
  "/roadmap",
  "/pricing",
  "/developer",
  "/account",
  "/support-plans",
  "/mockup",
  "/style-preview"
] as const;

export type PublicRoute = (typeof PUBLIC_ROUTES)[number];

export function isPublicRoute(pathname: string): pathname is PublicRoute {
  const trimmed = pathname.replace(/\/+$/, "") || "/";
  return (PUBLIC_ROUTES as readonly string[]).includes(trimmed);
}

function getCurrentRoute(): PublicRoute {
  if (typeof window === "undefined") return "/";
  const raw = window.location.pathname.replace(/\/+$/, "") || "/";
  if (raw === "/style-preview") return "/";
  return (PUBLIC_ROUTES as readonly string[]).includes(raw) ? (raw as PublicRoute) : "/";
}

function navigateTo(path: string) {
  if (typeof window === "undefined") return;
  if (window.location.pathname === path) return;
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

type Lang = StylePreviewLanguage;

type SubpageCopy = {
  navLabel: string;
  navWorkspace: string;
  navSignIn: string;
  navHome: string;
  footerTagline: string;
  footerTools: string;
  footerWorkspace: string;
  footerSign: string;
  appsTitle: string;
  appsKicker: string;
  appsLede: string;
  appsAllFilter: string;
  appsStatusReady: string;
  appsStatusPrototype: string;
  appsStatusNext: string;
  appsStatusPlanned: string;
  appsOpen: string;
  appsFilterStatus: string;
  appsFilterCategory: string;
  appsFilterPlan: string;
  appsCountSuffix: string;
  appsEmptyState: string;
  toolsTitle: string;
  toolsKicker: string;
  toolsLede: string;
  toolsComingSoon: string;
  promptsTitle: string;
  promptsKicker: string;
  promptsLede: string;
  promptsComingSoon: string;
  workflowsTitle: string;
  workflowsKicker: string;
  workflowsLede: string;
  workflowsComingSoon: string;
  pricingTitle: string;
  pricingKicker: string;
  pricingLede: string;
  developerTitle: string;
  developerKicker: string;
  developerLede: string;
  developerStat1Label: string;
  developerStat1Value: string;
  developerStat2Label: string;
  developerStat2Value: string;
  developerStat3Label: string;
  developerStat3Value: string;
  status: Record<WorkspaceAppStatus, string>;
};

const PUBLIC_NAV_ITEMS: Array<{ path: PublicRoute; label: { th: string; en: string } }> = [
  { path: "/apps", label: { th: "แอป", en: "Apps" } },
  { path: "/tools", label: { th: "เครื่องมือ", en: "Tools" } },
  { path: "/prompts", label: { th: "Prompts", en: "Prompts" } },
  { path: "/workflows", label: { th: "Workflows", en: "Workflows" } },
  { path: "/roadmap", label: { th: "Roadmap", en: "Roadmap" } },
  { path: "/pricing", label: { th: "ราคา", en: "Pricing" } },
  { path: "/support-plans", label: { th: "Plans", en: "Plans" } },
  { path: "/developer", label: { th: "ผู้พัฒนา", en: "Developer" } }
];

const copyByLang: Record<Lang, SubpageCopy> = {
  th: {
    navLabel: "เมนูหลัก",
    navWorkspace: "เปิด Workspace",
    navSignIn: "เข้าสู่ระบบ",
    navHome: "หน้าแรก",
    footerTagline: "Tools first · Workspace later · Agent ready",
    footerTools: "เครื่องมือ",
    footerWorkspace: "Workspace",
    footerSign: "© 2026 Buildbybim.space · Bangkok",
    appsTitle: "แอปทั้งหมดในแพลตฟอร์ม",
    appsKicker: "App Marketplace",
    appsLede:
      "แอปแบ่งตามสถานะการพัฒนา ทุกแอปเปิดต่อใน workspace ได้ และข้อมูลเก็บใน localStorage จนกว่าจะมี backend",
    appsAllFilter: "ทั้งหมด",
    appsStatusReady: "Ready",
    appsStatusPrototype: "Prototype",
    appsStatusNext: "Next",
    appsStatusPlanned: "Planned",
    appsOpen: "เปิดในเครื่องมือ",
    appsFilterStatus: "สถานะ",
    appsFilterCategory: "หมวด",
    appsFilterPlan: "แผน",
    appsCountSuffix: "แอป",
    appsEmptyState: "ไม่พบแอปที่ตรงกับเงื่อนไข ลองล้างตัวกรอง",
    toolsTitle: "Tools Apps",
    toolsKicker: "Quick Utility",
    toolsLede:
      "เครื่องมือเล็กที่แก้ปัญหาเฉพาะหน้าได้ทันที — planner, calculator, checklist, generator, tracker, assistant และ converter ตาม APP_TAXONOMY.md",
    toolsComingSoon: "Tools Apps แต่ละหมวดจะเปิดที่นี่ทีละตัวตาม wedge-app roadmap",
    promptsTitle: "Prompt Set Library",
    promptsKicker: "Prompt Assets",
    promptsLede:
      "Prompt set + prompt template + version + favorite + access tier — ใช้ซ้ำในงานออกแบบ ก่อสร้าง content และ AI workflow",
    promptsComingSoon:
      "PROMPT_SET_LIBRARY_PRD.md กำหนด data model ครบ รอ implementation ของ /prompts/:promptSetId และ /prompts/builder",
    workflowsTitle: "Auto Workflow Apps",
    workflowsKicker: "Workflow Catalog",
    workflowsLede:
      "Workflow draft-first กึ่งอัตโนมัติ — Facebook content, file-to-data, document workflow, follow-up, repurpose ที่ AI ช่วย draft แต่มนุษย์ confirm",
    workflowsComingSoon:
      "FACEBOOK_CONTENT_WORKFLOW_PRD.md พร้อม implement; workflow อื่นรอ wedge-app validation ตาม PRD Section 3.4",
    pricingTitle: "แผนการใช้งานและ Support",
    pricingKicker: "Pricing",
    pricingLede:
      "เริ่มฟรี จ่ายเฉพาะส่วนที่ต้องการ admin override ได้ตาม support level ของแต่ละทีม ราคาตามแผนรอ payment provider จริงใน v0.5",
    developerTitle: "สร้างโดยสถาปนิกที่ใช้เครื่องมือนี้ทำงานจริง",
    developerKicker: "Developer · About",
    developerLede:
      "Buildbybim.space พัฒนาโดยสถาปนิกที่ทำเครื่องมือสำหรับก่อสร้าง ออกแบบ และ AI workflow — ทุก tool เกิดจากปัญหาจริงในงาน ไม่ใช่จากการเดาความต้องการ",
    developerStat1Label: "Active apps",
    developerStat1Value: "11",
    developerStat2Label: "Last release",
    developerStat2Value: "v0.4",
    developerStat3Label: "Data source",
    developerStat3Value: "local-first",
    status: {
      ready: "Ready",
      prototype: "Prototype",
      next: "Next",
      planned: "Planned"
    }
  },
  en: {
    navLabel: "Primary menu",
    navWorkspace: "Open workspace",
    navSignIn: "Sign in",
    navHome: "Home",
    footerTagline: "Tools first · Workspace later · Agent ready",
    footerTools: "Tools",
    footerWorkspace: "Workspace",
    footerSign: "© 2026 Buildbybim.space · Bangkok",
    appsTitle: "All apps in the platform",
    appsKicker: "App Marketplace",
    appsLede:
      "Apps grouped by build status. Every app opens in the workspace; data stays in localStorage until a backend lands.",
    appsAllFilter: "All",
    appsStatusReady: "Ready",
    appsStatusPrototype: "Prototype",
    appsStatusNext: "Next",
    appsStatusPlanned: "Planned",
    appsOpen: "Open in workspace",
    appsFilterStatus: "Status",
    appsFilterCategory: "Category",
    appsFilterPlan: "Plan",
    appsCountSuffix: "apps",
    appsEmptyState: "No apps match these filters — try clearing them.",
    toolsTitle: "Tools Apps",
    toolsKicker: "Quick Utility",
    toolsLede:
      "Small focused utilities that solve one task fast — planners, calculators, checklists, generators, trackers, assistants, and converters per APP_TAXONOMY.md",
    toolsComingSoon: "Tools apps will ship here one at a time, following the wedge-app roadmap.",
    promptsTitle: "Prompt Set Library",
    promptsKicker: "Prompt Assets",
    promptsLede:
      "Prompt sets, templates, versions, favorites, and access tiers — reusable across design, construction, content, and AI workflows.",
    promptsComingSoon:
      "PROMPT_SET_LIBRARY_PRD.md defines the full data model. /prompts/:promptSetId and /prompts/builder land next.",
    workflowsTitle: "Auto Workflow Apps",
    workflowsKicker: "Workflow Catalog",
    workflowsLede:
      "Draft-first semi-automatic workflows — Facebook content, file-to-data, document workflow, follow-ups, and repurposing. AI drafts, humans confirm.",
    workflowsComingSoon:
      "FACEBOOK_CONTENT_WORKFLOW_PRD.md is ready to build; other workflows await wedge-app validation per PRD Section 3.4.",
    pricingTitle: "Plans and support",
    pricingKicker: "Pricing",
    pricingLede:
      "Start free, pay only for what you need. Admins can override per-team support levels. Real prices land once a payment provider is picked in v0.5.",
    developerTitle: "Built by an architect who uses these tools every day",
    developerKicker: "Developer · About",
    developerLede:
      "Buildbybim.space is built by an architect making tools for construction, design, and AI workflow — every tool comes from real work pain, not guesses.",
    developerStat1Label: "Active apps",
    developerStat1Value: "11",
    developerStat2Label: "Last release",
    developerStat2Value: "v0.4",
    developerStat3Label: "Data source",
    developerStat3Value: "local-first",
    status: {
      ready: "Ready",
      prototype: "Prototype",
      next: "Next",
      planned: "Planned"
    }
  }
};

const subpageCss = `
.public-page {
  --paper: #FAFAF9;
  --mist: #F2F2F0;
  --bg-2: #EAEAE7;
  --line: #DCDCD9;
  --line-2: #C9C9C5;
  --line-strong: #A8A8A4;
  --ink-5: #8A8A86;
  --ink-4: #6B6B68;
  --ink-3: #4A4A47;
  --ink-2: #2A2A28;
  --ink: #0A0A09;
  --brand: "Prompt", "IBM Plex Sans Thai", "Onest", sans-serif;
  --en: "Onest", system-ui, -apple-system, "Segoe UI", sans-serif;
  --th: "IBM Plex Sans Thai", "Onest", system-ui, sans-serif;
  --mono: "JetBrains Mono", ui-monospace, "SF Mono", monospace;
  --pad-x: clamp(20px, 4vw, 48px);
  --maxw: 1280px;
  background: var(--paper);
  color: var(--ink);
  font-family: var(--th);
  font-size: 15px;
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
}
.public-page * { box-sizing: border-box; }
.public-page .en { font-family: var(--en); }
.public-page .mono { font-family: var(--mono); }
.public-page a { color: inherit; text-decoration: none; }

.public-wrap {
  max-width: var(--maxw);
  margin: 0 auto;
  padding-left: var(--pad-x);
  padding-right: var(--pad-x);
}

.public-nav {
  position: sticky;
  top: 0;
  z-index: 60;
  background: rgba(250, 250, 249, 0.92);
  backdrop-filter: saturate(140%) blur(10px);
  border-bottom: 1px solid var(--line);
}
.public-nav-inner {
  display: flex;
  align-items: center;
  gap: 24px;
  height: 60px;
}
.public-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: var(--brand);
  font-weight: 700;
  font-size: 17px;
  letter-spacing: -0.01em;
  cursor: pointer;
}
.public-brand .mk {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  background: var(--ink);
  position: relative;
  overflow: hidden;
  flex: none;
}
.public-brand .mk::before,
.public-brand .mk::after {
  content: "";
  position: absolute;
  background: #fff;
}
.public-brand .mk::before {
  left: 50%;
  top: 4px;
  bottom: 4px;
  width: 1px;
  transform: translateX(-50%);
}
.public-brand .mk::after {
  top: 50%;
  left: 4px;
  right: 4px;
  height: 1px;
  transform: translateY(-50%);
}
.public-brand small {
  font-family: var(--mono);
  font-size: 10px;
  color: var(--ink-5);
  padding: 2px 6px;
  border: 1px solid var(--line);
  border-radius: 3px;
  font-weight: 500;
}
.public-nav-menu {
  display: flex;
  gap: 2px;
  margin-left: 8px;
  flex-wrap: wrap;
}
.public-nav-menu button {
  appearance: none;
  border: 0;
  background: transparent;
  cursor: pointer;
  font-family: var(--en);
  font-size: 13.5px;
  font-weight: 500;
  color: var(--ink-3);
  padding: 7px 12px;
  border-radius: 5px;
  transition: background 0.15s ease, color 0.15s ease;
}
.public-nav-menu button:hover {
  background: var(--bg-2);
  color: var(--ink);
}
.public-nav-menu button.active {
  background: var(--ink);
  color: #fff;
}
.public-nav-grow { flex: 1; }
.public-nav-cta {
  display: flex;
  gap: 8px;
  align-items: center;
}
.public-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 16px;
  border-radius: 5px;
  font-family: var(--en);
  font-size: 13.5px;
  font-weight: 500;
  transition: all 0.15s;
  border: 1px solid transparent;
  white-space: nowrap;
  cursor: pointer;
  background: transparent;
  color: inherit;
}
.public-btn-ghost { color: var(--ink-2); }
.public-btn-ghost:hover { background: var(--bg-2); }
.public-btn-line {
  border-color: var(--line-strong);
  color: var(--ink);
}
.public-btn-line:hover {
  border-color: var(--ink);
  background: #fff;
}
.public-btn-solid {
  background: var(--ink);
  color: #fff;
}
.public-btn-solid:hover { background: #000; }

.public-lang-toggle {
  display: inline-flex;
  background: var(--bg-2);
  border-radius: 999px;
  padding: 3px;
  gap: 2px;
}
.public-lang-toggle button {
  appearance: none;
  border: 0;
  background: transparent;
  cursor: pointer;
  font-family: var(--mono);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-3);
  padding: 5px 10px;
  border-radius: 999px;
  transition: background 0.15s ease, color 0.15s ease;
}
.public-lang-toggle button.on {
  background: var(--ink);
  color: #fff;
}

.public-section {
  padding: 88px 0;
  border-bottom: 1px solid var(--line);
}
@media (max-width: 720px) {
  .public-section { padding: 56px 0; }
}

.public-section-head {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 40px;
  margin-bottom: 40px;
  align-items: end;
}
@media (max-width: 880px) {
  .public-section-head { grid-template-columns: 1fr; gap: 16px; }
}
.public-kicker {
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: 0.12em;
  color: var(--ink-3);
  text-transform: uppercase;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.public-kicker::before {
  content: "";
  width: 28px;
  height: 1px;
  background: var(--ink-3);
}
.public-section h1 {
  font-family: var(--th);
  font-weight: 600;
  font-size: clamp(32px, 4vw, 52px);
  line-height: 1.08;
  letter-spacing: -0.018em;
  margin: 0;
  color: var(--ink);
  max-width: 760px;
  text-wrap: balance;
}
.public-section-head p {
  font-size: 15px;
  color: var(--ink-3);
  margin: 0;
  line-height: 1.6;
}

.public-filter-stack {
  display: grid;
  gap: 10px;
  margin-bottom: 28px;
}
.public-filter-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}
.public-filter-label {
  font-family: var(--mono);
  font-size: 10.5px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-5);
  min-width: 70px;
}
.public-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 5px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 7px;
}
.public-chip {
  font-family: var(--en);
  font-size: 13px;
  font-weight: 500;
  padding: 7px 14px;
  border-radius: 4px;
  color: var(--ink-3);
  transition: all 0.15s;
  border: 0;
  background: transparent;
  cursor: pointer;
}
.public-chip:hover { background: var(--bg-2); }
.public-chip.active { background: var(--ink); color: #fff; }
.public-chip .count {
  font-family: var(--mono);
  font-size: 10px;
  opacity: 0.6;
  margin-left: 6px;
  letter-spacing: 0.04em;
}

.public-card-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}
@media (max-width: 960px) { .public-card-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 600px) { .public-card-grid { grid-template-columns: 1fr; } }

.public-card {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 22px 22px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: border-color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
}
.public-card:hover {
  border-color: var(--ink);
  transform: translateY(-2px);
  box-shadow: 0 12px 30px -10px rgba(10, 10, 9, 0.12);
}
.public-card-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-family: var(--mono);
  font-size: 10px;
  color: var(--ink-5);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.public-card-meta .status {
  font-weight: 600;
  padding: 2px 7px;
  border: 1px solid var(--line);
  border-radius: 3px;
}
.public-card-meta .status.ready { background: var(--ink); color: #fff; border-color: var(--ink); }
.public-card-meta .status.prototype { color: var(--ink-2); }
.public-card-meta .status.next { color: var(--ink-3); }
.public-card-meta .status.planned { color: var(--ink-4); }

.public-card h3 {
  font-family: var(--en);
  font-size: 18px;
  font-weight: 600;
  letter-spacing: -0.005em;
  margin: 2px 0 0;
  color: var(--ink);
}
.public-card p {
  font-size: 13.5px;
  color: var(--ink-3);
  line-height: 1.55;
  margin: 0;
  flex: 1;
}
.public-card-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 14px;
  border-top: 1px solid var(--line);
  margin-top: 4px;
  font-family: var(--mono);
  font-size: 11px;
  color: var(--ink-3);
  letter-spacing: 0.04em;
}
.public-card-foot a {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--ink);
  font-weight: 600;
}

.public-card-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
}
.public-card-badge {
  font-family: var(--mono);
  font-size: 9.5px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 3px 7px;
  border-radius: 3px;
  border: 1px solid var(--line);
  background: var(--paper);
  color: var(--ink-3);
}
.public-card-badge.tone-category {
  background: var(--ink);
  color: #fff;
  border-color: var(--ink);
}
.public-card-badge.tone-ai {
  background: #E5EDF7;
  color: #2A4F86;
  border-color: #B8CFEC;
}
.public-card-badge.tone-paid {
  background: #FFF1CC;
  color: #92651A;
  border-color: #F4DD9C;
}
.public-card-badge.tone-free {
  background: #E1F0E5;
  color: #2A6D45;
  border-color: #B7D8C0;
}

.public-empty {
  padding: 26px;
  border: 1px dashed var(--line-strong);
  border-radius: 8px;
  background: #fff;
  color: var(--ink-3);
  font-size: 14px;
  line-height: 1.6;
}

.public-pricing-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}
@media (max-width: 880px) { .public-pricing-grid { grid-template-columns: 1fr; } }
.public-price {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 28px 26px;
  display: flex;
  flex-direction: column;
  gap: 0;
}
.public-price.feat {
  background: var(--ink);
  color: #fff;
  border-color: var(--ink);
  box-shadow: 0 24px 60px -16px rgba(10, 10, 9, 0.32);
}
.public-price .tier {
  font-family: var(--mono);
  font-weight: 600;
  font-size: 12px;
  letter-spacing: 0.06em;
  margin-bottom: 6px;
  text-transform: uppercase;
}
.public-price .desc {
  font-size: 13px;
  color: var(--ink-3);
  margin-bottom: 22px;
  min-height: 36px;
}
.public-price.feat .desc { color: #9F9F9C; }
.public-price .val {
  font-family: var(--en);
  font-weight: 700;
  font-size: 42px;
  letter-spacing: -0.025em;
  line-height: 1;
  margin-bottom: 6px;
}
.public-price .val sup {
  font-size: 18px;
  font-weight: 500;
  color: var(--ink-3);
  margin-right: 2px;
  vertical-align: top;
  top: 0.55em;
  position: relative;
}
.public-price .val small {
  font-family: var(--en);
  font-size: 13px;
  font-weight: 500;
  color: var(--ink-3);
  letter-spacing: 0;
  margin-left: 4px;
}
.public-price.feat .val sup,
.public-price.feat .val small { color: #9F9F9C; }
.public-price ul {
  list-style: none;
  padding: 22px 0 0;
  margin: 0;
  border-top: 1px solid var(--line);
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.public-price.feat ul { border-color: rgba(255, 255, 255, 0.12); }
.public-price li {
  font-family: var(--en);
  font-size: 13.5px;
  color: var(--ink-2);
  display: flex;
  align-items: flex-start;
  gap: 10px;
  line-height: 1.5;
}
.public-price.feat li { color: rgba(250, 250, 249, 0.85); }
.public-price li::before {
  content: "";
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--ink);
  flex: none;
  margin-top: 4px;
}
.public-price.feat li::before { background: #fff; }

.public-dev-grid {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: 48px;
  align-items: center;
}
@media (max-width: 880px) { .public-dev-grid { grid-template-columns: 1fr; } }
.public-dev-card {
  background: #0F0F0E;
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  overflow: hidden;
}
.public-dev-stat-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}
.public-dev-stat {
  padding: 18px 20px;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
}
.public-dev-stat:last-child { border-right: 0; }
.public-dev-stat .l {
  font-family: var(--mono);
  font-size: 10px;
  color: #9F9F9C;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  margin-bottom: 6px;
}
.public-dev-stat .v {
  font-family: var(--en);
  font-weight: 600;
  font-size: 22px;
  color: #fff;
}
.public-dev-head {
  padding: 22px;
  font-family: var(--en);
  font-size: 14px;
  color: #FAFAF9;
  display: flex;
  align-items: center;
  gap: 14px;
}
.public-dev-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #fff;
  color: var(--ink);
  display: grid;
  place-items: center;
  font-family: var(--brand);
  font-weight: 700;
  font-size: 18px;
  flex: none;
}

.public-footer {
  background: var(--ink);
  color: #9F9F9C;
  padding: 36px 0 28px;
  font-family: var(--en);
  font-size: 13px;
}
.public-footer-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 18px;
}
.public-footer-brand {
  font-family: var(--brand);
  font-weight: 700;
  color: #fff;
  font-size: 16px;
}
.public-footer-tag {
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.public-footer-links {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
}
.public-footer-links button {
  appearance: none;
  border: 0;
  background: transparent;
  color: #C8C8C5;
  font: inherit;
  cursor: pointer;
}
.public-footer-links button:hover { color: #fff; }
`;

type SubpageProps = {
  route: PublicRoute;
  language: Lang;
  onNavigate: (path: string) => void;
  onLanguageChange: (lang: Lang) => void;
};

function PublicNav({ route, language, onNavigate, onLanguageChange }: SubpageProps) {
  const copy = copyByLang[language];
  return (
    <header className="public-nav" aria-label={copy.navLabel}>
      <div className="public-wrap public-nav-inner">
        <button
          className="public-brand"
          onClick={() => onNavigate("/")}
          type="button"
        >
          <span className="mk" aria-hidden="true"></span>
          <span>
            Build<span style={{ fontWeight: 500 }}>By</span>BIM
          </span>
          <small className="en">.space</small>
        </button>
        <nav className="public-nav-menu">
          {PUBLIC_NAV_ITEMS.map((item) => (
            <button
              key={item.path}
              className={item.path === route ? "active" : ""}
              onClick={() => onNavigate(item.path)}
              type="button"
            >
              {item.label[language]}
            </button>
          ))}
        </nav>
        <div className="public-nav-grow" />
        <div className="public-nav-cta">
          <div className="public-lang-toggle" role="group" aria-label="language">
            <button
              className={language === "th" ? "on" : ""}
              onClick={() => onLanguageChange("th")}
              type="button"
            >
              TH
            </button>
            <button
              className={language === "en" ? "on" : ""}
              onClick={() => onLanguageChange("en")}
              type="button"
            >
              EN
            </button>
          </div>
          <a
            className="public-btn public-btn-ghost en"
            href="/hub"
            onClick={(event) => {
              event.preventDefault();
              window.location.href = "/hub";
            }}
          >
            {copy.navSignIn}
          </a>
          <a
            className="public-btn public-btn-solid"
            href="/hub"
            onClick={(event) => {
              event.preventDefault();
              window.location.href = "/hub";
            }}
          >
            {copy.navWorkspace} →
          </a>
        </div>
      </div>
    </header>
  );
}

function PublicFooter({
  language,
  onNavigate
}: {
  language: Lang;
  onNavigate: (path: string) => void;
}) {
  const copy = copyByLang[language];
  return (
    <footer className="public-footer">
      <div className="public-wrap public-footer-inner">
        <span className="public-footer-brand">Buildbybim.space</span>
        <span className="public-footer-tag">{copy.footerTagline}</span>
        <div className="public-footer-links">
          <button onClick={() => onNavigate("/")} type="button">
            {copy.navHome}
          </button>
          <button onClick={() => onNavigate("/tools")} type="button">
            {copy.footerTools}
          </button>
          <button
            onClick={() => {
              window.location.href = "/hub";
            }}
            type="button"
          >
            {copy.footerWorkspace}
          </button>
        </div>
        <span className="public-footer-tag">{copy.footerSign}</span>
      </div>
    </footer>
  );
}

type StatusFilter = "all" | WorkspaceAppStatus;
type CategoryFilter = "all" | WorkspaceAppCategory;
type PlanFilter = "all" | "free_like" | "paid_like";

function AppsCatalogPage({ language }: { language: Lang }) {
  const copy = copyByLang[language];
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [planFilter, setPlanFilter] = useState<PlanFilter>("all");

  const catalog = useMemo(() => workspaceApps.filter((app) => app.id !== "hub"), []);

  const planMatches = (mon: WorkspaceAppMonetization, filter: PlanFilter) => {
    if (filter === "all") return true;
    const isFreeLike = mon === "free" || mon === "freemium";
    return filter === "free_like" ? isFreeLike : !isFreeLike;
  };

  const filtered = useMemo(
    () =>
      catalog.filter(
        (app) =>
          (statusFilter === "all" || app.status === statusFilter) &&
          (categoryFilter === "all" || app.category === categoryFilter) &&
          planMatches(app.monetization, planFilter)
      ),
    [catalog, statusFilter, categoryFilter, planFilter]
  );

  const statusCounts: Record<WorkspaceAppStatus, number> = {
    ready: 0,
    prototype: 0,
    next: 0,
    planned: 0
  };
  const categoryCounts = new Map<WorkspaceAppCategory, number>();
  for (const app of catalog) {
    statusCounts[app.status] += 1;
    categoryCounts.set(app.category, (categoryCounts.get(app.category) ?? 0) + 1);
  }
  const usedCategories = Array.from(categoryCounts.keys()).sort();

  const planLabel: Record<PlanFilter, string> =
    language === "th"
      ? { all: "ทั้งหมด", free_like: "Free / Freemium", paid_like: "Paid / Member / Plan" }
      : { all: "All", free_like: "Free / Freemium", paid_like: "Paid / Member / Plan" };

  return (
    <section className="public-section">
      <div className="public-wrap">
        <div className="public-section-head">
          <div>
            <div className="public-kicker">{copy.appsKicker}</div>
            <h1>{copy.appsTitle}</h1>
          </div>
          <p>{copy.appsLede}</p>
        </div>

        <div className="public-filter-stack">
          <div className="public-filter-row">
            <span className="public-filter-label">{copy.appsFilterStatus}</span>
            <div className="public-filters" role="tablist">
              <button
                className={statusFilter === "all" ? "public-chip active" : "public-chip"}
                onClick={() => setStatusFilter("all")}
                type="button"
              >
                {copy.appsAllFilter} <span className="count">{catalog.length}</span>
              </button>
              {(["ready", "prototype", "next", "planned"] as WorkspaceAppStatus[]).map((status) => (
                <button
                  key={status}
                  className={statusFilter === status ? "public-chip active" : "public-chip"}
                  onClick={() => setStatusFilter(status)}
                  type="button"
                >
                  {copy.status[status]} <span className="count">{statusCounts[status]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="public-filter-row">
            <span className="public-filter-label">{copy.appsFilterCategory}</span>
            <div className="public-filters">
              <button
                className={categoryFilter === "all" ? "public-chip active" : "public-chip"}
                onClick={() => setCategoryFilter("all")}
                type="button"
              >
                {copy.appsAllFilter}
              </button>
              {usedCategories.map((category) => (
                <button
                  key={category}
                  className={categoryFilter === category ? "public-chip active" : "public-chip"}
                  onClick={() => setCategoryFilter(category)}
                  type="button"
                >
                  {workspaceAppCategoryCopy[category][language]}{" "}
                  <span className="count">{categoryCounts.get(category)}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="public-filter-row">
            <span className="public-filter-label">{copy.appsFilterPlan}</span>
            <div className="public-filters">
              {(["all", "free_like", "paid_like"] as PlanFilter[]).map((plan) => (
                <button
                  key={plan}
                  className={planFilter === plan ? "public-chip active" : "public-chip"}
                  onClick={() => setPlanFilter(plan)}
                  type="button"
                >
                  {planLabel[plan]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="public-empty">{copy.appsEmptyState}</div>
        ) : (
          <div className="public-card-grid">
            {filtered.map((app) => {
              const monLabel = workspaceAppMonetizationCopy[app.monetization][language];
              const isFreeLike = app.monetization === "free" || app.monetization === "freemium";
              const usesAi = app.aiUsage !== "none";
              return (
                <article className="public-card" key={app.id}>
                  <div className="public-card-meta">
                    <span>{app.shortLabel}</span>
                    <span className={`status ${app.status}`}>{copy.status[app.status]}</span>
                  </div>
                  <h3>{app.label}</h3>
                  <p>{app.description}</p>
                  <div className="public-card-badges">
                    <span className="public-card-badge tone-category">
                      {workspaceAppCategoryCopy[app.category][language]}
                    </span>
                    <span
                      className={`public-card-badge ${isFreeLike ? "tone-free" : "tone-paid"}`}
                    >
                      {monLabel}
                    </span>
                    {usesAi && (
                      <span className="public-card-badge tone-ai">
                        {workspaceAppAiUsageCopy[app.aiUsage][language]}
                      </span>
                    )}
                    <span className="public-card-badge">
                      {workspaceAppPrivacyCopy[app.privacyLevel][language]}
                    </span>
                  </div>
                  <div className="public-card-foot">
                    <span>{app.routeBase}</span>
                    <a
                      href={app.routeBase}
                      onClick={(event) => {
                        event.preventDefault();
                        window.location.href = app.routeBase;
                      }}
                    >
                      {copy.appsOpen} →
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function StaticListPage({
  kicker,
  title,
  lede,
  comingSoon,
  items
}: {
  kicker: string;
  title: string;
  lede: string;
  comingSoon: string;
  items: Array<{ tag: string; name: string; desc: string }>;
}) {
  return (
    <section className="public-section">
      <div className="public-wrap">
        <div className="public-section-head">
          <div>
            <div className="public-kicker">{kicker}</div>
            <h1>{title}</h1>
          </div>
          <p>{lede}</p>
        </div>

        <div className="public-card-grid">
          {items.map((item) => (
            <article className="public-card" key={item.name}>
              <div className="public-card-meta">
                <span>{item.tag}</span>
                <span className="status planned">Planned</span>
              </div>
              <h3>{item.name}</h3>
              <p>{item.desc}</p>
            </article>
          ))}
        </div>

        <div className="public-empty" style={{ marginTop: 24 }}>
          {comingSoon}
        </div>
      </div>
    </section>
  );
}

function ToolsPage({ language }: { language: Lang }) {
  const copy = copyByLang[language];
  const items =
    language === "th"
      ? [
          { tag: "planner", name: "Life Planner", desc: "วางแผนชีวิตและเป้าหมายส่วนตัวแบบแยกจากงาน" },
          { tag: "calculator", name: "Quick BOQ Calc", desc: "คำนวณ BOQ เร็วก่อนทำตารางเต็ม" },
          { tag: "checklist", name: "Site Checklist", desc: "ตรวจหน้างานเร็ว ติ๊กและถ่ายรูปจบในที่เดียว" },
          { tag: "generator", name: "Proposal Draft", desc: "สร้าง draft ใบเสนอราคา/proposal จากข้อมูลที่มี" },
          { tag: "tracker", name: "Habit Tracker", desc: "ติดตาม habit ส่วนตัวรายวัน รายสัปดาห์" },
          { tag: "assistant", name: "AI Document Assistant", desc: "ให้ AI ช่วยสรุปไฟล์และจัดข้อมูลให้พร้อม" }
        ]
      : [
          { tag: "planner", name: "Life Planner", desc: "Plan personal life and goals, separate from project work" },
          { tag: "calculator", name: "Quick BOQ Calc", desc: "Estimate BOQ fast before building a full schedule" },
          { tag: "checklist", name: "Site Checklist", desc: "Inspect on site fast — tick, snap, log in one place" },
          { tag: "generator", name: "Proposal Draft", desc: "Draft proposals from what you already have" },
          { tag: "tracker", name: "Habit Tracker", desc: "Track personal habits daily and weekly" },
          { tag: "assistant", name: "AI Document Assistant", desc: "AI summarizes and structures your files" }
        ];
  return (
    <StaticListPage
      kicker={copy.toolsKicker}
      title={copy.toolsTitle}
      lede={copy.toolsLede}
      comingSoon={copy.toolsComingSoon}
      items={items}
    />
  );
}

function PromptsPage({ language }: { language: Lang }) {
  const copy = copyByLang[language];
  const items =
    language === "th"
      ? [
          { tag: "Design", name: "Brief Reviewer", desc: "อ่าน brief ลูกค้า → ระบุ scope/budget/timeline ที่ขาด" },
          { tag: "Construction", name: "Spec Extractor", desc: "แปลงสเปคเป็นตาราง BOQ พร้อมหมายเหตุวัสดุ" },
          { tag: "Content", name: "Post Drafter", desc: "งานในมือ 1 ชิ้น → caption + hook + hashtag + แนวภาพ" },
          { tag: "Agent", name: "LINE Intake Parser", desc: "อ่านข้อความ/รูป/สลิป → draft รายการพร้อม metadata" },
          { tag: "Design", name: "Concept Prompt Builder", desc: "ประกอบ prompt render จาก style + material + light" },
          { tag: "Workflow", name: "Follow-up Composer", desc: "ร่างข้อความติดตามลูกค้าตามสถานะงานล่าสุด" }
        ]
      : [
          { tag: "Design", name: "Brief Reviewer", desc: "Read a client brief → flag missing scope/budget/timeline" },
          { tag: "Construction", name: "Spec Extractor", desc: "Turn specs into a BOQ table with material notes" },
          { tag: "Content", name: "Post Drafter", desc: "One task → caption + hook + hashtags + image angles" },
          { tag: "Agent", name: "LINE Intake Parser", desc: "Read LINE messages/photos → draft records with metadata" },
          { tag: "Design", name: "Concept Prompt Builder", desc: "Compose render prompts from style + material + light" },
          { tag: "Workflow", name: "Follow-up Composer", desc: "Draft client follow-ups based on the latest job status" }
        ];
  return (
    <StaticListPage
      kicker={copy.promptsKicker}
      title={copy.promptsTitle}
      lede={copy.promptsLede}
      comingSoon={copy.promptsComingSoon}
      items={items}
    />
  );
}

function WorkflowsPage({ language }: { language: Lang }) {
  const copy = copyByLang[language];
  const items =
    language === "th"
      ? [
          { tag: "Content", name: "Facebook Content Workflow", desc: "หัวข้อ → draft โพสต์พร้อม hook/caption/CTA/hashtag/image prompt" },
          { tag: "Data", name: "File-to-Data", desc: "อ่านไฟล์ → structured data + draft preview ก่อนบันทึก" },
          { tag: "Document", name: "Document Workflow", desc: "ข้อมูลโครงการ → draft ใบเสนอราคา/สัญญา/report" },
          { tag: "Follow-up", name: "Client Follow-up", desc: "เตรียมข้อความตามสถานะลูกค้าและงานล่าสุด" },
          { tag: "Repurpose", name: "Long → Short", desc: "แปลงโพสต์ยาวเป็น short post/carousel/script" },
          { tag: "Agent", name: "LINE Receipt Intake", desc: "รับสลิป LINE → draft expense + cashflow รอ confirm" }
        ]
      : [
          { tag: "Content", name: "Facebook Content Workflow", desc: "Topic → post draft with hook/caption/CTA/hashtag/image prompt" },
          { tag: "Data", name: "File-to-Data", desc: "Read files → structured data + draft preview before save" },
          { tag: "Document", name: "Document Workflow", desc: "Project data → draft quote/contract/report" },
          { tag: "Follow-up", name: "Client Follow-up", desc: "Compose messages from client status and recent work" },
          { tag: "Repurpose", name: "Long → Short", desc: "Turn long posts into short posts/carousels/scripts" },
          { tag: "Agent", name: "LINE Receipt Intake", desc: "Receive LINE receipts → draft expense + cashflow pending confirm" }
        ];
  return (
    <StaticListPage
      kicker={copy.workflowsKicker}
      title={copy.workflowsTitle}
      lede={copy.workflowsLede}
      comingSoon={copy.workflowsComingSoon}
      items={items}
    />
  );
}

function PricingPage({ language }: { language: Lang }) {
  const copy = copyByLang[language];
  const tiers =
    language === "th"
      ? [
          {
            tier: "Free",
            desc: "เริ่มต้นใช้ tool เล็ก ๆ ฟรี ไม่ต้องใส่บัตร",
            price: "฿0",
            unit: "/ ตลอดไป",
            feats: [
              "Quick tools ทั้งหมดของ Free tier",
              "5 prompt sets ต่อเดือน",
              "Export PDF/CSV",
              "Community support"
            ]
          },
          {
            tier: "Support Monthly",
            desc: "สำหรับคนทำงานจริง รายเดือนยกเลิกเมื่อไหร่ก็ได้",
            price: "฿290",
            unit: "/ เดือน",
            feats: [
              "ครบทุก app ทุก tool ทุก prompt",
              "Workspace ไม่จำกัด + version history",
              "LINE Agent + Email intake",
              "Priority support 24 ชั่วโมง",
              "Export ทุกฟอร์แมต"
            ],
            featured: true
          },
          {
            tier: "Custom / Admin",
            desc: "สำหรับทีมหรือองค์กรที่ต้องการกำหนดสิทธิ์เอง",
            price: "—",
            unit: "คุยรายโปรเจกต์",
            feats: [
              "Admin Console + Permission rules",
              "Support level ที่กำหนดเอง",
              "SSO + Private deployment",
              "SLA + onboarding ทีม"
            ]
          }
        ]
      : [
          {
            tier: "Free",
            desc: "Start with small tools for free, no card required",
            price: "฿0",
            unit: "/ forever",
            feats: [
              "All Quick tools in the Free tier",
              "5 prompt sets / month",
              "Export PDF/CSV",
              "Community support"
            ]
          },
          {
            tier: "Support Monthly",
            desc: "For real users. Monthly, cancel anytime.",
            price: "฿290",
            unit: "/ month",
            feats: [
              "All apps, all tools, all prompts",
              "Unlimited workspace + version history",
              "LINE Agent + Email intake",
              "Priority support within 24h",
              "Export in any format"
            ],
            featured: true
          },
          {
            tier: "Custom / Admin",
            desc: "For teams that need their own permissions",
            price: "—",
            unit: "per project pricing",
            feats: [
              "Admin Console + Permission rules",
              "Custom support level",
              "SSO + Private deployment",
              "SLA + team onboarding"
            ]
          }
        ];
  return (
    <section className="public-section">
      <div className="public-wrap">
        <div className="public-section-head">
          <div>
            <div className="public-kicker">{copy.pricingKicker}</div>
            <h1>{copy.pricingTitle}</h1>
          </div>
          <p>{copy.pricingLede}</p>
        </div>
        <div className="public-pricing-grid">
          {tiers.map((tier) => (
            <div
              key={tier.tier}
              className={tier.featured ? "public-price feat" : "public-price"}
            >
              <div className="tier">{tier.tier}</div>
              <div className="desc">{tier.desc}</div>
              <div className="val">
                {tier.price.startsWith("฿") ? (
                  <>
                    <sup>฿</sup>
                    {tier.price.slice(1)}
                    <small>{tier.unit}</small>
                  </>
                ) : (
                  <small>{tier.unit}</small>
                )}
              </div>
              <ul>
                {tier.feats.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DeveloperPage({ language }: { language: Lang }) {
  const copy = copyByLang[language];
  return (
    <section className="public-section" style={{ background: "#0F0F0E", color: "#fff", borderBottom: 0 }}>
      <div className="public-wrap">
        <div className="public-dev-grid">
          <div>
            <div className="public-kicker" style={{ color: "#9F9F9C" }}>
              {copy.developerKicker}
            </div>
            <h1 style={{ color: "#fff" }}>{copy.developerTitle}</h1>
            <p style={{ color: "#9F9F9C", marginTop: 18 }}>{copy.developerLede}</p>
          </div>
          <div className="public-dev-card">
            <div className="public-dev-head">
              <div className="public-dev-avatar">B</div>
              <div>
                <strong>Bim · Architect &amp; Developer</strong>
                <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "#9F9F9C" }}>
                  Build · Operate · Iterate
                </div>
              </div>
            </div>
            <div className="public-dev-stat-row">
              <div className="public-dev-stat">
                <div className="l">{copy.developerStat1Label}</div>
                <div className="v">{copy.developerStat1Value}</div>
              </div>
              <div className="public-dev-stat">
                <div className="l">{copy.developerStat2Label}</div>
                <div className="v">{copy.developerStat2Value}</div>
              </div>
              <div className="public-dev-stat">
                <div className="l">{copy.developerStat3Label}</div>
                <div className="v">{copy.developerStat3Value}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function useMembershipState() {
  const [plansState, setPlansState] = useState<PlansState>(() => loadPlansState());
  const [subscriptionState, setSubscriptionState] = useState<SubscriptionState>(() =>
    loadSubscriptionState()
  );
  const refresh = () => {
    setPlansState(loadPlansState());
    setSubscriptionState(loadSubscriptionState());
  };
  return { plansState, subscriptionState, refresh };
}

function useAuthUser() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured());
  useEffect(() => {
    const unsubscribe = onAuthChange((next) => {
      setUser(next);
      setLoading(false);
    });
    return unsubscribe;
  }, []);
  return { user, loading };
}

function AccountSignInCard({ language }: { language: Lang }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState<"" | "email" | "anonymous">("");
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"info" | "error">("info");

  const sendMagicLink = async () => {
    setBusy("email");
    setMessage("");
    const result = await signInWithEmail(email);
    setBusy("");
    if (result.sent) {
      setMessageTone("info");
      setMessage(
        language === "en"
          ? `Magic link sent to ${email.trim()}. Check your inbox and click the link.`
          : `ส่ง magic link ไปที่ ${email.trim()} แล้ว — ตรวจอีเมลและคลิก link เพื่อเข้าสู่ระบบ`
      );
      setEmail("");
    } else {
      setMessageTone("error");
      setMessage(result.error);
    }
  };

  const continueAsGuest = async () => {
    setBusy("anonymous");
    setMessage("");
    const result = await signInAnonymously();
    setBusy("");
    if (!result.ok) {
      setMessageTone("error");
      setMessage(result.error);
    }
  };

  return (
    <div className="public-pricing-grid" style={{ marginBottom: 24 }}>
      <div className="public-price feat">
        <div className="tier">{language === "en" ? "Sign in" : "เข้าสู่ระบบ"}</div>
        <div className="desc">
          {language === "en"
            ? "Email magic link — no password. Click the link in your inbox to finish."
            : "ใช้อีเมล + magic link ไม่ต้องตั้งรหัสผ่าน คลิก link ในอีเมลเพื่อเข้าสู่ระบบ"}
        </div>
        <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={language === "en" ? "you@example.com" : "you@example.com"}
            style={{
              padding: "10px 12px",
              borderRadius: 6,
              border: "1px solid rgba(255,255,255,0.2)",
              background: "rgba(255,255,255,0.06)",
              color: "#fff",
              fontFamily: "var(--mono)",
              fontSize: 13
            }}
          />
          <button
            className="public-btn public-btn-solid"
            style={{ background: "#fff", color: "var(--ink)", justifyContent: "center" }}
            onClick={sendMagicLink}
            disabled={busy !== "" || !email.includes("@")}
            type="button"
          >
            {busy === "email"
              ? language === "en"
                ? "Sending…"
                : "กำลังส่ง…"
              : language === "en"
                ? "Send magic link"
                : "ส่ง magic link"}
          </button>
        </div>
      </div>

      <div className="public-price">
        <div className="tier">{language === "en" ? "Continue as guest" : "ใช้แบบไม่สมัคร"}</div>
        <div className="desc">
          {language === "en"
            ? "Start using saved features right away with an anonymous session. Upgrade to email later."
            : "เริ่มใช้ฟีเจอร์ save data ได้ทันทีด้วย session ไม่ระบุชื่อ จะ upgrade เป็นอีเมลทีหลังก็ได้"}
        </div>
        <div style={{ marginTop: 22 }}>
          <button
            className="public-btn public-btn-line"
            style={{ width: "100%", justifyContent: "center" }}
            onClick={continueAsGuest}
            disabled={busy !== ""}
            type="button"
          >
            {busy === "anonymous"
              ? language === "en"
                ? "Connecting…"
                : "กำลังเชื่อมต่อ…"
              : language === "en"
                ? "Continue without an account"
                : "ใช้งานต่อโดยไม่สมัคร"}
          </button>
        </div>
      </div>

      <div className="public-price">
        <div className="tier">{language === "en" ? "Why sign in?" : "สมัครได้อะไร?"}</div>
        <ul style={{ paddingTop: 18 }}>
          <li>
            {language === "en"
              ? "Sync data across devices"
              : "Sync ข้อมูลข้ามอุปกรณ์"}
          </li>
          <li>
            {language === "en"
              ? "Activate paid plan + access more apps"
              : "เปิดแผน Support + ใช้แอปได้มากขึ้น"}
          </li>
          <li>
            {language === "en"
              ? "Get support quota + priority responses"
              : "รับสิทธิ์ support quota + priority"}
          </li>
          <li>
            {language === "en"
              ? "Audit log + admin override per workspace"
              : "Audit log + admin override ในระดับ workspace"}
          </li>
        </ul>
      </div>

      {message && (
        <div
          className="public-empty"
          style={{
            gridColumn: "1 / -1",
            borderColor: messageTone === "error" ? "#B23E1F" : "var(--line-strong)",
            color: messageTone === "error" ? "#B23E1F" : "var(--ink-3)"
          }}
        >
          {message}
        </div>
      )}
    </div>
  );
}

function AccountSignedInCard({
  user,
  language
}: {
  user: AuthUser;
  language: Lang;
}) {
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([]);
  const [loadingWs, setLoadingWs] = useState(true);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState<"" | "signout" | "createWs">("");
  const [message, setMessage] = useState("");

  const refreshWorkspaces = async () => {
    setLoadingWs(true);
    const list = await getMyWorkspaces();
    setWorkspaces(list);
    setLoadingWs(false);
    setCreating(list.length === 0);
  };

  useEffect(() => {
    void refreshWorkspaces();
  }, [user.id]);

  const handleCreateWorkspace = async () => {
    setBusy("createWs");
    setMessage("");
    const result = await ensureWorkspace();
    setBusy("");
    if (result.error) {
      setMessage(result.error);
      return;
    }
    setMessage(
      language === "en"
        ? `Workspace ready. ID: ${result.workspaceId.slice(0, 8)}…`
        : `สร้าง workspace แล้ว · ID: ${result.workspaceId.slice(0, 8)}…`
    );
    await refreshWorkspaces();
  };

  const handleSignOut = async () => {
    setBusy("signout");
    await signOut();
    setBusy("");
  };

  return (
    <div className="public-pricing-grid" style={{ marginBottom: 24 }}>
      <div className="public-price feat">
        <div className="tier">{language === "en" ? "Signed in as" : "เข้าสู่ระบบเป็น"}</div>
        <div className="desc">
          {user.isAnonymous
            ? language === "en"
              ? "Anonymous session — upgrade to email to keep your data."
              : "Session ไม่ระบุชื่อ — upgrade เป็นอีเมลเพื่อเก็บข้อมูลไว้ยาวๆ"
            : language === "en"
              ? "You're signed in. Cloud sync is unlocked in /admin."
              : "เข้าสู่ระบบแล้ว เปิด cloud sync ได้ที่ /admin"}
        </div>
        <div className="val" style={{ fontSize: 22 }}>
          {user.email || (language === "en" ? "Guest" : "ผู้เยี่ยมชม")}
        </div>
        <ul>
          <li>
            {language === "en" ? "User id" : "User id"}: <span style={{ fontFamily: "var(--mono)", fontSize: 11 }}>{user.id.slice(0, 13)}…</span>
          </li>
          <li>
            {language === "en" ? "Created" : "สร้างเมื่อ"}: {user.createdAt ? user.createdAt.slice(0, 10) : "—"}
          </li>
          <li>{language === "en" ? "Anonymous" : "ไม่ระบุชื่อ"}: {user.isAnonymous ? "yes" : "no"}</li>
        </ul>
        <div style={{ marginTop: 18 }}>
          <button
            className="public-btn public-btn-line"
            style={{ width: "100%", justifyContent: "center", borderColor: "rgba(255,255,255,0.3)", color: "#fff" }}
            onClick={handleSignOut}
            disabled={busy !== ""}
            type="button"
          >
            {busy === "signout"
              ? language === "en"
                ? "Signing out…"
                : "กำลังออก…"
              : language === "en"
                ? "Sign out"
                : "ออกจากระบบ"}
          </button>
        </div>
      </div>

      <div className="public-price">
        <div className="tier">{language === "en" ? "Workspaces" : "Workspaces"}</div>
        <div className="desc">
          {language === "en"
            ? "Each workspace has its own apps, members, and data."
            : "แต่ละ workspace มี apps, members และข้อมูลของตัวเอง"}
        </div>
        {loadingWs ? (
          <p style={{ marginTop: 18 }}>—</p>
        ) : workspaces.length === 0 ? (
          <div style={{ marginTop: 14 }}>
            <p style={{ marginBottom: 14 }}>
              {language === "en" ? "No workspace yet." : "ยังไม่มี workspace"}
            </p>
            <button
              className="public-btn public-btn-solid"
              onClick={handleCreateWorkspace}
              disabled={busy !== ""}
              style={{ width: "100%", justifyContent: "center" }}
              type="button"
            >
              {busy === "createWs"
                ? language === "en"
                  ? "Creating…"
                  : "กำลังสร้าง…"
                : language === "en"
                  ? "Create my first workspace"
                  : "สร้าง workspace แรก"}
            </button>
          </div>
        ) : (
          <ul style={{ marginTop: 14 }}>
            {workspaces.map((ws) => (
              <li key={ws.id} style={{ display: "grid", gap: 4 }}>
                <span style={{ fontWeight: 700 }}>{ws.name}</span>
                <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-5)" }}>
                  {ws.id} · {ws.role}
                </span>
              </li>
            ))}
          </ul>
        )}
        {message && (
          <div className="public-empty" style={{ marginTop: 14 }}>
            {message}
          </div>
        )}
        {creating === false && workspaces.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <button
              className="public-btn public-btn-line"
              onClick={() => {
                window.location.href = "/hub";
              }}
              style={{ width: "100%", justifyContent: "center" }}
              type="button"
            >
              {language === "en" ? "Open workspace" : "เปิด Workspace"} →
            </button>
          </div>
        )}
      </div>

      <div className="public-price">
        <div className="tier">{language === "en" ? "Next steps" : "ขั้นตอนถัดไป"}</div>
        <ul style={{ paddingTop: 18 }}>
          <li>
            <a href="/support-plans" style={{ color: "var(--ink)", textDecoration: "underline" }}>
              {language === "en" ? "Browse Support plans" : "ดู Support plans"}
            </a>
          </li>
          <li>
            <a href="/admin" style={{ color: "var(--ink)", textDecoration: "underline" }}>
              {language === "en" ? "Open Admin Console" : "เปิด Admin Console"}
            </a>
          </li>
          <li>
            <a href="/apps" style={{ color: "var(--ink)", textDecoration: "underline" }}>
              {language === "en" ? "Browse all apps" : "ดูแอปทั้งหมด"}
            </a>
          </li>
          {user.isAnonymous && (
            <li style={{ color: "#B23E1F" }}>
              {language === "en"
                ? "Tip: upgrade to email before clearing browser data"
                : "เคล็ดลับ: upgrade เป็นอีเมลก่อนเคลียร์ browser data"}
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

function AccountPage({ language }: { language: Lang }) {
  const { plansState, subscriptionState, refresh } = useMembershipState();
  const summary = summarizeMembership(plansState, subscriptionState);
  const currentPlan = summary.currentPlan;
  const supabaseReady = isSupabaseConfigured();
  const { user, loading: authLoading } = useAuthUser();

  return (
    <section className="public-section">
      <div className="public-wrap">
        <div className="public-section-head">
          <div>
            <div className="public-kicker">{language === "en" ? "Account" : "บัญชี"}</div>
            <h1>{language === "en" ? "Your account" : "บัญชีของคุณ"}</h1>
          </div>
          <p>
            {language === "en"
              ? "Sign in with email to sync data across devices. The app keeps working fully offline too."
              : "เข้าสู่ระบบด้วยอีเมลเพื่อ sync ข้อมูลข้ามอุปกรณ์ ถ้าไม่ sign in ก็ยังใช้งาน local ได้ปกติ"}
          </p>
        </div>

        {!supabaseReady ? (
          <div className="public-empty" style={{ marginBottom: 24 }}>
            {language === "en"
              ? "Supabase env vars not set — sign-in is disabled. The app stays fully local-first. See docs/SUPABASE_SETUP.md."
              : "Supabase env vars ยังไม่ถูกตั้ง — sign-in ถูกปิดอยู่; app ยังทำงาน local-first ได้ปกติ ดู docs/SUPABASE_SETUP.md"}
          </div>
        ) : authLoading ? (
          <div className="public-empty" style={{ marginBottom: 24 }}>
            {language === "en" ? "Checking session…" : "ตรวจ session…"}
          </div>
        ) : user ? (
          <AccountSignedInCard user={user} language={language} />
        ) : (
          <AccountSignInCard language={language} />
        )}

        <div className="public-pricing-grid" style={{ marginBottom: 24 }}>
          <div className="public-price feat" style={{ gridColumn: "span 1" }}>
            <div className="tier">{language === "en" ? "Current plan" : "แผนปัจจุบัน"}</div>
            <div className="desc">{currentPlan?.description ?? "—"}</div>
            <div className="val" style={{ fontSize: 30 }}>
              {currentPlan?.name ?? "—"}
            </div>
            <ul>
              <li>
                {(language === "en" ? "Status: " : "สถานะ: ") + summary.subscriptionStatus}
              </li>
              <li>
                {language === "en"
                  ? `Apps allowed: ${summary.allowedAppCount} / ${summary.allowedAppCount + summary.deniedAppCount}`
                  : `แอปที่ใช้ได้: ${summary.allowedAppCount} / ${summary.allowedAppCount + summary.deniedAppCount}`}
              </li>
              <li>
                {language === "en"
                  ? `Support quota: ${currentPlan?.supportQuota ?? 0}`
                  : `Support quota: ${currentPlan?.supportQuota ?? 0}`}
              </li>
              <li>
                {language === "en"
                  ? `Billing: ${currentPlan?.priceAmount ?? 0} ${currentPlan?.currency ?? ""} / ${currentPlan?.billingInterval ?? "none"}`
                  : `รอบบิล: ${currentPlan?.priceAmount ?? 0} ${currentPlan?.currency ?? ""} / ${currentPlan?.billingInterval ?? "none"}`}
              </li>
            </ul>
          </div>
          <div className="public-price">
            <div className="tier">{language === "en" ? "Catalog stats" : "สรุปแผน"}</div>
            <div className="desc">
              {language === "en"
                ? "Plans, rules, and admin overrides currently stored on this device."
                : "ข้อมูลแผน rules และ overrides ในเครื่องปัจจุบัน"}
            </div>
            <div className="val" style={{ fontSize: 30 }}>
              {summary.totalPlans} <small>{language === "en" ? "plans" : "แผน"}</small>
            </div>
            <ul>
              <li>
                {language === "en"
                  ? `Access rules: ${summary.totalRules}`
                  : `กฎสิทธิ์: ${summary.totalRules}`}
              </li>
              <li>
                {language === "en"
                  ? `Admin overrides: ${summary.totalOverrides}`
                  : `Admin override: ${summary.totalOverrides}`}
              </li>
              <li>
                {language === "en"
                  ? "Audit log capped at 200 entries"
                  : "เก็บ audit log ไม่เกิน 200 รายการ"}
              </li>
            </ul>
          </div>
          <div className="public-price">
            <div className="tier">{language === "en" ? "Switch plan" : "เปลี่ยนแผน"}</div>
            <div className="desc">
              {language === "en"
                ? "Activate a different plan instantly (local only — no charge)."
                : "เปลี่ยนแผนทันที (เครื่องนี้เท่านั้น ไม่มีการเก็บเงิน)"}
            </div>
            <div className="val" style={{ fontSize: 16, fontFamily: "var(--mono)" }}>
              {language === "en" ? "Pick one →" : "เลือกแผน →"}
            </div>
            <ul style={{ paddingTop: 18 }}>
              {plansState.plans
                .filter((plan) => plan.status === "active")
                .map((plan) => {
                  const isCurrent = currentPlan?.id === plan.id;
                  return (
                    <li
                      key={plan.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}
                    >
                      <span>{plan.name}</span>
                      <button
                        className="public-btn public-btn-line"
                        style={{ padding: "5px 12px", fontSize: 12 }}
                        disabled={isCurrent}
                        onClick={() => {
                          if (isCurrent) return;
                          activateSubscription(plan.id, { note: "manual switch via /account" });
                          refresh();
                        }}
                        type="button"
                      >
                        {isCurrent
                          ? language === "en"
                            ? "Active"
                            : "ใช้อยู่"
                          : language === "en"
                            ? "Activate"
                            : "เปลี่ยน"}
                      </button>
                    </li>
                  );
                })}
            </ul>
          </div>
        </div>

        <div className="public-empty">
          {language === "en"
            ? "Audit log viewer and admin override matrix live at /admin. Payment provider arrives in v0.5."
            : "Audit log viewer + admin override matrix อยู่ที่ /admin · ระบบจ่ายเงินจริงมาในกัก v0.5"}
        </div>
      </div>
    </section>
  );
}

function SupportPlansPage({ language }: { language: Lang }) {
  const { plansState, subscriptionState, refresh } = useMembershipState();
  const activePlans = plansState.plans.filter((plan) => plan.status === "active");
  const currentPlanId = subscriptionState.current?.planId;
  const catalogApps = useMemo(() => workspaceApps.filter((app) => app.id !== "hub"), []);

  const matrixCell = (plan: Plan, appId: WorkspaceAppId) => {
    const decision = evaluateAppAccess({
      appId,
      plansState,
      subscriptionState: {
        current: {
          ...(subscriptionState.current ?? {
            id: "preview",
            status: "active" as const,
            startedAt: "",
            currentPeriodEnd: "",
            provider: "manual",
            providerRef: "",
            note: ""
          }),
          planId: plan.id,
          status: "active" as const
        },
        updatedAt: ""
      }
    });
    return decision;
  };

  return (
    <section className="public-section">
      <div className="public-wrap">
        <div className="public-section-head">
          <div>
            <div className="public-kicker">{language === "en" ? "Support Plans" : "แผน Support"}</div>
            <h1>
              {language === "en" ? "Plans and access matrix" : "แผนและสิทธิ์การใช้แอป"}
            </h1>
          </div>
          <p>
            {language === "en"
              ? "Each plan unlocks a different set of apps per MEMBERSHIP_ACCESS_PRD.md Section 5 (override > plan > default free fallback)."
              : "แต่ละแผนปลดล็อกแอปต่างกันตาม MEMBERSHIP_ACCESS_PRD.md Section 5 (override > plan > default free fallback)"}
          </p>
        </div>

        <div className="public-pricing-grid" style={{ marginBottom: 28 }}>
          {activePlans.map((plan) => {
            const isCurrent = currentPlanId === plan.id;
            const rules = plansState.rules.filter(
              (rule) => rule.planId === plan.id && rule.enabled
            );
            return (
              <div
                key={plan.id}
                className={isCurrent ? "public-price feat" : "public-price"}
              >
                <div className="tier">{plan.name}</div>
                <div className="desc">{plan.description}</div>
                <div className="val">
                  {plan.priceAmount > 0 ? (
                    <>
                      <sup>{plan.currency === "THB" ? "฿" : plan.currency}</sup>
                      {plan.priceAmount}
                      <small>
                        / {plan.billingInterval === "monthly"
                          ? language === "en"
                            ? "month"
                            : "เดือน"
                          : plan.billingInterval}
                      </small>
                    </>
                  ) : (
                    <small>{language === "en" ? "Free" : "ฟรี"}</small>
                  )}
                </div>
                <ul>
                  <li>
                    {language === "en"
                      ? `${rules.length} access rules configured`
                      : `กำหนดสิทธิ์ ${rules.length} กฎ`}
                  </li>
                  <li>
                    {language === "en"
                      ? `Support quota: ${plan.supportQuota || "—"}`
                      : `Support quota: ${plan.supportQuota || "—"}`}
                  </li>
                  <li>
                    {plan.billingNote || (language === "en" ? "No billing note" : "ไม่มีหมายเหตุบิล")}
                  </li>
                </ul>
                <div style={{ marginTop: 18 }}>
                  <button
                    className={
                      isCurrent
                        ? "public-btn public-btn-line"
                        : "public-btn public-btn-solid"
                    }
                    style={{ width: "100%", justifyContent: "center" }}
                    disabled={isCurrent}
                    onClick={() => {
                      if (isCurrent) return;
                      activateSubscription(plan.id, { note: "switched via /support-plans" });
                      refresh();
                    }}
                    type="button"
                  >
                    {isCurrent
                      ? language === "en"
                        ? "Current plan"
                        : "แผนปัจจุบัน"
                      : language === "en"
                        ? "Activate"
                        : "เปลี่ยนเป็นแผนนี้"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="public-section-head" style={{ marginBottom: 18 }}>
          <div>
            <div className="public-kicker">
              {language === "en" ? "Access Matrix" : "ตารางสิทธิ์"}
            </div>
            <h1 style={{ fontSize: 26 }}>
              {language === "en"
                ? "Which apps each plan unlocks"
                : "แต่ละแผนเปิดแอปอะไรบ้าง"}
            </h1>
          </div>
          <p>
            {language === "en"
              ? "Live preview — based on current seed rules. Click a plan above to switch and see the change in /account."
              : "ดูสดจากกฎปัจจุบัน · กดเปลี่ยนแผนด้านบนแล้วเช็คผลที่ /account"}
          </p>
        </div>

        <div
          style={{
            overflowX: "auto",
            border: "1px solid var(--line)",
            borderRadius: 8,
            background: "#fff"
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 13,
              minWidth: 600
            }}
          >
            <thead>
              <tr style={{ borderBottom: "1px solid var(--line)" }}>
                <th
                  style={{
                    textAlign: "left",
                    padding: "12px 14px",
                    fontFamily: "var(--mono)",
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "var(--ink-5)"
                  }}
                >
                  {language === "en" ? "App" : "แอป"}
                </th>
                {activePlans.map((plan) => (
                  <th
                    key={plan.id}
                    style={{
                      padding: "12px 14px",
                      fontFamily: "var(--mono)",
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      color: plan.id === currentPlanId ? "var(--ink)" : "var(--ink-5)",
                      borderLeft: "1px solid var(--line)"
                    }}
                  >
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {catalogApps.map((app) => (
                <tr key={app.id} style={{ borderBottom: "1px solid var(--line)" }}>
                  <td
                    style={{
                      padding: "10px 14px",
                      fontWeight: 600,
                      color: "var(--ink)"
                    }}
                  >
                    {app.label}
                    <div
                      style={{
                        fontSize: 11,
                        fontFamily: "var(--mono)",
                        color: "var(--ink-5)",
                        marginTop: 2
                      }}
                    >
                      {workspaceAppCategoryCopy[app.category][language]}
                    </div>
                  </td>
                  {activePlans.map((plan) => {
                    const decision = matrixCell(plan, app.id);
                    const tone = decision.allow
                      ? decision.accessLevel === "write" || decision.accessLevel === "admin"
                        ? "#2A6D45"
                        : "#92651A"
                      : "#B23E1F";
                    return (
                      <td
                        key={plan.id}
                        style={{
                          padding: "10px 14px",
                          textAlign: "center",
                          fontFamily: "var(--mono)",
                          fontSize: 11,
                          letterSpacing: "0.04em",
                          color: tone,
                          borderLeft: "1px solid var(--line)",
                          background:
                            plan.id === currentPlanId ? "rgba(10,10,9,0.03)" : "transparent"
                        }}
                      >
                        {decision.allow ? decision.accessLevel : "—"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function Subpage(props: SubpageProps) {
  let body: ReactNode = null;
  switch (props.route) {
    case "/apps":
      body = <AppsCatalogPage language={props.language} />;
      break;
    case "/tools":
      body = <ToolsPage language={props.language} />;
      break;
    case "/prompts":
      body = <PromptsPage language={props.language} />;
      break;
    case "/workflows":
      body = <WorkflowsPage language={props.language} />;
      break;
    case "/roadmap":
      body = <RoadmapPage language={props.language} onNavigate={props.onNavigate} />;
      break;
    case "/pricing":
      body = <PricingPage language={props.language} />;
      break;
    case "/account":
      body = <AccountPage language={props.language} />;
      break;
    case "/support-plans":
      body = <SupportPlansPage language={props.language} />;
      break;
    case "/developer":
      body = <DeveloperPage language={props.language} />;
      break;
    default:
      body = null;
  }

  return (
    <div className="public-page" aria-label={props.route}>
      <style>{subpageCss}</style>
      <PublicNav {...props} />
      <main>{body}</main>
      <PublicFooter language={props.language} onNavigate={props.onNavigate} />
    </div>
  );
}

function PublicSite() {
  const [route, setRoute] = useState<PublicRoute>(() => getCurrentRoute());
  const [language, setLanguage] = useState<Lang>(() => loadStylePreviewLanguage());

  useEffect(() => {
    if (window.location.pathname.replace(/\/+$/, "") === "/style-preview") {
      window.history.replaceState({}, "", "/");
      setRoute("/");
    }
  }, []);

  useEffect(() => {
    const handler = () => setRoute(getCurrentRoute());
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  useEffect(() => {
    saveStylePreviewLanguage(language);
    if (typeof document !== "undefined") {
      document.documentElement.lang = language;
    }
  }, [language]);

  if (route === "/") {
    return <PublicStylePreview />;
  }

  if (route === "/mockup") {
    return <MockupGallery />;
  }

  return (
    <Subpage
      route={route}
      language={language}
      onNavigate={navigateTo}
      onLanguageChange={setLanguage}
    />
  );
}

export default PublicSite;

