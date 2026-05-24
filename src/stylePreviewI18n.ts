// Style preview i18n
// AGENTS.md: ใช้ dictionary แทน hardcode ภาษาเดียว และบันทึกค่าภาษาที่เลือกไว้ใน localStorage
// ใช้ storage key เดียวกับ workspace shell เพื่อให้ภาษาที่เลือก sync กันทั้งเว็บ

import { defaultStorageAdapter } from "./storageAdapter";

export const STYLE_PREVIEW_LANGUAGE_STORAGE_KEY = "build-by-bim.workspace-language.v1";

export type StylePreviewLanguage = "th" | "en";

export function normalizeStylePreviewLanguage(
  value: string | null | undefined
): StylePreviewLanguage {
  return value === "en" ? "en" : "th";
}

export function loadStylePreviewLanguage(): StylePreviewLanguage {
  return normalizeStylePreviewLanguage(
    defaultStorageAdapter.read(STYLE_PREVIEW_LANGUAGE_STORAGE_KEY)
  );
}

export function saveStylePreviewLanguage(language: StylePreviewLanguage): void {
  try {
    defaultStorageAdapter.write(STYLE_PREVIEW_LANGUAGE_STORAGE_KEY, language);
  } catch {
    // adapter handles most errors, but guard anyway
  }
}

// ป้ายปุ่มสลับภาษา
export const stylePreviewLanguageToggleCopy: Record<
  StylePreviewLanguage,
  { srLabel: string; switchTo: string }
> = {
  th: {
    srLabel: "เปลี่ยนภาษาแสดงผล",
    switchTo: "Switch to English"
  },
  en: {
    srLabel: "Change display language",
    switchTo: "เปลี่ยนเป็นภาษาไทย"
  }
};

// คู่แปล TH → EN
// เรียงตามที่ปรากฏใน style-preview-handoff.html (top-down) เพื่อให้แก้/เพิ่มง่าย
// ตอน apply จะ sort ตามความยาว desc เพื่อไม่ให้ substring สั้นไปแทนข้อความยาวเสียก่อน
const TH_TO_EN_PAIRS: ReadonlyArray<readonly [string, string]> = [
  // NAV CTA
  ["เริ่มจาก Tools ฟรี", "Start with free Tools"],

  // HERO h1 (split into rows)
  ["รวมเครื่องมือทำงาน", "Productivity tools"],
  ["สำหรับก่อสร้าง", "for construction,"],
  ["ออกแบบ", "design"],
  ["และ AI Workflow", "and AI Workflow"],

  // HERO lede
  [
    "เริ่มจากเครื่องมือเล็กที่แก้ปัญหาเฉพาะหน้าได้ทันที แล้วค่อยบันทึกข้อมูลเป็น workspace สำหรับงานซ้ำ เอกสาร ทีม support และ agent automation ในอนาคต",
    "Start with small tools that solve immediate problems, then save the data as a workspace for repeat work, documents, team support, and future agent automation."
  ],

  // HERO CTAs
  ["เลือกงานที่ต้องทำ", "Pick what you need to do"],
  ["ดูโมดูลทั้งหมด", "View all modules"],

  // MODULES intro
  [
    "สี่โมดูลหลัก ออกแบบให้ทำงานต่อกันได้",
    "Four core modules designed to flow into one another"
  ],
  ["ตั้งแต่ tool เล็กไปจนถึง agent", "from small tools all the way to agents"],
  [
    "เลือกใช้แค่ส่วนที่ต้องการก่อนก็ได้ — ทุก tool เก็บข้อมูลในรูปแบบเดียวกัน เพื่อต่อยอดเป็น workflow, prompt set, หรือป้อนให้ AI agent ภายหลังโดยไม่ต้องทำใหม่",
    "Use only what you need first — every tool stores data in the same format so it extends into a workflow, prompt set, or feeds an AI agent later without redoing the work."
  ],

  // MODULE cards
  [
    "ตรวจแปลน, BOQ, สลิป, checklist หน้างาน — เครื่องมือเล็กที่ใช้ได้ทันที",
    "Plan review, BOQ, receipts, site checklist — small tools ready to use right away."
  ],
  [
    "ช่วยตรวจ brief, generate moodboard, drafting proposal และ document",
    "Help check briefs, generate moodboards, draft proposals and documents."
  ],
  [
    "Prompt Set, Workflow, Agent — รวมเครื่องมือที่ใช้ AI ทำงานจริงทุกวัน",
    "Prompt Set, Workflow, Agent — AI tools used in real work every day."
  ],
  [
    "Workspace, plan, permission, admin — ใช้คนเดียวหรือทั้งทีมก็ได้",
    "Workspace, plan, permission, admin — for solo use or a full team."
  ],

  // QUICK START
  [
    "เริ่มจาก tool เดียวก่อน เลือกงานที่ต้องทำตอนนี้",
    "Start with just one tool — pick the task you need now"
  ],
  [
    "ไม่ต้องสมัครก่อน ไม่ต้อง config อะไรเยอะ เริ่มจากเครื่องมือฟรีที่ใช้บ่อยที่สุด แล้วค่อยขยับขึ้นเมื่อจำเป็น",
    "No signup, no heavy setup. Start with the most-used free tools, scale up only when needed."
  ],
  ["ตรวจแปลน / ตรวจ brief", "Plan review / Brief check"],
  [
    "อัปโหลด drawing หรือ brief พร้อม checklist อัตโนมัติ ก่อนเข้าประชุม",
    "Upload a drawing or brief with an auto checklist before your meeting."
  ],
  ["ทำ BOQ / เอกสาร", "Build BOQ / documents"],
  [
    "สร้าง BOQ จากสเปคหรือ drawing ส่งออกเป็น Excel/PDF ได้ทันที",
    "Build BOQ from spec or drawing, export to Excel/PDF instantly."
  ],
  ["สร้างโพสต์ Facebook", "Create a Facebook post"],
  [
    "แปลงงานในมือเป็น caption + hashtag + แนะนำภาพ ใน 1 คลิก",
    "Turn what you're working on into caption + hashtags + image hints in one click."
  ],
  ["ส่งสลิปผ่าน LINE", "Send receipts via LINE"],
  [
    "ส่งสลิปเข้า LINE bot ระบบจะอ่านยอด วันที่ และจัดให้เป็น draft",
    "Send a receipt to the LINE bot — it reads the amount, date, and prepares a draft."
  ],

  // PAIN / SOLUTION / RESULT
  [
    "หยุดทำงานเดิมซ้ำ ๆ ใน 3 ที่ — เริ่มจากปัญหาจริง",
    "Stop repeating the same work in 3 places — start from real pains"
  ],
  ["จบที่ข้อมูลที่ต่อยอดได้", "end with data you can extend"],
  [
    "ปัญหาในงานก่อสร้าง / ออกแบบ ส่วนใหญ่ไม่ใช่ของยาก แค่กระจาย ใช้หลายเครื่องมือ ไม่ต่อยอด — เราออกแบบให้ทุก output sync กลับเข้า workspace เดียว",
    "Most pains in construction / design work aren't hard — they're just scattered across many tools and never reused. We sync every output back into a single workspace."
  ],
  ["— Pain · ปัญหา", "— Pain"],
  ["→ Solution · วิธีแก้", "→ Solution"],
  ["✓ Result · ผลลัพธ์", "✓ Result"],
  ["งานกระจัดกระจาย ใช้หลายเครื่องมือ", "Work scattered across multiple tools"],
  [
    "ตรวจแปลนใน PDF, ทำ BOQ ใน Excel, ส่งสลิปใน LINE, สร้างโพสต์ใน Canva — ข้อมูลกระจาย ไม่ต่อยอด",
    "Plan review in PDF, BOQ in Excel, receipts in LINE, posts in Canva — data is scattered and never reused."
  ],
  ["copy-paste ข้ามไฟล์", "copy-paste across files"],
  ["หา draft เก่าไม่เจอ", "can't find old drafts"],
  ["ทำเอกสารซ้ำทุกโปรเจกต์", "redo docs every project"],
  ["AI ใช้ทีละครั้ง ไม่จำ context", "AI used one-shot, no context memory"],
  [
    "เริ่มจาก tool เล็ก เก็บผลลัพธ์ในที่เดียว",
    "Start with small tools, store every result in one place"
  ],
  [
    "เลือก tool ที่ตรงปัญหา ใช้งานทันที — ผลลัพธ์ทุกครั้งกลับเข้า workspace เป็นข้อมูลโครงสร้างที่ AI agent ใช้ต่อได้",
    "Pick the tool that matches the pain and use it instantly — every result flows back into your workspace as structured data the AI agent can use later."
  ],
  ["tool ใช้งานในไม่กี่วินาที", "tools run in seconds"],
  ["เก็บผลลัพธ์ทุกครั้งใน workspace", "every output saved in workspace"],
  ["prompt set สำเร็จรูปต่อสายงาน", "ready-made prompt sets per role"],
  ["workflow เชื่อม tool ต่อกันได้", "workflows chain tools together"],
  [
    "ข้อมูลถูกเก็บไว้ ต่อยอดอัตโนมัติ",
    "Data is preserved and extended automatically"
  ],
  [
    "โปรเจกต์ถัดไปไม่ต้องเริ่มจาก 0 — agent หา draft, spec, ผู้รับเหมา และ template เดิมที่ทีมใช้แล้วได้เอง",
    "Next project doesn't start from zero — the agent fetches drafts, specs, contractors, and templates your team has already used."
  ],
  ["เริ่มงานใหม่เร็วขึ้น 4-6 เท่า", "new work starts 4–6× faster"],
  ["draft พร้อม approve ใน 1 คลิก", "drafts ready to approve in one click"],
  ["agent อ่าน workspace ของทีมได้", "agent reads your team workspace"],
  ["export ได้ทุกฟอร์แมต", "export to any format"],

  // APP MARKETPLACE
  ["42 แอปพร้อมใช้ จัดหมวดตามงานจริง", "42 apps ready to use, organized by real work"],
  [
    "ทุกแอประบุชัดเจนว่าใช้ได้ฟรี / member / support, ใช้ AI หรือไม่, เก็บข้อมูล privacy level ไหน",
    "Every app states free / member / support tier, whether it uses AI, and its privacy level."
  ],
  ["ทั้งหมด", "All"],
  ["ดูทั้งหมด 42 แอป →", "View all 42 apps →"],

  // App descriptions
  [
    "อัปโหลด drawing PDF/DWG → checklist scale, title block, sheet index ใน 1 นาที พร้อมเปรียบเทียบเวอร์ชัน",
    "Upload PDF/DWG drawing → checklist for scale, title block, sheet index in 1 minute, with version comparison."
  ],
  [
    "Drawing/spec → ดึง quantity อัตโนมัติ → ตาราง BOQ ส่งออก Excel/PDF พร้อมเทียบราคาผู้ขาย",
    "Drawing/spec → auto-extract quantity → BOQ table exported to Excel/PDF with vendor price comparison."
  ],
  [
    "ส่งสลิป/รูปเข้า LINE → อ่านยอด วันที่ ผู้รับอัตโนมัติ → draft รอ confirm ก่อนลงบัญชี",
    "Send a receipt or photo to LINE → auto-read amount, date, vendor → draft awaiting confirmation before booking."
  ],
  [
    "อ่าน brief → ระบุช่องโหว่ขอบเขต งบ เงื่อนไข timeline → checklist พร้อมก่อนรับงาน",
    "Read the brief → flag gaps in scope, budget, conditions, timeline → checklist ready before accepting the job."
  ],
  [
    "เลือกวัสดุ/อุปกรณ์ → spec อัตโนมัติจาก template ทีม + ราคา + ผู้ขายที่เคยใช้",
    "Pick material/equipment → auto spec from team template + price + known vendors."
  ],
  [
    "งานในมือ 1 ชิ้น → caption + hook + hashtag + แนะนำมุมภาพ พร้อมตรวจ tone ของแบรนด์",
    "One task in hand → caption + hook + hashtags + image angle hints, brand-tone checked."
  ],
  [
    "ตรวจหน้างาน → ติ๊ก checklist + ถ่ายรูป → log พร้อม timestamp ตำแหน่ง defect tag",
    "Inspect on site → tick checklist + take photo → log with timestamp, location, defect tag."
  ],
  [
    "เลือก prompt set ตามสายงาน → ใช้ซ้ำ บันทึก favorite จัด version และแชร์ใน workspace ของทีม",
    "Pick prompt sets by role → reuse, favorite, version, and share inside your team workspace."
  ],
  [
    "LINE/Email → agent ทำ draft ทุกขั้นอัตโนมัติ → human confirm ก่อน commit เข้า workspace",
    "LINE/Email → agent drafts every step automatically → human confirms before committing to the workspace."
  ],
  // App mock mini-text
  ["ปูน 50kg", "Cement 50kg"],
  ["เหล็ก เส้น", "Rebar"],
  ["ไม้ 2\"", "Wood 2\""],
  ["บจก. ก.", "Co. A"],
  ["พื้น Vinyl Plank", "Vinyl Plank floor"],
  ["ผนัง Acoustic Panel", "Acoustic Panel wall"],
  ["ฝ้า T-bar 60×60", "T-bar 60×60 ceiling"],
  ["ราคา", "Price"],

  // PROMPTS
  [
    "Prompt set ใช้ได้ทันที สำหรับงานก่อสร้าง",
    "Prompt sets ready to use for construction,"
  ],
  ["ออกแบบ และ content workflow", "design, and content workflows"],
  [
    "เริ่มจาก prompt template สำเร็จรูป ปรับ variable ให้เข้ากับงาน บันทึกเข้า workspace เพื่อใช้ซ้ำกับโปรเจกต์ถัดไป",
    "Start from a ready prompt template, tune variables to fit your work, and save to workspace for the next project."
  ],
  [
    "อ่าน brief จากลูกค้า → ระบุ scope, budget, timeline ที่ขาด พร้อมคำถามกลับ",
    "Read the client brief → flag missing scope, budget, timeline → ready-to-send follow-up questions."
  ],
  [
    "แปลงรายการในสเปคให้เป็น BOQ table → ลำดับรายการ จำนวน หน่วย พร้อมหมายเหตุวัสดุ",
    "Turn spec lines into a BOQ table → item, quantity, unit, with material notes."
  ],
  [
    "งานในมือ 1 ชิ้น → caption + hook + hashtag + แนะนำมุมภาพ ตามแบรนด์ของทีม",
    "One task in hand → caption + hook + hashtags + image angles in your brand tone."
  ],
  [
    "อ่านข้อความ/รูป/สลิปที่เข้า LINE → จัดเป็น draft รายการ พร้อม metadata รอ confirm",
    "Read LINE messages/photos/receipts → prepare draft records with metadata, awaiting confirmation."
  ],
  ["ดู Prompt Library ทั้งหมด →", "View the full Prompt Library →"],

  // WORKFLOW
  ["สาม mode ทำงานต่อเนื่อง — ลองครั้งเดียว,", "Three flowing modes — try once,"],
  ["บันทึก, หรือให้ agent ทำเอง", "save, or let the agent run it"],
  [
    "ทุก tool สามารถยกระดับขึ้นเป็น workflow ที่บันทึก step, prompt และ output เพื่อให้ agent ทำซ้ำได้",
    "Every tool can level up to a workflow that records step, prompt, and output so the agent can repeat it."
  ],
  [
    "ลองใช้ครั้งเดียว ไม่ต้อง login รับ output แล้วจบ — เหมาะกับงานเฉพาะหน้า ตรวจไฟล์, generate draft",
    "Try once, no login — receive output and you're done. Great for one-off work: file checks, draft generation."
  ],
  [
    "บันทึก input/prompt/output ไว้ใน workspace — ใช้ซ้ำกับโปรเจกต์ใหม่ได้, แชร์กับทีม, ติด version",
    "Save input/prompt/output to your workspace — reuse on new projects, share with team, version-tagged."
  ],
  [
    "ปล่อยให้ AI agent ทำงานเอง — รับไฟล์/รูป/สลิป/ข้อความผ่าน LINE หรือ email และจัดเป็น draft รอตรวจ",
    "Let the AI agent run on its own — receive files, photos, receipts, or messages via LINE or email and prepare drafts for review."
  ],

  // TRUST
  ["เครื่องมือทำงานต้องน่าเชื่อถือก่อน", "Trustworthy tools first"],
  ["ใช้งานสะดวกทีหลัง", "convenience second"],
  [
    "ทุกการตัดสินใจที่สำคัญ ต้องมาจากคุณ ไม่ใช่ AI — ระบบสร้าง draft, มนุษย์ confirm ก่อนทุกครั้ง",
    "Every important decision comes from you, not the AI — the system creates drafts, humans confirm every time."
  ],
  ["ทุก output อ้างอิงแหล่งข้อมูลของผู้ใช้", "Every output cites your source data"],
  [
    "AI ไม่เดาเอง ทุกบรรทัดของ draft ระบุได้ว่ามาจากไฟล์ไหน บรรทัดไหน เพื่อให้ตรวจสอบย้อนกลับได้",
    "AI doesn't guess. Every draft line cites the source file and line so it's traceable."
  ],
  ["ไม่มีการเขียนทับข้อมูลโดยอัตโนมัติ", "No automatic data overwrites"],
  [
    "ทุกการเปลี่ยนแปลงเป็น draft รอผู้ใช้ approve เก็บประวัติทุก version สำหรับการตรวจสอบ",
    "All changes are drafts awaiting approval, with full version history for audit."
  ],
  ["Permission ระดับ user / plan / app / feature", "Permissions at user / plan / app / feature level"],
  [
    "Admin ตั้งค่าสิทธิ์อย่างละเอียดได้ ระบุชัดว่าใครเห็นข้อมูลไหน และข้อมูลใดสามารถส่งออกจาก workspace",
    "Admins can set granular permissions — define who sees what, and which data can leave the workspace."
  ],
  ["ข้อมูลของคุณ — ไม่ใช่ของระบบ", "Your data — not ours"],
  [
    "Export ได้ทั้ง project, workspace, prompt และ workflow ในฟอร์แมตที่ใช้ต่อได้จริง (JSON, CSV, PDF, XLSX)",
    "Export projects, workspaces, prompts, and workflows in formats you can actually use (JSON, CSV, PDF, XLSX)."
  ],
  [
    "ทุก app ระบุ privacy level ชัดเจน ผู้ใช้ตัดสินใจได้ก่อนเริ่มงาน",
    "Every app states its privacy level clearly so you decide before you start."
  ],
  ["เก็บใน workspace ของคุณเท่านั้น", "stays in your workspace only"],
  ["แชร์ในทีมตาม permission", "shared in team by permission"],
  ["เผยแพร่ได้ มี watermark", "publishable with watermark"],
  ["ระบุชัดว่าใช้ model ใด version ไหน", "states which model and version is used"],

  // PRICING
  ["เริ่มฟรี จ่ายเฉพาะส่วนที่ต้องการ", "Start free, pay only for what you need"],
  ["admin ปรับเงื่อนไขได้", "admin can tune the terms"],
  [
    "ไม่มี seat-based ราคา รายเดือนยืดหยุ่น admin override ได้ตาม support level ของแต่ละทีม",
    "No seat-based pricing. Flexible monthly. Admin overrides per-team support level."
  ],
  ["เริ่มต้นใช้ tool เล็ก ๆ ฟรี ไม่ต้องใส่บัตร", "Start using small tools for free, no card required."],
  ["/ ตลอดไป", "/ forever"],
  ["เริ่มใช้งานฟรี", "Start free"],
  ["Quick tools ทั้งหมดของ Free tier", "All Quick tools in the Free tier"],
  ["5 prompt sets ต่อเดือน", "5 prompt sets / month"],
  ["ส่งออก PDF/CSV", "Export to PDF/CSV"],
  ["แนะนำ", "Recommended"],
  ["สำหรับคนทำงานจริง รายเดือนยกเลิกเมื่อไหร่ก็ได้", "For real users. Monthly, cancel anytime."],
  ["/ เดือน", "/ month"],
  ["สมัคร Support Plan", "Get the Support Plan"],
  ["ครบทุก app ทุก tool ทุก prompt", "All apps, all tools, all prompts"],
  ["Workspace ไม่จำกัด + version history", "Unlimited workspace + version history"],
  ["Export ทุกฟอร์แมต", "Export in any format"],
  ["สำหรับทีมหรือองค์กรที่ต้องการกำหนดสิทธิ์เอง", "For teams or organizations that need their own permissions."],
  ["คุยรายโปรเจกต์", "Per-project pricing"],
  ["ติดต่อทีม Admin", "Contact the Admin team"],
  ["Support level ที่กำหนดเอง", "Custom support level"],
  ["SLA + onboarding ทีม", "SLA + team onboarding"],

  // FAQ
  ["คำถามที่พบบ่อย", "Frequently Asked Questions"],
  ["ถ้ายังไม่เจอคำตอบ ส่งคำถามมาได้ที่", "If you don't find an answer, reach us at"],
  ["ต้องเข้าใจ BIM ก่อนใช้งานไหม?", "Do I need to understand BIM first?"],
  [
    "ไม่จำเป็น — แม้ชื่อจะมาจากสาย BIM แต่ tool ส่วนใหญ่ออกแบบให้ใช้ได้ตั้งแต่งานก่อสร้างเล็ก ออกแบบภายใน เอกสาร, content จนถึง workflow ทั่วไป ผู้ใช้แค่เลือกงานที่ต้องทำ ระบบจะแนะนำ tool ที่เหมาะสมให้",
    "Not at all — the name comes from BIM, but most tools work for everything from small construction, interior design, documents, and content to general workflows. Just pick what you need to do and the system suggests the right tool."
  ],
  ["ลองใช้ฟรีก่อนได้ไหม?", "Can I try it free first?"],
  [
    "ได้ — Quick tools ทั้งหมดของ Free tier ใช้ได้ทันทีโดยไม่ต้องสมัคร ไม่ต้องใส่บัตร เหมาะสำหรับการลอง output ก่อนตัดสินใจสมัคร Support plan",
    "Yes — all Quick tools in the Free tier work right away, no signup, no card. Great for trying outputs before deciding on a Support plan."
  ],
  ["AI จะบันทึกข้อมูลให้อัตโนมัติเลยไหม?", "Does AI save my data automatically?"],
  [
    "ไม่ — AI สร้าง draft data เท่านั้น ผู้ใช้ต้อง confirm ก่อน commit ทุกครั้ง โดยเฉพาะข้อมูลสำคัญเช่น BOQ, สลิป, spec หรือเอกสารทางการ การออกแบบนี้เป็นหลักการหลักของแพลตฟอร์ม",
    "No — AI only creates draft data. Users must confirm before any commit, especially important data like BOQ, receipts, specs, or official documents. This is a core platform principle."
  ],
  ["ในอนาคตจะรองรับสายงานอื่นไหม?", "Will other professions be supported later?"],
  [
    "รองรับ — เริ่มจากก่อสร้าง ออกแบบ และ BIM ก่อน แต่ระบบ App Catalog และ Permission ออกแบบให้ขยายไปสายงานอื่นได้ เช่น เอกสารทั่วไป, content workflow, business tools และ daily-life tools ในเฟสถัดไป",
    "Yes — construction, design, and BIM come first, but the App Catalog and Permission system are designed to extend to other professions: general docs, content workflow, business tools, and daily-life tools in later phases."
  ],
  ["ข้อมูลผู้ใช้ได้รับการคุ้มครองอย่างไร?", "How is user data protected?"],
  [
    "ทุก app ระบุ privacy level ชัดเจน (Private/Team/Public), ข้อมูลของผู้ใช้ไม่ถูกใช้ train model ใด ๆ และทุก output อ้างอิงแหล่งข้อมูลของผู้ใช้เอง สามารถ export ออกได้ทั้งหมดเมื่อเลิกใช้",
    "Every app states a privacy level (Private/Team/Public). User data is never used to train any model, every output cites the user's own source data, and full export is available when you leave."
  ],
  ["Support Monthly รวมอะไรบ้าง?", "What does Support Monthly include?"],
  [
    "รวมทุก app ทุก tool, workspace ไม่จำกัด, version history, LINE Agent + Email intake, AI quota ตาม plan, export ทุกฟอร์แมต และ priority support ภายใน 24 ชั่วโมง — admin สามารถปรับเงื่อนไขให้ทีมได้",
    "Includes all apps and tools, unlimited workspace, version history, LINE Agent + Email intake, AI quota by plan, exports in all formats, and priority support within 24 hours — admins can tailor terms for their team."
  ],

  // DEVELOPER
  [
    "สร้างโดยสถาปนิกที่ใช้เครื่องมือนี้ทำงานจริงทุกวัน",
    "Built by an architect who uses these tools in real work every day"
  ],
  [
    "Buildbybim.space พัฒนาโดยสถาปนิกที่ทำเครื่องมือสำหรับก่อสร้าง ออกแบบ และ AI workflow — ทุก tool เกิดจากปัญหาจริงในงาน ไม่ใช่จากการเดาความต้องการ",
    "Buildbybim.space is built by an architect creating tools for construction, design, and AI workflow — every tool comes from real work pains, not guesses."
  ],
  ["อ่าน Changelog", "Read changelog"],

  // FOOTER
  [
    "รวมเครื่องมือทำงานสำหรับก่อสร้าง ออกแบบ และ AI Workflow — เริ่มจาก tool เล็ก ต่อยอดเป็น workspace",
    "Productivity tools for construction, design, and AI workflow — start small, grow into a workspace."
  ]
];

// pre-sort by length DESC so a long phrase that contains a short phrase is replaced first
const SORTED_TH_TO_EN_PAIRS = [...TH_TO_EN_PAIRS]
  .filter((pair) => pair[0].length > 0)
  .sort((a, b) => b[0].length - a[0].length);

/**
 * แทนข้อความ TH → EN ในตัว body HTML แบบ literal-string replace
 * ปลอดภัยกับ HTML เพราะข้อความไทยไม่มีอยู่ใน attribute/tag ใด ๆ ในไฟล์ handoff
 * ใช้ split/join เพื่อเลี่ยง regex escape issue
 */
export function translateStylePreviewBody(
  body: string,
  language: StylePreviewLanguage
): string {
  if (language !== "en") {
    return body;
  }
  let result = body;
  for (const [th, en] of SORTED_TH_TO_EN_PAIRS) {
    if (!result.includes(th)) continue;
    result = result.split(th).join(en);
  }
  return result;
}
