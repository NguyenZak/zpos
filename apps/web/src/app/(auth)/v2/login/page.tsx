import Link from "next/link";
import { Globe, ShieldAlert, KeyRound } from "lucide-react";
import { APP_CONFIG } from "@/config/app-config";
import { LoginForm } from "../../_components/login-form";
import { GoogleButton } from "../../_components/social-auth/google-button";
import { getTenantFromHost, getIsConsoleFromHost } from "@/utils/get-tenant";

export default async function LoginV2() {
  const tenant = await getTenantFromHost();
  const isConsole = await getIsConsoleFromHost();

  if (isConsole) {
    return (
      <div className="relative w-full max-w-sm flex flex-col justify-center p-8 bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-2xl shadow-2xl">
        {/* Glow behind the login box */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-2xl blur opacity-15" />
        
        <div className="relative space-y-6">
          <div className="space-y-2 text-center">
            <div className="inline-flex p-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl mb-2">
              <KeyRound className="size-6 animate-pulse" />
            </div>
            <h1 className="font-extrabold text-2xl tracking-tight text-white">
              ZPOS CORE LOGIN
            </h1>
            <p className="text-slate-400 text-xs font-mono uppercase tracking-wider">
              Central Authorization Node
            </p>
          </div>

          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-2.5">
            <ShieldAlert className="size-4 text-rose-400 shrink-0 mt-0.5" />
            <p className="text-[10px] text-rose-300 font-mono leading-normal">
              WARNING: Cryptographic access validation required. Unauthorized connections will be immediately terminated and logged.
            </p>
          </div>

          <div className="space-y-4">
            <LoginForm />
          </div>

          <div className="text-center text-[10px] font-mono text-slate-500 pt-2 border-t border-slate-800/60">
            SECURE PORT • TLS_AES_256_GCM_SHA384
          </div>
        </div>
      </div>
    );
  }

  // Original UI for tenants and root
  return (
    <>
      <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[350px]">
        <div className="space-y-2 text-center">
          <h1 className="font-medium text-3xl">
            {tenant ? `Login to ${tenant.name}` : "Login to your account"}
          </h1>
          <p className="text-muted-foreground text-sm">Please enter your details to login.</p>
        </div>
        <div className="space-y-4">
          <GoogleButton className="w-full" />
          <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-border after:border-t">
            <span className="relative z-10 bg-background px-2 text-muted-foreground">Or continue with</span>
          </div>
          <LoginForm />
        </div>
      </div>

      <div className="absolute top-5 flex w-full justify-end px-10">
        <div className="text-muted-foreground text-sm">
          Don&apos;t have an account?{" "}
          <Link prefetch={false} className="text-foreground" href="register">
            Register
          </Link>
        </div>
      </div>

      <div className="absolute bottom-5 flex w-full justify-between px-10">
        <div className="text-sm">{APP_CONFIG.copyright}</div>
        <div className="flex items-center gap-1 text-sm">
          <Globe className="size-4 text-muted-foreground" />
          ENG
        </div>
      </div>
    </>
  );
}
