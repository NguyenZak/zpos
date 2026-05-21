export type AppNotificationCategory = "order" | "payment" | "inventory" | "shift" | "staff" | "system" | "report";

export type AppNotificationType =
  | "order_new"
  | "order_cancelled"
  | "order_pending"
  | "payment_failed"
  | "refund_requested"
  | "low_stock"
  | "out_of_stock"
  | "stale_product"
  | "shift_unclosed"
  | "cash_difference"
  | "sensitive_action"
  | "printer_error"
  | "sync_failed"
  | "daily_report";

export type AppNotificationDefinition = {
  type: AppNotificationType;
  category: AppNotificationCategory;
  label: string;
  description: string;
  defaultEnabled: boolean;
  priority: "high" | "medium" | "low";
};

export type AppNotificationSettings = {
  enabled: boolean;
  staleProductDays: number;
  types: Record<AppNotificationType, boolean>;
};

export type AppNotificationItem = {
  id: string;
  type: AppNotificationType;
  category: AppNotificationCategory;
  title: string;
  description: string;
  time: string;
  unread: boolean;
  actionLabel?: string;
  actionHref?: string;
};

export const APP_NOTIFICATION_STORAGE_KEY = "zpos_app_notification_settings";
export const APP_NOTIFICATION_SETTINGS_EVENT = "zpos_app_notification_settings_updated";
export const DEFAULT_STALE_PRODUCT_DAYS = 7;

export const APP_NOTIFICATION_DEFINITIONS: AppNotificationDefinition[] = [
  {
    type: "order_new",
    category: "order",
    label: "Đơn hàng mới",
    description: "Có đơn mới từ POS, QR, online hoặc delivery cần xử lý.",
    defaultEnabled: true,
    priority: "high",
  },
  {
    type: "order_cancelled",
    category: "order",
    label: "Đơn bị hủy",
    description: "Đơn hàng bị hủy hoặc xóa khỏi hệ thống.",
    defaultEnabled: true,
    priority: "medium",
  },
  {
    type: "order_pending",
    category: "order",
    label: "Đơn chờ xử lý quá lâu",
    description: "Đơn đang chờ xác nhận hoặc chờ thanh toán quá thời gian.",
    defaultEnabled: true,
    priority: "medium",
  },
  {
    type: "payment_failed",
    category: "payment",
    label: "Thanh toán thất bại",
    description: "Giao dịch thẻ, QR hoặc ví điện tử không thành công.",
    defaultEnabled: true,
    priority: "high",
  },
  {
    type: "refund_requested",
    category: "payment",
    label: "Hoàn tiền / đổi trả",
    description: "Có yêu cầu hoàn tiền hoặc đổi trả cần duyệt.",
    defaultEnabled: true,
    priority: "high",
  },
  {
    type: "low_stock",
    category: "inventory",
    label: "Sản phẩm sắp hết hàng",
    description: "Tồn kho giảm xuống dưới ngưỡng cảnh báo.",
    defaultEnabled: true,
    priority: "medium",
  },
  {
    type: "out_of_stock",
    category: "inventory",
    label: "Sản phẩm đã hết hàng",
    description: "Sản phẩm không còn tồn để bán.",
    defaultEnabled: true,
    priority: "high",
  },
  {
    type: "stale_product",
    category: "inventory",
    label: "Mặt hàng lâu chưa bán",
    description: "Mặt hàng còn bán nhưng không phát sinh đơn trong số ngày cấu hình.",
    defaultEnabled: true,
    priority: "medium",
  },
  {
    type: "shift_unclosed",
    category: "shift",
    label: "Ca chưa đóng",
    description: "Ca bán hàng mở quá lâu hoặc quên đóng ca.",
    defaultEnabled: true,
    priority: "medium",
  },
  {
    type: "cash_difference",
    category: "shift",
    label: "Chênh lệch tiền cuối ca",
    description: "Tiền mặt thực tế lệch so với hệ thống khi chốt ca.",
    defaultEnabled: true,
    priority: "high",
  },
  {
    type: "sensitive_action",
    category: "staff",
    label: "Thao tác nhạy cảm",
    description: "Xóa hóa đơn, sửa giá, giảm giá lớn hoặc hoàn tiền.",
    defaultEnabled: true,
    priority: "high",
  },
  {
    type: "printer_error",
    category: "system",
    label: "Lỗi máy in",
    description: "Máy in mất kết nối, hết giấy hoặc không in được hóa đơn.",
    defaultEnabled: true,
    priority: "high",
  },
  {
    type: "sync_failed",
    category: "system",
    label: "Đồng bộ thất bại",
    description: "Dữ liệu offline chưa đồng bộ lên hệ thống.",
    defaultEnabled: true,
    priority: "high",
  },
  {
    type: "daily_report",
    category: "report",
    label: "Báo cáo cuối ngày",
    description: "Tổng hợp doanh thu, đơn hủy, hoàn tiền và hàng bán chạy.",
    defaultEnabled: false,
    priority: "low",
  },
];

export const APP_NOTIFICATION_CATEGORY_LABELS: Record<AppNotificationCategory, string> = {
  order: "Đơn hàng",
  payment: "Thanh toán",
  inventory: "Kho hàng",
  shift: "Ca làm việc",
  staff: "Nhân viên",
  system: "Hệ thống",
  report: "Báo cáo",
};

export function getDefaultAppNotificationSettings(): AppNotificationSettings {
  return {
    enabled: true,
    staleProductDays: DEFAULT_STALE_PRODUCT_DAYS,
    types: APP_NOTIFICATION_DEFINITIONS.reduce(
      (settings, item) => {
        settings[item.type] = item.defaultEnabled;
        return settings;
      },
      {} as Record<AppNotificationType, boolean>,
    ),
  };
}

export function normalizeAppNotificationSettings(value: unknown): AppNotificationSettings {
  const defaults = getDefaultAppNotificationSettings();

  if (!value || typeof value !== "object") {
    return defaults;
  }

  const raw = value as Partial<AppNotificationSettings>;
  const staleProductDays = Number(raw.staleProductDays);

  return {
    enabled: raw.enabled !== false,
    staleProductDays:
      Number.isFinite(staleProductDays) && staleProductDays > 0
        ? Math.round(staleProductDays)
        : DEFAULT_STALE_PRODUCT_DAYS,
    types: APP_NOTIFICATION_DEFINITIONS.reduce(
      (settings, item) => {
        settings[item.type] = raw.types?.[item.type] ?? defaults.types[item.type];
        return settings;
      },
      {} as Record<AppNotificationType, boolean>,
    ),
  };
}

export function loadAppNotificationSettings(): AppNotificationSettings {
  if (typeof window === "undefined") {
    return getDefaultAppNotificationSettings();
  }

  try {
    return normalizeAppNotificationSettings(JSON.parse(localStorage.getItem(APP_NOTIFICATION_STORAGE_KEY) || "null"));
  } catch {
    return getDefaultAppNotificationSettings();
  }
}

export function saveAppNotificationSettings(settings: AppNotificationSettings) {
  if (typeof window === "undefined") return;

  localStorage.setItem(APP_NOTIFICATION_STORAGE_KEY, JSON.stringify(normalizeAppNotificationSettings(settings)));
  window.dispatchEvent(new Event(APP_NOTIFICATION_SETTINGS_EVENT));
}

export function isAppNotificationTypeEnabled(settings: AppNotificationSettings, type: AppNotificationType) {
  return settings.enabled && settings.types[type] !== false;
}
