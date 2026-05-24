import { useEffect, useMemo, useState } from "react";
import appCardAiWorkflow from "./assets/app-card-ai-workflow.svg";
import appCardArchitect from "./assets/app-card-architect.svg";
import appCardBoq from "./assets/app-card-boq.svg";
import appCardCashflow from "./assets/app-card-cashflow.svg";
import appCardConstruction from "./assets/app-card-construction.svg";
import appCardContent from "./assets/app-card-content.svg";
import appCardDefect from "./assets/app-card-defect.svg";
import appCardHub from "./assets/app-card-hub.svg";
import brandLogo from "./assets/buildbybim-logo.svg";
import heroHouseImage from "./assets/buildbybim-hero-house-selected.webp";
import handoffHtml from "./style-preview-handoff.html?raw";
import {
  loadStylePreviewLanguage,
  saveStylePreviewLanguage,
  stylePreviewLanguageToggleCopy,
  translateStylePreviewBody,
  type StylePreviewLanguage
} from "./stylePreviewI18n";

const responsiveFixes = `
.style-preview-v2 {
  --preview-chakra:
    var(--font-ui, "Chakra Petch", "IBM Plex Sans Thai", "Noto Sans Thai", "Inter", "Segoe UI", system-ui, sans-serif);
  --en: var(--preview-chakra);
  --th: var(--preview-chakra);
  --brand: var(--preview-chakra);
  --mono: var(--preview-chakra);
  font-family: var(--preview-chakra);
}

.style-preview-v2 input,
.style-preview-v2 button,
.style-preview-v2 textarea,
.style-preview-v2 select {
  font-family: inherit;
}

.style-preview-v2 .style-preview-language-toggle {
  position: fixed;
  right: 18px;
  bottom: 18px;
  z-index: 80;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 4px;
  background: var(--ink, #0A0A09);
  color: #FAFAF9;
  border-radius: 999px;
  box-shadow: 0 12px 28px rgba(10, 10, 9, 0.22);
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.style-preview-v2 .style-preview-language-toggle button {
  appearance: none;
  background: transparent;
  border: 0;
  color: inherit;
  padding: 7px 14px;
  border-radius: 999px;
  cursor: pointer;
  font: inherit;
  letter-spacing: inherit;
  text-transform: inherit;
  transition: background-color 0.18s ease, color 0.18s ease;
}

.style-preview-v2 .style-preview-language-toggle button:hover {
  color: #FFFFFF;
}

.style-preview-v2 .style-preview-language-toggle button.active {
  background: #FAFAF9;
  color: var(--ink, #0A0A09);
  cursor: default;
}

.style-preview-v2 .style-preview-language-toggle button:focus-visible {
  outline: 2px solid #FAFAF9;
  outline-offset: 2px;
}

.style-preview-v2 .sr-only,
.style-preview-v2 .style-preview-language-toggle .sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.style-preview-v2 .brand-logo {
  display: block;
  width: 38px;
  height: 38px;
  border-radius: 8px;
  object-fit: contain;
  flex: 0 0 auto;
  box-shadow: 0 8px 20px rgba(10, 10, 9, 0.12);
}

.style-preview-v2 .foot-brand .brand-logo {
  width: 30px;
  height: 30px;
  border-radius: 7px;
  box-shadow: none;
}

.style-preview-v2 .app-feature-section {
  padding: clamp(34px, 5vw, 54px) 0;
  scroll-margin-top: 76px;
  background: #F4F4F1;
  border-top: 1px solid rgba(10, 10, 9, 0.08);
}

.style-preview-v2 #developer,
.style-preview-v2 #footer {
  scroll-margin-top: 76px;
}

.style-preview-v2 .app-feature-head {
  display: grid;
  grid-template-columns: minmax(0, 0.95fr) minmax(260px, 0.48fr);
  gap: clamp(14px, 3vw, 36px);
  align-items: end;
  margin-bottom: 14px;
}

.style-preview-v2 .app-feature-head h2 {
  max-width: 820px;
  margin: 0;
  color: var(--ink);
  font-family: var(--th);
  font-size: clamp(26px, 3vw, 40px);
  font-weight: 700;
  line-height: 1.03;
  letter-spacing: 0;
  text-wrap: balance;
}

.style-preview-v2 .app-feature-head p {
  margin: 0;
  color: var(--ink-6);
  font-size: 13px;
  line-height: 1.55;
}

.style-preview-v2 .app-launcher-panel {
  padding: 12px;
  background: rgba(255, 255, 255, 0.52);
  border: 1px solid rgba(10, 10, 9, 0.12);
  border-radius: 10px;
  box-shadow: 0 24px 60px rgba(10, 10, 9, 0.06);
}

.style-preview-v2 .app-launcher-controls {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(240px, 320px);
  gap: 12px;
  align-items: center;
  margin-bottom: 12px;
}

.style-preview-v2 .app-filter-tabs {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 2px;
  scrollbar-width: thin;
}

.style-preview-v2 .app-filter-tab {
  appearance: none;
  min-height: 34px;
  padding: 8px 11px;
  color: var(--ink);
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(10, 10, 9, 0.12);
  border-radius: 999px;
  cursor: pointer;
  font-family: var(--mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  white-space: nowrap;
}

.style-preview-v2 .app-filter-tab.active,
.style-preview-v2 .app-filter-tab[aria-selected="true"] {
  color: #fff;
  background: var(--ink);
  border-color: var(--ink);
}

.style-preview-v2 .app-search-wrap {
  position: relative;
}

.style-preview-v2 .app-search-wrap input {
  width: 100%;
  min-height: 38px;
  padding: 9px 12px;
  color: var(--ink);
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(10, 10, 9, 0.14);
  border-radius: 8px;
  font: 600 13px/1.2 var(--brand);
  outline: none;
}

.style-preview-v2 .app-search-wrap input:focus {
  border-color: rgba(10, 10, 9, 0.5);
  box-shadow: 0 0 0 3px rgba(10, 10, 9, 0.08);
}

.style-preview-v2 .app-result-meta {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin: 0 0 10px;
  color: var(--ink-5);
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.style-preview-v2 .app-feature-scroll {
  max-height: 340px;
  overflow: auto;
  padding-right: 4px;
  scrollbar-width: thin;
}

.style-preview-v2 .app-feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(132px, 1fr));
  gap: 8px;
}

.style-preview-v2 .app-feature-card {
  min-height: 114px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 9px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(10, 10, 9, 0.12);
  border-radius: 8px;
  color: inherit;
  cursor: pointer;
  text-decoration: none;
  box-shadow: 0 12px 28px rgba(10, 10, 9, 0.045);
  transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
}

.style-preview-v2 .app-feature-card:hover {
  border-color: rgba(10, 10, 9, 0.24);
  box-shadow: 0 16px 34px rgba(10, 10, 9, 0.07);
  transform: translateY(-1px);
}

.style-preview-v2 .app-feature-card:focus-visible {
  outline: 2px solid var(--ink);
  outline-offset: 2px;
}

.style-preview-v2 .app-feature-card.is-free {
  background: rgba(255, 255, 255, 0.88);
  border-color: rgba(10, 10, 9, 0.18);
}

.style-preview-v2 .app-feature-card.is-hidden {
  display: none;
}

.style-preview-v2 .app-feature-card .app-no {
  color: var(--ink-5);
  font-family: var(--mono);
  font-size: 9px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.style-preview-v2 .app-feature-card .app-card-top {
  display: flex;
  justify-content: space-between;
  gap: 6px;
  align-items: center;
}

.style-preview-v2 .app-card-main {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr);
  gap: 7px;
  align-items: start;
  margin-top: 6px;
}

.style-preview-v2 .app-logo-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  color: #fff;
  background:
    linear-gradient(145deg, rgba(46, 145, 152, 0.95), rgba(10, 10, 9, 0.92));
  border: 1px solid rgba(10, 10, 9, 0.12);
  border-radius: 8px;
  box-shadow: 0 10px 20px rgba(10, 10, 9, 0.12);
  text-decoration: none;
}

.style-preview-v2 .app-logo-link:hover {
  transform: translateY(-1px);
}

.style-preview-v2 .app-logo-mark {
  font-family: var(--mono);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.style-preview-v2 .app-feature-card .app-access {
  display: inline-flex;
  align-items: center;
  min-height: 18px;
  padding: 3px 7px;
  color: #fff;
  background: var(--ink);
  border-radius: 999px;
  font-family: var(--mono);
  font-size: 8.5px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.style-preview-v2 .app-feature-card .app-access.member {
  color: var(--ink);
  background: rgba(10, 10, 9, 0.08);
  border: 1px solid rgba(10, 10, 9, 0.1);
}

.style-preview-v2 .app-feature-card h3 {
  margin: 0 0 3px;
  color: var(--ink);
  font-family: var(--brand);
  font-size: 12.8px;
  line-height: 1.12;
  letter-spacing: 0;
}

.style-preview-v2 .app-status-line {
  margin: 0 0 4px;
  color: var(--ink-5);
  font-family: var(--mono);
  font-size: 7.8px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.style-preview-v2 .app-feature-card p {
  margin: 0;
  color: var(--ink-6);
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
  font-size: 9.8px;
  line-height: 1.35;
}

.style-preview-v2 .app-feature-card .app-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  margin-top: 6px;
}

.style-preview-v2 .app-feature-card .app-tags span:nth-child(n+3) {
  display: none;
}

.style-preview-v2 .app-feature-card .app-tags span {
  padding: 3px 5px;
  color: var(--ink);
  background: rgba(10, 10, 9, 0.05);
  border: 1px solid rgba(10, 10, 9, 0.08);
  border-radius: 999px;
  font-family: var(--mono);
  font-size: 7.4px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.style-preview-v2 .app-feature-actions {
  display: flex;
  gap: 5px;
  align-items: center;
  flex-wrap: wrap;
  margin-top: 6px;
}

.style-preview-v2 .app-feature-actions .app-open,
.style-preview-v2 .app-feature-actions .app-more {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 24px;
  padding: 5px 8px;
  border-radius: 5px;
  font-family: var(--brand);
  font-size: 9.4px;
  font-weight: 700;
  line-height: 1;
  text-decoration: none;
  white-space: nowrap;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}

.style-preview-v2 .app-feature-actions .app-open {
  color: #fff;
  background: var(--ink);
  box-shadow: 0 8px 18px rgba(10, 10, 9, 0.13);
}

.style-preview-v2 .app-feature-actions .app-more {
  display: none;
}

.style-preview-v2 .app-feature-actions .app-open:hover,
.style-preview-v2 .app-feature-actions .app-more:hover {
  transform: translateY(-1px);
}

.style-preview-v2 .app-empty-state {
  display: none;
  padding: 24px;
  color: var(--ink-6);
  background: rgba(255, 255, 255, 0.72);
  border: 1px dashed rgba(10, 10, 9, 0.18);
  border-radius: 8px;
  font-size: 14px;
}

.style-preview-v2 .app-empty-state.is-visible {
  display: block;
}

@media (max-width: 980px) {
  .style-preview-v2 .app-feature-head,
  .style-preview-v2 .app-feature-grid {
    grid-template-columns: 1fr 1fr;
  }
  .style-preview-v2 .app-feature-head {
    align-items: start;
  }
  .style-preview-v2 .app-launcher-controls {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .style-preview-v2 .style-preview-language-toggle {
    right: 12px;
    bottom: 12px;
    font-size: 10.5px;
  }
  .style-preview-v2 .style-preview-language-toggle button {
    padding: 6px 11px;
  }
  .style-preview-v2 .app-feature-head {
    grid-template-columns: 1fr;
  }
  .style-preview-v2 .app-feature-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .style-preview-v2 .app-feature-card {
    min-height: auto;
    padding: 8px;
  }
  .style-preview-v2 .app-card-main {
    grid-template-columns: 28px minmax(0, 1fr);
    gap: 7px;
  }
  .style-preview-v2 .app-logo-link {
    width: 28px;
    height: 28px;
    border-radius: 7px;
  }
  .style-preview-v2 .app-launcher-panel {
    padding: 10px;
  }
  .style-preview-v2 .app-feature-scroll {
    max-height: 620px;
  }
  .style-preview-v2 .app-feature-card h3 {
    font-size: 12.8px;
  }
  .style-preview-v2 .app-feature-card p {
    font-size: 9.8px;
    -webkit-line-clamp: 2;
  }
  .style-preview-v2 .app-feature-card .app-tags span {
    font-size: 7.5px;
    padding: 3px 5px;
  }
  .style-preview-v2 .app-feature-actions {
    align-items: stretch;
    flex-direction: column;
    gap: 5px;
  }
  .style-preview-v2 .app-feature-actions .app-open,
  .style-preview-v2 .app-feature-actions .app-more {
    width: 100%;
    min-height: 26px;
    font-size: 10px;
  }
  .style-preview-v2 .app-feature-actions .app-more {
    display: none;
  }
}

.style-preview-v2 .app-feature-section {
  color: #18181B;
  background: #F4F4F1;
  border-top-color: rgba(10, 10, 9, 0.08);
}

.style-preview-v2 .app-feature-section .s-kicker {
  color: #71717A;
}

.style-preview-v2 .app-feature-head h2 {
  color: #111111;
}

.style-preview-v2 .app-feature-head p {
  color: #52525B;
}

.style-preview-v2 .app-launcher-panel {
  padding: 0;
  max-width: 1280px;
  background: transparent;
  border: 0;
  border-radius: 0;
  box-shadow: none;
}

.style-preview-v2 .app-market-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}

.style-preview-v2 .app-market-tools {
  display: flex;
  align-items: center;
  gap: 8px;
}

.style-preview-v2 .app-launcher-controls {
  display: block;
  margin-bottom: 16px;
}

.style-preview-v2 .app-result-meta {
  margin: 0;
  color: #71717A;
}

.style-preview-v2 .app-result-meta span:first-child {
  color: #3F3F46;
}

.style-preview-v2 .app-filter-tabs {
  gap: 8px;
  padding-bottom: 4px;
}

.style-preview-v2 .app-filter-tab,
.style-preview-v2 .app-search-wrap,
.style-preview-v2 .app-view-toggle {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(24, 24, 27, 0.11);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.82), 0 14px 34px rgba(24,24,27,.06);
  backdrop-filter: blur(18px);
}

.style-preview-v2 .app-filter-tab {
  min-height: 36px;
  padding: 9px 14px;
  color: #52525B;
}

.style-preview-v2 .app-filter-tab:hover {
  color: #18181B;
  background: #FFFFFF;
}

.style-preview-v2 .app-filter-tab.active,
.style-preview-v2 .app-filter-tab[aria-selected="true"] {
  color: #fff;
  background: #18181B;
  border-color: #18181B;
}

.style-preview-v2 .app-search-wrap {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 38px;
  padding: 0 12px;
  border-radius: 999px;
}

.style-preview-v2 .app-search-icon {
  width: 16px;
  height: 16px;
  color: #71717A;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  flex: 0 0 auto;
}

.style-preview-v2 .app-search-wrap input {
  width: 118px;
  min-height: auto;
  padding: 0;
  color: #18181B;
  background: transparent;
  border: 0;
  border-radius: 0;
  font: 700 13px/1 var(--brand);
}

.style-preview-v2 .app-search-wrap input::placeholder {
  color: #71717A;
}

.style-preview-v2 .app-search-wrap input:focus {
  box-shadow: none;
  border-color: transparent;
}

.style-preview-v2 .app-view-toggle {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 4px;
  border-radius: 999px;
}

.style-preview-v2 .app-view-toggle button {
  appearance: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: #71717A;
  background: transparent;
  border: 0;
  border-radius: 999px;
  cursor: pointer;
}

.style-preview-v2 .app-view-toggle button.active {
  color: #fff;
  background: #18181B;
}

.style-preview-v2 .app-view-toggle svg {
  width: 16px;
  height: 16px;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.style-preview-v2 .app-feature-scroll {
  max-height: none;
  overflow: visible;
  padding-right: 0;
}

.style-preview-v2 .app-feature-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  justify-content: stretch;
  gap: 16px;
}

.style-preview-v2 .app-launcher-panel[data-app-view="list"] .app-feature-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.style-preview-v2 .app-feature-card {
  position: relative;
  min-height: auto;
  display: block;
  overflow: hidden;
  padding: 0;
  color: #18181B;
  background: #FFFFFF;
  border: 1px solid rgba(24, 24, 27, 0.1);
  border-radius: 20px;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.9), 0 18px 42px rgba(24,24,27,.1);
  backdrop-filter: blur(18px);
  transform: translateY(0);
  transition: transform 0.28s ease, background 0.28s ease, border-color 0.28s ease, box-shadow 0.28s ease;
}

.style-preview-v2 .app-launcher-panel[data-app-view="list"] .app-feature-card {
  display: grid;
  grid-template-columns: 132px minmax(0, 1fr);
  min-height: 132px;
}

.style-preview-v2 .app-launcher-panel[data-app-view="list"] .app-feature-card.is-hidden {
  display: none;
}

.style-preview-v2 .app-feature-card:hover {
  background: #FFFFFF;
  border-color: rgba(24, 24, 27, 0.18);
  box-shadow: inset 0 1px 0 rgba(255,255,255,1), 0 22px 48px rgba(24,24,27,.14);
  transform: translateY(-3px);
}

.style-preview-v2 .app-feature-card:focus-visible {
  outline: 2px solid rgba(255, 255, 255, 0.28);
  outline-offset: 3px;
}

.style-preview-v2 .app-feature-card.is-free {
  background: #FFFFFF;
  border-color: rgba(24, 24, 27, 0.2);
}

.style-preview-v2 .app-card-line {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 4;
  height: 2px;
  background: linear-gradient(135deg, #22d3ee, #3b82f6);
}

.style-preview-v2 .app-thumb {
  position: relative;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  background:
    radial-gradient(circle at 28% 24%, rgba(34, 211, 238, 0.22), transparent 30%),
    linear-gradient(145deg, #F8FAFC, #E7ECEF);
}

.style-preview-v2 .app-launcher-panel[data-app-view="list"] .app-thumb {
  aspect-ratio: auto;
  min-height: 100%;
}

.style-preview-v2 .app-thumb-construction {
  background:
    radial-gradient(circle at 28% 24%, rgba(245, 158, 11, 0.2), transparent 30%),
    linear-gradient(145deg, #FFF7ED, #EDEAE2);
}

.style-preview-v2 .app-thumb-design {
  background:
    radial-gradient(circle at 28% 24%, rgba(34, 211, 238, 0.22), transparent 30%),
    linear-gradient(145deg, #ECFEFF, #E4ECEF);
}

.style-preview-v2 .app-thumb-ai {
  background:
    radial-gradient(circle at 30% 20%, rgba(129, 140, 248, 0.23), transparent 30%),
    linear-gradient(145deg, #EEF2FF, #E7E8F1);
}

.style-preview-v2 .app-thumb-content {
  background:
    radial-gradient(circle at 30% 20%, rgba(52, 211, 153, 0.21), transparent 30%),
    linear-gradient(145deg, #ECFDF5, #E4ECE7);
}

.style-preview-v2 .app-thumb-business {
  background:
    radial-gradient(circle at 30% 20%, rgba(251, 191, 36, 0.2), transparent 30%),
    linear-gradient(145deg, #FEFCE8, #ECE7D7);
}

.style-preview-v2 .app-thumb-grid {
  position: absolute;
  inset: 0;
  z-index: 1;
  opacity: 0.42;
  background:
    linear-gradient(rgba(24,24,27,.055) 1px, transparent 1px),
    linear-gradient(90deg, rgba(24,24,27,.055) 1px, transparent 1px);
  background-size: 22px 22px;
  mask-image: linear-gradient(to bottom, #000, transparent 88%);
}

.style-preview-v2 .app-thumb-mark {
  position: absolute;
  left: 50%;
  top: 50%;
  z-index: 2;
  transform: translate(-50%, -50%);
  color: rgba(24, 24, 27, 0.78);
  font-family: var(--mono);
  font-size: clamp(30px, 3.4vw, 48px);
  font-weight: 800;
  letter-spacing: -0.06em;
  text-shadow: 0 18px 40px rgba(24, 24, 27, 0.16);
}

.style-preview-v2 .app-thumb-img {
  position: absolute;
  inset: 5px 8px 14px;
  z-index: 0;
  width: calc(100% - 16px);
  height: calc(100% - 19px);
  object-fit: contain;
}

.style-preview-v2 .app-thumb::after {
  content: "";
  position: absolute;
  inset: 42% 0 0;
  z-index: 1;
  background: linear-gradient(transparent, rgba(255, 255, 255, 0.86));
}

.style-preview-v2 .app-card-badges {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 3;
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.style-preview-v2 .app-image-upload {
  appearance: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  min-height: 22px;
  padding: 4px 7px;
  color: rgba(24, 24, 27, 0.68);
  background: rgba(24, 24, 27, 0.055);
  border: 1px solid rgba(24, 24, 27, 0.1);
  border-radius: 999px;
  cursor: pointer;
  font-family: var(--mono);
  font-size: 8px;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.style-preview-v2 .app-image-upload:hover {
  color: #18181B;
  background: #fff;
}

.style-preview-v2 .app-image-input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.style-preview-v2 .app-feature-card .app-access,
.style-preview-v2 .app-tier {
  display: inline-flex;
  align-items: center;
  min-height: 20px;
  padding: 3px 7px;
  border-radius: 999px;
  color: #05070a;
  background: rgba(52, 211, 153, 0.96);
  font-family: var(--mono);
  font-size: 8.5px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  box-shadow: 0 12px 28px rgba(0,0,0,.25);
}

.style-preview-v2 .app-feature-card .app-access.member,
.style-preview-v2 .app-tier {
  color: #05070a;
  background: linear-gradient(135deg, #22d3ee, #3b82f6);
}

.style-preview-v2 .app-thumb-caption {
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 10px;
  z-index: 3;
  display: flex;
  justify-content: space-between;
  gap: 10px;
  color: rgba(24, 24, 27, 0.48);
  font-family: var(--mono);
  font-size: 8.5px;
  letter-spacing: 0.09em;
  text-transform: uppercase;
}

.style-preview-v2 .app-thumb-caption strong {
  max-width: 54%;
  color: rgba(24, 24, 27, 0.68);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.style-preview-v2 .app-card-body {
  padding: 12px;
  background: linear-gradient(180deg, #FFFFFF 0%, #F7F7F4 100%);
}

.style-preview-v2 .app-launcher-panel[data-app-view="list"] .app-card-body {
  display: flex;
  min-width: 0;
  flex-direction: column;
  justify-content: center;
  padding: 12px 14px;
}

.style-preview-v2 .app-status-line {
  margin: 0 0 5px;
  color: #34d399;
  font-size: 9px;
}

.style-preview-v2 .app-feature-card h3 {
  min-height: 2.45em;
  margin: 0 0 6px;
  color: #18181B;
  font-size: 14px;
  line-height: 1.22;
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.style-preview-v2 .app-launcher-panel[data-app-view="list"] .app-feature-card h3 {
  min-height: auto;
  font-size: 15px;
  -webkit-line-clamp: 1;
}

.style-preview-v2 .app-feature-card p {
  min-height: 1.34em;
  color: rgba(24, 24, 27, 0.62);
  font-size: 10.5px;
  line-height: 1.34;
  -webkit-line-clamp: 1;
}

.style-preview-v2 .app-launcher-panel[data-app-view="list"] .app-feature-card p {
  min-height: 1.34em;
  -webkit-line-clamp: 1;
}

.style-preview-v2 .app-feature-card .app-tags {
  margin-top: 9px;
}

.style-preview-v2 .app-feature-card .app-tags span {
  color: rgba(24, 24, 27, 0.58);
  background: rgba(24, 24, 27, 0.055);
  border-color: rgba(24, 24, 27, 0.08);
}

.style-preview-v2 .app-feature-actions {
  justify-content: space-between;
  margin-top: 9px;
}

.style-preview-v2 .app-launcher-panel[data-app-view="list"] .app-feature-actions {
  align-items: center;
  justify-content: flex-start;
}

.style-preview-v2 .app-launcher-panel[data-app-view="list"] .app-image-upload {
  margin-left: auto;
}

.style-preview-v2 .app-feature-actions .app-open {
  min-height: auto;
  padding: 0;
  color: #18181B;
  background: transparent;
  box-shadow: none;
  font-size: 12px;
}

.style-preview-v2 .app-feature-actions .app-open::after {
  content: "->";
  margin-left: 6px;
  color: rgba(24, 24, 27, 0.44);
}

.style-preview-v2 .app-empty-state {
  color: rgba(255, 255, 255, 0.68);
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.16);
}

.style-preview-v2 .app-detail-modal {
  position: fixed;
  inset: 0;
  z-index: 120;
  display: none;
  align-items: center;
  justify-content: center;
  padding: 22px;
  color: #18181B;
}

.style-preview-v2 .app-detail-modal.is-open {
  display: flex;
}

.style-preview-v2 .app-detail-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(24, 24, 27, 0.34);
  backdrop-filter: blur(12px);
}

.style-preview-v2 .app-detail-dialog {
  position: relative;
  width: min(760px, 100%);
  max-height: min(780px, calc(100vh - 44px));
  overflow: hidden;
  background:
    radial-gradient(circle at 16% 0%, rgba(34, 211, 238, 0.12), transparent 30%),
    linear-gradient(180deg, #FFFFFF 0%, #F6F7F5 100%);
  border: 1px solid rgba(24, 24, 27, 0.12);
  border-radius: 28px;
  box-shadow: 0 40px 120px rgba(24, 24, 27, 0.24);
}

.style-preview-v2 .app-detail-scroll {
  max-height: calc(100vh - 150px);
  overflow-y: auto;
  padding: 28px;
}

.style-preview-v2 .app-detail-close {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 3;
  width: 36px;
  height: 36px;
  color: rgba(24, 24, 27, 0.7);
  background: rgba(24, 24, 27, 0.06);
  border: 1px solid rgba(24, 24, 27, 0.1);
  border-radius: 999px;
  cursor: pointer;
  font-size: 22px;
  line-height: 1;
}

.style-preview-v2 .app-detail-close:hover {
  color: #18181B;
  background: #FFFFFF;
}

.style-preview-v2 .app-detail-hero {
  display: flex;
  gap: 20px;
  margin-bottom: 22px;
  padding-right: 36px;
}

.style-preview-v2 .app-detail-thumb {
  position: relative;
  flex: 0 0 144px;
  width: 144px;
  height: 144px;
  overflow: hidden;
  background: linear-gradient(145deg, #F8FAFC, #E7ECEF);
  border: 1px solid rgba(24, 24, 27, 0.1);
  border-radius: 22px;
  box-shadow: 0 18px 42px rgba(24, 24, 27, 0.08);
}

.style-preview-v2 .app-detail-thumb img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.style-preview-v2 .app-detail-thumb span {
  position: absolute;
  left: 50%;
  top: 50%;
  z-index: 2;
  transform: translate(-50%, -50%);
  font-family: var(--mono);
  font-size: 52px;
  font-weight: 800;
  letter-spacing: -0.05em;
  color: rgba(24, 24, 27, 0.78);
}

.style-preview-v2 .app-detail-main {
  min-width: 0;
  flex: 1;
}

.style-preview-v2 .app-detail-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}

.style-preview-v2 .app-detail-badges span {
  display: inline-flex;
  align-items: center;
  min-height: 21px;
  padding: 3px 8px;
  color: rgba(24, 24, 27, 0.58);
  background: rgba(24, 24, 27, 0.055);
  border: 1px solid rgba(24, 24, 27, 0.08);
  border-radius: 999px;
  font-family: var(--mono);
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.style-preview-v2 .app-detail-badges .owned,
.style-preview-v2 .app-detail-badges span:first-child {
  color: #05070a;
  background: rgba(52, 211, 153, 0.96);
  border-color: rgba(52, 211, 153, 0.96);
}

.style-preview-v2 .app-detail-main h3 {
  max-width: 560px;
  margin: 0 0 12px;
  color: #18181B;
  font-family: var(--brand);
  font-size: clamp(22px, 3vw, 32px);
  line-height: 1.08;
}

.style-preview-v2 .app-detail-author {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  color: rgba(24, 24, 27, 0.58);
  font-size: 13px;
}

.style-preview-v2 .app-detail-author .avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  color: #FFFFFF;
  background: #18181B;
  border-radius: 999px;
  font-family: var(--mono);
  font-weight: 800;
}

.style-preview-v2 .app-detail-desc {
  margin: 0 0 20px;
  color: rgba(24, 24, 27, 0.68);
  font-size: 15px;
  line-height: 1.78;
  white-space: pre-wrap;
}

.style-preview-v2 .app-detail-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 18px;
}

.style-preview-v2 .app-detail-stats div {
  min-width: 0;
  padding: 14px;
  background: rgba(255, 255, 255, 0.76);
  border: 1px solid rgba(24, 24, 27, 0.1);
  border-radius: 16px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.style-preview-v2 .app-detail-stats span {
  display: block;
  margin-bottom: 6px;
  color: rgba(24, 24, 27, 0.42);
  font-family: var(--mono);
  font-size: 9px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.style-preview-v2 .app-detail-stats strong {
  display: block;
  color: #18181B;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.style-preview-v2 .app-detail-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.style-preview-v2 .app-detail-tags span {
  padding: 6px 10px;
  color: rgba(24, 24, 27, 0.62);
  background: rgba(24, 24, 27, 0.055);
  border: 1px solid rgba(24, 24, 27, 0.08);
  border-radius: 999px;
  font-size: 11px;
}

.style-preview-v2 .app-detail-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 28px 24px;
  background: linear-gradient(transparent, rgba(255, 255, 255, 0.92) 18%);
  border-top: 1px solid rgba(24, 24, 27, 0.08);
}

.style-preview-v2 .app-detail-open,
.style-preview-v2 .app-detail-ghost {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 42px;
  padding: 11px 16px;
  border-radius: 999px;
  font-family: var(--brand);
  font-size: 14px;
  font-weight: 800;
  text-decoration: none;
}

.style-preview-v2 .app-detail-open {
  color: #FFFFFF;
  background: #18181B;
  box-shadow: 0 16px 32px rgba(24, 24, 27, 0.16);
}

.style-preview-v2 .app-detail-open span {
  margin-left: 8px;
}

.style-preview-v2 .app-detail-ghost {
  color: rgba(24, 24, 27, 0.68);
  background: rgba(24, 24, 27, 0.055);
  border: 1px solid rgba(24, 24, 27, 0.1);
  cursor: pointer;
}

@media (max-width: 980px) {
  .style-preview-v2 .app-feature-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .style-preview-v2 .app-launcher-panel[data-app-view="list"] .app-feature-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .style-preview-v2 .app-market-topbar {
    align-items: stretch;
  }

  .style-preview-v2 .app-market-tools {
    width: 100%;
  }

  .style-preview-v2 .app-search-wrap {
    flex: 1 1 auto;
  }

  .style-preview-v2 .app-search-wrap input {
    width: 100%;
  }

  .style-preview-v2 .app-feature-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .style-preview-v2 .app-launcher-panel[data-app-view="list"] .app-feature-grid {
    grid-template-columns: 1fr;
  }

  .style-preview-v2 .app-feature-card {
    border-radius: 18px;
  }

  .style-preview-v2 .app-launcher-panel[data-app-view="list"] .app-feature-card {
    grid-template-columns: 112px minmax(0, 1fr);
    min-height: 128px;
  }

  .style-preview-v2 .app-launcher-panel[data-app-view="list"] .app-card-body {
    padding: 10px 11px;
  }

  .style-preview-v2 .app-card-body {
    padding: 10px;
  }

  .style-preview-v2 .app-card-badges {
    top: 9px;
    right: 9px;
  }

  .style-preview-v2 .app-tier {
    display: none;
  }

  .style-preview-v2 .app-feature-card h3 {
    font-size: 13px;
  }

  .style-preview-v2 .app-feature-card p {
    font-size: 10px;
    -webkit-line-clamp: 2;
  }

  .style-preview-v2 .app-detail-modal {
    align-items: flex-end;
    padding: 10px;
  }

  .style-preview-v2 .app-detail-dialog {
    width: 100%;
    max-height: calc(100vh - 20px);
    border-radius: 24px;
  }

  .style-preview-v2 .app-detail-scroll {
    max-height: calc(100vh - 132px);
    padding: 20px;
  }

  .style-preview-v2 .app-detail-hero {
    gap: 14px;
    padding-right: 28px;
  }

  .style-preview-v2 .app-detail-thumb {
    flex-basis: 112px;
    width: 112px;
    height: 112px;
    border-radius: 18px;
  }

  .style-preview-v2 .app-detail-thumb span {
    font-size: 42px;
  }

  .style-preview-v2 .app-detail-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .style-preview-v2 .app-detail-actions {
    padding: 12px 20px 18px;
  }
}

.style-preview-v2 .hero-house-stage {
  --hero-tilt-x: 0deg;
  --hero-tilt-y: 0deg;
  --hero-shift-x: 0px;
  --hero-shift-y: 0px;
  --hero-scale: 1;
  position: relative;
  min-height: 540px;
  display: grid;
  place-items: center;
  isolation: isolate;
  perspective: 1000px;
}

.style-preview-v2 .hero-house-stage::before {
  position: absolute;
  inset: 6% -8% 0 -4%;
  z-index: -2;
  content: "";
  background:
    radial-gradient(ellipse at 50% 74%, rgba(10, 10, 9, 0.13), transparent 48%),
    linear-gradient(rgba(10,10,9,.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(10,10,9,.035) 1px, transparent 1px);
  background-size: auto, 34px 34px, 34px 34px;
  border: 1px solid rgba(168, 168, 164, 0.38);
  border-radius: 12px;
  mask-image: radial-gradient(ellipse 92% 78% at 54% 55%, #000 62%, transparent 100%);
}

.style-preview-v2 .hero-house-stage::after {
  position: absolute;
  left: 11%;
  right: 9%;
  bottom: 12%;
  z-index: -1;
  height: 44px;
  content: "";
  background: radial-gradient(ellipse, rgba(10, 10, 9, 0.075), transparent 70%);
  filter: blur(18px);
  transform: perspective(520px) rotateX(58deg);
}

.style-preview-v2 .hero-house-perspective {
  position: relative;
  width: min(760px, 112%);
  aspect-ratio: 16 / 9;
  transform:
    perspective(1000px)
    rotateX(var(--hero-tilt-x))
    rotateY(var(--hero-tilt-y))
    translate3d(var(--hero-shift-x), var(--hero-shift-y), 0)
    scale(var(--hero-scale));
  transform-style: preserve-3d;
  transition: transform 300ms ease-out;
  will-change: transform;
}

.style-preview-v2 .hero-house-cutout {
  position: absolute;
  inset: 0;
  animation: heroHouseFloat 7s ease-in-out infinite;
  transform-style: preserve-3d;
}

.style-preview-v2 .hero-house-cutout img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: brightness(0.96) contrast(1.2) saturate(1.04)
    drop-shadow(0 28px 30px rgba(10, 10, 9, 0.14));
  mix-blend-mode: normal;
  -webkit-mask-image:
    radial-gradient(ellipse 76% 58% at 50% 58%, #000 48%, rgba(0,0,0,0.7) 66%, transparent 83%);
  mask-image:
    radial-gradient(ellipse 76% 58% at 50% 58%, #000 48%, rgba(0,0,0,0.7) 66%, transparent 83%);
}

.style-preview-v2 .hero-house-highlight {
  position: absolute;
  inset: 7% 4% 10%;
  z-index: 2;
  border: 1px solid rgba(10, 10, 9, 0.12);
  border-radius: 10px;
  opacity: 0.56;
  transform: translate3d(10px, -8px, 0);
  animation: heroHouseScan 4.8s ease-in-out infinite;
  pointer-events: none;
}

.style-preview-v2 .hero-house-glint {
  position: absolute;
  inset: 4% 1% 8%;
  z-index: 3;
  border-radius: 12px;
  background:
    linear-gradient(105deg, transparent 24%, rgba(255,255,255,.42) 45%, transparent 62%);
  mix-blend-mode: screen;
  opacity: 0;
  transform: translateX(-34%) skewX(-10deg);
  animation: heroHouseGlint 5.8s ease-in-out infinite;
  pointer-events: none;
}

.style-preview-v2 .hero-house-line {
  position: absolute;
  z-index: 3;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(10,10,9,.55), transparent);
  opacity: 0.48;
  animation: heroMotionLine 5.2s ease-in-out infinite;
}

.style-preview-v2 .hero-house-line.l1 {
  width: 54%;
  top: 25%;
  left: 8%;
}

.style-preview-v2 .hero-house-line.l2 {
  width: 46%;
  top: 48%;
  right: 8%;
  animation-delay: -1.2s;
}

.style-preview-v2 .hero-house-line.l3 {
  width: 36%;
  bottom: 25%;
  left: 18%;
  animation-delay: -2.4s;
}

.style-preview-v2 .hero-house-caption {
  position: absolute;
  right: 2%;
  bottom: 5%;
  z-index: 4;
  display: grid;
  gap: 4px;
  padding: 10px 12px;
  border: 1px solid var(--line-strong);
  border-radius: 6px;
  background: rgba(250, 250, 249, 0.86);
  box-shadow: 0 12px 32px rgba(10, 10, 9, 0.12);
  backdrop-filter: blur(12px);
}

.style-preview-v2 .hero-house-caption span {
  font-family: var(--mono);
  font-size: 9.5px;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--ink-5);
}

.style-preview-v2 .hero-house-caption strong {
  font-family: var(--en);
  font-size: 15px;
  color: var(--ink);
}

.style-preview-v2 .hero-inner {
  grid-template-columns: minmax(0, 1fr) minmax(430px, 1fr);
  gap: 48px;
  align-items: center;
  padding: 64px var(--pad-x, 24px) 78px;
}

.style-preview-v2 .hero h1 {
  max-width: 760px;
  margin: 20px 0 24px;
  font-size: 54px;
  font-weight: 600;
  line-height: 1.08;
  letter-spacing: 0;
}

.style-preview-v2 .hero h1 .pre {
  margin-bottom: 14px;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.06em;
}

.style-preview-v2 .hero h1 em::after {
  bottom: 0.055em;
  height: 0.085em;
  opacity: 0.72;
}

.style-preview-v2 .hero p.lede {
  max-width: 560px;
  margin-bottom: 28px;
  font-size: 16px;
  line-height: 1.68;
}

.style-preview-v2 .hero-ctas {
  margin-bottom: 32px;
}

.style-preview-v2 .hero-stats {
  padding-top: 20px;
}

.style-preview-v2 .hero-house-stage {
  min-height: 470px;
}

.style-preview-v2 .hero-house-stage::before {
  inset: 7% -3% 5%;
}

.style-preview-v2 .hero-house-stage::after {
  bottom: 10%;
}

.style-preview-v2 .hero-house-perspective {
  width: min(720px, 102%);
}

.style-preview-v2 .hero-house-caption {
  right: 5%;
  bottom: 4%;
}

@media (min-width: 1600px) {
  .style-preview-v2 .hero-inner {
    grid-template-columns: minmax(0, 0.98fr) minmax(520px, 1.02fr);
    gap: 56px;
    padding: 70px var(--pad-x, 24px) 86px;
  }

  .style-preview-v2 .hero h1 {
    font-size: 58px;
    max-width: 820px;
  }

  .style-preview-v2 .hero-house-stage {
    min-height: 500px;
  }

  .style-preview-v2 .hero-house-perspective {
    width: min(740px, 102%);
  }
}

.style-preview-v2 .compact-section .s-head {
  margin-bottom: 28px;
}

.style-preview-v2 .compact-section .s-head h2 {
  max-width: 820px;
}

.style-preview-v2 .compact-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.style-preview-v2 .compact-card {
  min-height: 0;
  padding: 24px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.48);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.style-preview-v2 .compact-card.dark {
  background: var(--ink);
  border-color: var(--ink);
  color: #fff;
}

.style-preview-v2 .compact-card .lbl,
.style-preview-v2 .market-label {
  width: fit-content;
  border: 1px solid var(--line-strong);
  border-radius: 999px;
  padding: 5px 9px;
  font-family: var(--mono);
  font-size: 10px;
  color: var(--ink-5);
  letter-spacing: .08em;
  text-transform: uppercase;
  background: #fff;
}

.style-preview-v2 .compact-card.dark .lbl {
  border-color: rgba(255,255,255,.18);
  background: rgba(255,255,255,.08);
  color: #d7d7d2;
}

.style-preview-v2 .compact-card h3 {
  margin: 0;
  color: inherit;
  font-family: var(--th);
  font-size: 22px;
  font-weight: 600;
  line-height: 1.22;
  letter-spacing: -.008em;
}

.style-preview-v2 .compact-card p {
  margin: 0;
  color: var(--ink-3);
  font-size: 13.5px;
  line-height: 1.55;
}

.style-preview-v2 .compact-card.dark p {
  color: rgba(250,250,249,.72);
}

.style-preview-v2 .compact-points {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: auto;
}

.style-preview-v2 .compact-points span {
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 5px 8px;
  font-family: var(--mono);
  font-size: 9.5px;
  color: var(--ink-4);
  letter-spacing: .04em;
  text-transform: uppercase;
  background: rgba(255,255,255,.5);
}

.style-preview-v2 .compact-card.dark .compact-points span {
  border-color: rgba(255,255,255,.14);
  background: rgba(255,255,255,.06);
  color: rgba(250,250,249,.8);
}

.style-preview-v2 .marketplace-picker {
  display: grid;
  grid-template-columns: minmax(280px, 420px) 1fr;
  gap: 16px;
  align-items: stretch;
}

.style-preview-v2 .market-list,
.style-preview-v2 .market-detail {
  border: 1px solid var(--line);
  border-radius: 10px;
  background: rgba(255,255,255,.52);
}

.style-preview-v2 .market-list {
  padding: 10px;
  display: grid;
  gap: 8px;
}

.style-preview-v2 .market-card {
  appearance: none;
  width: 100%;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  padding: 14px;
  text-align: left;
  cursor: pointer;
  display: grid;
  gap: 8px;
  transition: background-color .18s ease, border-color .18s ease, transform .18s ease;
}

.style-preview-v2 .market-card:hover {
  background: rgba(255,255,255,.72);
  border-color: var(--line);
}

.style-preview-v2 .market-card.active {
  background: var(--ink);
  border-color: var(--ink);
  color: #fff;
  transform: translateY(-1px);
}

.style-preview-v2 .market-card strong {
  font-family: var(--en);
  font-size: 15px;
  line-height: 1.15;
}

.style-preview-v2 .market-card span {
  font-family: var(--mono);
  font-size: 10px;
  color: var(--ink-5);
  letter-spacing: .06em;
  text-transform: uppercase;
}

.style-preview-v2 .market-card.active span {
  color: #9f9f9c;
}

.style-preview-v2 .market-card small {
  color: var(--ink-3);
  font-size: 12.5px;
  line-height: 1.45;
}

.style-preview-v2 .market-card.active small {
  color: rgba(250,250,249,.74);
}

.style-preview-v2 .market-detail {
  min-height: 420px;
  padding: 24px;
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 22px;
  overflow: hidden;
}

.style-preview-v2 .market-detail-top {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: start;
}

.style-preview-v2 .market-detail h3 {
  margin: 8px 0 10px;
  font-family: var(--th);
  font-size: clamp(26px, 3vw, 38px);
  font-weight: 600;
  line-height: 1.06;
  letter-spacing: -.012em;
}

.style-preview-v2 .market-detail-desc {
  max-width: 580px;
  margin: 0;
  color: var(--ink-3);
  font-size: 14px;
  line-height: 1.6;
}

.style-preview-v2 .market-output {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  align-content: end;
}

.style-preview-v2 .market-output div {
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 14px;
  background: var(--bg);
}

.style-preview-v2 .market-output span {
  display: block;
  font-family: var(--mono);
  font-size: 9.5px;
  color: var(--ink-5);
  letter-spacing: .08em;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.style-preview-v2 .market-output strong {
  font-family: var(--en);
  font-size: 16px;
}

.style-preview-v2 .market-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.style-preview-v2 .market-badges span {
  border: 1px solid var(--line-strong);
  border-radius: 999px;
  padding: 6px 9px;
  font-family: var(--mono);
  font-size: 10px;
  color: var(--ink-4);
  letter-spacing: .05em;
  text-transform: uppercase;
}

.style-preview-v2 .trust-compact {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 18px;
}

.style-preview-v2 .trust-compact .compact-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.style-preview-v2 .trust-mini-panel {
  border-radius: 10px;
  padding: 24px;
  background: var(--ink);
  color: #fff;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 22px;
}

.style-preview-v2 .trust-mini-panel h3 {
  margin: 0 0 10px;
  font-family: var(--th);
  font-size: 24px;
  font-weight: 600;
}

.style-preview-v2 .trust-mini-panel p {
  margin: 0;
  color: rgba(250,250,249,.72);
  font-size: 13.5px;
  line-height: 1.6;
}

.style-preview-v2 .trust-mini-panel .row {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  border-top: 1px solid rgba(255,255,255,.12);
  padding-top: 10px;
  font-family: var(--mono);
  font-size: 10.5px;
  color: #d7d7d2;
  letter-spacing: .05em;
  text-transform: uppercase;
}

.style-preview-v2 .faq-list.compact-faq {
  display: grid;
  gap: 10px;
}

.style-preview-v2 .developer-compact {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 20px;
  align-items: stretch;
}

.style-preview-v2 .developer-compact h2 {
  color: #fff;
  font-family: var(--th);
  font-size: clamp(30px, 3vw, 44px);
  line-height: 1.08;
  margin: 0 0 14px;
}

.style-preview-v2 .developer-compact p {
  color: #9f9f9c;
  font-size: 14px;
  line-height: 1.65;
  max-width: 620px;
}

.style-preview-v2 .developer-proof {
  border: 1px solid rgba(255,255,255,.14);
  border-radius: 10px;
  padding: 20px;
  background: rgba(255,255,255,.05);
  display: grid;
  gap: 10px;
}

.style-preview-v2 .developer-proof .row {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  color: #d7d7d2;
  font-family: var(--mono);
  font-size: 10.5px;
  letter-spacing: .05em;
  text-transform: uppercase;
}

@keyframes heroHouseFloat {
  0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
  50% { transform: translate3d(0, -12px, 0) scale(1.012); }
}

@keyframes heroHouseScan {
  0%, 100% { opacity: 0.32; transform: translate3d(10px, -8px, 0); }
  50% { opacity: 0.64; transform: translate3d(-8px, 6px, 0); }
}

@keyframes heroMotionLine {
  0%, 100% { transform: translateX(-18px); opacity: 0.2; }
  50% { transform: translateX(18px); opacity: 0.58; }
}

@keyframes heroHouseGlint {
  0%, 18% { opacity: 0; transform: translateX(-34%) skewX(-10deg); }
  34% { opacity: 0.34; }
  48%, 100% { opacity: 0; transform: translateX(38%) skewX(-10deg); }
}

@media (prefers-reduced-motion: reduce) {
  .style-preview-v2 .hero-house-perspective,
  .style-preview-v2 .hero-house-cutout,
  .style-preview-v2 .hero-house-highlight,
  .style-preview-v2 .hero-house-line,
  .style-preview-v2 .hero-house-glint {
    animation: none;
    transition: none;
    transform: none;
  }
}

@media (max-width: 980px) {
  .style-preview-v2 .hero-inner {
    grid-template-columns: 1fr;
    gap: 34px;
    padding: 52px var(--pad-x, 24px) 66px;
  }

  .style-preview-v2 .hero h1 {
    max-width: 100%;
    font-size: 46px;
    line-height: 1.08;
    letter-spacing: 0;
  }

  .style-preview-v2 .hero-house-stage {
    width: 100%;
    min-height: 390px;
  }

  .style-preview-v2 .hero-house-perspective {
    width: min(700px, 112%);
    margin-left: 0;
  }
}

@media (max-width: 640px) {
  .style-preview-v2,
  .style-preview-v2 > div {
    overflow-x: hidden;
  }

  .style-preview-v2 .wrap {
    padding-left: 16px;
    padding-right: 16px;
  }

  .style-preview-v2 .hero-inner {
    grid-template-columns: 1fr;
    gap: 24px;
    padding: 42px 16px 56px;
  }

  .style-preview-v2 .hero h1 {
    font-size: 39px;
    line-height: 1.08;
    letter-spacing: 0;
    max-width: 100%;
    overflow-wrap: anywhere;
  }

  .style-preview-v2 .hero h1 .row {
    max-width: 100%;
    white-space: normal;
  }

  .style-preview-v2 .hero-meta-bar-inner {
    gap: 12px;
    overflow: hidden;
  }

  .style-preview-v2 .hero-house-stage {
    min-height: 340px;
    margin-top: -8px;
  }

  .style-preview-v2 .hero-house-perspective {
    width: 138%;
    margin-left: -18%;
  }

  .style-preview-v2 .hero-house-caption {
    right: 8px;
    bottom: 2px;
  }

  .style-preview-v2 .mock-frame {
    max-width: 100%;
    overflow: hidden;
  }

  .style-preview-v2 .mock-grid {
    grid-template-columns: 1fr;
    min-height: auto;
  }

  .style-preview-v2 .mock-side {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    border-right: 0;
    border-bottom: 1px solid var(--line);
  }

  .style-preview-v2 .mock-side h6 {
    display: none;
  }

  .style-preview-v2 .mock-side .it {
    flex: 0 0 auto;
  }

  .style-preview-v2 .mock-main-head,
  .style-preview-v2 .mock-cards,
  .style-preview-v2 .mock-rows {
    padding-left: 12px;
    padding-right: 12px;
  }

  .style-preview-v2 .mock-main-head {
    align-items: flex-start;
    flex-direction: column;
    gap: 10px;
  }

  .style-preview-v2 .mock-cards {
    grid-template-columns: 1fr;
  }

  .style-preview-v2 .mock-row {
    grid-template-columns: 86px minmax(70px, 1fr) 46px 34px;
    gap: 8px;
  }

  .style-preview-v2 .compact-grid,
  .style-preview-v2 .marketplace-picker,
  .style-preview-v2 .market-output,
  .style-preview-v2 .trust-compact,
  .style-preview-v2 .trust-compact .compact-grid,
  .style-preview-v2 .developer-compact {
    grid-template-columns: 1fr;
  }

  .style-preview-v2 .market-detail {
    min-height: auto;
    padding: 18px;
  }

  .style-preview-v2 .market-detail-top {
    flex-direction: column;
  }

  .style-preview-v2 .market-list {
    grid-template-columns: 1fr;
  }

  .style-preview-v2 .compact-card,
  .style-preview-v2 .trust-mini-panel,
  .style-preview-v2 .developer-proof {
    padding: 18px;
  }
}
`;

function replaceSection(
  body: string,
  startMarker: string,
  endMarker: string,
  replacement: string
) {
  const start = body.indexOf(startMarker);
  const end = body.indexOf(endMarker, start + startMarker.length);
  if (start === -1 || end === -1) return body;
  return `${body.slice(0, start)}${replacement}\n\n${body.slice(end)}`;
}

function compactPainSection(language: StylePreviewLanguage) {
  const en = language === "en";
  return `<!-- PAIN / SOLUTION / RESULT -->
<section class="s alt compact-section" data-screen-label="Pain Solution Result">
  <div class="wrap">
    <div class="s-head">
      <div>
        <div class="s-kicker">03 / Why Buildbybim</div>
        <h2>${en ? "Turn scattered work into reusable data" : "เปลี่ยนงานกระจัดกระจายให้เป็นข้อมูลที่ใช้ต่อได้"}</h2>
      </div>
      <p>${en ? "Start with one immediate task, save the result, and reuse it as workspace context for the next project." : "เริ่มจากงานเฉพาะหน้าที่ต้องทำทันที แล้วเก็บผลลัพธ์ไว้เป็น context สำหรับงานถัดไป"}</p>
    </div>

    <div class="compact-grid">
      <article class="compact-card">
        <span class="lbl">Pain</span>
        <h3>${en ? "Work is split across files and apps" : "งานกระจายอยู่หลายไฟล์ หลายแอป"}</h3>
        <p>${en ? "Plans, BOQ, receipts, posts, and prompts live separately, so every project starts by searching and copying." : "แปลน BOQ สลิป โพสต์ และ prompt อยู่คนละที่ ทำให้เริ่มงานใหม่ด้วยการค้นหาและคัดลอกซ้ำ"}</p>
        <div class="compact-points"><span>PDF</span><span>Excel</span><span>LINE</span><span>Prompt</span></div>
      </article>
      <article class="compact-card">
        <span class="lbl">Solution</span>
        <h3>${en ? "Use a small tool, then save the output" : "ใช้ tool เล็กก่อน แล้วเก็บ output"}</h3>
        <p>${en ? "Each tool solves one job quickly, then stores structured data that can feed prompts, workflows, and agents." : "แต่ละ tool แก้ปัญหาเดียวให้เร็ว แล้วเก็บข้อมูลเป็นโครงสร้างเพื่อส่งต่อให้ prompt, workflow และ agent"}</p>
        <div class="compact-points"><span>Quick</span><span>Saved</span><span>Reusable</span></div>
      </article>
      <article class="compact-card dark">
        <span class="lbl">Result</span>
        <h3>${en ? "The next job starts with context" : "งานถัดไปเริ่มพร้อม context"}</h3>
        <p>${en ? "The system can reuse old drafts, specs, vendors, and templates instead of asking you to rebuild everything." : "ระบบดึง draft, spec, vendor และ template เดิมกลับมาใช้ได้ ไม่ต้องเริ่มใหม่จากศูนย์"}</p>
        <div class="compact-points"><span>4-6x faster</span><span>Versioned</span><span>Agent-ready</span></div>
      </article>
    </div>
  </div>
</section>`;
}

function compactMarketplaceSection(language: StylePreviewLanguage) {
  const en = language === "en";
  const apps = en
    ? [
        ["Plan Review", "Construction", "Upload drawing sets and get sheet, title block, scale, and issue checks.", "Free / AI / Private", "6 issues found", "PDF checklist"],
        ["BOQ Builder", "Construction", "Turn drawing or spec inputs into BOQ drafts with export-ready rows.", "Starter / AI / Saves data", "128 items", "Excel / PDF"],
        ["Receipt Intake", "Site / Finance", "Send a slip through LINE, extract amount/date/vendor, then confirm before saving.", "Support / AI / LINE", "Draft ready", "Workspace log"],
        ["Brief Check", "Design", "Review scope, budget, timeline, and deliverables before accepting the job.", "Free / AI / Private", "4 gaps", "Client checklist"],
        ["Post Generator", "AI Workflow", "Create Facebook captions, hooks, hashtags, and image directions from project notes.", "Free / AI / Public", "3 post angles", "Draft content"],
        ["Prompt Set Library", "Prompts", "Pick reusable prompt sets by role, save versions, and share with a team.", "Member / AI / Team", "240 prompts", "Prompt versions"]
      ]
    : [
        ["Plan Review", "Construction", "อัปโหลดชุดแบบ แล้วตรวจ sheet, title block, scale และรายการปัญหา", "Free / AI / Private", "พบ 6 issues", "PDF checklist"],
        ["BOQ Builder", "Construction", "แปลง drawing หรือ spec เป็น BOQ draft พร้อม export เป็นตาราง", "Starter / AI / Saves data", "128 items", "Excel / PDF"],
        ["Receipt Intake", "Site / Finance", "ส่งสลิปผ่าน LINE อ่านยอด วันที่ ร้านค้า แล้วรอ confirm ก่อนบันทึก", "Support / AI / LINE", "Draft ready", "Workspace log"],
        ["Brief Check", "Design", "ตรวจ scope, budget, timeline และ deliverable ก่อนรับงาน", "Free / AI / Private", "พบ 4 gaps", "Client checklist"],
        ["Post Generator", "AI Workflow", "สร้าง caption, hook, hashtag และมุมภาพจาก note โครงการ", "Free / AI / Public", "3 post angles", "Draft content"],
        ["Prompt Set Library", "Prompts", "เลือก prompt set ตามสายงาน เก็บ version และแชร์ในทีม", "Member / AI / Team", "240 prompts", "Prompt versions"]
      ];

  const cards = apps
    .map(
      ([title, category, desc, meta, output, exportLabel], index) => `
        <button type="button" class="market-card${index === 0 ? " active" : ""}" data-title="${title}" data-category="${category}" data-desc="${desc}" data-meta="${meta}" data-output="${output}" data-export="${exportLabel}">
          <span>${category}</span>
          <strong>${title}</strong>
          <small>${desc}</small>
        </button>`
    )
    .join("");

  const first = apps[0];

  return `<!-- APP MARKETPLACE -->
<section class="s compact-section" data-screen-label="App Marketplace">
  <div class="wrap">
    <div class="s-head">
      <div>
        <div class="s-kicker">04 / App Marketplace</div>
        <h2>${en ? "Choose the tool by job, not by menu depth" : "เลือกแอปจากงานที่ต้องทำ ไม่ใช่จากเมนูยาว ๆ"}</h2>
      </div>
      <p>${en ? "A compact picker shows category, access level, AI usage, privacy, and the output before users start." : "พื้นที่เลือกแอปควรบอกหมวดงาน สิทธิ์การใช้ AI/privacy และ output ที่จะได้ก่อนเริ่มใช้งาน"}</p>
    </div>

    <div class="filters" role="tablist" aria-label="${en ? "App categories" : "หมวดแอป"}">
      <button class="chip active">All <span class="ct">42</span></button>
      <button class="chip">Construction <span class="ct">14</span></button>
      <button class="chip">Design <span class="ct">11</span></button>
      <button class="chip">AI Workflow <span class="ct">9</span></button>
      <button class="chip">Prompts <span class="ct">240</span></button>
    </div>

    <div class="marketplace-picker">
      <div class="market-list">${cards}
      </div>
      <aside class="market-detail" aria-live="polite">
        <div class="market-detail-top">
          <div>
            <span class="market-label">${first[1]}</span>
            <h3 class="market-detail-title">${first[0]}</h3>
            <p class="market-detail-desc">${first[2]}</p>
          </div>
          <div class="market-badges">
            ${first[3].split(" / ").map((badge) => `<span>${badge}</span>`).join("")}
          </div>
        </div>
        <div class="market-output">
          <div><span>${en ? "Expected output" : "ผลลัพธ์"}</span><strong class="market-output-main">${first[4]}</strong></div>
          <div><span>${en ? "Export / save" : "บันทึก / ส่งออก"}</span><strong class="market-output-export">${first[5]}</strong></div>
        </div>
        <a href="#" class="btn btn-solid">${en ? "Open selected tool" : "เปิดแอปที่เลือก"} →</a>
      </aside>
    </div>
  </div>
</section>`;
}

function compactWorkflowSection(language: StylePreviewLanguage) {
  const en = language === "en";
  return `<!-- WORKFLOW -->
<section class="s alt compact-section" id="workflows" data-screen-label="Workflow">
  <div class="wrap">
    <div class="s-head">
      <div>
        <div class="s-kicker">05 / Workflow Model</div>
        <h2>${en ? "One tool can grow into a saved workflow" : "หนึ่ง tool ต่อยอดเป็น workflow ที่บันทึกซ้ำได้"}</h2>
      </div>
      <p>${en ? "The product starts simple: run once, save the result, then automate only when the process is stable." : "ตั้งต้นให้ใช้ง่ายก่อน: ทดลองครั้งเดียว บันทึกผลลัพธ์ แล้วค่อยทำ automation เมื่อขั้นตอนนิ่งแล้ว"}</p>
    </div>
    <div class="compact-grid">
      <article class="compact-card"><span class="lbl">01 / Quick</span><h3>${en ? "Use once" : "ใช้ทันที"}</h3><p>${en ? "No setup. Upload a file, paste text, or choose a prompt and get output fast." : "ไม่ต้อง setup มาก อัปโหลดไฟล์ วางข้อความ หรือเลือก prompt แล้วได้ output เร็ว"}</p><div class="compact-points"><span>No login</span><span>Fast output</span></div></article>
      <article class="compact-card"><span class="lbl">02 / Saved</span><h3>${en ? "Save context" : "เก็บ context"}</h3><p>${en ? "Inputs, prompts, outputs, and decisions are stored in the workspace for reuse." : "เก็บ input, prompt, output และการตัดสินใจไว้ใน workspace เพื่อใช้ซ้ำ"}</p><div class="compact-points"><span>Workspace</span><span>Version</span></div></article>
      <article class="compact-card dark"><span class="lbl">03 / Agent</span><h3>${en ? "Automate later" : "ค่อยให้ agent ทำต่อ"}</h3><p>${en ? "When the workflow is trusted, LINE/email intake can create drafts for human confirmation." : "เมื่อ workflow เชื่อถือได้แล้ว LINE/email intake จะสร้าง draft รอให้คน confirm"}</p><div class="compact-points"><span>Human confirm</span><span>Agent-ready</span></div></article>
    </div>
  </div>
</section>`;
}

function compactTrustSection(language: StylePreviewLanguage) {
  const en = language === "en";
  return `<!-- TRUST -->
<section class="s compact-section" data-screen-label="Trust">
  <div class="wrap">
    <div class="s-head">
      <div>
        <div class="s-kicker">06 / Trust &amp; Security</div>
        <h2>${en ? "Trust comes before automation" : "ความน่าเชื่อถือมาก่อน automation"}</h2>
      </div>
      <p>${en ? "AI should draft, cite sources, and wait for human confirmation before important data is saved." : "AI ควรสร้าง draft อ้างอิง source และรอมนุษย์ confirm ก่อนบันทึกข้อมูลสำคัญ"}</p>
    </div>
    <div class="trust-compact">
      <div class="compact-grid">
        <article class="compact-card"><span class="lbl">Source first</span><h3>${en ? "Every output cites its source" : "ทุก output ต้องย้อนกลับหา source ได้"}</h3><p>${en ? "Users can trace what file, row, image, or prompt generated the result." : "ผู้ใช้ตรวจกลับได้ว่า result มาจากไฟล์ แถว รูป หรือ prompt ไหน"}</p></article>
        <article class="compact-card"><span class="lbl">Draft first</span><h3>${en ? "No silent commits" : "ไม่บันทึกทับแบบเงียบ ๆ"}</h3><p>${en ? "Important data becomes a draft first, then a user confirms it." : "ข้อมูลสำคัญเป็น draft ก่อน แล้วให้ผู้ใช้ยืนยันก่อน commit"}</p></article>
        <article class="compact-card"><span class="lbl">Access checked</span><h3>${en ? "Permissions by app and plan" : "สิทธิ์แยกตามแอปและแผน"}</h3><p>${en ? "Admins can control who sees each tool, workspace, and export." : "แอดมินกำหนดได้ว่าใครเห็น tool, workspace และ export อะไร"}</p></article>
        <article class="compact-card"><span class="lbl">Export ready</span><h3>${en ? "Your data stays portable" : "ข้อมูลต้องนำออกได้"}</h3><p>${en ? "Project, prompt, workflow, and report data can be exported later." : "ข้อมูล project, prompt, workflow และ report ต้อง export กลับไปใช้ต่อได้"}</p></article>
      </div>
      <aside class="trust-mini-panel">
        <div><h3>Privacy by Design</h3><p>${en ? "Each app displays privacy level before use, so users know where data is stored and shared." : "แต่ละแอปแสดง privacy level ก่อนใช้ เพื่อให้รู้ว่าข้อมูลถูกเก็บและแชร์ที่ไหน"}</p></div>
        <div><div class="row"><span>Private</span><span>default</span></div><div class="row"><span>Team</span><span>permission</span></div><div class="row"><span>Public</span><span>opt-in</span></div></div>
      </aside>
    </div>
  </div>
</section>`;
}

function compactFaqSection(language: StylePreviewLanguage) {
  const en = language === "en";
  return `<!-- FAQ -->
<section class="s compact-section" data-screen-label="FAQ">
  <div class="wrap">
    <div class="faq-grid">
      <div class="faq-side">
        <div class="s-kicker">08 / FAQ</div>
        <h2>${en ? "Common questions" : "คำถามที่พบบ่อย"}</h2>
        <p>${en ? "Short answers for first-time users before they open a tool." : "ตอบสั้น ๆ สำหรับผู้ใช้ใหม่ก่อนเริ่มเปิดแอป"}</p>
      </div>
      <div class="faq-list compact-faq">
        <details class="faq" open><summary>${en ? "Do users need BIM knowledge first?" : "ต้องเข้าใจ BIM ก่อนใช้งานไหม?"}</summary><div class="ans">${en ? "No. BIM is the starting audience, but the tools are selected by job: check a plan, create BOQ, write content, or save a prompt." : "ไม่จำเป็น ชื่อเริ่มจากสาย BIM แต่ผู้ใช้เลือกตามงานที่ต้องทำ เช่น ตรวจแปลน ทำ BOQ สร้าง content หรือเก็บ prompt"}</div></details>
        <details class="faq"><summary>${en ? "Can people try it free?" : "ลองใช้ฟรีก่อนได้ไหม?"}</summary><div class="ans">${en ? "Yes. Quick tools should be usable before payment so users can see real output first." : "ได้ Quick tools ควรใช้งานได้ก่อนจ่ายเงิน เพื่อให้เห็น output จริงก่อนตัดสินใจ"}</div></details>
        <details class="faq"><summary>${en ? "Will AI save data automatically?" : "AI จะบันทึกข้อมูลให้อัตโนมัติไหม?"}</summary><div class="ans">${en ? "No. AI creates drafts. Users confirm important data before it is committed to a workspace." : "ไม่ใช่ทันที AI สร้าง draft ก่อน แล้วผู้ใช้ยืนยันข้อมูลสำคัญก่อนบันทึกเข้า workspace"}</div></details>
        <details class="faq"><summary>${en ? "Can it expand beyond construction?" : "ต่อยอดไปสายงานอื่นได้ไหม?"}</summary><div class="ans">${en ? "Yes. The catalog is designed around job categories, roles, privacy level, AI usage, and data storage, so new professions can be added later." : "ได้ เพราะ catalog อิงหมวดงาน อาชีพ privacy level การใช้ AI และการเก็บข้อมูล จึงเพิ่มสายงานอื่นได้ในอนาคต"}</div></details>
      </div>
    </div>
  </div>
</section>`;
}

function compactDeveloperSection(language: StylePreviewLanguage) {
  const en = language === "en";
  return `<!-- DEVELOPER -->
<section class="s dark compact-section" id="developer" data-screen-label="Developer">
  <div class="wrap developer-compact">
    <div>
      <div class="s-kicker">09 / Developer Trust</div>
      <h2>${en ? "Built by an architect solving real work problems" : "สร้างโดยสถาปนิกที่แก้ปัญหางานจริง"}</h2>
      <p>${en ? "Buildbybim.space is not a generic app shelf. It starts from tools the developer needs for construction, design, BIM, documents, and AI workflows, then packages them for other users." : "Buildbybim.space ไม่ใช่แค่ชั้นวางแอปทั่วไป แต่เริ่มจากเครื่องมือที่ผู้พัฒนาต้องใช้จริงในงานก่อสร้าง ออกแบบ BIM เอกสาร และ AI workflow แล้วค่อยเปิดให้คนอื่นใช้ร่วมกัน"}</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:24px">
        <a href="#" class="btn btn-solid" style="background:#fff;color:var(--ink)">${en ? "Read changelog" : "อ่าน Changelog"}</a>
        <a href="#" class="btn btn-line en" style="border-color:rgba(255,255,255,.3);color:#fff">Docs &amp; API</a>
      </div>
    </div>
    <aside class="developer-proof">
      <div class="row"><span>Active apps</span><strong>42</strong></div>
      <div class="row"><span>Prompt sets</span><strong>240+</strong></div>
      <div class="row"><span>Workflow mode</span><strong>Quick / Saved / Agent</strong></div>
      <div class="row"><span>Last shipped</span><strong>v0.4.2</strong></div>
    </aside>
  </div>
</section>`;
}

function compactAppFeatureSection(language: StylePreviewLanguage) {
  const en = language === "en";
  const copy = {
    kicker: "01 / Featured Apps",
    title: en
      ? "Choose an app and start"
      : "เลือกแอปแล้วเริ่มใช้",
    intro: en
      ? "Search, filter, then open the tool you need."
      : "ค้นหา กรองหมวด แล้วเปิดเครื่องมือที่ต้องใช้ได้ทันที",
    cards: [
      {
        no: "APP 01",
        title: en ? "Construction Tools" : "Construction Tools",
        category: "construction",
        body: en
          ? "BOQ, cost data, site checklist, defect notes, and document helpers for construction work."
          : "BOQ, cost data, checklist หน้างาน, defect note และตัวช่วยเอกสารก่อสร้าง",
        tags: ["BOQ", "Site", "Docs"],
        logo: "CT",
        image: appCardConstruction,
        status: en ? "Ready to use" : "พร้อมใช้งาน",
        access: en ? "Free" : "ฟรี",
        accessType: "free",
        href: "/docs",
        secondaryHref: "/boq-data",
        cta: en ? "Open" : "เปิด",
        secondaryCta: en ? "BOQ Data" : "BOQ Data"
      },
      {
        no: "APP 02",
        title: en ? "Architect Brain" : "Architect Brain",
        category: "design",
        body: en
          ? "Plan review, design brief, reference board, and architecture decision support."
          : "ตรวจแปลน, design brief, reference board และตัวช่วยตัดสินใจงานออกแบบ",
        tags: ["Plan", "Design", "BIM"],
        logo: "AB",
        image: appCardArchitect,
        status: en ? "Ready to use" : "พร้อมใช้งาน",
        access: en ? "Free" : "ฟรี",
        accessType: "free",
        href: "/design",
        secondaryHref: "/library",
        cta: en ? "Open" : "เปิด",
        secondaryCta: en ? "Library" : "คลังข้อมูล"
      },
      {
        no: "APP 03",
        title: en ? "AI Workflow" : "AI Workflow",
        category: "ai",
        body: en
          ? "Turn files, slips, forms, and messages into drafts users can confirm before saving."
          : "แปลงไฟล์ สลิป ฟอร์ม และข้อความเป็น draft ให้ผู้ใช้ตรวจ ก่อนบันทึกเข้าระบบ",
        tags: ["Agent", "Draft", "LINE"],
        logo: "AI",
        image: appCardAiWorkflow,
        status: en ? "Ready to use" : "พร้อมใช้งาน",
        access: en ? "Free trial" : "ใช้ฟรี",
        accessType: "free",
        href: "/agent-chat",
        secondaryHref: "/hub",
        cta: en ? "Open" : "เปิด",
        secondaryCta: en ? "App Hub" : "ศูนย์รวมแอป"
      },
      {
        no: "APP 04",
        title: en ? "Prompt & Content Tools" : "Prompt & Content Tools",
        category: "content",
        body: en
          ? "Prompt sets, Facebook post drafts, content workflows, and reusable templates."
          : "Prompt set, draft โพสต์ Facebook, content workflow และ template พร้อมใช้",
        tags: ["Prompt", "Content", "Template"],
        logo: "PC",
        image: appCardContent,
        status: en ? "Member app" : "เฉพาะสมาชิก",
        access: en ? "Member" : "สมาชิก",
        accessType: "member",
        href: "/feed",
        secondaryHref: "/library",
        cta: en ? "Open" : "เปิด",
        secondaryCta: en ? "Prompt Library" : "คลัง Prompt"
      },
      {
        no: "APP 05",
        title: en ? "BOQ Data" : "BOQ Data",
        category: "construction",
        body: en
          ? "Search cost items, keynotes, unit prices, and build a reusable project cost base."
          : "ค้นหารายการราคา keynote ราคาต่อหน่วย และสร้างฐานต้นทุนโครงการไว้ใช้ซ้ำ",
        tags: ["Cost", "Keynote", "Data"],
        logo: "BQ",
        image: appCardBoq,
        status: en ? "Ready to use" : "พร้อมใช้งาน",
        access: en ? "Free" : "ฟรี",
        accessType: "free",
        href: "/boq-data",
        secondaryHref: "/docs",
        cta: en ? "Open" : "เปิด",
        secondaryCta: en ? "Docs" : "เอกสาร"
      },
      {
        no: "APP 06",
        title: en ? "Defect Tracker" : "Defect Tracker",
        category: "construction",
        body: en
          ? "Track defects, site photos, handover status, and project follow-up work."
          : "ติดตาม defect รูปหน้างาน สถานะส่งมอบ และงานค้างของโครงการ",
        tags: ["Defect", "Photo", "Site"],
        logo: "DF",
        image: appCardDefect,
        status: en ? "Ready to use" : "พร้อมใช้งาน",
        access: en ? "Free" : "ฟรี",
        accessType: "free",
        href: "/defect",
        secondaryHref: "/hub",
        cta: en ? "Open" : "เปิด",
        secondaryCta: en ? "App Hub" : "ศูนย์รวมแอป"
      },
      {
        no: "APP 07",
        title: en ? "Cashflow" : "Cashflow",
        category: "business",
        body: en
          ? "Record income, expenses, balances, and practical business cash movement."
          : "บันทึกรายรับ รายจ่าย เงินคงเหลือ และการเคลื่อนไหวเงินสดของธุรกิจ",
        tags: ["Money", "Business", "Report"],
        logo: "CF",
        image: appCardCashflow,
        status: en ? "Ready to use" : "พร้อมใช้งาน",
        access: en ? "Free" : "ฟรี",
        accessType: "free",
        href: "/cashflow",
        secondaryHref: "/clients",
        cta: en ? "Open" : "เปิด",
        secondaryCta: en ? "CRM" : "CRM"
      },
      {
        no: "APP 08",
        title: en ? "App Hub" : "App Hub",
        category: "all",
        body: en
          ? "Start from the central workspace when users are not sure which tool to open first."
          : "เริ่มจากศูนย์รวม workspace สำหรับผู้ใช้ที่ยังไม่แน่ใจว่าควรเปิด tool ไหนก่อน",
        tags: ["Workspace", "Apps", "Start"],
        logo: "HB",
        image: appCardHub,
        status: en ? "Start here" : "เริ่มที่นี่",
        access: en ? "Free" : "ฟรี",
        accessType: "free",
        href: "/hub",
        secondaryHref: "/docs",
        cta: en ? "Open" : "เปิด",
        secondaryCta: en ? "Docs" : "เอกสาร"
      }
    ]
  };
  const tabs = [
    { key: "all", label: en ? "All" : "ทั้งหมด" },
    { key: "free", label: en ? "Free apps" : "แอปฟรี" },
    { key: "construction", label: en ? "Construction" : "ก่อสร้าง" },
    { key: "design", label: en ? "Design" : "ออกแบบ" },
    { key: "ai", label: en ? "AI workflow" : "AI workflow" },
    { key: "content", label: en ? "Content" : "Content" },
    { key: "business", label: en ? "Business" : "ธุรกิจ" }
  ];

  return `<!-- FEATURED APPS -->
<section class="s app-feature-section" id="apps" data-screen-label="Apps">
  <div class="wrap">
    <div class="app-feature-head">
      <div>
        <div class="s-kicker">${copy.kicker}</div>
        <h2>${copy.title}</h2>
      </div>
      <p>${copy.intro}</p>
    </div>
    <div class="app-launcher-panel" data-app-launcher data-app-view="grid">
      <div class="app-market-topbar">
        <div class="app-result-meta">
          <span data-app-count>${copy.cards.length} ${en ? "apps available" : "แอปพร้อมใช้งาน"}</span>
        </div>
        <div class="app-market-tools">
          <label class="app-search-wrap">
            <span class="sr-only">${en ? "Search apps" : "ค้นหาแอป"}</span>
            <svg aria-hidden="true" class="app-search-icon" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.3-4.3"></path>
            </svg>
            <input type="search" data-app-search placeholder="${en ? "Search" : "ค้นหา"}" autocomplete="off" />
          </label>
          <div class="app-view-toggle" aria-label="${en ? "View mode" : "มุมมอง"}">
            <button class="active" type="button" aria-label="${en ? "Grid view" : "มุมมองกริด"}" title="Grid" aria-pressed="true" data-app-view-option="grid">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><rect width="7" height="7" x="3" y="3" rx="1"></rect><rect width="7" height="7" x="14" y="3" rx="1"></rect><rect width="7" height="7" x="14" y="14" rx="1"></rect><rect width="7" height="7" x="3" y="14" rx="1"></rect></svg>
            </button>
            <button type="button" aria-label="${en ? "List view" : "มุมมองลิสต์"}" title="List" aria-pressed="false" data-app-view-option="list">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><line x1="8" x2="21" y1="6" y2="6"></line><line x1="8" x2="21" y1="12" y2="12"></line><line x1="8" x2="21" y1="18" y2="18"></line><line x1="3" x2="3.01" y1="6" y2="6"></line><line x1="3" x2="3.01" y1="12" y2="12"></line><line x1="3" x2="3.01" y1="18" y2="18"></line></svg>
            </button>
          </div>
        </div>
      </div>
      <div class="app-launcher-controls">
        <div class="app-filter-tabs" role="tablist" aria-label="${en ? "Filter apps" : "กรองแอป"}">
          ${tabs
            .map(
              (tab, index) =>
                `<button class="app-filter-tab ${index === 0 ? "active" : ""}" type="button" role="tab" aria-selected="${index === 0 ? "true" : "false"}" data-app-filter="${tab.key}">${tab.label}</button>`
            )
            .join("")}
        </div>
      </div>
      <div class="app-feature-scroll" tabindex="0">
        <div class="app-feature-grid">
          ${copy.cards
            .map(
          (card) => `<article class="app-feature-card ${card.accessType === "free" ? "is-free" : ""}" role="button" tabindex="0" data-app-card data-card-href="${card.href}" data-app-title="${card.title}" data-app-body="${card.body}" data-app-logo="${card.logo}" data-app-image="${card.image}" data-app-no="${card.no}" data-app-status="${card.status}" data-app-tags="${card.tags.join(",")}" data-app-secondary="${card.secondaryCta}" data-category="${card.category}" data-access="${card.accessType}" data-access-label="${card.access}" data-search="${[
                card.title,
                card.body,
                card.category,
                card.access,
                card.status,
                ...card.tags
              ]
                .join(" ")
                .toLowerCase()}">
        <span class="app-card-line"></span>
        <div class="app-thumb app-thumb-${card.category}">
          <img class="app-thumb-img" src="${card.image}" alt="" data-app-card-image />
          <div class="app-thumb-grid"></div>
          <span class="app-thumb-mark">${card.logo}</span>
          <div class="app-card-badges">
            <span class="app-access ${card.accessType === "member" ? "member" : ""}">${card.access}</span>
            <span class="app-tier">${card.category}</span>
          </div>
          <div class="app-thumb-caption">
            <span>${card.no}</span>
            <strong>${card.status}</strong>
          </div>
        </div>
        <div class="app-card-body">
          <div class="app-status-line">${card.category}</div>
          <h3>${card.title}</h3>
          <p>${card.body}</p>
          <div class="app-tags">${card.tags.map((tag) => `<span>${tag}</span>`).join("")}</div>
          <div class="app-feature-actions">
            <span class="app-open">${card.cta}</span>
            <button class="app-image-upload" type="button" aria-label="${en ? "Upload app image" : "อัปโหลดรูปแอป"}" title="${en ? "Upload app image" : "อัปโหลดรูปแอป"}" data-app-upload-trigger>${en ? "IMG" : "รูป"}</button>
            <input class="app-image-input" type="file" accept="image/*" data-app-image-input />
            <span class="app-more">${card.secondaryCta}</span>
          </div>
        </div>
      </article>`
            )
            .join("")}
        </div>
        <div class="app-empty-state" data-app-empty>${en ? "No apps match this filter yet." : "ยังไม่พบแอปที่ตรงกับการค้นหา"}</div>
      </div>
    </div>
    <div class="app-detail-modal" data-app-modal aria-hidden="true">
      <div class="app-detail-backdrop" data-app-modal-close></div>
      <div class="app-detail-dialog" role="dialog" aria-modal="true" aria-labelledby="appDetailTitle">
        <button class="app-detail-close" type="button" aria-label="${en ? "Close" : "ปิด"}" data-app-modal-close>×</button>
        <div class="app-detail-scroll">
          <div class="app-detail-hero">
            <div class="app-detail-thumb" data-modal-thumb>
              <img src="${appCardConstruction}" alt="" data-modal-image />
              <div class="app-thumb-grid"></div>
              <span data-modal-logo>CT</span>
            </div>
            <div class="app-detail-main">
              <div class="app-detail-badges">
                <span class="owned">${en ? "Available" : "พร้อมใช้"}</span>
                <span data-modal-access>Free</span>
                <span data-modal-category>Construction</span>
              </div>
              <h3 id="appDetailTitle" data-modal-title>Construction Tools</h3>
              <div class="app-detail-author">
                <span class="avatar">B</span>
                <span>${en ? "by" : "โดย"} <strong>Build By BIM</strong></span>
              </div>
            </div>
          </div>
          <p class="app-detail-desc" data-modal-body></p>
          <div class="app-detail-stats">
            <div><span>${en ? "Mode" : "โหมด"}</span><strong data-modal-status></strong></div>
            <div><span>${en ? "Data" : "ข้อมูล"}</span><strong>${en ? "Saved draft" : "บันทึกเป็น draft"}</strong></div>
            <div><span>${en ? "AI" : "AI"}</span><strong>${en ? "Optional" : "ใช้เมื่อจำเป็น"}</strong></div>
            <div><span>${en ? "Privacy" : "ความเป็นส่วนตัว"}</span><strong>${en ? "Private first" : "Private first"}</strong></div>
          </div>
          <div class="app-detail-tags" data-modal-tags></div>
        </div>
        <div class="app-detail-actions">
          <a class="app-detail-open" href="/hub" data-modal-open>${en ? "Open app" : "เปิดใช้งานแอป"} <span>-&gt;</span></a>
          <button class="app-detail-ghost" type="button" data-app-modal-close>${en ? "Close" : "ปิด"}</button>
        </div>
      </div>
    </div>
  </div>
</section>`;
}

function applyCompactSections(body: string, language: StylePreviewLanguage) {
  let nextBody = body;
  nextBody = replaceSection(
    nextBody,
    "<!-- PAIN / SOLUTION / RESULT -->",
    "<!-- APP MARKETPLACE -->",
    compactPainSection(language)
  );
  nextBody = replaceSection(
    nextBody,
    "<!-- APP MARKETPLACE -->",
    "<!-- WORKFLOW -->",
    compactMarketplaceSection(language)
  );
  nextBody = replaceSection(
    nextBody,
    "<!-- WORKFLOW -->",
    "<!-- TRUST -->",
    compactWorkflowSection(language)
  );
  nextBody = replaceSection(
    nextBody,
    "<!-- TRUST -->",
    "<!-- PRICING -->",
    compactTrustSection(language)
  );
  nextBody = replaceSection(nextBody, "<!-- FAQ -->", "<!-- DEVELOPER -->", compactFaqSection(language));
  nextBody = replaceSection(
    nextBody,
    "<!-- DEVELOPER -->",
    "<!-- FOOTER -->",
    compactDeveloperSection(language)
  );
  return nextBody;
}

function applyHeroDeveloperFooterOnly(body: string, language: StylePreviewLanguage) {
  let nextBody = body;
  nextBody = replaceSection(
    nextBody,
    "<!-- MODULES -->",
    "<!-- DEVELOPER -->",
    compactAppFeatureSection(language)
  );
  nextBody = replaceSection(
    nextBody,
    "<!-- DEVELOPER -->",
    "<!-- FOOTER -->",
    compactDeveloperSection(language)
  );
  return nextBody;
}

function getPreviewDocument(language: StylePreviewLanguage) {
  const style = handoffHtml.match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? "";
  let body = handoffHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/)?.[1] ?? "";

  body = body
    .replace(/<script>[\s\S]*?<\/script>/g, "")
    .replace(
      /\sonclick="document\.getElementById\('navMenu'\)\.classList\.toggle\('open'\)"/g,
      ""
    )
    .replace(/ style="font-family: &quot;Architects Daughter&quot;"/g, "")
    .replace(
      ' style="font-family: Merriweather; font-weight: 100; text-align: left; letter-spacing: 0px"',
      ""
    );

  body = body.replace(
    /<span class="mk"[^>]*><\/span>/g,
    `<img class="brand-logo" src="${brandLogo}" alt="Buildbybim logo" loading="eager" decoding="async" />`
  );

  body = body.replace(
    /<nav class="nav-menu en" id="navMenu">[\s\S]*?<\/nav>/,
    `<nav class="nav-menu en" id="navMenu">
      <a href="#apps">Apps</a>
      <a href="#developer">Developer</a>
    </nav>`
  );
  body = body.replace(
    /<a href="#tools" class="btn btn-solid">[\s\S]*?<\/a>/,
    `<a href="#apps" class="btn btn-solid">${language === "en" ? "View apps" : "ดู Apps"} <span class="arr">-&gt;</span></a>`
  );
  body = body.replace(
    /<div class="hero-ctas">[\s\S]*?<\/div>\s*<div class="hero-stats">/,
    `<div class="hero-ctas">
        <a href="#apps" class="btn btn-solid btn-hero">${language === "en" ? "View app features" : "ดูฟีเจอร์ Apps"} <span class="arr">-&gt;</span></a>
        <a href="#developer" class="btn btn-line btn-hero en">${language === "en" ? "About developer" : "ดูผู้พัฒนา"}</a>
      </div>
      <div class="hero-stats">`
  );

  body = body.replace(
    /    <!-- product mockup -->[\s\S]*?\n  <div class="logos">/,
    `    <!-- hero house motion -->
    <div class="hero-house-stage" aria-hidden="true">
      <div class="hero-house-perspective">
        <div class="hero-house-cutout">
          <img src="${heroHouseImage}" alt="" />
          <span class="hero-house-highlight"></span>
          <span class="hero-house-glint"></span>
          <span class="hero-house-line l1"></span>
          <span class="hero-house-line l2"></span>
          <span class="hero-house-line l3"></span>
        </div>
      </div>
      <div class="hero-house-caption">
        <span>BIM motion visual</span>
        <strong>House model / source-first</strong>
      </div>
    </div>
  </div>

  <div class="logos">`
  );

  body = body.replace(/\n  <div class="logos">[\s\S]*?\n<\/section>/, "\n</section>");
  body = applyHeroDeveloperFooterOnly(body, language);
  body = body.replace("<footer>", '<footer id="footer">');
  body = body.replace(
    /<div class="foot-col"><h6>Product<\/h6>[\s\S]*?<\/div>\s*<div class="foot-col"><h6>Plans<\/h6>[\s\S]*?<\/div>/,
    `<div class="foot-col"><h6>Page</h6><a href="#">Hero</a><a href="#apps">Apps</a><a href="#developer">Developer</a><a href="#footer">Footer</a></div>
      <div class="foot-col"><h6>Next</h6><a href="#developer">About</a><a href="#">Docs</a><a href="#">Status</a></div>`
  );

  body = translateStylePreviewBody(body, language);

  return { style, body };
}

function PublicStylePreview() {
  const [language, setLanguage] = useState<StylePreviewLanguage>(() =>
    loadStylePreviewLanguage()
  );

  const preview = useMemo(() => getPreviewDocument(language), [language]);
  const toggleCopy = stylePreviewLanguageToggleCopy[language];

  useEffect(() => {
    saveStylePreviewLanguage(language);
    if (typeof document !== "undefined") {
      document.documentElement.lang = language;
    }
  }, [language]);

  useEffect(() => {
    const root = document.querySelector(".style-preview-v2");
    if (!root) return;

    const resetHeroMotion = (stage: HTMLElement) => {
      stage.style.setProperty("--hero-tilt-x", "0deg");
      stage.style.setProperty("--hero-tilt-y", "0deg");
      stage.style.setProperty("--hero-shift-x", "0px");
      stage.style.setProperty("--hero-shift-y", "0px");
      stage.style.setProperty("--hero-scale", "1");
    };

    const handleMouseMove: EventListener = (event) => {
      const mouseEvent = event as MouseEvent;
      const stage = (mouseEvent.target as Element | null)?.closest(
        ".hero-house-stage"
      ) as HTMLElement | null;
      if (!stage) return;

      const rect = stage.getBoundingClientRect();
      const x = (mouseEvent.clientX - rect.left) / rect.width - 0.5;
      const y = (mouseEvent.clientY - rect.top) / rect.height - 0.5;

      stage.style.setProperty("--hero-tilt-x", `${(-y * 4.2).toFixed(2)}deg`);
      stage.style.setProperty("--hero-tilt-y", `${(x * 5.2).toFixed(2)}deg`);
      stage.style.setProperty("--hero-shift-x", `${(x * 10).toFixed(1)}px`);
      stage.style.setProperty("--hero-shift-y", `${(y * 7).toFixed(1)}px`);
      stage.style.setProperty("--hero-scale", "1.02");
    };

    const handleMouseLeave: EventListener = (event) => {
      const stage = event.currentTarget as HTMLElement;
      resetHeroMotion(stage);
    };

    const updateAppLauncher = (launcher: Element | null) => {
      if (!launcher) return;
      const activeTab = launcher.querySelector<HTMLElement>(".app-filter-tab.active");
      const filter = activeTab?.dataset.appFilter ?? "all";
      const search = launcher
        .querySelector<HTMLInputElement>("[data-app-search]")
        ?.value.trim()
        .toLowerCase() ?? "";
      let visibleCount = 0;

      launcher.querySelectorAll<HTMLElement>("[data-app-card]").forEach((card) => {
        const category = card.dataset.category ?? "";
        const access = card.dataset.access ?? "";
        const searchable = card.dataset.search ?? "";
        const matchesFilter =
          filter === "all" ||
          (filter === "free" && access === "free") ||
          category === filter;
        const matchesSearch = !search || searchable.includes(search);
        const isVisible = matchesFilter && matchesSearch;
        card.classList.toggle("is-hidden", !isVisible);
        if (isVisible) visibleCount += 1;
      });

      const empty = launcher.querySelector<HTMLElement>("[data-app-empty]");
      empty?.classList.toggle("is-visible", visibleCount === 0);

      const count = launcher.querySelector<HTMLElement>("[data-app-count]");
      if (count) {
        count.textContent =
          language === "en"
            ? `${visibleCount} apps available`
            : `${visibleCount} แอปพร้อมใช้งาน`;
      }
    };

    const closeAppModal = () => {
      const modal = root.querySelector<HTMLElement>("[data-app-modal]");
      if (!modal) return;
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    };

    const openAppModal = (card: HTMLElement) => {
      const modal = root.querySelector<HTMLElement>("[data-app-modal]");
      if (!modal) return;

      const setText = (selector: string, value?: string) => {
        const target = modal.querySelector<HTMLElement>(selector);
        if (target) target.textContent = value ?? "";
      };

      setText("[data-modal-logo]", card.dataset.appLogo);
      setText("[data-modal-title]", card.dataset.appTitle);
      setText("[data-modal-body]", card.dataset.appBody);
      setText("[data-modal-access]", card.dataset.accessLabel);
      setText("[data-modal-category]", card.dataset.category);
      setText("[data-modal-status]", card.dataset.appStatus);

      const thumb = modal.querySelector<HTMLElement>("[data-modal-thumb]");
      if (thumb) {
        thumb.className = `app-detail-thumb app-thumb-${card.dataset.category ?? "all"}`;
      }

      const modalImage = modal.querySelector<HTMLImageElement>("[data-modal-image]");
      if (modalImage) {
        modalImage.src = card.dataset.appImage ?? "";
      }

      const tagContainer = modal.querySelector<HTMLElement>("[data-modal-tags]");
      if (tagContainer) {
        tagContainer.replaceChildren(
          ...(card.dataset.appTags ?? "")
            .split(",")
            .filter(Boolean)
            .map((tag) => {
              const item = document.createElement("span");
              item.textContent = `#${tag}`;
              return item;
            })
        );
      }

      const openLink = modal.querySelector<HTMLAnchorElement>("[data-modal-open]");
      if (openLink) {
        openLink.href = card.dataset.cardHref ?? "/hub";
      }

      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      modal.querySelector<HTMLElement>(".app-detail-close")?.focus();
    };

    const handleClick = (event: Event) => {
      if (!(event.target instanceof Element)) return;

      if (event.target.closest("[data-app-modal-close]")) {
        event.preventDefault();
        closeAppModal();
        return;
      }

      const uploadTrigger = event.target.closest("[data-app-upload-trigger]");
      if (uploadTrigger) {
        event.preventDefault();
        event.stopPropagation();
        const uploadCard = uploadTrigger.closest("[data-app-card]");
        uploadCard?.querySelector<HTMLInputElement>("[data-app-image-input]")?.click();
        return;
      }

      const appCard = event.target.closest("[data-app-card]") as HTMLElement | null;
      if (appCard && !event.target.closest("[data-app-search], .app-filter-tab")) {
        event.preventDefault();
        openAppModal(appCard);
        return;
      }

      const anchor = event.target.closest("a") as HTMLAnchorElement | null;
      if (anchor) {
        const href = anchor.getAttribute("href") ?? "";
        if (href.startsWith("#") && href.length > 1) {
          const target = root.querySelector(href);
          if (target) {
            event.preventDefault();
            target.scrollIntoView({ behavior: "smooth", block: "start" });
            window.history.replaceState({}, "", `${window.location.pathname}${href}`);
            return;
          }
        }
        const routeMap: Record<string, string> = {
          "#tools": "/tools",
          "#prompts": "/prompts",
          "#workflows": "/workflows",
          "#pricing": "/pricing"
        };
        const targetRoute = routeMap[href];
        if (targetRoute) {
          event.preventDefault();
          window.history.pushState({}, "", targetRoute);
          window.dispatchEvent(new PopStateEvent("popstate"));
          window.scrollTo({ top: 0, behavior: "instant" });
          return;
        }
        const isSignInOrWorkspace =
          anchor.closest(".nav-cta") &&
          (href === "#" || href === "" || anchor.classList.contains("btn-solid") || anchor.classList.contains("btn-ghost"));
        if (isSignInOrWorkspace) {
          event.preventDefault();
          window.location.href = "/hub";
          return;
        }
      }

      const navToggle = event.target.closest(".nav-toggle");
      if (navToggle) {
        root.querySelector("#navMenu")?.classList.toggle("open");
        return;
      }

      const appViewButton = event.target.closest("[data-app-view-option]") as HTMLElement | null;
      if (appViewButton) {
        event.preventDefault();
        const launcher = appViewButton.closest("[data-app-launcher]") as HTMLElement | null;
        const view = appViewButton.dataset.appViewOption === "list" ? "list" : "grid";
        if (!launcher) return;

        launcher.dataset.appView = view;
        launcher.querySelectorAll<HTMLElement>("[data-app-view-option]").forEach((button) => {
          const isActive = button.dataset.appViewOption === view;
          button.classList.toggle("active", isActive);
          button.setAttribute("aria-pressed", String(isActive));
        });
        return;
      }

      const appFilterTab = event.target.closest(".app-filter-tab") as HTMLElement | null;
      if (appFilterTab) {
        const launcher = appFilterTab.closest("[data-app-launcher]");
        launcher?.querySelectorAll(".app-filter-tab").forEach((item) => {
          item.classList.remove("active");
          item.setAttribute("aria-selected", "false");
        });
        appFilterTab.classList.add("active");
        appFilterTab.setAttribute("aria-selected", "true");
        updateAppLauncher(launcher);
        return;
      }

      const chip = event.target.closest(".chip");
      if (chip) {
        root.querySelectorAll(".chip").forEach((item) => item.classList.remove("active"));
        chip.classList.add("active");
        return;
      }

      const marketCard = event.target.closest(".market-card") as HTMLElement | null;
      if (marketCard) {
        const picker = marketCard.closest(".marketplace-picker");
        picker
          ?.querySelectorAll(".market-card")
          .forEach((item) => item.classList.remove("active"));
        marketCard.classList.add("active");

        const setText = (selector: string, value?: string) => {
          const target = picker?.querySelector(selector);
          if (target && value) target.textContent = value;
        };

        setText(".market-label", marketCard.dataset.category);
        setText(".market-detail-title", marketCard.dataset.title);
        setText(".market-detail-desc", marketCard.dataset.desc);
        setText(".market-output-main", marketCard.dataset.output);
        setText(".market-output-export", marketCard.dataset.export);

        const badgeContainer = picker?.querySelector(".market-badges");
        if (badgeContainer && marketCard.dataset.meta) {
          badgeContainer.innerHTML = marketCard.dataset.meta
            .split(" / ")
            .map((badge) => `<span>${badge}</span>`)
            .join("");
        }
        return;
      }

      const mockSideItem = event.target.closest(".mock-side .it");
      if (mockSideItem) {
        root.querySelectorAll(".mock-side .it").forEach((item) => item.classList.remove("on"));
        mockSideItem.classList.add("on");
        return;
      }

      const mockViewTab = event.target.closest(".mock-main-head .acts span");
      if (mockViewTab) {
        root
          .querySelectorAll(".mock-main-head .acts span")
          .forEach((item) => item.classList.remove("on"));
        mockViewTab.classList.add("on");
      }
    };

    const handleKeyDown = (event: Event) => {
      const keyboardEvent = event as KeyboardEvent;
      if (keyboardEvent.key === "Escape") {
        closeAppModal();
        return;
      }
      if (keyboardEvent.key !== "Enter" && keyboardEvent.key !== " ") return;
      if (!(keyboardEvent.target instanceof Element)) return;

      const appCard = keyboardEvent.target.closest("[data-app-card]") as HTMLElement | null;
      if (appCard && keyboardEvent.target === appCard) {
        keyboardEvent.preventDefault();
        openAppModal(appCard);
      }
    };

    const handleFileChange = (event: Event) => {
      if (!(event.target instanceof HTMLInputElement)) return;
      const imageInput = event.target.closest("[data-app-image-input]") as HTMLInputElement | null;
      const file = imageInput?.files?.[0];
      if (!imageInput || !file || !file.type.startsWith("image/")) return;

      const card = imageInput.closest("[data-app-card]") as HTMLElement | null;
      if (!card) return;

      const reader = new FileReader();
      reader.addEventListener("load", () => {
        if (typeof reader.result !== "string") return;
        card.dataset.appImage = reader.result;
        const cardImage = card.querySelector<HTMLImageElement>("[data-app-card-image]");
        if (cardImage) cardImage.src = reader.result;

        const openModal = root.querySelector<HTMLElement>("[data-app-modal].is-open");
        if (openModal) {
          const modalTitle = openModal.querySelector<HTMLElement>("[data-modal-title]");
          if (modalTitle?.textContent === card.dataset.appTitle) {
            const modalImage = openModal.querySelector<HTMLImageElement>("[data-modal-image]");
            if (modalImage) modalImage.src = reader.result;
          }
        }
      });
      reader.readAsDataURL(file);
      imageInput.value = "";
    };

    const handleInput = (event: Event) => {
      if (!(event.target instanceof Element)) return;
      const searchInput = event.target.closest("[data-app-search]");
      if (searchInput) {
        updateAppLauncher(searchInput.closest("[data-app-launcher]"));
      }
    };

    root.addEventListener("click", handleClick);
    root.addEventListener("keydown", handleKeyDown);
    root.addEventListener("change", handleFileChange);
    root.addEventListener("input", handleInput);
    root.addEventListener("mousemove", handleMouseMove);
    updateAppLauncher(root.querySelector("[data-app-launcher]"));
    window.requestAnimationFrame(() => {
      const hash = window.location.hash;
      if (!hash || hash.length <= 1) return;
      const target = root.querySelector(hash);
      target?.scrollIntoView({ block: "start" });
    });
    root
      .querySelectorAll<HTMLElement>(".hero-house-stage")
      .forEach((stage) => stage.addEventListener("mouseleave", handleMouseLeave));

    return () => {
      root.removeEventListener("click", handleClick);
      root.removeEventListener("keydown", handleKeyDown);
      root.removeEventListener("change", handleFileChange);
      root.removeEventListener("input", handleInput);
      root.removeEventListener("mousemove", handleMouseMove);
      root
        .querySelectorAll<HTMLElement>(".hero-house-stage")
        .forEach((stage) => stage.removeEventListener("mouseleave", handleMouseLeave));
    };
  }, [language]);

  return (
    <div className="style-preview-v2" aria-label="Buildbybim.space landing preview">
      <style>{`${preview.style}\n${responsiveFixes}`}</style>
      <div dangerouslySetInnerHTML={{ __html: preview.body }} />
      <div
        className="style-preview-language-toggle"
        role="group"
        aria-label={toggleCopy.srLabel}
      >
        <span className="sr-only">{toggleCopy.switchTo}</span>
        <button
          type="button"
          className={language === "th" ? "active" : ""}
          aria-pressed={language === "th"}
          onClick={() => setLanguage("th")}
        >
          TH
        </button>
        <button
          type="button"
          className={language === "en" ? "active" : ""}
          aria-pressed={language === "en"}
          onClick={() => setLanguage("en")}
        >
          EN
        </button>
      </div>
    </div>
  );
}

export default PublicStylePreview;
