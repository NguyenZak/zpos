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
  Award,
  ClipboardCheck,
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
        title: "Báo cáo",
        url: "/reports",
        icon: BarChart3,
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
    label: "Bán hàng & CRM",
    items: [
      {
        title: "Bán hàng (POS)",
        url: "/pos",
        icon: ShoppingCart,
        isNew: true,
      },
      {
        title: "Ca làm việc",
        url: "/shifts",
        icon: ClipboardCheck,
        isNew: true,
      },
      {
        title: "Đơn hàng",
        url: "/orders",
        icon: ClipboardList,
      },
      {
        title: "Khách hàng",
        url: "/customers",
        icon: Users,
      },
      {
        title: "Tích điểm & Loyalty",
        url: "/loyalty",
        icon: Award,
        isNew: true,
      },
      {
        title: "Tin nhắn Zalo",
        url: "/crm/zalo-messages",
        icon: MessageCircle,
        isNew: true,
      },
    ],
  },
  {
    id: 3,
    label: "Kho & Mua hàng",
    items: [
      {
        title: "Sản phẩm",
        url: "/products",
        icon: Package,
      },
      {
        title: "Mã vạch",
        url: "/products/barcodes",
        icon: QrCode,
        isNew: true,
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
        title: "Nhập hàng",
        url: "/purchases",
        icon: Store,
      },
      {
        title: "Nhà cung cấp",
        url: "/suppliers",
        icon: Truck,
      },
    ],
  },
  {
    id: 4,
    label: "Tài chính",
    items: [
      {
        title: "Tổng quan tài chính",
        url: "/finance",
        icon: Landmark,
      },
      {
        title: "Dòng tiền",
        url: "/finance/cashflow",
        icon: Wallet,
      },
      {
        title: "Lợi nhuận & Lỗ",
        url: "/finance/profit-loss",
        icon: PieChart,
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
        title: "Công nợ",
        url: "/debt",
        icon: Coins,
        isNew: true,
      },
      {
        title: "Hoá đơn điện tử",
        url: "/invoices",
        icon: FileText,
        isNew: true,
      },
      {
        title: "Giao dịch VietQR",
        url: "/finance/payments",
        icon: QrCode,
        isNew: true,
      },
    ],
  },
  {
    id: 5,
    label: "Nhân sự & Vận hành",
    items: [
      {
        title: "Nhân viên",
        url: "/staff",
        icon: UserCog,
      },
      {
        title: "Bảng lương",
        url: "/finance/payroll",
        icon: UserCheck,
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
];
