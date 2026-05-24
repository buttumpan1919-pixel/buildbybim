# Project Agent Instructions

- หลังจบงานพัฒนา/แก้เอกสารที่เปลี่ยนสถานะโปรเจกต์ ให้ update `src/roadmap.ts` และตรวจ `/roadmap` พร้อมสรุปสถานะ Roadmap ใน final report

- ตอบเป็นภาษาไทยแบบกระชับ ชัดเจน และลงมือทำให้จบเมื่อบริบทเพียงพอ
- ก่อนแก้โค้ดให้ตรวจสอบ pattern เดิมของโปรเจกต์ แล้วแก้เฉพาะจุดที่เกี่ยวข้อง
- หลังงานพัฒนาเว็บไซต์ทุกครั้ง ให้สรุป "แนวทางพัฒนาต่อ" 1-3 ข้อที่ทำต่อได้จริง
- รักษา UI หลักให้รองรับหลายภาษา โดยเฉพาะ topbar, sidebar, breadcrumb, app switcher และปุ่ม shared
- ข้อความ shared UI ควรผ่าน dictionary/helper เช่น `WorkspaceLanguage` และ `workspaceShellCopy` แทนการ hardcode ภาษาเดียว
- ปุ่มภาษาใน topbar ต้องเปลี่ยนภาษาได้จริงและบันทึกค่าที่เลือกไว้ใน `localStorage`
- ตรวจสอบงานด้วย `npm run build` หรือคำสั่งที่เหมาะสม และเช็ค route ที่เกี่ยวข้องเมื่อแก้ frontend
