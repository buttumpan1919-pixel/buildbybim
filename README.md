# Buildbybim.space

แพลตฟอร์ม workspace สำหรับผู้รับเหมาก่อสร้างไทย — ทำใบเสนอราคา, จัดซื้อ, คุมต้นทุนโครงการ, รายงานหน้างาน และเอกสารทั้งหมดในที่เดียว

**Status**: v0.4.28 · 580/580 tests pass · พร้อม deploy
**Live**: (จะมี URL หลัง Netlify deploy)

---

## ทำอะไรได้บ้าง

### ERP loop ครบวงจร (Sprint 0-6)
```
สร้างโครงการ → ตั้งงบประมาณ + cost code → ขอซื้อ (PR) →
เทียบราคา supplier (RFQ) → เลือกผู้ขาย → บันทึก cashflow จริง →
Dashboard 7 KPIs (budget vs actual real-time) → รายงาน Excel
```

### Workspace 12 apps
| App | ใช้ทำอะไร |
|---|---|
| Hub | หน้ารวมเข้าทุก app + checklist 4 ขั้นตอน first-run |
| Projects | สร้าง/แก้โครงการ + ตั้งงบ + RBAC ระดับโครงการ |
| Cost Codes | 100 รายการมาตรฐาน (โครงสร้าง/สถาปัตย์/งานระบบ) + import CSV จาก Builk |
| Suppliers | คลังผู้ขาย + ประวัติเสนอราคา |
| Procurement | PR + RFQ multi-supplier + approval workflow |
| Cashflow | บันทึกเข้า/ออก + ผูกโครงการ/cost code + รายเดือน |
| Project Control | Dashboard + alert เกินงบ + เลย deadline + 5 รายงาน Excel |
| Approvals | Approval Center workflow รวม + audit log |
| Evidence/Defects | รายงานหน้างาน + ถ่ายรูปจากมือถือ + Plan Pin board 360 |
| Construction Planner | Gantt + BOQ จาก Excel + sync เข้า baseline |
| BuildDocs | ใบเสนอราคา/ใบแจ้งหนี้/สัญญา/ใบเสร็จ พิมพ์/PDF |
| Social Feed | Facebook-style activity feed สำหรับทีม |

### Mobile-ready (Sprint 10A-B)
- **PWA install** — Add to home screen ทั้ง Android + iOS Safari 16.4+
- **Camera capture** หน้างาน — กล้องหลังเปิดทันที, upload ขึ้น Supabase Storage
- **Offline shell** — service worker cache app shell, ใช้งานออฟไลน์ได้
- **2-way sync** — มือถือไซต์ + laptop ออฟฟิศข้อมูลตรงกัน (last-write-wins)

---

## Deploy ขึ้น web ใน 45 นาที ($0)

ดู [`docs/DEPLOY.md`](docs/DEPLOY.md) — guide click-by-click ทุก step:

```
1. GitHub repo (private)         · 10 นาที
2. Supabase migrations           · 10 นาที
3. Netlify connect + deploy      · 10 นาที
4. Verify PWA + camera flow      ·  5 นาที
```

ทุก service ใช้ free tier — ไม่มีค่าใช้จ่ายตอน alpha

---

## Tech stack

```
Frontend:  Vite + React 19 + TypeScript 5 + IBM Plex Sans Thai
State:     pure TS domain modules + StorageAdapter pattern
Storage:   localStorage (offline-first) → Supabase (multi-device sync)
Auth:      Supabase Auth (email + magic link)
Tests:     Vitest 580 tests
Deploy:    Netlify (static + SPA redirect) + Supabase (Postgres + Storage)
```

**Architecture**: pure TS domain → StorageAdapter → localStorage / Supabase. ทุก app testable แบบ unit, RN-portable (React Native ในอนาคต)

---

## Dev locally

```bash
npm install
npm run dev        # http://127.0.0.1:5173/
npm test           # vitest in watch mode
npm test -- --run  # one-shot run
npm run build      # production bundle to dist/
npm run preview    # serve dist/ locally for QA
```

ไฟล์ env: copy `.env.example` → `.env`, ใส่ค่า Supabase project URL + anon key (ดู [`docs/SUPABASE_SETUP.md`](docs/SUPABASE_SETUP.md))

---

## เอกสาร PRD/Architecture

อยู่ใน `docs/` — สำคัญที่สุด:
- [`docs/PRD.md`](docs/PRD.md) — master spec รวม app-by-app
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — module/data layer
- [`docs/DEPLOY.md`](docs/DEPLOY.md) — คู่มือเปิด production
- [`docs/SUPABASE_SETUP.md`](docs/SUPABASE_SETUP.md) — schema + RLS + Storage
- [`docs/TASKS.md`](docs/TASKS.md) — done log + roadmap

---

## ติดต่อ alpha tester

อยากลองใช้กับโครงการจริง? ส่งอีเมล narongsak.bimtts2004@gmail.com แจ้งว่า:
- ทำงานอะไร (ผู้รับเหมา / สถาปนิก / project manager)
- โครงการขนาดไหน (ส่งให้ดูได้ฟรีระหว่าง alpha)

ฟีดแบ็คแรกๆ เรารับเข้า roadmap ก่อน ใช้ฟรีตลอด alpha period

---

## License

Proprietary · all rights reserved. ติดต่อก่อนใช้ในเชิงพาณิชย์
