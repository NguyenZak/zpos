"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { motion } from "framer-motion";
import { ShieldAlert, Mail, Lock, Eye, EyeOff, Command, ShieldCheck, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createClient } from "@/utils/supabase/client";

const formSchema = z.object({
  email: z.string().email({ message: "Vui lòng nhập địa chỉ email hợp lệ." }),
  password: z.string().min(6, { message: "Mật khẩu phải có ít nhất 6 ký tự." }),
  remember: z.boolean().optional(),
});

interface CMSLoginFormProps {
  onLoginSuccess: () => void;
}

export function CMSLoginForm({ onLoginSuccess }: CMSLoginFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

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

    const supabase = createClient();

    try {
      const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const envKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
      if (!envUrl || !envKey) {
        throw new Error("Cấu hình Supabase bị thiếu. Không thể đăng nhập CMS.");
      }

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) throw authError;

      if (authData.user) {
        const role = authData.user.user_metadata?.role;
        const isCmsAdmin =
          role === "super_admin" || role === "cms_admin" || authData.user.email?.endsWith("@zpos.click");
        if (!isCmsAdmin) {
          await supabase.auth.signOut();
          throw new Error("Tài khoản Supabase này không có quyền truy cập CMS.");
        }

        toast.success("Đăng nhập CMS thành công!");
        onLoginSuccess();
        return;
      }

      throw new Error(
        "Tài khoản hoặc mật khẩu CMS không chính xác. Chỉ tài khoản Quản trị mới được phép truy cập phân hệ CMS.",
      );
    } catch (err: any) {
      console.error("CMS Auth Exception Caught:", err);
      const errMsg = err?.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại.";
      setLoginError(errMsg);
      toast.error("Lỗi đăng nhập", { description: errMsg });

      // Track failed login in audit log
      fetch("/api/admin/audit-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_email: data.email,
          action: "login_failed",
          module: "cms",
          severity: "warning",
          metadata: { error_message: errMsg },
        }),
      }).catch(console.error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Background Decorative Gradients */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-10 right-10 w-[300px] h-[300px] bg-violet-600/5 rounded-full blur-2xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative w-full max-w-[440px]"
      >
        {/* Glow Border Overlay */}
        <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 opacity-20 blur-lg pointer-events-none" />

        {/* main glass card */}
        <div className="relative rounded-lg border border-slate-800/80 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-2xl">
          <div className="space-y-6">
            {/* Header / Brand */}
            <div className="space-y-2 text-center">
              <div className="mb-3 inline-flex rounded-lg border border-indigo-500/20 bg-indigo-500/10 p-3 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
                <Command className="size-7 animate-pulse text-indigo-400" />
              </div>
              <h1 className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                ZPOS CMS PORTAL
              </h1>
              <p className="font-mono text-slate-500 text-[10px] uppercase tracking-widest">
                Phân hệ Biên tập & Quản trị Nội dung
              </p>
            </div>

            {/* Warning Box */}
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
              <ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-400" />
              <p className="text-left font-mono text-[9px] text-amber-300/80 leading-normal uppercase tracking-wider">
                Cảnh báo: Chỉ dành cho nhân viên vận hành hệ thống và cộng tác viên nội dung được cấp quyền.
              </p>
            </div>

            {/* Form Fields */}
            <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
              {loginError && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-200 text-xs font-mono rounded-xl flex items-start gap-2.5 shadow-md"
                >
                  <ShieldAlert className="size-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5 text-left">
                    <p className="font-extrabold uppercase tracking-wider text-[9px] text-rose-400">
                      Exception Encountered
                    </p>
                    <p className="leading-normal">{loginError}</p>
                  </div>
                </motion.div>
              )}

              <FieldGroup className="gap-4">
                <Controller
                  control={form.control}
                  name="email"
                  render={({ field, fieldState }) => (
                    <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="login-email" className="text-slate-400 font-semibold text-xs tracking-wide">
                        Email Quản trị viên
                      </FieldLabel>
                      <div className="relative group/input flex items-center w-full">
                        <div className="absolute left-3.5 text-slate-500 group-focus-within/input:text-indigo-400 transition-colors duration-300">
                          <Mail size={15} strokeWidth={2} />
                        </div>
                        <Input
                          {...field}
                          id="login-email"
                          type="email"
                          placeholder="admin@zpos.click"
                          autoComplete="email"
                          aria-invalid={fieldState.invalid}
                          disabled={isLoading}
                          className="h-11 pl-11 pr-4 rounded-xl border-slate-800/80 bg-slate-950/50 placeholder:text-slate-600 text-slate-200 text-sm transition-all duration-300 focus-visible:border-indigo-500/50 focus-visible:ring-4 focus-visible:ring-indigo-500/10 focus-visible:bg-slate-950"
                        />
                      </div>
                      {fieldState.invalid && (
                        <FieldError
                          errors={[fieldState.error]}
                          className="text-rose-400 text-[10px] mt-0.5 font-medium"
                        />
                      )}
                    </Field>
                  )}
                />

                <Controller
                  control={form.control}
                  name="password"
                  render={({ field, fieldState }) => (
                    <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                      <div className="flex items-center justify-between">
                        <FieldLabel
                          htmlFor="login-password"
                          className="text-slate-400 font-semibold text-xs tracking-wide"
                        >
                          Mật mã mật
                        </FieldLabel>
                      </div>
                      <div className="relative group/input flex items-center w-full">
                        <div className="absolute left-3.5 text-slate-500 group-focus-within/input:text-indigo-400 transition-colors duration-300">
                          <Lock size={15} strokeWidth={2} />
                        </div>
                        <Input
                          {...field}
                          id="login-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          autoComplete="current-password"
                          aria-invalid={fieldState.invalid}
                          disabled={isLoading}
                          className="h-11 pl-11 pr-11 rounded-xl border-slate-800/80 bg-slate-950/50 placeholder:text-slate-600 text-slate-200 text-sm transition-all duration-300 focus-visible:border-indigo-500/50 focus-visible:ring-4 focus-visible:ring-indigo-500/10 focus-visible:bg-slate-950"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 text-slate-500 hover:text-slate-300 transition-colors p-1 rounded-md"
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                      {fieldState.invalid && (
                        <FieldError
                          errors={[fieldState.error]}
                          className="text-rose-400 text-[10px] mt-0.5 font-medium"
                        />
                      )}
                    </Field>
                  )}
                />

                <Controller
                  control={form.control}
                  name="remember"
                  render={({ field, fieldState }) => (
                    <Field
                      orientation="horizontal"
                      data-invalid={fieldState.invalid}
                      className="items-center select-none py-1"
                    >
                      <Checkbox
                        id="login-remember"
                        name={field.name}
                        checked={field.value}
                        onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                        aria-invalid={fieldState.invalid}
                        disabled={isLoading}
                        className="size-4 rounded border-slate-800 bg-slate-950/50 text-indigo-500 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500 focus-visible:ring-indigo-500/30"
                      />
                      <FieldContent className="ml-2">
                        <FieldLabel
                          htmlFor="login-remember"
                          className="font-semibold text-xs text-slate-500 cursor-pointer hover:text-slate-300 transition-colors"
                        >
                          Duy trì đăng nhập trên thiết bị này
                        </FieldLabel>
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </FieldContent>
                    </Field>
                  )}
                />
              </FieldGroup>

              <Button
                className="relative group overflow-hidden h-11 w-full text-sm font-bold tracking-wide cursor-pointer rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[0_4px_15px_rgba(99,102,241,0.2)] hover:shadow-[0_4px_25px_rgba(99,102,241,0.4)] transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 mt-1"
                type="submit"
                disabled={isLoading}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      <span>Đang xác thực thông tin...</span>
                    </>
                  ) : (
                    <>
                      <span>Bắt đầu Vận hành CMS</span>
                      <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-200" />
                    </>
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </Button>
            </form>

            {/* Back to Core App */}
            <div className="text-center pt-2">
              <a
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 font-medium transition-colors"
              >
                <ShieldCheck size={13} />
                Về Cổng Đăng nhập Hệ thống chính (ZPOS Core)
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
