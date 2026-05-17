import Link from "next/link";

import { KeyRound, ShieldAlert, Store } from "lucide-react";

import { getIsConsoleFromHost, getTenantFromHost } from "@/utils/get-tenant";

import { LoginForm } from "../_components/login-form";
import { GoogleButton } from "../_components/social-auth/google-button";

export default async function Login() {
  const tenant = await getTenantFromHost();
  const isConsole = await getIsConsoleFromHost();

  if (isConsole) {
    return (
      <div className="relative flex w-full max-w-sm flex-col justify-center rounded-lg border border-slate-800/80 bg-slate-900/45 p-8 shadow-2xl backdrop-blur-xl">
        {/* Glow behind the login box */}
        <div className="pointer-events-none absolute -inset-0.5 rounded-lg bg-gradient-to-r from-indigo-500 to-cyan-500 opacity-15 blur" />

        <div className="relative space-y-6">
          <div className="space-y-2 text-center">
            <div className="mb-2 inline-flex rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-2 text-indigo-400">
              <KeyRound className="size-6 animate-pulse" />
            </div>
            <h1 className="font-extrabold text-2xl text-white tracking-tight">ZPOS CORE LOGIN</h1>
            <p className="font-mono text-slate-400 text-xs uppercase tracking-wider">Central Authorization Node</p>
          </div>

          <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3">
            <ShieldAlert className="mt-0.5 size-4 shrink-0 text-rose-400" />
            <p className="text-left font-mono text-[10px] text-rose-300 leading-normal">
              WARNING: Cryptographic access validation required. Unauthorized connections will be immediately terminated
              and logged.
            </p>
          </div>

          <div className="space-y-4">
            <LoginForm />
          </div>

          <div className="border-slate-800/60 border-t pt-2 text-center font-mono text-[10px] text-slate-500">
            SECURE PORT • TLS_AES_256_GCM_SHA384
          </div>
        </div>
      </div>
    );
  }

  // Modern UI for tenants and root login
  return (
    <div className="flex w-full flex-col justify-center space-y-6">
      <div className="mx-auto flex justify-center mb-1">
        {tenant ? (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-300 text-[11px] font-bold shadow-inner tracking-wider uppercase">
            <Store size={12} className="text-blue-400 animate-pulse" />
            <span>Cửa hàng: {tenant.name}</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/5 text-white/70 text-[11px] font-bold shadow-inner tracking-wider uppercase">
            <div className="w-3.5 h-3.5 rounded bg-gradient-to-br from-[#0093ff] to-[#0036ff] flex items-center justify-center text-white text-[9px] font-black">
              Z
            </div>
            <span>ZPOS Cloud</span>
          </div>
        )}
      </div>

      <div className="space-y-2 text-center">
        <h2 className="font-extrabold text-3xl text-white tracking-tight bg-gradient-to-r from-white via-white to-white/75 bg-clip-text text-transparent">
          {tenant ? `Đăng nhập hệ thống` : "Chào mừng trở lại"}
        </h2>
        <p className="text-white/50 text-sm">
          {tenant ? `Nhập thông tin tài khoản cửa hàng của bạn` : "Vui lòng nhập tài khoản để tiếp tục"}
        </p>
      </div>

      <div className="space-y-5">
        <GoogleButton className="flex w-full h-12 items-center justify-center gap-2.5 rounded-xl border border-white/10 bg-white/5 text-white/90 transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:text-white hover:scale-[1.01] active:scale-[0.99] font-semibold text-sm shadow-sm" />

        <div className="flex items-center gap-3 text-xs py-1">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-white/30 font-mono uppercase tracking-wider text-[9px]">
            Hoặc đăng nhập với email
          </span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <LoginForm />
      </div>

      <div className="border-white/10 border-t pt-4 text-center text-white/40 text-sm">
        Bạn chưa có tài khoản?{" "}
        <Link
          prefetch={false}
          className="font-bold text-blue-400 underline-offset-4 transition-colors hover:text-blue-300 hover:underline"
          href="/register"
        >
          Đăng ký ngay
        </Link>
      </div>
    </div>
  );
}
