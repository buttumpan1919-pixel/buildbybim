# Analysis - The Secret Sauce EP.653 Builk Interview

Updated: 2026-05-24
Source: https://www.youtube.com/watch?v=bGS3HUNbBbo
Input note: ใช้คู่กับ `docs/THE_SECRET_SAUCE_EP653_BUILK_TRANSCRIPT_NOTES.md`
Status: วิเคราะห์เชิงธุรกิจ สินค้า และแนวทางต่อยอดสำหรับ Buildbybim.space

## 1. Executive Takeaway

คลิปนี้ไม่ใช่แค่เรื่อง Builk ทำ software ให้ผู้รับเหมา แต่เป็น case study เรื่องการเปลี่ยนอุตสาหกรรมก่อสร้างจากระบบที่พึ่งพาความจำ กระดาษ ความสัมพันธ์ และราคาต่ำสุด ไปสู่ระบบที่มีข้อมูลจริงของโครงการเป็นแกนกลาง

แก่นที่ควรจำ:

- ปัญหาก่อสร้างไทยคือ productivity problem ไม่ใช่แค่ปัญหาคนทำงานไม่ดี
- software ที่ดีต้องเปลี่ยน workflow และ behavior ไม่ใช่แค่เพิ่มแบบฟอร์ม
- construction ERP ต้องเริ่มจาก project-cost-cashflow spine
- ข้อมูลหน้างานคือฐานของ quality, finance, insurance, trust และ carbon accounting
- โมเดลธุรกิจต้องเข้ากับ cash flow จริงของผู้รับเหมา SME

## 2. Problem Structure

### 2.1 Surface pain

สิ่งที่ผู้บริโภคและประชาชนเห็น:

- ถนนและไซต์งานล่าช้า
- บ้าน/คอนโดมี defect จำนวนมาก
- งานซ่อม/เก็บงานวนซ้ำ
- โครงการรัฐและโครงสร้างพื้นฐานใช้งบและเวลามากกว่าที่คาด
- งานก่อสร้างกระทบความปลอดภัยและสิ่งแวดล้อม

### 2.2 Root causes

สิ่งที่อยู่ใต้ผิว:

- procurement วัดที่ราคาต่ำมากกว่าคุณภาพรวม
- contractor SME คุม cash flow และต้นทุนรายโปรเจกต์ไม่แม่น
- ข้อมูล project progress อยู่กระจัดกระจายหรืออยู่ในหัวคน
- supply chain วัสดุไม่มี transparency และรายเล็กไม่มีอำนาจต่อรอง
- defect/rework ไม่ถูกวัดเป็นต้นทุนอย่างจริงจัง
- technology จากต่างประเทศอาจแพงเกินเศรษฐศาสตร์ไทย

### 2.3 Systemic impact

ผลลัพธ์ปลายทาง:

- ลูกค้าเสียเงินและเสียเวลา
- ผู้รับเหมาเสี่ยงขาดสภาพคล่อง
- developer เสีย margin และ trust
- ประเทศเสียโอกาสจาก infrastructure delay
- carbon และ waste เพิ่มจากการแก้งานและวัสดุเหลือใช้

## 3. Builk Strategy Map

### 3.1 Phase 1 - Founder pain to construction ERP

Builk เริ่มจากประสบการณ์ตรงของ founder ที่เคยเป็นผู้รับเหมา จึงเห็นว่า construction accounting ต้องมองรายโครงการ ไม่ใช่บัญชีรวมแบบ generic

Product implication:

- ERP ก่อสร้างควรเริ่มที่ `Project -> Budget -> Cost -> Cashflow -> Report`
- ถ้าไม่มี project-level accounting ระบบจะตอบ pain หลักไม่ได้

### 3.2 Phase 2 - Free cloud tool for SME adoption

Builk ใช้ free/cloud product เพื่อลดกำแพงการใช้เทคโนโลยีของ SME

บทเรียนคือ free ไม่ใช่เป้าหมายสุดท้าย แต่เป็น adoption strategy ที่ต้องมีทาง monetize ภายหลัง

Product implication:

- onboarding ต้องเบา
- workflow ต้องง่ายกว่า ERP เต็มรูปแบบ
- feature แรกควรแก้ pain ที่ผู้รับเหมารู้สึกทันที เช่น cashflow, cost overrun, defect evidence

### 3.3 Phase 3 - Data to supply chain

เมื่อมี user และ data แล้ว Builk ต่อไปที่ material procurement และ B2B commerce

เหตุผลคือผู้รับเหมารายเล็กซื้อของแพง ขาด volume และไม่รู้ราคาตลาด

Product implication:

- procurement ไม่ควรเป็น module แยกโดด ๆ
- PR/RFQ/PO ต้องผูกกับ project, cost code, supplier, budget และ actual cost
- data จาก procurement สามารถสร้าง price intelligence ได้ในอนาคต

### 3.4 Phase 4 - Startup reset to profitability

คลิปให้บทเรียนชัดว่า growth-only startup model เสี่ยง ถ้ายอดขายโตแต่ unit economics ยังไม่ดี

หลัง 2019-2020 Builk หันไป commercialize asset ที่มี และขยับตัวเองเป็น SME ที่มีนวัตกรรม

Product implication:

- Buildbybim.space ไม่ควรเริ่มจาก platform ใหญ่เกินกำลัง
- ต้องมี paid wedge ที่ขายได้ก่อน เช่น pay-per-project, paid export, paid report, paid AI review
- อย่าสร้าง feature จำนวนมากโดยไม่มีการใช้งานจริง

### 3.5 Phase 5 - Reality Capture and evidence layer

Reality Capture เป็นตัวอย่างสำคัญของการแปลงเทคโนโลยีแพงให้เหมาะกับไซต์ไทย

มูลค่าจริงไม่ได้อยู่ที่ภาพ 360 อย่างเดียว แต่อยู่ที่การมีหลักฐานเวลาจริงของไซต์เพื่อดู progress, quality, risk และ claim

Product implication:

- Buildbybim ควรสร้าง `EvidenceAsset` ก่อนสร้าง viewer ซับซ้อน
- evidence ต้องผูกกับ project, zone, date, task, defect, cost item และ responsible person
- AI สามารถมาทีหลังเพื่อช่วยสรุป progress หรือ detect issue จาก evidence

### 3.6 Phase 6 - Carbon accounting and green transformation

Builk วาง digital data เป็นพื้นฐานของ carbon accounting

แนวคิดนี้สำคัญมาก เพราะ carbon ของก่อสร้างไม่ได้วัดจากเอกสารท้ายโครงการอย่างเดียว แต่ต้องมาจากวัสดุ ปริมาณ งานซ้ำ waste และ operation data

Product implication:

- carbon module ไม่ควรเริ่มแยกเดี่ยว
- ควรเริ่มจาก BOQ/material quantity + supplier + evidence + waste
- ถ้ายังไม่มี cost/quantity spine carbon estimate จะไม่น่าเชื่อถือ

## 4. Buildbybim.space Implications

### 4.1 Build the project control spine first

ลำดับข้อมูลที่ควรเป็นแกน:

```text
Project
  -> Cost Code / BOQ Line
  -> Budget
  -> Procurement Request
  -> Supplier Quote
  -> Purchase Order
  -> Cost Entry
  -> Payment / Invoice
  -> Site Progress
  -> Defect / Evidence
  -> Dashboard / Report
```

ถ้า spine นี้ไม่แน่น การเพิ่ม AI, BIM, 360, carbon หรือ marketplace จะกลายเป็น feature ลอย ๆ

### 4.2 Reframe product messaging

อย่าขายคำว่า ERP เป็นตัวนำ ควรขาย outcome:

- รู้ต้นทุนจริงก่อนขาดทุน
- เห็นไซต์จริงโดยไม่ต้องโทรถาม
- ลด defect และงานแก้
- ทำเอกสารซื้อของและต้นทุนให้โยงกัน
- มีหลักฐานตอนคุยกับเจ้าของงาน ผู้รับเหมา supplier และธนาคาร

### 4.3 Pricing lesson

โมเดลรายเดือนต่อ user อาจไม่เหมาะกับผู้รับเหมา SME ทุกกลุ่ม เพราะรายได้เกิดเป็นรอบโปรเจกต์

ทางเลือกที่ควรทดสอบ:

| Model | เหมาะกับ | Caveat |
|---|---|---|
| Free workspace + paid project | contractor SME เริ่มใช้ | ต้องกำหนด free limit ชัด |
| Pay per project | งานรับเหมาเป็นรอบ | revenue ไม่สม่ำเสมอ |
| Paid report/export | คนที่ใช้จริงและต้องส่งงาน | ต้องทำ report ให้มีคุณค่าจริง |
| AI credit | งานสรุป defect/report/BOQ | ต้องควบคุมต้นทุน API |
| Team subscription | บริษัทที่มีงานต่อเนื่อง | อาจแพงสำหรับรายเล็ก |

### 4.4 Data moat should be operational, not profile-only

ถ้าจะทำ contractor profile หรือ marketplace อย่าเริ่มจากหน้าโปรไฟล์สวย ๆ

ควรเริ่มจาก data ที่เกิดจากการทำงานจริง:

- ส่ง daily report สม่ำเสมอหรือไม่
- defect close rate
- project delay pattern
- budget variance
- payment milestone discipline
- evidence completeness
- supplier response history

ข้อควรระวังคือ contractor scoring มีความเสี่ยงด้านความเป็นธรรม ความเป็นส่วนตัว และข้อพิพาท ต้องออกแบบให้เป็น internal trust signal ก่อน ไม่ควรเปิด public score เร็วเกินไป

## 5. Recommended Roadmap

### P0 - Project cost and evidence foundation

ทำให้ผู้ใช้เห็น project reality ก่อน:

- project-level BOQ/cost code
- budget vs actual
- cashflow per project
- daily progress log
- photo/evidence upload
- defect list with status
- simple dashboard

เป้าหมาย: ผู้ใช้ต้องตอบได้ว่าโครงการนี้กำไรไหม ล่าช้าไหม และหลักฐานอยู่ที่ไหน

### P1 - Procurement flow

เพิ่ม workflow ซื้อของ:

- PR
- RFQ
- supplier comparison
- PO
- cost entry from PO
- payment status

เป้าหมาย: ลดการซื้อของหลุด budget และทำให้ราคาวัสดุเริ่มกลายเป็น data

### P2 - Report and owner communication

สร้าง output ที่ผู้รับเหมาต้องส่ง:

- weekly progress report
- defect report
- cost variance report
- payment claim support
- owner-ready PDF/export

เป้าหมาย: ผู้ใช้จ่ายเงินเพราะระบบช่วยส่งงานและคุยกับเจ้าของงานง่ายขึ้น

### P3 - Reality capture lightweight

ยังไม่ต้องเริ่มจาก viewer หนัก:

- upload 360 photo/link
- map evidence to floor/zone
- timeline view
- compare current vs previous capture
- AI summarize progress from selected photos

เป้าหมาย: สร้าง site memory ก่อน ไม่ต้องแข่ง full 3D/360 platform ทันที

### P4 - Carbon and sustainability

เริ่มจาก estimate ที่อธิบายที่มาได้:

- BOQ quantity
- material type
- supplier/source
- waste/rework record
- transport distance optional
- carbon factor reference

เป้าหมาย: carbon report ที่ยังไม่ต้องสมบูรณ์ระดับ certification แต่พอให้ developer/owner เห็นทิศทาง waste และ embodied carbon

## 6. Feature Ideas Directly Inspired By The Interview

### 6.1 Project health score

คำนวณจาก:

- cost variance
- overdue tasks
- unresolved defects
- missing evidence
- payment delay
- procurement pending

ไม่ควรเรียกว่า contractor score ในช่วงแรก ให้เรียกว่า project health เพื่อลดความเสี่ยงด้านความสัมพันธ์

### 6.2 Cashflow guardrail

เตือนผู้รับเหมาเมื่อ:

- actual cost สูงกว่า planned cash-in
- เงินรับล่วงหน้าใกล้หมดก่อน milestone ถัดไป
- cost entry ไม่มี project/cost code
- PO ใหม่จะทำให้ budget line ติดลบ

### 6.3 Evidence-first daily report

ให้ foreman หรือทีมไซต์เพิ่มรูป/โน้ต/percent progress แล้วระบบสร้าง draft daily report อัตโนมัติ

ข้อมูลควรเชื่อมกับ task, zone, worker/team และ defect

### 6.4 Rework cost tracker

ทุก defect ควรมี optional cost/time impact:

- material cost
- labor hour
- responsible party
- root cause
- reopen count

นี่คือทางที่ใช้วัด waste 2.8% ในบริบทของ Buildbybim

### 6.5 Supplier price memory

บันทึกราคาที่เคยขอจาก supplier แล้วเทียบกับ BOQ/cost code เดิม เพื่อให้ผู้รับเหมาเห็นราคาผิดปกติเร็วขึ้น

## 7. Competitive Positioning

Buildbybim ไม่ควรแข่ง Builk ด้วยการ copy ทุก module ตรง ๆ

ตำแหน่งที่น่าชนะกว่า:

```text
Builk-like project cost control
+ BIM/document/evidence workspace
+ AI-assisted reporting and analysis
+ small-team friendly UX
+ Thai/English shared UI foundation
```

คำอธิบายสั้นสำหรับ product:

`Buildbybim.space` คือ workspace ที่ทำให้ทีมก่อสร้างเห็นต้นทุน งานหน้างาน เอกสาร และหลักฐานในที่เดียว แล้วใช้ AI ช่วยสรุปความเสี่ยงและทำรายงาน

## 8. Main Risks

| Risk | Why it matters | Mitigation |
|---|---|---|
| Data entry friction | ผู้รับเหมาจะเลิกใช้ถ้ากรอกเยอะ | เริ่มจาก mobile-first daily/evidence flow |
| Too many modules | ERP กว้างเกินจนทำไม่จบ | สร้าง spine ก่อน แล้วค่อยต่อ procurement/report |
| Weak monetization | free users ไม่จ่าย | ทดลอง paid report/pay-per-project ตั้งแต่ต้น |
| Trust score sensitivity | อาจกระทบชื่อเสียงผู้รับเหมา | ใช้ internal project health ก่อน |
| Carbon accuracy | ถ้าข้อมูลไม่ดี report ไม่น่าเชื่อถือ | เริ่มจาก estimate พร้อม source และ confidence |
| Builk parity trap | copy แล้วไม่แตกต่าง | ใช้ AI, BIM, evidence และ UX เป็น differentiation |

## 9. Decision For Buildbybim

ข้อสรุปที่ควรใช้ตัดสินใจ:

1. สร้าง `Project Control Spine` ก่อน feature สวยงาม
2. ทำ `EvidenceAsset` เป็นโมเดลกลางของไซต์งาน
3. ผูก `BOQ/CostCode -> Procurement -> Cost -> Cashflow` ให้ครบ
4. ใช้ AI กับ report, risk summary, defect note และ cost variance
5. ทดสอบ pricing แบบ pay-per-project หรือ paid report ก่อน subscription เต็มรูปแบบ

## 10. Next Development Candidates

### Option A - EvidenceAsset Foundation

เหมาะถ้าต้องการต่อยอด Reality Capture:

- data model สำหรับ evidence
- UI อัปโหลด/แนบหลักฐานใน project
- ผูก evidence กับ task/defect/cost
- simple timeline

### Option B - Project Cost Spine

เหมาะถ้าต้องการไปทาง ERP:

- project budget line
- project-scoped cost entry
- budget vs actual dashboard
- cashflow per project

### Option C - Daily Report + AI Summary

เหมาะถ้าต้องการ value ที่ผู้ใช้เห็นเร็ว:

- daily report form
- attach photos
- progress percent
- AI draft summary
- export PDF/Markdown

คำแนะนำ: เริ่มจาก Option B แล้วใส่ EvidenceAsset แบบเล็กใน Option A เพราะต้นทุนและหลักฐานควรเชื่อมกันตั้งแต่ต้น

