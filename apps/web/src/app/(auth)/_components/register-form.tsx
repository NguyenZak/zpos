"use client";

import * as React from "react";
import { useState } from "react";

import Link from "next/link";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CheckCircle2, FileText, Home, Loader2 } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  name: z.string().min(2, { message: "Vui lòng nhập họ và tên của bạn." }),
  phone: z
    .string()
    .min(10, { message: "Số điện thoại phải có ít nhất 10 chữ số." })
    .regex(/^[0-9+()-\s]*$/, { message: "Số điện thoại không hợp lệ." }),
  email: z.string().email({ message: "Vui lòng nhập địa chỉ email hợp lệ." }),
  storeName: z.string().min(2, { message: "Vui lòng nhập tên cửa hàng / thương hiệu." }),
  businessType: z.string().min(1, { message: "Vui lòng chọn mô hình kinh doanh." }),
  scale: z.string().min(1, { message: "Vui lòng chọn quy mô cửa hàng." }),
  message: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function RegisterForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedData, setSubmittedData] = useState<FormValues | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      storeName: "",
      businessType: "F&B",
      scale: "1",
      message: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/inquiries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name,
          phone: data.phone,
          email: data.email,
          storeName: data.storeName,
          businessType: data.businessType,
          scale: data.scale,
          message: data.message,
        }),
      });

      const result = await res.json();
      if (result.success) {
        setIsSuccess(true);
        setSubmittedData(data);
        toast.success("Yêu cầu tư vấn của bạn đã được gửi thành công!");
      } else {
        toast.error(result.error || "Gửi yêu cầu thất bại. Vui lòng thử lại.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Đã xảy ra lỗi kết nối. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess && submittedData) {
    return (
      <div className="flex flex-col items-center text-center space-y-6 py-4 animate-fade-in">
        <div className="relative flex items-center justify-center">
          <div className="absolute -inset-1 rounded-full bg-emerald-500/20 blur-md animate-pulse" />
          <CheckCircle2 className="size-16 text-emerald-400 relative z-10 animate-bounce" />
        </div>

        <div className="space-y-2">
          <h3 className="font-extrabold text-2xl text-white tracking-tight">Đăng ký thành công!</h3>
          <p className="text-white/70 text-sm leading-relaxed max-w-sm">
            Cảm ơn bạn đã lựa chọn <strong>ZPOS</strong>. Yêu cầu của bạn đã được chuyển thẳng tới trung tâm điều hành
            CMS.
          </p>
        </div>

        <div className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-left text-xs space-y-2 font-sans text-white/80">
          <div className="flex justify-between border-b border-white/5 pb-2">
            <span className="text-white/40">Khách hàng:</span>
            <span className="font-semibold text-white">{submittedData.name}</span>
          </div>
          <div className="flex justify-between border-b border-white/5 pb-2">
            <span className="text-white/40">Số điện thoại:</span>
            <span className="font-mono font-semibold text-white">{submittedData.phone}</span>
          </div>
          <div className="flex justify-between border-b border-white/5 pb-2">
            <span className="text-white/40">Thương hiệu:</span>
            <span className="font-semibold text-white">{submittedData.storeName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/40">Mô hình:</span>
            <span className="font-semibold text-white">
              {submittedData.businessType === "F&B"
                ? "F&B (Nhà hàng, Quán cafe)"
                : submittedData.businessType === "Retail"
                  ? "Bán lẻ (Thời trang, Mỹ phẩm)"
                  : submittedData.businessType === "Mart"
                    ? "Siêu thị mini, Tiện lợi"
                    : submittedData.businessType === "Pharmacy"
                      ? "Nhà thuốc, Y tế"
                      : "Lĩnh vực khác"}
            </span>
          </div>
        </div>

        <p className="text-xs text-amber-300 font-medium leading-relaxed max-w-xs bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5">
          ⚡ Chuyên viên hỗ trợ ZPOS sẽ liên hệ trực tiếp với bạn qua số điện thoại trên trong vòng 10 - 15 phút tới để
          kích hoạt hệ thống demo!
        </p>

        <div className="flex flex-col sm:flex-row gap-3 w-full pt-2">
          <Link href="/" className="flex-1">
            <Button className="w-full bg-white/10 hover:bg-white/15 border border-white/10 text-white font-semibold text-xs h-11 rounded-lg flex items-center justify-center gap-2">
              <Home size={14} /> Quay lại trang chủ
            </Button>
          </Link>
          <Link href="/docs" className="flex-1">
            <Button className="w-full bg-[#0036FF] hover:bg-[#002ce6] text-white font-semibold text-xs h-11 rounded-lg flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(0,54,255,0.25)]">
              <FileText size={14} /> Xem tài liệu POS
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4 text-left">
      <FieldGroup className="gap-3.5">
        {/* Name Input */}
        <Controller
          control={form.control}
          name="name"
          render={({ field, fieldState }) => (
            <Field className="gap-1.5" data-invalid={fieldState.invalid}>
              <FieldLabel className="text-white/80 text-xs font-semibold" htmlFor="lead-name">
                Họ và tên của bạn
              </FieldLabel>
              <Input
                {...field}
                id="lead-name"
                type="text"
                placeholder="Ví dụ: Nguyễn Văn A"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-10.5 rounded-lg focus-visible:ring-blue-500 focus-visible:border-blue-500 text-sm"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Email & Phone Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Controller
            control={form.control}
            name="phone"
            render={({ field, fieldState }) => (
              <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                <FieldLabel className="text-white/80 text-xs font-semibold" htmlFor="lead-phone">
                  Số điện thoại liên hệ
                </FieldLabel>
                <Input
                  {...field}
                  id="lead-phone"
                  type="tel"
                  placeholder="Ví dụ: 0912345678"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-10.5 rounded-lg focus-visible:ring-blue-500 focus-visible:border-blue-500 font-mono text-sm"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="email"
            render={({ field, fieldState }) => (
              <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                <FieldLabel className="text-white/80 text-xs font-semibold" htmlFor="lead-email">
                  Địa chỉ Email
                </FieldLabel>
                <Input
                  {...field}
                  id="lead-email"
                  type="email"
                  placeholder="ten@doanhnghiep.com"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-10.5 rounded-lg focus-visible:ring-blue-500 focus-visible:border-blue-500 text-sm"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>

        {/* Store Name Input */}
        <Controller
          control={form.control}
          name="storeName"
          render={({ field, fieldState }) => (
            <Field className="gap-1.5" data-invalid={fieldState.invalid}>
              <FieldLabel className="text-white/80 text-xs font-semibold" htmlFor="lead-store">
                Tên thương hiệu / Cửa hàng
              </FieldLabel>
              <Input
                {...field}
                id="lead-store"
                type="text"
                placeholder="Ví dụ: Highlands Coffee, Mart Mini..."
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-10.5 rounded-lg focus-visible:ring-blue-500 focus-visible:border-blue-500 text-sm"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Business Type & Scale Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Controller
            control={form.control}
            name="businessType"
            render={({ field, fieldState }) => (
              <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                <FieldLabel className="text-white/80 text-xs font-semibold" htmlFor="lead-biz-type">
                  Mô hình kinh doanh
                </FieldLabel>
                <NativeSelect
                  {...field}
                  id="lead-biz-type"
                  className="w-full bg-white/5 border-white/10 text-white h-10.5 rounded-lg"
                  aria-invalid={fieldState.invalid}
                >
                  <NativeSelectOption value="F&B">F&B (Nhà hàng, Quán cafe)</NativeSelectOption>
                  <NativeSelectOption value="Retail">Bán lẻ (Thời trang, Mỹ phẩm)</NativeSelectOption>
                  <NativeSelectOption value="Mart">Siêu thị mini, Tiện lợi</NativeSelectOption>
                  <NativeSelectOption value="Pharmacy">Nhà thuốc, Y tế</NativeSelectOption>
                  <NativeSelectOption value="Other">Lĩnh vực khác</NativeSelectOption>
                </NativeSelect>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="scale"
            render={({ field, fieldState }) => (
              <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                <FieldLabel className="text-white/80 text-xs font-semibold" htmlFor="lead-scale">
                  Quy mô chi nhánh
                </FieldLabel>
                <NativeSelect
                  {...field}
                  id="lead-scale"
                  className="w-full bg-white/5 border-white/10 text-white h-10.5 rounded-lg"
                  aria-invalid={fieldState.invalid}
                >
                  <NativeSelectOption value="1">1 Cửa hàng độc lập</NativeSelectOption>
                  <NativeSelectOption value="2-5">Chuỗi 2 - 5 cửa hàng</NativeSelectOption>
                  <NativeSelectOption value=">5">Chuỗi trên 5 cửa hàng</NativeSelectOption>
                </NativeSelect>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>

        {/* Message Input */}
        <Controller
          control={form.control}
          name="message"
          render={({ field, fieldState }) => (
            <Field className="gap-1.5" data-invalid={fieldState.invalid}>
              <FieldLabel className="text-white/80 text-xs font-semibold" htmlFor="lead-message">
                Yêu cầu tư vấn chi tiết (Không bắt buộc)
              </FieldLabel>
              <Textarea
                {...field}
                id="lead-message"
                placeholder="Nhập các mong muốn, tính năng cần tích hợp hoặc câu hỏi dành cho đội ngũ hỗ trợ..."
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-lg min-h-16 text-sm"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>

      <Button
        className="button-primary w-full py-5 text-sm font-bold tracking-wide cursor-pointer font-sans h-11.5 mt-2 flex items-center justify-center gap-2"
        type="submit"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="size-4 animate-spin" /> Đang truyền dữ liệu...
          </>
        ) : (
          "Đăng ký dùng thử hệ thống"
        )}
      </Button>
    </form>
  );
}
