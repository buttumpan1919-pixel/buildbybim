// PWA service worker registration — Sprint 10A (mobile-readiness)
//
// Registers /sw.js on production builds and listens for updates so the
// next reload picks up new assets. No-op in dev (vite serves modules
// fresh) and in browsers without service-worker support.
//
// Also exposes `onPwaInstallReady` so UI can show an "Install" prompt
// at the right moment (Chrome's `beforeinstallprompt` event).

export type PwaInstallPrompt = {
  prompt: () => Promise<{ outcome: "accepted" | "dismissed" }>;
};

let deferredPrompt: PwaInstallPrompt | null = null;
const installListeners = new Set<(prompt: PwaInstallPrompt | null) => void>();

function notifyInstallListeners(prompt: PwaInstallPrompt | null): void {
  for (const cb of installListeners) cb(prompt);
}

/** Subscribe to install-prompt availability. Fires immediately with the
 * current prompt (or null). Returns an unsubscribe function. */
export function onPwaInstallReady(
  callback: (prompt: PwaInstallPrompt | null) => void
): () => void {
  installListeners.add(callback);
  callback(deferredPrompt);
  return () => {
    installListeners.delete(callback);
  };
}

/** Try to trigger the install prompt. Returns true on accept, false otherwise
 * (already installed, browser denies, or no prompt available). */
export async function tryInstallPwa(): Promise<boolean> {
  if (!deferredPrompt) return false;
  const result = await deferredPrompt.prompt();
  deferredPrompt = null;
  notifyInstallListeners(null);
  return result.outcome === "accepted";
}

/** True when the page is currently running in standalone (installed PWA)
 * display mode — handy for hiding "install" buttons. */
export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const matchesStandalone =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(display-mode: standalone)").matches;
  // iOS Safari uses window.navigator.standalone
  const iosStandalone =
    typeof window.navigator !== "undefined" &&
    "standalone" in window.navigator &&
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
  return matchesStandalone || iosStandalone;
}

/** Register the service worker. Safe to call multiple times.
 * No-op in non-browser, in development, or when service workers are
 * unsupported. */
export function registerServiceWorker(): void {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;
  // Skip in dev — Vite already provides hot reload and dev server quirks
  // confuse the cache.
  if (import.meta.env?.DEV) return;

  // Defer registration until after page load so it doesn't compete with
  // first paint
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        // Listen for updates and notify the page (optional auto-update flow)
        registration.addEventListener("updatefound", () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            if (
              installing.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              // New SW waiting — could surface a "refresh to update" toast
              // For Sprint 10A we just log; UI polish later.
              console.info("[PWA] new service worker waiting — reload to apply");
            }
          });
        });
      })
      .catch((err) => {
        console.warn("[PWA] service worker registration failed", err);
      });
  });

  // Capture the install prompt event so UI can fire it on user click
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event as unknown as PwaInstallPrompt;
    notifyInstallListeners(deferredPrompt);
  });

  // Clear prompt after successful installation
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    notifyInstallListeners(null);
  });
}
