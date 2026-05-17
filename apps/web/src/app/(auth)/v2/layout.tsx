import type { ReactNode } from "react";
import { Store, Command, ShieldCheck, Terminal, Server, Activity, Database } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { APP_CONFIG } from "@/config/app-config";
import { getTenantFromHost, getIsConsoleFromHost } from "@/utils/get-tenant";

export default async function Layout({ children }: Readonly<{ children: ReactNode }>) {
  const tenant = await getTenantFromHost();
  const isConsole = await getIsConsoleFromHost();

  if (isConsole) {
    return (
      <main className="bg-slate-950 text-slate-100 min-h-dvh overflow-hidden select-none">
        <div className="grid h-dvh justify-center p-3 lg:grid-cols-2">
          {/* Cyberpunk left panel showing active admin command logs */}
          <div className="relative order-2 hidden h-full rounded-3xl bg-slate-900 border border-slate-800 lg:flex flex-col p-10 overflow-hidden shadow-2xl shadow-indigo-500/10">
            {/* Ambient gradients */}
            <div className="absolute top-1/4 -left-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px]" />
            <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-[100px]" />

            {/* Header info */}
            <div className="relative z-10 flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-2xl border border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.15)]">
                <ShieldCheck className="size-8" />
              </div>
              <div>
                <h1 className="font-black text-2xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                  ZPOS CENTRAL CONTROL
                </h1>
                <p className="text-slate-400 text-xs font-mono uppercase tracking-widest mt-0.5 flex items-center gap-1.5">
                  <span className="relative flex size-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full size-2 bg-emerald-500"></span>
                  </span>
                  Master console online • secure shell active
                </p>
              </div>
            </div>

            {/* Console Tech Specs Terminal */}
            <div className="relative z-10 flex-1 flex flex-col justify-center my-8">
              <div className="bg-slate-950/80 backdrop-blur-md rounded-2xl p-6 border border-slate-800/80 font-mono text-xs text-slate-300 leading-relaxed shadow-inner max-w-full space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                    <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold ml-2 flex items-center gap-1">
                    <Terminal className="size-3 text-indigo-400" /> system_monitor.sh
                  </span>
                </div>
                
                <div className="space-y-2">
                  <p className="text-slate-500"># Initializing multi-tenant core services...</p>
                  <p className="text-indigo-400">zpos_saas_node:~ admin$ ./check_health.sh</p>
                  <p className="text-emerald-400">✔ [DATABASE] Connected to Supabase Live Instance (ohmwbxwjmiy...)</p>
                  <p className="text-emerald-400">✔ [EDGE_REWRITER] Local middleware proxy (proxy.ts) compiled successfully.</p>
                  <p className="text-emerald-400">✔ [TENANT_ROUTING] Wildcard domain cookies set to domain: *.localhost</p>
                  <p className="text-slate-400">ℹ [SUBSCRIPTION] Automated billing & billing webhook listener is listening.</p>
                  <p className="text-amber-400">⚡ [MEMCACHE] Redis server operational at 98.4% hitrate.</p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/60 flex items-center gap-3">
                    <Server className="size-6 text-cyan-400" />
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider">Cluster Nodes</p>
                      <p className="text-sm font-black text-slate-200">12 Active</p>
                    </div>
                  </div>
                  <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/60 flex items-center gap-3">
                    <Activity className="size-6 text-pink-400" />
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider">Load Average</p>
                      <p className="text-sm font-black text-slate-200">0.24 Nominal</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Warning */}
            <div className="relative z-10 border-t border-slate-850 pt-5 text-slate-400 text-xs leading-normal">
              <h3 className="font-bold text-slate-200 mb-1 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                <Database className="size-3.5 text-indigo-400 animate-pulse" /> Authorized Personnel Only
              </h3>
              <p className="text-slate-500 text-[10px] font-sans">
                Access to this panel is limited exclusively to authorized ZPOS developers and system administrators. 
                All operations and keystrokes are cryptographic-audited.
              </p>
            </div>
          </div>

          <div className="relative order-1 flex h-full w-full items-center justify-center bg-slate-950 p-6">
            {children}
          </div>
        </div>
      </main>
    );
  }

  // Original layout for normal tenants and root
  return (
    <main>
      <div className="grid h-dvh justify-center p-2 lg:grid-cols-2">
        <div className="relative order-2 hidden h-full rounded-3xl bg-primary lg:flex">
          <div className="absolute top-10 space-y-1 px-10 text-primary-foreground">
            {tenant ? (
              <>
                <Store className="size-10" />
                <h1 className="font-medium text-2xl">{tenant.name}</h1>
                <p className="text-sm">Welcome to your workspace.</p>
              </>
            ) : (
              <>
                <Command className="size-10" />
                <h1 className="font-medium text-2xl">{APP_CONFIG.name}</h1>
                <p className="text-sm">Design. Build. Launch. Repeat.</p>
              </>
            )}
          </div>

          {!tenant && (
            <div className="absolute bottom-10 flex w-full justify-between px-10">
              <div className="flex-1 space-y-1 text-primary-foreground">
                <h2 className="font-medium">Ready to launch?</h2>
                <p className="text-sm">Clone the repo, install dependencies, and your dashboard is live in minutes.</p>
              </div>
              <Separator orientation="vertical" className="mx-3 h-auto!" />
              <div className="flex-1 space-y-1 text-primary-foreground">
                <h2 className="font-medium">Need help?</h2>
                <p className="text-sm">
                  Check out the docs or open an issue on GitHub, community support is just a click away.
                </p>
              </div>
            </div>
          )}
        </div>
        <div className="relative order-1 flex h-full">{children}</div>
      </div>
    </main>
  );
}
