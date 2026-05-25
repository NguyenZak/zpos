"use client";

import React, { useState } from "react";
import { Send, HelpCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { getTenantSlug } from "@/services/pos.service";

export function SidebarSupportCard() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Lỗi phần mềm");
  const [priority, setPriority] = useState("Trung bình");
  const [contactPhone, setContactPhone] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error("Vui lòng nhập đầy đủ tiêu đề và nội dung yêu cầu!");
      return;
    }

    setLoading(true);
    try {
      const tenantSlug = getTenantSlug();
      const tenantName =
        tenantSlug === "app" ? "Zpos Main System" : tenantSlug.charAt(0).toUpperCase() + tenantSlug.slice(1) + " Store";

      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tenantName,
          tenantSlug,
          title,
          description,
          category,
          priority,
          contactPhone,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Gửi yêu cầu hỗ trợ thành công! Đội ngũ ZPOS sẽ liên hệ bạn sớm nhất.");
        setOpen(false);
        // Reset form
        setTitle("");
        setDescription("");
        setCategory("Lỗi phần mềm");
        setPriority("Trung bình");
        setContactPhone("");
      } else {
        toast.error(data.error || "Gửi yêu cầu thất bại. Vui lòng thử lại!");
      }
    } catch (error) {
      console.error("Error submitting ticket:", error);
      toast.error("Có lỗi xảy ra khi gửi yêu cầu. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SidebarGroup className="px-3 py-1 group-data-[collapsible=icon]:hidden border-t border-muted/50 bg-muted/5">
      <SidebarGroupLabel className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground/80 h-7 flex items-center">
        Hỗ trợ kỹ thuật
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu className="gap-1">
          {/* Button 1: Gửi yêu cầu hỗ trợ (Dialog Trigger) */}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <SidebarMenuItem>
                <SidebarMenuButton className="w-full text-xs font-semibold gap-2 h-8.5 hover:bg-muted cursor-pointer transition-all duration-200">
                  <HelpCircle className="size-4 text-indigo-500 animate-pulse" />
                  <span>Gửi yêu cầu hỗ trợ</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                  <HelpCircle className="size-6 text-primary animate-pulse" />
                  Yêu Cầu Hỗ Trợ Kỹ Thuật
                </DialogTitle>
                <DialogDescription>
                  Gửi yêu cầu trực tiếp về hệ thống quản trị. Đội ngũ kỹ thuật viên của ZPOS sẽ xử lý và phản hồi bạn
                  qua số điện thoại sớm nhất có thể.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="category" className="text-xs font-bold text-muted-foreground uppercase">
                      Loại yêu cầu
                    </Label>
                    <NativeSelect
                      id="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="text-sm cursor-pointer"
                    >
                      <option value="Lỗi phần mềm">🐞 Lỗi phần mềm</option>
                      <option value="Yêu cầu tính năng">✨ Yêu cầu tính năng</option>
                      <option value="Hỏi đáp/Tư vấn">💬 Hỏi đáp/Tư vấn</option>
                      <option value="Hóa đơn/Thanh toán">💳 Hóa đơn/Thanh toán</option>
                    </NativeSelect>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="priority" className="text-xs font-bold text-muted-foreground uppercase">
                      Mức độ ưu tiên
                    </Label>
                    <NativeSelect
                      id="priority"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="text-sm cursor-pointer"
                    >
                      <option value="Thấp">🟢 Thấp (Bình thường)</option>
                      <option value="Trung bình">🟡 Trung bình (Cần thiết)</option>
                      <option value="Cao">🔴 Cao (Khẩn cấp)</option>
                    </NativeSelect>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-xs font-bold text-muted-foreground uppercase">
                    Số điện thoại liên hệ
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Nhập số điện thoại của bạn..."
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="title" className="text-xs font-bold text-muted-foreground uppercase">
                    Tiêu đề yêu cầu
                  </Label>
                  <Input
                    id="title"
                    type="text"
                    placeholder="Ví dụ: Không in được hóa đơn bán hàng..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="text-sm"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="description" className="text-xs font-bold text-muted-foreground uppercase">
                    Nội dung chi tiết
                  </Label>
                  <Textarea
                    id="description"
                    rows={4}
                    placeholder="Mô tả chi tiết lỗi bạn đang gặp phải hoặc tính năng bạn mong muốn được bổ sung..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="text-sm resize-none"
                    required
                  />
                </div>

                <DialogFooter className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                    className="text-xs cursor-pointer"
                  >
                    Hủy bỏ
                  </Button>
                  <Button type="submit" disabled={loading} className="text-xs font-bold gap-1.5 cursor-pointer">
                    {loading ? (
                      "Đang gửi..."
                    ) : (
                      <>
                        <Send className="size-3.5" />
                        Gửi ticket
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
