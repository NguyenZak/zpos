"use client";

import React, { useState, useEffect } from "react";
import {
  Award,
  Settings,
  Plus,
  History,
  Sparkles,
  TrendingUp,
  Coins,
  Users,
  Lock,
  Edit2,
  Trash2,
  PlusCircle,
  Search,
  FileText,
  CheckCircle2,
  Activity,
  Info,
  Calendar,
  UserCheck,
  RefreshCw,
  AlertCircle,
  ArrowRight,
  HelpCircle,
  TrendingDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";
import { loyaltyService } from "@/services/loyalty.service";
import { posService } from "@/services/pos.service";
import { usePermissions } from "@/hooks/use-permissions";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND"
  })
    .format(amount)
    .replace(/\s?Đ$/, "đ");
};

export default function LoyaltyDashboard() {
  const { hasPermission, loading: permissionLoading } = usePermissions();
  const canUpdate = hasPermission("loyalty.configure");
  const canAdjust = hasPermission("loyalty.adjust");

  // Core Loyalty State
  const [program, setProgram] = useState<any>(null);
  const [rules, setRules] = useState<any[]>([]);
  const [tiers, setTiers] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [activeTab, setActiveTab] = useState("rules");
  const [searchTx, setSearchTx] = useState("");
  const [searchCust, setSearchCust] = useState("");

  // Dialog / Edit States
  const [programEnabled, setProgramEnabled] = useState(false);
  const [expMonths, setExpMonths] = useState(12);
  const [bdayPoints, setBdayPoints] = useState(50);
  const [firstPoints, setFirstPoints] = useState(20);

  // New Rule Dialog State
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [ruleName, setRuleName] = useState("");
  const [ruleType, setRuleType] = useState("earning_spend");
  const [ruleSpendAmount, setRuleSpendAmount] = useState(10000);
  const [rulePointsAwarded, setRulePointsAwarded] = useState(1);
  const [rulePointsRequired, setRulePointsRequired] = useState(100);
  const [ruleDiscountAmount, setRuleDiscountAmount] = useState(10000);
  const [ruleMinPointsToRedeem, setRuleMinPointsToRedeem] = useState(50);
  const [ruleMaxDiscountPercent, setRuleMaxDiscountPercent] = useState(30);
  const [ruleAllowOnDiscounted, setRuleAllowOnDiscounted] = useState(false);
  const [ruleIsActive, setRuleIsActive] = useState(true);

  // New Tier Dialog State
  const [tierDialogOpen, setTierDialogOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<any>(null);
  const [tierName, setTierName] = useState("");
  const [tierMinPoints, setTierMinPoints] = useState(0);
  const [tierMultiplier, setTierMultiplier] = useState(1.0);

  // New Campaign Dialog State
  const [campaignDialogOpen, setCampaignDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<any>(null);
  const [campName, setCampName] = useState("");
  const [campType, setCampType] = useState("double_points");
  const [campMultiplier, setCampMultiplier] = useState(2.0);
  const [campBonusPoints, setCampBonusPoints] = useState(0);
  const [campStartDate, setCampStartDate] = useState("");
  const [campEndDate, setCampEndDate] = useState("");
  const [campIsActive, setCampIsActive] = useState(true);

  // Manual Adjust State
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [adjustPoints, setAdjustPoints] = useState<number>(0);
  const [adjustNote, setAdjustNote] = useState("");
  const [isAdjusting, setIsAdjusting] = useState(false);

  // Load Data Function
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [progData, rulesData, tiersData, campsData, txsData, custsData] = await Promise.all([
        loyaltyService.getProgram(),
        loyaltyService.getRules(),
        loyaltyService.getTiers(),
        loyaltyService.getCampaigns(),
        loyaltyService.getTransactions(),
        posService.getCustomers("")
      ]);

      setProgram(progData);
      setProgramEnabled(progData?.is_enabled ?? false);
      setExpMonths(progData?.expiration_months ?? 12);
      setBdayPoints(progData?.birthday_bonus_points ?? 0);
      setFirstPoints(progData?.first_purchase_bonus_points ?? 0);

      setRules(rulesData || []);
      setTiers(tiersData || []);
      setCampaigns(campsData || []);
      setTransactions(txsData || []);
      setCustomers(custsData || []);
    } catch (e) {
      console.error("Error loading loyalty dashboard data:", e);
      toast.error("Không thể kết nối dịch vụ tích điểm.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Save general settings
  const handleSaveProgramSettings = async () => {
    if (!canUpdate) {
      toast.error("Bạn không có quyền sửa đổi cài đặt Loyalty.");
      return;
    }
    try {
      const payload = {
        is_enabled: programEnabled,
        expiration_months: expMonths,
        birthday_bonus_points: bdayPoints,
        first_purchase_bonus_points: firstPoints
      };
      await loyaltyService.updateProgram(payload);
      toast.success("Cập nhật thiết lập thành công", {
        description: "Hệ thống đã lưu cấu hình mới của chương trình tích điểm."
      });
      loadDashboardData();
    } catch (e) {
      toast.error("Không thể cập nhật thiết lập");
    }
  };

  // Rule CRUD
  const handleOpenRuleDialog = (rule: any = null) => {
    if (!canUpdate) {
      toast.error("Bạn không có quyền sửa đổi quy tắc Loyalty.");
      return;
    }
    if (rule) {
      setEditingRule(rule);
      setRuleName(rule.name || "");
      setRuleType(rule.rule_type || "earning_spend");
      setRuleSpendAmount(Number(rule.spend_amount || 10000));
      setRulePointsAwarded(Number(rule.points_awarded || 1));
      setRulePointsRequired(Number(rule.points_required || 100));
      setRuleDiscountAmount(Number(rule.discount_amount || 10000));
      setRuleMinPointsToRedeem(Number(rule.min_points_to_redeem || 50));
      setRuleMaxDiscountPercent(Number(rule.max_discount_percentage || 30));
      setRuleAllowOnDiscounted(!!rule.allow_on_discounted_orders);
      setRuleIsActive(!!rule.is_active);
    } else {
      setEditingRule(null);
      setRuleName("");
      setRuleType("earning_spend");
      setRuleSpendAmount(10000);
      setRulePointsAwarded(1);
      setRulePointsRequired(100);
      setRuleDiscountAmount(10000);
      setRuleMinPointsToRedeem(50);
      setRuleMaxDiscountPercent(30);
      setRuleAllowOnDiscounted(false);
      setRuleIsActive(true);
    }
    setRuleDialogOpen(true);
  };

  const handleSaveRule = async () => {
    const payload: any = {
      name: ruleName,
      rule_type: ruleType as any,
      is_active: ruleIsActive
    };

    if (ruleType === "earning_spend") {
      payload.spend_amount = ruleSpendAmount;
      payload.points_awarded = rulePointsAwarded;
    } else if (ruleType === "earning_order") {
      payload.points_awarded = rulePointsAwarded;
    } else if (ruleType === "redemption_discount") {
      payload.points_required = rulePointsRequired;
      payload.discount_amount = ruleDiscountAmount;
      payload.min_points_to_redeem = ruleMinPointsToRedeem;
      payload.max_discount_percentage = ruleMaxDiscountPercent;
      payload.allow_on_discounted_orders = ruleAllowOnDiscounted;
    }

    try {
      if (editingRule) {
        await loyaltyService.updateRule(editingRule.id, payload);
        toast.success("Cập nhật quy tắc thành công");
      } else {
        await loyaltyService.createRule(payload);
        toast.success("Tạo quy tắc tích điểm mới thành công");
      }
      setRuleDialogOpen(false);
      loadDashboardData();
    } catch (e) {
      toast.error("Lỗi khi lưu quy tắc");
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!canUpdate) return;
    if (!confirm("Bạn có chắc muốn xóa quy tắc này?")) return;
    try {
      await loyaltyService.deleteRule(id);
      toast.success("Đã xóa quy tắc");
      loadDashboardData();
    } catch (e) {
      toast.error("Không thể xóa quy tắc");
    }
  };

  // Tier CRUD
  const handleOpenTierDialog = (tier: any = null) => {
    if (!canUpdate) {
      toast.error("Bạn không có quyền sửa đổi phân hạng thành viên.");
      return;
    }
    if (tier) {
      setEditingTier(tier);
      setTierName(tier.name || "");
      setTierMinPoints(Number(tier.min_points || 0));
      setTierMultiplier(Number(tier.points_multiplier || 1.0));
    } else {
      setEditingTier(null);
      setTierName("");
      setTierMinPoints(0);
      setTierMultiplier(1.0);
    }
    setTierDialogOpen(true);
  };

  const handleSaveTier = async () => {
    const payload = {
      name: tierName,
      min_points: tierMinPoints,
      points_multiplier: tierMultiplier
    };

    try {
      if (editingTier) {
        await loyaltyService.updateTier(editingTier.id, payload);
        toast.success("Đã lưu hạng thành viên");
      } else {
        await loyaltyService.createTier(payload);
        toast.success("Đã tạo hạng thành viên mới");
      }
      setTierDialogOpen(false);
      loadDashboardData();
    } catch (e) {
      toast.error("Lỗi khi lưu hạng thành viên");
    }
  };

  const handleDeleteTier = async (id: string) => {
    if (!canUpdate) return;
    if (!confirm("Bạn có chắc muốn xóa hạng thành viên này?")) return;
    try {
      await loyaltyService.deleteTier(id);
      toast.success("Đã xóa hạng thành viên");
      loadDashboardData();
    } catch (e) {
      toast.error("Không thể xóa hạng thành viên");
    }
  };

  // Campaign CRUD
  const handleOpenCampaignDialog = (camp: any = null) => {
    if (!canUpdate) {
      toast.error("Bạn không có quyền thiết lập chiến dịch tích điểm.");
      return;
    }
    if (camp) {
      setEditingCampaign(camp);
      setCampName(camp.name || "");
      setCampType(camp.campaign_type || "double_points");
      setCampMultiplier(Number(camp.points_multiplier || 2.0));
      setCampBonusPoints(Number(camp.bonus_points || 0));
      setCampStartDate(camp.start_date ? camp.start_date.substring(0, 10) : "");
      setCampEndDate(camp.end_date ? camp.end_date.substring(0, 10) : "");
      setCampIsActive(!!camp.is_active);
    } else {
      setEditingCampaign(null);
      setCampName("");
      setCampType("double_points");
      setCampMultiplier(2.0);
      setCampBonusPoints(0);
      setCampStartDate("");
      setCampEndDate("");
      setCampIsActive(true);
    }
    setCampaignDialogOpen(true);
  };

  const handleSaveCampaign = async () => {
    const payload = {
      name: campName,
      campaign_type: campType as any,
      points_multiplier: campType === "double_points" ? campMultiplier : 1.0,
      bonus_points: campType === "first_purchase" || campType === "birthday" ? campBonusPoints : 0,
      start_date: campStartDate || null,
      end_date: campEndDate || null,
      is_active: campIsActive
    };

    try {
      if (editingCampaign) {
        await loyaltyService.updateCampaign(editingCampaign.id, payload);
        toast.success("Chiến dịch đã được cập nhật");
      } else {
        await loyaltyService.createCampaign(payload);
        toast.success("Đã khởi động chiến dịch mới");
      }
      setCampaignDialogOpen(false);
      loadDashboardData();
    } catch (e) {
      toast.error("Lỗi khi lưu chiến dịch");
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    if (!canUpdate) return;
    if (!confirm("Bạn có chắc muốn xóa chiến dịch này?")) return;
    try {
      await loyaltyService.deleteCampaign(id);
      toast.success("Đã hủy bỏ chiến dịch");
      loadDashboardData();
    } catch (e) {
      toast.error("Không thể xóa chiến dịch");
    }
  };

  // Adjust points manual handler
  const handleAdjustPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAdjust) {
      toast.error("Bạn không có quyền điều chỉnh điểm tích luỹ.");
      return;
    }
    if (!selectedCustomer) {
      toast.error("Vui lòng chọn khách hàng cần điều chỉnh.");
      return;
    }
    if (adjustPoints === 0) {
      toast.error("Số điểm điều chỉnh phải khác 0.");
      return;
    }
    if (!adjustNote.trim()) {
      toast.error("Vui lòng nhập lý do điều chỉnh để ghi nhận lịch sử.");
      return;
    }

    setIsAdjusting(true);
    try {
      await loyaltyService.adjustPoints(selectedCustomer.id, adjustPoints, adjustNote.trim());
      toast.success(`Đã điều chỉnh thành công ${adjustPoints >= 0 ? "+" : ""}${adjustPoints} điểm`, {
        description: `Ghi nhận thay đổi cho khách hàng ${selectedCustomer.name}.`
      });
      setAdjustPoints(0);
      setAdjustNote("");
      setSelectedCustomer(null);
      loadDashboardData();
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi điều chỉnh điểm");
    } finally {
      setIsAdjusting(false);
    }
  };

  // Filtered transactions
  const filteredTransactions = transactions.filter((tx) => {
    const q = searchTx.toLowerCase();
    return (
      tx.customer?.name?.toLowerCase().includes(q) ||
      tx.customer?.phone?.includes(q) ||
      tx.notes?.toLowerCase().includes(q) ||
      tx.id.toLowerCase().includes(q)
    );
  });

  // Filtered customers for manual adjust
  const filteredCustomers = customers.filter((c) => {
    const q = searchCust.toLowerCase();
    return c.name?.toLowerCase().includes(q) || c.phone?.includes(q);
  });

  // Metrics Calculations (Emulated reports)
  const totalEarnedPoints = transactions
    .filter((tx) => tx.points > 0)
    .reduce((sum, tx) => sum + tx.points, 0);

  const totalRedeemedPoints = Math.abs(
    transactions.filter((tx) => tx.points < 0).reduce((sum, tx) => sum + tx.points, 0)
  );

  const activeLoyaltyUsersCount = customers.filter(
    (c) => (c.loyalty_points || 0) > 0
  ).length;

  return (
    <div className="flex flex-col gap-5 p-1 sm:p-2">
      {/* Top Banner and Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b pb-5">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
            <Award className="w-4 h-4" /> Hệ thống ZPOS Loyalty
          </div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
            Chương trình Khách hàng Thân thiết
          </h1>
          <p className="text-muted-foreground text-sm">
            Thiết lập quy tắc tích & đổi điểm, quản lý phân hạng và kiểm soát lịch sử tích luỹ.
          </p>
        </div>

        {/* Global Toggle */}
        <div className="flex items-center gap-4 bg-muted/40 p-4 rounded-xl border">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold text-foreground">
              Kích hoạt tích điểm
            </span>
            <span className="text-[10px] text-muted-foreground">
              Áp dụng cho toàn bộ cửa hàng
            </span>
          </div>
          <Switch
            checked={programEnabled}
            onCheckedChange={(checked) => {
              if (!canUpdate) {
                toast.error("Bạn không có quyền sửa đổi cài đặt Loyalty.");
                return;
              }
              setProgramEnabled(checked);
            }}
            disabled={!canUpdate}
          />
        </div>
      </div>

      {/* Analytics Widget / Reports Header Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card className="bg-gradient-to-br from-primary/5 via-primary/5 to-transparent border-primary/20 relative overflow-hidden">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              Tổng điểm đã phát
            </CardDescription>
            <CardTitle className="text-2xl font-black mt-0.5 flex items-center gap-1.5 text-zinc-900 dark:text-zinc-50">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              {totalEarnedPoints.toLocaleString("vi-VN")}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-[10px] text-muted-foreground font-semibold">
              Đã ghi nhận qua giao dịch tích lũy
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/5 via-amber-500/5 to-transparent border-amber-500/20">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              Tổng điểm đã quy đổi
            </CardDescription>
            <CardTitle className="text-2xl font-black mt-0.5 flex items-center gap-1.5 text-zinc-900 dark:text-zinc-50">
              <Coins className="w-5 h-5 text-amber-500" />
              {totalRedeemedPoints.toLocaleString("vi-VN")}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-[10px] text-muted-foreground font-semibold">
              Đổi thành giảm trừ hóa đơn POS
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/5 via-purple-500/5 to-transparent border-purple-500/20">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              Tỷ lệ sử dụng điểm (Burn Rate)
            </CardDescription>
            <CardTitle className="text-2xl font-black mt-0.5 text-zinc-900 dark:text-zinc-50">
              {totalEarnedPoints > 0
                ? `${Math.round((totalRedeemedPoints / totalEarnedPoints) * 100)}%`
                : "0%"}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-[10px] text-muted-foreground font-semibold">
              Điểm tiêu dùng trên điểm phát hành
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/5 via-blue-500/5 to-transparent border-blue-500/20">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              Thành viên tích cực
            </CardDescription>
            <CardTitle className="text-2xl font-black mt-0.5 flex items-center gap-1.5 text-zinc-900 dark:text-zinc-50">
              <Users className="w-5 h-5 text-blue-500" />
              {activeLoyaltyUsersCount}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-[10px] text-muted-foreground font-semibold">
              Khách hàng sở hữu số dư điểm lớn hơn 0
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs Container */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 lg:grid-cols-6 h-11 bg-muted/65 p-1 rounded-xl">
          <TabsTrigger value="rules" className="rounded-lg text-xs font-bold">
            Quy tắc điểm
          </TabsTrigger>
          <TabsTrigger value="tiers" className="rounded-lg text-xs font-bold">
            Hạng thành viên
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="rounded-lg text-xs font-bold">
            Chiến dịch
          </TabsTrigger>
          <TabsTrigger value="adjust" className="rounded-lg text-xs font-bold">
            Điều chỉnh điểm
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg text-xs font-bold">
            Lịch sử giao dịch
          </TabsTrigger>
          <TabsTrigger value="settings" className="rounded-lg text-xs font-bold">
            Cấu hình chung
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Rules */}
        <TabsContent value="rules" className="mt-4 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                Quy tắc tích lũy & Đổi điểm
              </h2>
              <p className="text-xs text-muted-foreground">
                Tự động cộng điểm khi khách thanh toán và cho phép đổi điểm lấy mã giảm giá.
              </p>
            </div>
            {canUpdate ? (
              <Button
                onClick={() => handleOpenRuleDialog()}
                className="gap-1.5 font-bold text-xs h-9 rounded-lg"
              >
                <Plus className="w-4 h-4" /> Thêm quy tắc
              </Button>
            ) : (
              <Badge className="bg-amber-500/10 text-amber-600 border-none font-bold gap-1">
                <Lock className="w-3.5 h-3.5" /> Chỉ xem
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rules.map((rule) => {
              const isEarning = rule.rule_type?.startsWith("earning");
              return (
                <Card
                  key={rule.id}
                  className={`border transition-all duration-300 ${
                    rule.is_active
                      ? "bg-card border-border hover:shadow-md"
                      : "bg-muted/10 opacity-70 border-dashed"
                  }`}
                >
                  <CardHeader className="p-5 pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                            isEarning
                              ? "bg-emerald-500/10 text-emerald-500"
                              : "bg-amber-500/10 text-amber-500"
                          }`}
                        >
                          <Award className="w-5 h-5" />
                        </div>
                        <div>
                          <CardTitle className="text-sm font-black text-zinc-900 dark:text-zinc-50">
                            {rule.name}
                          </CardTitle>
                          <CardDescription className="text-[10px] font-bold uppercase mt-0.5 tracking-wider">
                            {isEarning ? "Quy tắc cộng điểm (Earning)" : "Quy tắc tiêu dùng (Redemption)"}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge
                        variant={rule.is_active ? "default" : "secondary"}
                        className="text-[9px] font-bold"
                      >
                        {rule.is_active ? "Hoạt động" : "Tạm ngưng"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-5 pt-0 space-y-4">
                    <div className="bg-muted/30 p-3 rounded-lg text-xs space-y-1.5 font-medium border">
                      {rule.rule_type === "earning_spend" && (
                        <p>
                          Mỗi <span className="font-bold text-primary">{formatCurrency(rule.spend_amount)}</span> chi tiêu ={" "}
                          <span className="font-bold text-emerald-600">+{rule.points_awarded} điểm</span>.
                        </p>
                      )}
                      {rule.rule_type === "earning_order" && (
                        <p>
                          Cộng cố định <span className="font-bold text-emerald-600">+{rule.points_awarded} điểm</span> cho mỗi đơn hàng.
                        </p>
                      )}
                      {rule.rule_type === "redemption_discount" && (
                        <div className="space-y-1">
                          <p>
                            Đổi <span className="font-bold text-amber-500">{rule.points_required} điểm</span> lấy{" "}
                            <span className="font-bold text-primary">{formatCurrency(rule.discount_amount)}</span> giảm giá.
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            • Tối thiểu đổi: <b>{rule.min_points_to_redeem} điểm</b>
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            • Giảm tối đa: <b>{rule.max_discount_percentage}% đơn hàng</b>
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            • Áp dụng chung với KM khác: <b>{rule.allow_on_discounted_orders ? "Có" : "Không"}</b>
                          </p>
                        </div>
                      )}
                    </div>

                    {canUpdate && (
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs gap-1 hover:bg-muted"
                          onClick={() => handleOpenRuleDialog(rule)}
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Sửa
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 gap-1"
                          onClick={() => handleDeleteRule(rule.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Xóa
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}

            {rules.length === 0 && (
              <div className="col-span-2 text-center py-20 bg-muted/20 border-2 border-dashed rounded-2xl">
                <Info className="w-10 h-10 text-muted-foreground mx-auto mb-2.5" />
                <p className="text-sm font-bold text-muted-foreground">Chưa cấu hình quy tắc Loyalty nào</p>
                <p className="text-xs text-muted-foreground">Nhấp vào Thêm quy tắc để thiết lập ban đầu.</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab 2: Tiers */}
        <TabsContent value="tiers" className="mt-4 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                Phân hạng thành viên (Customer Tiers)
              </h2>
              <p className="text-xs text-muted-foreground">
                Tự động thăng hạng khi khách hàng tích lũy đủ điểm. Nhân số hệ số cộng điểm theo hạng VIP.
              </p>
            </div>
            {canUpdate ? (
              <Button
                onClick={() => handleOpenTierDialog()}
                className="gap-1.5 font-bold text-xs h-9 rounded-lg"
              >
                <Plus className="w-4 h-4" /> Thêm hạng thành viên
              </Button>
            ) : (
              <Badge className="bg-amber-500/10 text-amber-600 border-none font-bold gap-1">
                <Lock className="w-3.5 h-3.5" /> Chỉ xem
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {tiers.map((tier, idx) => {
              // Custom gradient card styles depending on index or name
              let gradient = "from-zinc-400/15 via-zinc-400/5 to-transparent border-zinc-300";
              let textBadge = "text-zinc-600 dark:text-zinc-300";
              if (tier.name.toLowerCase().includes("bạc") || tier.name.toLowerCase().includes("silver")) {
                gradient = "from-slate-400/15 via-slate-400/5 to-transparent border-slate-300";
                textBadge = "text-slate-500 dark:text-slate-300";
              } else if (tier.name.toLowerCase().includes("vàng") || tier.name.toLowerCase().includes("gold")) {
                gradient = "from-amber-500/15 via-amber-500/5 to-transparent border-amber-400/50";
                textBadge = "text-amber-600 dark:text-amber-400";
              } else if (tier.name.toLowerCase().includes("bạch kim") || tier.name.toLowerCase().includes("platinum")) {
                gradient = "from-purple-500/20 via-purple-500/5 to-transparent border-purple-400/50";
                textBadge = "text-purple-600 dark:text-purple-400";
              }

              return (
                <Card
                  key={tier.id}
                  className={`bg-gradient-to-br border shadow-sm relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${gradient}`}
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
                  <CardHeader className="p-5 pb-3">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-black uppercase tracking-wider opacity-75">
                        BẬC {idx + 1}
                      </span>
                      <Award className={`w-5 h-5 ${textBadge}`} />
                    </div>
                    <CardTitle className="text-base font-black text-zinc-900 dark:text-zinc-50 mt-1">
                      {tier.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 pt-0 space-y-4">
                    <div className="space-y-1.5 text-xs text-muted-foreground font-semibold">
                      <div className="flex justify-between border-b pb-1">
                        <span>Điểm tối thiểu:</span>
                        <span className="font-bold text-foreground">
                          {tier.min_points.toLocaleString("vi-VN")} điểm
                        </span>
                      </div>
                      <div className="flex justify-between pt-1">
                        <span>Hệ số cộng điểm:</span>
                        <span className="font-bold text-primary">
                          {tier.points_multiplier}x điểm
                        </span>
                      </div>
                    </div>

                    {canUpdate && (
                      <div className="flex justify-end gap-1.5 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleOpenTierDialog(tier)}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                          onClick={() => handleDeleteTier(tier.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}

            {tiers.length === 0 && (
              <div className="col-span-4 text-center py-20 bg-muted/20 border-2 border-dashed rounded-2xl">
                <Info className="w-10 h-10 text-muted-foreground mx-auto mb-2.5" />
                <p className="text-sm font-bold text-muted-foreground">Chưa tạo thứ hạng thành viên</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab 3: Campaigns */}
        <TabsContent value="campaigns" className="mt-4 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                Chiến dịch nhân đôi điểm & Ngày hội mua sắm
              </h2>
              <p className="text-xs text-muted-foreground">
                Tạo các chiến dịch tăng hệ số tích điểm theo thời gian nhất định hoặc thưởng điểm bổ sung.
              </p>
            </div>
            {canUpdate ? (
              <Button
                onClick={() => handleOpenCampaignDialog()}
                className="gap-1.5 font-bold text-xs h-9 rounded-lg"
              >
                <Plus className="w-4 h-4" /> Kích hoạt chiến dịch
              </Button>
            ) : (
              <Badge className="bg-amber-500/10 text-amber-600 border-none font-bold gap-1">
                <Lock className="w-3.5 h-3.5" /> Chỉ xem
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {campaigns.map((camp) => {
              const isEventActive =
                camp.is_active &&
                (!camp.start_date || new Date(camp.start_date) <= new Date()) &&
                (!camp.end_date || new Date(camp.end_date) >= new Date());

              return (
                <Card
                  key={camp.id}
                  className={`border transition-all duration-300 ${
                    isEventActive
                      ? "bg-card border-emerald-500/30 hover:shadow-md"
                      : "bg-muted/10 opacity-70 border-dashed"
                  }`}
                >
                  <CardHeader className="p-5 pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                            isEventActive
                              ? "bg-emerald-500/10 text-emerald-500 animate-pulse"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                          <CardTitle className="text-sm font-black text-zinc-900 dark:text-zinc-50">
                            {camp.name}
                          </CardTitle>
                          <CardDescription className="text-[10px] font-bold uppercase mt-0.5 tracking-wider">
                            {camp.campaign_type === "double_points"
                              ? "Chiến dịch Nhân hệ số điểm"
                              : "Chiến dịch Thưởng điểm cố định"}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge
                        variant={isEventActive ? "default" : "secondary"}
                        className={`text-[9px] font-bold ${
                          isEventActive ? "bg-emerald-500 text-white" : ""
                        }`}
                      >
                        {isEventActive ? "Đang chạy" : "Tạm ngưng/Kết thúc"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-5 pt-0 space-y-4">
                    <div className="bg-muted/30 p-3 rounded-lg text-xs space-y-2 font-medium border">
                      {camp.campaign_type === "double_points" ? (
                        <p>
                          Hệ số tích điểm:{" "}
                          <span className="font-bold text-primary text-sm">{camp.points_multiplier}x điểm</span> cho mọi hóa đơn.
                        </p>
                      ) : (
                        <p>
                          Thưởng cố định:{" "}
                          <span className="font-bold text-emerald-600 text-sm">+{camp.bonus_points} điểm</span> khi mua hàng.
                        </p>
                      )}
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground pt-1 border-t">
                        <Calendar className="w-3.5 h-3.5" />
                        Thời gian:{" "}
                        {camp.start_date || camp.end_date ? (
                          <span>
                            {camp.start_date ? new Date(camp.start_date).toLocaleDateString("vi-VN") : "Bắt đầu ngay"}{" "}
                            → {camp.end_date ? new Date(camp.end_date).toLocaleDateString("vi-VN") : "Vô thời hạn"}
                          </span>
                        ) : (
                          <span>Vô thời hạn</span>
                        )}
                      </div>
                    </div>

                    {canUpdate && (
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs gap-1"
                          onClick={() => handleOpenCampaignDialog(camp)}
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Sửa
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 gap-1"
                          onClick={() => handleDeleteCampaign(camp.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Hủy
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}

            {campaigns.length === 0 && (
              <div className="col-span-2 text-center py-20 bg-muted/20 border-2 border-dashed rounded-2xl">
                <Info className="w-10 h-10 text-muted-foreground mx-auto mb-2.5" />
                <p className="text-sm font-bold text-muted-foreground">Chưa có chiến dịch nào được tạo</p>
                <p className="text-xs text-muted-foreground">Tích hợp nhân đôi điểm trong dịp lễ tết hoặc x1.5 dịp sinh nhật.</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab 4: Manual Adjust */}
        <TabsContent value="adjust" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Customer Search & Select List (Left panel) */}
            <Card className="lg:col-span-1 border">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-black text-zinc-900 dark:text-zinc-50">
                  Chọn khách hàng cần điều chỉnh
                </CardTitle>
                <CardDescription className="text-xs">
                  Chọn khách hàng để xem số dư điểm và tiến hành điều chỉnh.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Tìm tên hoặc SĐT..."
                    value={searchCust}
                    onChange={(e) => setSearchCust(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>

                <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
                  {filteredCustomers.slice(0, 15).map((cust) => {
                    const isSelected = selectedCustomer?.id === cust.id;
                    return (
                      <div
                        key={cust.id}
                        onClick={() => {
                          setSelectedCustomer(cust);
                          setAdjustPoints(0);
                        }}
                        className={`flex items-center justify-between p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                          isSelected
                            ? "bg-primary/5 border-primary font-bold text-primary"
                            : "bg-card border-border hover:bg-muted/40 text-foreground"
                        }`}
                      >
                        <div>
                          <p className="font-bold">{cust.name}</p>
                          <p className="text-[10px] text-muted-foreground">{cust.phone || "Không có SĐT"}</p>
                        </div>
                        <Badge variant="secondary" className="text-[9px] font-bold">
                          {cust.points || 0} điểm
                        </Badge>
                      </div>
                    );
                  })}
                  {filteredCustomers.length === 0 && (
                    <p className="text-center py-6 text-xs text-muted-foreground italic">
                      Không tìm thấy khách hàng.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Adjustment Form (Right panel) */}
            <Card className="lg:col-span-2 border">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-black text-zinc-900 dark:text-zinc-50">
                  Nhập số điểm cần điều chỉnh
                </CardTitle>
                <CardDescription className="text-xs">
                  Nhập điểm dương (+) để cộng thưởng, điểm âm (-) để khấu trừ. Ghi rõ lý do điều chỉnh để kiểm toán.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5">
                {!selectedCustomer ? (
                  <div className="text-center py-16 opacity-60">
                    <UserCheck className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-xs font-bold text-muted-foreground uppercase">Chưa chọn khách hàng</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Vui lòng tìm và nhấp chọn khách hàng bên cột trái để thao tác.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleAdjustPoints} className="space-y-4">
                    <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground font-semibold">Khách hàng được chọn</p>
                        <h4 className="text-base font-black text-foreground mt-0.5">{selectedCustomer.name}</h4>
                        <p className="text-[10px] text-muted-foreground">{selectedCustomer.phone || "Không có SĐT"}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground font-semibold">Số dư hiện tại</p>
                        <h3 className="text-xl font-black text-primary mt-0.5">{selectedCustomer.points || 0} điểm</h3>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="adjust-value" className="text-xs font-bold uppercase text-muted-foreground">
                        Thay đổi điểm
                      </Label>
                      <div className="relative">
                        <Input
                          id="adjust-value"
                          type="number"
                          placeholder="Cộng hoặc trừ điểm, ví dụ: 50 hoặc -50"
                          value={adjustPoints || ""}
                          onChange={(e) => setAdjustPoints(Number(e.target.value))}
                          className="h-11 pl-4 pr-16 text-lg font-bold"
                          disabled={!canAdjust || isAdjusting}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-xs text-muted-foreground">
                          ZPoint
                        </span>
                      </div>
                      {adjustPoints !== 0 && (
                        <p className={`text-[10px] font-bold ${adjustPoints > 0 ? "text-emerald-600" : "text-rose-500"}`}>
                          ⚠️ Hành động này sẽ {adjustPoints > 0 ? "cộng thêm" : "khấu trừ"}{" "}
                          <b>{Math.abs(adjustPoints)} điểm</b> của khách hàng. Số dư mới dự kiến:{" "}
                          <b>{(selectedCustomer.points || 0) + adjustPoints} điểm</b>.
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="adjust-reason" className="text-xs font-bold uppercase text-muted-foreground">
                        Lý do điều chỉnh
                      </Label>
                      <Textarea
                        id="adjust-reason"
                        placeholder="Nhập chi tiết lý do (ví dụ: Đền bù dịch vụ lỗi, Thưởng sự kiện cộng đồng, Sửa sai sót hệ thống...)"
                        value={adjustNote}
                        onChange={(e) => setAdjustNote(e.target.value)}
                        className="min-h-[90px] text-xs"
                        disabled={!canAdjust || isAdjusting}
                        required
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-3 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-10 text-xs font-bold text-muted-foreground"
                        onClick={() => setSelectedCustomer(null)}
                        disabled={isAdjusting}
                      >
                        Huỷ bỏ
                      </Button>
                      <Button
                        type="submit"
                        className="h-10 text-xs font-bold gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                        disabled={!canAdjust || isAdjusting || adjustPoints === 0 || !adjustNote.trim()}
                      >
                        {isAdjusting ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" /> Đang cập nhật...
                          </>
                        ) : (
                          <>
                            Cập nhật số dư điểm <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </Button>
                    </div>

                    {!canAdjust && (
                      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs flex items-start gap-2 text-amber-700 dark:text-amber-400">
                        <Lock className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">Quyền hạn hạn chế</p>
                          <p className="text-[10px] leading-relaxed">
                            Tài khoản của bạn là Cashier (Thu ngân), không được cấp phép để thay đổi thủ công số dư điểm thành viên. Vui lòng liên hệ Manager/Owner.
                          </p>
                        </div>
                      </div>
                    )}
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 5: History */}
        <TabsContent value="history" className="mt-4 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                Nhật ký biến động điểm (Audit Transactions)
              </h2>
              <p className="text-xs text-muted-foreground">
                Ghi nhận chi tiết lịch sử tích điểm, đổi điểm và điều chỉnh điểm thủ công.
              </p>
            </div>
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Tìm giao dịch, khách hàng..."
                value={searchTx}
                onChange={(e) => setSearchTx(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </div>

          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Thời gian</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Mã GD</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Khách hàng</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Loại giao dịch</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-right">Biến động điểm</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Nội dung</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((tx) => {
                  const isAdd = tx.points >= 0;
                  return (
                    <TableRow key={tx.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell className="text-xs font-semibold text-muted-foreground">
                        {new Date(tx.created_at).toLocaleString("vi-VN")}
                      </TableCell>
                      <TableCell className="font-mono text-[10px] text-muted-foreground uppercase font-bold">
                        #{tx.id.slice(0, 8)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-xs text-foreground">{tx.customer?.name || "Khách lạ"}</span>
                          <span className="text-[10px] text-muted-foreground">{tx.customer?.phone || ""}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            tx.transaction_type === "earn"
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                              : tx.transaction_type === "redeem"
                              ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                              : "bg-blue-500/10 text-blue-600 border-blue-500/20"
                          }`}
                        >
                          {tx.transaction_type === "earn" && "Tích điểm POS"}
                          {tx.transaction_type === "redeem" && "Tiêu điểm checkout"}
                          {tx.transaction_type === "adjust_add" && "Điều chỉnh tăng"}
                          {tx.transaction_type === "adjust_sub" && "Điều chỉnh giảm"}
                          {tx.transaction_type === "expire" && "Điểm hết hạn"}
                        </Badge>
                      </TableCell>
                      <TableCell className={`text-right font-black text-xs ${isAdd ? "text-emerald-500" : "text-rose-500"}`}>
                        {isAdd ? "+" : ""}
                        {tx.points}
                      </TableCell>
                      <TableCell className="text-xs text-zinc-600 dark:text-zinc-300 font-medium max-w-[200px] truncate">
                        {tx.notes || "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredTransactions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-40 text-center opacity-50 italic text-sm">
                      Chưa ghi nhận giao dịch tích lũy điểm nào.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Tab 6: Settings */}
        <TabsContent value="settings" className="mt-4">
          <Card className="max-w-2xl border">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-base font-black text-zinc-900 dark:text-zinc-50">
                Cấu hình Loyalty nâng cao
              </CardTitle>
              <CardDescription className="text-xs">
                Thiết lập hạn sử dụng điểm tích lũy và quà tặng tự động của chiến dịch hệ thống.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="exp-months" className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
                    Thời gian hết hạn điểm
                    <HelpCircle className="w-3.5 h-3.5 text-muted-foreground" />
                  </Label>
                  <div className="relative">
                    <Input
                      id="exp-months"
                      type="number"
                      value={expMonths}
                      onChange={(e) => setExpMonths(Number(e.target.value))}
                      className="h-10 pr-16 font-bold"
                      disabled={!canUpdate}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                      Tháng
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Điểm tích lũy sẽ tự động hết hạn và xóa khỏi ví khách hàng sau chu kỳ này.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="first-bonus" className="text-xs font-bold uppercase text-muted-foreground">
                    Thưởng đơn đầu tiên (First Order)
                  </Label>
                  <div className="relative">
                    <Input
                      id="first-bonus"
                      type="number"
                      value={firstPoints}
                      onChange={(e) => setFirstPoints(Number(e.target.value))}
                      className="h-10 pr-16 font-bold"
                      disabled={!canUpdate}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                      Điểm
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Tặng tự động khi khách hàng lần đầu phát sinh giao dịch thành công.
                  </p>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="birthday-bonus" className="text-xs font-bold uppercase text-muted-foreground">
                    Tặng điểm sinh nhật (Birthday Bonus)
                  </Label>
                  <div className="relative">
                    <Input
                      id="birthday-bonus"
                      type="number"
                      value={bdayPoints}
                      onChange={(e) => setBdayPoints(Number(e.target.value))}
                      className="h-10 pr-16 font-bold"
                      disabled={!canUpdate}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                      Điểm
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Tặng tự động vào ngày sinh nhật của khách hàng được cập nhật trên hồ sơ khách.
                  </p>
                </div>
              </div>

              {canUpdate ? (
                <div className="flex justify-end pt-4 border-t">
                  <Button
                    onClick={handleSaveProgramSettings}
                    className="h-10 px-5 font-bold text-xs bg-primary hover:bg-primary/95 text-primary-foreground"
                  >
                    Lưu cấu hình hệ thống
                  </Button>
                </div>
              ) : (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3.5 text-xs flex items-start gap-2 text-amber-700 dark:text-amber-400">
                  <Lock className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Quyền hạn chỉ xem</p>
                    <p className="text-[10px] leading-relaxed">
                      Bạn không có quyền sửa đổi cài đặt cấu hình Loyalty. Vui lòng liên hệ quản trị viên (Manager/Owner) để được mở khóa.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* --- DIALOGS SECTION --- */}

      {/* Rule Dialog */}
      <Dialog open={ruleDialogOpen} onOpenChange={setRuleDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-black">
              {editingRule ? "Chỉnh sửa quy tắc Loyalty" : "Tạo quy tắc tích & đổi điểm"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Thiết lập các tham số để tự động áp dụng khi bán hàng tại quầy POS.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Tên quy tắc</Label>
              <Input
                placeholder="Ví dụ: Tích 1 điểm cho mỗi 10k chi tiêu"
                value={ruleName}
                onChange={(e) => setRuleName(e.target.value)}
                className="h-10 text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Loại quy tắc</Label>
              <Select
                value={ruleType}
                onValueChange={(val) => {
                  setRuleType(val);
                  if (val === "earning_spend") setRuleName("Tích điểm trên hóa đơn");
                  else if (val === "earning_order") setRuleName("Thưởng điểm hóa đơn");
                  else if (val === "redemption_discount") setRuleName("Đổi điểm lấy chiết khấu");
                }}
              >
                <SelectTrigger className="h-10 text-xs font-semibold">
                  <SelectValue placeholder="Chọn loại quy tắc" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="earning_spend" className="text-xs">Tích điểm theo giá trị mua hàng (Earning Spend)</SelectItem>
                  <SelectItem value="earning_order" className="text-xs">Tặng điểm cố định mỗi đơn (Earning Order)</SelectItem>
                  <SelectItem value="redemption_discount" className="text-xs">Tiêu điểm lấy chiết khấu (Redemption Discount)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Earning Spend Fields */}
            {ruleType === "earning_spend" && (
              <div className="grid grid-cols-2 gap-3.5 border bg-muted/20 p-3 rounded-lg">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Mức chi tiêu (VND)</Label>
                  <Input
                    type="number"
                    value={ruleSpendAmount}
                    onChange={(e) => setRuleSpendAmount(Number(e.target.value))}
                    className="h-9 font-bold text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Điểm nhận được</Label>
                  <Input
                    type="number"
                    value={rulePointsAwarded}
                    onChange={(e) => setRulePointsAwarded(Number(e.target.value))}
                    className="h-9 font-bold text-xs text-emerald-600"
                  />
                </div>
              </div>
            )}

            {/* Earning Order Fields */}
            {ruleType === "earning_order" && (
              <div className="border bg-muted/20 p-3 rounded-lg space-y-2">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Điểm thưởng mỗi đơn hàng</Label>
                <Input
                  type="number"
                  value={rulePointsAwarded}
                  onChange={(e) => setRulePointsAwarded(Number(e.target.value))}
                  className="h-9 font-bold text-xs text-emerald-600"
                />
              </div>
            )}

            {/* Redemption Fields */}
            {ruleType === "redemption_discount" && (
              <div className="space-y-3.5 border bg-muted/20 p-3 rounded-lg">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground">Số điểm quy đổi</Label>
                    <Input
                      type="number"
                      value={rulePointsRequired}
                      onChange={(e) => setRulePointsRequired(Number(e.target.value))}
                      className="h-9 font-bold text-xs text-amber-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground">Giá trị giảm tương ứng</Label>
                    <Input
                      type="number"
                      value={ruleDiscountAmount}
                      onChange={(e) => setRuleDiscountAmount(Number(e.target.value))}
                      className="h-9 font-bold text-xs text-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground">Điểm tối thiểu sử dụng</Label>
                    <Input
                      type="number"
                      value={ruleMinPointsToRedeem}
                      onChange={(e) => setRuleMinPointsToRedeem(Number(e.target.value))}
                      className="h-9 font-bold text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground">Giới hạn giảm giá tối đa</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={ruleMaxDiscountPercent}
                        onChange={(e) => setRuleMaxDiscountPercent(Number(e.target.value))}
                        className="h-9 pr-6 font-bold text-xs"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold">%</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t pt-2">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Đổi điểm trên đơn có sẵn giảm giá</Label>
                  <Switch
                    checked={ruleAllowOnDiscounted}
                    onCheckedChange={setRuleAllowOnDiscounted}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between border-t pt-3.5">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Trạng thái hoạt động</Label>
              <Switch
                checked={ruleIsActive}
                onCheckedChange={setRuleIsActive}
              />
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              className="h-10 text-xs font-bold text-muted-foreground"
              onClick={() => setRuleDialogOpen(false)}
            >
              Hủy bỏ
            </Button>
            <Button
              type="button"
              onClick={handleSaveRule}
              className="h-10 text-xs font-bold bg-primary hover:bg-primary/95 text-primary-foreground"
              disabled={!ruleName.trim()}
            >
              Xác nhận lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tier Dialog */}
      <Dialog open={tierDialogOpen} onOpenChange={setTierDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-black">
              {editingTier ? "Chỉnh sửa hạng thành viên" : "Tạo hạng thành viên VIP"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Thiết lập điểm sàn tích lũy và hệ số nhân điểm đặc quyền.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Tên phân hạng</Label>
              <Input
                placeholder="Ví dụ: Vàng (Gold), Bạch Kim..."
                value={tierName}
                onChange={(e) => setTierName(e.target.value)}
                className="h-10 text-xs font-bold text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Số điểm tối thiểu để đạt hạng</Label>
              <Input
                type="number"
                value={tierMinPoints}
                onChange={(e) => setTierMinPoints(Number(e.target.value))}
                className="h-10 text-xs font-bold"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Hệ số nhân điểm (Multiplier)</Label>
              <div className="relative">
                <Input
                  type="number"
                  step="0.1"
                  value={tierMultiplier}
                  onChange={(e) => setTierMultiplier(Number(e.target.value))}
                  className="h-10 pr-10 text-xs font-bold text-primary"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-muted-foreground">
                  x
                </span>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              className="h-10 text-xs font-bold text-muted-foreground"
              onClick={() => setTierDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={handleSaveTier}
              className="h-10 text-xs font-bold bg-primary hover:bg-primary/95 text-primary-foreground"
              disabled={!tierName.trim()}
            >
              Lưu phân hạng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Campaign Dialog */}
      <Dialog open={campaignDialogOpen} onOpenChange={setCampaignDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-black">
              {editingCampaign ? "Sửa cấu hình chiến dịch" : "Khởi tạo chiến dịch ưu đãi"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Thiết lập hệ số nhân điểm trong kỳ nghỉ hoặc ngày hội mua sắm.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Tên chiến dịch</Label>
              <Input
                placeholder="Ví dụ: Ngày Hội Sinh Nhật ZPOS x2 Điểm"
                value={campName}
                onChange={(e) => setCampName(e.target.value)}
                className="h-10 text-xs font-bold text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Loại chiến dịch</Label>
              <Select
                value={campType}
                onValueChange={(val) => {
                  setCampType(val);
                }}
              >
                <SelectTrigger className="h-10 text-xs font-semibold">
                  <SelectValue placeholder="Chọn loại chiến dịch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="double_points" className="text-xs">Hệ số nhân điểm (Ví dụ x2, x3...)</SelectItem>
                  <SelectItem value="first_purchase" className="text-xs">Thưởng mua hàng lần đầu (First Purchase)</SelectItem>
                  <SelectItem value="birthday" className="text-xs">Thưởng sinh nhật khách hàng</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {campType === "double_points" ? (
              <div className="space-y-2 border bg-muted/20 p-3 rounded-lg">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Hệ số nhân điểm</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={campMultiplier}
                  onChange={(e) => setCampMultiplier(Number(e.target.value))}
                  className="h-9 font-bold text-xs text-primary"
                />
              </div>
            ) : (
              <div className="space-y-2 border bg-muted/20 p-3 rounded-lg">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Số điểm thưởng bổ sung</Label>
                <Input
                  type="number"
                  value={campBonusPoints}
                  onChange={(e) => setCampBonusPoints(Number(e.target.value))}
                  className="h-9 font-bold text-xs text-emerald-600"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3.5 border bg-muted/20 p-3 rounded-lg">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Ngày bắt đầu</Label>
                <Input
                  type="date"
                  value={campStartDate}
                  onChange={(e) => setCampStartDate(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Ngày kết thúc</Label>
                <Input
                  type="date"
                  value={campEndDate}
                  onChange={(e) => setCampEndDate(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-between border-t pt-3.5">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Trạng thái kích hoạt</Label>
              <Switch
                checked={campIsActive}
                onCheckedChange={setCampIsActive}
              />
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              className="h-10 text-xs font-bold text-muted-foreground"
              onClick={() => setCampaignDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={handleSaveCampaign}
              className="h-10 text-xs font-bold bg-primary hover:bg-primary/95 text-primary-foreground"
              disabled={!campName.trim()}
            >
              Lưu chiến dịch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
