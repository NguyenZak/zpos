"use client";

import React from 'react';
import Link from 'next/link';
import { 
  Building2, 
  Store, 
  Printer, 
  ShieldCheck, 
  CreditCard,
  Image as ImageIcon,
  Save,
  Loader2,
  QrCode,
  Send,
  Truck,
  Search,
  FileText
} from 'lucide-react';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { posService } from '@/services/pos.service';
import { permissionService } from '@/services/permission.service';
import { BankAccountsManager } from './_components/bank-accounts-manager';
import { EInvoiceManager } from './_components/einvoice-manager';
import { ZaloManager } from './_components/zalo-manager';
import { DebtSettingsManager } from './_components/debt-settings-manager';
import { InvoiceTemplateManager } from './_components/invoice-template-manager';
import { Coins, MessageCircle } from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { convertToWebP } from "@/lib/image-utils";

const VIETNAMESE_BANKS = [
  { id: 'vcb', name: 'Vietcombank (VCB)' },
  { id: 'mb', name: 'MBBank (MB)' },
  { id: 'tcb', name: 'Techcombank (TCB)' },
  { id: 'acb', name: 'Ngân hàng ACB' },
  { id: 'ctg', name: 'VietinBank' },
  { id: 'bidv', name: 'BIDV' },
  { id: 'vpb', name: 'VPBank' },
  { id: 'tpb', name: 'TPBank' },
  { id: 'stb', name: 'Sacombank' },
  { id: 'shb', name: 'SHB' },
  { id: 'hdb', name: 'HDBank' },
  { id: 'vib', name: 'VIB' }
];

export default function SettingsPage() {
  const [loading, setLoading] = React.useState(false);
  const [bankList, setBankList] = React.useState<any[]>(VIETNAMESE_BANKS);
  const [activeTab, setActiveTab] = React.useState('business');
  const [isOwner, setIsOwner] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    permissionService.isCurrentUserOwner().then((value) => {
      if (!cancelled) setIsOwner(value);
    });
    return () => { cancelled = true; };
  }, []);

  // Brand / Store State
  const [bizName, setBizName] = React.useState('ZPOS Retail Store');
  const [bizTax, setBizTax] = React.useState('');
  const [bizAddr, setBizAddr] = React.useState('123 Đường ABC, Quận 1, TP. Hồ Chí Minh');
  const [logoUrl, setLogoUrl] = React.useState('');
  const [searchingTax, setSearchingTax] = React.useState(false);

  // VietQR Config State
  const [bankId, setBankId] = React.useState('vcb');
  const [accountNo, setAccountNo] = React.useState('0071001234567');
  const [accountName, setAccountName] = React.useState('ZPOS RETAIL');
  const [memoTemplate, setMemoTemplate] = React.useState('ZPOS_');

  // Printer Settings State
  const [autoPrint, setAutoPrint] = React.useState(true);
  const [paperSize, setPaperSize] = React.useState('K80 (80mm)');
  const [printCopies, setPrintCopies] = React.useState(1);
  const [footerText, setFooterText] = React.useState('Cảm ơn quý khách. Hẹn gặp lại!');

  // Security Settings State
  const [enable2FA, setEnable2FA] = React.useState(false);
  const [restrictIP, setRestrictIP] = React.useState(false);
  const [enableIdleScreen, setEnableIdleScreen] = React.useState(true);
  const [idleTimeoutMinutes, setIdleTimeoutMinutes] = React.useState(5);

  // Shipping Settings State
  const [shippingProvider, setShippingProvider] = React.useState('ghn');
  const [shippingToken, setShippingToken] = React.useState('');

  // Telegram Settings State
  const [telegramEnabled, setTelegramEnabled] = React.useState(false);
  const [telegramToken, setTelegramToken] = React.useState('');
  const [telegramChatId, setTelegramChatId] = React.useState('');
  const [telegramNotifyOrder, setTelegramNotifyOrder] = React.useState(true);
  const [telegramNotifyStock, setTelegramNotifyStock] = React.useState(true);
  const [testingTelegram, setTestingTelegram] = React.useState(false);

  // Branches Config State
  const [branches, setBranches] = React.useState<any[]>([]);
  const [branchDialogOpen, setBranchDialogOpen] = React.useState(false);
  const [editingBranch, setEditingBranch] = React.useState<any>(null);
  const [branchName, setBranchName] = React.useState('');
  const [branchAddress, setBranchAddress] = React.useState('');

  const loadBranchesList = async () => {
    try {
      const data = await posService.getBranches();
      setBranches(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenAddBranch = () => {
    setEditingBranch(null);
    setBranchName('');
    setBranchAddress('');
    setBranchDialogOpen(true);
  };

  const handleOpenEditBranch = (b: any) => {
    setEditingBranch(b);
    setBranchName(b.name);
    setBranchAddress(b.address || b.addr || '');
    setBranchDialogOpen(true);
  };

  const handleSaveBranch = async () => {
    if (!branchName.trim()) {
      toast.error("Tên chi nhánh không được để trống!");
      return;
    }
    setLoading(true);
    try {
      const branchPayload = {
        id: editingBranch?.id || undefined,
        name: branchName,
        address: branchAddress,
        status: editingBranch?.status || (branches.length === 0 ? "Chính" : "Phụ")
      };
      await posService.saveBranch(branchPayload);
      await loadBranchesList();
      
      // Fire local event to notify Sidebar switcher instantly!
      window.dispatchEvent(new Event("zpos_branches_updated"));
      
      toast.success(editingBranch ? "Cập nhật chi nhánh thành công!" : "Thêm chi nhánh mới thành công!");
      setBranchDialogOpen(false);
    } catch (e) {
      toast.error("Không thể lưu chi nhánh!");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBranch = async (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa chi nhánh này?")) {
      setLoading(true);
      try {
        await posService.deleteBranch(id);
        await loadBranchesList();
        
        // Fire local event to notify Sidebar switcher instantly!
        window.dispatchEvent(new Event("zpos_branches_updated"));
        
        toast.success("Đã xóa chi nhánh thành công!");
      } catch (e) {
        toast.error("Không thể xóa chi nhánh!");
      } finally {
        setLoading(false);
      }
    }
  };

  // Load configs from localStorage
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab && ['business', 'branch', 'payment', 'einvoice', 'printer', 'security', 'telegram', 'zalo', 'shipping', 'debt'].includes(tab)) {
        setActiveTab(tab);
      }

      setBizName(localStorage.getItem('zpos_biz_name') || 'ZPOS Retail Store');
      setBizTax(localStorage.getItem('zpos_biz_tax') || '');
      setBizAddr(localStorage.getItem('zpos_biz_addr') || '123 Đường ABC, Quận 1, TP. Hồ Chí Minh');
      setLogoUrl(localStorage.getItem('zpos_biz_logo') || '');

      setBankId(localStorage.getItem('zpos_qr_bank_id') || 'vcb');
      setAccountNo(localStorage.getItem('zpos_qr_account_no') || '0071001234567');
      setAccountName(localStorage.getItem('zpos_qr_account_name') || 'ZPOS RETAIL');
      setMemoTemplate(localStorage.getItem('zpos_qr_memo_template') || 'ZPOS_');

      setAutoPrint(localStorage.getItem('zpos_printer_auto') !== 'false');
      setPaperSize(localStorage.getItem('zpos_printer_paper') || 'K80 (80mm)');
      setPrintCopies(parseInt(localStorage.getItem('zpos_printer_copies') || '1'));
      setFooterText(localStorage.getItem('zpos_printer_footer') || 'Cảm ơn quý khách. Hẹn gặp lại!');

      setEnable2FA(localStorage.getItem('zpos_security_2fa') === 'true');
      setRestrictIP(localStorage.getItem('zpos_security_ip') === 'true');
      setEnableIdleScreen(localStorage.getItem('zpos_pos_idle_screen') !== 'false');
      setIdleTimeoutMinutes(parseInt(localStorage.getItem('zpos_pos_idle_timeout') || '5'));

      // Telegram Configurations
      setTelegramEnabled(localStorage.getItem('zpos_telegram_enabled') === 'true');
      setTelegramToken(localStorage.getItem('zpos_telegram_token') || '');
      setTelegramChatId(localStorage.getItem('zpos_telegram_chat_id') || '');
      setTelegramNotifyOrder(localStorage.getItem('zpos_telegram_notify_order') !== 'false');
      setTelegramNotifyStock(localStorage.getItem('zpos_telegram_notify_stock') !== 'false');
    }
    loadBranchesList();

    // Fetch live banks list from VietQR dynamic API
    const fetchBanks = async () => {
      try {
        const res = await fetch("https://api.vietqr.io/v2/banks");
        const json = await res.json();
        if (json && json.code === "00" && Array.isArray(json.data)) {
          const mapped = json.data.map((b: any) => ({
            id: (b.code || b.bin).toLowerCase(),
            name: `${b.shortName || b.short_name || b.code} - ${b.name}`
          }));
          setBankList(mapped);
        }
      } catch (e) {
        console.warn("Lỗi khi tải danh sách ngân hàng từ VietQR, sử dụng danh sách dự phòng", e);
      }
    };
    fetchBanks();
  }, []);

  const handleSave = () => {
    setLoading(true);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('zpos_biz_name', bizName);
      localStorage.setItem('zpos_biz_tax', bizTax);
      localStorage.setItem('zpos_biz_addr', bizAddr);
      localStorage.setItem('zpos_biz_logo', logoUrl);

      localStorage.setItem('zpos_qr_bank_id', bankId);
      localStorage.setItem('zpos_qr_account_no', accountNo);
      localStorage.setItem('zpos_qr_account_name', accountName);
      localStorage.setItem('zpos_qr_memo_template', memoTemplate);

      localStorage.setItem('zpos_printer_auto', String(autoPrint));
      localStorage.setItem('zpos_printer_paper', paperSize);
      localStorage.setItem('zpos_printer_copies', String(printCopies));
      localStorage.setItem('zpos_printer_footer', footerText);

      localStorage.setItem('zpos_security_2fa', String(enable2FA));
      localStorage.setItem('zpos_security_ip', String(restrictIP));
      localStorage.setItem('zpos_pos_idle_screen', String(enableIdleScreen));
      localStorage.setItem('zpos_pos_idle_timeout', String(idleTimeoutMinutes));

      // Telegram Configurations
      localStorage.setItem('zpos_telegram_enabled', String(telegramEnabled));
      localStorage.setItem('zpos_telegram_token', telegramToken);
      localStorage.setItem('zpos_telegram_chat_id', telegramChatId);
      localStorage.setItem('zpos_telegram_notify_order', String(telegramNotifyOrder));
      localStorage.setItem('zpos_telegram_notify_stock', String(telegramNotifyStock));

      // Save to Supabase database asynchronously
      posService.saveTelegramSettings({
        enabled: telegramEnabled,
        token: telegramToken,
        chat_id: telegramChatId,
        notify_order: telegramNotifyOrder,
        notify_stock: telegramNotifyStock
      }).catch(err => {
        console.warn("Could not save Telegram settings to database:", err);
      });

      window.dispatchEvent(new Event("zpos_settings_updated"));
    }

    setTimeout(() => {
      setLoading(false);
      toast.success("Đã lưu cấu hình cài đặt thành công!");
    }, 800);
  };

  const handleTestTelegram = async () => {
    if (!telegramToken || !telegramChatId) {
      toast.error("Vui lòng điền đủ Bot Token và Chat ID trước khi test!");
      return;
    }
    
    setTestingTelegram(true);
    try {
      const url = `https://api.telegram.org/bot${telegramToken}/sendMessage`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: telegramChatId,
          text: `🔔 <b>ZPOS TELEGRAM TEST</b>\n\nChúc mừng! Kết nối từ hệ thống ZPOS đến nhóm Telegram của bạn đã thành công rực rỡ! 🎉\n\n⚡️ <i>Hệ thống đã sẵn sàng gửi thông báo!</i>`,
          parse_mode: 'HTML',
        }),
      });
      
      const json = await res.json();
      if (json.ok) {
        toast.success("Gửi tin nhắn test thành công! Hãy kiểm tra Telegram.");
      } else {
        toast.error(`Telegram báo lỗi: ${json.description || 'Không xác định'}`);
      }
    } catch (e) {
      toast.error("Lỗi mạng khi kết nối tới Telegram API!");
    } finally {
      setTestingTelegram(false);
    }
  };

  const logoInputRef = React.useRef<HTMLInputElement>(null);

  const handleLogoChange = () => {
    logoInputRef.current?.click();
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn tệp tin hình ảnh hợp lệ!");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Đang tối ưu hóa ảnh và chuyển sang WebP...");
    
    try {
      // 1. Convert to WebP client-side using built-in HTML5 Canvas
      try {
        const webpFile = await convertToWebP(file, 0.85);
        console.log(`[WebP Optimizer] Dung lượng gốc: ${(file.size / 1024).toFixed(2)} KB -> WebP tối ưu: ${(webpFile.size / 1024).toFixed(2)} KB (Giảm ${(((file.size - webpFile.size) / file.size) * 100).toFixed(1)}% dung lượng)`);
        file = webpFile;
      } catch (convErr) {
        console.warn("Lỗi chuyển đổi WebP, tiếp tục dùng ảnh gốc", convErr);
      }

      // Check final compressed size
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Kích thước ảnh sau tối ưu vẫn vượt quá 5MB!", { id: toastId });
        setLoading(false);
        return;
      }

      toast.loading("Đang tải ảnh WebP siêu nhẹ lên Cloudinary...", { id: toastId });

      // 2. Upload to secure endpoint
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Không thể upload ảnh!");
      }

      setLogoUrl(json.url);
      toast.success("Tải logo WebP lên Cloudinary thành công!", { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Tải ảnh thất bại! Hãy thử lại.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleLookupTax = async () => {
    const cleanTax = bizTax.trim().replace(/[^0-9-]/g, '');
    if (!cleanTax) {
      toast.error("Vui lòng nhập mã số thuế hợp lệ!");
      return;
    }

    setSearchingTax(true);
    const toastId = toast.loading("Đang tra cứu thông tin mã số thuế doanh nghiệp...");
    try {
      const res = await fetch(`https://api.vietqr.io/v2/business/${cleanTax}`);
      if (!res.ok) {
        throw new Error("Không thể kết nối đến hệ thống tra cứu.");
      }
      const json = await res.json();
      
      if (json && json.code === "00" && json.data) {
        const { name, address } = json.data;
        if (name) setBizName(name);
        if (address) setBizAddr(address);
        toast.success(`Tra cứu thành công! Đã tự động điền thông tin doanh nghiệp.`, { id: toastId });
      } else {
        toast.error(json.desc || "Không tìm thấy thông tin doanh nghiệp cho mã số thuế này.", { id: toastId });
      }
    } catch (error) {
      console.error("Lỗi tra cứu MST:", error);
      toast.error("Không thể kết nối tới dịch vụ tra cứu. Vui lòng thử lại.", { id: toastId });
    } finally {
      setSearchingTax(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Cài đặt hệ thống</h1>
        <p className="text-muted-foreground text-sm">Quản lý cấu hình cửa hàng, thanh toán và in ấn hóa đơn.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="w-full overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-1">
          <TabsList className="bg-muted/50 p-1 mb-6 inline-flex min-w-full md:flex w-max md:w-full flex-nowrap md:flex-wrap h-10 items-center justify-start gap-1 rounded-xl border border-muted/20">
            <TabsTrigger value="business" className="gap-2 shrink-0">
              <Building2 className="w-4 h-4" />
              Thông tin cửa hàng
            </TabsTrigger>
            <TabsTrigger value="branch" className="gap-2 shrink-0">
              <Store className="w-4 h-4" />
              Chi nhánh
            </TabsTrigger>
            <TabsTrigger value="payment" className="gap-2 shrink-0">
              <QrCode className="w-4 h-4 text-violet-500" />
              Mã QR thanh toán
            </TabsTrigger>
            <TabsTrigger value="einvoice" className="gap-2 shrink-0">
              <FileText className="w-4 h-4 text-violet-500" />
              Hoá đơn điện tử
            </TabsTrigger>
            <TabsTrigger value="printer" className="gap-2 shrink-0">
              <Printer className="w-4 h-4 text-primary" />
              Template Hoá đơn
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2 shrink-0">
              <ShieldCheck className="w-4 h-4" />
              Bảo mật
            </TabsTrigger>
            <TabsTrigger value="telegram" className="gap-2 shrink-0">
              <Send className="w-4 h-4 text-sky-500" />
              Thông báo Telegram
            </TabsTrigger>
            <TabsTrigger value="zalo" className="gap-2 shrink-0">
              <MessageCircle className="w-4 h-4 text-violet-500" />
              Zalo OA / ZNS
            </TabsTrigger>
            <TabsTrigger value="shipping" className="gap-2 shrink-0">
              <Truck className="w-4 h-4 text-orange-500" />
              Vận chuyển
            </TabsTrigger>
            <TabsTrigger value="debt" className="gap-2 shrink-0">
              <Coins className="w-4 h-4 text-amber-600" />
              Công nợ
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="business" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Nhận diện thương hiệu</CardTitle>
              <CardDescription>Cập nhật logo và thông tin cơ bản của doanh nghiệp.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <input 
                type="file" 
                ref={logoInputRef} 
                onChange={handleLogoUpload} 
                className="hidden" 
                accept="image/*" 
              />
              <div className="flex items-center gap-6">
                <div 
                  onClick={handleLogoChange}
                  className="w-24 h-24 rounded-lg bg-muted flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/20 text-muted-foreground hover:bg-muted/80 cursor-pointer transition-colors overflow-hidden relative"
                >
                  {logoUrl ? (
                    <img src={logoUrl} alt="Store Logo" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <ImageIcon className="w-8 h-8 mb-1" />
                      <span className="text-[10px] font-bold uppercase">Tải Logo</span>
                    </>
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <h4 className="text-sm font-bold">Logo cửa hàng</h4>
                  <p className="text-xs text-muted-foreground italic">Khuyên dùng định dạng PNG hoặc SVG, kích thước tối ưu 512x512px.</p>
                  <Button variant="outline" size="sm" className="mt-2 h-8" onClick={handleLogoChange}>Thay đổi</Button>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="biz-name">Tên cửa hàng / Doanh nghiệp</Label>
                  <Input 
                    id="biz-name" 
                    value={bizName} 
                    onChange={(e) => setBizName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="biz-tax" className="font-semibold text-foreground flex items-center gap-1.5">
                    Mã số thuế
                  </Label>
                  <div className="relative flex items-center">
                    <Input 
                      id="biz-tax" 
                      placeholder="Nhập mã số thuế (e.g. 0316794479)..." 
                      value={bizTax} 
                      onChange={(e) => setBizTax(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleLookupTax();
                        }
                      }}
                      className="pr-24 font-mono font-bold transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                    />
                    <Button 
                      type="button"
                      size="sm" 
                      onClick={handleLookupTax}
                      disabled={searchingTax || !bizTax.trim()}
                      className="absolute right-1 h-8 px-3 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm rounded-md transition-all duration-200 flex items-center gap-1"
                    >
                      {searchingTax ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Search className="w-3 h-3" />
                      )}
                      <span>Tra cứu</span>
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed italic">
                    💡 Nhập Mã số thuế và bấm <strong>Tra cứu</strong> (hoặc nhấn <strong>Enter</strong>) để tự động lấy tên doanh nghiệp và địa chỉ từ Tổng cục Thuế.
                  </p>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="biz-addr">Địa chỉ trụ sở chính</Label>
                <Textarea 
                  id="biz-addr" 
                  value={bizAddr} 
                  onChange={(e) => setBizAddr(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter className="border-t bg-muted/20 px-6 py-4 flex justify-end">
              <Button size="sm" onClick={handleSave} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Lưu cấu hình
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="branch" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Danh sách chi nhánh</CardTitle>
                <CardDescription>Quản lý các địa điểm kinh doanh của bạn.</CardDescription>
              </div>
              <Button size="sm" onClick={handleOpenAddBranch}>Thêm chi nhánh</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {branches.map((b, i) => (
                  <div key={b.id || i} className="flex items-center justify-between p-4 border rounded-xl bg-card hover:bg-muted/10 transition-colors">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{b.name}</span>
                        <Badge variant={b.status === "Chính" ? "default" : "secondary"} className="text-[10px]">{b.status || "Phụ"}</Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">{b.address || b.addr || "Chưa cập nhật địa chỉ"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleOpenEditBranch(b)}>Chỉnh sửa</Button>
                      {branches.length > 1 && (
                        <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => handleDeleteBranch(b.id)}>Xóa</Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* VietQR Dynamic Checkout — multi-account, server-side */}
        <TabsContent value="payment" className="space-y-4 animate-in fade-in duration-300">
          <BankAccountsManager />
        </TabsContent>

        {/* eInvoice — Hóa đơn điện tử theo TT 78/2021 */}
        <TabsContent value="einvoice" className="space-y-4 animate-in fade-in duration-300">
          <EInvoiceManager />
        </TabsContent>

        <TabsContent value="printer" className="space-y-4">
          <InvoiceTemplateManager />
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bảo mật & Truy cập</CardTitle>
              <CardDescription>Cấu hình xác thực hai lớp và giới hạn IP.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Xác thực 2 lớp (2FA)</Label>
                  <p className="text-xs text-muted-foreground">Tăng cường bảo mật cho tài khoản admin.</p>
                </div>
                <Switch 
                  checked={enable2FA}
                  onCheckedChange={(val) => {
                    setEnable2FA(val);
                    if (val) {
                      toast.success("Đã bật yêu cầu xác thực 2FA. Vui lòng hoàn tất cấu hình OTP.");
                    } else {
                      toast.warning("Đã tắt xác thực 2 lớp.");
                    }
                  }}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Giới hạn IP truy cập POS</Label>
                  <p className="text-xs text-muted-foreground italic">Chỉ cho phép bán hàng từ địa chỉ IP của cửa hàng.</p>
                </div>
                <Switch 
                  checked={restrictIP}
                  onCheckedChange={(val) => {
                    setRestrictIP(val);
                    if (val) {
                      toast.success("Đã kích hoạt chế độ giới hạn IP tĩnh truy cập POS!");
                    } else {
                      toast.warning("Đã hủy giới hạn IP.");
                    }
                  }}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Màn hình chờ POS (Screensaver)</Label>
                  <p className="text-xs text-muted-foreground italic">Tự động hiển thị màn hình chờ khi POS không được thao tác.</p>
                </div>
                <div className="flex items-center gap-4">
                  {enableIdleScreen && (
                    <select 
                      className="h-8 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      value={idleTimeoutMinutes}
                      onChange={(e) => setIdleTimeoutMinutes(Number(e.target.value))}
                    >
                      <option value={1}>Sau 1 phút</option>
                      <option value={3}>Sau 3 phút</option>
                      <option value={5}>Sau 5 phút</option>
                      <option value={15}>Sau 15 phút</option>
                      <option value={30}>Sau 30 phút</option>
                    </select>
                  )}
                  <Switch 
                    checked={enableIdleScreen}
                    onCheckedChange={(val) => {
                      setEnableIdleScreen(val);
                    }}
                  />
                </div>
              </div>
              <div className="border-t pt-6 space-y-4">
                <div className="flex flex-col gap-1">
                  <h4 className="text-sm font-bold flex items-center gap-1.5 text-foreground">
                    <ShieldCheck className="w-4.5 h-4.5 text-primary" />
                    Phân quyền vai trò & Quyền hạn nhân sự (RBAC)
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {isOwner
                      ? "Thiết lập ma trận quyền hạn cho các vai trò mặc định (Owner, Manager, Cashier...) và cấu hình các vai trò tùy chỉnh."
                      : "Chỉ chủ doanh nghiệp (Owner) mới có thể truy cập trang Phân quyền. Liên hệ Owner nếu cần thay đổi vai trò hoặc quyền hạn."}
                  </p>
                </div>
                {isOwner ? (
                  <Button variant="outline" size="sm" className="h-9 gap-1.5 border-primary text-primary hover:bg-primary/5 hover:text-primary" asChild>
                    <Link href="/settings/roles">
                      Thiết lập vai trò & phân quyền
                    </Link>
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" disabled className="h-9 gap-1.5">
                    Bạn không có quyền truy cập
                  </Button>
                )}
              </div>
            </CardContent>
            <CardFooter className="border-t bg-muted/20 px-6 py-4 flex justify-end">
              <Button size="sm" onClick={handleSave} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Lưu cấu hình
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="telegram" className="space-y-4">
          <Card className="border shadow-sm overflow-hidden bg-card">
            <CardHeader className="bg-muted/30 pb-4 border-b">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Send className="w-5 h-5 text-sky-500 animate-bounce" />
                Cấu hình Thông báo Telegram
              </CardTitle>
              <CardDescription>
                Nhận thông báo tự động về nhóm hoặc kênh Telegram khi có đơn hàng mới phát sinh hoặc khi hàng hóa trong kho sắp hết.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <div className="space-y-0.5">
                  <Label className="text-base font-bold">Kích hoạt thông báo Telegram</Label>
                  <p className="text-xs text-muted-foreground italic">Bật để hệ thống tự động đẩy tin nhắn về Telegram.</p>
                </div>
                <Switch 
                  checked={telegramEnabled} 
                  onCheckedChange={setTelegramEnabled} 
                />
              </div>

              {telegramEnabled && (
                <div className="space-y-6 animate-in slide-in-from-top-4 duration-300">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="tel-token" className="font-bold">Telegram Bot Token</Label>
                      <Input
                        id="tel-token"
                        placeholder="Ví dụ: 5678901234:AAFgH-j3K..."
                        value={telegramToken}
                        onChange={(e) => setTelegramToken(e.target.value)}
                        className="font-mono text-xs border-sky-500/10 focus-visible:ring-sky-500"
                      />
                      <p className="text-[10px] text-muted-foreground leading-normal">
                        Lấy từ <b>@BotFather</b> khi bạn tạo bot mới bằng lệnh <code>/newbot</code>.
                      </p>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="tel-chat" className="font-bold">Telegram Chat ID (Group/Channel)</Label>
                      <Input
                        id="tel-chat"
                        placeholder="Ví dụ: -100123456789 hoặc 123456789"
                        value={telegramChatId}
                        onChange={(e) => setTelegramChatId(e.target.value)}
                        className="font-mono text-xs border-sky-500/10 focus-visible:ring-sky-500"
                      />
                      <p className="text-[10px] text-muted-foreground leading-normal">
                        ID của cuộc hội thoại, Nhóm hoặc Kênh nhận thông báo. Bạn có thể lấy bằng cách add bot <b>@chatIDrobot</b> vào nhóm.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 border-t pt-4">
                    <h4 className="text-sm font-bold text-foreground">Loại thông báo muốn nhận</h4>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="flex items-center justify-between p-3 border rounded-xl bg-muted/20">
                        <div className="space-y-0.5">
                          <Label className="font-semibold text-sm">Đơn hàng mới hoàn tất</Label>
                          <p className="text-[10px] text-muted-foreground">Nhận tin chi tiết mã đơn, số tiền, sản phẩm, thanh toán.</p>
                        </div>
                        <Switch 
                          checked={telegramNotifyOrder} 
                          onCheckedChange={setTelegramNotifyOrder} 
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-xl bg-muted/20">
                        <div className="space-y-0.5">
                          <Label className="font-semibold text-sm">Cảnh báo tồn kho thấp</Label>
                          <p className="text-[10px] text-muted-foreground">Nhận tin khi một sản phẩm bán đi khiến lượng tồn dưới 5.</p>
                        </div>
                        <Switch 
                          checked={telegramNotifyStock} 
                          onCheckedChange={setTelegramNotifyStock} 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-sky-500/5 dark:bg-sky-500/10 p-4 rounded-xl border border-sky-500/20 text-xs leading-relaxed text-muted-foreground space-y-1.5 shadow-sm">
                    <p className="font-bold text-sky-700 dark:text-sky-400">
                      💡 Hướng dẫn nhanh liên kết Telegram:
                    </p>
                    <p>1. Chat với <b>@BotFather</b> trên Telegram, gõ lệnh <code>/newbot</code> để tạo Bot riêng, đặt tên và sao chép **Bot Token** dán vào ô phía trên.</p>
                    <p>2. Tạo Nhóm (Group) của bạn và thêm Bot vừa tạo vào Nhóm.</p>
                    <p>3. Thêm Bot <b>@chatIDrobot</b> vào Nhóm để lấy **Chat ID** (có dấu trừ phía trước, ví dụ: <code>-100...</code>), sao chép dán vào ô trên.</p>
                    <p>4. Bấm nút **Gửi tin nhắn thử nghiệm** phía dưới để test kết nối!</p>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t bg-muted/20 px-6 py-4 flex justify-between items-center">
              <div>
                {telegramEnabled && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleTestTelegram} 
                    disabled={testingTelegram}
                    className="border-sky-500 text-sky-500 hover:bg-sky-500/5 font-bold"
                  >
                    {testingTelegram && <Loader2 className="mr-2 h-4 w-4 animate-spin text-sky-500" />}
                    Gửi tin nhắn thử nghiệm
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave} disabled={loading} className="bg-sky-600 hover:bg-sky-700 text-white font-bold">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  Lưu cấu hình
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="zalo" className="space-y-4 animate-in fade-in duration-300">
          <ZaloManager />
        </TabsContent>

        <TabsContent value="shipping" className="space-y-4">
          <Card className="border shadow-sm overflow-hidden bg-card">
            <CardHeader className="bg-muted/30 pb-4 border-b">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Truck className="w-5 h-5 text-orange-500 animate-pulse" />
                Kết nối đơn vị vận chuyển
              </CardTitle>
              <CardDescription>
                Cấu hình API Key của hãng vận chuyển (GHN, GHTK, Viettel Post...) để tự động báo giá ship và đẩy đơn.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="shipping-provider" className="font-bold">Nhà cung cấp</Label>
                  <select
                    id="shipping-provider"
                    value={shippingProvider}
                    onChange={(e) => setShippingProvider(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 font-bold"
                  >
                    <option value="ghn">Giao Hàng Nhanh (GHN)</option>
                    <option value="ghtk">Giao Hàng Tiết Kiệm (GHTK)</option>
                    <option value="viettel_post">Viettel Post</option>
                    <option value="ahamove">AhaMove</option>
                    <option value="lalamove">Lalamove</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="shipping-token" className="font-bold">API Token / Client ID</Label>
                  <Input
                    id="shipping-token"
                    placeholder="Nhập API Token..."
                    value={shippingToken}
                    onChange={(e) => setShippingToken(e.target.value)}
                    className="font-mono text-xs border-orange-500/10 focus-visible:ring-orange-500"
                  />
                </div>
              </div>
              <div className="bg-orange-500/5 p-4 rounded-xl border border-orange-500/20 text-xs leading-relaxed text-muted-foreground space-y-1.5 shadow-sm">
                <p className="font-bold text-orange-700">💡 Hướng dẫn lấy Token:</p>
                <p>- <b>GHN</b>: Đăng nhập hệ thống 5sao.ghn.vn, vào mục Thông tin tài khoản để lấy API Token.</p>
                <p>- <b>GHTK</b>: Đăng nhập khachhang.giaohangtietkiem.vn, vào mục Sửa thông tin cửa hàng để lấy API Token.</p>
              </div>
            </CardContent>
            <CardFooter className="border-t bg-muted/20 px-6 py-4 flex justify-end">
              <Button size="sm" onClick={handleSave} disabled={loading} className="bg-orange-600 hover:bg-orange-700 text-white font-bold">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Lưu cấu hình vận chuyển
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="debt" className="space-y-4 animate-in fade-in duration-300">
          <DebtSettingsManager />
        </TabsContent>
      </Tabs>

      <Dialog open={branchDialogOpen} onOpenChange={setBranchDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {editingBranch ? "Chỉnh sửa chi nhánh" : "Thêm chi nhánh mới"}
            </DialogTitle>
            <DialogDescription>
              Nhập các thông tin chi tiết cho chi nhánh kinh doanh của bạn.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="b-name" className="font-bold text-foreground">Tên chi nhánh</Label>
              <Input
                id="b-name"
                placeholder="Ví dụ: Chi nhánh Quận 1, Zpos Café..."
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                className="font-bold"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="b-address" className="font-bold text-foreground">Địa chỉ</Label>
              <Textarea
                id="b-address"
                placeholder="Nhập địa chỉ đầy đủ..."
                value={branchAddress}
                onChange={(e) => setBranchAddress(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBranchDialogOpen(false)} disabled={loading} className="font-bold">
              Hủy
            </Button>
            <Button onClick={handleSaveBranch} disabled={loading} className="font-bold">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Lưu lại
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Badge({ children, className, variant = "default" }: { children: React.ReactNode, className?: string, variant?: "default" | "secondary" }) {
  return (
    <span className={`px-2 py-0.5 rounded-full font-bold uppercase ${variant === 'secondary' ? 'bg-muted text-muted-foreground' : 'bg-primary text-primary-foreground'} ${className}`}>
      {children}
    </span>
  );
}
