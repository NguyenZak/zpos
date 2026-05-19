import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Boxes,
  ClipboardList,
  Users,
  Truck,
  Store,
  UserCog,
  BarChart3,
  Settings,
  Tag,
  Wallet,
  Receipt,
  UserCheck,
  Activity,
  PieChart,
  Landmark,
  Sparkles,
  QrCode,
  FileText,
  MessageCircle,
  Database,
  Coins,
  type LucideIcon,
} from "lucide-react";

export interface NavSubItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
}

export interface NavMainItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  subItems?: NavSubItem[];
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
}

export interface NavGroup {
  id: number;
  label?: string;
  items: NavMainItem[];
}

export const sidebarItems: NavGroup[] = [
  {
    id: 1,
    label: "Tổng quan",
    items: [
      {
        title: "Bảng điều khiển",
        url: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        title: "Bán hàng (POS)",
        url: "/pos",
        icon: ShoppingCart,
        isNew: true,
      },
      {
        title: "Trợ lý AI",
        url: "/ai",
        icon: Sparkles,
        isNew: true,
      },
    ],
  },
  {
    id: 2,
    label: "Kho hàng",
    items: [
      {
        title: "Sản phẩm",
        url: "/products",
        icon: Package,
      },
      {
        title: "Danh mục",
        url: "/categories",
        icon: Tag,
      },
      {
        title: "Tồn kho",
        url: "/inventory",
        icon: Boxes,
      },
      {
        title: "Đơn hàng",
        url: "/orders",
        icon: ClipboardList,
      },
      {
        title: "Hoá đơn điện tử",
        url: "/invoices",
        icon: FileText,
        isNew: true,
      },
    ],
  },
  {
    id: 3,
    label: "Đối tác",
    items: [
      {
        title: "Khách hàng",
        url: "/customers",
        icon: Users,
      },
      {
        title: "Công nợ",
        url: "/debt",
        icon: Coins,
        isNew: true,
      },
      {
        title: "Nhà cung cấp",
        url: "/suppliers",
        icon: Truck,
      },
      {
        title: "Tin nhắn Zalo",
        url: "/crm/zalo-messages",
        icon: MessageCircle,
        isNew: true,
      },
      {
        title: "Nhân viên",
        url: "/staff",
        icon: UserCog,
      },
    ],
  },
  {
    id: 4,
    label: "Quản lý",
    items: [
      {
        title: "Nhập hàng",
        url: "/purchases",
        icon: Store,
      },
      {
        title: "Báo cáo",
        url: "/reports",
        icon: BarChart3,
      },
      {
        title: "Đồng bộ offline",
        url: "/sync",
        icon: Database,
        isNew: true,
      },
      {
        title: "Cài đặt",
        url: "/settings",
        icon: Settings,
      },
    ],
  },
  {
    id: 5,
    label: "Tài chính",
    items: [
      {
        title: "Tổng quan",
        url: "/finance",
        icon: Landmark,
      },
      {
        title: "Chi phí",
        url: "/finance/expenses",
        icon: Receipt,
      },
      {
        title: "Chi phí định kỳ",
        url: "/finance/recurring",
        icon: Activity,
      },
      {
        title: "Bảng lương",
        url: "/finance/payroll",
        icon: UserCheck,
      },
      {
        title: "Dòng tiền",
        url: "/finance/cashflow",
        icon: Wallet,
      },
      {
        title: "Giao dịch VietQR",
        url: "/finance/payments",
        icon: QrCode,
        isNew: true,
      },
      {
        title: "Công nợ",
        url: "/debt",
        icon: Coins,
        isNew: true,
      },
      {
        title: "Hoá đơn điện tử",
        url: "/finance/invoices",
        icon: FileText,
        isNew: true,
      },
      {
        title: "Lợi nhuận & Lỗ",
        url: "/finance/profit-loss",
        icon: PieChart,
      },
    ],
  },
];
