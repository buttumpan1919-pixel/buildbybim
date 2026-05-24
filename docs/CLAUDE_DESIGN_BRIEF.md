# Buildbybim.space Claude Design Brief

## 1. Core Concept

Buildbybim.space is a productivity platform that collects Tools Apps, Prompt Sets, and Workflow Apps for construction, architecture/design, business, and AI workflow.

The first business focus is construction, architecture, BIM, and practical work tools. In the future, the platform can expand to other professions and daily-life tools.

The site should not feel like a personal portfolio first. The portfolio/developer profile is secondary and should support trust.

Primary positioning:

- Practical tools for real work
- Start from small tools that solve immediate problems
- Save data for future use
- Upgrade to workspace, support plan, AI workflow, and agent automation

## 2. Target Users

### Visitor

Users who visit the public site to understand what the platform does.

### Free User

Users who can try quick tools without needing to understand the whole system first.

### Member

Users who can save data, use workspace features, export results, and reuse their work history.

### Supporter

Monthly paying users who get additional apps, features, AI quota, support, or custom workflow access.

### Admin

The owner or admin who can configure apps, plans, user permissions, prices, support levels, and access rules.

### Developer

The project owner/developer. This page is for credibility only, not the main product focus.

## 3. Main Website Routes

```txt
/
Public landing page / product overview

/apps
All app catalog

/tools
Quick tools for immediate tasks

/prompts
Prompt sets, prompt templates, prompt library

/workflows
Ready-made workflows such as Facebook content workflow, document workflow, file-to-data workflow

/pricing
Free plan, monthly support plan, custom support

/developer
Developer profile and credibility

/dashboard
Logged-in user workspace

/admin
Admin console for apps, users, plans, pricing, and permissions
```

## 4. Homepage Structure

### 4.1 Top Navigation

Required items:

- Logo: Build By BIM
- Menu: Apps, Tools, Prompts, Workflows, Pricing, Developer
- CTA: เริ่มจาก Tools ฟรี

The navigation should feel like a serious SaaS/product website, not a personal blog.

### 4.2 Hero Section

Main headline:

```txt
รวมเครื่องมือทำงานสำหรับก่อสร้าง ออกแบบ และ AI Workflow
```

Supporting copy:

```txt
ให้ผู้ใช้เริ่มจากเครื่องมือเล็กที่แก้ปัญหาเฉพาะหน้าได้ทันที แล้วค่อยบันทึกข้อมูลเป็น workspace สำหรับงานซ้ำ เอกสาร ทีม support และ agent automation ในอนาคต
```

Primary CTA:

```txt
เลือกงานที่ต้องทำ
```

Secondary CTA:

```txt
ดูโมดูลทั้งหมด
```

Hero visual:

- Product mockup
- App dashboard
- Plan review UI
- Workflow canvas
- Construction/design data interface

Avoid using abstract decorative illustrations.

### 4.3 Module Overview

Show the platform as modules, not a long menu.

Modules:

1. Construction Tools
2. Design / Architect Brain
3. AI Workflow
4. Support Platform

Each module should show:

- Module number
- Short description
- App/workflow count
- Simple icon

### 4.4 Quick Start Section

The user should understand that they can start from a real task.

Example quick starts:

- ตรวจแปลน / ตรวจ brief
- ทำ BOQ / เอกสาร
- สร้างโพสต์ Facebook
- ส่งสลิปผ่าน LINE

### 4.5 Pain / Solution / Result

Use a simple 3-column explanation.

Pain:

```txt
งานกระจัดกระจาย
```

Solution:

```txt
ใช้ tools ที่เริ่มได้ทันที
```

Result:

```txt
ข้อมูลถูกเก็บไว้ต่อยอดได้
```

### 4.6 App Marketplace Preview

Show a preview of app catalog cards.

Filter categories:

- All
- Construction
- Design
- AI Workflow
- Tools

Each app card should show:

- App name
- Short description
- Category
- Access level: Free, Starter, Member, Support plan, Future
- Whether it uses AI
- Whether it stores data

Example apps:

- Plan Review
- BOQ Data
- Prompt Set Library
- Facebook Content Workflow
- Site Checklist
- LINE Receipt Intake

### 4.7 Workflow Model

Explain the product model:

```txt
Quick mode -> Saved mode -> Agent ready
```

Quick mode:

```txt
Use immediately before signup or before understanding the full system.
```

Saved mode:

```txt
Save results into workspace, project data, or personal data.
```

Agent ready:

```txt
AI or LINE agent can create draft data, but important data must be confirmed by the user before saving.
```

### 4.8 Trust / Security Section

Trust principles:

1. Source first
2. Draft before commit
3. Access checked
4. Export ready

This section should make users feel that AI will not overwrite important data without confirmation.

### 4.9 Pricing / Support Plan

Plans:

#### Free

- Try quick tools
- Preview prompt sets
- Generate quick output

#### Support Monthly

- Saved mode
- Export
- Workflow access
- Support quota
- AI features depending on admin settings

#### Custom

- Specific app access
- Specific feature access
- Workspace access
- Admin override per user or team

### 4.10 FAQ

Recommended FAQ topics:

- Do users need to understand BIM first?
- Can users try it for free?
- Will AI save data automatically?
- Can the system support other professions in the future?
- How is user data protected?
- What is included in monthly support?

### 4.11 Developer Trust

This section should be short.

Message:

```txt
Built by an architect who creates practical tools for construction, design, documents, and AI workflow.
```

Avoid making this section look like the main portfolio.

### 4.12 Footer

Footer items:

- Apps
- Tools
- Prompts
- Workflows
- Pricing
- Developer
- Contact
- Terms / Privacy in the future

## 5. Main Product Systems

### 5.1 App Catalog System

Stores all apps and tools.

Each app should include:

- Name
- Slug
- Category
- Profession
- Free/paid status
- Privacy level
- Uses AI or not
- Stores data or not
- Required plan
- Required permission

### 5.2 Membership / Support Plan

Handles user plans and monthly support.

Admin should be able to configure:

- Plan name
- Monthly price
- Included apps
- Feature limits
- AI limits
- Support conditions
- Trial/free access rules

### 5.3 Permission System

Access should be configurable independently.

Permission levels:

- User-level permission
- Plan-level permission
- App-level permission
- Feature-level permission
- Admin override

### 5.4 Tools Apps

Small practical apps that solve immediate problems.

Examples:

- Checklist
- BOQ helper
- Plan review
- Defect list
- Site report
- Receipt/slip intake

### 5.5 Prompt System

Prompt-related entities:

- Prompt Set
- Prompt Template
- Prompt Version
- Prompt Favorite

Use cases:

- Reusable prompt packs
- Prompt sets by profession
- Prompt templates for design, documents, content, business, and AI workflow

### 5.6 Content Workflow

Content-related entities:

- Content Workflow
- Content Post Draft
- Content Campaign
- Content Approval
- Content Performance Note

Use case:

- Generate Facebook posts
- Create captions, hooks, CTA, hashtags, and image prompts
- Review and approve before publishing
- Keep notes for future improvement

### 5.7 Workspace / Saved Data

Users should be able to save outputs for future use.

Examples:

- Projects
- Documents
- BOQ data
- Plan review findings
- Prompt favorites
- Content drafts
- Uploaded files
- Agent draft results

### 5.8 AI Agent / LINE Integration

Future system direction:

- User sends image/file/text through LINE OA
- Bot receives webhook
- Backend stores source file
- AI extracts data into draft
- User confirms
- System saves confirmed data into the correct workspace/app

Important principle:

```txt
AI creates draft data. Human confirms before commit.
```

### 5.9 Admin Console

Admin console should manage:

- Users
- Apps
- Plans
- Pricing
- Permissions
- Support conditions
- App categories
- Profession tags
- Privacy levels
- AI settings

## 6. Style Direction

Style name:

```txt
Technical SaaS / BIM Productivity Platform
```

Mood:

- Professional
- Technical
- Trustworthy
- Practical
- Modern
- Product-first

Avoid:

- Portfolio-first design
- Overly empty white layout
- Decorative landing page
- Abstract startup graphics
- Too playful/game-like typography

Visual direction:

- Dark technical hero
- Light content sections
- Subtle grid background
- Product mockup as first-viewport signal
- Clean card system
- Small technical labels
- Strong typography
- Clear CTA
- Minimal shadow and border

Typography:

- Onest for English/UI
- IBM Plex Sans Thai for Thai body text
- Prompt for logo/brand text
- IBM Plex Mono for technical labels only

Color direction:

- Dark navy / slate hero
- White and light gray content sections
- Green accent for construction/productivity
- Neutral borders
- Subtle shadows

## 7. Claude Design Prompt

Use this prompt directly in Claude Design:

```txt
Design a responsive technical SaaS landing page for Buildbybim.space.

Buildbybim.space is a productivity platform that collects Tools Apps, Prompt Sets, and Workflow Apps for construction, architecture/design, business, and AI workflow. The site should feel professional, trustworthy, technical, and practical, inspired by modern SaaS/developer tool websites.

Main sections:
- sticky top navigation
- dark technical hero with product mockup
- module overview
- quick start tools
- pain/solution/result
- app marketplace preview
- workflow model
- trust/security section
- pricing/support plan
- FAQ
- developer trust
- footer

Use style: Technical SaaS / BIM Productivity Platform.

Use dark navy hero, clean white/gray sections, subtle grid, sharp professional cards, small technical labels, strong typography, and clear CTA.

Avoid portfolio-first design, decorative landing page, overly empty white layout, abstract startup graphics, and playful/game-like typography.

The homepage should make users understand that they can start from a small practical tool, get useful output immediately, and later save data into workspace, support plan, and agent automation.
```

## 8. Design Quality Checklist

The final design should answer these questions:

- Can a visitor understand what the platform does within 5 seconds?
- Does the page look like a product platform, not a personal portfolio?
- Is the first CTA clear?
- Does the hero show a real product/workflow signal?
- Are apps grouped clearly by user task?
- Does the pricing/support model feel trustworthy?
- Does the design communicate data safety and human confirmation?
- Is the page responsive on mobile?
- Is Thai text readable and not too decorative?
- Are cards and sections not too empty or too crowded?

