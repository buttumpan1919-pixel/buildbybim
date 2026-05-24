# Deploy Guide — Buildbybim.space → Public Web

ตั้งแต่ commit แรกถึงเว็ปออนไลน์รับ alpha tester — ใช้เวลารวม ~45 นาที, ค่าใช้จ่าย **$0** (ทุก service ใช้ free tier)

---

## สิ่งที่ต้องเตรียม (5 นาที ก่อนเริ่ม)

| Service | สมัครที่ | ใช้ login อะไร |
|---|---|---|
| GitHub | https://github.com/signup | email + password |
| Netlify | https://app.netlify.com/signup | "Sign up with GitHub" (เร็วสุด) |
| Supabase | https://supabase.com/dashboard (มีแล้ว) | account เดิม |

> 💡 **แนะนำ**: สมัคร Netlify ด้วยปุ่ม "Sign up with GitHub" — ไม่ต้องตั้ง password ใหม่ + step 3 จะเร็วกว่า

---

## Step 1 · Push code ขึ้น GitHub (10 นาที)

### 1.1 สร้าง repo ใหม่บน GitHub

1. เปิด https://github.com/new
2. Repository name: `buildbybim` (หรือชื่ออะไรก็ได้)
3. Visibility: **Private** (แนะนำ — alpha ยังไม่อยากให้คู่แข่งเห็น code)
4. **อย่า** ติ๊ก "Add a README", "Add .gitignore", "Choose a license" — เรามีไฟล์เหล่านี้แล้ว
5. กด "Create repository"

### 1.2 เชื่อม local repo กับ GitHub

หน้า GitHub จะแสดงคำสั่ง 3 บรรทัด — copy ทั้งหมดมาวางใน PowerShell ที่ folder โปรเจกต์:

```powershell
cd C:\Users\101760\Documents\Buildbybim.space
git remote add origin https://github.com/<your-username>/buildbybim.git
git branch -M main
git push -u origin main
```

GitHub จะถาม login — login ผ่าน browser pop-up (GitHub CLI auth)

**ตรวจสอบ**: รีเฟรชหน้า repo บน GitHub — ต้องเห็นไฟล์ทั้งหมด

---

## Step 2 · Setup Supabase database (10 นาที)

### 2.1 รัน schema migration

1. เปิด https://supabase.com/dashboard/project/mnanqmmgniaqpvkzupmn/sql/new
2. เปิดไฟล์ `supabase/migrations/_all-in-one.sql` (ใน VSCode)
3. Copy ทั้งไฟล์ (Ctrl+A, Ctrl+C) → paste ลง SQL Editor
4. กดปุ่ม "Run" (มุมขวาล่าง)
5. รอ ~30 วินาที — ควรเห็น "Success. No rows returned"

**ถ้า error**: copy error message มาให้ผมดู — อย่ารัน partial migration

### 2.2 สร้าง Storage bucket (สำหรับรูปหน้างาน)

> Bucket `evidence-files` ถูกสร้างใน migration แล้ว — ข้าม step นี้ยกเว้นเห็น error

ตรวจสอบ: เปิด https://supabase.com/dashboard/project/mnanqmmgniaqpvkzupmn/storage/buckets — ต้องเห็น `evidence-files` (private)

### 2.3 บันทึก API keys

1. เปิด https://supabase.com/dashboard/project/mnanqmmgniaqpvkzupmn/settings/api
2. Copy 2 ค่านี้ไว้ (ใช้ใน Step 4):
   - **Project URL** — `https://mnanqmmgniaqpvkzupmn.supabase.co`
   - **anon / public key** — `eyJhbGciOiJIUzI1NiIs...` (ยาวมาก ขึ้นต้นด้วย eyJ)
3. **อย่า** copy `service_role` key — ไม่ใช่ก็พอ

---

## Step 3 · Connect Netlify (10 นาที)

### 3.1 สมัคร Netlify + import repo

1. เปิด https://app.netlify.com/signup
2. กด "Sign up with GitHub" — authorize ให้ Netlify อ่าน repo ของคุณ
3. หลัง login เสร็จ → กด "Add new site" → "Import an existing project"
4. เลือก "Deploy with GitHub" → เลือก repo `buildbybim`
5. Netlify อ่าน `netlify.toml` อัตโนมัติ — ไม่ต้องตั้ง build command (`npm run build` แล้ว publish `dist/`)
6. **ยังอย่ากด "Deploy"** — ไปตั้ง env vars ก่อน (Step 4)

### 3.2 ตั้ง env vars

ก่อนกด Deploy:

1. ในหน้า import → กดปุ่ม "Show advanced" → "New variable" 3 ตัว:

| Key | Value |
|---|---|
| `VITE_SUPABASE_URL` | (Project URL จาก Step 2.3) |
| `VITE_SUPABASE_ANON_KEY` | (anon key จาก Step 2.3) |
| `VITE_SUPABASE_SYNC_ENABLED` | `true` |

2. กด "Deploy" → รอ ~2 นาที (Netlify จะ npm install + npm run build)

### 3.3 ตรวจสอบ deploy

1. Status เปลี่ยนจาก "Building" → "Published" = สำเร็จ
2. URL จะเป็นแบบ `https://random-name-12345.netlify.app`
3. เปิด URL → ต้องเห็นหน้า landing page Buildbybim.space

**ถ้า build fail**: เปิด Netlify → Deploys → click deploy ที่ fail → ดู log → copy error มาให้ผม

---

## Step 4 · Verify everything works (5 นาที)

ทดสอบ 4 จุดสำคัญ:

| ทดสอบ | URL | คาดหวัง |
|---|---|---|
| Landing | `https://xxx.netlify.app/` | หน้าแนะนำ Buildbybim |
| Workspace shell | `https://xxx.netlify.app/hub` | Hub + checklist 4 ขั้นตอน |
| PWA manifest | `https://xxx.netlify.app/manifest.webmanifest` | JSON ไม่ใช่ 404 |
| Service worker | `https://xxx.netlify.app/sw.js` | JavaScript ไม่ใช่ 404 |

ทดสอบ camera flow บนมือถือ:

1. เปิด `https://xxx.netlify.app/` บนมือถือ Android/iOS
2. Chrome menu → "Install app" (Android) หรือ Safari → "Add to Home Screen" (iOS)
3. เปิดแอพจาก home screen → ต้องเป็น full-screen ไม่มี browser bar
4. ไป `/evidence?tab=intake` → กด "Take photo" → กล้องหลังเปิด → ถ่าย → upload ขึ้น cloud ✅

---

## Step 5 · (Optional) Custom domain — ทำทีหลังได้

ยังไม่จำเป็นต้องซื้อ `Buildbybim.space` วันนี้ — `xxx.netlify.app` ใช้ส่งให้ alpha tester ได้เลย

ถ้าวันที่ alpha ทดสอบดีและอยากเปิดสาธารณะจริง:

1. **ซื้อ domain** — แนะนำ Cloudflare ($9/ปี) หรือ Namecheap ($12/ปี)
2. Netlify → Domain settings → Add custom domain → `Buildbybim.space`
3. Cloudflare/registrar → DNS settings → เพิ่ม:
   - Type: `A`, Name: `@`, Value: `75.2.60.5`
   - Type: `CNAME`, Name: `www`, Value: `<your-site>.netlify.app`
4. รอ DNS propagate (5-60 นาที) → SSL cert ออกอัตโนมัติ

---

## Checklist สำหรับวันเปิด

- [ ] Step 1: GitHub repo สร้างแล้ว + push commit แรก
- [ ] Step 2.1: Supabase schema migration รันแล้ว (1672 บรรทัด)
- [ ] Step 2.2: bucket `evidence-files` เห็นใน Storage
- [ ] Step 2.3: บันทึก URL + anon key
- [ ] Step 3.1: Netlify site สร้างแล้ว + connect กับ GitHub
- [ ] Step 3.2: env vars 3 ตัวตั้งแล้ว
- [ ] Step 3.3: build "Published"
- [ ] Step 4: ทดสอบ 4 URL + PWA install + camera ผ่าน
- [ ] (Optional) Step 5: domain ซื้อ + DNS ชี้

---

## ปัญหาที่เจอบ่อย

**"Build failed: tsc command not found"**
→ Netlify ต้อง install dev dependencies — เพิ่ม env var `NPM_FLAGS = --include=dev`

**"401 Unauthorized" เมื่อ sign up**
→ ค่า `VITE_SUPABASE_ANON_KEY` ใส่ผิด หรือยังไม่ได้รัน migration 0001 → ตรวจที่ Supabase → Authentication → ต้องเห็น "buildbybim" schema

**"Camera ไม่เปิด" บนมือถือ**
→ PWA ต้องเป็น HTTPS — Netlify ให้ HTTPS อัตโนมัติ ถ้าใช้ URL `netlify.app` แล้วยังไม่ทำงาน → restart browser

**"Sync tables (2-way)" ใน /admin error**
→ ตรวจว่า env var `VITE_SUPABASE_SYNC_ENABLED=true` ตั้งไว้ใน Netlify dashboard (case-sensitive)

---

## Next: Alpha tester recruitment

หลังเว็ปออนไลน์:

1. ส่ง URL ให้ตัวเองก่อน — ทดสอบ end-to-end
2. ทำเว็ปข้อมูล: "Login → Hub → ทำตาม checklist 4 ขั้น → ดู dashboard" รวม < 10 นาที
3. เปิด text ที่ผมเขียนให้ใน chat ก่อนนี้ → copy ไป Gmail compose → ส่งให้ alpha tester 3-5 ราย
4. นัด demo call 30 นาทีกับแต่ละราย (เวลาที่ผมเช็คใน Calendar: อังคาร 26 พ.ค. – อังคาร 2 มิ.ย. ทุกวันเวลา 10:00-17:00 น.)
