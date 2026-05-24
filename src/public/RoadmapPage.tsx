import { useMemo } from "react";
import { workspaceApps, type WorkspaceAppStatus } from "../apps";
import {
  ROADMAP_BUILD_LABEL,
  ROADMAP_LAST_UPDATED,
  ROADMAP_TEST_LABEL,
  ROADMAP_VERSION_LABEL,
  roadmapCurrentFocus,
  roadmapHero,
  roadmapMilestones,
  roadmapStatusCopy,
  roadmapUpdateRules,
  type RoadmapLanguage
} from "../roadmap";

const roadmapPageCss = `
.public-roadmap-topline {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 22px;
}
.public-roadmap-pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: #fff;
  color: var(--ink-3);
  font-family: var(--mono);
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.06em;
  padding: 7px 11px;
  text-transform: uppercase;
}
.public-roadmap-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0;
  margin: 0 0 28px;
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
}
@media (max-width: 900px) {
  .public-roadmap-summary { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .public-roadmap-stat:nth-child(2) { border-right: 0; }
  .public-roadmap-stat:nth-child(n + 3) { border-top: 1px solid var(--line); }
  .public-roadmap-stat:nth-child(3) { padding-left: 0; }
}
@media (max-width: 560px) {
  .public-roadmap-summary { grid-template-columns: 1fr; }
  .public-roadmap-stat {
    border-right: 0;
    border-top: 1px solid var(--line);
    padding-left: 0;
  }
  .public-roadmap-stat:first-child { border-top: 0; }
  .public-roadmap-stat + .public-roadmap-stat { padding-left: 0; }
}
.public-roadmap-stat {
  background: transparent;
  border-right: 1px solid var(--line);
  padding: 16px 18px 16px 0;
}
.public-roadmap-stat + .public-roadmap-stat { padding-left: 18px; }
.public-roadmap-stat:last-child { border-right: 0; }
.public-roadmap-stat span {
  display: block;
  color: var(--ink-5);
  font-family: var(--mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.public-roadmap-stat strong {
  display: block;
  margin-top: 10px;
  color: var(--ink);
  font-family: var(--en);
  font-size: 30px;
  line-height: 1;
}
.public-roadmap-stat small {
  display: block;
  margin-top: 9px;
  color: var(--ink-4);
  font-size: 12.5px;
}
.public-roadmap-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 34px;
  align-items: start;
}
.public-roadmap-panel {
  background: transparent;
  border: 0;
  border-radius: 0;
  padding: 0;
}
.public-roadmap-panel h2,
.public-roadmap-panel h3 {
  margin: 0;
  color: var(--ink);
  font-family: var(--th);
  font-size: 22px;
  font-weight: 650;
  letter-spacing: -0.01em;
}
.public-roadmap-panel > p {
  margin: 10px 0 0;
  color: var(--ink-3);
  font-size: 14px;
}
.public-roadmap-subsection {
  margin-top: 26px;
  padding-top: 22px;
  border-top: 1px solid var(--line);
}
.public-roadmap-subsection h3 {
  margin: 0;
  color: var(--ink);
  font-family: var(--th);
  font-size: 18px;
  font-weight: 650;
}
.public-roadmap-subsection > p {
  margin: 8px 0 0;
  color: var(--ink-3);
  font-size: 13px;
}
.public-roadmap-focus-list,
.public-roadmap-app-list,
.public-roadmap-rules {
  display: grid;
  gap: 0;
  margin-top: 14px;
  border-top: 1px solid var(--line);
}
.public-roadmap-focus,
.public-roadmap-app-row,
.public-roadmap-rule {
  border: 0;
  border-bottom: 1px solid var(--line);
  border-radius: 0;
  background: transparent;
  padding: 14px 0;
}
.public-roadmap-focus header,
.public-roadmap-app-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.public-roadmap-focus strong,
.public-roadmap-app-row strong {
  color: var(--ink);
  font-family: var(--en);
  font-size: 14px;
}
.public-roadmap-focus p {
  margin: 8px 0 0;
  color: var(--ink-3);
  font-size: 13px;
}
.public-roadmap-status {
  display: inline-flex;
  flex: none;
  align-items: center;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: #fff;
  color: var(--ink-3);
  font-family: var(--mono);
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.08em;
  padding: 5px 8px;
  text-transform: uppercase;
}
.public-roadmap-status.done { background: #E1F0E5; border-color: #B7D8C0; color: #22613A; }
.public-roadmap-status.in_progress { background: #EAF2FF; border-color: #BDD3F8; color: #255AA6; }
.public-roadmap-status.next { background: #FFF1CC; border-color: #F4DD9C; color: #8A6218; }
.public-roadmap-status.planned { background: #F2F2F0; border-color: var(--line); color: var(--ink-4); }
.public-roadmap-timeline {
  display: grid;
  gap: 0;
  margin-top: 18px;
  border-top: 1px solid var(--line);
}
.public-roadmap-milestone {
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr);
  gap: 18px;
  padding: 22px 0;
  border: 0;
  border-bottom: 1px solid var(--line);
  border-radius: 0;
  background: transparent;
}
@media (max-width: 640px) {
  .public-roadmap-milestone { grid-template-columns: 1fr; }
}
.public-roadmap-phase {
  display: block;
  color: var(--ink-5);
  font-family: var(--mono);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  padding-top: 4px;
}
.public-roadmap-milestone-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.public-roadmap-milestone h3 {
  font-size: 19px;
  line-height: 1.3;
}
.public-roadmap-milestone p {
  margin: 10px 0 0;
  color: var(--ink-3);
  font-size: 13.5px;
}
.public-roadmap-columns {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  margin-top: 16px;
}
@media (max-width: 700px) {
  .public-roadmap-columns { grid-template-columns: 1fr; }
}
.public-roadmap-list {
  margin: 0;
  padding: 0 0 0 18px;
  color: var(--ink-3);
  font-size: 13px;
}
.public-roadmap-list strong {
  display: block;
  margin: 0 0 8px -18px;
  color: var(--ink);
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.public-roadmap-list li + li { margin-top: 7px; }
.public-roadmap-app-row {
  text-align: left;
  cursor: pointer;
  width: 100%;
  appearance: none;
  font: inherit;
  transition: color 0.15s ease, transform 0.15s ease;
}
.public-roadmap-app-row:hover {
  color: var(--ink);
  transform: translateY(-1px);
}
.public-roadmap-app-row small {
  display: block;
  margin-top: 3px;
  color: var(--ink-5);
  font-family: var(--mono);
  font-size: 10px;
}
.public-roadmap-rule {
  color: var(--ink-3);
  font-size: 13px;
  line-height: 1.55;
}
.public-roadmap-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 18px;
}
`;

type RoadmapPageProps = {
  language: RoadmapLanguage;
  onNavigate: (path: string) => void;
};

function getTestCountLabel() {
  return ROADMAP_TEST_LABEL.split("/")[0] || ROADMAP_TEST_LABEL;
}

function getQualityDetailLabel() {
  return `${ROADMAP_TEST_LABEL.replace(/^\d+\/\d+\s*/, "") || ROADMAP_TEST_LABEL} + ${ROADMAP_BUILD_LABEL}`;
}

export function RoadmapPage({ language, onNavigate }: RoadmapPageProps) {
  const publicApps = useMemo(
    () => workspaceApps.filter((app) => app.id !== "hub" && app.id !== "admin"),
    []
  );

  const statusCounts = useMemo(
    () =>
      publicApps.reduce<Record<WorkspaceAppStatus, number>>(
        (counts, app) => {
          counts[app.status] += 1;
          return counts;
        },
        { ready: 0, prototype: 0, next: 0, planned: 0 }
      ),
    [publicApps]
  );

  const activeApps = useMemo(
    () => publicApps.filter((app) => app.status === "ready" || app.status === "prototype"),
    [publicApps]
  );

  const nextApps = useMemo(
    () => publicApps.filter((app) => app.status === "next" || app.status === "planned"),
    [publicApps]
  );

  const summaryTiles =
    language === "th"
      ? [
          {
            label: "แอปที่เปิดใช้งานได้",
            value: String(activeApps.length),
            detail: `${statusCounts.ready} ready / ${statusCounts.prototype} prototype`
          },
          {
            label: "งานถัดไป",
            value: String(nextApps.length),
            detail: `${statusCounts.next} next / ${statusCounts.planned} planned`
          },
          {
            label: "คุณภาพล่าสุด",
            value: getTestCountLabel(),
            detail: getQualityDetailLabel()
          },
          {
            label: "อัปเดตล่าสุด",
            value: ROADMAP_VERSION_LABEL,
            detail: ROADMAP_LAST_UPDATED
          }
        ]
      : [
          {
            label: "Usable apps",
            value: String(activeApps.length),
            detail: `${statusCounts.ready} ready / ${statusCounts.prototype} prototype`
          },
          {
            label: "Next backlog",
            value: String(nextApps.length),
            detail: `${statusCounts.next} next / ${statusCounts.planned} planned`
          },
          {
            label: "Latest quality gate",
            value: getTestCountLabel(),
            detail: getQualityDetailLabel()
          },
          {
            label: "Last updated",
            value: ROADMAP_VERSION_LABEL,
            detail: ROADMAP_LAST_UPDATED
          }
        ];

  const copy =
    language === "th"
      ? {
          focusTitle: "สถานะที่กำลังโฟกัส",
          focusLede: "ส่วนนี้บอกว่าตอนนี้ทีมควรจับตาอะไรเป็นหลัก",
          timelineTitle: "ลำดับการพัฒนา",
          shipped: "ทำแล้ว",
          next: "กำลังจะทำ",
          appTitle: "แอปที่ผู้ใช้ลองได้ตอนนี้",
          appLede: "รายการนี้ดึงจาก app manifest เดียวกับ workspace เพื่อให้ public site ไม่หลุดจากระบบจริง",
          rulesTitle: "กติกาหลังจบงาน",
          rulesLede: "ทุกครั้งที่จบงานพัฒนา ต้องอัปเดต Roadmap พร้อมเอกสารที่เกี่ยวข้อง",
          viewApps: "ดูรายการแอป",
          openWorkspace: "เปิด Workspace"
        }
      : {
          focusTitle: "Current focus",
          focusLede: "What the team should watch right now.",
          timelineTitle: "Development timeline",
          shipped: "Shipped",
          next: "Next",
          appTitle: "Apps users can try now",
          appLede: "This list reads from the same app manifest as the workspace.",
          rulesTitle: "Completion rules",
          rulesLede: "After each development task, update the Roadmap and related docs.",
          viewApps: "View apps",
          openWorkspace: "Open workspace"
        };

  return (
    <section className="public-section">
      <style>{roadmapPageCss}</style>
      <div className="public-wrap">
        <div className="public-section-head">
          <div>
            <div className="public-kicker">Roadmap</div>
            <h1>{roadmapHero.title[language]}</h1>
            <div className="public-roadmap-topline" aria-label="Roadmap metadata">
              <span className="public-roadmap-pill">{ROADMAP_VERSION_LABEL}</span>
              <span className="public-roadmap-pill">{ROADMAP_LAST_UPDATED}</span>
              <span className="public-roadmap-pill">
                {ROADMAP_TEST_LABEL} / {ROADMAP_BUILD_LABEL}
              </span>
            </div>
          </div>
          <p>
            {roadmapHero.lede[language]}
            <br />
            <br />
            {roadmapHero.note[language]}
          </p>
        </div>

        <div className="public-roadmap-summary">
          {summaryTiles.map((tile) => (
            <div className="public-roadmap-stat" key={tile.label}>
              <span>{tile.label}</span>
              <strong>{tile.value}</strong>
              <small>{tile.detail}</small>
            </div>
          ))}
        </div>

        <div className="public-roadmap-layout">
          <div className="public-roadmap-panel">
            <h2>{copy.timelineTitle}</h2>
            <div className="public-roadmap-timeline">
              {roadmapMilestones.map((milestone) => (
                <article className="public-roadmap-milestone" key={milestone.id}>
                  <div className="public-roadmap-phase">{milestone.phase}</div>
                  <div>
                    <div className="public-roadmap-milestone-head">
                      <h3>{milestone.title[language]}</h3>
                      <span className={`public-roadmap-status ${milestone.status}`}>
                        {roadmapStatusCopy[milestone.status][language]}
                      </span>
                    </div>
                    <p>{milestone.summary[language]}</p>
                    <div className="public-roadmap-columns">
                      <ul className="public-roadmap-list">
                        <strong>{copy.shipped}</strong>
                        {milestone.shipped.map((item) => (
                          <li key={item[language]}>{item[language]}</li>
                        ))}
                      </ul>
                      <ul className="public-roadmap-list">
                        <strong>{copy.next}</strong>
                        {milestone.next.map((item) => (
                          <li key={item[language]}>{item[language]}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <aside className="public-roadmap-panel">
            <h2>{copy.focusTitle}</h2>
            <p>{copy.focusLede}</p>
            <div className="public-roadmap-focus-list">
              {roadmapCurrentFocus.map((focus) => (
                <article className="public-roadmap-focus" key={focus.label[language]}>
                  <header>
                    <strong>{focus.label[language]}</strong>
                    <span className={`public-roadmap-status ${focus.status}`}>
                      {roadmapStatusCopy[focus.status][language]}
                    </span>
                  </header>
                  <p>{focus.detail[language]}</p>
                </article>
              ))}
            </div>

            <div className="public-roadmap-subsection">
              <h3>{copy.appTitle}</h3>
              <p>{copy.appLede}</p>
              <div className="public-roadmap-app-list">
                {activeApps.slice(0, 8).map((app) => (
                  <button
                    className="public-roadmap-app-row"
                    key={app.id}
                    onClick={() => {
                      window.location.href = app.routeBase;
                    }}
                    type="button"
                  >
                    <span>
                      <strong>{app.label}</strong>
                      <small>{app.routeBase}</small>
                    </span>
                    <span className={`public-roadmap-status ${app.status}`}>
                      {app.status}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="public-roadmap-subsection">
              <h3>{copy.rulesTitle}</h3>
              <p>{copy.rulesLede}</p>
              <div className="public-roadmap-rules">
                {roadmapUpdateRules.map((rule, index) => (
                  <div className="public-roadmap-rule" key={rule[language]}>
                    {index + 1}. {rule[language]}
                  </div>
                ))}
              </div>
              <div className="public-roadmap-actions">
                <button
                  className="public-btn public-btn-solid"
                  onClick={() => onNavigate("/apps")}
                  type="button"
                >
                  {copy.viewApps} →
                </button>
                <a
                  className="public-btn public-btn-line"
                  href="/hub"
                  onClick={(event) => {
                    event.preventDefault();
                    window.location.href = "/hub";
                  }}
                >
                  {copy.openWorkspace} →
                </a>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
