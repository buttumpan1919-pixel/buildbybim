# Buildbybim.space

## โครงหลายแอป

โปรเจกต์นี้มี `Work Hub` เป็น shell หลัก และเก็บรายการแอปไว้ที่ `src/apps.ts`

- `hub` คือหน้าเลือกเครื่องมือรวม
- `builddocs` คือแอปเอกสารเดิมที่ใช้งานได้แล้ว
- `boqData`, `designStudio`, `library` เป็น prototype app card สำหรับ BOQ database, Render Prompt Studio และคลังข้อมูล
- `cashflow`, `clientOps` เป็น slot สำหรับพัฒนาเครื่องมือแยกต่อไป
- `debtPlanner` ยังเป็น placeholder เดิมใน code แต่ไม่ใช่ scope ของเว็บแอปนี้ตอนนี้

เวลาเพิ่มแอปใหม่ ให้เพิ่ม manifest ใน `src/apps.ts` แล้วสร้าง component/state/storage ของแอปนั้นแยกจาก BuildDocs เพื่อให้พัฒนาไปพร้อมกันได้โดยไม่ชนกัน

เว็บแอปเอกสารสำหรับผู้รับเหมา ใช้ทำใบเสนอราคา ใบแจ้งหนี้ ใบเสร็จรับเงิน และร่างสัญญารับเหมาก่อสร้าง

## ใช้งานในเครื่อง

```bash
npm install
npm run dev
```

เปิด `http://127.0.0.1:5173/`

## ฟีเจอร์ใน MVP

- แก้ข้อมูลลูกค้า โครงการ เลขเอกสาร วันที่ และหมายเหตุ
- เพิ่ม/ลบ/แก้รายการงาน จำนวน หน่วย ราคา
- คำนวณ VAT 7% และหัก ณ ที่จ่าย 3%
- จัดงวดชำระเงิน
- เลือกงวดงานเพื่อออกใบวางบิล/ใบแจ้งหนี้เฉพาะงวด
- ใช้หน้าสัญญาเพื่อดูงวดงานและสร้างใบวางบิลจาก milestone
- หน้าเมนูด้านซ้ายเชื่อมกับข้อมูลจริง: เอกสาร, สัญญา, Google Sheet, ลูกค้า, โครงการ, ต้นทุน, ตั้งค่า
- สร้างร่างสัญญารับเหมา 4 รูปแบบ
- นำเข้ารายการงานจาก Google Sheet ที่ export/publish เป็น CSV
- บันทึกเอกสารหลายฉบับอัตโนมัติใน `localStorage`
- สร้างเอกสารใหม่ คัดลอกเอกสารเดิม และเปิดเอกสารที่บันทึกไว้จากแถบซ้าย
- export/import backup เป็นไฟล์ `.json` สำหรับย้ายเครื่องหรือสำรองข้อมูล
- พิมพ์หรือบันทึกเป็น PDF ผ่าน browser print dialog
- แชร์ข้อความสรุปผ่าน Web Share หรือคัดลอกข้อความสำรอง

## Google Sheet format

Sheet ต้องมี header อย่างน้อย:

```csv
รายการ,หน่วย,จำนวน,ราคา/หน่วย
งานปูกระเบื้องพื้น,ตร.ม.,48,520
```

รองรับ header อังกฤษบางคำ เช่น `name`, `unit`, `qty`, `price`

## Build production

```bash
npm run build
npm run preview
```

## Deploy ไป Netlify

```bash
npm run deploy:netlify
```

ถ้าจะขึ้น production:

```bash
npm run deploy:netlify:prod
```

ต้อง login Netlify CLI ก่อนด้วย `npx netlify login`

## ข้อจำกัดก่อนใช้เชิงพาณิชย์

- Google Sheet ส่วนตัวที่ต้อง login ยังไม่รองรับ ต้องเพิ่ม OAuth/backend ภายหลัง
- PDF ใช้ browser print dialog ยังไม่ใช่ PDF engine ฝั่ง server
- ร่างสัญญาควรให้ผู้รู้กฎหมายตรวจรายละเอียดก่อนใช้ลงนามจริง
- ยังไม่มีระบบผู้ใช้หลายคนหรือ sync ฐานข้อมูลกลาง
