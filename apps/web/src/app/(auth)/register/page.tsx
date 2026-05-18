import Link from "next/link";

import { getTenantFromHost } from "@/utils/get-tenant";

import { RegisterForm } from "../_components/register-form";
import { GoogleButton } from "../_components/social-auth/google-button";

export default async function Register() {
  const tenant = await getTenantFromHost();

  return (
    <div className="flex w-full flex-col justify-center space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="font-extrabold text-3xl text-white tracking-tight">
          {tenant ? "Tạo tài khoản mới" : "Đăng ký dùng thử ZPOS"}
        </h2>
        <p className="text-white/60 text-sm">
          {tenant
            ? `Đăng ký tài khoản cho ${tenant.name}`
            : "Để lại thông tin để kích hoạt tài khoản demo & nhận tư vấn chuyên sâu miễn phí"}
        </p>
      </div>

      <div className="space-y-5">
        {tenant && (
          <>
            <GoogleButton className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-white/10 bg-white/5 py-5 text-white/90 transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:text-white hover:scale-[1.01] active:scale-[0.99] font-medium" />

            <div className="flex items-center gap-3 text-xs">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-white/40 font-mono uppercase tracking-wider text-[10px]">Hoặc đăng ký với</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>
          </>
        )}

        <RegisterForm />
      </div>

      {tenant && (
        <div className="border-white/10 border-t pt-4 text-center text-white/50 text-sm">
          Bạn đã có tài khoản?{" "}
          <Link
            prefetch={false}
            className="font-semibold text-blue-400 underline-offset-4 transition-colors hover:text-blue-300 hover:underline"
            href="/login"
          >
            Đăng nhập
          </Link>
        </div>
      )}
    </div>
  );
}
