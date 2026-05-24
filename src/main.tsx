import { StrictMode, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import PublicSite, { isPublicRoute } from "./PublicSite";
import { registerServiceWorker } from "./pwa";
import "./styles.css";

// Lazy-load workspace App so landing/public visitors don't download workspace bundle
const App = lazy(() => import("./App"));

const showPublic = isPublicRoute(window.location.pathname);

declare global {
  interface Window {
    __buildByBimRoot?: ReturnType<typeof createRoot>;
  }
}

function WorkspaceFallback() {
  return (
    <div
      style={{
        display: "grid",
        placeItems: "center",
        minHeight: "100vh",
        fontFamily: '"IBM Plex Sans Thai", "Onest", system-ui, sans-serif',
        color: "#4A4A47",
        background: "#FAFAF9"
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontFamily: '"JetBrains Mono", ui-monospace, monospace',
            fontSize: 11,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#8A8A86",
            marginBottom: 10
          }}
        >
          Loading workspace
        </div>
        <div style={{ fontSize: 14 }}>Buildbybim.space</div>
      </div>
    </div>
  );
}

const rootElement = document.getElementById("root")!;
const root = window.__buildByBimRoot ?? createRoot(rootElement);
window.__buildByBimRoot = root;

root.render(
  <StrictMode>
    {showPublic ? (
      <PublicSite />
    ) : (
      <Suspense fallback={<WorkspaceFallback />}>
        <App />
      </Suspense>
    )}
  </StrictMode>
);

// PWA registration — production-only, no-op in dev
registerServiceWorker();
