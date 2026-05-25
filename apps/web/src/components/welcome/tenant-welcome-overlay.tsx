"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Store } from "lucide-react";

import { AnimatedBackground } from "./animated-background";
import { GreetingMessage } from "./greeting-message";

type TenantWelcomeOverlayProps = {
  userName?: string;
  tenantName: string;
  branchName?: string;
  logoUrl?: string;
  mode?: "fullscreen" | "inline";
  onVisibilityChange?: (visible: boolean) => void;
  welcomeMessage?: string;
  metrics?: {
    revenueToday?: number;
    ordersToday?: number;
    lowStockCount?: number;
  };
};

export function TenantWelcomeOverlay({
  userName,
  tenantName,
  branchName,
  logoUrl,
  mode = "fullscreen",
  onVisibilityChange,
  welcomeMessage,
  metrics,
}: TenantWelcomeOverlayProps) {
  const [visible, setVisible] = React.useState(false);
  const reducedMotion = useReducedMotion();

  React.useEffect(() => {
    setVisible(true);
    onVisibilityChange?.(true);
  }, [onVisibilityChange]);

  const close = React.useCallback(() => {
    setVisible(false);
    onVisibilityChange?.(false);
  }, [onVisibilityChange]);

  React.useEffect(() => {
    if (!visible) return;
    const handleVisibility = () => {
      if (document.hidden) close();
    };
    const events: Array<keyof WindowEventMap> = ["pointerdown", "touchstart", "keydown", "scroll", "blur", "focus"];
    events.forEach((event) => window.addEventListener(event, close, { passive: true }));
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      events.forEach((event) => window.removeEventListener(event, close));
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [close, visible]);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          role="button"
          aria-label="Đóng màn hình chào mừng"
          tabIndex={0}
          className={
            mode === "inline"
              ? "relative flex min-h-[calc(100vh-132px)] items-center justify-center overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 px-5 py-[max(24px,env(safe-area-inset-top))] text-slate-50 shadow-sm"
              : "fixed inset-0 z-[90] flex min-h-dvh items-center justify-center overflow-hidden px-5 py-[max(24px,env(safe-area-inset-top))] text-slate-50"
          }
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.14 }}
        >
          <AnimatedBackground />
          <motion.div
            className="relative flex min-h-[520px] w-full max-w-[min(96vw,1500px)] flex-col items-center justify-center"
            initial={reducedMotion ? undefined : { opacity: 0, scale: 0.985, filter: "blur(8px)" }}
            animate={reducedMotion ? undefined : { opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={reducedMotion ? undefined : { opacity: 0, scale: 1.015, filter: "blur(8px)" }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div className="mx-auto mb-8 grid h-20 w-20 place-items-center rounded-2xl border border-white/10 bg-white/[0.07] shadow-[0_20px_80px_rgba(0,0,0,0.38),inset_0_1px_0_rgba(255,255,255,0.08)]">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="" className="h-12 w-12 rounded-2xl object-cover" />
              ) : (
                <Store className="h-10 w-10 text-emerald-300" strokeWidth={1.8} />
              )}
            </motion.div>
            <GreetingMessage
              userName={userName}
              tenantName={tenantName}
              branchName={branchName}
              welcomeMessage={welcomeMessage}
            />
            <div className="mt-9 h-1 w-56 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full bg-emerald-300"
                initial={{ x: "-100%" }}
                animate={reducedMotion ? { x: "0%" } : { x: ["-100%", "100%"] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
            <p className="mt-5 text-center text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
              Nhấn bất kỳ đâu để vào dashboard
            </p>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
