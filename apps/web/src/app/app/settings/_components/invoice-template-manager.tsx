"use client";

import React, { useEffect, useState } from "react";
import {
  Save,
  Loader2,
  Printer,
  Eye,
  Layout,
  Type,
  Palette,
  Check,
  Sparkles,
  Smartphone,
  QrCode,
  RotateCcw,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const MOCK_ORDER = {
  order_number: "HD-9582-ZPOS",
  created_at: new Date().toISOString(),
  items: [
    { product_name: "Cà phê Sữa Đá Sài Gòn", quantity: 2, unit_price: 29000, total_price: 58000 },
    { product_name: "Bánh Mì Kẹp Thịt Nướng Đặc Biệt", quantity: 1, unit_price: 35000, total_price: 35000 },
    { product_name: "Trà Đào Cam Sả Hạt Chia (Size L)", quantity: 1, unit_price: 45000, total_price: 45000 },
  ],
  total_amount: 138000,
  payment_method: "transfer",
  customer: { name: "Nguyễn Văn A", phone: "0901234567" },
};

const FONT_FAMILIES = [
  { id: "font-sans", name: "Sans-serif (Hiện đại)", class: "font-sans" },
  { id: "font-mono", name: "Monospace (Máy in kim)", class: "font-mono" },
  { id: "font-serif", name: "Serif (Truyền thống)", class: "font-serif" },
];

const ACCENT_COLORS = [
  { name: "Đen Tuyển", hex: "#000000" },
  { name: "Xanh Navy", hex: "#1e3a8a" },
  { name: "Xanh Ngọc", hex: "#0d9488" },
  { name: "Đỏ Đô", hex: "#991b1b" },
  { name: "Cam Đất", hex: "#c2410c" },
];

export function InvoiceTemplateManager() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Global Settings state
  const [autoPrint, setAutoPrint] = useState(true);
  const [paperSize, setPaperSize] = useState("K80 (80mm)");
  const [printCopies, setPrintCopies] = useState(1);
  const [enableProvisional, setEnableProvisional] = useState(true);
  const [enableKitchen, setEnableKitchen] = useState(true);
  const [enableBar, setEnableBar] = useState(true);
  const [enableFinal, setEnableFinal] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setAutoPrint(localStorage.getItem("zpos_printer_auto") !== "false");
      setPaperSize(localStorage.getItem("zpos_printer_paper") || "K80 (80mm)");
      setPrintCopies(parseInt(localStorage.getItem("zpos_printer_copies") || "1"));
      setEnableProvisional(localStorage.getItem("zpos_invoice_enable_provisional") !== "false");
      setEnableKitchen(localStorage.getItem("zpos_invoice_enable_kitchen") !== "false");
      setEnableBar(localStorage.getItem("zpos_invoice_enable_bar") !== "false");
      setEnableFinal(localStorage.getItem("zpos_invoice_enable_final") !== "false");
    }
  }, []);

  const handleSaveGlobals = () => {
    setSaving(true);
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("zpos_printer_auto", String(autoPrint));
        localStorage.setItem("zpos_printer_paper", paperSize);
        localStorage.setItem("zpos_printer_copies", String(printCopies));
        localStorage.setItem("zpos_invoice_enable_provisional", String(enableProvisional));
        localStorage.setItem("zpos_invoice_enable_kitchen", String(enableKitchen));
        localStorage.setItem("zpos_invoice_enable_bar", String(enableBar));
        localStorage.setItem("zpos_invoice_enable_final", String(enableFinal));

        window.dispatchEvent(new Event("zpos_settings_updated"));
        window.dispatchEvent(new Event("zpos_printer_settings_updated"));
      }
      toast.success("Đã lưu cấu hình máy in thành công!");
    } catch (error) {
      toast.error("Không thể lưu cấu hình.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border shadow-md">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-primary" />
            Thiết lập máy in & Tùy chọn in
          </CardTitle>
          <CardDescription>Cài đặt cơ bản về in ấn hóa đơn khi giao dịch.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center justify-between p-3 border rounded-xl bg-muted/20">
              <div className="space-y-0.5">
                <Label className="text-sm font-semibold">Tự động in hóa đơn</Label>
                <p className="text-[10px] text-muted-foreground italic">In hóa đơn ngay khi hoàn tất thanh toán.</p>
              </div>
              <Switch checked={autoPrint} onCheckedChange={setAutoPrint} />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-xl bg-muted/20">
              <div className="space-y-0.5">
                <Label className="text-sm font-semibold">Cho phép in tạm tính</Label>
                <p className="text-[10px] text-muted-foreground italic">Hiển thị tùy chọn in tạm tính.</p>
              </div>
              <Switch checked={enableProvisional} onCheckedChange={setEnableProvisional} />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-xl bg-muted/20">
              <div className="space-y-0.5">
                <Label className="text-sm font-semibold">Cho phép in phiếu bếp</Label>
                <p className="text-[10px] text-muted-foreground italic">Hiển thị tùy chọn in bếp.</p>
              </div>
              <Switch checked={enableKitchen} onCheckedChange={setEnableKitchen} />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-xl bg-muted/20">
              <div className="space-y-0.5">
                <Label className="text-sm font-semibold">Cho phép in phiếu bar</Label>
                <p className="text-[10px] text-muted-foreground italic">Hiển thị tùy chọn in bar.</p>
              </div>
              <Switch checked={enableBar} onCheckedChange={setEnableBar} />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-xl bg-muted/20">
              <div className="space-y-0.5">
                <Label className="text-sm font-semibold">Cho phép in hóa đơn cuối</Label>
                <p className="text-[10px] text-muted-foreground italic">Hiển thị tùy chọn in hóa đơn cuối.</p>
              </div>
              <Switch checked={enableFinal} onCheckedChange={setEnableFinal} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="paper-size" className="font-semibold text-sm">
                Khổ giấy in
              </Label>
              <select
                id="paper-size"
                value={paperSize}
                onChange={(e) => setPaperSize(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs font-bold ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="K80 (80mm)">K80 (80mm) - In nhiệt thông dụng</option>
                <option value="K57 (57mm)">K57 (57mm) - In nhiệt mini</option>
                <option value="A4">Khổ A4 (Lớn) - In văn phòng</option>
                <option value="A5">Khổ A5 (Vừa) - In hóa đơn lẻ</option>
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="print-copies" className="font-semibold text-sm">
                Số liên in
              </Label>
              <Input
                id="print-copies"
                type="number"
                min="1"
                max="5"
                value={printCopies}
                onChange={(e) => setPrintCopies(Math.max(1, parseInt(e.target.value) || 1))}
                className="h-9 text-xs"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end border-t bg-muted/10 px-6 py-4">
          <Button size="sm" onClick={handleSaveGlobals} disabled={saving} className="font-bold">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Lưu cài đặt máy in
          </Button>
        </CardFooter>
      </Card>

      <Tabs defaultValue="payment" className="w-full">
        <TabsList className="w-full justify-start rounded-xl h-12 bg-muted/50 p-1 mb-6">
          <TabsTrigger
            value="payment"
            className="flex-1 rounded-lg font-bold data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
          >
            Mẫu: Hóa Đơn Thanh Toán
          </TabsTrigger>
          <TabsTrigger
            value="provisional"
            className="flex-1 rounded-lg font-bold data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
          >
            Mẫu: Hóa Đơn Tạm Tính
          </TabsTrigger>
        </TabsList>
        <TabsContent value="payment" className="mt-0 outline-none">
          <TemplateEditor prefix="zpos_invoice" defaultHeader="HÓA ĐƠN BÁN LẺ" paperSize={paperSize} />
        </TabsContent>
        <TabsContent value="provisional" className="mt-0 outline-none">
          <TemplateEditor prefix="zpos_prov_invoice" defaultHeader="HÓA ĐƠN TẠM TÍNH" paperSize={paperSize} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TemplateEditor({
  prefix,
  defaultHeader,
  paperSize,
}: {
  prefix: string;
  defaultHeader: string;
  paperSize: string;
}) {
  const [saving, setSaving] = useState(false);

  // Customization settings
  const [bizName, setBizName] = useState("ZPOS Retail Store");
  const [bizAddr, setBizAddr] = useState("123 Đường ABC, Quận 1, TP. Hồ Chí Minh");
  const [bizPhone, setBizPhone] = useState("0987654321");
  const [showLogo, setShowLogo] = useState(true);
  const [logoUrl, setLogoUrl] = useState("");
  const [showHeader, setShowHeader] = useState(true);
  const [headerText, setHeaderText] = useState(defaultHeader);
  const [showCustomer, setShowCustomer] = useState(true);
  const [showPayment, setShowPayment] = useState(true);
  const [showQRCode, setShowQRCode] = useState(true);
  const [showFooter, setShowFooter] = useState(true);
  const [footerText, setFooterText] = useState("Cảm ơn quý khách. Hẹn gặp lại!");
  const [accentColor, setAccentColor] = useState("#000000");
  const [fontFamily, setFontFamily] = useState("font-sans");
  const [showBranchName, setShowBranchName] = useState(true);
  const [showCashierName, setShowCashierName] = useState(true);

  // Bank details for QR
  const [bankId, setBankId] = useState("vcb");
  const [accountNo, setAccountNo] = useState("0071001234567");
  const [accountName, setAccountName] = useState("ZPOS RETAIL");
  const [memoTemplate, setMemoTemplate] = useState("ZPOS_");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setBizName(localStorage.getItem("zpos_biz_name") || "ZPOS Retail Store");
      setBizAddr(localStorage.getItem("zpos_biz_addr") || "123 Đường ABC, Quận 1, TP. Hồ Chí Minh");
      setLogoUrl(localStorage.getItem("zpos_biz_logo") || "");

      const getSetting = (key: string, isBool: boolean, defaultVal: any) => {
        const val = localStorage.getItem(`${prefix}_${key}`);
        if (val !== null) return isBool ? val !== "false" : val;

        // Fallback to main invoice settings if provisional setting is missing
        if (prefix === "zpos_prov_invoice") {
          const mainVal = localStorage.getItem(`zpos_invoice_${key}`);
          if (mainVal !== null) return isBool ? mainVal !== "false" : mainVal;
        }

        return defaultVal;
      };

      setBizPhone(getSetting("phone", false, "0987654321"));
      setShowLogo(getSetting("show_logo", true, true));
      setShowHeader(getSetting("show_header", true, true));
      setHeaderText(getSetting("header_text", false, defaultHeader));
      setShowCustomer(getSetting("show_customer", true, true));
      setShowPayment(getSetting("show_payment", true, true));
      setShowQRCode(getSetting("show_qrcode", true, prefix === "zpos_invoice"));
      setShowFooter(getSetting("show_footer", true, true));
      setFooterText(
        getSetting(
          "footer_text",
          false,
          localStorage.getItem("zpos_printer_footer") || "Cảm ơn quý khách. Hẹn gặp lại!",
        ),
      );
      setAccentColor(getSetting("accent_color", false, "#000000"));
      setFontFamily(getSetting("font_family", false, "font-sans"));
      setShowBranchName(getSetting("show_branch", true, true));
      setShowCashierName(getSetting("show_cashier", true, true));

      // Bank Info
      setBankId(localStorage.getItem("zpos_qr_bank_id") || "vcb");
      setAccountNo(localStorage.getItem("zpos_qr_account_no") || "0071001234567");
      setAccountName(localStorage.getItem("zpos_qr_account_name") || "ZPOS RETAIL");
      setMemoTemplate(localStorage.getItem("zpos_qr_memo_template") || "ZPOS_");
    }
  }, [prefix, defaultHeader]);

  const handleSave = () => {
    setSaving(true);
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(`${prefix}_phone`, bizPhone);
        localStorage.setItem(`${prefix}_show_logo`, String(showLogo));
        localStorage.setItem(`${prefix}_show_header`, String(showHeader));
        localStorage.setItem(`${prefix}_header_text`, headerText);
        localStorage.setItem(`${prefix}_show_customer`, String(showCustomer));
        localStorage.setItem(`${prefix}_show_payment`, String(showPayment));
        localStorage.setItem(`${prefix}_show_qrcode`, String(showQRCode));
        localStorage.setItem(`${prefix}_show_footer`, String(showFooter));
        localStorage.setItem(`${prefix}_footer_text`, footerText);
        localStorage.setItem(`${prefix}_accent_color`, accentColor);
        localStorage.setItem(`${prefix}_font_family`, fontFamily);
        localStorage.setItem(`${prefix}_show_branch`, String(showBranchName));
        localStorage.setItem(`${prefix}_show_cashier`, String(showCashierName));

        // Also update legacy ones if this is the payment invoice, so other places don't break
        if (prefix === "zpos_invoice") {
          localStorage.setItem("zpos_invoice_phone", bizPhone);
          localStorage.setItem("zpos_printer_footer", footerText);
        }

        window.dispatchEvent(new Event("zpos_settings_updated"));
        window.dispatchEvent(new Event("zpos_printer_settings_updated"));
      }
      toast.success(`Đã lưu thiết kế mẫu: ${defaultHeader}`);
    } catch (error) {
      toast.error("Không thể lưu cấu hình mẫu.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm("Bạn có chắc chắn muốn khôi phục thiết kế mặc định?")) {
      setShowLogo(true);
      setShowHeader(true);
      setHeaderText(defaultHeader);
      setShowCustomer(true);
      setShowPayment(true);
      setShowQRCode(prefix === "zpos_invoice"); // QR code on by default only for payment
      setShowFooter(true);
      setFooterText("Cảm ơn quý khách. Hẹn gặp lại!");
      setAccentColor("#000000");
      setFontFamily("font-sans");
      setShowBranchName(true);
      setShowCashierName(true);
      setBizPhone("0987654321");
      toast.success("Đã khôi phục thiết kế mặc định (Hãy bấm Lưu cấu hình)");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  };

  const getQrUrl = () => {
    if (!bankId || !accountNo) return "";
    return `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${MOCK_ORDER.total_amount}&addInfo=${memoTemplate}${MOCK_ORDER.order_number}`;
  };

  const isThermal = paperSize.includes("K80") || paperSize.includes("K57");
  const getPreviewContainerClass = () => {
    if (paperSize.includes("K57")) {
      return "w-[260px] min-h-[400px] border shadow-lg bg-white text-black p-3 text-[10px] mx-auto transition-all duration-300";
    }
    if (paperSize.includes("A4")) {
      return "w-[90%] max-w-[500px] min-h-[600px] border shadow-2xl bg-white text-black p-8 text-sm mx-auto transition-all duration-300";
    }
    if (paperSize.includes("A5")) {
      return "w-[90%] max-w-[420px] min-h-[500px] border shadow-xl bg-white text-black p-6 text-xs mx-auto transition-all duration-300";
    }
    return "w-[320px] min-h-[480px] border shadow-xl bg-white text-black p-4 text-[12px] mx-auto transition-all duration-300"; // K80
  };

  const selectedFontClass = FONT_FAMILIES.find((f) => f.id === fontFamily)?.class || "font-sans";

  return (
    <div className="grid gap-6 lg:grid-cols-12 items-start">
      <div className="lg:col-span-7 space-y-6">
        <Card className="border shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Layout className="w-5 h-5 text-violet-500" />
              Tùy chỉnh bố cục & thông tin
            </CardTitle>
            <CardDescription>Bật/tắt các thành phần hiển thị trên {defaultHeader.toLowerCase()}.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center justify-between p-3 border rounded-xl bg-muted/20">
                <div className="space-y-0.5">
                  <Label className="text-xs font-bold">Hiển thị Logo</Label>
                  <p className="text-[10px] text-muted-foreground">Sử dụng logo trong Info cửa hàng.</p>
                </div>
                <Switch checked={showLogo} onCheckedChange={setShowLogo} />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-xl bg-muted/20">
                <div className="space-y-0.5">
                  <Label className="text-xs font-bold">Hiển thị Tiêu đề</Label>
                  <p className="text-[10px] text-muted-foreground">Tiêu đề chính đầu hóa đơn.</p>
                </div>
                <Switch checked={showHeader} onCheckedChange={setShowHeader} />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-xl bg-muted/20">
                <div className="space-y-0.5">
                  <Label className="text-xs font-bold">Tên chi nhánh</Label>
                  <p className="text-[10px] text-muted-foreground">In tên chi nhánh thực hiện đơn.</p>
                </div>
                <Switch checked={showBranchName} onCheckedChange={setShowBranchName} />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-xl bg-muted/20">
                <div className="space-y-0.5">
                  <Label className="text-xs font-bold">Tên nhân viên thu ngân</Label>
                  <p className="text-[10px] text-muted-foreground">In người lập hóa đơn bán lẻ.</p>
                </div>
                <Switch checked={showCashierName} onCheckedChange={setShowCashierName} />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-xl bg-muted/20">
                <div className="space-y-0.5">
                  <Label className="text-xs font-bold">Thông tin khách hàng</Label>
                  <p className="text-[10px] text-muted-foreground">Tên, số điện thoại khách mua.</p>
                </div>
                <Switch checked={showCustomer} onCheckedChange={setShowCustomer} />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-xl bg-muted/20">
                <div className="space-y-0.5">
                  <Label className="text-xs font-bold">Phương thức thanh toán</Label>
                  <p className="text-[10px] text-muted-foreground">Tiền mặt/Chuyển khoản/Thẻ.</p>
                </div>
                <Switch checked={showPayment} onCheckedChange={setShowPayment} />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-xl bg-muted/20 sm:col-span-2">
                <div className="space-y-0.5">
                  <Label className="text-xs font-bold flex items-center gap-1">
                    <QrCode className="w-3.5 h-3.5 text-primary" />
                    QR thanh toán nhanh (VietQR)
                  </Label>
                  <p className="text-[10px] text-muted-foreground">
                    Hiển thị mã QR ngân hàng có chứa sẵn Số tiền đơn hàng để khách chuyển khoản quét nhanh.
                  </p>
                </div>
                <Switch checked={showQRCode} onCheckedChange={setShowQRCode} />
              </div>
            </div>

            <div className="grid gap-3 pt-2">
              <div className="grid gap-1">
                <Label htmlFor={`${prefix}-title`} className="text-xs font-bold">
                  Nội dung Tiêu đề
                </Label>
                <Input
                  id={`${prefix}-title`}
                  value={headerText}
                  onChange={(e) => setHeaderText(e.target.value)}
                  disabled={!showHeader}
                  className="h-8 text-xs font-semibold"
                />
              </div>

              <div className="grid gap-1">
                <Label htmlFor={`${prefix}-phone`} className="text-xs font-bold">
                  Số điện thoại liên hệ trên hóa đơn
                </Label>
                <Input
                  id={`${prefix}-phone`}
                  value={bizPhone}
                  onChange={(e) => setBizPhone(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="grid gap-1">
                <Label htmlFor={`${prefix}-footer`} className="text-xs font-bold">
                  Lời chào chân trang (Footer)
                </Label>
                <Textarea
                  id={`${prefix}-footer`}
                  value={footerText}
                  onChange={(e) => setFooterText(e.target.value)}
                  className="min-h-[60px] text-xs leading-normal"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-indigo-500" />
              Kiểu dáng & Màu sắc
            </CardTitle>
            <CardDescription>Áp dụng font chữ và màu sắc chủ đạo (cho khổ A4/A5).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs font-bold flex items-center gap-1">
                  <Type className="w-3.5 h-3.5" />
                  Font chữ sử dụng
                </Label>
                <div className="flex flex-col gap-1.5">
                  {FONT_FAMILIES.map((font) => (
                    <label
                      key={font.id}
                      className={`flex items-center justify-between p-2.5 border rounded-lg text-xs cursor-pointer hover:bg-muted/30 transition-colors ${fontFamily === font.id ? "border-primary bg-primary/5 font-semibold" : ""}`}
                    >
                      <span className={font.class}>{font.name}</span>
                      <input
                        type="radio"
                        name="font-family"
                        value={font.id}
                        checked={fontFamily === font.id}
                        onChange={() => setFontFamily(font.id)}
                        className="hidden"
                      />
                      {fontFamily === font.id && <Check className="w-4 h-4 text-primary" />}
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold flex items-center gap-1">
                  <Palette className="w-3.5 h-3.5" />
                  Màu chủ đạo (A4/A5)
                </Label>
                <div className="grid grid-cols-2 gap-1.5">
                  {ACCENT_COLORS.map((color) => (
                    <button
                      key={color.hex}
                      type="button"
                      onClick={() => setAccentColor(color.hex)}
                      className={`flex items-center gap-1.5 p-2 border rounded-lg text-left text-[11px] hover:bg-muted/30 transition-colors ${accentColor === color.hex ? "border-primary bg-primary/5 font-semibold" : ""}`}
                    >
                      <span
                        className="w-3 h-3 rounded-full border border-black/10 shrink-0"
                        style={{ backgroundColor: color.hex }}
                      />
                      <span className="truncate">{color.name}</span>
                    </button>
                  ))}
                  <div className="col-span-2 flex items-center gap-2 border p-1.5 rounded-lg">
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-7 h-7 rounded cursor-pointer border-none bg-transparent"
                    />
                    <span className="text-[10px] font-mono text-muted-foreground uppercase">{accentColor}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t bg-muted/10 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="gap-1 text-muted-foreground border-dashed"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Thiết kế mặc định
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving} className="font-bold">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Lưu thiết kế này
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="lg:col-span-5 space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <Eye className="w-4 h-4 text-primary" />
            Live Preview
          </h3>
          <span className="text-[10px] font-semibold bg-primary/10 text-primary py-0.5 px-2 rounded-full uppercase">
            {paperSize}
          </span>
        </div>

        <div className="w-full flex items-center justify-center p-4 bg-muted/40 dark:bg-muted/10 rounded-2xl border-2 border-dashed border-muted-foreground/15 min-h-[500px]">
          <div
            className={`${getPreviewContainerClass()} ${selectedFontClass} overflow-hidden shadow-2xl relative border-black/15`}
          >
            {showLogo && logoUrl && (
              <div className="flex justify-center mb-4">
                <img src={logoUrl} alt="Store Logo" className="w-12 h-12 object-contain rounded-md" />
              </div>
            )}
            {showLogo && !logoUrl && (
              <div className="flex justify-center mb-3">
                <div className="w-10 h-10 rounded border-2 border-dashed border-black/30 flex items-center justify-center text-black/40 text-[9px] font-bold uppercase">
                  Logo
                </div>
              </div>
            )}

            <div className="text-center space-y-1 mb-4 border-b border-black/10 pb-3">
              <h1
                className="font-black uppercase tracking-wider text-base"
                style={{ color: !isThermal ? accentColor : "#000000" }}
              >
                {bizName}
              </h1>
              <p className="font-bold opacity-80 leading-normal">{bizAddr}</p>
              {bizPhone && <p className="opacity-80">SĐT: {bizPhone}</p>}
              {showBranchName && (
                <p className="text-[10px] opacity-60 uppercase font-semibold">Chi nhánh: Chi nhánh Trung Tâm (Chính)</p>
              )}
            </div>

            {showHeader && (
              <div className="text-center mb-4">
                <h2
                  className="text-sm font-black uppercase tracking-widest"
                  style={{ color: !isThermal ? accentColor : "#000000" }}
                >
                  {headerText}
                </h2>
                <div className="flex justify-between items-center text-[9px] opacity-60 mt-1">
                  <span>
                    Mã đơn: <b className="text-black">{MOCK_ORDER.order_number}</b>
                  </span>
                  <span>
                    {new Date(MOCK_ORDER.created_at).toLocaleString("vi-VN", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
              </div>
            )}

            {showCustomer && (
              <div className="mb-4 text-[10px] border-b border-dashed border-black/10 pb-2 space-y-0.5">
                <div className="flex justify-between">
                  <span className="opacity-60">Khách hàng:</span>
                  <span className="font-bold">{MOCK_ORDER.customer.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-60">Số điện thoại:</span>
                  <span className="font-mono">{MOCK_ORDER.customer.phone}</span>
                </div>
                {showCashierName && (
                  <div className="flex justify-between">
                    <span className="opacity-60">Thu ngân:</span>
                    <span>Admin ZPOS</span>
                  </div>
                )}
              </div>
            )}

            <table className="w-full mb-4 text-[10px]">
              <thead>
                <tr className="border-b border-black text-left font-black uppercase text-[9px]">
                  <th className="py-1">Sản phẩm</th>
                  <th className="py-1 text-center">SL</th>
                  <th className="py-1 text-right">Đơn giá</th>
                  <th className="py-1 text-right">T.Tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {MOCK_ORDER.items.map((item, index) => (
                  <tr key={index} className="align-top">
                    <td className="py-1.5 font-bold pr-1 max-w-[100px] truncate leading-tight">{item.product_name}</td>
                    <td className="py-1.5 text-center">{item.quantity}</td>
                    <td className="py-1.5 text-right font-mono">{formatCurrency(item.unit_price)}</td>
                    <td className="py-1.5 text-right font-black font-mono">{formatCurrency(item.total_price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="space-y-1.5 border-t border-black pt-3 text-[10px]">
              <div className="flex justify-between font-black text-xs">
                <span>TỔNG THANH TOÁN:</span>
                <span style={{ color: !isThermal ? accentColor : "#000000" }}>
                  {formatCurrency(MOCK_ORDER.total_amount)}
                </span>
              </div>
              {showPayment && (
                <div className="flex justify-between italic opacity-85 text-[9px]">
                  <span>Phương thức:</span>
                  <span className="uppercase font-bold">Chuyển khoản (VietQR)</span>
                </div>
              )}
            </div>

            <div className="mt-6 text-center space-y-3">
              {showQRCode && bankId && accountNo && (
                <div className="flex flex-col items-center justify-center gap-1 animate-in fade-in duration-500">
                  <div className="p-1 border border-black/10 rounded-lg bg-white">
                    <img
                      src={getQrUrl()}
                      alt="VietQR Payment Code"
                      className="w-20 h-20 object-contain"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  </div>
                  <span className="text-[8px] font-bold opacity-50 uppercase flex items-center gap-0.5">
                    <Smartphone className="w-2.5 h-2.5" /> Quét mã để trả tiền
                  </span>
                </div>
              )}

              {showFooter && (
                <p className="text-[10px] font-black italic mt-2 leading-relaxed whitespace-pre-line text-black/80">
                  {footerText}
                </p>
              )}

              <div className="pt-2 border-t border-dashed border-black/10 text-[8px] opacity-40">
                <span>Powered by ZPOS • www.viz.vn</span>
              </div>
            </div>

            {!isThermal && (
              <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: accentColor }} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
