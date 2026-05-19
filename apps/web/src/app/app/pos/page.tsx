"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  ShoppingCart, 
  User, 
  Trash2, 
  Plus, 
  Minus,
  Barcode,
  Keyboard,
  Receipt,
  RotateCcw,
  Tag,
  CreditCard,
  Banknote,
  QrCode,
  CheckCircle2,
  Printer,
  History,
  X,
  SearchIcon,
  UserPlus,
  Copy,
  Check,
  Sparkles,
  Coins,
  ArrowRight,
  Pencil,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { posService, getTenantSlug } from '@/services/pos.service';
import {
  vietQRService,
  buildVietQRImageUrl,
  generateReferenceCode,
  type BankAccount,
} from '@/services/vietqr.service';
import { einvoiceService } from '@/services/einvoice.service';
import { zaloService } from '@/services/zalo.service';
import { FileText, WifiOff } from 'lucide-react';
import { cacheProducts, getCachedProducts, cacheCustomers, getCachedCustomers } from '@/lib/offline/offline-db';
import { debtService, type CreditAccount } from '@/services/debt.service';
import { Coins as CoinsIcon } from 'lucide-react';
import { queueOfflineOrder, flushOfflineQueue } from '@/lib/offline/sync';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { OfflineStatus } from '@/components/offline-status';
import { MobilePOS } from '../_components/mobile/mobile-pos';
import { PrintInvoice } from './_components/print-invoice';
import { BarcodeScannerDialog } from '@/components/barcode-scanner-dialog';

// Fire-and-forget Zalo ZNS send. Always swallows errors so checkout never blocks.
async function fireZalo(event: 'order_paid' | 'invoice_issued', opts: {
  phone?: string;
  orderId?: string;
  invoiceId?: string;
  customerId?: string;
  data?: Record<string, any>;
}) {
  if (!opts.phone) return;
  try {
    await zaloService.sendZNS({
      phone: opts.phone,
      templateEvent: event,
      templateData: opts.data || {},
      orderId: opts.orderId,
      invoiceId: opts.invoiceId,
      customerId: opts.customerId,
    });
  } catch (e: any) {
    // 412 not_configured / 404 template_not_found → skip silently.
    if (!/zalo_not_configured|template_not_found/.test(String(e?.message))) {
      console.warn('Zalo ZNS send failed:', e?.message);
    }
  }
}


// --- MOCK DATA --- (Fallback)
const MOCK_PRODUCTS = [
  { id: 1, name: 'Apple iPhone 15 Pro', price: 25000000, category: 'Điện thoại', stock: 10, image: 'https://images.unsplash.com/photo-1696446701796-da61225697cc?q=80&w=300&auto=format&fit=crop', barcode: '123456789' },
  { id: 2, name: 'Samsung Galaxy S24 Ultra', price: 30000000, category: 'Điện thoại', stock: 5, image: 'https://images.unsplash.com/photo-1707230181313-2d937072719d?q=80&w=300&auto=format&fit=crop', barcode: '987654321' },
  { id: 3, name: 'MacBook Air M3', price: 28000000, category: 'Máy tính', stock: 8, image: 'https://images.unsplash.com/photo-1611186871348-b1ec696e523b?q=80&w=300&auto=format&fit=crop', barcode: '111222333' },
  { id: 4, name: 'Sony WH-1000XM5', price: 8500000, category: 'Phụ kiện', stock: 15, image: 'https://images.unsplash.com/photo-1644794106607-ca927d3c9071?q=80&w=300&auto=format&fit=crop', barcode: '444555666' },
  { id: 5, name: 'Logitech MX Master 3S', price: 2500000, category: 'Phụ kiện', stock: 20, image: 'https://images.unsplash.com/photo-1636114673156-052a83459fc1?q=80&w=300&auto=format&fit=crop', barcode: '777888999' },
  { id: 6, name: 'Apple Watch Ultra 2', price: 19000000, category: 'Đồng hồ', stock: 12, image: 'https://images.unsplash.com/photo-1695663363303-398328108502?q=80&w=300&auto=format&fit=crop', barcode: '000111222' },
];

const MOCK_CUSTOMERS = [
  { id: '1', name: 'Nguyễn Văn A', phone: '0901234567', email: 'vana@gmail.com', points: 1250 },
  { id: '2', name: 'Trần Thị B', phone: '0912345678', email: 'thib@gmail.com', points: 800 },
  { id: '3', name: 'Lê Văn C', phone: '0923456789', email: 'vanc@gmail.com', points: 2100 },
];



export default function POSPage() {
  const [isMobile, setIsMobile] = useState(false);
  const isOnline = useOnlineStatus();

  // When the browser comes back online, opportunistically flush queued orders
  // and refresh the catalog cache. The OfflineStatus pill also auto-flushes;
  // this runs even if the pill isn't visible (e.g. legacy layouts).
  useEffect(() => {
    if (!isOnline) return;
    flushOfflineQueue().catch(() => {});
  }, [isOnline]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px)");
    setIsMobile(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>(['Tất cả']);
  const [loading, setLoading] = useState(true);

  // Tabs State
  interface OrderTab {
    id: string;
    cart: any[];
    selectedCustomer: any | null;
    orderId: string | number;
    title: string;
    discountType?: 'percentage' | 'fixed';
    discountValue?: number;
  }
  
  const [tabs, setTabs] = useState<OrderTab[]>([
    { id: '1', cart: [], selectedCustomer: null, orderId: `ORD-${Date.now().toString().slice(-6)}`, title: 'Đơn 1', discountType: 'fixed', discountValue: 0 }
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('1');

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];
  const cart = activeTab.cart;
  const selectedCustomer = activeTab.selectedCustomer;
  const orderId = activeTab.orderId;

  const discountType = activeTab.discountType || 'fixed';
  const discountValue = activeTab.discountValue || 0;

  const setDiscountType = (type: 'percentage' | 'fixed') => {
    setTabs(prev => prev.map(tab => {
      if (tab.id === activeTabId) {
        return { ...tab, discountType: type };
      }
      return tab;
    }));
  };

  const setDiscountValue = (val: number) => {
    setTabs(prev => prev.map(tab => {
      if (tab.id === activeTabId) {
        return { ...tab, discountValue: val };
      }
      return tab;
    }));
  };

  const setCart = (newCart: any[] | ((prev: any[]) => any[])) => {
    setTabs(prev => prev.map(tab => {
      if (tab.id === activeTabId) {
        return { ...tab, cart: typeof newCart === 'function' ? newCart(tab.cart) : newCart };
      }
      return tab;
    }));
  };

  const setSelectedCustomer = (customer: any | null) => {
    setTabs(prev => prev.map(tab => {
      if (tab.id === activeTabId) {
        return { ...tab, selectedCustomer: customer };
      }
      return tab;
    }));
  };

  const setOrderId = (id: string | number | ((prev: string | number) => string | number)) => {
    setTabs(prev => prev.map(tab => {
      if (tab.id === activeTabId) {
        return { ...tab, orderId: typeof id === 'function' ? id(tab.orderId) : id };
      }
      return tab;
    }));
  };

  const addNewTab = () => {
    const newId = Date.now().toString();
    const newTitle = `Đơn ${tabs.length + 1}`;
    setTabs(prev => [...prev, {
      id: newId,
      cart: [],
      selectedCustomer: null,
      orderId: `ORD-${Date.now().toString().slice(-6)}`,
      title: newTitle,
      discountType: 'fixed',
      discountValue: 0
    }]);
    setActiveTabId(newId);
  };

  const removeTab = (id: string) => {
    if (tabs.length === 1) return;
    setTabs(prev => {
      const newTabs = prev.filter(t => t.id !== id);
      if (activeTabId === id) {
        setActiveTabId(newTabs[newTabs.length - 1].id);
      }
      return newTabs;
    });
  };

  const [isMounted, setIsMounted] = useState(false);

  // Load draft tabs from localStorage on client-side mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTabs = localStorage.getItem('zpos_draft_tabs');
      const savedActiveTabId = localStorage.getItem('zpos_active_tab_id');
      if (savedTabs) {
        try {
          const parsed = JSON.parse(savedTabs);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setTabs(parsed);
          }
        } catch (e) {
          console.error("Error loading draft tabs from localStorage:", e);
        }
      }
      if (savedActiveTabId) {
        setActiveTabId(savedActiveTabId);
      }
      setIsMounted(true);
    }
  }, []);

  // Save tabs to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined' && isMounted) {
      localStorage.setItem('zpos_draft_tabs', JSON.stringify(tabs));
    }
  }, [tabs, isMounted]);

  // Save activeTabId to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && isMounted) {
      localStorage.setItem('zpos_active_tab_id', activeTabId);
    }
  }, [activeTabId, isMounted]);

  const [searchQuery, setSearchQuery] = useState('');
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [tempPrice, setTempPrice] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState('Tất cả');
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer' | 'debt'>('cash');
  const [creditAccount, setCreditAccount] = useState<CreditAccount | null>(null);
  const [debtDueDays, setDebtDueDays] = useState<number>(30);
  const [successOpen, setSuccessOpen] = useState(false);
  const [lastOrder, setLastOrder] = useState<any>(null);

  // Load VietQR Settings dynamically from localStorage (or defaults)
  const [qrSettings, setQrSettings] = useState({
    bankId: 'vcb',
    accountNo: '0071001234567',
    accountName: 'ZPOS RETAIL',
    memoTemplate: 'ZPOS_'
  });

  const [receivedAmount, setReceivedAmount] = useState<number>(0);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // eInvoice: issuance state for the success modal
  const [invoiceIssuing, setInvoiceIssuing] = useState(false);
  const [issuedInvoice, setIssuedInvoice] = useState<any>(null);

  // Debt mode: load credit account whenever the customer changes during checkout
  useEffect(() => {
    if (!selectedCustomer?.id) {
      setCreditAccount(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const acct = await debtService.getCreditAccount(selectedCustomer.id);
        if (!cancelled) {
          setCreditAccount(acct);
          if (acct?.due_days) setDebtDueDays(acct.due_days);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => { cancelled = true; };
  }, [selectedCustomer?.id, checkoutOpen]);

  // VietQR Pro: server-backed bank account + pending payment reference + realtime listener
  const [defaultBank, setDefaultBank] = useState<BankAccount | null>(null);
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [transferStatus, setTransferStatus] = useState<'idle' | 'waiting' | 'received'>('idle');
  const transferUnsubRef = useRef<null | (() => void)>(null);

  // Load server-side default bank account when checkout opens.
  // Falls back to legacy localStorage values so prior config keeps working.
  useEffect(() => {
    if (!checkoutOpen) return;
    let cancelled = false;
    (async () => {
      try {
        const bank = await vietQRService.getDefaultBankAccount();
        if (cancelled) return;
        if (bank) {
          setDefaultBank(bank);
          setQrSettings({
            bankId: bank.bank_id,
            accountNo: bank.account_no,
            accountName: bank.account_name,
            memoTemplate: (bank.memo_prefix || 'ZPOS') + ' '
          });
          return;
        }
      } catch (e) {
        console.warn('Could not load default bank account:', e);
      }
      // Legacy fallback
      if (typeof window !== 'undefined') {
        const savedBankId = localStorage.getItem('zpos_qr_bank_id') || 'vcb';
        const savedAccountNo = localStorage.getItem('zpos_qr_account_no') || '0071001234567';
        const savedAccountName = localStorage.getItem('zpos_qr_account_name') || 'ZPOS RETAIL';
        const savedMemoTemplate = localStorage.getItem('zpos_qr_memo_template') || 'ZPOS_';
        if (!cancelled) {
          setDefaultBank(null);
          setQrSettings({
            bankId: savedBankId,
            accountNo: savedAccountNo,
            accountName: savedAccountName,
            memoTemplate: savedMemoTemplate,
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [checkoutOpen]);

  // Reset transfer flow whenever the dialog closes or method changes
  useEffect(() => {
    if (!checkoutOpen || paymentMethod !== 'transfer') {
      if (transferUnsubRef.current) {
        transferUnsubRef.current();
        transferUnsubRef.current = null;
      }
      setTransferStatus('idle');
      setPendingOrderId(null);
      setPaymentReference('');
      return;
    }
    // Generate a fresh reference on each entry into transfer mode
    const prefix = defaultBank?.memo_prefix || 'ZPOS';
    setPaymentReference(generateReferenceCode(prefix));
  }, [checkoutOpen, paymentMethod, defaultBank?.memo_prefix]);

  const handleCopy = (text: string, field: string) => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success(`Đã sao chép ${field}!`);
      setTimeout(() => setCopiedField(null), 1500);
    }
  };
  
  // Customer State
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [customerQuery, setCustomerQuery] = useState('');

  // Add Customer States
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');
  const [newCustomerAddress, setNewCustomerAddress] = useState('');
  const [isSavingCustomer, setIsSavingCustomer] = useState(false);

  const handleStartAddCustomer = () => {
    const query = customerQuery.trim();
    if (/^\d+$/.test(query) && query.length >= 9 && query.length <= 11) {
      setNewCustomerPhone(query);
      setNewCustomerName('');
    } else {
      setNewCustomerName(query);
      setNewCustomerPhone('');
    }
    setNewCustomerEmail('');
    setNewCustomerAddress('');
    setIsAddingCustomer(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName.trim()) {
      toast.error("Vui lòng nhập tên khách hàng");
      return;
    }
    
    setIsSavingCustomer(true);
    try {
      const newCustomer = await posService.createCustomer({
        name: newCustomerName.trim(),
        phone: newCustomerPhone.trim() || null,
        email: newCustomerEmail.trim() || null,
        address: newCustomerAddress.trim() || null
      });
      
      setCustomers(prev => [newCustomer, ...prev]);
      setSelectedCustomer(newCustomer);
      
      setCustomerSearchOpen(false);
      setIsAddingCustomer(false);
      setCustomerQuery('');
      toast.success("Thêm khách hàng mới thành công!");
    } catch (err) {
      console.error("Failed to save customer:", err);
      toast.error("Không thể lưu thông tin khách hàng");
    } finally {
      setIsSavingCustomer(false);
    }
  };

  // Barcode State
  const barcodeRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);

  // Fetch Products & derive categories from them.
  // Strategy: try network first, write fresh data to IndexedDB, fall back to
  // the cache when offline so POS stays operational without connectivity.
  useEffect(() => {
    const applyProducts = (rows: any[]) => {
      const mapped = rows.map((p: any) => ({
        ...p,
        category: p.category?.name || p.category || 'Chưa phân loại',
      }));
      setProducts(mapped);
      const uniqueCats = Array.from(new Set(mapped.map((p: any) => p.category))) as string[];
      setCategories(['Tất cả', ...uniqueCats.sort()]);
    };

    const loadData = async () => {
      try {
        const productsData = await posService.getProducts();
        if (productsData && productsData.length > 0) {
          applyProducts(productsData);
          // Warm the offline cache for next time the cashier loses Wi-Fi.
          cacheProducts(productsData).catch(() => {});
        } else {
          // Empty server response → fall back to cached or mock
          const cached = await getCachedProducts();
          if (cached.length > 0) {
            applyProducts(cached);
          } else if (getTenantSlug() === 'app') {
            setProducts(MOCK_PRODUCTS);
            setCategories(['Tất cả', ...Array.from(new Set(MOCK_PRODUCTS.map(p => p.category)))]);
          } else {
            setProducts([]);
          }
        }
      } catch (e) {
        console.warn('Server unreachable — falling back to offline product cache:', (e as any)?.message);
        const cached = await getCachedProducts();
        if (cached.length > 0) {
          applyProducts(cached);
          toast.info('Đang dùng dữ liệu offline. Một số sản phẩm có thể cũ.');
        } else if (getTenantSlug() === 'app') {
          setProducts(MOCK_PRODUCTS);
          setCategories(['Tất cả', ...Array.from(new Set(MOCK_PRODUCTS.map(p => p.category)))]);
        } else {
          setProducts([]);
        }
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Customer Search Logic — server-first with offline cache fallback.
  useEffect(() => {
    const searchCustomers = async () => {
      try {
        const data = await posService.getCustomers(customerQuery);
        setCustomers(data || []);
        // Cache the *full* customer list — we re-pull it whenever the query
        // is empty (the "browse all" case).
        if (!customerQuery.trim() && Array.isArray(data) && data.length > 0) {
          cacheCustomers(data).catch(() => {});
        }
      } catch (e) {
        console.warn('Customer search failed, using offline cache:', (e as any)?.message);
        const cached = await getCachedCustomers();
        const q = customerQuery.trim().toLowerCase();
        const filtered = q
          ? cached.filter(
              (c: any) =>
                (c.name || '').toLowerCase().includes(q) ||
                (c.phone || '').includes(q) ||
                (c.email || '').toLowerCase().includes(q),
            )
          : cached;
        setCustomers(filtered.slice(0, 50));
      }
    };
    const timer = setTimeout(searchCustomers, 300);
    return () => clearTimeout(timer);
  }, [customerQuery]);

  // Keyboard Shortcuts & Barcode Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const currentTime = Date.now();
      const diff = currentTime - lastKeyTimeRef.current;
      lastKeyTimeRef.current = currentTime;

      // Simple Barcode Logic: Rapid key presses
      if (diff < 30 && e.key.length === 1) {
        barcodeRef.current += e.key;
        if (barcodeRef.current.length > 5) {
          // Debounce and search
          clearTimeout((window as any).barcodeTimeout);
          (window as any).barcodeTimeout = setTimeout(() => {
            const product = products.find(p => p.barcode === barcodeRef.current);
            if (product) {
              addToCart(product);
              toast.success(`Đã quét: ${product.name}`);
            }
            barcodeRef.current = '';
          }, 100);
        }
        return;
      } else if (diff > 100) {
        barcodeRef.current = ''; // Reset if slow
      }

      if (e.key === 'F1') {
        e.preventDefault();
        document.getElementById('product-search')?.focus();
      }
      if (e.key === 'F10' && cart.length > 0) {
        e.preventDefault();
        setCheckoutOpen(true);
      }
      if (e.key === 'F2') {
        e.preventDefault();
        setCustomerSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, products]);

  const addToCart = (product: any) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { ...product, quantity: 1, originalPrice: product.price }]);
    }
  };

  const removeFromCart = (id: number) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const updatePrice = (id: number, newPrice: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        return { ...item, price: newPrice };
      }
      return item;
    }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + " Đ";
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const discount = discountType === 'percentage'
    ? Math.round((subtotal * discountValue) / 100)
    : discountValue;
  const tax = 0;
  const total = Math.max(0, subtotal - discount + tax);

  useEffect(() => {
    if (checkoutOpen) {
      setReceivedAmount(total);
    }
  }, [checkoutOpen, total]);

  // Reset the POS state + close dialogs after a successful checkout.
  const finishCheckoutSuccess = (snapshot: any) => {
    setLastOrder(snapshot);
    setProducts(prevProducts =>
      prevProducts.map(p => {
        const cartItem = cart.find(c => c.id === p.id);
        if (cartItem) {
          return { ...p, stock: Math.max(0, (p.stock || 0) - cartItem.quantity) };
        }
        return p;
      })
    );

    // Auto-issue eInvoice is handled by the dedicated useEffect on `successOpen`
    // → see handleIssueInvoice + the effect a bit further down.

    // Fire Zalo ZNS for order_paid (best-effort, doesn't block UI)
    fireZalo('order_paid', {
      phone: snapshot?.customer?.phone,
      orderId: snapshot?.dbOrderId,
      customerId: snapshot?.customer?.id,
      data: {
        customer_name: snapshot?.customer?.name || 'Quý khách',
        order_no: snapshot?.orderId,
        total: new Intl.NumberFormat('vi-VN').format(snapshot?.total || 0),
        payment_method: snapshot?.paymentMethod,
      },
    });

    setCart([]);
    setSelectedCustomer(null);
    setReceivedAmount(0);
    setOrderId(`ORD-${Date.now().toString().slice(-6)}`);
    setDiscountValue(0);
    setDiscountType('fixed');
    if (transferUnsubRef.current) {
      transferUnsubRef.current();
      transferUnsubRef.current = null;
    }
    setTransferStatus('idle');
    setPendingOrderId(null);
    setCheckoutOpen(false);
    setSuccessOpen(true);
  };

  const handleCheckout = async () => {
    // For transfer mode: 2-stage flow (start → confirm).
    // If we're not yet waiting, start the pending order and listen for webhook.
    if (paymentMethod === 'transfer' && transferStatus === 'idle') {
      return handleStartTransfer();
    }
    // If we're already waiting, the primary CTA acts as "manual confirm".
    if (paymentMethod === 'transfer' && transferStatus === 'waiting' && pendingOrderId) {
      return handleManualConfirmTransfer();
    }

    // Debt mode requires a customer (the ledger is keyed by customer_id).
    const isDebt = paymentMethod === 'debt';
    if (isDebt && !selectedCustomer?.id) {
      toast.error('Phải chọn khách hàng khi bán ghi nợ');
      return;
    }

    // Cash / card / debt / fallback: complete the order immediately.
    // Hoisted out of `try` so the catch block can reach it when queueing
    // a fallback offline order after a network error.
    const orderData: any = {
      organization_id: '00000000-0000-0000-0000-000000000000',
      branch_id: '00000000-0000-0000-0000-000000000000',
      customer_id: selectedCustomer?.id || null,
      order_number: orderId.toString().startsWith('ORD-') ? orderId.toString() : `ORD-${orderId}`,
      total_amount: total,
      discount_amount: discount,
      payment_method: paymentMethod,
      payment_status: isDebt ? 'debt' : 'paid',
      payment_confirmed_at: isDebt ? null : new Date().toISOString(),
      payment_amount_received: isDebt ? 0 : total,
      status: 'completed'
    };

    setIsProcessing(true);
    try {
      // Offline mode: queue the order to IndexedDB and continue as if it succeeded.
      // The cashier has already taken cash — we MUST not block them on the network.
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        await queueOfflineOrder({ orderData, items: cart });
        finishCheckoutSuccess({
          cart: [...cart],
          subtotal,
          discount,
          total,
          orderId: orderData.order_number,
          dbOrderId: undefined,
          paymentMethod,
          customer: selectedCustomer,
          createdAt: new Date().toISOString(),
          isOffline: true,
        });
        toast.success("Đơn đã lưu offline — sẽ tự đồng bộ khi có mạng");
        return;
      }

      const createdOrder = await posService.createOrder(orderData, cart);

      // Debt mode: record the charge in the customer credit ledger so the
      // order shows up as a receivable on the customer / debtors screens.
      // RPC failure here doesn't roll back the order — surface a warning
      // so an admin can reconcile manually.
      if (isDebt && createdOrder?.id) {
        try {
          const debtRes = await debtService.chargeOrderAsDebt(createdOrder.id, debtDueDays);
          if (!debtRes.ok) {
            console.error('chargeOrderAsDebt failed:', debtRes.error);
            toast.warning('Đơn đã tạo nhưng chưa ghi nợ', {
              description: debtRes.error || 'Vui lòng kiểm tra lại trong mục Công nợ',
              duration: 8000,
            });
          } else if (debtRes.over_limit) {
            toast.warning('Khách hàng đã vượt hạn mức công nợ');
          }
        } catch (debtErr: any) {
          console.error('chargeOrderAsDebt threw:', debtErr);
          toast.warning('Đơn đã tạo nhưng chưa ghi nợ', {
            description: debtErr?.message || 'Lỗi không xác định',
            duration: 8000,
          });
        }
      }

      finishCheckoutSuccess({
        cart: [...cart],
        subtotal,
        discount,
        total,
        orderId: orderData.order_number,
        dbOrderId: createdOrder?.id,
        paymentMethod,
        customer: selectedCustomer,
        createdAt: new Date().toISOString()
      });
      toast.success(isDebt ? "Đã ghi nợ đơn hàng!" : "Thanh toán thành công!");
    } catch (e: any) {
      // Supabase errors often have non-enumerable fields — destructure explicitly
      // so console.error prints actionable info instead of "Checkout failed: {}".
      const errInfo = {
        message: e?.message,
        code: e?.code,
        details: e?.details,
        hint: e?.hint,
        status: e?.status,
        name: e?.name,
        raw: e,
      };
      console.error('Checkout failed:', errInfo);

      // Show the real Supabase error in the toast so the cashier knows what happened.
      const userMsg =
        e?.message ||
        e?.details ||
        e?.hint ||
        (typeof e === 'string' ? e : '') ||
        'Lỗi không xác định khi lưu đơn';

      const msg = String(e?.message || '').toLowerCase();
      const isNetwork = msg.includes('network') || msg.includes('fetch') || msg.includes('timeout');
      if (isNetwork) {
        try {
          await queueOfflineOrder({ orderData, items: cart });
          finishCheckoutSuccess({
            cart: [...cart],
            subtotal,
            discount,
            total,
            orderId: orderData.order_number,
            paymentMethod,
            customer: selectedCustomer,
            createdAt: new Date().toISOString(),
            isOffline: true,
          });
          toast.success("Mất mạng — đơn đã xếp hàng đợi & sẽ tự sync");
          return;
        } catch (qe: any) {
          console.error('Queue fallback failed:', { message: qe?.message, raw: qe });
        }
      }
      setCheckoutOpen(false);
      toast.error('Không thể lưu đơn hàng', {
        description: userMsg,
        duration: 8000,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Create a pending order and start listening for the bank webhook to confirm it.
  const handleStartTransfer = async () => {
    setIsProcessing(true);
    try {
      const orderNumber = orderId.toString().startsWith('ORD-')
        ? orderId.toString()
        : `ORD-${orderId}`;

      const order = await posService.createOrder(
        {
          organization_id: '00000000-0000-0000-0000-000000000000',
          branch_id: '00000000-0000-0000-0000-000000000000',
          customer_id: selectedCustomer?.id || null,
          order_number: orderNumber,
          total_amount: total,
          discount_amount: discount,
          payment_method: 'transfer',
          payment_status: 'pending',
          payment_reference: paymentReference,
          bank_account_id: defaultBank?.id || null,
          status: 'pending',
        } as any,
        cart,
      );

      if (!order?.id) {
        toast.error("Không thể tạo đơn hàng chờ thanh toán");
        return;
      }

      setPendingOrderId(order.id);
      setTransferStatus('waiting');

      // Make sure the reference is persisted even if createOrder dropped the field
      try {
        if (defaultBank?.id) {
          await vietQRService.attachPendingPayment({
            orderId: order.id,
            bankAccountId: defaultBank.id,
            referenceCode: paymentReference,
          });
        }
      } catch (e) {
        console.warn("attachPendingPayment failed:", e);
      }

      // Realtime: listen for the order being flipped to "paid" by the webhook RPC
      transferUnsubRef.current = vietQRService.subscribeOrderPayment(order.id, () => {
        toast.success("Khách đã chuyển khoản thành công!");
        finishCheckoutSuccess({
          cart: [...cart],
          subtotal,
          discount,
          total,
          orderId: orderNumber,
          dbOrderId: order.id,
          paymentMethod: 'transfer',
          customer: selectedCustomer,
          createdAt: new Date().toISOString(),
          paymentReference,
        });
      });

      toast.info("Đang chờ khách chuyển khoản — mã: " + paymentReference);
    } catch (e) {
      console.error("Failed to start transfer:", e);
      toast.error("Không thể bắt đầu thanh toán chuyển khoản");
    } finally {
      setIsProcessing(false);
    }
  };

  // Cashier-side fallback: manually mark the pending transfer order as paid.
  const handleManualConfirmTransfer = async () => {
    if (!pendingOrderId) return;
    setIsProcessing(true);
    try {
      await vietQRService.confirmOrderPaymentManually(pendingOrderId, total);
      toast.success("Đã xác nhận nhận tiền thủ công");
      finishCheckoutSuccess({
        cart: [...cart],
        subtotal,
        discount,
        total,
        orderId: orderId.toString().startsWith('ORD-') ? orderId.toString() : `ORD-${orderId}`,
        dbOrderId: pendingOrderId,
        paymentMethod: 'transfer',
        customer: selectedCustomer,
        createdAt: new Date().toISOString(),
        paymentReference,
      });
    } catch (e) {
      console.error("manual confirm failed:", e);
      toast.error("Xác nhận thủ công thất bại");
    } finally {
      setIsProcessing(false);
    }
  };

  // Issue an eInvoice for the last completed order (manual or auto).
  const handleIssueInvoice = async (orderSnapshot?: any) => {
    const snap = orderSnapshot || lastOrder;
    if (!snap) return;
    if (invoiceIssuing || issuedInvoice) return;

    setInvoiceIssuing(true);
    try {
      const items = (snap.cart || []).map((c: any) => ({
        name: c.name,
        quantity: c.quantity,
        unit_price: c.price,
        total: c.price * c.quantity,
      }));
      const res = await einvoiceService.issueInvoice({
        orderId: snap.dbOrderId,
        buyer: {
          name: snap.customer?.name || 'Khách lẻ',
          tax_code: snap.customer?.tax_code,
          phone: snap.customer?.phone,
          email: snap.customer?.email,
          address: snap.customer?.address,
        },
        items,
      });
      if (!res.ok) {
        toast.error(res.error || 'Phát hành hoá đơn thất bại');
        return;
      }
      setIssuedInvoice(res.invoice);
      toast.success(
        `Đã phát hành HĐ ${res.invoice?.invoice_series || ''}-${res.invoice?.invoice_no || ''}`,
      );

      // Fire Zalo ZNS for invoice_issued — sends lookup code so customer can verify on Tổng cục Thuế
      fireZalo('invoice_issued', {
        phone: snap?.customer?.phone,
        orderId: snap?.dbOrderId,
        invoiceId: res.invoice?.id,
        customerId: snap?.customer?.id,
        data: {
          customer_name: snap?.customer?.name || 'Quý khách',
          invoice_no: `${res.invoice?.invoice_series || ''}/${res.invoice?.invoice_no || ''}`,
          lookup_code: res.invoice?.provider_lookup_code || '',
          total: new Intl.NumberFormat('vi-VN').format(res.invoice?.total_amount || 0),
          pdf_url: res.invoice?.provider_pdf_url || '',
        },
      });
    } catch (e: any) {
      toast.error(`Lỗi: ${e?.message || 'Không rõ'}`);
    } finally {
      setInvoiceIssuing(false);
    }
  };

  // Auto-issue when a fresh order opens the success modal AND the default
  // provider has auto_issue_on_payment enabled.
  // Also fires the order_paid Zalo ZNS notification if a template exists.
  useEffect(() => {
    if (!successOpen || !lastOrder || issuedInvoice) return;
    let cancelled = false;
    (async () => {
      try {
        const cfg = await einvoiceService.getDefaultConfig();
        if (cancelled) return;
        if (cfg?.auto_issue_on_payment) {
          handleIssueInvoice(lastOrder);
        }
      } catch (e) {
        console.warn('auto-issue check failed:', e);
      }
      // Fire-and-forget Zalo ZNS — server will skip if not configured.
      fireZalo('order_paid', {
        phone: lastOrder?.customer?.phone,
        orderId: lastOrder?.dbOrderId,
        customerId: lastOrder?.customer?.id,
        data: {
          order_number: lastOrder?.orderId || '',
          total: new Intl.NumberFormat('vi-VN').format(Number(lastOrder?.total || 0)),
          customer_name: lastOrder?.customer?.name || 'Quý khách',
        },
      });
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [successOpen, lastOrder]);

  // Reset invoice state whenever the success modal closes
  useEffect(() => {
    if (!successOpen) {
      setIssuedInvoice(null);
      setInvoiceIssuing(false);
    }
  }, [successOpen]);

  // Cancel a started transfer (the order row stays in DB with payment_status='pending').
  const handleCancelTransfer = () => {
    if (transferUnsubRef.current) {
      transferUnsubRef.current();
      transferUnsubRef.current = null;
    }
    setTransferStatus('idle');
    setPendingOrderId(null);
    toast.info("Đã huỷ chờ thanh toán. Đơn hàng vẫn ở trạng thái 'Chờ thanh toán'.");
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.barcode?.includes(searchQuery);
    const matchesCategory = activeCategory === 'Tất cả' || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredCustomers = customers;

  if (isMobile) {
    return (
      <MobilePOS
        products={products}
        customers={customers}
        loading={loading}
      />
    );
  }

  return (
    <>
      <div className="flex h-[calc(100vh-80px)] gap-4 overflow-hidden print:hidden">

      {/* Left Column: Product Selection */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl leading-none tracking-tight">Bán hàng</h1>
            <p className="text-muted-foreground text-sm">Ghi nhận giao dịch và quản lý đơn hàng tại quầy.</p>
          </div>
          <div className="flex items-center gap-2">
            <OfflineStatus
              onSyncComplete={(res) => {
                if (res.ok > 0) {
                  // Force-refresh products to reflect just-synced stock deltas
                  posService.getProducts?.().then((rows) => {
                    if (Array.isArray(rows) && rows.length) {
                      setProducts(rows.map((p: any) => ({ ...p, category: p.category?.name || p.category || 'Chưa phân loại' })));
                    }
                  }).catch(() => {});
                }
              }}
            />
            <Button variant="outline" size="sm" className="gap-2">
              <History className="w-4 h-4" />
              Lịch sử
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 text-purple-400 border-purple-500/20 hover:border-purple-500/40 hover:from-purple-500/20 hover:to-indigo-500/20" 
              onClick={() => setScannerOpen(true)}
            >
              <Barcode className="w-4 h-4 text-purple-500" />
              Quét Camera
            </Button>
          </div>
        </div>

        {/* Offline banner — shown when navigator.onLine === false */}
        {!isOnline && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2 flex items-center gap-2 text-xs animate-in slide-in-from-top-2 duration-300">
            <WifiOff className="h-4 w-4 text-red-600 shrink-0" />
            <p className="text-red-700 dark:text-red-400">
              <b>Đang offline</b> — POS vẫn hoạt động, đơn hàng sẽ được lưu vào hàng đợi và tự đồng bộ khi có mạng.
            </p>
          </div>
        )}


        {/* Search & Tool Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input 
            id="product-search"
            placeholder="Tìm sản phẩm, mã vạch (F1)..." 
            className="pl-10 h-10 bg-muted/50 border-none shadow-none focus-visible:ring-1"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Categories Tabs */}
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
          <TabsList className="bg-transparent h-auto p-0 flex flex-wrap gap-2 justify-start overflow-visible">
            {categories.map(cat => (
              <TabsTrigger 
                key={cat} 
                value={cat}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-4 py-1.5 border h-9 text-sm font-medium transition-all"
              >
                {cat}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Product Grid */}
        <ScrollArea className="flex-1">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-4 pr-4">
            {filteredProducts.map(product => (
              <Card 
                key={product.id} 
                className="cursor-pointer hover:border-primary transition-all overflow-hidden group shadow-sm border"
                onClick={() => addToCart(product)}
              >
                <div className="aspect-square bg-muted relative overflow-hidden">
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <Badge className="absolute top-2 right-2 border-none text-[10px] uppercase">
                    Còn {product.stock}
                  </Badge>
                </div>
                <CardContent className="p-3 space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold">{product.category}</p>
                  <p className="font-semibold text-sm line-clamp-1">{product.name}</p>
                  <p className="text-base font-bold text-primary">{formatCurrency(product.price)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Right Column: Order Panel */}
      <div className="w-[420px] h-full flex flex-col bg-card border rounded-xl shadow-lg overflow-hidden relative">
        {/* Tabs */}
        <div className="max-h-[140px] overflow-y-auto scrollbar-none border-b bg-muted/30">
          <div className="flex flex-wrap items-center gap-1 p-2">
            {tabs.map((tab, idx) => (
              <div 
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className={`flex items-center shrink-0 gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold cursor-pointer whitespace-nowrap transition-colors ${activeTabId === tab.id ? 'bg-background shadow-sm border text-foreground' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`}
              >
                {tab.title}
                {tabs.length > 1 && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); removeTab(tab.id); }}
                    className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-muted-foreground/20 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 px-2 ml-1 shrink-0 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50"
              onClick={addNewTab}
            >
              <Plus className="w-4 h-4 mr-1" />
              Mới
            </Button>
          </div>
        </div>

        {/* Cart Header */}
        <div className="p-6 border-b flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg leading-none">Đơn hàng</h2>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-1">
                Mã số: {orderId ? (orderId.toString().startsWith('ORD-') ? orderId : '#' + orderId) : '....'}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon-sm" className="rounded-full hover:bg-destructive/10 hover:text-destructive" onClick={() => setCart([])}>
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        {/* Customer Selector */}
        <div className="px-6 py-4">
          <Button 
            variant="outline" 
            className="w-full justify-between h-12 rounded-xl border-dashed hover:bg-muted/50 transition-colors px-4 group"
            onClick={() => setCustomerSearchOpen(true)}
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <User className="w-4 h-4 text-muted-foreground group-hover:text-foreground flex-shrink-0" />
              <div className="text-left min-w-0">
                <p className="text-muted-foreground font-semibold text-sm group-hover:text-foreground truncate">
                  {selectedCustomer ? selectedCustomer.name : "Chọn khách hàng (F2)"}
                </p>
                {selectedCustomer && (
                  <p className="text-[10px] text-muted-foreground">{selectedCustomer.phone}</p>
                )}
              </div>
            </div>
            {selectedCustomer ? (
              <X className="w-4 h-4 text-muted-foreground hover:text-destructive" onClick={(e) => { e.stopPropagation(); setSelectedCustomer(null); }} />
            ) : (
              <Plus className="w-4 h-4 text-muted-foreground" />
            )}
          </Button>
        </div>

        {/* Cart Items List */}
        <ScrollArea className="flex-1 min-h-0 px-6">
          <div className="space-y-4 py-2">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center text-muted-foreground/30">
                  <ShoppingCart className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <p className="font-semibold">Giỏ hàng trống</p>
                  <p className="text-xs text-muted-foreground">Vui lòng chọn sản phẩm để bắt đầu</p>
                </div>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="flex gap-4 group/item animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0 border">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm truncate pr-2" title={item.name}>{item.name}</p>
                        {item.originalPrice && item.price !== item.originalPrice && (
                          <div className="flex items-center gap-1.5 mt-0.5 animate-in fade-in slide-in-from-left-1 duration-200">
                            <span className="text-[10px] text-muted-foreground line-through">
                              {formatCurrency(item.originalPrice)}
                            </span>
                            <Badge variant="secondary" className="text-[8px] px-1 py-0 h-4 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-none font-bold uppercase tracking-wider">
                              Giá tùy chỉnh
                            </Badge>
                          </div>
                        )}
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="text-muted-foreground hover:text-destructive opacity-0 group-hover/item:opacity-100 transition-opacity">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                      <div className="flex items-center bg-muted rounded-full p-0.5">
                        <button 
                          className="w-6 h-6 flex items-center justify-center hover:bg-card rounded-full transition-colors"
                          onClick={() => updateQuantity(item.id, -1)}
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold w-7 text-center">{item.quantity}</span>
                        <button 
                          className="w-6 h-6 flex items-center justify-center hover:bg-card rounded-full transition-colors"
                          onClick={() => updateQuantity(item.id, 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Click-to-edit Unit Price */}
                      {editingItemId === item.id ? (
                        <div className="flex items-center gap-1 bg-muted/60 px-2 py-0.5 rounded-lg border border-primary/20 animate-in zoom-in-95 duration-150">
                          <input
                            type="number"
                            value={tempPrice}
                            onChange={(e) => setTempPrice(e.target.value)}
                            onBlur={() => {
                              const val = Number(tempPrice);
                              if (!isNaN(val) && val >= 0) {
                                updatePrice(item.id, val);
                              }
                              setEditingItemId(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const val = Number(tempPrice);
                                if (!isNaN(val) && val >= 0) {
                                  updatePrice(item.id, val);
                                }
                                setEditingItemId(null);
                              } else if (e.key === 'Escape') {
                                setEditingItemId(null);
                              }
                            }}
                            className="w-24 bg-transparent border-none text-right font-bold text-sm text-primary focus:outline-none focus:ring-0 p-0"
                            autoFocus
                            placeholder="0"
                          />
                          <span className="text-xs font-bold text-primary">Đ</span>
                        </div>
                      ) : (
                        <div 
                          className="flex items-center gap-1 cursor-pointer hover:bg-muted/70 px-2 py-1 rounded-lg transition-all group/price active:scale-95"
                          onClick={() => {
                            setEditingItemId(item.id);
                            setTempPrice(item.price.toString());
                          }}
                          title="Click để sửa giá sản phẩm"
                        >
                          <p className="font-bold text-primary text-sm group-hover/price:text-primary/80">
                            {formatCurrency(item.price * item.quantity)}
                          </p>
                          <Pencil className="w-3 h-3 text-primary/45 opacity-0 group-hover/price:opacity-100 transition-opacity" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Order Summary Footer */}
        <div className="p-6 bg-primary text-primary-foreground space-y-5 rounded-b-xl border-t border-primary-foreground/10">
          <div className="space-y-3">
            <div className="flex justify-between items-center text-primary-foreground/75 font-semibold text-[10px] uppercase tracking-wider">
              <span>Tạm tính</span>
              <span className="text-sm font-bold">{formatCurrency(subtotal)}</span>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <div className="flex justify-between items-center text-primary-foreground/75 hover:text-primary-foreground font-semibold text-[10px] uppercase tracking-wider cursor-pointer transition-colors group">
                  <span className="flex items-center gap-1.5">
                    Giảm giá
                    <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </span>
                  <span className="text-sm font-bold">
                    {discountValue > 0 ? `-${formatCurrency(discount)}` : "-0 Đ"}
                    {discountValue > 0 && discountType === 'percentage' && ` (${discountValue}%)`}
                  </span>
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4 space-y-4" align="end">
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-foreground">Chiết khấu đơn hàng</h4>
                  <p className="text-muted-foreground text-[11px] leading-normal">
                    Áp dụng giảm giá trực tiếp theo phần trăm hoặc số tiền cố định.
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground">Loại giảm giá</Label>
                    <ToggleGroup
                      size="sm"
                      variant="outline"
                      type="single"
                      value={discountType}
                      onValueChange={(val) => {
                        if (val) {
                          setDiscountType(val as 'percentage' | 'fixed');
                          setDiscountValue(0);
                        }
                      }}
                      className="w-full flex"
                    >
                      <ToggleGroupItem value="fixed" className="flex-1 text-xs">Số tiền (Đ)</ToggleGroupItem>
                      <ToggleGroupItem value="percentage" className="flex-1 text-xs">Phần trăm (%)</ToggleGroupItem>
                    </ToggleGroup>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground">
                      {discountType === 'percentage' ? 'Mức giảm (%)' : 'Số tiền giảm (Đ)'}
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        min="0"
                        max={discountType === 'percentage' ? "100" : undefined}
                        value={discountValue || ""}
                        onChange={(e) => {
                          let val = Math.max(0, Number(e.target.value));
                          if (discountType === 'percentage') {
                            val = Math.min(100, val);
                          }
                          setDiscountValue(val);
                        }}
                        placeholder="0"
                        className="h-9 pr-10 font-bold text-foreground text-sm"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                        {discountType === 'percentage' ? '%' : 'Đ'}
                      </span>
                    </div>
                  </div>
                  {discountValue > 0 && discountType === 'percentage' && (
                    <div className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 p-2 rounded-lg text-center animate-in fade-in zoom-in-95 duration-200 dark:text-emerald-400">
                      Tổng giảm giá: -{formatCurrency(discount)}
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
            <Separator className="bg-primary-foreground/15 my-2" />
            <div className="flex justify-between items-baseline pt-1">
              <span className="font-extrabold text-sm uppercase tracking-wider text-primary-foreground/90">Tổng cộng</span>
              <span className="text-3xl font-black tracking-tight">{formatCurrency(total)}</span>
            </div>
          </div>
          
          <Button 
            className="w-full h-14 bg-primary-foreground text-primary hover:bg-primary-foreground/90 text-lg font-bold rounded-xl shadow-lg disabled:opacity-50 transition-all active:scale-[0.98]" 
            disabled={cart.length === 0}
            onClick={() => setCheckoutOpen(true)}
          >
            Thanh toán (F10)
          </Button>
        </div>
      </div>

      {/* Customer Search Dialog */}
      <Dialog open={customerSearchOpen} onOpenChange={(open) => {
        setCustomerSearchOpen(open);
        if (!open) {
          setIsAddingCustomer(false);
        }
      }}>
        <DialogContent className="max-w-md p-6">
          {isAddingCustomer ? (
            <form onSubmit={handleSaveCustomer} className="space-y-5">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-primary" />
                  Thêm khách hàng mới
                </DialogTitle>
                <DialogDescription>
                  Điền các thông tin cơ bản của khách hàng để lưu vào hệ thống.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label htmlFor="customer-name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tên khách hàng *</Label>
                  <Input 
                    id="customer-name"
                    placeholder="Nguyễn Văn A..." 
                    className="h-10 bg-muted/30 border-muted"
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                
                <div className="space-y-1.5">
                  <Label htmlFor="customer-phone" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Số điện thoại</Label>
                  <Input 
                    id="customer-phone"
                    placeholder="0987654321..." 
                    className="h-10 bg-muted/30 border-muted"
                    value={newCustomerPhone}
                    onChange={(e) => setNewCustomerPhone(e.target.value)}
                    type="tel"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="customer-email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email</Label>
                  <Input 
                    id="customer-email"
                    placeholder="khachhang@gmail.com..." 
                    className="h-10 bg-muted/30 border-muted"
                    value={newCustomerEmail}
                    onChange={(e) => setNewCustomerEmail(e.target.value)}
                    type="email"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="customer-address" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Địa chỉ</Label>
                  <Input 
                    id="customer-address"
                    placeholder="123 Đường ABC, Quận 1..." 
                    className="h-10 bg-muted/30 border-muted"
                    value={newCustomerAddress}
                    onChange={(e) => setNewCustomerAddress(e.target.value)}
                  />
                </div>
              </div>

              <DialogFooter className="flex flex-row gap-2 sm:justify-end border-t pt-4">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setIsAddingCustomer(false)}
                  className="flex-1 sm:flex-initial"
                >
                  Quay lại
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSavingCustomer}
                  className="flex-1 sm:flex-initial gap-2"
                >
                  {isSavingCustomer ? "Đang lưu..." : "Lưu khách hàng"}
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <>
              <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b">
                <DialogTitle className="text-xl font-bold">Tìm khách hàng</DialogTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs text-primary font-bold hover:text-primary/80 h-8 gap-1 p-2 rounded-lg"
                  onClick={handleStartAddCustomer}
                >
                  <UserPlus className="w-4 h-4" />
                  Thêm mới
                </Button>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input 
                    placeholder="Tên hoặc số điện thoại..." 
                    className="pl-10 h-10 bg-muted/50 border-none"
                    value={customerQuery}
                    onChange={(e) => setCustomerQuery(e.target.value)}
                    autoFocus
                  />
                </div>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-1 pr-4">
                    {filteredCustomers.length > 0 ? (
                      filteredCustomers.map(c => (
                        <button 
                          key={c.id} 
                          className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors text-left"
                          onClick={() => { setSelectedCustomer(c); setCustomerSearchOpen(false); }}
                        >
                          <div>
                            <p className="font-semibold text-sm">{c.name}</p>
                            <p className="text-xs text-muted-foreground">{c.phone}</p>
                          </div>
                          <Badge variant="secondary" className="font-bold">{c.points} điểm</Badge>
                        </button>
                      ))
                    ) : (
                      <div className="text-center py-10 space-y-4">
                        <p className="text-muted-foreground text-sm">Không tìm thấy khách hàng</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="rounded-full gap-2"
                          onClick={handleStartAddCustomer}
                        >
                          <UserPlus className="w-4 h-4" />
                          Thêm khách mới
                        </Button>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="sm:max-w-4xl md:max-w-4xl lg:max-w-4xl !max-w-4xl w-full p-0 overflow-hidden rounded-lg border-none shadow-2xl bg-card">
          <DialogHeader className="sr-only">
            <DialogTitle>Thanh toán đơn hàng</DialogTitle>
            <DialogDescription>Nhập phương thức thanh toán và số tiền để hoàn tất đơn hàng</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col md:flex-row h-full min-h-[520px]">
            {/* Left Panel: Inputs & Method Selector (55%) */}
            <div className="w-full md:w-[55%] p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                    <Coins className="w-6 h-6 text-primary" />
                    Thanh toán đơn hàng
                  </h2>
                  <p className="text-muted-foreground text-xs font-semibold uppercase mt-1">
                    Hóa đơn: {orderId ? (orderId.toString().startsWith('ORD-') ? orderId : '#' + orderId) : '....'}
                  </p>
                </div>

                {/* Method selector */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Phương thức thanh toán</span>
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      onClick={() => setPaymentMethod('cash')}
                      className={`flex flex-col items-center justify-center gap-2.5 p-4 rounded-xl border-2 transition-all duration-300 ${
                        paymentMethod === 'cash' 
                          ? 'bg-primary/10 dark:bg-primary/20 border-primary text-primary font-bold scale-[1.02] shadow-sm' 
                          : 'bg-muted/40 text-muted-foreground border-transparent hover:border-border hover:bg-muted/60'
                      }`}
                    >
                      <Banknote className={`w-7 h-7 transition-transform ${paymentMethod === 'cash' ? 'scale-110' : ''}`} />
                      <span className="text-xs">Tiền mặt</span>
                    </button>
                    <button 
                      onClick={() => setPaymentMethod('transfer')}
                      className={`flex flex-col items-center justify-center gap-2.5 p-4 rounded-xl border-2 transition-all duration-300 ${
                        paymentMethod === 'transfer' 
                          ? 'bg-primary/10 dark:bg-primary/20 border-primary text-primary font-bold scale-[1.02] shadow-sm' 
                          : 'bg-muted/40 text-muted-foreground border-transparent hover:border-border hover:bg-muted/60'
                      }`}
                    >
                      <QrCode className={`w-7 h-7 transition-transform ${paymentMethod === 'transfer' ? 'scale-110' : ''}`} />
                      <span className="text-xs">Chuyển khoản</span>
                    </button>
                    <button 
                      onClick={() => setPaymentMethod('card')}
                      className={`flex flex-col items-center justify-center gap-2.5 p-4 rounded-xl border-2 transition-all duration-300 ${
                        paymentMethod === 'card' 
                          ? 'bg-primary/10 dark:bg-primary/20 border-primary text-primary font-bold scale-[1.02] shadow-sm' 
                          : 'bg-muted/40 text-muted-foreground border-transparent hover:border-border hover:bg-muted/60'
                      }`}
                    >
                      <CreditCard className={`w-7 h-7 transition-transform ${paymentMethod === 'card' ? 'scale-110' : ''}`} />
                      <span className="text-xs">Thẻ ATM/Visa</span>
                    </button>
                    <button
                      onClick={() => setPaymentMethod('debt')}
                      disabled={!selectedCustomer}
                      title={!selectedCustomer ? 'Cần chọn khách hàng để ghi nợ' : ''}
                      className={`flex flex-col items-center justify-center gap-2.5 p-4 rounded-xl border-2 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed ${
                        paymentMethod === 'debt'
                          ? 'bg-amber-500/10 dark:bg-amber-500/20 border-amber-500 text-amber-700 dark:text-amber-400 font-bold scale-[1.02] shadow-sm'
                          : 'bg-muted/40 text-muted-foreground border-transparent hover:border-border hover:bg-muted/60'
                      }`}
                    >
                      <CoinsIcon className={`w-7 h-7 transition-transform ${paymentMethod === 'debt' ? 'scale-110' : ''}`} />
                      <span className="text-xs">Ghi nợ</span>
                    </button>
                  </div>
                  {paymentMethod === 'debt' && !selectedCustomer && (
                    <p className="text-[11px] font-bold text-amber-600">
                      ⚠️ Vui lòng chọn khách hàng trước khi ghi nợ
                    </p>
                  )}
                </div>

                {/* Received Amount Input (For Cash / general inputs) */}
                <div className="space-y-3 animate-in fade-in duration-300">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="received-amount" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      {paymentMethod === 'cash' ? 'Số tiền khách đưa' : 'Số tiền nhận thực tế'}
                    </Label>
                    <button 
                      onClick={() => setReceivedAmount(total)}
                      className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Khách đưa đủ
                    </button>
                  </div>
                  <div className="relative">
                    <Input 
                      id="received-amount"
                      type="number"
                      value={receivedAmount} 
                      onChange={(e) => setReceivedAmount(Number(e.target.value))}
                      className="h-14 pl-5 pr-14 text-2xl font-black text-foreground bg-muted/20 border-border focus-visible:ring-primary shadow-inner" 
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-muted-foreground text-sm">VND</span>
                  </div>

                  {/* Cash Suggestion Preset Buttons (Only for Cash Payment) */}
                  {paymentMethod === 'cash' && (
                    <div className="grid grid-cols-4 gap-2 pt-1 animate-in slide-in-from-top-2 duration-300">
                      {[
                        { label: '50k', val: 50000 },
                        { label: '100k', val: 100000 },
                        { label: '200k', val: 200000 },
                        { label: '500k', val: 500000 }
                      ].map((item, idx) => (
                        <Button 
                          key={idx}
                          variant="outline" 
                          size="sm"
                          className="h-9 font-semibold text-xs rounded-lg border-muted-foreground/10 hover:bg-muted"
                          onClick={() => setReceivedAmount(item.val)}
                        >
                          {item.label}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 mt-8">
                <Button
                  variant="outline"
                  className="w-1/3 h-12 rounded-xl font-bold border-muted-foreground/10 text-muted-foreground"
                  onClick={() => {
                    if (paymentMethod === 'transfer' && transferStatus === 'waiting') {
                      handleCancelTransfer();
                    } else {
                      setCheckoutOpen(false);
                    }
                  }}
                >
                  {paymentMethod === 'transfer' && transferStatus === 'waiting' ? 'Huỷ chờ' : 'Hủy bỏ'}
                </Button>
                <Button
                  className="w-2/3 h-12 rounded-xl text-lg font-bold gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-colors"
                  onClick={handleCheckout}
                  disabled={isProcessing || (paymentMethod === 'cash' && receivedAmount < total) || (paymentMethod === 'debt' && !selectedCustomer)}
                >
                  {paymentMethod === 'transfer' && transferStatus === 'idle' && (<>Tạo mã & chờ chuyển khoản <ArrowRight className="w-5 h-5" /></>)}
                  {paymentMethod === 'transfer' && transferStatus === 'waiting' && (<>Đã nhận tiền (thủ công) <Check className="w-5 h-5" /></>)}
                  {paymentMethod !== 'transfer' && (<>Xác nhận <ArrowRight className="w-5 h-5" /></>)}
                </Button>
              </div>
            </div>

            {/* Right Panel: Live Visual Monitor (45%) */}
            <div className="w-full md:w-[45%] bg-muted/30 p-8 flex flex-col justify-between border-t md:border-t-0 md:border-l">
              {/* Dynamic visual preview */}
              <div className="flex-1 flex flex-col justify-center items-center">
                {paymentMethod === 'cash' && (
                  <div className="w-full space-y-6 animate-in zoom-in-95 duration-300">
                    <div className="text-center space-y-1">
                      <span className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">Giám sát giao dịch tiền mặt</span>
                      <p className="text-xs text-muted-foreground font-semibold">Vui lòng kiểm đếm tiền trước khi giao hàng</p>
                    </div>

                    <div className="space-y-4">
                      {/* Cần thanh toán */}
                      <div className="flex justify-between items-center bg-card p-4 rounded-xl border shadow-sm">
                        <span className="text-xs font-bold text-muted-foreground uppercase">Cần thanh toán</span>
                        <span className="font-extrabold text-base text-foreground">{formatCurrency(total)}</span>
                      </div>

                      {/* Khách đưa */}
                      <div className="flex justify-between items-center bg-card p-4 rounded-xl border shadow-sm">
                        <span className="text-xs font-bold text-muted-foreground uppercase">Khách đưa</span>
                        <span className="font-extrabold text-base text-emerald-600 dark:text-emerald-400">{formatCurrency(receivedAmount)}</span>
                      </div>

                      {/* Tiền thừa */}
                      <div className={`p-5 rounded-lg border-2 transition-all text-center space-y-1.5 shadow-md ${
                        receivedAmount >= total 
                          ? 'bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/50 text-emerald-700 dark:text-emerald-400 animate-pulse'
                          : 'bg-destructive/10 dark:bg-destructive/20 border-destructive/50 text-destructive'
                      }`}>
                        <span className="text-[10px] font-black tracking-wider uppercase opacity-85">
                          {receivedAmount >= total ? 'Tiền thừa trả khách' : 'Còn thiếu'}
                        </span>
                        <h3 className="text-3xl font-black">
                          {formatCurrency(Math.abs(receivedAmount - total))}
                        </h3>
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === 'transfer' && (
                  <div className="w-full space-y-4 text-center animate-in zoom-in-95 duration-300">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black tracking-widest text-primary uppercase">Mã VietQR động tự sinh</span>
                      <p className="text-xs text-muted-foreground font-semibold">Quét bằng mọi ứng dụng Smart Banking</p>
                    </div>

                    {/* Live status badge */}
                    <div className="flex items-center justify-center">
                      {transferStatus === 'idle' && (
                        <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 hover:bg-amber-500/15 border-amber-500/30 font-bold">
                          Sẵn sàng tạo mã chuyển khoản
                        </Badge>
                      )}
                      {transferStatus === 'waiting' && (
                        <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 hover:bg-blue-500/15 border-blue-500/30 font-bold gap-1.5">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600" />
                          </span>
                          Đang chờ khách chuyển khoản…
                        </Badge>
                      )}
                    </div>

                    {/* QR canvas */}
                    <div className="relative w-64 h-64 sm:w-72 sm:h-72 bg-white p-3 rounded-lg border-2 border-primary/20 shadow-lg mx-auto flex items-center justify-center group overflow-hidden">
                      <img
                        src={buildVietQRImageUrl({
                          bankBin: qrSettings.bankId,
                          accountNo: qrSettings.accountNo,
                          amount: total,
                          addInfo: paymentReference || `${qrSettings.memoTemplate}${orderId || 'BILL'}`,
                          accountName: qrSettings.accountName,
                        })}
                        alt="VietQR"
                        className="w-full h-full object-contain transition-transform group-hover:scale-105 duration-300"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-primary text-primary-foreground text-[8px] font-black tracking-widest uppercase py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {transferStatus === 'waiting' ? 'Đang nhận biến động số dư' : 'Sẵn sàng'}
                      </div>
                    </div>

                    {/* Transfer details copy panel */}
                    <div className="bg-card rounded-xl border shadow-sm p-3.5 text-left space-y-2 text-xs">
                      <div className="flex justify-between items-center border-b pb-1.5">
                        <span className="text-muted-foreground font-semibold">Ngân hàng</span>
                        <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none font-bold uppercase">{defaultBank?.bank_short_name || qrSettings.bankId}</Badge>
                      </div>

                      <div className="flex justify-between items-center border-b pb-1.5 cursor-pointer hover:bg-muted/50 p-1 rounded transition-colors group" onClick={() => handleCopy(qrSettings.accountNo, 'Số tài khoản')}>
                        <span className="text-muted-foreground font-semibold">Số tài khoản</span>
                        <div className="flex items-center gap-1 font-mono font-bold text-foreground">
                          {qrSettings.accountNo}
                          {copiedField === 'Số tài khoản' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />}
                        </div>
                      </div>

                      <div className="flex justify-between items-center border-b pb-1.5 cursor-pointer hover:bg-muted/50 p-1 rounded transition-colors group" onClick={() => handleCopy(qrSettings.accountName, 'Tên chủ TK')}>
                        <span className="text-muted-foreground font-semibold">Tên chủ tài khoản</span>
                        <div className="flex items-center gap-1 font-bold text-foreground uppercase">
                          {qrSettings.accountName}
                          {copiedField === 'Tên chủ TK' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />}
                        </div>
                      </div>

                      <div className="flex justify-between items-center cursor-pointer hover:bg-muted/50 p-1 rounded transition-colors group" onClick={() => paymentReference && handleCopy(paymentReference, 'Nội dung CK')}>
                        <span className="text-muted-foreground font-semibold">Nội dung chuyển khoản</span>
                        <div className="flex items-center gap-1 font-mono font-bold text-violet-700 dark:text-violet-400">
                          {paymentReference || '—'}
                          {paymentReference && (copiedField === 'Nội dung CK' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />)}
                        </div>
                      </div>
                    </div>

                    {!defaultBank && (
                      <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">
                        ⚠️ Chưa cấu hình tài khoản — vào Cài đặt → Thanh toán
                      </p>
                    )}
                  </div>
                )}

                {paymentMethod === 'card' && (
                  <div className="w-full space-y-6 text-center animate-in zoom-in-95 duration-300">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black tracking-widest text-primary uppercase">Cổng thanh toán thẻ mPOS</span>
                      <p className="text-xs text-muted-foreground font-semibold">Hỗ trợ Napas, Visa, Mastercard, JCB</p>
                    </div>

                    <div className="relative w-40 h-40 bg-card border rounded-lg shadow-md mx-auto flex items-center justify-center">
                      <div className="absolute inset-0 bg-primary/5 dark:bg-primary/10 rounded-lg animate-ping opacity-75" />
                      <CreditCard className="w-16 h-16 text-primary relative z-10 animate-bounce" />
                    </div>

                    <div className="space-y-1.5">
                      <p className="text-sm font-bold text-foreground">Chờ quẹt / chạm thẻ...</p>
                      <p className="text-xs text-muted-foreground max-w-[240px] mx-auto leading-relaxed">Vui lòng gắn thiết bị đầu đọc thẻ hoặc hướng dẫn khách hàng chạm thẻ chip để hoàn tất.</p>
                    </div>
                    
                    {/* Card Webhook Simulation Button (For Demo) */}
                    <Button 
                      variant="secondary" 
                      className="w-full h-10 mt-4 text-xs font-bold gap-2 hover:border-primary/50 text-primary bg-primary/5"
                      onClick={() => {
                        setIsProcessing(true);
                        toast.info("Đang xử lý thanh toán qua mPOS...");
                        setTimeout(() => {
                          handleCheckout();
                        }, 1500);
                      }}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Đang giao tiếp máy POS...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4" />
                          Mô phỏng: Khách đã chạm thẻ thành công
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>

              {/* Total checkout card */}
              <div className="border-t pt-4 mt-6">
                <div className="bg-card p-4 rounded-xl border shadow-sm space-y-1.5 text-center">
                  <span className="text-[9px] font-black tracking-widest text-muted-foreground uppercase">Tổng tiền thanh toán</span>
                  <h3 className="text-2xl font-black text-primary">{formatCurrency(total)}</h3>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Modal & Receipt Preview */}
      <Dialog open={successOpen} onOpenChange={(open) => { setSuccessOpen(open); if(!open) setLastOrder(null); }}>
        <DialogContent className="max-w-md p-8 text-center">
          <DialogHeader className="sr-only">
            <DialogTitle>Thanh toán thành công</DialogTitle>
            <DialogDescription>Đơn hàng đã được xử lý và ghi nhận vào hệ thống.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-5">
            {/* Premium Animated Green Checkmark Ring */}
            <div className="relative">
              <div className="w-16 h-16 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500 animate-in zoom-in duration-300">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-ping opacity-25" style={{ animationDuration: '2s' }} />
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">Thành công!</h2>
              <p className="text-muted-foreground text-sm">Giao dịch đã được hoàn tất và ghi nhận.</p>
            </div>
            
            {/* Premium Thermal Paper Receipt Preview */}
            {lastOrder && (
              <div className="w-full bg-white dark:bg-zinc-950 rounded-2xl p-6 text-left space-y-4 font-mono text-[11px] border border-zinc-200/80 dark:border-zinc-800 shadow-sm relative overflow-hidden">
                {/* Top decorative line for paper texture */}
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-zinc-200 via-transparent to-zinc-200 dark:from-zinc-800 dark:to-zinc-800 opacity-50" />
                
                <div className="text-center space-y-1">
                  <p className="font-bold text-sm tracking-wide text-zinc-900 dark:text-zinc-50 uppercase">ZPOS RETAIL</p>
                  <p className="text-zinc-500 dark:text-zinc-400 text-[10px]">123 Đường ABC, Quận 1, TP.HCM</p>
                  <p className="text-zinc-400 dark:text-zinc-500 text-[9px] font-sans mt-1">Mã HĐ: <span className="font-mono font-bold text-zinc-600 dark:text-zinc-300">{lastOrder.orderId}</span></p>
                </div>
                
                <Separator className="border-dashed border-zinc-200 dark:border-zinc-800" />
                
                <div className="space-y-2 text-zinc-700 dark:text-zinc-300">
                  {lastOrder.cart.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-start gap-4">
                      <span className="break-words max-w-[70%] font-medium">{item.name} x {item.quantity}</span>
                      <span className="shrink-0 font-bold text-zinc-900 dark:text-zinc-100">{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                
                <Separator className="border-dashed border-zinc-200 dark:border-zinc-800" />
                
                <div className="space-y-1.5 text-zinc-600 dark:text-zinc-400">
                  <div className="flex justify-between text-[10px]">
                    <span>Tạm tính:</span>
                    <span>{formatCurrency(lastOrder.subtotal)}</span>
                  </div>
                  {lastOrder.discount > 0 && (
                    <div className="flex justify-between text-rose-500 text-[10px] font-bold">
                      <span>Giảm giá:</span>
                      <span>-{formatCurrency(lastOrder.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-extrabold text-xs text-zinc-900 dark:text-zinc-50 pt-1.5 border-t border-zinc-100 dark:border-zinc-900">
                    <span>TỔNG CỘNG:</span>
                    <span className="text-sm font-black text-primary">{formatCurrency(lastOrder.total)}</span>
                  </div>
                </div>
                
                <div className="text-center pt-2 italic text-zinc-400 dark:text-zinc-500 text-[10px] font-sans">
                  Cảm ơn quý khách!
                </div>
              </div>
            )}

            {/* eInvoice status banner */}
            {issuedInvoice && (
              <div className="w-full rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 text-left text-xs space-y-1">
                <p className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> Đã phát hành HĐĐT
                </p>
                <p className="font-mono">
                  {issuedInvoice.invoice_series || '—'}/{issuedInvoice.invoice_no || '—'}
                  {issuedInvoice.provider_lookup_code && (
                    <> · Tra cứu: <b>{issuedInvoice.provider_lookup_code}</b></>
                  )}
                </p>
                {issuedInvoice.provider_pdf_url && (
                  <a
                    href={issuedInvoice.provider_pdf_url}
                    target="_blank"
                    rel="noreferrer"
                    className="underline font-bold text-emerald-700 dark:text-emerald-400"
                  >
                    Mở PDF hoá đơn ↗
                  </a>
                )}
              </div>
            )}

            {/* Re-designed Buttons Section to Prevent Overlapping */}
            <div className="w-full flex flex-col gap-2.5 mt-4">
              <Button 
                className="w-full h-12 rounded-xl font-bold bg-primary hover:bg-primary/95 text-primary-foreground gap-2 text-sm shadow-md shadow-primary/10 transition-all active:scale-[0.98]" 
                onClick={() => setSuccessOpen(false)}
              >
                Tiếp tục bán hàng
                <ArrowRight className="w-4 h-4 transition-transform group-hover/button:translate-x-0.5" />
              </Button>
              
              <div className="grid grid-cols-2 gap-2.5 w-full">
                <Button
                  variant="outline"
                  className="h-11 rounded-xl gap-2 font-semibold text-xs border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all active:scale-[0.98]"
                  onClick={() => handleIssueInvoice()}
                  disabled={invoiceIssuing || !!issuedInvoice}
                >
                  {invoiceIssuing ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FileText className="w-3.5 h-3.5" />
                  )}
                  {issuedInvoice ? 'Đã PH HĐĐT' : 'Phát hành HĐĐT'}
                </Button>
                <Button 
                  variant="outline"
                  className="h-11 rounded-xl gap-2 font-semibold text-xs border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all active:scale-[0.98]" 
                  onClick={() => window.print()}
                >
                  <Printer className="w-3.5 h-3.5" />
                  In hoá đơn
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>

      {/* Hidden Print Area */}
      {lastOrder && (
        <PrintInvoice order={{
          order_number: lastOrder.orderId,
          created_at: lastOrder.createdAt,
          items: lastOrder.cart.map((item: any) => ({
            product_name: item.name,
            quantity: item.quantity,
            unit_price: item.price,
            total_price: item.price * item.quantity
          })),
          total_amount: lastOrder.total,
          payment_method: lastOrder.paymentMethod,
          customer: lastOrder.customer ? { name: lastOrder.customer.name, phone: lastOrder.customer.phone } : undefined
        }} />
      )}

      <BarcodeScannerDialog
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        products={products}
        onScanSuccess={addToCart}
      />
    </>
  );
}
