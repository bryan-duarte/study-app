"use client";

import { useEffect } from "react";

/**
 * Registers the service worker (public/sw.js).
 *
 * Production-only: in dev, the SW's cache-first behaviour would fight with
 * Next's HMR, so registration is skipped unless NODE_ENV is production.
 *
 * The SW is what flips the app from a bookmark into an installable, offline-
 * capable PWA. It renders nothing.
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" ||
      !("serviceWorker" in navigator)
    ) {
      return;
    }

    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.warn("Service worker registration failed:", error);
    });
  }, []);

  return null;
}
