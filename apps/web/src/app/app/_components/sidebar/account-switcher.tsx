"use client";

import { useState, useEffect } from "react";

import { BadgeCheck, Bell, Check, CreditCard, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { clearAllSessions } from "@/utils/clear-session";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn, getInitials } from "@/lib/utils";

const NOTIFICATIONS = [
  {
    id: "n1",
    title: "Đơn hàng mới #1024",
    description: "Khách hàng Bá Khởi vừa hoàn tất đơn hàng trị giá 250,000đ.",
    time: "5 phút trước",
    type: "order",
    unread: true,
  },
  {
    id: "n2",
    title: "Thanh toán thành công",
    description: "Hệ thống VietQR nhận thành công 120,000đ từ MBBank.",
    time: "1 giờ trước",
    type: "payment",
    unread: true,
  },
  {
    id: "n3",
    title: "Hệ thống cập nhật v2.4.0",
    description: "ZPOS đã cập nhật giao diện tối ưu hóa tốc độ load trang thêm 40%.",
    time: "1 ngày trước",
    type: "system",
    unread: false,
  },
];

export function AccountSwitcher({
  users,
}: {
  readonly users: ReadonlyArray<{
    readonly id: string;
    readonly name: string;
    readonly email: string;
    readonly avatar: string;
    readonly role: string;
  }>;
}) {
  const [activeUser, setActiveUser] = useState<any>(null);
  const [displayUsers, setDisplayUsers] = useState<any[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const loadActiveUser = async () => {
      let loggedUser = {
        id: "loading",
        name: "Chủ doanh nghiệp",
        email: "loading...",
        avatar: "",
        role: "Administrator",
      };

      const savedUser = typeof window !== "undefined" ? localStorage.getItem("zpos_mock_user") : null;
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          loggedUser = {
            id: parsed.email,
            name: parsed.full_name || parsed.name || "Chủ doanh nghiệp",
            email: parsed.email || "",
            avatar: parsed.avatar || parsed.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(parsed.full_name || parsed.name || 'User')}`,
            role: parsed.global_role === "super_admin" ? "Super Admin" : "Tenant Owner",
          };
        } catch (e) {
          console.error("Failed to parse mock user in AccountSwitcher:", e);
        }
      } else {
        try {
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", user.id)
              .maybeSingle();

            loggedUser = {
              id: user.id,
              name: profile?.full_name || user.user_metadata?.full_name || "Chủ doanh nghiệp",
              email: user.email || "",
              avatar: profile?.avatar_url || user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile?.full_name || user.user_metadata?.full_name || 'User')}`,
              role: user.user_metadata?.role === "super_admin" ? "Super Admin" : "Tenant Owner",
            };
          }
        } catch (err) {
          console.error("Failed to fetch live user in AccountSwitcher:", err);
        }
      }

      setActiveUser(loggedUser);
      
      try {
        const supabase = createClient();
        let orgId = null;

        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          if (parsed.associated_tenant) {
            const { data: org } = await supabase
              .from("organizations")
              .select("id")
              .eq("slug", parsed.associated_tenant)
              .maybeSingle();
            orgId = org?.id;
          }
        } else {
          const { data: { user: liveUser } } = await supabase.auth.getUser();
          if (liveUser) {
            const { data: member } = await supabase
              .from("organization_members")
              .select("organization_id")
              .eq("profile_id", liveUser.id)
              .maybeSingle();
            orgId = member?.organization_id;
          }
        }

        if (orgId) {
          const { data: members } = await supabase
            .from("organization_members")
            .select("role, profiles(id, email, full_name, avatar_url)")
            .eq("organization_id", orgId);

          if (members && members.length > 0) {
            const realUsers = members
              .filter((m: any) => m.profiles && m.profiles.email.toLowerCase() !== loggedUser.email.toLowerCase())
              .map((m: any) => ({
                id: m.profiles.id,
                name: m.profiles.full_name || "Nhân viên",
                email: m.profiles.email || "",
                avatar: m.profiles.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(m.profiles.full_name || 'Staff')}`,
                role: m.role === "owner" ? "Tenant Owner" : "Staff",
              }));

            setDisplayUsers([loggedUser, ...realUsers]);
            return;
          }
        }
      } catch (err) {
        console.error("Failed to load real organization members in switcher:", err);
      }

      setDisplayUsers([loggedUser]);
    };

    loadActiveUser();
  }, [users]);

  if (!activeUser) {
    return (
      <Avatar className="size-8 rounded-lg animate-pulse bg-slate-800" />
    );
  }

  const handleLogout = async () => {
    try {
      await clearAllSessions();
      toast.success("Đã đăng xuất khỏi hệ thống!");
      router.push("/login");
    } catch (error) {
      console.error("Logout error", error);
      toast.error("Không thể đăng xuất. Vui lòng thử lại.");
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Avatar className="size-8 rounded-lg cursor-pointer">
            <AvatarImage src={activeUser.avatar || undefined} alt={activeUser.name} />
            <AvatarFallback>{getInitials(activeUser.name)}</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="min-w-56 space-y-1 rounded-lg" side="bottom" align="end" sideOffset={4}>
          {displayUsers.map((user) => (
            <DropdownMenuItem
              key={user.email}
              className={cn("p-0", user.id === activeUser.id && "bg-accent/50")}
              aria-current={user.id === activeUser.id ? "true" : undefined}
              onClick={() => setActiveUser(user)}
            >
              <div className="flex w-full items-center gap-2 px-1 py-1.5">
                <Avatar className="size-9 rounded-lg">
                  <AvatarImage src={user.avatar || undefined} alt={user.name} />
                  <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                </Avatar>
                <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user.name}</span>
                  <span className="truncate text-xs capitalize">{user.role}</span>
                </div>
                <span
                  className={cn(
                    "mr-1 flex size-5 items-center justify-center rounded-full text-primary opacity-0",
                    user.id === activeUser.id && "opacity-100",
                  )}
                >
                  <Check aria-hidden="true" />
                </span>
              </div>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => router.push("/app/settings?tab=business")}>
              <BadgeCheck />
              Tài khoản
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/app/settings?tab=payment")}>
              <CreditCard />
              Thanh toán
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setIsNotificationsOpen(true)}>
              <Bell />
              Thông báo
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut />
            Đăng xuất
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 🔔 Notifications Premium Dialog */}
      <Dialog open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
        <DialogContent className="sm:max-w-[480px] bg-slate-950 text-slate-100 border-slate-800 rounded-lg">
          <DialogHeader className="border-b border-slate-800 pb-4">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Bell className="w-5 h-5 text-violet-500 animate-bounce" />
                Thông báo hệ thống
              </DialogTitle>
              <span className="text-[10px] font-extrabold uppercase bg-violet-500/10 text-violet-400 px-2 py-0.5 rounded-full border border-violet-500/20">
                {NOTIFICATIONS.filter(n => n.unread).length} Mới
              </span>
            </div>
            <DialogDescription className="text-slate-400 text-xs mt-1">
              Các cập nhật quan trọng về đơn hàng, thanh toán và vận hành ZPOS.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3 max-h-[350px] overflow-y-auto pr-1">
            {NOTIFICATIONS.map((n) => (
              <div 
                key={n.id} 
                className={`p-3.5 border rounded-xl flex items-start gap-3 transition-colors ${
                  n.unread 
                    ? "bg-violet-950/10 border-violet-500/20 hover:bg-violet-950/20" 
                    : "bg-slate-900/40 border-slate-800 hover:bg-slate-900/60"
                }`}
              >
                <div className="mt-0.5">
                  {n.type === 'order' && (
                    <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
                      <CreditCard className="w-4 h-4" />
                    </div>
                  )}
                  {n.type === 'payment' && (
                    <div className="p-1.5 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20">
                      <CreditCard className="w-4 h-4" />
                    </div>
                  )}
                  {n.type === 'system' && (
                    <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      <Bell className="w-4 h-4" />
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-sm text-slate-200">{n.title}</h5>
                    <span className="text-[10px] text-slate-500 font-medium">{n.time}</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-normal">{n.description}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-800 pt-3 flex justify-between items-center text-xs text-slate-500">
            <span>Tự động đồng bộ mỗi 30s</span>
            <button className="text-violet-400 font-bold hover:underline" onClick={() => toast.success("Đã đánh dấu đọc tất cả!")}>
              Đánh dấu đã đọc tất cả
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
