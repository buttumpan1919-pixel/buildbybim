# OAuth Setup Guide — Google + LINE + Email magic link

ต้องตั้ง 3 จุดให้ครบก่อน login จะใช้งานได้จริง

---

## Step 1 · Supabase URL Configuration (ทำก่อนทุกอย่าง — 2 นาที)

ถ้าไม่ตั้ง: magic link / OAuth callback ทั้งหมด **fail** เพราะ Supabase reject redirect ที่ไม่อยู่ใน allowlist

1. เปิด: https://supabase.com/dashboard/project/mnanqmmgniaqpvkzupmn/auth/url-configuration
2. ตั้ง **Site URL**: `https://buildbybimspace.netlify.app`
3. **Redirect URLs** → กด "Add URL" ทีละค่า:
   - `https://buildbybimspace.netlify.app/account`
   - `https://buildbybimspace.netlify.app/**`
   - `http://localhost:5173/account` (สำหรับ dev local)
   - `http://localhost:5173/**`
4. กด **Save**

---

## Step 2 · Google OAuth (~15 นาที)

### 2.1 สร้าง OAuth credentials บน Google Cloud

1. เปิด: https://console.cloud.google.com/apis/credentials
2. ถ้ายังไม่มี project → กดมุมซ้ายบน → "New Project" → ตั้งชื่อ "Buildbybim auth"
3. ใน Credentials page → กด **"+ Create Credentials"** → **"OAuth client ID"**
4. ถ้ามี dialog "Configure consent screen" ขึ้นมา:
   - User Type: **External**
   - App name: `Buildbybim.space`
   - User support email: ของคุณ
   - Developer contact: ของคุณ
   - กด "Save and Continue" ผ่านทุกหน้า → กลับมาที่ Credentials
5. กลับมาที่ "Create OAuth client ID":
   - Application type: **Web application**
   - Name: `Buildbybim Web`
   - Authorized JavaScript origins → เพิ่ม:
     - `https://buildbybimspace.netlify.app`
     - `https://mnanqmmgniaqpvkzupmn.supabase.co`
   - Authorized redirect URIs → เพิ่ม:
     - `https://mnanqmmgniaqpvkzupmn.supabase.co/auth/v1/callback`
6. กด **Create** → จะเห็น dialog แสดง:
   - **Client ID** (ขึ้นต้นด้วยตัวเลข ตามด้วย `.apps.googleusercontent.com`)
   - **Client Secret** (ขึ้นต้นด้วย `GOCSPX-`)
7. **Copy ทั้ง 2 ค่าเก็บไว้** — ใช้ในขั้น 2.2

### 2.2 Enable Google ใน Supabase

1. เปิด: https://supabase.com/dashboard/project/mnanqmmgniaqpvkzupmn/auth/providers
2. หา row **"Google"** → กดเปิด toggle "Enable Sign in with Google"
3. ใส่ค่า:
   - **Client ID**: (paste จาก Google Cloud)
   - **Client Secret**: (paste จาก Google Cloud)
4. **Callback URL (for OAuth)** — copy ค่านี้ไว้ ปกติคือ `https://mnanqmmgniaqpvkzupmn.supabase.co/auth/v1/callback`
   - ตรวจว่า callback ใน Google Cloud (ขั้น 2.1) ตรงกับนี้
5. กด **Save**

### 2.3 ทดสอบ

1. เปิด incognito → https://buildbybimspace.netlify.app/account
2. กด "เข้าสู่ระบบด้วย Google" → redirect ไป Google → consent → กลับมา /account → login สำเร็จ

---

## Step 3 · LINE OAuth (~30 นาที — ยากที่สุด เพราะไม่ใช่ Supabase built-in)

LINE Login ใช้ **OpenID Connect (OIDC)** — Supabase รองรับผ่าน "Custom OIDC provider" (ต้อง Supabase Pro plan สำหรับ production, หรือใช้ workaround ผ่าน Edge Function)

### 3.1 สร้าง LINE Login Channel

1. เปิด: https://developers.line.biz/console/
2. Login ด้วย LINE account ของคุณ (ของบริษัทถ้ามี)
3. ถ้ายังไม่มี Provider → กด "Create" → ตั้งชื่อ "Buildbybim"
4. ใน Provider → กด "Create channel" → เลือก **"LINE Login"**
5. กรอกข้อมูล:
   - Channel name: `Buildbybim.space`
   - Channel description: เครื่องมือทำงานสำหรับผู้รับเหมา
   - App types: ติ๊ก **"Web app"**
   - Email + ข้อตกลง → ติ๊ก agree
6. กด Create
7. ในหน้า Channel ที่สร้างใหม่ → tab **"Basic settings"**:
   - Copy **Channel ID** + **Channel secret**
8. tab **"LINE Login"**:
   - Callback URL → เพิ่ม: `https://mnanqmmgniaqpvkzupmn.supabase.co/auth/v1/callback`
   - OpenID Connect → ติ๊ก enable + เลือก scopes: `profile`, `openid`, `email`

### 3.2 Enable LINE ใน Supabase (Custom OIDC)

⚠️ **ต้อง Supabase Pro plan** ($25/เดือน) สำหรับ custom OIDC ใน production. Free tier ใช้ได้แค่ test (limit 50 users)

1. เปิด: https://supabase.com/dashboard/project/mnanqmmgniaqpvkzupmn/auth/providers
2. เลื่อนหา **"Sign in with LinkedIn (OIDC)"** หรือ **"Generic OIDC"** (ขึ้นกับ version Supabase)
3. ถ้าไม่มี LINE option → ต้องใช้วิธี **Custom OAuth via Edge Function** (advanced — เก็บไว้ทำหลัง)
4. กรอก:
   - Issuer URL: `https://access.line.me`
   - Client ID: (Channel ID จาก LINE)
   - Client Secret: (Channel secret จาก LINE)
   - Authorization URL: `https://access.line.me/oauth2/v2.1/authorize`
   - Token URL: `https://api.line.me/oauth2/v2.1/token`
   - User Info URL: `https://api.line.me/v2/profile`
5. Save

### 3.3 ทดสอบ

เหมือน Google — กดปุ่ม "เข้าสู่ระบบด้วย LINE" → redirect ไป LINE → กลับมา /account

---

## ⚠️ ถ้าเหนื่อยกับ LINE — แนะนำ skip ไปก่อน

ถ้า setup LINE แล้วยังไม่ work, **ปิดปุ่ม LINE ใน UI ก่อน** แล้วใช้แค่ Google + Magic link + Guest mode:

- Google = หลัก (คน 80% มี Google account อยู่แล้ว)
- Magic link = สำรอง (ไม่ต้องมี Google)
- Guest = ทดลองใช้ทันที (ไม่ต้องสมัคร)

วิธีปิดปุ่ม LINE: comment out block button LINE ใน `src/PublicSite.tsx` (รอบ AccountSignInCard) → push → Netlify auto-redeploy

---

## Troubleshooting

**"redirect_uri_mismatch" error จาก Google**
→ ตรวจ Authorized redirect URI ใน Google Cloud Console ต้องตรงเป๊ะกับ `https://mnanqmmgniaqpvkzupmn.supabase.co/auth/v1/callback`

**Magic link ส่งแล้วไม่เข้าใจ inbox**
→ ตรวจ spam folder + ตรวจ Site URL ใน Supabase ตั้งถูกต้อง

**login สำเร็จแล้วเด้งกลับเป็น guest**
→ Redirect URLs ใน Supabase ยังไม่ allowlist URL ที่ Netlify ให้ → กลับไปทำ Step 1

**ปุ่ม LINE กดแล้วเห็น "Unsupported provider"**
→ Supabase Free tier ไม่รองรับ custom OIDC → upgrade Pro หรือ skip LINE ไปก่อน
