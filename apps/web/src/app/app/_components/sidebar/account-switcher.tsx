"use client";

import { useEffect, useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import {
  AlertTriangle,
  BadgeCheck,
  Bell,
  Check,
  Clock,
  CreditCard,
  Loader2,
  LogOut,
  Package,
  ReceiptText,
  Settings,
} from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  APP_NOTIFICATION_CATEGORY_LABELS,
  APP_NOTIFICATION_SETTINGS_EVENT,
  type AppNotificationCategory,
  type AppNotificationItem,
  getDefaultAppNotificationSettings,
  isAppNotificationTypeEnabled,
  loadAppNotificationSettings,
} from "@/lib/app-notifications";
import { cn, getInitials } from "@/lib/utils";
import { posService } from "@/services/pos.service";
import { clearAllSessions } from "@/utils/clear-session";
import { createClient } from "@/utils/supabase/client";

type DisplayUser = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
};

type OrganizationMember = {
  role: string | null;
  profiles: UserProfile | UserProfile[] | null;
};

type UserProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
};

const NOTIFICATION_CATEGORY_ORDER: AppNotificationCategory[] = [
  "order",
  "payment",
  "inventory",
  "shift",
  "staff",
  "system",
  "report",
];

export function AccountSwitcher({
  users: _users,
}: {
  readonly users: ReadonlyArray<{
    readonly id: string;
    readonly name: string;
    readonly email: string;
    readonly avatar: string;
    readonly role: string;
  }>;
}) {
  const [activeUser, setActiveUser] = useState<DisplayUser | null>(null);
  const [displayUsers, setDisplayUsers] = useState<DisplayUser[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState(getDefaultAppNotificationSettings);
  const [rawNotifications, setRawNotifications] = useState<AppNotificationItem[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    const loadActiveUser = async () => {
      const supabase = createClient();
      let liveUserId: string | null = null;
      let loggedUser: DisplayUser = {
        id: "loading",
        name: "Chủ doanh nghiệp",
        email: "loading...",
        avatar: "",
        role: "Administrator",
      };

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          liveUserId = user.id;
          const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();

          loggedUser = {
            id: user.id,
            name: profile?.full_name || user.user_metadata?.full_name || "Chủ doanh nghiệp",
            email: user.email || "",
            avatar:
              profile?.avatar_url ||
              user.user_metadata?.avatar_url ||
              `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile?.full_name || user.user_metadata?.full_name || "User")}`,
            role: user.user_metadata?.role === "super_admin" ? "Super Admin" : "Tenant Owner",
          };
        }
      } catch (err) {
        console.error("Failed to fetch live user in AccountSwitcher:", err);
      }

      setActiveUser(loggedUser);

      try {
        let orgId = null;

        if (liveUserId) {
          const { data: member } = await supabase
            .from("organization_members")
            .select("organization_id")
            .eq("profile_id", liveUserId)
            .maybeSingle();
          orgId = member?.organization_id;
        }

        if (orgId) {
          const { data: members } = await supabase
            .from("organization_members")
            .select("role, profiles(id, email, full_name, avatar_url)")
            .eq("organization_id", orgId);

          if (members && members.length > 0) {
            const realUsers = (members as OrganizationMember[])
              .map((m) => ({
                role: m.role,
                profile: Array.isArray(m.profiles) ? m.profiles[0] : m.profiles,
              }))
              .filter((m): m is { role: string | null; profile: UserProfile & { email: string } } => {
                const email = m.profile?.email;
                if (!email) return false;
                return email.toLowerCase() !== loggedUser.email.toLowerCase();
              })
              .map((m) => ({
                id: m.profile.id,
                name: m.profile.full_name || "Nhân viên",
                email: m.profile.email || "",
                avatar:
                  m.profile.avatar_url ||
                  `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(m.profile.full_name || "Staff")}`,
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

    void loadActiveUser();
  }, []);

  useEffect(() => {
    const handleSettingsUpdate = () => {
      setNotificationSettings(loadAppNotificationSettings());
    };

    handleSettingsUpdate();
    window.addEventListener(APP_NOTIFICATION_SETTINGS_EVENT, handleSettingsUpdate);
    window.addEventListener("storage", handleSettingsUpdate);
    return () => {
      window.removeEventListener(APP_NOTIFICATION_SETTINGS_EVENT, handleSettingsUpdate);
      window.removeEventListener("storage", handleSettingsUpdate);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadNotifications = async () => {
      setNotificationsLoading(true);
      try {
        const [orders, products] = await Promise.all([posService.getOrders(), posService.getProducts()]);
        if (!cancelled) {
          setRawNotifications(
            buildRealNotifications(orders || [], products || [], notificationSettings.staleProductDays),
          );
        }
      } catch (error) {
        console.error("Failed to load app notifications:", error);
        if (!cancelled) {
          setRawNotifications([
            {
              id: "system-load-notifications-failed",
              type: "sync_failed",
              category: "system",
              title: "Không tải được thông báo",
              description: "Hệ thống chưa lấy được dữ liệu đơn hàng và kho. Kiểm tra kết nối hoặc đồng bộ lại dữ liệu.",
              time: "Vừa xong",
              unread: true,
              actionLabel: "Kiểm tra đồng bộ",
              actionHref: "/app/sync",
            },
          ]);
        }
      } finally {
        if (!cancelled) setNotificationsLoading(false);
      }
    };

    if (isNotificationsOpen || rawNotifications.length === 0) {
      void loadNotifications();
    }

    return () => {
      cancelled = true;
    };
  }, [isNotificationsOpen, notificationSettings.staleProductDays]);

  const notifications = useMemo(() => {
    return rawNotifications
      .filter((item) => isAppNotificationTypeEnabled(notificationSettings, item.type))
      .map((item) => ({
        ...item,
        unread: item.unread && !readNotificationIds.includes(item.id),
      }));
  }, [notificationSettings, rawNotifications, readNotificationIds]);

  const unreadCount = notifications.filter((item) => item.unread).length;
  const groupedNotifications = useMemo(() => {
    return NOTIFICATION_CATEGORY_ORDER.map((category) => ({
      category,
      items: notifications.filter((item) => item.category === category),
    })).filter((group) => group.items.length > 0);
  }, [notifications]);

  if (!activeUser) {
    return <Avatar className="size-8 rounded-lg animate-pulse bg-slate-800" />;
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
      <button
        type="button"
        aria-label="Mở thông báo"
        className="relative inline-flex size-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        onClick={() => setIsNotificationsOpen(true)}
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-4 text-destructive-foreground">
            {unreadCount}
          </span>
        )}
      </button>

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
              onClick={(event) => {
                if (user.id !== activeUser.id) {
                  event.preventDefault();
                }
              }}
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
              Thông báo App
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut />
            Đăng xuất
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
        <DialogContent className="sm:max-w-[760px] rounded-lg">
          <DialogHeader className="border-b pb-4">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                Thông báo App
              </DialogTitle>
              <span className="text-[10px] font-extrabold uppercase bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
                {unreadCount} Mới
              </span>
            </div>
            <DialogDescription className="text-xs mt-1">
              Chỉ hiển thị các loại thông báo đang bật trong Cài đặt hệ thống.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4 max-h-[62vh] min-h-[430px] overflow-y-auto pr-2">
            {notificationsLoading ? (
              <div className="flex min-h-[360px] items-center justify-center rounded-xl border border-dashed">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Đang tải...
                </div>
              </div>
            ) : notifications.length > 0 ? (
              groupedNotifications.map((group) => (
                <NotificationGroup
                  key={group.category}
                  category={group.category}
                  notifications={group.items}
                  onAction={(href) => {
                    setIsNotificationsOpen(false);
                    router.push(href);
                  }}
                />
              ))
            ) : (
              <div className="rounded-xl border border-dashed p-6 text-center">
                <Bell className="mx-auto mb-2 size-5 text-muted-foreground" />
                <p className="text-sm font-semibold">Không có thông báo đang bật</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Vào Cài đặt hệ thống để bật lại các loại thông báo cần theo dõi.
                </p>
              </div>
            )}
          </div>
          <div className="border-t pt-3 flex justify-between items-center text-xs text-muted-foreground">
            <button
              type="button"
              className="font-semibold text-primary hover:underline"
              onClick={() => router.push("/app/settings?tab=app-notifications")}
            >
              Cài đặt thông báo
            </button>
            <button
              type="button"
              className="font-semibold text-primary hover:underline"
              onClick={() => {
                setReadNotificationIds(notifications.map((item) => item.id));
                toast.success("Đã đánh dấu đọc tất cả!");
              }}
            >
              Đánh dấu đã đọc tất cả
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function NotificationGroup({
  category,
  notifications,
  onAction,
}: {
  category: AppNotificationCategory;
  notifications: AppNotificationItem[];
  onAction: (href: string) => void;
}) {
  const Icon = getNotificationIcon(category);
  const unreadCount = notifications.filter((notification) => notification.unread).length;

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex size-6 items-center justify-center rounded-md border",
              getNotificationTone(category),
            )}
          >
            <Icon className="size-3.5" />
          </span>
          <h4 className="text-sm font-bold">{APP_NOTIFICATION_CATEGORY_LABELS[category]}</h4>
        </div>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
          {unreadCount > 0 ? `${unreadCount} mới` : `${notifications.length} mục`}
        </span>
      </div>
      <div className="space-y-2">
        {notifications.map((notification) => (
          <NotificationRow key={notification.id} notification={notification} onAction={onAction} />
        ))}
      </div>
    </section>
  );
}

function NotificationRow({
  notification,
  onAction,
}: {
  notification: AppNotificationItem;
  onAction: (href: string) => void;
}) {
  const Icon = getNotificationIcon(notification.category);

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border p-3.5 transition-colors hover:bg-muted/40",
        notification.unread ? "border-primary/25 bg-primary/5" : "bg-card",
      )}
    >
      <div className={cn("mt-0.5 rounded-lg border p-1.5", getNotificationTone(notification.category))}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h5 className="truncate text-sm font-bold">{notification.title}</h5>
          </div>
          <span className="shrink-0 text-[10px] font-medium text-muted-foreground">{notification.time}</span>
        </div>
        <p className="text-xs leading-normal text-muted-foreground">{notification.description}</p>
        {notification.actionLabel && notification.actionHref && (
          <button
            type="button"
            className="text-xs font-bold text-primary hover:underline"
            onClick={() => onAction(notification.actionHref!)}
          >
            {notification.actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}

function buildRealNotifications(orders: any[], products: any[], staleProductDays: number): AppNotificationItem[] {
  const notifications: AppNotificationItem[] = [];
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  const sevenDaysMs = 7 * oneDayMs;

  const sortedOrders = [...orders].sort((a, b) => getTime(b.created_at) - getTime(a.created_at));
  const recentOrders = sortedOrders.filter((order) => now - getTime(order.created_at) <= oneDayMs);

  recentOrders
    .filter((order) => String(order.status || "").toLowerCase() !== "cancelled")
    .slice(0, 5)
    .forEach((order) => {
      notifications.push({
        id: `order-new-${order.id}`,
        type: "order_new",
        category: "order",
        title: `Đơn hàng mới ${order.order_number || `#${String(order.id).slice(0, 8)}`}`,
        description: `${order.customer?.name || "Khách lẻ"} vừa tạo đơn ${formatCurrency(order.total_amount)}.${formatOrderPaymentSuffix(order)}`,
        time: formatRelativeTime(order.created_at),
        unread: true,
        actionLabel: "Xem đơn",
        actionHref: `/app/orders?order=${order.id}`,
      });
    });

  sortedOrders
    .filter((order) => String(order.status || "").toLowerCase() === "cancelled")
    .slice(0, 5)
    .forEach((order) => {
      notifications.push({
        id: `order-cancelled-${order.id}`,
        type: "order_cancelled",
        category: "order",
        title: `Đơn bị hủy ${order.order_number || `#${String(order.id).slice(0, 8)}`}`,
        description: `Đơn ${formatCurrency(order.total_amount)} đã bị hủy. Kiểm tra lý do hủy hoặc thao tác nhân viên nếu cần.`,
        time: formatRelativeTime(order.created_at),
        unread: now - getTime(order.created_at) <= sevenDaysMs,
        actionLabel: "Xem đơn",
        actionHref: `/app/orders?order=${order.id}`,
      });
    });

  sortedOrders
    .filter((order) => {
      const status = String(order.status || "").toLowerCase();
      const paymentStatus = String(order.payment_status || "").toLowerCase();
      return status === "pending" || paymentStatus === "pending" || paymentStatus === "unpaid";
    })
    .slice(0, 5)
    .forEach((order) => {
      notifications.push({
        id: `order-pending-${order.id}`,
        type: "order_pending",
        category: "order",
        title: `Đơn chờ xử lý ${order.order_number || `#${String(order.id).slice(0, 8)}`}`,
        description: `Đơn ${formatCurrency(order.total_amount)} chưa hoàn tất xử lý hoặc thanh toán.`,
        time: formatRelativeTime(order.created_at),
        unread: true,
        actionLabel: "Xử lý đơn",
        actionHref: `/app/orders?order=${order.id}`,
      });
    });

  sortedOrders
    .filter((order) => ["failed", "cancelled", "error"].includes(String(order.payment_status || "").toLowerCase()))
    .slice(0, 5)
    .forEach((order) => {
      notifications.push({
        id: `payment-failed-${order.id}`,
        type: "payment_failed",
        category: "payment",
        title: `Thanh toán thất bại ${order.order_number || ""}`.trim(),
        description: `Giao dịch ${formatPaymentMethod(order.payment_method)} ${formatCurrency(order.total_amount)} chưa thành công.`,
        time: formatRelativeTime(order.created_at),
        unread: true,
        actionLabel: "Kiểm tra thanh toán",
        actionHref: "/app/finance/payments",
      });
    });

  sortedOrders
    .filter((order) => Array.isArray(order.return_orders) && order.return_orders.length > 0)
    .slice(0, 5)
    .forEach((order) => {
      const refundAmount = order.return_orders.reduce(
        (sum: number, item: any) => sum + Number(item.total_refund_amount || 0),
        0,
      );
      notifications.push({
        id: `refund-requested-${order.id}`,
        type: "refund_requested",
        category: "payment",
        title: `Đơn có trả hàng ${order.order_number || ""}`.trim(),
        description: `Đã phát sinh hoàn tiền/trả hàng ${formatCurrency(refundAmount)} cho đơn này.`,
        time: formatRelativeTime(order.created_at),
        unread: now - getTime(order.created_at) <= sevenDaysMs,
        actionLabel: "Xem hoàn tiền",
        actionHref: `/app/orders?order=${order.id}`,
      });
    });

  const inventoryItems = flattenInventoryItems(products);
  inventoryItems
    .filter((item) => item.stock <= 0)
    .slice(0, 8)
    .forEach((item) => {
      notifications.push({
        id: `out-of-stock-${item.id}`,
        type: "out_of_stock",
        category: "inventory",
        title: "Sản phẩm đã hết hàng",
        description: `${item.name} hiện không còn tồn kho.`,
        time: "Hiện tại",
        unread: true,
        actionLabel: "Kiểm tra kho",
        actionHref: `/app/inventory?item=${item.id}`,
      });
    });

  inventoryItems
    .filter((item) => item.stock > 0 && item.stock <= item.minStock)
    .slice(0, 8)
    .forEach((item) => {
      notifications.push({
        id: `low-stock-${item.id}`,
        type: "low_stock",
        category: "inventory",
        title: "Sản phẩm sắp hết hàng",
        description: `${item.name} chỉ còn ${item.stock}, dưới ngưỡng cảnh báo ${item.minStock}.`,
        time: "Hiện tại",
        unread: true,
        actionLabel: "Kiểm kho",
        actionHref: `/app/inventory?item=${item.id}`,
      });
    });

  buildStaleProductNotifications(inventoryItems, sortedOrders, staleProductDays).forEach((notification) =>
    notifications.push(notification),
  );

  const openShift = readJsonArray("zpos_shifts_active_shift_cache");
  if (openShift.length > 0) {
    notifications.push({
      id: "shift-unclosed-active",
      type: "shift_unclosed",
      category: "shift",
      title: "Có ca đang mở",
      description: "Một ca bán hàng đang mở. Kiểm tra và đóng ca khi kết thúc ngày.",
      time: "Hiện tại",
      unread: true,
      actionLabel: "Xem ca",
      actionHref: "/app/shifts",
    });
  }

  const offlineQueueCount = getOfflineQueueCount();
  if (offlineQueueCount > 0) {
    notifications.push({
      id: "sync-failed-offline-queue",
      type: "sync_failed",
      category: "system",
      title: "Dữ liệu chưa đồng bộ",
      description: `${offlineQueueCount} thay đổi offline đang chờ đồng bộ lên hệ thống.`,
      time: "Hiện tại",
      unread: true,
      actionLabel: "Đồng bộ ngay",
      actionHref: "/app/sync",
    });
  }

  const todayOrders = sortedOrders.filter((order) => isSameDay(order.created_at, new Date()));
  if (todayOrders.length > 0) {
    const revenue = todayOrders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
    notifications.push({
      id: "daily-report-today",
      type: "daily_report",
      category: "report",
      title: "Báo cáo hôm nay",
      description: `${todayOrders.length} đơn, tổng doanh thu ${formatCurrency(revenue)}.`,
      time: "Hôm nay",
      unread: false,
      actionLabel: "Xem báo cáo",
      actionHref: "/app/reports",
    });
  }

  return dedupeNotifications(notifications).slice(0, 50);
}

function flattenInventoryItems(products: any[]) {
  return products.flatMap((product) => {
    const variants = Array.isArray(product.variants) ? product.variants : [];
    const minStock = Number(product.min_stock ?? 5);
    if (variants.length > 0) {
      return variants.map((variant: any) => ({
        id: variant.id,
        productId: product.id,
        name: `${product.name} - ${variant.name}`,
        stock: Number(variant.stock || 0),
        minStock,
      }));
    }

    return [
      {
        id: product.id,
        productId: product.id,
        name: product.name,
        stock: Number(product.stock || 0),
        minStock,
      },
    ];
  });
}

function buildStaleProductNotifications(
  inventoryItems: Array<{ id: string; productId: string; name: string; stock: number; minStock: number }>,
  orders: any[],
  staleProductDays: number,
): AppNotificationItem[] {
  const lastSoldById = new Map<string, Date>();
  orders.forEach((order) => {
    const soldAt = new Date(order.created_at);
    if (Number.isNaN(soldAt.getTime())) return;
    (order.order_items || []).forEach((item: any) => {
      [item.variant_id, item.product_id].filter(Boolean).forEach((id) => {
        const current = lastSoldById.get(id);
        if (!current || soldAt > current) lastSoldById.set(id, soldAt);
      });
    });
  });

  const now = Date.now();
  const thresholdMs = staleProductDays * 24 * 60 * 60 * 1000;
  return inventoryItems
    .filter((item) => item.stock > 0)
    .map((item) => {
      const lastSold = lastSoldById.get(item.id) || lastSoldById.get(item.productId);
      const daysWithoutSale = lastSold
        ? Math.floor((now - lastSold.getTime()) / (24 * 60 * 60 * 1000))
        : staleProductDays;
      return { item, lastSold, daysWithoutSale };
    })
    .filter(
      ({ lastSold, daysWithoutSale }) =>
        !lastSold || daysWithoutSale >= staleProductDays || now - lastSold.getTime() >= thresholdMs,
    )
    .sort((a, b) => b.daysWithoutSale - a.daysWithoutSale || b.item.stock - a.item.stock)
    .slice(0, 8)
    .map(({ item, lastSold, daysWithoutSale }) => ({
      id: `stale-product-${item.id}`,
      type: "stale_product",
      category: "inventory",
      title: `Mặt hàng ${staleProductDays} ngày chưa bán`,
      description: `${item.name} còn ${item.stock} tồn, ${lastSold ? `lần bán cuối ${lastSold.toLocaleDateString("vi-VN")}` : "chưa từng bán"}.`,
      time: lastSold ? `${daysWithoutSale} ngày` : "Chưa bán",
      unread: true,
      actionLabel: "Xem sản phẩm",
      actionHref: `/app/products?product=${item.productId}`,
    }));
}

function dedupeNotifications(notifications: AppNotificationItem[]) {
  const seen = new Set<string>();
  return notifications.filter((notification) => {
    if (seen.has(notification.id)) return false;
    seen.add(notification.id);
    return true;
  });
}

function getTime(value: string | Date | null | undefined) {
  const time = new Date(value || 0).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function formatRelativeTime(value: string | Date | null | undefined) {
  const time = getTime(value);
  if (!time) return "Không rõ";
  const diff = Date.now() - time;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return "Vừa xong";
  if (diff < hour) return `${Math.floor(diff / minute)} phút trước`;
  if (diff < day) return `${Math.floor(diff / hour)} giờ trước`;
  return `${Math.floor(diff / day)} ngày trước`;
}

function formatCurrency(value: unknown) {
  return `${Number(value || 0).toLocaleString("vi-VN")}đ`;
}

function formatPaymentMethod(method: unknown) {
  const value = String(method || "").toLowerCase();
  if (value === "cash") return "tiền mặt";
  if (value === "card") return "thẻ";
  if (value === "transfer" || value === "bank" || value === "vietqr") return "chuyển khoản";
  if (value === "debt") return "ghi nợ";
  return value || "thanh toán";
}

function formatOrderPaymentSuffix(order: any) {
  const method = formatPaymentMethod(order.payment_method);
  const status = String(order.payment_status || "").toLowerCase();
  if (!method && !status) return "";
  if (status && status !== "paid") return ` Trạng thái thanh toán: ${status}.`;
  return ` Thanh toán: ${method}.`;
}

function isSameDay(value: string | Date | null | undefined, date: Date) {
  const compared = new Date(value || 0);
  return (
    compared.getFullYear() === date.getFullYear() &&
    compared.getMonth() === date.getMonth() &&
    compared.getDate() === date.getDate()
  );
}

function readJsonArray(key: string) {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    if (Array.isArray(value)) return value;
    if (value && typeof value === "object") return Object.keys(value).length > 0 ? [value] : [];
  } catch {
    return [];
  }
  return [];
}

function getOfflineQueueCount() {
  if (typeof window === "undefined") return 0;
  const keys = ["zpos_offline_queue", "zpos_pending_sync", "zpos_sync_queue"];
  return keys.reduce((count, key) => count + readJsonArray(key).length, 0);
}

function getNotificationIcon(category: AppNotificationCategory) {
  switch (category) {
    case "order":
      return ReceiptText;
    case "payment":
      return CreditCard;
    case "inventory":
      return Package;
    case "shift":
      return Clock;
    case "staff":
      return BadgeCheck;
    case "system":
      return Settings;
    case "report":
      return Bell;
    default:
      return AlertTriangle;
  }
}

function getNotificationTone(category: AppNotificationCategory) {
  switch (category) {
    case "order":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-600";
    case "payment":
      return "border-violet-500/20 bg-violet-500/10 text-violet-600";
    case "inventory":
      return "border-amber-500/20 bg-amber-500/10 text-amber-600";
    case "shift":
      return "border-blue-500/20 bg-blue-500/10 text-blue-600";
    case "staff":
      return "border-rose-500/20 bg-rose-500/10 text-rose-600";
    case "system":
      return "border-slate-500/20 bg-slate-500/10 text-slate-600";
    case "report":
      return "border-cyan-500/20 bg-cyan-500/10 text-cyan-600";
    default:
      return "border-muted bg-muted text-muted-foreground";
  }
}
