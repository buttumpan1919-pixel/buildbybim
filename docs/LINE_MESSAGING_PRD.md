# LINE Messaging Integration — PRD

**Status**: Draft for planning (not yet implemented)
**Author**: Narongsak + Claude
**Last updated**: 2026-05-25
**Implementation target**: Sprint 11 (post-alpha tester recruit)

---

## 1. Vision

Thai construction workers live in LINE. **เปลี่ยนเว็ป Buildbybim จาก "tool ที่ต้องเปิด" เป็น "ผู้ช่วยที่อยู่ใน LINE chat อยู่แล้ว"**

วิสัยทัศน์: tester ส่งรูปงานหน้าไซต์ใน LINE chat — ระบบจัดเก็บ + tag + เชื่อมโครงการให้อัตโนมัติ. ไม่ต้องเปิดเว็ป ไม่ต้องสมัครเพิ่ม

---

## 2. Personas

### พี่ช่างต่าย (foreman, อายุ 45)
- ใช้ LINE 50+ ข้อความ/วัน, ใช้เว็ปแทบไม่ค่อยเป็น
- ถ่ายรูปงานวันละ 10-20 รูป
- เป็นคนตัดสินใจหน้างาน
- **Pain**: เปิดเว็ปแล้วงงว่าจะ upload รูปยังไง

### คุณวินัย (project manager, อายุ 32)
- ใช้ทั้ง LINE + เว็ป + Excel
- รับ report จากพี่ช่าง + ส่งต่อให้ลูกค้า
- **Pain**: ต้องรอพี่ช่างถ่ายรูป → ส่ง LINE → save → upload เว็ป

### เจ้าของบริษัท (อายุ 50+)
- เปิด LINE ดู report
- ไม่ touch เว็ปเลย
- **Pain**: ต้องรอ PM ทำ report → ส่งให้

---

## 3. Use cases (priority order)

### P0 — Photo capture (killer feature)
```
ส่งรูปใน LINE chat กับ OA
    ↓
ระบบ: save → Evidence asset → tag with sender's active project
    ↓
OA reply: "บันทึกแล้ว ✓ ดูที่ buildbybim.space/evidence"
```

### P0 — Status query
```
พิมพ์: "งบ" หรือ "/budget"
    ↓
OA reply: 
  "โครงการ บ้านคุณสมชาย (สถานะ: in progress)
   • งบรวม: 2,500,000 บาท
   • ใช้ไปแล้ว: 1,800,000 บาท (72%)
   • เหลือ: 700,000 บาท
   • แจ้งเตือน: หมวดงานระบบเกินงบ 5%"
```

### P1 — Quick action commands
```
พิมพ์: "/pr ปูนซีเมนต์ 50 ถุง"
    ↓
ระบบ: สร้าง PR draft → reply ลิงก์เปิดเว็ปดู/ยืนยัน
    ↓
OA reply: "สร้าง PR draft แล้ว: PR-0042
            ปูนซีเมนต์ 50 ถุง
            ตรวจสอบและยืนยันที่: buildbybim.space/procurement?pr=0042"
```

### P1 — Receipt OCR
```
ส่งรูปใบเสร็จ + caption "ค่าปูน 12500"
    ↓
ระบบ: OCR detect amount → confirm with sender →
       create cashflow entry draft
    ↓
OA reply: "บันทึก cashflow draft:
            ค่าปูน 12,500 บาท
            โครงการ: บ้านคุณสมชาย
            ยืนยัน → ตอบ 'OK' ภายใน 1 ชม."
```

### P2 — Daily digest push (เว็ป → LINE)
```
ทุกเช้า 8:00 น. OA push ให้ PM:
"📊 รายงานวันนี้ — 25 พ.ค.
 • โครงการ active: 3
 • PR รอ approve: 2
 • Defects ใหม่: 5 (severity high: 1)
 • Cashflow draft: 8 รายการรอ confirm
 [เปิด dashboard]"
```

### P2 — Voice note transcription
```
ส่ง voice note "ห้องน้ำชั้น 2 กระเบื้องแตก"
    ↓
ระบบ: Whisper transcribe → create defect draft
    ↓
OA reply: "สร้าง defect draft:
            'ห้องน้ำชั้น 2 กระเบื้องแตก'
            severity: ต้องระบุ — ตอบเลข 1-3"
```

### P3 — Group chat support
```
ใน group chat (PM + พี่ช่าง 5 คน) → mention @Buildbybim
    ↓
ทุกคนที่ link account แล้ว → message ของเขาจะ process แยกกัน
```

---

## 4. UX Flow — Account linking (one-time per user)

### Path A: QR code (recommended)

```
1. User login เว็ป (Google) → ไป /settings/connect-line
2. คลิก "Connect LINE" → เว็ปแสดง QR code
   - QR encode: https://line.me/R/oaMessage/@buildbybim/?
                 link%20BBB-1234-XYZ
   - Code "BBB-1234-XYZ" expires ใน 10 นาที, stored in `line_link_codes` table
3. User เปิดมือถือ → สแกน QR
   - LINE app เปิดอัตโนมัติ
   - แสดงข้อความ pre-filled: "link BBB-1234-XYZ"
   - User กดส่ง (1 tap)
4. Webhook รับ:
   {
     events: [{
       source: { userId: "U1234..." },
       message: { text: "link BBB-1234-XYZ" }
     }]
   }
5. Edge Function:
   a. Parse "link XXX" pattern
   b. Lookup code → website user → save mapping
   c. Reply: "เชื่อมสำเร็จ ✓ เริ่มใช้งานได้เลย"
6. กลับเข้าเว็ป → /settings แสดง "LINE connected: U1234... (Disconnect)"
```

### Path B: Manual code (fallback ถ้า scan ไม่ได้)

```
1. /settings/connect-line → แสดง code "BBB-1234-XYZ"
2. User เปิด LINE → add OA → ส่งข้อความ "link BBB-1234-XYZ"
3. Same as Path A step 4-6
```

### Path C: LINE Login OAuth (สำหรับ user ที่ต้องการ no-typing)

```
1. /settings/connect-line → คลิก "Login with LINE"
2. Redirect → LINE OAuth → consent
3. Callback: get LINE user ID จาก response
4. Save mapping → กลับ /settings
```

> Note: Path C requires custom Edge Function for OAuth dance (no Supabase Pro needed because we don't register LINE as Supabase Auth provider — just use the userId as data)

---

## 5. Technical Architecture

```
┌──────────────┐
│ LINE app     │
│ (user phone) │
└──────┬───────┘
       │ message
       ▼
┌──────────────────────┐
│ LINE Messaging API   │  Free 500 msg/month
│ messaging-api.line.me│
└──────┬───────────────┘
       │ POST webhook
       │ events[]
       ▼
┌─────────────────────────────┐
│ Supabase Edge Function       │  Free 500K invocations/mo
│ /functions/v1/line-webhook   │
│                              │
│ 1. Verify signature          │
│ 2. Parse events              │
│ 3. Lookup line_user_mappings │
│ 4. Dispatch by message type  │
│    - text → command parser   │
│    - image → evidence ingest │
│    - audio → transcribe      │
│ 5. INSERT/UPDATE Supabase    │
│ 6. Reply to LINE             │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────┐
│ Supabase Postgres    │
│ + Storage            │
│                      │
│ Tables:              │
│ - line_user_mappings │
│ - line_link_codes    │
│ - line_message_log   │
│ - evidence_assets    │
│ - cashflow_entries   │
│ - purchase_requests  │
└──────────────────────┘
```

---

## 6. Database schema (new tables)

### `line_user_mappings`
```sql
create table line_user_mappings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  line_user_id text not null unique,
  display_name text,
  linked_at timestamptz default now(),
  unlinked_at timestamptz,
  status text default 'active' check (status in ('active', 'unlinked'))
);
create index line_user_mappings_line_user_id_idx on line_user_mappings(line_user_id);
create index line_user_mappings_user_id_idx on line_user_mappings(user_id);
```

### `line_link_codes` (short-lived linking codes)
```sql
create table line_link_codes (
  code text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  expires_at timestamptz default (now() + interval '10 minutes'),
  used_at timestamptz
);
create index line_link_codes_expires_at_idx on line_link_codes(expires_at);
```

### `line_message_log` (audit + debugging)
```sql
create table line_message_log (
  id uuid primary key default gen_random_uuid(),
  line_user_id text not null,
  user_id uuid references auth.users(id),  -- null if user not linked yet
  event_type text not null,                -- "message", "follow", "unfollow"
  message_type text,                       -- "text", "image", "audio", etc.
  payload jsonb not null,                  -- raw event for debugging
  processed_at timestamptz default now(),
  outcome text,                            -- "evidence_created", "cmd_budget", "error", etc.
  error_message text
);
create index line_message_log_line_user_id_idx on line_message_log(line_user_id);
create index line_message_log_processed_at_idx on line_message_log(processed_at desc);
```

### RLS policies
```sql
-- Users can only see/edit their own LINE mapping
alter table line_user_mappings enable row level security;
create policy "users_select_own_mapping" on line_user_mappings
  for select using (auth.uid() = user_id);
create policy "users_delete_own_mapping" on line_user_mappings
  for delete using (auth.uid() = user_id);
-- Insert only via service_role from Edge Function

-- Link codes: user can only see their own
alter table line_link_codes enable row level security;
create policy "users_select_own_codes" on line_link_codes
  for select using (auth.uid() = user_id);

-- Message log: admin only (debugging)
alter table line_message_log enable row level security;
-- No public policies — service_role inserts, admins read via dashboard
```

---

## 7. LINE Platform setup (user does manually)

### 7.1 Create LINE Official Account
1. https://manager.line.biz/account/
2. "Create new account" → Type: **Standard** (free plan)
3. Account name: `Buildbybim`
4. Category: Construction / Software
5. Save → get **OA Channel ID**

### 7.2 Create Messaging API channel
1. https://developers.line.biz/console/
2. Select Provider (or create new) → Create channel → **Messaging API**
3. Link to OA created in 7.1
4. Settings → Messaging API:
   - **Use webhook**: Enabled
   - **Webhook URL**: `https://mnanqmmgniaqpvkzupmn.supabase.co/functions/v1/line-webhook`
   - **Auto-reply messages**: Disabled (we handle all replies)
   - **Greeting messages**: Optional
5. Copy:
   - **Channel access token** (long-lived) — for replying
   - **Channel secret** — for verifying webhook signatures

### 7.3 Enable LINE features
- Profile API: scope `profile` (read user display name + avatar)
- (Future) Rich menu — quick action buttons in chat

---

## 8. Implementation phases

### Phase 1: Foundation (1 sprint)
- [ ] Create 3 tables + RLS
- [ ] Build `/settings/connect-line` page with QR generator
- [ ] Deploy `line-webhook` Edge Function
- [ ] Implement linking flow (Path A: QR scan)
- [ ] Reply messages: link success, unknown user prompt

### Phase 2: Photo ingest (1 sprint)
- [ ] Webhook: handle `message.type = "image"`
- [ ] Download image via LINE API
- [ ] Upload to Supabase Storage (evidence-files bucket)
- [ ] Create `evidence_assets` row linked to sender's active project
- [ ] Reply: "บันทึกแล้ว ✓"

### Phase 3: Status queries (1 sprint)
- [ ] Command parser: `งบ`, `/budget`, `/projects`, `/pr`, `/help`
- [ ] Query Supabase → format Thai reply
- [ ] Reply with Flex Message (rich card) for projects list

### Phase 4: Action commands (1 sprint)
- [ ] `/pr <item>` → create PR draft → reply with confirm link
- [ ] Receipt OCR (Cloud Vision API or GPT-4V) → cashflow draft
- [ ] Confirm flow: "ตอบ OK ภายใน 1 ชม."

### Phase 5: Push notifications (1 sprint)
- [ ] Daily digest at 8 AM (cron Edge Function)
- [ ] High-severity defect alert (real-time push)
- [ ] PR approval request (push to approver)

### Phase 6: Group chat support (1 sprint)
- [ ] Handle group chat events
- [ ] @mention detection
- [ ] Multi-user routing in group

---

## 9. Cost analysis

### Free tier (sufficient for alpha)
| Item | Limit | Our expected usage |
|---|---|---|
| LINE Messaging API | 500 messages/month | Alpha 10 users × 10 msg/day × 30 = 3000 msg/mo ⚠️ |
| Supabase Edge Functions | 500K invocations/mo | <50K with 10 users |
| Supabase Storage | 1 GB | ~500 photos for 10 users |
| Supabase Database | 500 MB | <100 MB for alpha |

⚠️ **LINE 500 msg/month จะหมดเร็ว** ถ้า 10 active users
→ Solution: upgrade LINE OA to "Light" plan (5,000 msg/month) — free first 5,000 then pay

### Estimated monthly cost
- Alpha (≤10 users): **$0**
- Beta (50 users): **$0-9** (LINE Light plan if needed)
- Production (500 users): **~$25-50/mo** (Supabase Pro + LINE Pro plan)

---

## 10. Open questions (need decisions before Phase 1)

1. **Active project detection** — when sender ส่งรูป → ผูกเข้าโครงการไหน?
   - Option A: Each user has 1 "active project" set in /settings (simple)
   - Option B: User caption "@project-name" in message (flexible but error-prone)
   - Option C: AI guess from photo content (slow + unreliable for now)
   - **Recommendation**: A for Phase 1, B for Phase 2, skip C

2. **Multiple workspaces per user** — what if user is in 2 workspaces?
   - Decision: linking is workspace-scoped, user picks workspace at /settings/connect-line

3. **Privacy** — message log retention?
   - Decision: 30 days for non-photo events, 1 year for photo references (RGPD/PDPA-friendly)

4. **OA reply tone** — formal vs casual?
   - Decision: Thai casual but professional ("บันทึกแล้วครับ" not "ได้รับข้อความแล้ว")

5. **Error reporting to user** — how much detail to leak?
   - Decision: friendly Thai error + internal tag, full stack in line_message_log

6. **Multi-language replies** — Thai default but EN if user prefers?
   - Decision: Phase 1 = TH only, Phase 3 = check user.language

7. **Rich menu in OA** — yes/no?
   - Decision: Phase 5 — add buttons: "ดู dashboard", "/budget", "ขอช่วยเหลือ"

---

## 11. Success metrics

### Phase 1 (linking)
- Time-to-link per user: <60 seconds
- Linking success rate: >90%

### Phase 2-3 (photo + queries)
- % of photos that come via LINE (vs web upload): target >50%
- Query response latency: <3 seconds (p95)
- "งบ" command usage: >5/week per active user

### Long-term
- Daily active users on LINE: target >70% of paid users
- User retention boost: +30% vs web-only baseline
- "I told a friend about this" rate: +50%

---

## 12. Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| LINE API rate limit hit | Medium | High (users blocked) | Upgrade to Light plan ($9/mo) at 50 users |
| Webhook downtime → message lost | Low | Medium | LINE retries 3x; Edge Function alerts |
| User links wrong account | Medium | Low (user can unlink) | Confirm step in linking flow |
| OCR misreads receipt amount | High | Medium | Always require confirm ("ตอบ OK") |
| Spam in OA chat | Low | Low | Block unknown LINE users at webhook |

---

## 13. Out of scope (won't do)

- LINE Pay integration (use external)
- LINE Login as primary auth (use Google + linking only)
- LINE Notify (deprecated by LINE)
- Channel migration tool (one OA = one workspace for now)
