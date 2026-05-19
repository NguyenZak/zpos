"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createClient } from "@/utils/supabase/client";
import { isSuperAdminEmail } from "@/utils/super-admin";
import { ShieldAlert, Mail, Lock, Eye, EyeOff } from "lucide-react";

const formSchema = z.object({
  email: z.string().email({ message: "Vui lòng nhập địa chỉ email hợp lệ." }),
  password: z.string().min(6, { message: "Mật khẩu phải có ít nhất 6 ký tự." }),
  remember: z.boolean().optional(),
});

const getMainDomain = () => {
  if (typeof window === "undefined") return "zpos.click";
  const host = window.location.hostname;
  if (host.includes("localhost") || host.includes("127.0.0.1")) return "localhost";
  if (host.endsWith("zpos-web.vercel.app")) return "zpos-web.vercel.app";
  return "zpos.click";
};

const getSubdomain = () => {
  if (typeof window === "undefined") return null;
  const hostname = window.location.hostname;
  const mainDomain = getMainDomain();
  
  if (hostname === mainDomain || hostname === "localhost" || hostname === "127.0.0.1") {
    return null;
  }
  
  let sub = null;
  if (hostname.endsWith(`.${mainDomain}`)) {
    sub = hostname.replace(`.${mainDomain}`, "");
  } else {
    const parts = hostname.split(".");
    if (parts.length > 1) {
      sub = parts[0];
    }
  }
  
  if (sub && !["www", "app", "console", "cms"].includes(sub)) {
    return sub;
  }
  
  return null;
};

const clearClientMockSession = () => {
  if (typeof window === "undefined") return;

  localStorage.removeItem("zpos_mock_user");
  localStorage.removeItem("zpos_mock_session");

  const cookieName = "zpos_mock_session";
  const host = window.location.hostname;
  const domains = [
    "",
    host,
    `.${host}`,
    "localhost",
    ".localhost",
    "zpos.click",
    ".zpos.click",
    "zpos.vn",
    ".zpos.vn",
    "zpos-web.vercel.app",
    ".zpos-web.vercel.app",
  ];

  domains.forEach((domain) => {
    document.cookie = `${cookieName}=; path=/; max-age=0${domain ? `; domain=${domain}` : ""}`;
  });
};

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const errorParam = params.get("error");
      if (errorParam === "unauthorized_console_access") {
        toast.error("Truy cập bị từ chối!", {
          description: "Tài khoản của bạn không có quyền truy cập vào trang kiểm soát tổng Console.",
        });
      } else if (errorParam === "tenant_access_denied") {
        toast.error("Truy cập bị từ chối!", {
          description: "Tài khoản của bạn không thuộc về chi nhánh/tenant này.",
        });
      }
    }
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      remember: false,
    },
  });


  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setLoginError(null);

    const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const envKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!envUrl || !envKey) {
      const missingErr = "Cấu hình Supabase bị thiếu trên Trình duyệt. Hãy khởi động lại Dev Server (npm run dev) để Next.js nhận file .env.local!";
      setLoginError(missingErr);
      toast.error("Thiếu cấu hình hệ thống!", { description: missingErr });
      setIsLoading(false);
      return;
    }

    const supabase = createClient();
    
    try {
      clearClientMockSession();

      // 1. Try Live Supabase Sign In
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) throw error;

      // Track Live login success
      fetch("/api/admin/audit-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: null,
          user_email: authData.user?.email || data.email,
          user_id: authData.user?.id,
          action: "login_success",
          module: "auth",
          severity: "info",
          metadata: { mode: "live" }
        })
      }).catch(console.error);

      // 3. Live Success Redirection
      toast.success("Đăng nhập thành công!");
      
      const isLocal = 
        window.location.hostname.includes("localhost") || 
        window.location.hostname.includes("127.0.0.1") || 
        window.location.port !== "";
      const port = window.location.port ? `:${window.location.port}` : "";
      
      const params = new URLSearchParams(window.location.search);
      const redirectToParam = params.get("redirectTo");

      const isAuthPath = (path: string) => {
        const clean = path.toLowerCase().trim();
        return (
          clean.startsWith("/v1") ||
          clean.startsWith("/v2") ||
          clean.startsWith("v1") ||
          clean.startsWith("v2") ||
          clean.includes("login") ||
          clean.includes("register")
        );
      };

      if (redirectToParam && !isAuthPath(redirectToParam)) {
        window.location.href = redirectToParam;
        return;
      }

      // 1. Query profiles/organizations to find associated tenant slug first
      const { data: profile } = await supabase
        .from("profiles")
        .select("*, organization_members(organization_id, role, organizations(slug))")
        .eq("id", authData.user.id)
        .maybeSingle();

      const member = profile?.organization_members?.[0];
      const tenantSlug = member?.organizations?.slug;

      // 2. If user is associated with a tenant, redirect them to their subdomain immediately!
      if (tenantSlug) {
        const redirectUrl = isLocal
          ? "/app"
          : `https://${tenantSlug}.${getMainDomain()}/app`;
        window.location.href = redirectUrl;
        return;
      }

      // 3. If NOT a tenant, check if user is a super_admin
      const isConsoleSubdomain = 
        window.location.hostname.startsWith("console.") || 
        window.location.hostname === "console.localhost";

      const isSuperAdmin = isSuperAdminEmail(data.email);

      if (isSuperAdmin) {
        const consoleUrl = isLocal 
          ? "/console" 
          : `https://console.${getMainDomain()}/dashboard`;
        window.location.href = consoleUrl;
        return;
      }

      // 4. Default Fallback
      window.location.href = "/app";

    } catch (err: any) {
      console.error("Auth Exception Caught:", err);
      const rawErrMsg = err?.message || err?.error_description || (typeof err === 'object' ? JSON.stringify(err) : String(err)) || "Vui lòng kiểm tra lại email và mật khẩu.";
      const isEmailUnconfirmed = rawErrMsg.toLowerCase().includes("email not confirmed");
      const errMsg = isEmailUnconfirmed
        ? "Email chưa được xác nhận trong Supabase Auth. Hãy mở Console và lưu lại user này bằng API admin mới, hoặc confirm email trực tiếp trong Supabase Dashboard."
        : rawErrMsg;
      
      // Track failed login
      fetch("/api/admin/audit-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_email: data.email,
          action: "login_failed",
          module: "auth",
          severity: "warning",
          metadata: { error_message: errMsg, password_attempted_length: data.password.length }
        })
      }).catch(console.error);

      setLoginError(errMsg);
      toast.error("Đăng nhập thất bại", {
        description: errMsg,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {loginError && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-200 text-xs font-mono rounded-xl flex items-start gap-2.5 shadow-md">
          <ShieldAlert className="size-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5 text-left">
            <p className="font-extrabold uppercase tracking-wider text-[10px] text-rose-400">Auth Exception Caught</p>
            <p className="leading-normal">{loginError}</p>
          </div>
        </div>
      )}
      
      <FieldGroup className="gap-4">
        <Controller
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <Field className="gap-2" data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="login-email" className="text-white/80 font-semibold text-xs tracking-wide">
                Địa chỉ Email
              </FieldLabel>
              <div className="relative group/input flex items-center w-full">
                <div className="absolute left-3.5 text-white/40 group-focus-within/input:text-blue-400 transition-colors duration-300">
                  <Mail size={16} strokeWidth={2} />
                </div>
                <Input
                  {...field}
                  id="login-email"
                  type="email"
                  placeholder="username@zpos.click"
                  autoComplete="email"
                  aria-invalid={fieldState.invalid}
                  disabled={isLoading}
                  className="h-12 pl-11 pr-4 rounded-xl border-white/10 bg-white/5 placeholder:text-white/20 text-white transition-colors duration-150 focus-visible:border-blue-500/60 focus-visible:ring-4 focus-visible:ring-blue-500/10 focus-visible:bg-[#0c0822]/40"
                />
              </div>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} className="text-rose-400 text-[11px] mt-0.5" />}
            </Field>
          )}
        />
        
        <Controller
          control={form.control}
          name="password"
          render={({ field, fieldState }) => (
            <Field className="gap-2" data-invalid={fieldState.invalid}>
              <div className="flex items-center justify-between">
                <FieldLabel htmlFor="login-password" className="text-white/80 font-semibold text-xs tracking-wide">
                  Mật khẩu
                </FieldLabel>
                <a
                  href="#forgot"
                  className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    toast.info("Tính năng khôi phục mật khẩu đang được bảo trì!");
                  }}
                >
                  Quên mật khẩu?
                </a>
              </div>
              <div className="relative group/input flex items-center w-full">
                <div className="absolute left-3.5 text-white/40 group-focus-within/input:text-blue-400 transition-colors duration-300">
                  <Lock size={16} strokeWidth={2} />
                </div>
                <Input
                  {...field}
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  aria-invalid={fieldState.invalid}
                  disabled={isLoading}
                  className="h-12 pl-11 pr-11 rounded-xl border-white/10 bg-white/5 placeholder:text-white/20 text-white transition-colors duration-150 focus-visible:border-blue-500/60 focus-visible:ring-4 focus-visible:ring-blue-500/10 focus-visible:bg-[#0c0822]/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-white/40 hover:text-white transition-colors p-1 rounded-md hover:bg-white/5"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} className="text-rose-400 text-[11px] mt-0.5" />}
            </Field>
          )}
        />
        
        <Controller
          control={form.control}
          name="remember"
          render={({ field, fieldState }) => (
            <Field orientation="horizontal" data-invalid={fieldState.invalid} className="items-center select-none py-1">
              <Checkbox
                id="login-remember"
                name={field.name}
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                aria-invalid={fieldState.invalid}
                disabled={isLoading}
                className="size-4 rounded border-white/20 bg-white/5 text-blue-500 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 focus-visible:ring-blue-500/30"
              />
              <FieldContent className="ml-2">
                <FieldLabel htmlFor="login-remember" className="font-medium text-xs text-white/60 cursor-pointer hover:text-white/80 transition-colors">
                  Ghi nhớ đăng nhập trong 30 ngày
                </FieldLabel>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </FieldContent>
            </Field>
          )}
        />
      </FieldGroup>
      
      <Button
        className="relative group overflow-hidden h-12 w-full py-6 text-sm font-semibold tracking-wide cursor-pointer rounded-xl bg-[#0036ff] text-white shadow-[0_4px_18px_rgba(0,54,255,0.24)] transition-colors duration-150 hover:bg-[#0056ff] active:scale-[0.99] disabled:opacity-50 mt-1 md:bg-gradient-to-r md:from-[#0093ff] md:to-[#0036ff] md:hover:shadow-[0_4px_30px_rgba(0,147,255,0.35)]"
        type="submit"
        disabled={isLoading}
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          {isLoading ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Đang kết nối bảo mật...</span>
            </>
          ) : (
            <>
              <span>Đăng nhập</span>
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
              </svg>
            </>
          )}
        </span>
        <div className="absolute inset-0 hidden bg-gradient-to-r from-[#00b0ff] to-[#0056ff] opacity-0 transition-opacity duration-300 group-hover:opacity-100 md:block" />
      </Button>

    </form>
  );
}
