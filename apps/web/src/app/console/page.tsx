"use client";

import React, { useEffect, useRef, useState } from "react";

import Link from "next/link";

import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Building2,
  Check,
  CheckCircle2,
  Cpu,
  CreditCard,
  Database,
  Download,
  Edit2,
  FileText,
  Globe,
  Key,
  Lock,
  Mail,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Search,
  Server,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Sparkles,
  Terminal,
  Trash,
  Trash2,
  Unlock,
  Users,
  X,
  Sun,
  Moon,
} from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { createClient } from "@/utils/supabase/client";
import { isSuperAdminEmail } from "@/utils/super-admin";
import { usePreferencesStore } from "@/stores/preferences/preferences-provider";
import { persistPreference } from "@/lib/preferences/preferences-storage";
import { ThemeSwitcher } from "@/app/app/_components/sidebar/theme-switcher";

// --- TS Types ---
interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  subscription_plan: string;
  subscription_status: string;
  created_at: string;
  active_users?: number;
  monthly_revenue?: number;
  is_db?: boolean;
}

interface SystemUser {
  id: string;
  member_id?: string;
  organization_id?: string;
  role_id?: string | null;
  role_name?: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  created_at: string;
  global_role: "super_admin" | "tenant_owner" | "staff";
  associated_tenant?: string;
  tenant_slug?: string;
  source?: "auth" | "profile" | "employee";
}

interface ConsoleRole {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  is_system?: boolean;
}

interface ProfileRow {
  id: string;
  full_name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  created_at?: string | null;
}

interface OrganizationMemberRow {
  id: string;
  organization_id: string;
  profile_id: string;
  role?: string | null;
  role_id?: string | null;
  created_at?: string | null;
}

interface BillingLog {
  id: string;
  tenant_name: string;
  tenant_slug: string;
  amount: number;
  plan: string;
  status: "paid" | "pending" | "failed";
  payment_method: string;
  date: string;
}

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  billing_cycle: "monthly" | "yearly";
  features: string[];
  active_tenants: number;
}

interface LogItem {
  id: string;
  timestamp: string;
  level: "info" | "warn" | "error";
  service: string;
  message: string;
}

// --- System Base Configuration ---
const PLANS_BASE: PricingPlan[] = [
  {
    id: "plan-free",
    name: "Free (Trải nghiệm)",
    price: 0,
    billing_cycle: "monthly",
    features: ["1 Chi nhánh tối đa", "Tối đa 3 nhân sự", "POS cơ bản", "Báo cáo doanh số ngày"],
    active_tenants: 0,
  },
  {
    id: "plan-basic",
    name: "Basic (Khởi nghiệp)",
    price: 3500000,
    billing_cycle: "yearly",
    features: ["1 Chi nhánh", "Tối đa 10 nhân sự", "Quản lý kho hàng đơn giản", "Báo cáo doanh số nâng cao"],
    active_tenants: 0,
  },
  {
    id: "plan-pro",
    name: "Pro (Chuyên nghiệp)",
    price: 12500000,
    billing_cycle: "yearly",
    features: [
      "Tối đa 5 chi nhánh",
      "Không giới hạn nhân viên",
      "Quản lý kho đa điểm nâng cao",
      "Báo cáo tài chính chi tiết",
      "Tích hợp trợ lý AI",
    ],
    active_tenants: 0,
  },
  {
    id: "plan-enterprise",
    name: "Enterprise (Chuỗi cửa hàng)",
    price: 45000000,
    billing_cycle: "yearly",
    features: [
      "Không giới hạn chi nhánh",
      "Tính năng dành riêng cho chuỗi bán lẻ",
      "API mở kết nối ERP",
      "Support 24/7 chuyên biệt",
      "AI Voice Assistant tích hợp sâu",
    ],
    active_tenants: 0,
  },
];

const ROLE_LABELS: Record<SystemUser["global_role"], string> = {
  super_admin: "Super Admin",
  tenant_owner: "Tenant Owner",
  staff: "Nhân viên",
};

const getInitials = (name?: string, email?: string) => {
  const base = (name || email || "ZA").trim();
  const words = base.split(/\s+/).filter(Boolean);
  if (words.length >= 2) return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
  return base.slice(0, 2).toUpperCase();
};

const normalizeTextRole = (role?: string | null): SystemUser["global_role"] => {
  if (!role) return "staff";
  const value = role.toLowerCase();
  if (value === "owner" || value === "admin" || value === "tenant_owner") return "tenant_owner";
  return "staff";
};

const getPlanRevenue = (plan?: string | null) => {
  if (plan === "pro") return 12500000;
  if (plan === "enterprise") return 45000000;
  if (plan === "basic") return 3500000;
  return 0;
};

export default function ConsoleDashboard() {
  const themeMode = usePreferencesStore((s) => s.themeMode);
  const setThemeMode = usePreferencesStore((s) => s.setThemeMode);

  const toggleTheme = () => {
    const nextTheme = themeMode === "dark" ? "light" : "dark";
    setThemeMode(nextTheme);
    void persistPreference("theme_mode", nextTheme);
  };

  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [currentAdmin, setCurrentAdmin] = useState<SystemUser | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [roles, setRoles] = useState<ConsoleRole[]>([]);
  const [billingLogs, setBillingLogs] = useState<BillingLog[]>([]);
  const [plans, setPlans] = useState<PricingPlan[]>(PLANS_BASE);
  const [logs, setLogs] = useState<LogItem[]>([]);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPlan, setFilterPlan] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [userSearch, setUserSearch] = useState("");
  const [userTenantFilter, setUserTenantFilter] = useState("all");
  const [userRoleFilter, setUserRoleFilter] = useState("all");

  // Log filter
  const [logSearch, setLogSearch] = useState("");
  const [logLevel, setLogLevel] = useState<string>("all");

  // System status
  const [dbStatus, setDbStatus] = useState<"checking" | "connected" | "error">("checking");
  const [isSyncing, setIsSyncing] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [aiProvider, setAiProvider] = useState("groq");
  const [smtpEnabled, setSmtpEnabled] = useState(true);

  // Inline forms state
  const [tenantViewMode, setTenantViewMode] = useState<"list" | "add" | "edit">("list");
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [editOwner, setEditOwner] = useState({ name: "", email: "", password: "", profileId: "", memberId: "" });
  const [isLoadingOwner, setIsLoadingOwner] = useState(false);
  const [newTenant, setNewTenant] = useState({
    name: "",
    slug: "",
    subscription_plan: "basic",
    subscription_status: "active",
    owner_email: "",
    owner_password: "",
    owner_name: "",
  });

  const emptyUserForm = {
    id: "",
    member_id: "",
    full_name: "",
    email: "",
    password: "",
    organization_id: "",
    role: "staff",
    role_id: "none",
    avatar_url: "",
  };
  const [userFormOpen, setUserFormOpen] = useState(false);
  const [userFormMode, setUserFormMode] = useState<"add" | "edit">("add");
  const [userForm, setUserForm] = useState(emptyUserForm);

  const logsEndRef = useRef<HTMLDivElement>(null);

  // Support Tickets State
  const [tickets, setTickets] = useState<any[]>([]);
  const [ticketSearch, setTicketSearch] = useState("");
  const [ticketCategory, setTicketCategory] = useState("all");

  // Audit Logs & Security states
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditStats, setAuditStats] = useState<any>({
    totalCount: 0,
    securityAlertsCount: 0,
    failedLoginsCount: 0,
    errorCount: 0,
    topRiskyTenants: [],
    recentCriticalEvents: [],
  });
  const [auditLoading, setAuditLoading] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [auditFilters, setAuditFilters] = useState({
    tenant: "all",
    severity: "all",
    module: "all",
    action: "all",
    search: "",
    startDate: "",
    endDate: "",
  });

  const fetchAuditLogs = async (filtersOverride = auditFilters) => {
    setAuditLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtersOverride.tenant !== "all") params.set("tenant", filtersOverride.tenant);
      if (filtersOverride.severity !== "all") params.set("severity", filtersOverride.severity);
      if (filtersOverride.module !== "all") params.set("module", filtersOverride.module);
      if (filtersOverride.action !== "all") params.set("action", filtersOverride.action);
      if (filtersOverride.search) params.set("search", filtersOverride.search);
      if (filtersOverride.startDate) params.set("startDate", filtersOverride.startDate);
      if (filtersOverride.endDate) params.set("endDate", filtersOverride.endDate);

      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
      const result = await res.json();
      if (result.success) {
        setAuditLogs(result.data);
        setAuditStats(result.stats);
      } else {
        toast.error("Không thể tải nhật ký bảo mật", { description: result.error });
      }
    } catch (e) {
      console.error("Failed to load audit logs:", e);
      toast.error("Đã xảy ra lỗi khi kết nối tới API Audit Logs.");
    } finally {
      setAuditLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "audit") {
      fetchAuditLogs();
    }
  }, [activeTab]);

  const handleAuditFilterChange = (key: string, value: string) => {
    const updated = { ...auditFilters, [key]: value };
    setAuditFilters(updated);
    fetchAuditLogs(updated);
  };

  const handleSimulateThreat = async (type: string) => {
    toast.promise(
      fetch("/api/admin/audit-logs/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, tenantSlug: "bibomart" }),
      }).then(async (res) => {
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || "Simulation failed");
        return data;
      }),
      {
        loading: `Đang giả lập rủi ro bảo mật: ${type}...`,
        success: (data) => {
          fetchAuditLogs();
          return `${data.message}`;
        },
        error: (err) => `Giả lập thất bại: ${err.message}`,
      }
    );
  };

  const handleRunRetentionCleanup = async () => {
    toast.promise(
      fetch("/api/admin/audit-logs", { method: "DELETE" }).then(async (res) => {
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || "Purge failed");
        return data;
      }),
      {
        loading: "Đang áp dụng chính sách lưu trữ & dọn dẹp log quá hạn...",
        success: (data) => {
          fetchAuditLogs();
          return `Dọn dẹp thành công! Đã xóa ${data.deletedLogs.total} log cũ (Info >30d, Warn >90d, Error >180d, Critical >365d).`;
        },
        error: (err) => `Dọn dẹp thất bại: ${err.message}`,
      }
    );
  };

  const handleExportAuditCSV = () => {
    if (auditLogs.length === 0) {
      toast.warning("Không có bản ghi nào để xuất file.");
      return;
    }

    try {
      const headers = ["ID", "Thời gian", "Tenant", "User Email", "Module", "Hành động", "Mức độ", "Địa chỉ IP", "Thiết bị (User Agent)", "Cảnh báo bảo mật", "Lý do cảnh báo", "Thông tin chi tiết (Metadata)"];
      const rows = auditLogs.map((log) => [
        log.id,
        log.created_at,
        log.tenant_id || "Chung",
        log.user_email || "System",
        log.module,
        log.action,
        log.severity.toUpperCase(),
        log.ip_address || "",
        log.user_agent || "",
        log.is_alert ? "CÓ" : "Không",
        log.alert_reason || "",
        JSON.stringify(log.metadata).replace(/"/g, '""'),
      ]);

      const csvContent =
        "data:text/csv;charset=utf-8,\uFEFF" +
        [headers.join(","), ...rows.map((e) => e.map((val) => `"${val}"`).join(","))].join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `zpos_audit_security_logs_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Đã kết xuất và tải xuống file báo cáo Audit Log dạng CSV!");
    } catch (e) {
      console.error(e);
      toast.error("Lỗi khi kết xuất dữ liệu CSV.");
    }
  };

  const loadCurrentAdmin = async () => {
    const supabase = createClient();
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.email) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url, created_at")
        .eq("id", user.id)
        .maybeSingle();

      setCurrentAdmin({
        id: user.id,
        full_name: profile?.full_name || user.user_metadata?.full_name || user.email,
        email: profile?.email || user.email,
        avatar_url: profile?.avatar_url || user.user_metadata?.avatar_url,
        created_at: profile?.created_at || user.created_at || new Date().toISOString(),
        global_role: isSuperAdminEmail(user.email) ? "super_admin" : "tenant_owner",
        source: "auth",
      });
    } catch (err) {
      console.warn("Could not resolve current console admin:", err);
    }
  };

  // Sync Database automatically on Mount
  useEffect(() => {
    loadCurrentAdmin();
    syncDatabase();
  }, []);

  // Scroll logs to bottom when updated
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  // Connect & Fetch actual Database records from Supabase
  const syncDatabase = async () => {
    setDbStatus("checking");
    setIsSyncing(true);
    const supabase = createClient();
    try {
      // 1. Fetch organizations (tenants)
      let dbTenants: Tenant[] = [];
      try {
        const { data: orgs, error: orgsError } = await supabase
          .from("organizations")
          .select("*")
          .order("created_at", { ascending: false });

        if (!orgsError && orgs) {
          dbTenants = orgs.map((o) => ({
            id: o.id,
            name: o.name,
            slug: o.slug,
            logo_url: o.logo_url,
            subscription_plan: o.subscription_plan || "free",
            subscription_status: o.subscription_status || "active",
            created_at: o.created_at,
            active_users: 0,
            monthly_revenue: getPlanRevenue(o.subscription_plan),
            is_db: true,
          }));
        }
      } catch (err) {
        console.warn("Could not fetch organizations:", err);
      }

      // 2. Fetch roles, profiles and organization memberships, then join locally.
      let dbRoles: ConsoleRole[] = [];
      let dbUsers: SystemUser[] = [];
      try {
        const [{ data: profs, error: profsError }, membersResult, { data: roleRows }] =
          await Promise.all([
            supabase.from("profiles").select("id, full_name, email, avatar_url, created_at").order("created_at", {
              ascending: false,
            }),
            supabase.from("organization_members").select("id, organization_id, profile_id, role, role_id, created_at"),
            supabase.from("roles").select("id, organization_id, name, description, is_system").order("name"),
          ]);

        let members = membersResult.data;
        let membersError = membersResult.error;
        if (membersError && membersError.message?.includes("role_id")) {
          const fallbackMembers = await supabase
            .from("organization_members")
            .select("id, organization_id, profile_id, role, created_at");
          members = fallbackMembers.data?.map((member) => ({ ...member, role_id: null })) || null;
          membersError = fallbackMembers.error;
        }

        if (roleRows) dbRoles = roleRows;
        const profileRows = (profs || []) as ProfileRow[];
        const memberRows = (members || []) as OrganizationMemberRow[];
        const tenantById = new Map(dbTenants.map((tenant) => [tenant.id, tenant]));
        const roleById = new Map(dbRoles.map((role) => [role.id, role]));
        const profileById = new Map(profileRows.map((profile) => [profile.id, profile]));
        const usedProfileIds = new Set<string>();

        if (!membersError && members) {
          dbUsers = memberRows.map((member) => {
            const profile = profileById.get(member.profile_id);
            const tenant = tenantById.get(member.organization_id);
            const customRole = member.role_id ? roleById.get(member.role_id) : null;
            usedProfileIds.add(member.profile_id);
            return {
              id: member.profile_id,
              member_id: member.id,
              organization_id: member.organization_id,
              role_id: member.role_id,
              role_name: customRole?.name || member.role || "staff",
              full_name: profile?.full_name || profile?.email || "Thành viên ZPOS",
              email: profile?.email || "user@zpos.click",
              avatar_url: profile?.avatar_url || undefined,
              created_at: profile?.created_at || member.created_at || new Date().toISOString(),
              global_role: normalizeTextRole(member.role),
              associated_tenant: tenant?.name || member.organization_id,
              tenant_slug: tenant?.slug,
              source: "profile",
            };
          });
        }

        if (!profsError && profs) {
          const unassignedProfiles = profileRows
            .filter((profile) => !usedProfileIds.has(profile.id))
            .map((profile): SystemUser => ({
              id: profile.id,
              full_name: profile.full_name || "Thành viên ZPOS",
              email: profile.email || "user@zpos.click",
              avatar_url: profile.avatar_url || undefined,
              created_at: profile.created_at || new Date().toISOString(),
              global_role: isSuperAdminEmail(profile.email) ? "super_admin" : "staff",
              associated_tenant: isSuperAdminEmail(profile.email) ? undefined : "Chưa gán tenant",
              source: "profile" as const,
            }));
          dbUsers = [...dbUsers, ...unassignedProfiles];
        }
      } catch (err) {
        console.warn("Could not fetch user directory:", err);
      }

      // If profiles query failed or empty, fallback to employees which represents active users in the database
      if (dbUsers.length === 0) {
        try {
          const { data: emps, error: empsError } = await supabase
            .from("employees")
            .select("*")
            .order("created_at", { ascending: false });

          if (!empsError && emps) {
            dbUsers = emps.map((e) => ({
              id: e.id,
              full_name: e.name,
              email: e.email || "employee@zpos.click",
              created_at: e.created_at,
              global_role: e.role === "admin" ? "super_admin" : "staff",
              associated_tenant: "Mặc định (ZPOS Retail)",
            }));
          }
        } catch (err) {
          console.warn("Could not fetch employees:", err);
        }
      }

      // Update active users metric in tenants based on actual user counts
      dbTenants = dbTenants.map((t) => {
        const activeUsersCount = dbUsers.filter((u) => u.organization_id === t.id).length;
        return {
          ...t,
          active_users: Math.max(0, activeUsersCount),
        };
      });

      // 3. Fetch real orders to build transaction ledger
      let dbBilling: BillingLog[] = [];
      let realOrdersCount = 0;
      try {
        const { data: orders, error: ordersError } = await supabase
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false });

        if (!ordersError && orders) {
          realOrdersCount = orders.length;
          dbBilling = orders.map((o) => ({
            id: o.order_number || `INV-${o.id.substring(0, 4).toUpperCase()}`,
            tenant_name: "Mặc định (ZPOS Retail)",
            tenant_slug: "app",
            amount: Number(o.total_amount),
            plan: o.total_amount > 40000000 ? "Enterprise" : "Pro",
            status: o.status === "completed" ? "paid" : o.status === "cancelled" ? "failed" : "pending",
            payment_method:
              o.payment_method === "cash" ? "Tiền mặt" : o.payment_method === "transfer" ? "Chuyển khoản" : "Khác",
            date: o.created_at.split("T")[0],
          }));
        }
      } catch (err) {
        console.warn("Could not fetch orders for billing logs:", err);
      }

      // 4. Fetch actual audit logs
      let dbLogs: LogItem[] = [];
      try {
        const { data: logsData, error: logsError } = await supabase
          .from("audit_logs")
          .select("*")
          .order("created_at", { ascending: false });

        if (!logsError && logsData) {
          dbLogs = logsData.map((l) => ({
            id: l.id,
            timestamp: new Date(l.created_at).toLocaleTimeString("vi-VN"),
            level:
              l.action.includes("delete") || l.action.includes("failed")
                ? "error"
                : l.action.includes("update")
                  ? "warn"
                  : "info",
            service: l.action.split(".")[0].toUpperCase(),
            message: `${l.action}: ${JSON.stringify(l.details)}`,
          }));
        }
      } catch (err) {
        console.warn("Could not fetch audit logs:", err);
      }


      // Update active tenant counts in pricing plans
      const plansUpdated = PLANS_BASE.map((p) => {
        const count = dbTenants.filter((t) => t.subscription_plan === p.id.replace("plan-", "")).length;
        return {
          ...p,
          active_tenants: count,
        };
      });

      setTenants(dbTenants);
      setUsers(dbUsers);
      setRoles(dbRoles);
      setBillingLogs(dbBilling);
      setPlans(plansUpdated);
      setLogs(dbLogs);

      // Fetch Support Tickets
      try {
        const res = await fetch("/api/support/tickets");
        const ticketData = await res.json();
        if (ticketData.success) {
          setTickets(ticketData.data);
        }
      } catch (err) {
        console.warn("Could not fetch support tickets during sync:", err);
      }

      setDbStatus("connected");

      toast.success("Đồng bộ dữ liệu Supabase thực tế thành công!", {
        description: `Đã nạp ${dbTenants.length} Tenant, ${dbUsers.length} Người dùng và ${dbBilling.length} Giao dịch thực tế từ DB.`,
      });
    } catch (e: any) {
      console.error("Supabase sync failed:", e.message);
      setDbStatus("error");
      toast.error("Không thể tải dữ liệu thực tế từ DB.", {
        description: e.message || "Kiểm tra kết nối mạng hoặc quyền truy cập bảng.",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Create Tenant (Local + Supabase push) - Moved to separate page /console/tenants/new

  // Fetch owner info when opening the edit form
  const fetchOwnerForTenant = async (tenantId: string) => {
    setIsLoadingOwner(true);
    setEditOwner({ name: "", email: "", password: "", profileId: "", memberId: "" });
    const supabase = createClient();
    console.log("[DEBUG] fetchOwnerForTenant called with tenantId:", tenantId);
    try {
      // Strategy 1: Query organization_members with role=owner
      let memberId: string | null = null;
      let ownerMemberRowId = "";
      const { data: member, error: memberErr } = await supabase
        .from("organization_members")
        .select("id, profile_id")
        .eq("organization_id", tenantId)
        .eq("role", "owner")
        .maybeSingle();
      console.log("[DEBUG] Strategy 1 - member:", member, "error:", memberErr);

      if (member?.profile_id) {
        memberId = member.profile_id;
        ownerMemberRowId = member.id;
      }

      // Strategy 2: If RLS blocked or no "owner" role found, try any member of this org
      if (!memberId) {
        const { data: anyMember, error: anyErr } = await supabase
          .from("organization_members")
          .select("id, profile_id")
          .eq("organization_id", tenantId)
          .limit(1)
          .maybeSingle();
        console.log("[DEBUG] Strategy 2 - anyMember:", anyMember, "error:", anyErr);
        if (anyMember?.profile_id) {
          memberId = anyMember.profile_id;
          ownerMemberRowId = anyMember.id;
        }
      }

      // Strategy 3: Reverse lookup - find profiles that reference this org via join
      if (!memberId) {
        const { data: profiles, error: joinErr } = await supabase
          .from("profiles")
          .select("id, full_name, email, organization_members!inner(organization_id)")
          .eq("organization_members.organization_id", tenantId)
          .limit(1);
        console.log("[DEBUG] Strategy 3 - profiles:", profiles, "error:", joinErr);
        if (profiles && profiles.length > 0) {
          memberId = profiles[0].id;
          setEditOwner({
            name: profiles[0].full_name || "",
            email: profiles[0].email || "",
            password: "",
            profileId: profiles[0].id,
            memberId: ownerMemberRowId,
          });
          setIsLoadingOwner(false);
          return;
        }
      }

      // Fetch profile if we got a memberId from earlier strategies
      if (memberId) {
        const { data: profile, error: profErr } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .eq("id", memberId)
          .maybeSingle();
        console.log("[DEBUG] Profile fetch - profile:", profile, "error:", profErr);

        if (profile) {
          setEditOwner({
            name: profile.full_name || "",
            email: profile.email || "",
            password: "",
            profileId: profile.id,
            memberId: ownerMemberRowId,
          });
        }
      } else {
        toast.warning("Tenant này chưa có owner được gán trong organization_members.", {
          description: "Hãy tạo/gán owner trước khi sửa email để tránh cập nhật nhầm profile.",
        });
      }

      console.log("[DEBUG] Final memberId:", memberId);
    } catch (err) {
      console.warn("[DEBUG] fetchOwnerForTenant EXCEPTION:", err);
    } finally {
      setIsLoadingOwner(false);
    }
  };

  // Update Tenant details
  const handleUpdateTenant = async () => {
    if (!selectedTenant) return;

    setIsSyncing(true);
    const updated = tenants.map((t) => {
      if (t.id === selectedTenant.id) {
        return {
          ...selectedTenant,
          monthly_revenue:
            selectedTenant.subscription_plan === "pro"
              ? 12500000
              : selectedTenant.subscription_plan === "enterprise"
                ? 45000000
                : selectedTenant.subscription_plan === "basic"
                  ? 3500000
                  : 0,
        };
      }
      return t;
    });

    let dbSuccess = false;
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from("organizations")
        .update({
          name: selectedTenant.name,
          subscription_plan: selectedTenant.subscription_plan,
          subscription_status: selectedTenant.subscription_status,
        })
        .eq("id", selectedTenant.id);

      if (!error) dbSuccess = true;

      if (editOwner.profileId) {
        const ownerRes = await fetch("/api/admin/tenant-owner", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            organizationId: selectedTenant.id,
            profileId: editOwner.profileId,
            fullName: editOwner.name,
            email: editOwner.email,
            password: editOwner.password,
          }),
        });
        const ownerResult = await ownerRes.json().catch(() => null);
        if (!ownerRes.ok || !ownerResult?.success) {
          throw new Error(ownerResult?.error || "Không thể cập nhật owner tenant.");
        }

        if (ownerResult.data?.profileId && ownerResult.data.profileId !== editOwner.profileId) {
          setEditOwner((prev) => ({ ...prev, profileId: ownerResult.data.profileId }));
        }
      }

      if (editOwner.password && editOwner.password.length >= 6) {
        const pwLog: LogItem = {
          id: "log-pw-" + Date.now(),
          timestamp: new Date().toLocaleTimeString("vi-VN"),
          level: "warn",
          service: "AUTH",
          message: `Yêu cầu đặt lại mật khẩu cho owner '${editOwner.email}' của Tenant '${selectedTenant.slug}'.`,
        };
        setLogs((prev) => [...prev, pwLog]);
        toast.info("Lưu ý: Đặt lại mật khẩu cần thực hiện qua Supabase Admin API.");
      }
    } catch (e: any) {
      toast.error("Không thể cập nhật owner tenant.", {
        description: e?.message || "Dừng cập nhật để tránh lẫn tài khoản giữa các tenant.",
      });
      setIsSyncing(false);
      return;
    }

    setTenants(updated);
    setTenantViewMode("list");

    const newLog: LogItem = {
      id: "log-" + Date.now(),
      timestamp: new Date().toLocaleTimeString("vi-VN"),
      level: "info",
      service: "TENANT",
      message: `Cập nhật thông tin Tenant '${selectedTenant.slug}'. Gói: ${selectedTenant.subscription_plan.toUpperCase()}, Trạng thái: ${selectedTenant.subscription_status.toUpperCase()}`,
    };
    setLogs((prev) => [...prev, newLog]);

    toast.success("Cập nhật thông tin Tenant thành công!", {
      description: dbSuccess ? "Đã đồng bộ thay đổi xuống Database." : "Chưa đồng bộ được xuống Database.",
    });
    setIsSyncing(false);
  };

  // Create Tenant
  const handleCreateTenant = async () => {
    if (!newTenant.name || !newTenant.slug) {
      toast.error("Vui lòng điền đầy đủ tên và đường dẫn subdomain!");
      return;
    }
    if (!newTenant.owner_name || !newTenant.owner_email || !newTenant.owner_password) {
      toast.error("Vui lòng điền đầy đủ thông tin Tài khoản chủ sở hữu để truy cập App Tenant!");
      return;
    }
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(newTenant.slug)) {
      toast.error("Đường dẫn subdomain chỉ được chứa chữ thường không dấu, số và dấu gạch ngang (-)!");
      return;
    }

    setIsSyncing(true);
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("organizations")
        .insert([{
          name: newTenant.name,
          slug: newTenant.slug,
          subscription_plan: newTenant.subscription_plan,
          subscription_status: newTenant.subscription_status,
        }])
        .select();

      if (error) {
        if (error.code === '23505') throw new Error("Subdomain này đã tồn tại trên hệ thống. Vui lòng chọn subdomain khác.");
        throw error;
      }

      if (data && data[0]) {
        const orgId = data[0].id;
        const ownerResponse = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: newTenant.owner_name || "Chủ doanh nghiệp",
            email: newTenant.owner_email,
            password: newTenant.owner_password,
            organizationId: orgId,
            role: "owner",
            roleId: null,
          }),
        });

        const ownerResult = await ownerResponse.json().catch(() => null);
        if (!ownerResponse.ok || !ownerResult?.success) {
          await supabase.from("organizations").delete().eq("id", orgId);
          throw new Error(ownerResult?.error || "Không thể tạo tài khoản owner trong Supabase Auth.");
        }
        
        const newLog: LogItem = {
          id: "log-" + Date.now(), timestamp: new Date().toLocaleTimeString("vi-VN"), level: "info", service: "TENANT",
          message: `Khởi tạo Tenant mới '${newTenant.slug}' thành công.`,
        };
        setLogs((prev) => [...prev, newLog]);

        toast.success("Tạo doanh nghiệp mới thành công!", { description: `Subdomain: ${newTenant.slug}.localhost:3000 đã hoạt động.` });
        setTenantViewMode("list");
        syncDatabase(); // Reload list
      }
    } catch (e: any) {
      toast.error("Không thể lưu vào Database!", { description: e.message });
    } finally {
      setIsSyncing(false);
    }
  };

  // Delete Tenant
  const handleDeleteTenant = async (id: string, slug: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn Tenant '${slug}'? Hành động này không thể hoàn tác!`)) {
      return;
    }

    setIsSyncing(true);
    const supabase = createClient();
    let dbSuccess = false;
    try {
      const { error } = await supabase.from("organizations").delete().eq("id", id);
      if (!error) dbSuccess = true;
    } catch {}

    setTenants(tenants.filter((t) => t.id !== id));

    // Add log
    const newLog: LogItem = {
      id: "log-" + Date.now(),
      timestamp: new Date().toLocaleTimeString("vi-VN"),
      level: "warn",
      service: "TENANT",
      message: `Xóa vĩnh viễn Tenant '${slug}' (ID: ${id}) ra khỏi hệ thống.`,
    };
    setLogs((prev) => [...prev, newLog]);

    toast.success(`Đã xóa vĩnh viễn Tenant ${slug}!`, {
      description: dbSuccess ? "Đã cập nhật cơ sở dữ liệu." : "Chưa đồng bộ được xuống Database.",
    });
    setIsSyncing(false);
  };

  const openCreateUserForm = () => {
    setUserFormMode("add");
    setUserForm({
      ...emptyUserForm,
      organization_id: tenants[0]?.id || "",
      role: "staff",
      role_id: "none",
    });
    setUserFormOpen(true);
  };

  const openEditUserForm = (user: SystemUser) => {
    setUserFormMode("edit");
    setUserForm({
      id: user.id,
      member_id: user.member_id || "",
      full_name: user.full_name,
      email: user.email,
      password: "",
      organization_id: user.organization_id || "",
      role: user.global_role === "tenant_owner" ? "owner" : "staff",
      role_id: user.role_id || "none",
      avatar_url: user.avatar_url || "",
    });
    setUserFormOpen(true);
  };

  const handleSaveUser = async () => {
    if (!userForm.full_name.trim() || !userForm.email.trim()) {
      toast.error("Vui lòng nhập họ tên và email nhân viên.");
      return;
    }
    if (!userForm.organization_id && userForm.role !== "super_admin") {
      toast.error("Vui lòng chọn doanh nghiệp để gán nhân viên.");
      return;
    }
    if (userFormMode === "add" && userForm.password.length < 6) {
      toast.error("Mật khẩu ban đầu phải có ít nhất 6 ký tự.");
      return;
    }

    setIsSyncing(true);
    try {
      const avatarUrl =
        userForm.avatar_url ||
        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userForm.full_name.trim())}`;

      const userResponse = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: userFormMode === "edit" ? userForm.id : undefined,
          memberId: userForm.member_id || undefined,
          fullName: userForm.full_name.trim(),
          email: userForm.email.trim().toLowerCase(),
          password: userForm.password,
          organizationId: userForm.role === "super_admin" ? null : userForm.organization_id,
          role: userForm.role,
          roleId: userForm.role_id === "none" ? null : userForm.role_id,
          avatarUrl,
        }),
      });

      const userResult = await userResponse.json().catch(() => null);
      if (!userResponse.ok || !userResult?.success) {
        throw new Error(userResult?.error || "Không thể tạo/cập nhật user trong Supabase Auth.");
      }

      toast.success(userFormMode === "add" ? "Đã thêm nhân viên mới." : "Đã cập nhật nhân viên.");
      setUserFormOpen(false);
      await syncDatabase();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Không rõ lỗi";
      toast.error("Không thể lưu nhân viên", {
        description: message || "Kiểm tra quyền ghi bảng profiles, organization_members hoặc Supabase Auth.",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteUser = async (user: SystemUser) => {
    if (user.global_role === "super_admin") {
      toast.warning("Không xóa tài khoản Super Admin từ màn hình nhân viên.");
      return;
    }
    if (!confirm(`Xóa nhân viên '${user.full_name}' khỏi tenant hiện tại? Hồ sơ profile cũng sẽ được xóa nếu DB cho phép.`)) {
      return;
    }

    setIsSyncing(true);
    const supabase = createClient();
    try {
      if (user.member_id) {
        const { error } = await supabase.from("organization_members").delete().eq("id", user.member_id);
        if (error) throw error;
      }
      const { error: profileError } = await supabase.from("profiles").delete().eq("id", user.id);
      if (profileError) {
        toast.info("Đã gỡ liên kết tenant. Profile/Auth user cần xóa bằng Supabase Admin nếu RLS chặn.");
      } else {
        toast.success("Đã xóa nhân viên khỏi hệ thống.");
      }
      await syncDatabase();
    } catch (e: unknown) {
      toast.error("Không thể xóa nhân viên", { description: e instanceof Error ? e.message : "Không rõ lỗi" });
    } finally {
      setIsSyncing(false);
    }
  };

  // Update Support Ticket Status
  const handleUpdateTicketStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch("/api/support/tickets", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Đã cập nhật trạng thái ticket sang [${newStatus}] thành công!`);

        // Add System Log
        const newLog: LogItem = {
          id: "log-" + Date.now(),
          timestamp: new Date().toLocaleTimeString("vi-VN"),
          level: "info",
          service: "SUPPORT",
          message: `Cập nhật trạng thái Ticket #${id.substring(0, 8)} sang [${newStatus}].`,
        };
        setLogs((prev) => [...prev, newLog]);

        // Refresh tickets
        const res2 = await fetch("/api/support/tickets");
        const ticketData = await res2.json();
        if (ticketData.success) {
          setTickets(ticketData.data);
        }
      } else {
        toast.error(data.error || "Cập nhật trạng thái thất bại!");
      }
    } catch (e) {
      console.error(e);
      toast.error("Lỗi kết nối khi cập nhật ticket!");
    }
  };

  // Delete Support Ticket
  const handleDeleteTicket = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa vĩnh viễn ticket hỗ trợ này?")) return;
    try {
      const res = await fetch(`/api/support/tickets?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Xóa ticket hỗ trợ thành công!");

        // Add System Log
        const newLog: LogItem = {
          id: "log-" + Date.now(),
          timestamp: new Date().toLocaleTimeString("vi-VN"),
          level: "warn",
          service: "SUPPORT",
          message: `Xóa vĩnh viễn Ticket #${id.substring(0, 8)} khỏi hệ thống.`,
        };
        setLogs((prev) => [...prev, newLog]);

        // Refresh tickets
        const res2 = await fetch("/api/support/tickets");
        const ticketData = await res2.json();
        if (ticketData.success) {
          setTickets(ticketData.data);
        }
      } else {
        toast.error(data.error || "Xóa thất bại!");
      }
    } catch (e) {
      console.error(e);
      toast.error("Lỗi kết nối khi xóa ticket!");
    }
  };

  // Simulate log creation
  const handleSimulateLog = () => {
    const services = ["AUTH", "DATABASE", "AI", "POS-SYNC", "PAYMENT", "GATEWAY", "MAILER"];
    const levels: ("info" | "warn" | "error")[] = ["info", "info", "info", "warn", "error"];
    const messages = [
      "Khởi tạo tiến trình đồng bộ dữ liệu hóa đơn định kỳ.",
      "Cập nhật cache cấu hình đại lý trên Redis thành công.",
      "Tối ưu hóa chỉ mục bảng orders_items trong 24ms.",
      "Cảnh báo: Thời gian phản hồi của Gateway ngân hàng tăng đột biến (450ms).",
      "Lỗi xác thực: Chữ ký webhook từ Cổng thanh toán MoMo không khớp.",
      "Gửi email hóa đơn điện tử cho khách hàng thành viên hoàn tất.",
      "Trợ lý AI hoàn thành tổng hợp báo cáo kinh doanh tháng cho 15 cửa hàng.",
      "Backup tự động Database nén định dạng .tar.gz thành công lên AWS S3.",
    ];

    const randomService = services[Math.floor(Math.random() * services.length)];
    const randomLevel = levels[Math.floor(Math.random() * levels.length)];
    const randomMsg = messages[Math.floor(Math.random() * messages.length)];

    const simulated: LogItem = {
      id: "sim-" + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString("vi-VN"),
      level: randomLevel,
      service: randomService,
      message: randomMsg,
    };

    setLogs((prev) => [...prev, simulated]);
    toast.info("Đã giả lập 1 sự kiện log hệ thống mới!");
  };

  // Clear system logs
  const handleClearLogs = () => {
    setLogs([]);
    toast.success("Đã dọn dẹp bảng Log hiển thị!");
  };

  // Toggle Maintenance Mode
  const handleToggleMaintenance = (checked: boolean) => {
    setMaintenanceMode(checked);
    const act = checked ? "KÍCH HOẠT" : "TẮT";
    const status = checked ? "warn" : "info";

    const newLog: LogItem = {
      id: "log-" + Date.now(),
      timestamp: new Date().toLocaleTimeString("vi-VN"),
      level: status as any,
      service: "SYSTEM",
      message: `CHẾ ĐỘ BẢO TRÌ TOÀN HỆ THỐNG ĐÃ ĐƯỢC ${act} bởi Super Admin.`,
    };
    setLogs((prev) => [...prev, newLog]);

    toast(checked ? "Đang bật Bảo trì hệ thống" : "Đã tắt Bảo trì hệ thống", {
      description: checked
        ? "Mọi tenant truy cập sẽ nhận được thông báo 503 Service Unavailable ngoại trừ Super Admin."
        : "Hệ thống hoạt động bình thường trở lại.",
      icon: checked ? <AlertTriangle className="text-amber-500" /> : <CheckCircle2 className="text-green-500" />,
    });
  };

  // Calculation metrics
  const totalTenants = tenants.length;
  const activeTenantsCount = tenants.filter((t) => t.subscription_status === "active").length;
  const totalRevenue = tenants
    .filter((t) => t.subscription_status === "active")
    .reduce((sum, t) => sum + (t.monthly_revenue || 0), 0);

  // Search/Filters logic
  const filteredTenants = tenants.filter((t) => {
    const matchQuery =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchPlan = filterPlan === "all" || t.subscription_plan === filterPlan;
    const matchStatus = filterStatus === "all" || t.subscription_status === filterStatus;
    return matchQuery && matchPlan && matchStatus;
  });

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.full_name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.associated_tenant && u.associated_tenant.toLowerCase().includes(userSearch.toLowerCase()));
    const matchTenant = userTenantFilter === "all" || u.organization_id === userTenantFilter;
    const matchRole =
      userRoleFilter === "all" ||
      u.global_role === userRoleFilter ||
      u.role_id === userRoleFilter ||
      u.role_name?.toLowerCase() === userRoleFilter.toLowerCase();
    return matchSearch && matchTenant && matchRole;
  });

  const rolesForSelectedTenant = roles.filter((role) => role.organization_id === userForm.organization_id);

  const filteredLogs = logs.filter((l) => {
    const matchSearch =
      l.message.toLowerCase().includes(logSearch.toLowerCase()) ||
      l.service.toLowerCase().includes(logSearch.toLowerCase());
    const matchLevel = logLevel === "all" || l.level === logLevel;
    return matchSearch && matchLevel;
  });

  const menuItems = [
    { id: "dashboard", label: "Tổng quan", icon: Activity },
    { id: "tenants", label: "Tenants", icon: Building2, badge: tenants.length },
    { id: "subscriptions", label: "Doanh thu & Gói", icon: CreditCard },
    { id: "users", label: "Thành viên", icon: Users },
    { 
      id: "audit", 
      label: "Audit & Bảo mật", 
      icon: ShieldAlert, 
      badge: auditStats.securityAlertsCount,
      badgeVariant: "destructive" 
    },
    { 
      id: "tickets", 
      label: "Tickets", 
      icon: FileText, 
      badge: tickets.filter((t: any) => t.status === "Mới").length, 
      badgeVariant: "destructive" 
    },
    { id: "settings", label: "Thiết lập", icon: Settings }
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background text-foreground flex w-full font-aeonik-pro antialiased selection:bg-primary selection:text-slate-900">
        
        {/* Collapsible Super Admin Sidebar */}
        <Sidebar className="border-r border-border bg-card/60 backdrop-blur-xl">
          <SidebarHeader className="border-b border-border/60 p-4">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg" asChild>
                  <Link href="/console" className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-teal-500 via-emerald-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-primary/10 animate-pulse">
                      <ShieldCheck className="h-6 w-6 text-primary-foreground stroke-[2.5]" />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-black bg-gradient-to-r from-teal-400 via-emerald-300 to-indigo-400 bg-clip-text text-transparent">
                        ZPOS Core
                      </span>
                      <span className="truncate text-[10px] text-muted-foreground font-semibold">
                        SYSTEM CONSOLE
                      </span>
                    </div>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>

          <SidebarContent className="p-3 space-y-4">
            <div className="text-[10px] font-bold text-muted-foreground tracking-wider px-3 uppercase mt-2">
              Menu điều hành
            </div>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => setActiveTab(item.id)}
                      isActive={isActive}
                      className={`w-full py-5 rounded-xl text-xs md:text-sm font-semibold transition-all duration-200 flex items-center gap-3 ${
                        isActive
                          ? "bg-gradient-to-r from-teal-950/40 to-slate-950/60 border-l-4 border-primary text-primary shadow-inner"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <Badge
                          className={`ml-auto text-[10px] font-bold px-1.5 py-0 ${
                            item.badgeVariant === "destructive"
                              ? "bg-rose-600 text-rose-100 animate-bounce"
                              : "bg-secondary text-foreground"
                          }`}
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-4 border-t border-border/80">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 justify-between">
                <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                  Chế độ Bảo Trì
                </span>
                <Switch
                  checked={maintenanceMode}
                  onCheckedChange={handleToggleMaintenance}
                  className="data-[state=checked]:bg-amber-500"
                />
              </div>
              <div className="p-3 bg-muted/40 border border-border/50 rounded-xl text-[10px] text-muted-foreground leading-relaxed">
                Phiên bản Console: <span className="font-bold text-foreground">v2.2.0-SaaS</span> <br />
                Node: <span className="text-primary font-bold">zpos-prod-asia-01</span>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>

        {/* Primary Container with Inset Header & Body */}
        <SidebarInset className="flex flex-col flex-1 min-w-0 bg-background overflow-hidden">
          
          {/* Header block following Tenant App styling */}
          <header className="border-b border-border bg-card/60 backdrop-blur-xl sticky top-0 z-40 h-16 shrink-0 flex items-center transition-all duration-300">
            <div className="flex w-full items-center justify-between px-6">
              <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground hover:bg-muted/40 h-9 w-9 rounded-lg" />
                <Separator orientation="vertical" className="mx-2 h-4" />
                <div className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <span className="hover:text-foreground cursor-pointer">Console</span>
                  <span>/</span>
                  <span className="text-foreground capitalize">
                    {activeTab === "dashboard"
                      ? "Tổng quan"
                      : activeTab === "subscriptions"
                        ? "Doanh thu & Gói"
                        : activeTab === "tenants"
                          ? "Tenants"
                          : activeTab === "users"
                            ? "Thành viên"
                            : activeTab === "tickets"
                              ? "Tickets"
                              : activeTab === "audit"
                                ? "Audit & Bảo mật"
                                : "Thiết lập"}
                  </span>
                </div>
              </div>

              {/* Database & Node Status Pill */}
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-background border border-border text-xs">
                  <span className="relative flex h-2 w-2">
                    <span
                      className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                        dbStatus === "connected"
                          ? "bg-emerald-400"
                          : dbStatus === "checking"
                            ? "bg-amber-400"
                            : "bg-rose-400"
                      }`}
                    />
                    <span
                      className={`relative inline-flex rounded-full h-2 w-2 ${
                        dbStatus === "connected"
                          ? "bg-emerald-500"
                          : dbStatus === "checking"
                            ? "bg-amber-500"
                            : "bg-rose-500"
                      }`}
                    />
                  </span>
                  <span className="text-muted-foreground font-medium">Supabase DB:</span>
                  <span
                    className={`font-bold ${
                      dbStatus === "connected"
                        ? "text-emerald-400"
                        : dbStatus === "checking"
                          ? "text-amber-400"
                          : "text-rose-400"
                    }`}
                  >
                    {dbStatus === "connected"
                      ? "Đã kết nối"
                      : dbStatus === "checking"
                        ? "Đang kiểm tra"
                        : "Chưa kết nối"}
                  </span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={syncDatabase}
                  disabled={isSyncing}
                  className="border-border bg-background text-foreground hover:bg-secondary hover:text-foreground gap-2 text-xs h-9 shadow-sm"
                >
                  <RefreshCw className={`h-3 w-3 ${isSyncing ? "animate-spin" : ""}`} />
                  Làm mới DB
                </Button>

                <ThemeSwitcher />

                <div className="flex items-center gap-2 border-l pl-4 border-border">
                  <Avatar className="h-8 w-8 ring-2 ring-teal-500/30">
                    <AvatarImage src={currentAdmin?.avatar_url || ""} />
                    <AvatarFallback className="bg-gradient-to-tr from-teal-500 to-indigo-600 text-primary-foreground font-bold text-xs">
                      {getInitials(currentAdmin?.full_name, currentAdmin?.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:flex flex-col text-left">
                    <span className="text-xs font-bold leading-none text-foreground">
                      {currentAdmin?.full_name || "Đang tải tài khoản"}
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-0.5">
                      {currentAdmin?.email || "Chưa xác định phiên đăng nhập"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </header>

        {/* 💻 Primary Dashboard Display Container */}
        <main className="flex-1 p-6 md:p-8 space-y-8 overflow-y-auto max-w-full w-full">
          {/* TAB 1: METRICS DASHBOARD */}
          {activeTab === "dashboard" && (
            <div className="space-y-8 animate-fadeIn">
              {/* Heading */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
                    Tổng Quan Hệ Thống
                    <Sparkles className="h-6 w-6 text-primary animate-pulse" />
                  </h2>
                  <p className="text-muted-foreground text-sm mt-1">
                    Giám sát hiệu suất kinh doanh, hoạt động lưu lượng và tài nguyên đám mây.
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-secondary/50 border border-border/50 p-1 rounded-xl">
                  <Badge className="bg-emerald-100/80 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 text-xs px-2.5 py-1">
                    API Status: 99.99%
                  </Badge>
                  <Badge className="bg-indigo-100/80 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20 text-xs px-2.5 py-1">
                    AWS Ping: 22ms
                  </Badge>
                </div>
              </div>

              {/* 📊 Key Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* 1. Total Tenants */}
                <Card className="border-border bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-950 dark:to-slate-900 relative overflow-hidden group hover:border-teal-500/50 dark:hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 shadow-xl">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all" />
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Tổng Doanh Nghiệp
                    </CardTitle>
                    <div className="h-8 w-8 rounded-lg bg-teal-50 dark:bg-primary/10 flex items-center justify-center text-teal-600 dark:text-primary">
                      <Building2 className="h-4 w-4" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-extrabold text-foreground tracking-tight">{totalTenants}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className="bg-emerald-100/80 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 text-[10px] font-bold border-none">
                        +12% tháng này
                      </Badge>
                      <span className="text-[10px] text-muted-foreground font-semibold">
                        {activeTenantsCount} active tenants
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* 2. Active Users */}
                <Card className="border-border bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-950 dark:to-slate-900 relative overflow-hidden group hover:border-indigo-500/50 transition-all duration-300 hover:-translate-y-1 shadow-xl">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-all" />
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Người Dùng Hoạt Động
                    </CardTitle>
                    <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      <Users className="h-4 w-4" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-extrabold text-foreground tracking-tight">{users.length}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className="bg-emerald-100/80 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 text-[10px] font-bold border-none">
                        Hoạt động
                      </Badge>
                      <span className="text-[10px] text-muted-foreground font-semibold">Tài khoản trên hệ thống</span>
                    </div>
                  </CardContent>
                </Card>

                {/* 3. Doanh thu MRR */}
                <Card className="border-border bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-950 dark:to-slate-900 relative overflow-hidden group hover:border-emerald-500/50 transition-all duration-300 hover:-translate-y-1 shadow-xl">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-all" />
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Doanh Thu (MRR)
                    </CardTitle>
                    <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                      <CreditCard className="h-4 w-4" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
                      {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(totalRevenue)}
                    </div>
                    <div className="flex items-center gap-2 mt-2.5">
                      <Badge className="bg-emerald-100/80 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 text-[10px] font-bold border-none">
                        +8.2% tháng trước
                      </Badge>
                      <span className="text-[10px] text-muted-foreground font-semibold">Kế hoạch đạt: 94%</span>
                    </div>
                  </CardContent>
                </Card>

                {/* 4. System Health */}
                <Card className="border-border bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-950 dark:to-slate-900 relative overflow-hidden group hover:border-rose-500/50 transition-all duration-300 hover:-translate-y-1 shadow-xl">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-3xl group-hover:bg-rose-500/10 transition-all" />
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Sức Khỏe Hệ Thống
                    </CardTitle>
                    <div className="h-8 w-8 rounded-lg bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400">
                      <Activity className="h-4 w-4" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-extrabold text-rose-600 dark:text-rose-400 tracking-tight">99.98%</div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className="bg-emerald-100/80 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 text-[10px] font-bold border-none">
                        Ổn định
                      </Badge>
                      <span className="text-[10px] text-muted-foreground font-semibold">Incident đang mở: 0</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 🛠 Interactive Controls Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Visual Traffic & Database Connections */}
                <Card className="border-border bg-card/60 lg:col-span-2 shadow-lg">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-foreground text-base">Tải Lượng & Lưu Lượng API (Real-time)</CardTitle>
                      <CardDescription className="text-muted-foreground text-xs">
                        Biểu đồ API Request của 6 giờ gần nhất
                      </CardDescription>
                    </div>
                    <Badge className="bg-secondary text-foreground hover:bg-slate-700">Tần suất: 5s</Badge>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Simulated SVG Wave Chart for premium UI wow factor */}
                    <div className="h-48 w-full bg-background/60 rounded-xl border border-border/80 flex items-end p-2 relative overflow-hidden">
                      <div className="absolute inset-0 grid grid-rows-4 grid-cols-6 pointer-events-none">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="border-b border-border/40 w-full h-full col-span-6" />
                        ))}
                      </div>

                      {/* Interactive Sparklines representation */}
                      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 600 200" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="gradient-teal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        {/* Area */}
                        <path
                          d="M 0 170 Q 60 120 120 150 T 240 80 T 360 140 T 480 60 T 600 100 L 600 200 L 0 200 Z"
                          fill="url(#gradient-teal)"
                        />
                        {/* Line */}
                        <path
                          d="M 0 170 Q 60 120 120 150 T 240 80 T 360 140 T 480 60 T 600 100"
                          fill="none"
                          stroke="#14b8a6"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                        />

                        {/* Highlights dots */}
                        <circle cx="240" cy="80" r="5" fill="#38bdf8" stroke="#0f172a" strokeWidth="2" />
                        <circle cx="480" cy="60" r="5" fill="#f43f5e" stroke="#0f172a" strokeWidth="2" />
                      </svg>

                      {/* Spark line legend flags */}
                      <div className="absolute top-4 left-6 bg-card/80 px-2 py-1 border border-border rounded-md text-[10px] text-primary font-mono">
                        Peak: 1,840 req/sec
                      </div>
                      <div className="absolute top-4 right-6 bg-card/80 px-2 py-1 border border-border rounded-md text-[10px] text-muted-foreground font-mono">
                        Avg Latency: 42ms
                      </div>

                      <div className="absolute bottom-2 left-0 right-0 flex justify-between px-4 text-[9px] font-bold text-muted-foreground font-mono">
                        <span>08:00</span>
                        <span>09:00</span>
                        <span>10:00</span>
                        <span>11:00</span>
                        <span>12:00</span>
                        <span>Hiện tại</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-3 rounded-xl bg-background border border-border">
                        <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                          Bộ nhớ Cache
                        </div>
                        <div className="text-xl font-bold text-foreground mt-1">42.8 GB / 64 GB</div>
                        <p className="text-[9px] text-emerald-400 mt-1">Hit rate: 94.6%</p>
                      </div>
                      <div className="p-3 rounded-xl bg-background border border-border">
                        <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                          Đọc Database
                        </div>
                        <div className="text-xl font-bold text-foreground mt-1">210 req/s</div>
                        <p className="text-[9px] text-emerald-400 mt-1">Replication lag: 12ms</p>
                      </div>
                      <div className="p-3 rounded-xl bg-background border border-border">
                        <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Tác vụ AI</div>
                        <div className="text-xl font-bold text-foreground mt-1">12.5k / ngày</div>
                        <p className="text-[9px] text-indigo-400 mt-1">Provider: Groq Cloud</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* System Nodes Checklist */}
                <Card className="border-border bg-card/60 shadow-lg flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-foreground text-base">Trạng Thái Nodes Dịch Vụ</CardTitle>
                    <CardDescription className="text-muted-foreground text-xs">
                      Giám sát các vi dịch vụ cốt lõi
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-4">
                    {[
                      { name: "SuperAdmin Console", type: "Web App", status: "online" },
                      { name: "POS Real-time Sync Server", type: "Websocket Cluster", status: "online" },
                      {
                        name: "Supabase Main DB Router",
                        type: "Postgres",
                        status: dbStatus === "error" ? "offline" : "online",
                      },
                      { name: "AI Speech-to-Text Pipeline", type: "Python microservice", status: "online" },
                      { name: "Redis Memory Cache Hub", type: "In-memory Store", status: "online" },
                      {
                        name: "SMTP Transactional Mailer",
                        type: "Postmark Engine",
                        status: smtpEnabled ? "online" : "offline",
                      },
                    ].map((svc, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-background border border-border/80"
                      >
                        <div className="flex items-center gap-2.5">
                          <Server
                            className={`h-4 w-4 ${svc.status === "online" ? "text-primary" : "text-rose-500"}`}
                          />
                          <div>
                            <p className="text-xs font-bold text-foreground leading-none">{svc.name}</p>
                            <p className="text-[9px] text-muted-foreground mt-1">{svc.type}</p>
                          </div>
                        </div>
                        <Badge
                          className={`${
                            svc.status === "online"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-rose-500/10 text-rose-400"
                          } border-none font-bold text-[9px] px-2`}
                        >
                          {svc.status.toUpperCase()}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* 📜 Terminal Style logs */}
              <Card className="border-border bg-card/70 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
                  <div className="flex items-center gap-3">
                    <Terminal className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle className="text-foreground text-base">
                        Nhật Ký Hệ Thống Thời Gian Thực (Live Logs)
                      </CardTitle>
                      <CardDescription className="text-muted-foreground text-xs">
                        Màn hình giám sát và gỡ lỗi log tập trung
                      </CardDescription>
                    </div>
                  </div>

                  {/* Log Filter controls */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="relative w-48">
                      <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        placeholder="Tìm trong log..."
                        value={logSearch}
                        onChange={(e) => setLogSearch(e.target.value)}
                        className="pl-8 h-8 text-xs bg-background border-border text-foreground"
                      />
                    </div>

                    <Select value={logLevel} onValueChange={setLogLevel}>
                      <SelectTrigger className="w-32 h-8 text-xs bg-background border-border text-foreground">
                        <SelectValue placeholder="Mức độ log" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border text-foreground">
                        <SelectItem value="all">Tất cả cấp độ</SelectItem>
                        <SelectItem value="info">INFO</SelectItem>
                        <SelectItem value="warn">WARNING</SelectItem>
                        <SelectItem value="error">ERROR</SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="flex items-center gap-2">
                      <Button
                        onClick={handleSimulateLog}
                        size="sm"
                        className="bg-primary text-primary-foreground hover:bg-teal-400 h-8 font-bold text-xs gap-1"
                      >
                        <Sparkles className="h-3 w-3" />
                        Giả lập Log
                      </Button>
                      <Button
                        onClick={handleClearLogs}
                        size="sm"
                        variant="outline"
                        className="border-border bg-background text-foreground hover:bg-secondary h-8 text-xs font-bold gap-1"
                      >
                        <Trash className="h-3 w-3" />
                        Dọn Log
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="h-64 bg-card p-4 font-mono text-xs overflow-y-auto space-y-2.5 border-b border-border">
                    {filteredLogs.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                        Không tìm thấy sự kiện nhật ký nào phù hợp.
                      </div>
                    ) : (
                      filteredLogs.map((log) => (
                        <div
                          key={log.id}
                          className="flex gap-4 border-b border-border/50 pb-1.5 hover:bg-background/30 transition-colors"
                        >
                          <span className="text-muted-foreground shrink-0">{log.timestamp}</span>
                          <span
                            className={`font-bold shrink-0 w-16 ${
                              log.level === "error"
                                ? "text-rose-500"
                                : log.level === "warn"
                                  ? "text-amber-500"
                                  : "text-primary"
                            }`}
                          >
                            [{log.level.toUpperCase()}]
                          </span>
                          <span className="text-indigo-400 font-bold shrink-0">[{log.service}]</span>
                          <span className="text-foreground">{log.message}</span>
                        </div>
                      ))
                    )}
                    <div ref={logsEndRef} />
                  </div>
                  <div className="p-3 px-4 bg-card/90 rounded-b-xl flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                    <span>Đang giám sát luồng log trên zpos-prod-asia-01...</span>
                    <span>
                      Hiển thị: {filteredLogs.length} / {logs.length} dòng
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 2: TENANTS MANAGEMENT */}
          {activeTab === "tenants" && (
            <div className="space-y-6 animate-fadeIn">
              {/* Heading */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-black text-foreground">Quản Lý Doanh Nghiệp (Tenants)</h2>
                  <p className="text-muted-foreground text-sm mt-1">
                    Kích hoạt, điều chỉnh gói cước, giám sát hoặc đình chỉ tài khoản khách hàng doanh nghiệp.
                  </p>
                </div>

                {/* Create Tenant Trigger Button */}
                {tenantViewMode === "list" && (
                  <Button onClick={() => setTenantViewMode("add")} className="button-primary px-4 py-2 gap-2 text-sm shadow-lg shadow-primary/10">
                    <Plus className="h-4 w-4 stroke-[3]" />
                    Provisioning Tenant Mới
                  </Button>
                )}
              </div>

              {/* 🔎 Filters Toolbar */}
              {tenantViewMode === "list" && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-card/40 border border-border">
                <div className="sm:col-span-2 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm kiếm doanh nghiệp theo tên, subdomain..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-background border-border text-foreground"
                  />
                </div>

                <Select value={filterPlan} onValueChange={setFilterPlan}>
                  <SelectTrigger className="bg-background border-border text-foreground">
                    <SelectValue placeholder="Chọn gói dịch vụ" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border text-foreground">
                    <SelectItem value="all">Tất cả các gói</SelectItem>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="bg-background border-border text-foreground">
                    <SelectValue placeholder="Trạng thái cước" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border text-foreground">
                    <SelectItem value="all">Tất cả trạng thái</SelectItem>
                    <SelectItem value="active">Đang hoạt động</SelectItem>
                    <SelectItem value="past_due">Quá hạn</SelectItem>
                    <SelectItem value="suspended">Đã tạm khóa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 📋 Tenants List table */}
              <Card className="border-border bg-card/70 shadow-xl">
                <CardContent className="p-0">
                  <div className="w-full overflow-x-auto">
                    <Table>
                      <TableHeader className="border-b border-border">
                        <TableRow className="border-b border-border hover:bg-transparent">
                          <TableHead className="text-muted-foreground font-bold">Doanh Nghiệp / Subdomain</TableHead>
                          <TableHead className="text-muted-foreground font-bold">Gói Đăng Ký</TableHead>
                          <TableHead className="text-muted-foreground font-bold">Trạng Thái</TableHead>
                          <TableHead className="text-muted-foreground font-bold">Lượng Staff</TableHead>
                          <TableHead className="text-muted-foreground font-bold">Ngày Khởi Tạo</TableHead>
                          <TableHead className="text-muted-foreground font-bold text-right">Hành Động</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTenants.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                              Không tìm thấy doanh nghiệp nào khớp với tiêu chí tìm kiếm.
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredTenants.map((tenant) => (
                            <TableRow
                              key={tenant.id}
                              className="border-b border-border hover:bg-background/30 transition-colors"
                            >
                              <TableCell className="py-4">
                                <div className="flex items-center gap-3">
                                  <div className="h-10 w-10 rounded-lg bg-background border border-border flex items-center justify-center font-black text-primary">
                                    {tenant.name.substring(0, 2).toUpperCase()}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-1.5 font-bold text-foreground">
                                      <span>{tenant.name}</span>
                                      {tenant.is_db && (
                                        <Badge className="bg-emerald-500/10 text-emerald-400 border-none text-[8px] font-bold py-0 px-1">
                                          DB
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-semibold mt-1">
                                      <Globe className="h-3 w-3 text-muted-foreground" />
                                      {tenant.is_db ? (
                                        <a
                                          href={
                                            typeof window !== "undefined" &&
                                            window.location.hostname.includes("localhost")
                                              ? `http://${tenant.slug}.localhost:3000/app`
                                              : `https://${tenant.slug}.zpos.click/app`
                                          }
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="font-mono text-primary hover:text-primary/80 transition-all flex items-center gap-0.5 hover:underline decoration-teal-400/30"
                                        >
                                          <span>{tenant.slug}.zpos.click</span>
                                          <ArrowUpRight className="h-3.5 w-3.5 inline" />
                                        </a>
                                      ) : (
                                        <span className="font-mono text-muted-foreground cursor-not-allowed select-none flex items-center gap-1.5">
                                          <span>{tenant.slug}.zpos.click</span>
                                          <span className="text-[8px] tracking-wide bg-background border border-border/80 text-slate-600 px-1 py-0.5 rounded font-black uppercase">
                                            Chưa Tạo
                                          </span>
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  className={`font-extrabold uppercase tracking-wider text-[10px] py-0.5 px-2 border-none ${
                                    tenant.subscription_plan === "enterprise"
                                      ? "bg-amber-500/10 text-amber-400"
                                      : tenant.subscription_plan === "pro"
                                        ? "bg-purple-500/10 text-purple-400"
                                        : tenant.subscription_plan === "basic"
                                          ? "bg-blue-500/10 text-blue-400"
                                          : "bg-slate-700/20 text-muted-foreground"
                                  }`}
                                >
                                  {tenant.subscription_plan}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  className={`font-extrabold uppercase tracking-wider text-[10px] py-0.5 px-2 border-none ${
                                    tenant.subscription_status === "active"
                                      ? "bg-emerald-500/10 text-emerald-400"
                                      : tenant.subscription_status === "past_due"
                                        ? "bg-amber-500/10 text-amber-400"
                                        : "bg-rose-500/10 text-rose-400"
                                  }`}
                                >
                                  {tenant.subscription_status}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-mono text-foreground font-semibold">
                                {tenant.active_users || 0} nhân sự
                              </TableCell>
                              <TableCell className="text-muted-foreground font-medium">
                                {new Date(tenant.created_at).toLocaleDateString("vi-VN")}
                              </TableCell>
                              <TableCell className="text-right py-4">
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    onClick={() => {
                                      setSelectedTenant(tenant);
                                      setTenantViewMode("edit");
                                      fetchOwnerForTenant(tenant.id);
                                    }}
                                    size="sm"
                                    variant="outline"
                                    className="border-border bg-background text-foreground hover:bg-secondary hover:text-foreground"
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    onClick={() => handleDeleteTenant(tenant.id, tenant.slug)}
                                    size="sm"
                                    variant="outline"
                                    className="border-border bg-background text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
              </>
              )}

              {/* Add Tenant Form */}
              {tenantViewMode === "add" && (
                <Card className="border-border bg-card/90 shadow-2xl">
                  <CardHeader>
                    <CardTitle className="text-foreground text-xl font-bold flex items-center gap-2">
                      <Plus className="text-primary h-5 w-5" />
                      Khởi Tạo Doanh Nghiệp Mới
                    </CardTitle>
                    <CardDescription className="text-muted-foreground text-xs">
                      Cấp phát tài nguyên, tạo subdomain riêng và cấu hình thông tin định danh ban đầu.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <section className="space-y-4">
                      <h3 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border pb-2">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                        Thông tin định danh
                      </h3>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-foreground">Tên doanh nghiệp / Cửa hàng</label>
                        <Input
                          value={newTenant.name}
                          onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })}
                          className="bg-background border-border text-foreground h-10"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-foreground">Đường dẫn subdomain thương hiệu</label>
                        <div className="flex items-center">
                          <Input
                            value={newTenant.slug}
                            onChange={(e) => setNewTenant({ ...newTenant, slug: e.target.value.toLowerCase() })}
                            className="bg-background border-border text-foreground rounded-r-none border-r-0 h-10"
                          />
                          <span className="bg-secondary border border-border text-muted-foreground text-xs font-mono px-3 h-10 flex items-center rounded-r-md">
                            .zpos.click
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-foreground">Gói dịch vụ cước</label>
                          <Select
                            value={newTenant.subscription_plan}
                            onValueChange={(val) => setNewTenant({ ...newTenant, subscription_plan: val })}
                          >
                            <SelectTrigger className="bg-background border-border text-foreground h-10">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border text-foreground">
                              <SelectItem value="free">Free (Miễn phí)</SelectItem>
                              <SelectItem value="basic">Basic (Khởi nghiệp)</SelectItem>
                              <SelectItem value="pro">Pro (Chuyên nghiệp)</SelectItem>
                              <SelectItem value="enterprise">Enterprise (Chuỗi)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-foreground">Trạng thái hoạt động</label>
                          <Select
                            value={newTenant.subscription_status}
                            onValueChange={(val) => setNewTenant({ ...newTenant, subscription_status: val })}
                          >
                            <SelectTrigger className="bg-background border-border text-foreground h-10">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border text-foreground">
                              <SelectItem value="active">Đang hoạt động</SelectItem>
                              <SelectItem value="past_due">Quá hạn thanh toán</SelectItem>
                              <SelectItem value="suspended">Tạm khóa hệ thống</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </section>
                    <section className="space-y-4">
                      <h3 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border pb-2">
                        <Users className="h-4 w-4 text-primary" />
                        Tài khoản chủ sở hữu (Owner)
                      </h3>
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-foreground">Họ và tên chủ sở hữu</label>
                          <Input
                            value={newTenant.owner_name}
                            onChange={(e) => setNewTenant({ ...newTenant, owner_name: e.target.value })}
                            className="bg-background border-border text-foreground h-10"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-foreground">Email đăng nhập</label>
                            <Input
                              type="email"
                              value={newTenant.owner_email}
                              onChange={(e) => setNewTenant({ ...newTenant, owner_email: e.target.value })}
                              className="bg-background border-border text-foreground h-10"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-foreground">Mật khẩu ban đầu</label>
                            <Input
                              type="password"
                              value={newTenant.owner_password}
                              onChange={(e) => setNewTenant({ ...newTenant, owner_password: e.target.value })}
                              className="bg-background border-border text-foreground h-10"
                            />
                          </div>
                        </div>
                      </div>
                    </section>
                  </CardContent>
                  <div className="p-4 border-t border-border flex justify-end gap-3 bg-background/50 rounded-b-xl">
                    <Button variant="outline" onClick={() => setTenantViewMode("list")} className="border-border bg-background text-foreground hover:bg-secondary font-bold">Hủy bỏ</Button>
                    <Button onClick={handleCreateTenant} disabled={isSyncing} className="button-primary px-6 py-2.5">{isSyncing ? "Đang xử lý..." : "Khởi tạo doanh nghiệp"}</Button>
                  </div>
                </Card>
              )}

              {/* Edit Tenant Form */}
              {tenantViewMode === "edit" && selectedTenant && (
                <Card className="border-border bg-card/90 shadow-2xl">
                  <CardHeader>
                    <CardTitle className="text-foreground text-xl font-bold flex items-center gap-2">
                      <Edit2 className="text-primary h-5 w-5" />
                      Điều Chỉnh Cấu Hình Doanh Nghiệp
                    </CardTitle>
                    <CardDescription className="text-muted-foreground text-xs">
                      Thay đổi gói, trạng thái thuê bao hoặc thông tin định danh của {selectedTenant.name}.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Section 1: Thông tin định danh */}
                    <section className="space-y-4">
                      <h3 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border pb-2">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                        Thông tin định danh
                      </h3>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-foreground">Tên doanh nghiệp / Cửa hàng</label>
                        <Input
                          value={selectedTenant.name}
                          onChange={(e) => setSelectedTenant({ ...selectedTenant, name: e.target.value })}
                          className="bg-background border-border text-foreground h-10"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-foreground">Đường dẫn subdomain thương hiệu</label>
                        <div className="flex items-center">
                          <Input
                            value={selectedTenant.slug}
                            disabled
                            className="bg-background/60 border-border text-muted-foreground rounded-r-none border-r-0 cursor-not-allowed h-10"
                          />
                          <span className="bg-secondary/60 border border-border text-muted-foreground text-xs font-mono px-3 h-10 flex items-center rounded-r-md">
                            .zpos.click
                          </span>
                        </div>
                        <p className="text-[9px] text-muted-foreground mt-1">Không thể thay đổi subdomain để tránh đứt gãy định tuyến.</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-foreground">Gói dịch vụ cước</label>
                          <Select
                            value={selectedTenant.subscription_plan}
                            onValueChange={(val) => setSelectedTenant({ ...selectedTenant, subscription_plan: val })}
                          >
                            <SelectTrigger className="bg-background border-border text-foreground h-10">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border text-foreground">
                              <SelectItem value="free">Free (Miễn phí)</SelectItem>
                              <SelectItem value="basic">Basic (Khởi nghiệp)</SelectItem>
                              <SelectItem value="pro">Pro (Chuyên nghiệp)</SelectItem>
                              <SelectItem value="enterprise">Enterprise (Chuỗi)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-foreground">Trạng thái hoạt động</label>
                          <Select
                            value={selectedTenant.subscription_status}
                            onValueChange={(val) => setSelectedTenant({ ...selectedTenant, subscription_status: val })}
                          >
                            <SelectTrigger className="bg-background border-border text-foreground h-10">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border text-foreground">
                              <SelectItem value="active">Đang hoạt động</SelectItem>
                              <SelectItem value="past_due">Quá hạn thanh toán</SelectItem>
                              <SelectItem value="suspended">Tạm khóa hệ thống</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </section>
                    {/* Section 2: Tài khoản chủ sở hữu */}
                    <section className="space-y-4">
                      <h3 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border pb-2">
                        <Users className="h-4 w-4 text-primary" />
                        Tài khoản chủ sở hữu (Owner)
                      </h3>
                      {isLoadingOwner ? (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground py-4">
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          Đang tải thông tin chủ sở hữu...
                        </div>
                      ) : editOwner.profileId ? (
                        <div className="space-y-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-foreground">Họ và tên chủ sở hữu</label>
                            <Input
                              value={editOwner.name}
                              onChange={(e) => setEditOwner({ ...editOwner, name: e.target.value })}
                              className="bg-background border-border text-foreground h-10"
                            />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-xs font-bold text-foreground">Email đăng nhập</label>
                              <Input
                                type="email"
                                value={editOwner.email}
                                onChange={(e) => setEditOwner({ ...editOwner, email: e.target.value })}
                                className="bg-background border-border text-foreground h-10"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs font-bold text-foreground">Đặt lại mật khẩu</label>
                              <Input
                                type="password"
                                placeholder="Để trống nếu không đổi"
                                value={editOwner.password}
                                onChange={(e) => setEditOwner({ ...editOwner, password: e.target.value })}
                                className="bg-background border-border text-foreground h-10"
                              />
                              <p className="text-[9px] text-muted-foreground mt-0.5">
                                Tối thiểu 6 ký tự. Để trống nếu không muốn thay đổi.
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground py-2">
                          Chưa có tài khoản chủ sở hữu được gán cho Tenant này.
                        </p>
                      )}
                    </section>
                  </CardContent>
                  <div className="p-4 border-t border-border flex justify-end gap-3 bg-background/50 rounded-b-xl">
                    <Button variant="outline" onClick={() => setTenantViewMode("list")} className="border-border bg-background text-foreground hover:bg-secondary font-bold">Hủy bỏ</Button>
                    <Button onClick={handleUpdateTenant} disabled={isSyncing} className="button-primary px-6 py-2.5">{isSyncing ? "Đang lưu..." : "Lưu thay đổi"}</Button>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* TAB 3: SUBSCRIPTIONS & PLANS */}
          {activeTab === "subscriptions" && (
            <div className="space-y-8 animate-fadeIn">
              {/* Heading */}
              <div>
                <h2 className="text-3xl font-black text-foreground">Quản Lý Gói Dịch Vụ & Doanh Thu</h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Cấu hình bảng giá SaaS, thiết lập các tùy chọn thanh toán và giám sát luồng hóa đơn.
                </p>
              </div>

              {/* 💸 Dynamic Pricing plans editor cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {plans.map((plan, i) => (
                  <Card
                    key={plan.id}
                    className="border-border bg-card/60 shadow-lg relative flex flex-col justify-between overflow-hidden"
                  >
                    <CardHeader className="border-b border-border pb-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge className="bg-primary/10 text-primary/80 border-none font-bold text-[9px] px-2 py-0.5">
                          Tier {i + 1}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider font-mono">
                          {plan.active_tenants} active tenants
                        </span>
                      </div>
                      <CardTitle className="text-foreground text-lg font-extrabold">{plan.name}</CardTitle>
                      <div className="mt-3 flex items-baseline gap-1 text-primary font-mono">
                        <span className="text-xl font-bold">{new Intl.NumberFormat("vi-VN").format(plan.price)}đ</span>
                        <span className="text-xs text-muted-foreground font-semibold">
                          /{plan.billing_cycle === "monthly" ? "tháng" : "năm"}
                        </span>
                      </div>
                    </CardHeader>

                    <CardContent className="py-4 flex-1">
                      <ul className="space-y-2 text-xs text-foreground font-medium">
                        {plan.features.map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>

                    <div className="p-4 border-t border-border bg-card">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full border-border bg-background text-foreground hover:bg-secondary text-xs font-bold gap-1"
                      >
                        <Sliders className="h-3.5 w-3.5" />
                        Chỉnh sửa cấu hình cước
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Billing ledger transactions */}
              <Card className="border-border bg-card/70 shadow-xl">
                <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
                  <div>
                    <CardTitle className="text-foreground text-base">Nhật Ký Hóa Đơn & Đóng Phí Gần Đây</CardTitle>
                    <CardDescription className="text-muted-foreground text-xs">
                      Theo dõi và đối soát dòng tiền SaaS thu được
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-border bg-background text-foreground hover:bg-secondary text-xs gap-2"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Xuất Báo Cáo Excel
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="w-full overflow-x-auto">
                    <Table>
                      <TableHeader className="border-b border-border">
                        <TableRow className="border-b border-border hover:bg-transparent">
                          <TableHead className="text-muted-foreground font-bold">Mã Hóa Đơn</TableHead>
                          <TableHead className="text-muted-foreground font-bold">Doanh Nghiệp (Tenant)</TableHead>
                          <TableHead className="text-muted-foreground font-bold">Gói Cước</TableHead>
                          <TableHead className="text-muted-foreground font-bold">Giá Trị</TableHead>
                          <TableHead className="text-muted-foreground font-bold">Cổng Thanh Toán</TableHead>
                          <TableHead className="text-muted-foreground font-bold">Ngày Thu</TableHead>
                          <TableHead className="text-muted-foreground font-bold">Trạng Thái</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {billingLogs.map((log) => (
                          <TableRow
                            key={log.id}
                            className="border-b border-border hover:bg-background/30 transition-colors"
                          >
                            <TableCell className="font-mono text-primary font-bold">{log.id}</TableCell>
                            <TableCell>
                              <div>
                                <div className="font-bold text-foreground">{log.tenant_name}</div>
                                <div className="text-[10px] text-muted-foreground font-semibold font-mono mt-0.5">
                                  {log.tenant_slug}.zpos.click
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="font-semibold text-foreground">{log.plan}</TableCell>
                            <TableCell className="font-mono text-foreground font-extrabold">
                              {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
                                log.amount,
                              )}
                            </TableCell>
                            <TableCell className="text-muted-foreground font-medium text-xs">{log.payment_method}</TableCell>
                            <TableCell className="text-muted-foreground font-medium">{log.date}</TableCell>
                            <TableCell>
                              <Badge
                                className={`font-extrabold uppercase tracking-wider text-[9px] border-none ${
                                  log.status === "paid"
                                    ? "bg-emerald-500/10 text-emerald-400"
                                    : log.status === "pending"
                                      ? "bg-amber-500/10 text-amber-400"
                                      : "bg-rose-500/10 text-rose-400"
                                }`}
                              >
                                {log.status.toUpperCase()}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 4: USERS MANAGEMENT */}
          {activeTab === "users" && (
            <div className="space-y-6 animate-fadeIn">
              {/* Heading */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-black text-foreground">Quản Lý Nhân Viên & Phân Quyền</h2>
                  <p className="text-muted-foreground text-sm mt-1">
                    Dữ liệu lấy từ profiles, organization_members và roles. Console có thể thêm, sửa, gỡ nhân viên khỏi tenant và gán vai trò truy cập.
                  </p>
                </div>
                <Dialog open={userFormOpen} onOpenChange={setUserFormOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={openCreateUserForm} className="button-primary px-4 py-2 gap-2 text-sm shadow-lg shadow-primary/10">
                      <Plus className="h-4 w-4 stroke-[3]" />
                      Thêm nhân viên
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl bg-card border-border text-foreground">
                    <DialogHeader>
                      <DialogTitle>{userFormMode === "add" ? "Thêm nhân viên mới" : "Sửa thông tin nhân viên"}</DialogTitle>
                      <DialogDescription>
                        Tạo profile, liên kết tenant và gán vai trò để sidebar/quyền trong app tenant hoạt động theo RBAC.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-foreground">Họ tên</label>
                        <Input
                          value={userForm.full_name}
                          onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
                          className="bg-background border-border text-foreground"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-foreground">Email đăng nhập</label>
                        <Input
                          type="email"
                          value={userForm.email}
                          onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                          className="bg-background border-border text-foreground"
                        />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-xs font-bold text-foreground">
                          {userFormMode === "add" ? "Mật khẩu ban đầu" : "Mật khẩu mới nếu cần tách tài khoản"}
                        </label>
                        <Input
                          type="password"
                          value={userForm.password}
                          onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                          className="bg-background border-border text-foreground"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-foreground">Doanh nghiệp</label>
                        <Select
                          value={userForm.organization_id || "none"}
                          onValueChange={(value) => setUserForm({ ...userForm, organization_id: value === "none" ? "" : value, role_id: "none" })}
                        >
                          <SelectTrigger className="bg-background border-border text-foreground">
                            <SelectValue placeholder="Chọn tenant" />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-border text-foreground">
                            <SelectItem value="none">Không gán tenant</SelectItem>
                            {tenants.map((tenant) => (
                              <SelectItem key={tenant.id} value={tenant.id}>
                                {tenant.name} ({tenant.slug})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-foreground">Vai trò hệ thống</label>
                        <Select
                          value={userForm.role}
                          onValueChange={(value) => setUserForm({ ...userForm, role: value })}
                        >
                          <SelectTrigger className="bg-background border-border text-foreground">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-border text-foreground">
                            <SelectItem value="owner">Owner tenant</SelectItem>
                            <SelectItem value="admin">Admin tenant</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="staff">Staff</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-xs font-bold text-foreground">Role RBAC chi tiết</label>
                        <Select
                          value={userForm.role_id}
                          onValueChange={(value) => setUserForm({ ...userForm, role_id: value })}
                        >
                          <SelectTrigger className="bg-background border-border text-foreground">
                            <SelectValue placeholder="Chọn role" />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-border text-foreground">
                            <SelectItem value="none">Dùng quyền mặc định theo vai trò hệ thống</SelectItem>
                            {rolesForSelectedTenant.map((role) => (
                              <SelectItem key={role.id} value={role.id}>
                                {role.name}{role.is_system ? " (system)" : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-[10px] text-muted-foreground">
                          Role RBAC được quản lý trong tenant app tại Cài đặt / Vai trò. Console chỉ gán role cho nhân viên.
                        </p>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button variant="outline" onClick={() => setUserFormOpen(false)} className="border-border bg-background text-foreground hover:bg-secondary">
                        Hủy
                      </Button>
                      <Button onClick={handleSaveUser} disabled={isSyncing} className="button-primary">
                        {isSyncing ? "Đang lưu..." : "Lưu nhân viên"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {/* 🔎 Search Users Toolbar */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 p-4 rounded-xl bg-card/40 border border-border">
                <div className="relative lg:col-span-2">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm kiếm thành viên theo họ tên, địa chỉ email, hoặc tên doanh nghiệp liên kết..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="pl-9 bg-background border-border text-foreground"
                  />
                </div>
                <Select value={userTenantFilter} onValueChange={setUserTenantFilter}>
                  <SelectTrigger className="bg-background border-border text-foreground">
                    <SelectValue placeholder="Tenant" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border text-foreground">
                    <SelectItem value="all">Tất cả tenant</SelectItem>
                    {tenants.map((tenant) => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {tenant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={userRoleFilter} onValueChange={setUserRoleFilter}>
                  <SelectTrigger className="bg-background border-border text-foreground">
                    <SelectValue placeholder="Vai trò" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border text-foreground">
                    <SelectItem value="all">Tất cả vai trò</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                    <SelectItem value="tenant_owner">Tenant Owner</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 📋 System User Directory Table */}
              <Card className="border-border bg-card/70 shadow-xl">
                <CardContent className="p-0">
                  <div className="w-full overflow-x-auto">
                    <Table>
                      <TableHeader className="border-b border-border">
                        <TableRow className="border-b border-border hover:bg-transparent">
                          <TableHead className="text-muted-foreground font-bold">Thành Viên</TableHead>
                          <TableHead className="text-muted-foreground font-bold">Liên Kết Doanh Nghiệp (Tenant)</TableHead>
                          <TableHead className="text-muted-foreground font-bold">Vai Trò Hệ Thống</TableHead>
                          <TableHead className="text-muted-foreground font-bold">Ngày Đăng Ký</TableHead>
                          <TableHead className="text-muted-foreground font-bold text-right">Quản Trị</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                              Không tìm thấy tài khoản người dùng nào.
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredUsers.map((user) => (
                            <TableRow
                              key={user.id}
                              className="border-b border-border hover:bg-background/30 transition-colors"
                            >
                              <TableCell className="py-4">
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-9 w-9">
                                    <AvatarImage src={user.avatar_url} />
                                    <AvatarFallback className="bg-gradient-to-tr from-indigo-500 to-teal-400 text-primary-foreground font-bold text-xs">
                                      {user.full_name.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-bold text-foreground text-sm">{user.full_name}</div>
                                    <div className="text-xs text-muted-foreground font-medium flex items-center gap-1 mt-0.5">
                                      <Mail className="h-3 w-3 text-muted-foreground" />
                                      {user.email}
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                {user.associated_tenant ? (
                                  <div className="flex items-center gap-1.5 text-foreground font-semibold text-xs">
                                    <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
                                    <span>{user.associated_tenant}</span>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground text-xs italic">Không liên kết (SuperAdmin)</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  className={`font-extrabold uppercase tracking-wider text-[9px] py-0.5 px-2 border-none ${
                                    user.global_role === "super_admin"
                                      ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                      : user.global_role === "tenant_owner"
                                        ? "bg-primary/10 text-primary/80 border border-primary/20"
                                        : "bg-secondary text-muted-foreground"
                                  }`}
                                >
                                  {user.role_name || ROLE_LABELS[user.global_role]}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground font-medium text-xs">
                                {new Date(user.created_at).toLocaleDateString("vi-VN")}
                              </TableCell>
                              <TableCell className="text-right py-4">
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openEditUserForm(user)}
                                    className="border-border bg-background text-foreground hover:bg-secondary text-xs font-bold"
                                  >
                                    Sửa / phân quyền
                                  </Button>
                                  {user.global_role !== "super_admin" && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleDeleteUser(user)}
                                      className="border-border bg-background text-rose-400 hover:bg-rose-500/10 text-xs font-bold"
                                    >
                                      Xóa
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 5: SYSTEM CONFIG & SETTINGS */}
          {activeTab === "settings" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fadeIn">
              {/* SaaS Platform settings */}
              <Card className="border-border bg-card/60 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-foreground text-base flex items-center gap-2">
                    <Sliders className="h-5 w-5 text-primary" />
                    Tham Số Nền Tảng (SaaS Config)
                  </CardTitle>
                  <CardDescription className="text-muted-foreground text-xs">
                    Điều phối cấu hình hạ tầng và bảo mật toàn hệ thống ZPOS
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-foreground">
                        Mức giới hạn API Rate Limiting (req/min)
                      </label>
                      <span className="font-mono text-primary font-bold text-xs">600 req/min</span>
                    </div>
                    <Input defaultValue="600" className="bg-background border-border text-foreground" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Nhà cung cấp Trí tuệ Nhân tạo AI</label>
                    <Select value={aiProvider} onValueChange={setAiProvider}>
                      <SelectTrigger className="bg-background border-border text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border text-foreground">
                        <SelectItem value="groq">Groq Cloud (Llama 3.3 70B)</SelectItem>
                        <SelectItem value="openai">OpenAI (GPT-4o Mini)</SelectItem>
                        <SelectItem value="gemini">Google Cloud (Gemini 2.5 Flash)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-background border border-border">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-foreground">Chế độ Đăng ký Tự do (Open Signups)</p>
                      <p className="text-[9px] text-muted-foreground leading-normal">
                        Cho phép khách hàng tự đăng ký thử nghiệm tại app.zpos.click
                      </p>
                    </div>
                    <Switch defaultChecked className="data-[state=checked]:bg-primary" />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-background border border-border">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-foreground">Bảo mật đa nhân tố (MFA Required)</p>
                      <p className="text-[9px] text-muted-foreground leading-normal">
                        Bắt buộc xác thực hai bước OTP cho toàn bộ chủ Tenant và Super Admin
                      </p>
                    </div>
                    <Switch className="data-[state=checked]:bg-primary" />
                  </div>

                  <Button
                    onClick={() => toast.success("Đã áp dụng các tham số cấu hình nền tảng mới!")}
                    className="w-full bg-primary text-primary-foreground hover:bg-teal-400 font-bold text-xs py-5"
                  >
                    Lưu các thiết lập nền tảng
                  </Button>
                </CardContent>
              </Card>

              {/* Infrastructure & integrations SMTP status */}
              <div className="space-y-8">
                {/* SMTP configurations */}
                <Card className="border-border bg-card/60 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-foreground text-base flex items-center gap-2">
                      <Mail className="h-5 w-5 text-primary" />
                      Cấu Hình Mail Server (SMTP Gateway)
                    </CardTitle>
                    <CardDescription className="text-muted-foreground text-xs">
                      Cấu hình gửi email giao dịch, hóa đơn điện tử tự động
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">Kích hoạt gửi Email hệ thống</span>
                      <Switch
                        checked={smtpEnabled}
                        onCheckedChange={setSmtpEnabled}
                        className="data-[state=checked]:bg-primary"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">SMTP Host server</label>
                      <Input
                        defaultValue="smtp.postmarkapp.com"
                        disabled={!smtpEnabled}
                        className="bg-background border-border text-foreground disabled:opacity-50"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-foreground">Port</label>
                        <Input
                          defaultValue="587"
                          disabled={!smtpEnabled}
                          className="bg-background border-border text-foreground disabled:opacity-50"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-foreground">Sender Email</label>
                        <Input
                          defaultValue="no-reply@zpos.click"
                          disabled={!smtpEnabled}
                          className="bg-background border-border text-foreground disabled:opacity-50"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        disabled={!smtpEnabled}
                        variant="outline"
                        onClick={() => toast.success("Email thử nghiệm đã được gửi tới quan.tm@zpos.click!")}
                        className="flex-1 border-border bg-background text-foreground hover:bg-secondary hover:text-foreground font-bold text-xs"
                      >
                        Gửi Mail Test
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Cloud & AWS backup triggers */}
                <Card className="border-border bg-card/60 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-foreground text-base flex items-center gap-2">
                      <Database className="h-5 w-5 text-primary" />
                      Sao Lưu & Bảo Trì Dữ Liệu (Backup Hub)
                    </CardTitle>
                    <CardDescription className="text-muted-foreground text-xs">
                      Cấu hình lịch trình sao lưu tự động hệ thống lên AWS S3
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-foreground font-bold">Lịch trình tự động:</span>
                      <Badge className="bg-indigo-500/10 text-indigo-400 border-none font-bold">
                        Hàng ngày lúc 02:00 AM
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-foreground font-bold">Bản sao lưu gần nhất:</span>
                      <span className="font-mono text-muted-foreground">zpos_backup_2026-05-17_0200.tar.gz (456 MB)</span>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button
                        onClick={() => {
                          toast.promise(new Promise((resolve) => setTimeout(resolve, 2000)), {
                            loading: "Đang tiến hành sao lưu Snapshot trực tiếp...",
                            success: "Sao lưu snapshot Database thành công! Bản lưu trữ đã lưu trữ lên S3.",
                            error: "Lỗi sao lưu.",
                          });
                        }}
                        className="flex-1 bg-gradient-to-r from-teal-500 to-emerald-400 text-primary-foreground hover:from-teal-400 hover:to-emerald-300 font-bold text-xs"
                      >
                        Sao lưu Snapshot Ngay
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* TAB 5.5: AUDIT LOGS & SECURITY DASHBOARD */}
          {activeTab === "audit" && (
            <div className="space-y-6 animate-fadeIn text-foreground">
              
              {/* Heading */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
                    Giám Sát Audit & Bảo Mật Hệ Thống (Security Engine)
                    <ShieldAlert className="h-7 w-7 text-rose-500 animate-pulse" />
                  </h2>
                  <p className="text-muted-foreground text-sm mt-1">
                    Theo dõi hành vi người dùng, phát hiện rủi ro brute-force, rò rỉ dữ liệu hoặc đổi quyền bất thường trên toàn bộ tenant.
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleExportAuditCSV}
                    className="bg-white/10 hover:bg-white/15 text-white border border-white/10 rounded-xl font-bold text-xs px-4 py-2 flex items-center gap-2"
                  >
                    <Download className="h-4 w-4 text-emerald-400" />
                    Kết Xuất Báo Cáo CSV
                  </Button>
                  <Button
                    onClick={() => fetchAuditLogs()}
                    disabled={auditLoading}
                    className="bg-muted text-muted-foreground hover:bg-muted/80 rounded-xl font-bold text-xs px-4 py-2 flex items-center gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${auditLoading ? 'animate-spin' : ''}`} />
                    Tải Lại
                  </Button>
                </div>
              </div>

              {/* Security Alert Banner List */}
              {auditStats.securityAlertsCount > 0 && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-200 text-xs rounded-lg flex items-start gap-3 shadow-[0_4px_30px_rgba(244,63,94,0.15)] animate-bounce-subtle">
                  <ShieldAlert className="size-5 text-rose-400 shrink-0 mt-0.5 animate-pulse" />
                  <div className="space-y-1 w-full text-left">
                    <p className="font-extrabold uppercase tracking-wider text-[10px] text-rose-400">CẢNH BÁO BẢO MẬT ĐANG HOẠT ĐỘNG ({auditStats.securityAlertsCount})</p>
                    <p className="leading-relaxed font-semibold">Phát hiện hoạt động bất thường hoặc nguy hiểm được ghi nhận bởi Security Engine. Xem các bản ghi màu đỏ bên dưới để phản ứng.</p>
                  </div>
                </div>
              )}

              {/* KPI Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Card 1: Total logs */}
                <Card className="border-border bg-card/40 shadow-lg backdrop-blur-md">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
                      <Database className="h-5 w-5 text-teal-400" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Tổng số Log</p>
                      <h3 className="text-2xl font-black text-foreground">{auditStats.totalCount}</h3>
                      <p className="text-[9px] text-muted-foreground font-medium">Bản ghi thu thập thành công</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Card 2: Security alerts */}
                <Card className={`border-border bg-card/40 shadow-lg backdrop-blur-md transition-all duration-300 ${auditStats.securityAlertsCount > 0 ? 'ring-2 ring-rose-500/40 bg-rose-950/10' : ''}`}>
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${auditStats.securityAlertsCount > 0 ? 'bg-rose-500/20 border border-rose-500/30' : 'bg-muted border border-border'}`}>
                      <ShieldAlert className={`h-5 w-5 ${auditStats.securityAlertsCount > 0 ? 'text-rose-400 animate-pulse' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Cảnh Báo Bảo Mật</p>
                      <h3 className={`text-2xl font-black ${auditStats.securityAlertsCount > 0 ? 'text-rose-400' : 'text-foreground'}`}>
                        {auditStats.securityAlertsCount}
                      </h3>
                      <p className="text-[9px] text-muted-foreground font-medium">Đe dọa được đánh dấu tự động</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Card 3: Failed Logins */}
                <Card className={`border-border bg-card/40 shadow-lg backdrop-blur-md ${auditStats.failedLoginsCount >= 3 ? 'ring-1 ring-amber-500/30 bg-amber-950/10' : ''}`}>
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                      <Lock className="h-5 w-5 text-amber-400" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Đăng Nhập Thất Bại</p>
                      <h3 className="text-2xl font-black text-foreground">{auditStats.failedLoginsCount}</h3>
                      <p className="text-[9px] text-muted-foreground font-medium">Bảo vệ Brute-Force kích hoạt</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Card 4: Threat Level Dial */}
                <Card className="border-border bg-card/40 shadow-lg backdrop-blur-md">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                      auditStats.securityAlertsCount === 0
                        ? "bg-emerald-500/10 border border-emerald-500/20"
                        : auditStats.securityAlertsCount <= 2
                          ? "bg-amber-500/10 border border-amber-500/20"
                          : "bg-rose-500/10 border border-rose-500/20"
                    }`}>
                      <Activity className={`h-5 w-5 ${
                        auditStats.securityAlertsCount === 0
                          ? "text-emerald-400"
                          : auditStats.securityAlertsCount <= 2
                            ? "text-amber-400 animate-pulse"
                            : "text-rose-400 animate-spin-slow"
                      }`} />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Chỉ Số Đe Dọa</p>
                      <h3 className={`text-xl font-black ${
                        auditStats.securityAlertsCount === 0
                          ? "text-emerald-400"
                          : auditStats.securityAlertsCount <= 2
                            ? "text-amber-400"
                            : "text-rose-500"
                      }`}>
                        {auditStats.securityAlertsCount === 0
                          ? "An Toàn (Low)"
                          : auditStats.securityAlertsCount <= 2
                            ? "Cảnh Giác (Med)"
                            : "NGUY HIỂM (High)"}
                      </h3>
                      <p className="text-[9px] text-muted-foreground font-medium">Tính toán thời gian thực</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Risky Tenants Ranking & Simulator Control Center */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Risk Rank Table */}
                <Card className="border-border bg-card/60 shadow-lg lg:col-span-1">
                  <CardHeader className="pb-3 border-b border-border/40">
                    <CardTitle className="text-foreground text-sm font-bold flex items-center gap-2">
                      <Sliders className="h-4 w-4 text-rose-500" />
                      Xếp Hạng Tenant Rủi Ro Cao
                    </CardTitle>
                    <CardDescription className="text-muted-foreground text-xs">
                      Phân tích và chấm điểm nguy hại bảo mật tích lũy của từng Tenant.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-border/60">
                      {auditStats.topRiskyTenants.length === 0 ? (
                        <div className="p-8 text-center text-xs text-muted-foreground">
                          Hệ thống ổn định. Không phát hiện tenant nguy hại.
                        </div>
                      ) : (
                        auditStats.topRiskyTenants.map((item: any, idx: number) => {
                          const maxScore = Math.max(...auditStats.topRiskyTenants.map((t: any) => t.score), 10);
                          const percentage = Math.round((item.score / maxScore) * 100);
                          return (
                            <div key={item.slug} className="p-4 flex items-center justify-between gap-4 hover:bg-muted/20 transition-all duration-200">
                              <div className="min-w-0 flex-1 space-y-1 text-left">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-foreground capitalize">{item.slug}</span>
                                  <Badge className={`text-[8px] font-extrabold uppercase scale-90 px-1 py-0 ${
                                    item.score >= 10
                                      ? "bg-rose-600/20 text-rose-400 border border-rose-600/30 animate-pulse"
                                      : item.score >= 5
                                        ? "bg-amber-600/20 text-amber-400 border border-amber-600/30"
                                        : "bg-teal-600/20 text-teal-400 border border-teal-600/30"
                                  }`}>
                                    Score: {item.score.toFixed(1)}
                                  </Badge>
                                </div>
                                {/* Visual Score Bar */}
                                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      item.score >= 10 
                                        ? 'bg-gradient-to-r from-rose-500 to-red-600 animate-pulse' 
                                        : item.score >= 5 
                                          ? 'bg-gradient-to-r from-amber-500 to-orange-500' 
                                          : 'bg-gradient-to-r from-teal-400 to-emerald-500'
                                    }`}
                                    style={{ width: `${Math.min(percentage, 100)}%` }}
                                  />
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="font-mono text-xs text-muted-foreground font-bold">{item.count} log</span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Threat Simulator Center */}
                <Card className="border-border bg-card/60 shadow-lg lg:col-span-2">
                  <CardHeader className="pb-3 border-b border-border/40">
                    <CardTitle className="text-foreground text-sm font-bold flex items-center gap-2">
                      <Cpu className="h-4 w-4 text-emerald-400" />
                      Trung Tâm Giả Lập Mối Đe Dọa & Quản Lý Log (Demo Tooling)
                    </CardTitle>
                    <CardDescription className="text-muted-foreground text-xs">
                      Kích hoạt các kịch bản tấn công/sơ suất nghiệp vụ để kiểm thử phản ứng của Security Engine tức thì.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-5 space-y-6">
                    {/* Simulated buttons */}
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-rose-400 uppercase tracking-wide text-left">1. Giả lập Các Kịch Bản Rủi Ro & Độc Hại</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        <Button
                          onClick={() => handleSimulateThreat("brute_force")}
                          className="bg-rose-950/20 text-rose-200 border border-rose-900/50 hover:bg-rose-900/40 rounded-xl font-bold text-[11px] py-2.5 transition-all active:scale-[0.98]"
                        >
                          Dò Mật Khẩu 🔑
                        </Button>
                        <Button
                          onClick={() => handleSimulateThreat("large_export")}
                          className="bg-amber-950/20 text-amber-200 border border-amber-900/50 hover:bg-amber-900/40 rounded-xl font-bold text-[11px] py-2.5 transition-all active:scale-[0.98]"
                        >
                          Xuất Data Lớn 📁
                        </Button>
                        <Button
                          onClick={() => handleSimulateThreat("bulk_delete")}
                          className="bg-red-950/30 text-red-200 border border-red-900/50 hover:bg-red-900/40 rounded-xl font-bold text-[11px] py-2.5 transition-all active:scale-[0.98]"
                        >
                          Xóa Dữ Liệu 🗑️
                        </Button>
                        <Button
                          onClick={() => handleSimulateThreat("unauthorized_access")}
                          className="bg-orange-950/20 text-orange-200 border border-orange-900/50 hover:bg-orange-900/40 rounded-xl font-bold text-[11px] py-2.5 transition-all active:scale-[0.98]"
                        >
                          Truy Cập Trái Quyền ⚡
                        </Button>
                        <Button
                          onClick={() => handleSimulateThreat("strange_ip")}
                          className="bg-blue-950/20 text-blue-200 border border-blue-900/50 hover:bg-blue-900/40 rounded-xl font-bold text-[11px] py-2.5 transition-all active:scale-[0.98]"
                        >
                          IP Lạ/TOR 🌐
                        </Button>
                        <Button
                          onClick={() => handleSimulateThreat("standard_logs")}
                          className="bg-teal-950/20 text-teal-200 border border-teal-900/50 hover:bg-teal-900/40 rounded-xl font-bold text-[11px] py-2.5 transition-all active:scale-[0.98]"
                        >
                          Bơm Logs Chuẩn 📦
                        </Button>
                      </div>
                    </div>

                    {/* Retention settings info */}
                    <div className="p-4 rounded-xl bg-slate-900/60 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-teal-400 uppercase tracking-wide">2. Quản Lý Chính Sách Lưu Trữ Log (Retention Policy)</p>
                        <p className="text-[11px] text-muted-foreground">
                          Thời hạn tự dọn dẹp: <strong className="text-white">INFO</strong> 30 ngày | <strong className="text-white">WARNING</strong> 90 ngày | <strong className="text-white">ERROR</strong> 180 ngày | <strong className="text-white">CRITICAL</strong> 365 ngày.
                        </p>
                      </div>
                      <Button
                        onClick={handleRunRetentionCleanup}
                        className="bg-teal-600 hover:bg-teal-500 text-teal-50 shrink-0 font-bold text-xs rounded-xl px-4 py-2.5 transition-all active:scale-[0.97] flex items-center gap-1.5"
                      >
                        <Trash className="h-4 w-4" />
                        Chạy Quét Ngay 🧹
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Logs Query Toolbar & Log History Table */}
              <div className="space-y-4">
                
                {/* Advanced Search & Filtering Controls */}
                <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 p-4 rounded-lg bg-card/40 border border-border shadow-md">
                  {/* Search text */}
                  <div className="relative flex-1 min-w-[200px] w-full">
                    <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Tìm theo hành động, email, IP, lý do..."
                      value={auditFilters.search}
                      onChange={(e) => handleAuditFilterChange("search", e.target.value)}
                      className="bg-background border-border text-foreground text-xs rounded-xl pl-10 pr-4 h-10 w-full"
                    />
                  </div>

                  {/* Tenant select */}
                  <div className="w-full sm:w-auto shrink-0">
                    <select
                      value={auditFilters.tenant}
                      onChange={(e) => handleAuditFilterChange("tenant", e.target.value)}
                      className="bg-background text-foreground border border-border text-xs rounded-xl px-3.5 py-2.5 font-medium h-10 w-full outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="all">Tất cả tenants</option>
                      <option value="bibomart">Bibo Mart</option>
                      <option value="juno">Juno</option>
                      <option value="comnieusg">Cơm Niêu Sài Gòn</option>
                      <option value="tch-q3">The Coffee House (Q3)</option>
                    </select>
                  </div>

                  {/* Severity select */}
                  <div className="w-full sm:w-auto shrink-0">
                    <select
                      value={auditFilters.severity}
                      onChange={(e) => handleAuditFilterChange("severity", e.target.value)}
                      className="bg-background text-foreground border border-border text-xs rounded-xl px-3.5 py-2.5 font-medium h-10 w-full outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="all">Tất cả mức độ</option>
                      <option value="info">INFO (Thông tin)</option>
                      <option value="warning">WARNING (Cảnh báo)</option>
                      <option value="error">ERROR (Lỗi)</option>
                      <option value="critical">CRITICAL (Khẩn cấp)</option>
                    </select>
                  </div>

                  {/* Module select */}
                  <div className="w-full sm:w-auto shrink-0">
                    <select
                      value={auditFilters.module}
                      onChange={(e) => handleAuditFilterChange("module", e.target.value)}
                      className="bg-background text-foreground border border-border text-xs rounded-xl px-3.5 py-2.5 font-medium h-10 w-full outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="all">Tất cả mô-đun</option>
                      <option value="auth">auth (Xác thực)</option>
                      <option value="products">products (Sản phẩm)</option>
                      <option value="inventory">inventory (Tồn kho)</option>
                      <option value="billing">billing (Hóa đơn/POS)</option>
                      <option value="system">system (Hệ thống)</option>
                      <option value="console">console (Core Admin)</option>
                    </select>
                  </div>

                  {/* Start Date */}
                  <div className="w-full sm:w-auto shrink-0 flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground font-bold uppercase hidden md:inline">Từ:</span>
                    <Input
                      type="date"
                      value={auditFilters.startDate}
                      onChange={(e) => handleAuditFilterChange("startDate", e.target.value)}
                      className="bg-background border-border text-foreground text-xs rounded-xl h-10 w-full sm:w-36"
                    />
                  </div>

                  {/* End Date */}
                  <div className="w-full sm:w-auto shrink-0 flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground font-bold uppercase hidden md:inline">Đến:</span>
                    <Input
                      type="date"
                      value={auditFilters.endDate}
                      onChange={(e) => handleAuditFilterChange("endDate", e.target.value)}
                      className="bg-background border-border text-foreground text-xs rounded-xl h-10 w-full sm:w-36"
                    />
                  </div>
                </div>

                {/* Main Logs Table Grid */}
                <Card className="border-border bg-card/60 shadow-xl overflow-hidden">
                  <div className="overflow-x-auto w-full max-h-[600px]">
                    <Table className="border-collapse w-full">
                      <TableHeader className="bg-slate-900/60 sticky top-0 z-10 border-b border-border/80 text-xs">
                        <TableRow>
                          <TableHead className="w-10 text-center"></TableHead>
                          <TableHead className="font-extrabold text-foreground px-4 py-3.5 text-left w-36">Thời gian</TableHead>
                          <TableHead className="font-extrabold text-foreground px-4 py-3.5 text-left w-24">Tenant</TableHead>
                          <TableHead className="font-extrabold text-foreground px-4 py-3.5 text-left w-48">Thành viên</TableHead>
                          <TableHead className="font-extrabold text-foreground px-4 py-3.5 text-left w-36">Module / Action</TableHead>
                          <TableHead className="font-extrabold text-foreground px-4 py-3.5 text-left w-28">Mức độ</TableHead>
                          <TableHead className="font-extrabold text-foreground px-4 py-3.5 text-left min-w-[200px]">Thông tin</TableHead>
                          <TableHead className="font-extrabold text-foreground px-4 py-3.5 text-left w-32">Địa chỉ IP</TableHead>
                        </TableRow>
                      </TableHeader>
                      
                      <TableBody className="text-xs">
                        {auditLoading ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-16 text-muted-foreground">
                              <RefreshCw className="h-6 w-6 animate-spin mx-auto text-primary mb-2" />
                              Đang truy vấn cơ sở dữ liệu Audit Logs bảo mật...
                            </TableCell>
                          </TableRow>
                        ) : auditLogs.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-16 text-muted-foreground">
                              Không tìm thấy bản ghi log bảo mật nào khớp với bộ lọc hiện tại.
                            </TableCell>
                          </TableRow>
                        ) : (
                          auditLogs.map((log) => {
                            const isExpanded = expandedLogId === log.id;
                            const isDanger = log.is_alert || log.severity === "critical";
                            
                            return (
                              <React.Fragment key={log.id}>
                                <TableRow
                                  onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                                  className={`cursor-pointer transition-all duration-150 border-b border-border/40 select-none ${
                                    isDanger 
                                      ? "bg-rose-950/10 hover:bg-rose-900/15" 
                                      : isExpanded
                                        ? "bg-slate-900/40"
                                        : "hover:bg-muted/10"
                                  }`}
                                >
                                  {/* Expander Icon */}
                                  <TableCell className="text-center p-3 shrink-0">
                                    <span className="text-[10px] font-bold text-muted-foreground">
                                      {isExpanded ? "▼" : "▶"}
                                    </span>
                                  </TableCell>

                                  {/* Created At */}
                                  <TableCell className="p-3 font-mono text-muted-foreground whitespace-nowrap">
                                    {new Date(log.created_at).toLocaleString("vi-VN", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      second: "2-digit",
                                      day: "2-digit",
                                      month: "2-digit",
                                    })}
                                  </TableCell>

                                  {/* Tenant ID */}
                                  <TableCell className="p-3 font-bold text-foreground capitalize">
                                    {log.metadata?.tenant_slug || log.tenant_id || "System"}
                                  </TableCell>

                                  {/* User Email */}
                                  <TableCell className="p-3 font-medium text-foreground max-w-[160px] truncate">
                                    {log.user_email || "system_gateway"}
                                  </TableCell>

                                  {/* Module & Action */}
                                  <TableCell className="p-3 space-y-0.5 text-left">
                                    <Badge className="bg-slate-800 text-slate-300 border border-slate-700/50 scale-90 px-1.5 py-0">
                                      {log.module}
                                    </Badge>
                                    <p className="font-bold text-foreground tracking-tight text-[11px] whitespace-nowrap truncate">{log.action}</p>
                                  </TableCell>

                                  {/* Severity badge */}
                                  <TableCell className="p-3 shrink-0">
                                    <Badge className={`text-[9px] font-extrabold uppercase scale-90 px-2 py-0.5 border ${
                                      log.severity === "critical"
                                        ? "bg-red-500/10 border-red-500/30 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.15)] animate-pulse"
                                        : log.severity === "error"
                                          ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                                          : log.severity === "warning"
                                            ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                                            : "bg-teal-500/10 border-teal-500/20 text-teal-400"
                                    }`}>
                                      {log.severity}
                                    </Badge>
                                  </TableCell>

                                  {/* Alert reasoning or details summary */}
                                  <TableCell className="p-3 max-w-[280px] truncate text-left font-medium">
                                    {log.is_alert ? (
                                      <span className="text-rose-400 font-extrabold flex items-center gap-1">
                                        ⚠️ {log.alert_reason}
                                      </span>
                                    ) : (
                                      <span className="text-muted-foreground text-[11px]">
                                        {log.metadata?.details || log.metadata?.message || log.metadata?.reason || "Hoạt động chuẩn hệ thống"}
                                      </span>
                                    )}
                                  </TableCell>

                                  {/* IP Address */}
                                  <TableCell className="p-3 font-mono text-muted-foreground whitespace-nowrap">
                                    {log.ip_address || "127.0.0.1"}
                                  </TableCell>
                                </TableRow>

                                {/* Expended Detail JSON Viewer */}
                                {isExpanded && (
                                  <TableRow className="bg-slate-950/60 border-b border-border/30">
                                    <TableCell colSpan={8} className="p-4 text-left">
                                      <div className="space-y-4 animate-fadeIn">
                                        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/30 pb-2">
                                          <div className="space-y-1">
                                            <p className="text-xs font-bold text-foreground">Chi Tiết Log Mật Khóa - ID: {log.id}</p>
                                            <p className="text-[10px] text-muted-foreground font-mono">User Agent: {log.user_agent || "Không thu nhận"}</p>
                                          </div>
                                          {log.is_alert && (
                                            <Badge className="bg-rose-500 text-rose-50 border-rose-600 animate-pulse font-extrabold text-[10px]">
                                              CẢNH BÁO BẢO MẬT ĐANG KÍCH HOẠT
                                            </Badge>
                                          )}
                                        </div>

                                        {/* Metadata collapsibles */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                          {/* Key metrics list */}
                                          <div className="md:col-span-1 space-y-2 text-xs">
                                            <div className="p-3.5 rounded-xl border border-border bg-slate-900/60 space-y-2">
                                              <div className="flex justify-between items-center">
                                                <span className="text-muted-foreground">Mô-đun:</span>
                                                <span className="font-bold text-foreground">{log.module}</span>
                                              </div>
                                              <div className="flex justify-between items-center">
                                                <span className="text-muted-foreground">Hành động:</span>
                                                <span className="font-mono font-bold text-foreground">{log.action}</span>
                                              </div>
                                              <div className="flex justify-between items-center">
                                                <span className="text-muted-foreground">Người dùng:</span>
                                                <span className="font-semibold text-foreground truncate max-w-[140px]">{log.user_email || "System/Cron"}</span>
                                              </div>
                                              <div className="flex justify-between items-center">
                                                <span className="text-muted-foreground">Mức rủi ro:</span>
                                                <span className="font-bold uppercase tracking-wider text-rose-400">{log.severity}</span>
                                              </div>
                                              <div className="flex justify-between items-center">
                                                <span className="text-muted-foreground">Địa chỉ IP:</span>
                                                <span className="font-mono text-foreground">{log.ip_address || "127.0.0.1"}</span>
                                              </div>
                                            </div>

                                            {log.is_alert && (
                                              <div className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-300">
                                                <p className="font-bold uppercase tracking-wider text-[9px] text-rose-400">Nguyên nhân cảnh báo</p>
                                                <p className="mt-1 leading-relaxed text-[11px] font-medium">{log.alert_reason}</p>
                                              </div>
                                            )}
                                          </div>

                                          {/* Beautiful Syntax JSON viewer */}
                                          <div className="md:col-span-2 space-y-1">
                                            <p className="text-[10px] font-bold text-teal-400 uppercase tracking-wide">Trình Giám Sát Metadata Payload (Đã lọc bỏ thông tin nhạy cảm 🛡️)</p>
                                            <pre className="p-4 rounded-xl border border-border bg-slate-900/80 font-mono text-[10px] text-teal-300 overflow-x-auto max-h-56 leading-relaxed select-all">
                                              {JSON.stringify(log.metadata, null, 2)}
                                            </pre>
                                          </div>
                                        </div>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                )}
                              </React.Fragment>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </Card>
              </div>

            </div>
          )}

          {/* TAB 6: SUPPORT TICKETS & CLIENT HELP DESK */}
          {activeTab === "tickets" && (
            <div className="space-y-6 animate-fadeIn text-foreground">
              
              {/* Heading */}
              <div>
                <h2 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
                  Danh Sách Yêu Cầu Hỗ Trợ (Client Tickets)
                  <FileText className="h-6 w-6 text-primary animate-pulse" />
                </h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Quản lý, điều phối và xử lý các ticket phản hồi kỹ thuật từ Tenant và chủ cửa hàng.
                </p>
              </div>

              {/* 🔎 Filters Toolbar - Perfectly aligned with other tabs */}
              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl bg-card/40 border border-border">
                {/* Search input */}
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm kiếm ticket theo tiêu đề, mô tả hoặc doanh nghiệp..."
                    value={ticketSearch}
                    onChange={(e) => setTicketSearch(e.target.value)}
                    className="pl-9 bg-background border-border text-foreground h-10 w-full text-xs"
                  />
                </div>

                {/* Category select filter */}
                <div className="w-full sm:w-64">
                  <Select value={ticketCategory} onValueChange={setTicketCategory}>
                    <SelectTrigger className="bg-background border-border text-foreground h-10 text-xs">
                      <SelectValue placeholder="Lọc loại yêu cầu" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border text-foreground">
                      <SelectItem value="all">Tất cả danh mục</SelectItem>
                      <SelectItem value="Lỗi phần mềm">🐞 Lỗi phần mềm</SelectItem>
                      <SelectItem value="Yêu cầu tính năng">✨ Yêu cầu tính năng</SelectItem>
                      <SelectItem value="Hỏi đáp/Tư vấn">💬 Hỏi đáp/Tư vấn</SelectItem>
                      <SelectItem value="Hóa đơn/Thanh toán">💳 Hóa đơn/Thanh toán</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Tickets Table / List - Aligned shadow and background card */}
              <Card className="border-border bg-card/70 shadow-xl overflow-hidden">
                <CardContent className="p-0">
                  {tickets.length === 0 ? (
                    <div className="py-16 text-center space-y-4">
                      <div className="inline-flex p-4 bg-primary/10 rounded-full text-primary">
                        <CheckCircle2 className="h-10 w-10 animate-bounce" />
                      </div>
                      <h3 className="text-foreground font-bold text-sm">Tuyệt vời! Không có ticket nào</h3>
                      <p className="text-muted-foreground text-xs max-w-sm mx-auto">
                        Tất cả các yêu cầu hỗ trợ kỹ thuật từ chủ cửa hàng và các tenant đã được xử lý xong.
                      </p>
                    </div>
                  ) : (
                    <div className="w-full overflow-x-auto">
                      <Table>
                        <TableHeader className="border-b border-border">
                          <TableRow className="border-b border-border hover:bg-transparent">
                            <TableHead className="text-muted-foreground font-bold text-xs">Tenant / Slug</TableHead>
                            <TableHead className="text-muted-foreground font-bold text-xs w-[350px]">
                              Nội Dung Yêu Cầu
                            </TableHead>
                            <TableHead className="text-muted-foreground font-bold text-xs">Phân Loại</TableHead>
                            <TableHead className="text-muted-foreground font-bold text-xs">Độ Ưu Tiên</TableHead>
                            <TableHead className="text-muted-foreground font-bold text-xs">Liên Hệ</TableHead>
                            <TableHead className="text-muted-foreground font-bold text-xs">Ngày Gửi</TableHead>
                            <TableHead className="text-muted-foreground font-bold text-xs">Trạng Thái</TableHead>
                            <TableHead className="text-muted-foreground font-bold text-xs text-right">Thao Tác</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tickets
                            .filter((t) => {
                              const matchesSearch =
                                t.title.toLowerCase().includes(ticketSearch.toLowerCase()) ||
                                t.description.toLowerCase().includes(ticketSearch.toLowerCase()) ||
                                t.tenantName.toLowerCase().includes(ticketSearch.toLowerCase());
                              const matchesCat = ticketCategory === "all" || t.category === ticketCategory;
                              return matchesSearch && matchesCat;
                            })
                            .map((t) => (
                              <TableRow key={t.id} className="border-b border-border hover:bg-background/30 transition-colors">
                                {/* Tenant */}
                                <TableCell className="align-top py-4">
                                  <div className="space-y-1">
                                    <div className="font-bold text-foreground text-xs">{t.tenantName}</div>
                                    <div className="font-mono text-[10px] text-muted-foreground">@{t.tenantSlug}</div>
                                  </div>
                                </TableCell>

                                {/* Subject & Description */}
                                <TableCell className="align-top py-4">
                                  <div className="space-y-1.5">
                                    <div className="font-bold text-foreground text-xs leading-normal">{t.title}</div>
                                    <p className="text-muted-foreground text-[11px] leading-relaxed break-words">
                                      {t.description}
                                    </p>
                                  </div>
                                </TableCell>

                                {/* Category */}
                                <TableCell className="align-top py-4">
                                  <Badge
                                    className={`border-none ${
                                      t.category === "Lỗi phần mềm"
                                        ? "bg-rose-500/10 text-rose-400"
                                        : t.category === "Yêu cầu tính năng"
                                          ? "bg-amber-500/10 text-amber-400"
                                          : t.category === "Hỏi đáp/Tư vấn"
                                            ? "bg-indigo-500/10 text-indigo-400"
                                            : "bg-emerald-500/10 text-emerald-400"
                                    }`}
                                  >
                                    {t.category}
                                  </Badge>
                                </TableCell>

                                {/* Priority */}
                                <TableCell className="align-top py-4">
                                  <span
                                    className={`inline-flex items-center gap-1.5 text-[11px] font-bold ${
                                      t.priority === "Cao"
                                        ? "text-rose-400"
                                        : t.priority === "Trung bình"
                                          ? "text-amber-400"
                                          : "text-emerald-400"
                                    }`}
                                  >
                                    <span
                                      className={`h-1.5 w-1.5 rounded-full ${
                                        t.priority === "Cao"
                                          ? "bg-rose-500 animate-pulse"
                                          : t.priority === "Trung bình"
                                            ? "bg-amber-500"
                                            : "bg-emerald-500"
                                      }`}
                                    />
                                    {t.priority}
                                  </span>
                                </TableCell>

                                {/* Contact */}
                                <TableCell className="align-top py-4">
                                  {t.contactPhone ? (
                                    <a
                                      href={`tel:${t.contactPhone}`}
                                      className="text-xs text-primary hover:underline font-semibold font-mono"
                                    >
                                      {t.contactPhone}
                                    </a>
                                  ) : (
                                    <span className="text-[10px] text-slate-600">N/A</span>
                                  )}
                                </TableCell>

                                {/* Created At */}
                                <TableCell className="align-top py-4 text-xs text-muted-foreground font-mono">
                                  {new Date(t.createdAt).toLocaleDateString("vi-VN")}
                                </TableCell>

                                {/* Status Select dropdown */}
                                <TableCell className="align-top py-4">
                                  <Select value={t.status} onValueChange={(val) => handleUpdateTicketStatus(t.id, val)}>
                                    <SelectTrigger
                                      className={`h-7 text-[10px] font-bold w-28 bg-background border-border ${
                                        t.status === "Mới"
                                          ? "text-rose-400 border-rose-900/40"
                                          : t.status === "Đang xử lý"
                                            ? "text-amber-400 border-amber-900/40"
                                            : "text-emerald-400 border-emerald-900/40"
                                      }`}
                                    >
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-card border-border text-foreground">
                                      <SelectItem value="Mới" className="text-rose-400">
                                        🔴 Mới
                                      </SelectItem>
                                      <SelectItem value="Đang xử lý" className="text-amber-400">
                                        🟡 Đang xử lý
                                      </SelectItem>
                                      <SelectItem value="Đã giải quyết" className="text-emerald-400">
                                        🟢 Đã giải quyết
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </TableCell>

                                {/* Actions */}
                                <TableCell className="align-top py-4 text-right">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteTicket(t.id)}
                                    className="h-7 w-7 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
          </main>
        </SidebarInset>

        {/* 🌌 Atmospheric subtle glow overlay for extra visual premium factor */}
        <div className="fixed bottom-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none z-0" />
        <div className="fixed top-0 left-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none z-0" />
      </div>
    </SidebarProvider>
  );
}
