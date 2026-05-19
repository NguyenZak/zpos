import type { ReactNode } from "react";

import {
  Activity,
  CheckCircle2,
  Command,
  Database,
  Server,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  Terminal,
  TrendingUp,
  Users,
} from "lucide-react";

import { APP_CONFIG } from "@/config/app-config";
import { getIsConsoleFromHost, getTenantFromHost } from "@/utils/get-tenant";
import { LanguageProvider } from "../(marketing)/_components/LanguageContext";
import { Header } from "../(marketing)/_components/Header";
import { Footer } from "../(marketing)/_components/Footer";

export default async function Layout({ children }: Readonly<{ children: ReactNode }>) {
  const tenant = await getTenantFromHost();
  const isConsole = await getIsConsoleFromHost();

  if (isConsole) {
    return (
      <main className="min-h-dvh select-none overflow-hidden bg-slate-950 text-slate-100">
        <div className="grid h-dvh justify-center p-3 lg:grid-cols-2">
          {/* Cyberpunk left panel showing active admin command logs */}
          <div className="relative order-2 hidden h-full flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-900 p-10 shadow-2xl shadow-indigo-500/10 lg:flex">
            {/* Ambient gradients */}
            <div className="absolute top-1/4 -left-20 h-80 w-80 rounded-full bg-indigo-500/10 blur-[100px]" />
            <div className="absolute -right-20 bottom-1/4 h-80 w-80 rounded-full bg-cyan-500/10 blur-[100px]" />

            {/* Header info */}
            <div className="relative z-10 flex items-center gap-3">
              <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/20 p-2.5 text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.15)]">
                <ShieldCheck className="size-8" />
              </div>
              <div>
                <h1 className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text font-black text-2xl text-transparent tracking-wider">
                  ZPOS CENTRAL CONTROL
                </h1>
                <p className="mt-0.5 flex items-center gap-1.5 font-mono text-slate-400 text-xs uppercase tracking-widest">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                  </span>
                  Master console online • secure shell active
                </p>
              </div>
            </div>

            {/* Console Tech Specs Terminal */}
            <div className="relative z-10 my-8 flex flex-1 flex-col justify-center">
              <div className="max-w-full space-y-4 rounded-lg border border-slate-800/80 bg-slate-950/80 p-6 font-mono text-slate-300 text-xs leading-relaxed shadow-inner backdrop-blur-md">
                <div className="flex items-center gap-2 border-slate-800 border-b pb-3">
                  <div className="flex gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-rose-500/80" />
                    <span className="h-3 w-3 rounded-full bg-amber-500/80" />
                    <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="ml-2 flex items-center gap-1 font-bold text-[10px] text-slate-500 uppercase">
                    <Terminal className="size-3 text-indigo-400" /> system_monitor.sh
                  </span>
                </div>

                <div className="space-y-2">
                  <p className="text-slate-500"># Initializing multi-tenant core services...</p>
                  <p className="text-indigo-400">zpos_saas_node:~ admin$ ./check_health.sh</p>
                  <p className="text-emerald-400">✔ [DATABASE] Connected to Supabase Live Instance (ohmwbxwjmiy...)</p>
                  <p className="text-emerald-400">
                    ✔ [EDGE_REWRITER] Local middleware proxy (proxy.ts) compiled successfully.
                  </p>
                  <p className="text-emerald-400">
                    ✔ [TENANT_ROUTING] Wildcard domain cookies set to domain: *.localhost
                  </p>
                  <p className="text-slate-400">
                    ℹ [SUBSCRIPTION] Automated billing & billing webhook listener is listening.
                  </p>
                  <p className="text-amber-400">⚡ [MEMCACHE] Redis server operational at 98.4% hitrate.</p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="flex items-center gap-3 rounded-xl border border-slate-800/60 bg-slate-900/60 p-3.5">
                    <Server className="size-6 text-cyan-400" />
                    <div>
                      <p className="font-black text-[10px] text-slate-500 uppercase tracking-wider">Cluster Nodes</p>
                      <p className="font-black text-slate-200 text-sm">12 Active</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border border-slate-800/60 bg-slate-900/60 p-3.5">
                    <Activity className="size-6 text-pink-400" />
                    <div>
                      <p className="font-black text-[10px] text-slate-500 uppercase tracking-wider">Load Average</p>
                      <p className="font-black text-slate-200 text-sm">0.24 Nominal</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Warning */}
            <div className="relative z-10 border-slate-850 border-t pt-5 text-slate-400 text-xs leading-normal">
              <h3 className="mb-1 flex items-center gap-1.5 font-bold text-[11px] text-slate-200 uppercase tracking-wider">
                <Database className="size-3.5 animate-pulse text-indigo-400" /> Authorized Personnel Only
              </h3>
              <p className="font-sans text-[10px] text-slate-500">
                Access to this panel is limited exclusively to authorized ZPOS developers and system administrators. All
                operations and keystrokes are cryptographic-audited.
              </p>
            </div>
          </div>

          <div className="relative order-1 flex h-full w-full items-center justify-center bg-slate-950 p-5 md:p-6">
            {children}
          </div>
        </div>
      </main>
    );
  }

  // Premium design for tenants and root login layout
  return (
    <LanguageProvider>
      <div className="flex min-h-screen flex-col bg-[#F8FAFC]">
        <Header />
        <main
          className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-[oklch(0.16_0.035_265)] px-4 pt-24 pb-12 md:px-6 md:pt-32 md:pb-20"
        >
          <div
            className="pointer-events-none absolute inset-0 hidden select-none md:block"
            style={{
              background:
                "linear-gradient(0deg, rgb(255, 255, 255), rgb(230, 244, 247) 6.29%, rgb(128, 191, 239) 15.02%, rgb(68, 164, 233) 19.39%, rgb(48, 157, 231), rgb(16, 150, 229) 21.57%, color(xyz-d65 0.241 0.261 0.773), color(xyz-d65 0.23 0.248 0.764) 22.66%, color(xyz-d65 0.21 0.222 0.745) 23.75%, color(xyz-d65 0.188 0.157 0.764) 33.2%, color(xyz-d65 0.178 0.128 0.772), rgb(16, 70, 233) 42.64%, rgb(6, 29, 182) 53.09%, rgb(7, 11, 107) 66.19%, rgb(19, 2, 58) 75.33%, rgb(15, 7, 29) 86.09%, rgb(15, 7, 29))",
            }}
          />
          <div className="pointer-events-none absolute inset-0 select-none bg-[radial-gradient(circle_at_50%_0%,rgba(30,64,175,0.22),transparent_56%)] md:hidden" />

          {/* Glowing circuits background design matching home page */}
          <div className="pointer-events-none absolute inset-0 hidden select-none overflow-hidden opacity-40 md:block">
            <svg
              className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1400px] h-full text-white/5"
              viewBox="0 0 1400 800"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              {/* Central vertical track */}
              <line x1="700" y1="0" x2="700" y2="800" strokeDasharray="5 5" className="text-white/10" />
              
              {/* Circuits */}
              <path d="M 500 150 L 350 150 L 300 200 L 100 200" stroke="#0093ff" strokeWidth="2" strokeDasharray="8 60" className="animate-dash-slow opacity-80" />
              <path d="M 900 150 L 1050 150 L 1100 200 L 1300 200" stroke="#00f0ff" strokeWidth="2" strokeDasharray="8 60" className="animate-dash-slow-reverse opacity-80" />
              
              <circle cx="300" cy="200" r="3" fill="#0093ff" />
              <circle cx="1100" cy="200" r="3" fill="#00f0ff" />
            </svg>
          </div>

          {/* Optimized hardware-accelerated background glowing spheres */}
          <div className="pointer-events-none absolute inset-0 hidden select-none overflow-hidden md:block">
            <div className="absolute top-[20%] left-[10%] h-72 w-72 rounded-full bg-blue-500/10 blur-[100px]" />
            <div className="absolute right-[10%] bottom-[20%] h-96 w-96 rounded-full bg-[#00f0ff]/10 blur-[130px]" />
            <div className="absolute top-[40%] right-[25%] h-80 w-80 rounded-full bg-purple-500/5 blur-[120px]" />
          </div>

          {/* Centralized Glassmorphic Login/Register Card */}
          <div className="relative z-10 w-full max-w-md my-auto">
            <div className="dark relative overflow-hidden rounded-xl border border-white/10 bg-[#0c0822]/95 p-6 shadow-[0_14px_44px_rgba(0,0,0,0.42),inset_0_1px_1px_rgba(255,255,255,0.12)] md:bg-[#0c0822]/60 md:p-10 md:shadow-[0_24px_80px_rgba(0,0,0,0.5),inset_0_1px_2px_rgba(255,255,255,0.15)] md:backdrop-blur-lg">
              {/* Dynamic Animated border beam */}
              <div className="pointer-events-none absolute -inset-px hidden rounded-xl bg-gradient-to-r from-[#0093ff]/20 via-[#0036ff]/20 to-[#00f0ff]/20 opacity-80 md:block" />
              
              {/* Outer subtle glow */}
              <div className="pointer-events-none absolute -inset-0.5 hidden rounded-xl bg-gradient-to-r from-[#0093ff]/10 via-[#0036ff]/10 to-[#00f0ff]/10 opacity-70 blur md:block" />

              <div className="relative z-10 w-full">
                {children}
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </LanguageProvider>
  );
}
