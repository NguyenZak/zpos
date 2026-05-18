"use client";

import * as React from "react";

/**
 * Mounts once at root and registers the ZPOS service worker.
 * In development we explicitly skip registration to avoid stale caching
 * during hot reload.
 */
export function PWARegister() {
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

    const onLoad = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch((e) => console.warn("SW registration failed:", e));
    };
    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad, { once: true });
  }, []);

  return null;
}
