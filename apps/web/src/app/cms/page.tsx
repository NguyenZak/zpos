"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  FileText, 
  Image as ImageIcon, 
  Globe, 
  Layout, 
  Plus, 
  PenTool, 
  MessageSquare, 
  Settings, 
  Activity, 
  ArrowUpRight, 
  Clock, 
  Sparkles, 
  Laptop, 
  Tablet, 
  Smartphone, 
  Copy, 
  Check, 
  CheckCircle2, 
  User, 
  Mail, 
  Phone, 
  ArrowRight, 
  Lock, 
  CloudUpload, 
  ChevronRight, 
  Download, 
  Eye, 
  Search, 
  Trash2, 
  Heart, 
  Share2, 
  Send, 
  Database, 
  Save, 
  RefreshCw, 
  Sliders,
  AlertTriangle,
  FileCode,
  ShieldCheck,
  Calendar,
  Sparkle,
  MoreHorizontal,
  Filter,
  ExternalLink,
  Loader2,
  Trash
} from "lucide-react";
import Link from "next/link";

// Shadcn UI Imports from app specification
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Area, 
  AreaChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  CartesianGrid,
  Bar,
  BarChart,
  Line,
  LineChart,
  Cell,
  Legend,
  Tooltip
} from "recharts";

// --- Types ---
interface LandingConfig {
  logoText: string;
  heroTitle: string;
  heroSub: string;
  accentColor: string;
  primaryButtonText: string;
  secondaryButtonText: string;
  showPricing: boolean;
  pricingPlanBasic: string;
  pricingPlanPro: string;
  supportPhone: string;
  promoCode: string;
  promoDiscount: string;
  isDarkPreview: boolean;
}

interface BlogPost {
  id: string;
  title: string;
  summary: string;
  content: string;
  slug: string;
  category: string;
  author: string;
  status: "published" | "draft";
  readTime: string;
  publishedAt: string;
  coverImage: string;
  views: number;
}

interface MediaItem {
  id: string;
  name: string;
  type: "image" | "document" | "video";
  size: string;
  url: string;
  uploadedAt: string;
}

interface Inquiry {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  message: string;
  status: "new" | "contacted" | "completed";
  date: string;
  notes: string[];
}

interface BackupItem {
  id: string;
  version: string;
  size: string;
  status: "success" | "failed";
  createdAt: string;
}

export default function CMSDashboard() {
  // --- Active Tab State (Synced with URL Hash) ---
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash || "#dashboard";
      setActiveTab(hash.replace("#", ""));
    };
    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Load real landing config, blogs, and inquiries on mount
  useEffect(() => {
    async function loadLandingConfig() {
      try {
        const res = await fetch("/api/admin/landing-config");
        const json = await res.json();
        if (json.success && json.data) {
          setLandingConfig(json.data);
        }
      } catch (err) {
        console.error("Failed to load real landing page config:", err);
      }
    }

    async function loadBlogs() {
      try {
        const res = await fetch("/api/admin/blogs");
        const json = await res.json();
        if (json.success && json.data) {
          setBlogPosts(json.data);
        }
      } catch (err) {
        console.error("Failed to load real blogs:", err);
      }
    }

    async function loadInquiries() {
      try {
        const res = await fetch("/api/admin/inquiries");
        const json = await res.json();
        if (json.success && json.data) {
          setInquiries(json.data);
          if (json.data.length > 0) {
            setSelectedInquiry(json.data[0]);
          }
        }
      } catch (err) {
        console.error("Failed to load real inquiries:", err);
      }
    }

    loadLandingConfig();
    loadBlogs();
    loadInquiries();
  }, []);

  const handleSaveLandingConfig = async (isLive: boolean) => {
    try {
      const res = await fetch("/api/admin/landing-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(landingConfig)
      });
      const json = await res.json();
      if (json.success) {
        if (isLive) {
          toast.success("Đã đồng bộ hóa và xuất bản Landing Page trực tiếp thành công!");
        } else {
          toast.success("Đã sao lưu cấu hình nháp thành công!");
        }
      } else {
        toast.error("Có lỗi xảy ra khi lưu cấu hình: " + json.error);
      }
    } catch (err: any) {
      toast.error("Không thể kết nối đến máy chủ: " + err.message);
    }
  };

  // --- Copy Clipboard Helper ---
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    toast.success(`Đã sao chép ${label}`);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // --- 1. LANDING CONFIG STATE ---
  const [landingConfig, setLandingConfig] = useState<LandingConfig>({
    logoText: "ZPOS Solutions",
    heroTitle: "Hệ thống POS Omnichannel Chuyên nghiệp hàng đầu",
    heroSub: "Quản lý bán hàng tập trung, kiểm kho tự động & chăm sóc khách hàng chuyên biệt với trợ lý AI đột phá.",
    accentColor: "#2563eb", // Blue 600
    primaryButtonText: "Bắt đầu miễn phí",
    secondaryButtonText: "Xem mô phỏng POS",
    showPricing: true,
    pricingPlanBasic: "350.000đ/tháng",
    pricingPlanPro: "1.250.000đ/tháng",
    supportPhone: "1900 8899",
    promoCode: "ZPOSLAUNCH",
    promoDiscount: "Giảm 10% trọn đời",
    isDarkPreview: true,
  });

  // --- 2. BLOG POSTS STATE ---
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([
    {
      id: "post-1",
      title: "Cách tối ưu hóa hệ thống POS cho mùa mua sắm cao điểm cuối năm",
      summary: "Chia sẻ 5 phương pháp tối ưu hóa dữ liệu kho, đồng bộ hóa hóa đơn tức thì và quản lý hiệu suất nhân viên để hạn chế gián đoạn thanh toán.",
      content: "Hệ thống POS (Point of Sale) đóng vai trò trung tâm của mọi hoạt động giao dịch tại quầy...",
      slug: "toi-uu-pos-mua-cao-diem",
      category: "Kinh doanh",
      author: "Nguyễn Minh Khôi",
      status: "published",
      readTime: "5 phút",
      publishedAt: "2026-05-15",
      coverImage: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=200&q=80",
      views: 1245
    },
    {
      id: "post-2",
      title: "Ứng dụng Trợ lý AI Giọng nói trong việc Gọi món & Tạo Order tự động",
      summary: "Đánh giá hiệu quả thực tế khi tích hợp Voice AI Assistant vào ZPOS giúp nhân viên giảm 50% thời gian nhập liệu hóa đơn.",
      content: "Công nghệ Trợ lý ảo AI đang thay đổi cách thức các cửa hàng bán lẻ và quán cafe vận hành...",
      slug: "ung-dung-voice-ai-order",
      category: "Công nghệ",
      author: "Trần Anh Tú",
      status: "published",
      readTime: "7 phút",
      publishedAt: "2026-05-12",
      coverImage: "https://images.unsplash.com/photo-1531746790731-6c087fecd793?auto=format&fit=crop&w=200&q=80",
      views: 932
    },
    {
      id: "post-3",
      title: "Giải pháp ERP đám mây & Đồng bộ đa chi nhánh tối ưu cho chuỗi bán lẻ",
      summary: "Kiến trúc kỹ thuật đằng sau hệ thống quản lý kho đa chi nhánh (Multi-location) và cách thức vận hành đồng bộ không xung đột dữ liệu.",
      content: "Khi doanh nghiệp mở rộng quy mô từ một cửa hàng lên chuỗi nhiều chi nhánh...",
      slug: "erp-dong-bo-chuoi-ban-le",
      category: "Quản lý",
      author: "Lê Thị Thu Thủy",
      status: "draft",
      readTime: "6 phút",
      publishedAt: "2026-05-10",
      coverImage: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=200&q=80",
      views: 0
    }
  ]);

  // --- Search and Filters States ---
  const [blogSearch, setBlogSearch] = useState("");
  const [blogFilter, setBlogFilter] = useState("all");

  const [inquirySearch, setInquirySearch] = useState("");
  const [inquiryFilter, setInquiryFilter] = useState("all");

  // --- Delete confirmation dialogs ---
  const [deleteBlogId, setDeleteBlogId] = useState<string | null>(null);
  const [deleteBlogAlertOpen, setDeleteBlogAlertOpen] = useState(false);

  // --- BLOG EDITOR INLINE STATE ---
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [editorTitle, setEditorTitle] = useState("");
  const [editorSummary, setEditorSummary] = useState("");
  const [editorContent, setEditorContent] = useState("");
  const [editorCategory, setEditorCategory] = useState("Kinh doanh");
  const [editorStatus, setEditorStatus] = useState<"published" | "draft">("draft");
  const [editorSlug, setEditorSlug] = useState("");
  const [editorReadTime, setEditorReadTime] = useState("5 phút");
  const [editorCoverImage, setEditorCoverImage] = useState("");

  const handleEditBlog = (post: BlogPost) => {
    setEditingPost(post);
    setEditorTitle(post.title);
    setEditorSummary(post.summary);
    setEditorContent(post.content);
    setEditorCategory(post.category);
    setEditorStatus(post.status);
    setEditorSlug(post.slug);
    setEditorReadTime(post.readTime);
    setEditorCoverImage(post.coverImage);
    window.location.hash = "#blog-editor";
  };

  const handleCreateNewBlog = () => {
    setEditingPost(null);
    setEditorTitle("");
    setEditorSummary("");
    setEditorContent("");
    setEditorCategory("Kinh doanh");
    setEditorStatus("draft");
    setEditorSlug("");
    setEditorReadTime("5 phút");
    setEditorCoverImage("https://images.unsplash.com/photo-1432821596592-e2c18b78144f?auto=format&fit=crop&w=600&q=80");
    window.location.hash = "#blog-editor";
  };

  const handleSaveBlog = async () => {
    if (!editorTitle || !editorSlug) {
      toast.error("Vui lòng điền Tiêu đề và Đường dẫn URL bài viết!");
      return;
    }

    const blogData: Partial<BlogPost> = {
      id: editingPost?.id || undefined,
      title: editorTitle,
      summary: editorSummary,
      content: editorContent,
      slug: editorSlug,
      category: editorCategory,
      status: editorStatus,
      readTime: editorReadTime,
      coverImage: editorCoverImage,
      author: editingPost ? editingPost.author : "Admin ZPOS"
    };

    try {
      const res = await fetch("/api/admin/blogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(blogData)
      });
      const json = await res.json();
      if (json.success && json.data) {
        if (editingPost) {
          setBlogPosts(blogPosts.map(p => p.id === editingPost.id ? json.data : p));
          toast.success("Cập nhật bài viết thành công!");
        } else {
          setBlogPosts([json.data, ...blogPosts]);
          toast.success("Tạo bài viết mới thành công!");
        }
      } else {
        toast.error("Không thể lưu bài viết: " + json.error);
      }
    } catch (err: any) {
      toast.error("Lỗi kết nối máy chủ: " + err.message);
    }
    window.location.hash = "#blog";
  };

  // --- AI SEO ANALYSIS STATE ---
  const [seoAnalysis, setSeoAnalysis] = useState({
    score: 82,
    feedback: "Bài viết có độ dài tốt và chứa từ khóa chính. Hãy bổ sung thêm alt text cho hình ảnh và một vài liên kết nội bộ.",
    keywords: ["hệ thống POS", "bán hàng omnichannel", "quản lý bán lẻ", "Voice AI", "đồng bộ đám mây"]
  });

  const triggerAiSeoAnalyze = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1500)),
      {
        loading: "Trợ lý AI đang quét và phân tích điểm SEO cho bài viết...",
        success: () => {
          const randomScore = Math.floor(Math.random() * 15) + 80;
          setSeoAnalysis({
            score: randomScore,
            feedback: "Quá xuất sắc! Bài viết chứa từ khóa mật độ lý tưởng (2.4%), thẻ tiêu đề chuẩn SEO H1/H2, mô tả tóm tắt hấp dẫn kích thích click.",
            keywords: [editorSlug.replace(/-/g, " "), "phần mềm ZPOS", "quản lý kho chuyên nghiệp"]
          });
          return `AI đã chấm điểm bài viết đạt ${randomScore}/100 điểm!`;
        },
        error: "Đã xảy ra lỗi khi kết nối tới OpenAI API."
      }
    );
  };

  // --- 3. MEDIA ITEMS STATE ---
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([
    { id: "img-1", name: "hero_device_mockup.png", type: "image", size: "345 KB", url: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=600&q=80", uploadedAt: "2026-05-16 14:22" },
    { id: "img-2", name: "restaurant_ai_assistant.jpg", type: "image", size: "820 KB", url: "https://images.unsplash.com/photo-1531746790731-6c087fecd793?auto=format&fit=crop&w=600&q=80", uploadedAt: "2026-05-15 09:12" },
    { id: "img-3", name: "office_analytics_dashboard.jpg", type: "image", size: "1.2 MB", url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80", uploadedAt: "2026-05-14 17:05" },
    { id: "doc-1", name: "zpos_features_brochure.pdf", type: "document", size: "3.4 MB", url: "/docs/zpos_features_brochure.pdf", uploadedAt: "2026-05-10 11:30" },
    { id: "img-4", name: "barcode_scanner_setup.png", type: "image", size: "185 KB", url: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=600&q=80", uploadedAt: "2026-05-08 10:15" },
  ]);

  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(mediaItems[0]);
  const [mediaSearch, setMediaSearch] = useState("");

  const handleUploadFakeMedia = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1200)),
      {
        loading: "Đang tải tệp tin lên thư viện Media...",
        success: () => {
          const newItem: MediaItem = {
            id: "img-" + Date.now(),
            name: "uploaded_asset_" + Math.floor(Math.random() * 100) + ".jpg",
            type: "image",
            size: "450 KB",
            url: "https://images.unsplash.com/photo-1432821596592-e2c18b78144f?auto=format&fit=crop&w=600&q=80",
            uploadedAt: new Date().toISOString().slice(0, 16).replace("T", " ")
          };
          setMediaItems([newItem, ...mediaItems]);
          setSelectedMedia(newItem);
          return "Tải tệp tin lên thành công!";
        },
        error: "Không thể kết nối đến kho lưu trữ S3 Bucket."
      }
    );
  };

  const handleDeleteMedia = (id: string) => {
    setMediaItems(mediaItems.filter(m => m.id !== id));
    setSelectedMedia(null);
    toast.success("Đã xóa tệp tin khỏi thư viện");
  };

  // --- 4. CONSULTATION INQUIRIES STATE ---
  const [inquiries, setInquiries] = useState<Inquiry[]>([
    {
      id: "inq-1",
      customerName: "Hoàng Đức Trung",
      customerEmail: "trung.hd@bibomart.com.vn",
      customerPhone: "0912 345 678",
      message: "Tôi muốn nhận báo giá hệ thống POS quản lý chuỗi 15 chi nhánh siêu thị mẹ và bé tại Hà Nội. Yêu cầu tích hợp xuất hóa đơn đỏ và chuyển kho nội bộ tức thời.",
      status: "new",
      date: "2026-05-17 18:35",
      notes: [
        "Khách hàng là đại diện chuỗi BiboMart Hà Nội.",
        "Cần demo hệ thống trực tiếp vào chiều thứ 4 này."
      ]
    },
    {
      id: "inq-2",
      customerName: "Lâm Mỹ Lệ",
      customerEmail: "le.lam@thecoffeehouse.vn",
      customerPhone: "0977 888 999",
      message: "Tìm hiểu giải pháp Voice AI order cho quầy cafe take-away. Hệ thống có hỗ trợ máy in nhiệt bếp không?",
      status: "contacted",
      date: "2026-05-16 11:20",
      notes: [
        "Đã gọi điện tư vấn buổi sáng 16/5.",
        "Khách hàng phản hồi rất quan tâm đến trợ lý Voice AI nhưng lo ngại tiếng ồn tại quầy."
      ]
    },
    {
      id: "inq-3",
      customerName: "Phạm Minh Hoàng",
      customerEmail: "hoangpm@tocotocotea.com",
      customerPhone: "0909 112 233",
      message: "Cần tích hợp ZPOS với phần mềm ERP SAP có sẵn của doanh nghiệp. Xin gửi tài liệu hướng dẫn API SDK.",
      status: "completed",
      date: "2026-05-14 09:45",
      notes: [
        "Đã bàn giao bộ tài liệu API Swagger.",
        "Kỹ thuật hai bên đã kết nối thử nghiệm Sandbox thành công."
      ]
    }
  ]);

  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(inquiries[0]);
  const [noteInput, setNoteInput] = useState("");

  const handleAddInquiryNote = async () => {
    if (!noteInput.trim() || !selectedInquiry) return;
    const updatedNotes = [...selectedInquiry.notes, noteInput.trim()];
    
    try {
      const res = await fetch("/api/admin/inquiries", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedInquiry.id, notes: updatedNotes })
      });
      const json = await res.json();
      if (json.success && json.data) {
        setInquiries(inquiries.map(inq => inq.id === selectedInquiry.id ? json.data : inq));
        setSelectedInquiry(json.data);
        setNoteInput("");
        toast.success("Đã ghi thêm lịch sử chăm sóc khách hàng");
      } else {
        toast.error("Không thể thêm ghi chú: " + json.error);
      }
    } catch (err: any) {
      toast.error("Lỗi kết nối máy chủ: " + err.message);
    }
  };

  const handleUpdateInquiryStatus = async (id: string, status: "new" | "contacted" | "completed") => {
    try {
      const res = await fetch("/api/admin/inquiries", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status })
      });
      const json = await res.json();
      if (json.success && json.data) {
        setInquiries(inquiries.map(inq => inq.id === id ? json.data : inq));
        if (selectedInquiry && selectedInquiry.id === id) {
          setSelectedInquiry(json.data);
        }
        toast.success(`Đã cập nhật trạng thái sang: ${status === 'new' ? 'Mới' : status === 'contacted' ? 'Đã liên hệ' : 'Hoàn tất'}`);
      } else {
        toast.error("Không thể cập nhật trạng thái: " + json.error);
      }
    } catch (err: any) {
      toast.error("Lỗi kết nối máy chủ: " + err.message);
    }
  };

  // --- 5. SYSTEM SETTINGS STATE ---
  const [customDomain, setCustomDomain] = useState("zpos.vn");
  const [domainVerified, setDomainVerified] = useState(true);
  const [smtpServer, setSmtpServer] = useState("smtp.sendgrid.net");
  const [smtpUser, setSmtpUser] = useState("apikey");
  const [smtpPort, setSmtpPort] = useState("587");
  const [analyticsId, setAnalyticsId] = useState("G-ZPOS998877");
  
  const [backups, setBackups] = useState<BackupItem[]>([
    { id: "bk-1", version: "v1.4.12_db_prod", size: "45.8 MB", status: "success", createdAt: "2026-05-17 02:00" },
    { id: "bk-2", version: "v1.4.11_db_prod", size: "45.2 MB", status: "success", createdAt: "2026-05-16 02:00" },
    { id: "bk-3", version: "v1.4.10_db_prod", size: "44.9 MB", status: "success", createdAt: "2026-05-15 02:00" },
    { id: "bk-4", version: "v1.4.09_db_prod", size: "23.4 MB", status: "failed", createdAt: "2026-05-14 02:00" },
  ]);

  const handleTriggerBackup = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 2000)),
      {
        loading: "Hệ thống đang nén cơ sở dữ liệu và mã hóa tệp tin sao lưu...",
        success: () => {
          const newBackup: BackupItem = {
            id: "bk-" + Date.now(),
            version: `v1.4.12_db_manual_${Math.floor(Math.random() * 1000)}`,
            size: "46.1 MB",
            status: "success",
            createdAt: new Date().toISOString().slice(0, 16).replace("T", " ")
          };
          setBackups([newBackup, ...backups]);
          return "Đã tạo bản sao lưu vật lý DB thành công!";
        },
        error: "Mã hóa thất bại do cạn dung lượng ổ đĩa đệm."
      }
    );
  };

  // --- LANDING PREVIEW DEVICE TYPE ---
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");

  // --- SVG Dashboard Spark Chart Path Generator ---
  const getChartPaths = () => {
    const dataPoints = [45, 62, 55, 78, 85, 69, 95, 110, 130];
    const width = 500;
    const height = 120;
    const padding = 10;
    
    const xMax = width - padding * 2;
    const yMax = height - padding * 2;
    const pointsCount = dataPoints.length;
    
    const maxVal = Math.max(...dataPoints);
    const minVal = Math.min(...dataPoints);
    const range = maxVal - minVal;

    const points = dataPoints.map((val, idx) => {
      const x = padding + (idx / (pointsCount - 1)) * xMax;
      const y = padding + yMax - ((val - minVal) / range) * yMax;
      return { x, y };
    });

    const dPath = points.reduce((acc, p, idx) => {
      if (idx === 0) return `M ${p.x} ${p.y}`;
      return `${acc} L ${p.x} ${p.y}`;
    }, "");

    const fillPath = `${dPath} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

    return { dPath, fillPath, points };
  };

  // ==========================================
  // TAB RENDERING METHODS (HIGH CONTRAST PREMIUM UI)
  // ==========================================

  // --- 1. OVERVIEW DASHBOARD ---
  const renderDashboard = () => {
    const newInqs = inquiries.filter(i => i.status === "new").length;

    // Premium Recharts Datasets matching system analytics
    const trafficData = [
      { name: "T2", views: 1890, inquiries: 12 },
      { name: "T3", views: 2300, inquiries: 18 },
      { name: "T4", views: 3200, inquiries: 25 },
      { name: "T5", views: 2800, inquiries: 15 },
      { name: "T6", views: 3900, inquiries: 30 },
      { name: "T7", views: 4800, inquiries: 42 },
      { name: "CN", views: 4200, inquiries: 35 },
    ];

    const trafficComparisonData = [
      { name: "T2", currentWeek: 1890, lastWeek: 1600 },
      { name: "T3", currentWeek: 2300, lastWeek: 2100 },
      { name: "T4", currentWeek: 3200, lastWeek: 2800 },
      { name: "T5", currentWeek: 2800, lastWeek: 3000 },
      { name: "T6", currentWeek: 3900, lastWeek: 3300 },
      { name: "T7", currentWeek: 4800, lastWeek: 4000 },
      { name: "CN", currentWeek: 4200, lastWeek: 3900 },
    ];

    const hourlyLeadData = [
      { hour: "06h - 09h", leads: 4 },
      { hour: "09h - 12h", leads: 15 },
      { hour: "12h - 15h", leads: 9 },
      { hour: "15h - 18h", leads: 18 },
      { hour: "18h - 21h", leads: 22 },
      { hour: "21h - 23h", leads: 10 },
    ];

    const categoryData = [
      { name: "Công nghệ", value: 12, color: "hsl(var(--primary))", opacity: 1.0 },
      { name: "Kinh doanh", value: 8, color: "hsl(var(--primary))", opacity: 0.82 },
      { name: "Sự kiện", value: 6, color: "hsl(var(--primary))", opacity: 0.65 },
      { name: "Hướng dẫn", value: 4, color: "hsl(var(--primary))", opacity: 0.48 },
    ];

    return (
      <div className="space-y-6 w-full mx-auto animate-fadeIn">
        {/* Welcome Premium Header */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-950 p-6 md:p-8 text-white shadow-xl">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-60 h-60 bg-indigo-500/20 rounded-full blur-3xl" />
          
          <div className="relative z-10 max-w-2xl space-y-3">
            <Badge className="bg-white/20 text-white border-none backdrop-blur-md px-3 py-1 font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 mr-1 text-yellow-300 animate-pulse fill-yellow-300" /> Bản phát hành v1.4.12
            </Badge>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">Chào mừng quay trở lại, Admin ZPOS!</h1>
            <p className="text-indigo-100 font-medium text-sm md:text-base">
              Hôm nay hệ thống ghi nhận sự tăng trưởng ổn định. Có <span className="font-bold text-yellow-300 underline">{newInqs} yêu cầu tư vấn mới</span> đang chờ xử lý từ trang giới thiệu sản phẩm.
            </p>
          </div>
        </div>

        {/* Dashboard Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: "Lượt xem trang", value: "24,890", change: "+12.4%", desc: "7 ngày gần nhất", color: "from-blue-600 to-blue-400", icon: Eye },
            { title: "Yêu cầu tư vấn", value: `${inquiries.length} Lead`, change: `+${newInqs} mới`, desc: "Tỉ lệ phản hồi 100%", color: "from-emerald-600 to-emerald-400", icon: MessageSquare },
            { title: "Bài viết Blog", value: `${blogPosts.length} Bài`, change: "1 Bản nháp", desc: "Tối ưu hóa SEO chuẩn AI", color: "from-indigo-600 to-indigo-400", icon: FileText },
            { title: "Tài nguyên Media", value: `${mediaItems.length} Tệp`, change: "Tổng 6.2 MB", desc: "Đã tối ưu hóa CDN", color: "from-amber-600 to-amber-400", icon: ImageIcon },
          ].map((card, i) => (
            <Card key={i} className="relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:shadow-[0_20px_40px_rgba(0,0,0,0.2)] rounded-xl group hover:scale-[1.02] transition-transform">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">{card.title}</span>
                <div className={`p-2.5 rounded-lg bg-gradient-to-br ${card.color} text-white shadow-md`}>
                  <card.icon className="w-4 h-4" />
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="text-3xl font-black text-slate-800 dark:text-slate-100">{card.value}</div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 px-2 py-0.5">
                    {card.change}
                  </Badge>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{card.desc}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Chart Section & Quick Info Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Traffic Interactive Recharts Tabbed Dashboard */}
          <Card className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:shadow-[0_20px_40px_rgba(0,0,0,0.2)] rounded-xl">
            <Tabs defaultValue="traffic" className="w-full">
              <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-2">
                <div>
                  <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-600" />
                    Trung tâm Phân tích Marketing
                  </CardTitle>
                  <CardDescription className="text-xs font-semibold text-slate-400">Báo cáo đồ thị tiếp thị thời gian thực</CardDescription>
                </div>
                <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                  <TabsTrigger value="traffic" className="text-xs font-bold px-3 py-1.5">Truy cập</TabsTrigger>
                  <TabsTrigger value="comparison" className="text-xs font-bold px-3 py-1.5">So sánh tuần</TabsTrigger>
                  <TabsTrigger value="hourly" className="text-xs font-bold px-3 py-1.5">Giờ cao điểm</TabsTrigger>
                  <TabsTrigger value="category" className="text-xs font-bold px-3 py-1.5">Chuyên mục</TabsTrigger>
                </TabsList>
              </CardHeader>
              
              <CardContent className="pt-2">
                {/* TAB 1: AREA TRAFFIC & CONVERSION CHART */}
                <TabsContent value="traffic" className="mt-0">
                  <div className="h-[260px] w-full pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trafficData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="rgb(37, 99, 235)" stopOpacity={0.35}/>
                            <stop offset="95%" stopColor="rgb(37, 99, 235)" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickMargin={10} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '12px', borderColor: 'hsl(var(--border))' }} />
                        <Area type="monotone" dataKey="views" name="Lượt xem trang" stroke="rgb(37, 99, 235)" strokeWidth={3} fillOpacity={1} fill="url(#colorTraffic)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>

                {/* TAB 2: TRAFFIC COMPARISON (THIS WEEK VS LAST WEEK) */}
                <TabsContent value="comparison" className="mt-0">
                  <div className="h-[260px] w-full pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trafficComparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickMargin={10} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '12px', borderColor: 'hsl(var(--border))' }} />
                        <Legend verticalAlign="top" height={36} iconType="circle" />
                        <Line type="monotone" dataKey="currentWeek" name="Tuần này" stroke="hsl(var(--primary))" strokeWidth={3} activeDot={{ r: 6 }} />
                        <Line type="monotone" dataKey="lastWeek" name="Tuần trước" stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>

                {/* TAB 3: HOURLY LEAD SUBMISSIONS BAR CHART */}
                <TabsContent value="hourly" className="mt-0">
                  <div className="h-[260px] w-full pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={hourlyLeadData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickMargin={10} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '12px', borderColor: 'hsl(var(--border))' }} />
                        <Bar dataKey="leads" name="Yêu cầu tư vấn" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]}>
                          {hourlyLeadData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === 4 ? "hsl(var(--primary))" : "hsl(var(--primary) / 0.6)"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>

                {/* TAB 4: CATEGORIES DISTRIBUTION (HORIZONTAL BAR CHART) */}
                <TabsContent value="category" className="mt-0">
                  <div className="h-[260px] w-full pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categoryData} layout="vertical" margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                        <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickMargin={10} />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '12px', borderColor: 'hsl(var(--border))' }} />
                        <Bar dataKey="value" name="Số bài viết" radius={[0, 4, 4, 0]}>
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={entry.opacity} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>

          {/* Quick Actions Panel */}
          <Card className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:shadow-[0_20px_40px_rgba(0,0,0,0.2)] rounded-xl">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100">Phím tắt thao tác nhanh</CardTitle>
              <CardDescription className="text-xs font-semibold text-slate-400">Các tác vụ thường nhật của quản trị viên</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
              <Button asChild className="w-full bg-slate-900 dark:bg-slate-800 hover:bg-blue-600 dark:hover:bg-blue-600 text-white rounded-lg justify-between h-11 px-4 transition-colors font-bold shadow-md">
                <a href="#landing-page">
                  <span className="flex items-center gap-2">
                    <Layout className="w-4 h-4" /> Thiết kế Landing Page
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </a>
              </Button>
              <Button onClick={handleCreateNewBlog} className="w-full bg-slate-900 dark:bg-slate-800 hover:bg-indigo-600 dark:hover:bg-indigo-600 text-white rounded-lg justify-between h-11 px-4 transition-colors font-bold shadow-md">
                <span className="flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Tạo bài viết Blog mới
                </span>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button asChild className="w-full bg-slate-900 dark:bg-slate-800 hover:bg-emerald-600 dark:hover:bg-emerald-600 text-white rounded-lg justify-between h-11 px-4 transition-colors font-bold shadow-md">
                <a href="#inquiries">
                  <span className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" /> Phản hồi khách hàng
                  </span>
                  <Badge className="bg-red-500 text-white border-none text-[9px] px-1.5 font-black">{newInqs}</Badge>
                </a>
              </Button>
              <Button onClick={handleUploadFakeMedia} className="w-full bg-slate-900 dark:bg-slate-800 hover:bg-amber-600 dark:hover:bg-amber-600 text-white rounded-lg justify-between h-11 px-4 transition-colors font-bold shadow-md">
                <span className="flex items-center gap-2">
                  <CloudUpload className="w-4 h-4" /> Tải ảnh lên Media
                </span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  // --- 2. LANDING PAGE EDITOR TAB ---
  const renderLandingPageEditor = () => {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full max-h-[1000px] animate-fadeIn pb-6">
        {/* Editor Settings Panel (Left side) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:shadow-[0_20px_40px_rgba(0,0,0,0.2)] rounded-xl p-5 md:p-6 space-y-6 overflow-y-auto max-h-[850px] scrollbar-thin">
          <div className="border-b pb-4 dark:border-slate-800">
            <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-blue-600" /> Cấu hình Landing Page
            </h2>
            <p className="text-[11px] font-semibold text-slate-400 mt-1">Thay đổi nội dung hiển thị ngay lập tức</p>
          </div>

          {/* Section: Branding */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">1. Thương hiệu & Đầu trang</h3>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Logo hiển thị (Text Logo)</label>
              <Input value={landingConfig.logoText} onChange={(e) => setLandingConfig({...landingConfig, logoText: e.target.value})} className="rounded-xl h-10 font-medium text-xs dark:bg-slate-950 border-slate-200/80" />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Hotline hỗ trợ khách hàng</label>
              <Input value={landingConfig.supportPhone} onChange={(e) => setLandingConfig({...landingConfig, supportPhone: e.target.value})} className="rounded-xl h-10 font-medium text-xs dark:bg-slate-950 border-slate-200/80" />
            </div>
          </div>

          {/* Section: Hero Banner */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">2. Khối tiêu điểm (Hero Banner)</h3>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Tiêu đề chính (Headline)</label>
              <textarea value={landingConfig.heroTitle} onChange={(e) => setLandingConfig({...landingConfig, heroTitle: e.target.value})} rows={3} className="w-full p-3 rounded-xl text-xs font-medium dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Mô tả phụ (Sub-headline)</label>
              <textarea value={landingConfig.heroSub} onChange={(e) => setLandingConfig({...landingConfig, heroSub: e.target.value})} rows={4} className="w-full p-3 rounded-xl text-xs font-medium dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
          </div>

          {/* Section: Accent Colors & Buttons */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">3. Màu sắc & Nút bấm</h3>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Màu sắc chủ đạo (Accent Hex Color)</label>
              <div className="flex gap-2">
                <Input value={landingConfig.accentColor} onChange={(e) => setLandingConfig({...landingConfig, accentColor: e.target.value})} className="rounded-xl h-10 font-bold text-xs dark:bg-slate-950 border-slate-200/80" />
                <input type="color" value={landingConfig.accentColor} onChange={(e) => setLandingConfig({...landingConfig, accentColor: e.target.value})} className="w-10 h-10 p-0 rounded-xl border border-slate-200 cursor-pointer overflow-hidden bg-transparent" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Nút chính (Primary)</label>
                <Input value={landingConfig.primaryButtonText} onChange={(e) => setLandingConfig({...landingConfig, primaryButtonText: e.target.value})} className="rounded-xl h-10 text-xs dark:bg-slate-950 border-slate-200/80" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Nút phụ (Secondary)</label>
                <Input value={landingConfig.secondaryButtonText} onChange={(e) => setLandingConfig({...landingConfig, secondaryButtonText: e.target.value})} className="rounded-xl h-10 text-xs dark:bg-slate-950 border-slate-200/80" />
              </div>
            </div>
          </div>

          {/* Section: Campaign & Pricing Toggles */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">4. Chiến dịch & Bảng giá</h3>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <div>
                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100 block">Hiển thị bảng giá dịch vụ</span>
                <span className="text-[9px] font-semibold text-slate-400 block mt-0.5">Tắt để chuyển sang nút Liên hệ trực tiếp</span>
              </div>
              <Switch checked={landingConfig.showPricing} onCheckedChange={(val) => setLandingConfig({...landingConfig, showPricing: val})} />
            </div>
            
            {landingConfig.showPricing && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Gói Khởi nghiệp</label>
                  <Input value={landingConfig.pricingPlanBasic} onChange={(e) => setLandingConfig({...landingConfig, pricingPlanBasic: e.target.value})} className="rounded-xl h-9 text-xs dark:bg-slate-950 border-slate-200/80" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Gói Chuyên nghiệp</label>
                  <Input value={landingConfig.pricingPlanPro} onChange={(e) => setLandingConfig({...landingConfig, pricingPlanPro: e.target.value})} className="rounded-xl h-9 text-xs dark:bg-slate-950 border-slate-200/80" />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Mã khuyến mãi</label>
                <Input value={landingConfig.promoCode} onChange={(e) => setLandingConfig({...landingConfig, promoCode: e.target.value})} className="rounded-xl h-9 text-xs dark:bg-slate-950 border-slate-200/80" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Nội dung ưu đãi</label>
                <Input value={landingConfig.promoDiscount} onChange={(e) => setLandingConfig({...landingConfig, promoDiscount: e.target.value})} className="rounded-xl h-9 text-xs dark:bg-slate-950 border-slate-200/80" />
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="pt-4 border-t dark:border-slate-800 flex gap-3">
            <Button onClick={() => handleSaveLandingConfig(false)} variant="outline" className="flex-1 rounded-lg h-11 text-xs font-bold border-slate-200">
              <Save className="w-4 h-4 mr-2" /> Lưu nháp
            </Button>
            <Button onClick={() => handleSaveLandingConfig(true)} className="flex-1 rounded-lg h-11 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md">
              <Globe className="w-4 h-4 mr-2" /> Xuất bản live
            </Button>
          </div>
        </div>

        {/* Live Device Simulator mockup Panel (Right side) */}
        <div className="lg:col-span-8 flex flex-col space-y-4 h-full max-h-[850px]">
          {/* Simulator controls */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:shadow-[0_20px_40px_rgba(0,0,0,0.2)] rounded-xl p-4 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Khung xem trước màn hình (Live Site Preview)</span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200/40 dark:border-slate-800">
                <Button onClick={() => setPreviewDevice("desktop")} size="icon" variant={previewDevice === 'desktop' ? 'default' : 'ghost'} className="w-8 h-8 rounded-xl">
                  <Laptop className="w-4 h-4" />
                </Button>
                <Button onClick={() => setPreviewDevice("tablet")} size="icon" variant={previewDevice === 'tablet' ? 'default' : 'ghost'} className="w-8 h-8 rounded-xl">
                  <Tablet className="w-4 h-4" />
                </Button>
                <Button onClick={() => setPreviewDevice("mobile")} size="icon" variant={previewDevice === 'mobile' ? 'default' : 'ghost'} className="w-8 h-8 rounded-xl">
                  <Smartphone className="w-4 h-4" />
                </Button>
              </div>
              
              <Button onClick={() => setLandingConfig({...landingConfig, isDarkPreview: !landingConfig.isDarkPreview})} variant="outline" size="sm" className="rounded-lg text-[11px] font-bold border-slate-200">
                {landingConfig.isDarkPreview ? "Xem Light Mode" : "Xem Dark Mode"}
              </Button>
            </div>
          </div>

          {/* Browser frame */}
          <div className="flex-1 bg-slate-200 dark:bg-slate-950 rounded-xl overflow-hidden p-6 border border-slate-300/40 dark:border-slate-800/80 flex items-center justify-center max-h-[720px] shadow-inner">
            <div className={`h-full w-full transition-all duration-300 ${
              previewDevice === 'desktop' ? 'max-w-full' :
              previewDevice === 'tablet' ? 'max-w-[580px]' : 'max-w-[345px]'
            } bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg shadow-2xl flex flex-col overflow-hidden`}>
              
              {/* Safari Header Mockup */}
              <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 border-b dark:border-slate-800 flex items-center gap-2 shrink-0">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                </div>
                {/* Search / Address URL Bar */}
                <div className="flex-1 bg-white dark:bg-slate-950 rounded-lg text-[10px] text-slate-500 py-1 px-3 border border-slate-200 dark:border-slate-800 flex items-center justify-center gap-1.5">
                  <Lock className="w-3 h-3 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-500 font-bold">https://</span>
                  <span className="font-semibold text-slate-600 dark:text-slate-300">{customDomain}</span>
                </div>
              </div>

              {/* Web Content Render Container */}
              <div className={`flex-1 overflow-y-auto select-none transition-colors duration-300 ${landingConfig.isDarkPreview ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
                {/* Navbar mockup */}
                <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100/10 shrink-0">
                  <span className="text-sm font-black tracking-tight" style={{ color: landingConfig.accentColor }}>{landingConfig.logoText}</span>
                  <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400">
                    <span>Sản phẩm</span>
                    <span>Giải pháp</span>
                    <span>Báo giá</span>
                  </div>
                  <Button size="sm" className="rounded-full text-[9px] font-black h-7 px-3 text-white" style={{ backgroundColor: landingConfig.accentColor }}>
                    Đăng ký
                  </Button>
                </div>

                {/* Hero Section Mockup */}
                <div className="px-8 py-16 text-center space-y-6 max-w-lg mx-auto">
                  <Badge variant="outline" className="text-[9px] font-bold border-indigo-500/20 text-indigo-400 bg-indigo-500/5 px-2 py-0.5">
                    🚀 Hỗ trợ bán hàng đa kênh & AI
                  </Badge>
                  <h2 className="text-2xl font-black tracking-tight leading-tight">{landingConfig.heroTitle}</h2>
                  <p className="text-xs text-slate-400 leading-relaxed font-medium">{landingConfig.heroSub}</p>
                  
                  <div className="flex justify-center gap-3 pt-2">
                    <Button size="sm" className="rounded-full text-[10px] font-bold h-9 px-4 text-white" style={{ backgroundColor: landingConfig.accentColor }}>
                      {landingConfig.primaryButtonText}
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-full text-[10px] font-bold h-9 px-4 border-slate-800 bg-transparent text-slate-400">
                      {landingConfig.secondaryButtonText}
                    </Button>
                  </div>
                </div>

                {/* Promo Code Box mockup */}
                <div className="mx-8 my-6 p-5 rounded-lg bg-indigo-600/10 border border-indigo-500/20 text-center space-y-2">
                  <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Mã ưu đãi độc quyền</div>
                  <div className="text-lg font-black text-indigo-300 tracking-widest">{landingConfig.promoCode}</div>
                  <div className="text-xs text-slate-300 font-medium">{landingConfig.promoDiscount} khi thanh toán năm</div>
                </div>

                {/* Pricing Plans Mockup */}
                {landingConfig.showPricing && (
                  <div className="px-8 py-8 border-t border-slate-100/10 space-y-6">
                    <div className="text-center space-y-1">
                      <h3 className="text-sm font-black">Bảng giá dịch vụ ưu đãi</h3>
                      <p className="text-[9px] text-slate-500 font-bold">Không phụ phí, không chi phí ẩn</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                        <div className="text-[9px] text-slate-400 font-bold">ZPOS BASIC</div>
                        <div className="text-sm font-black text-slate-100">{landingConfig.pricingPlanBasic}</div>
                        <div className="text-[8px] text-slate-500 leading-tight">Phù hợp hộ kinh doanh nhỏ lẻ, 1 chi nhánh cửa hàng độc lập.</div>
                      </div>
                      <div className="p-4 rounded-xl bg-slate-900 border-2 space-y-2" style={{ borderColor: landingConfig.accentColor }}>
                        <div className="text-[9px] font-bold" style={{ color: landingConfig.accentColor }}>ZPOS PRO</div>
                        <div className="text-sm font-black text-slate-100">{landingConfig.pricingPlanPro}</div>
                        <div className="text-[8px] text-slate-500 leading-tight">Cho chuỗi cửa hàng lớn, quản lý kho tự động đa địa điểm & Voice AI.</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer mockup */}
                <div className="px-8 py-6 border-t border-slate-100/10 text-center text-[9px] text-slate-500 font-medium">
                  © 2026 {landingConfig.logoText}. Hotline: {landingConfig.supportPhone}.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- 3. BLOG MANAGER TAB (ALIGN WITH SUPPLIERS PAGE TABLE) ---
  const renderBlogManager = () => {
    const filteredBlogs = blogPosts.filter(p => {
      const matchSearch = p.title.toLowerCase().includes(blogSearch.toLowerCase()) || 
                          p.author.toLowerCase().includes(blogSearch.toLowerCase());
      const matchCat = blogFilter === "all" || p.category === blogFilter;
      return matchSearch && matchCat;
    });

    return (
      <div className="flex flex-col gap-4 animate-fadeIn">
        {/* Page Header aligned with SuppliersPage */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between border-b pb-4 dark:border-slate-800">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl leading-none tracking-tight">Bài viết Blog</h1>
            <p className="text-muted-foreground text-sm">Quản lý các tin tức và chiến dịch bài viết tiếp thị PR của thương hiệu ZPOS.</p>
          </div>
          <Button onClick={handleCreateNewBlog} className="rounded-xl h-10 px-4 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
            <Plus className="w-4.5 h-4.5 mr-2" /> Tạo bài viết mới
          </Button>
        </div>

        {/* Toolbar aligned with SuppliersPage */}
        <div className="flex items-center gap-2 py-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Tìm theo tên bài viết hoặc tác giả..."
              value={blogSearch}
              onChange={(e) => setBlogSearch(e.target.value)}
              className="pl-10 h-9 rounded-lg"
            />
          </div>
          
          <select 
            value={blogFilter} 
            onChange={(e) => setBlogFilter(e.target.value)}
            className="h-9 px-3 rounded-lg text-xs font-medium dark:bg-slate-900 border border-slate-200 dark:border-slate-800 bg-transparent focus:outline-none"
          >
            <option value="all">Tất cả danh mục</option>
            <option value="Kinh doanh">Kinh doanh</option>
            <option value="Công nghệ">Công nghệ</option>
            <option value="Quản lý">Quản lý</option>
          </select>
        </div>

        {/* Shadcn Table aligned with SuppliersPage */}
        <div className="rounded-md border bg-white dark:bg-slate-900 shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bài viết</TableHead>
                <TableHead>Danh mục</TableHead>
                <TableHead>Thời gian</TableHead>
                <TableHead>Lượt xem</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="w-[80px]">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBlogs.length ? (
                filteredBlogs.map((post) => (
                  <TableRow key={post.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-10 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 border">
                          <img src={post.coverImage} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-slate-800 dark:text-slate-100 truncate max-w-[320px]">{post.title}</span>
                          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">
                            Tác giả: {post.author}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] font-bold px-1.5 border-slate-200 dark:border-slate-800">
                        {post.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      <div className="flex flex-col">
                        <span>{post.publishedAt}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{post.readTime} đọc</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {post.views.toLocaleString()} views
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary" 
                        className={post.status === 'published' 
                          ? "text-[10px] px-1.5 h-5 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-none font-bold uppercase tracking-wider" 
                          : "text-[10px] px-1.5 h-5 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-none font-bold uppercase tracking-wider"
                        }
                      >
                        {post.status === 'published' ? "Đã đăng" : "Bản nháp"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 rounded-full">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Hành động</DropdownMenuLabel>
                          <DropdownMenuItem className="gap-2" onClick={() => handleEditBlog(post)}>
                            <PenTool className="w-4 h-4" /> Chỉnh sửa bài viết
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2" onClick={() => {
                            const updated = blogPosts.map(p => p.id === post.id ? { ...p, status: p.status === 'published' ? 'draft' as const : 'published' as const } : p);
                            setBlogPosts(updated);
                            toast.success("Đã thay đổi trạng thái bài viết");
                          }}>
                            <RefreshCw className="w-4 h-4" /> {post.status === 'published' ? "Chuyển thành bản nháp" : "Yêu cầu đăng tải"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive font-medium gap-2" 
                            onClick={() => {
                              setDeleteBlogId(post.id);
                              setDeleteBlogAlertOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4" /> Xóa bài viết
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-40 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 opacity-50">
                      <FileText className="w-12 h-12 text-slate-400" />
                      <span className="text-sm">Không tìm thấy bài viết blog phù hợp.</span>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Global Blog Delete Dialog */}
        <AlertDialog open={deleteBlogAlertOpen} onOpenChange={setDeleteBlogAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xác nhận xóa bài viết?</AlertDialogTitle>
              <AlertDialogDescription>
                Hành động này sẽ gỡ bỏ hoàn toàn bài viết này ra khỏi website giới thiệu ZPOS. Bạn không thể khôi phục lại dữ liệu này.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteBlogId(null)}>Hủy bỏ</AlertDialogCancel>
              <AlertDialogAction 
                onClick={async () => {
                  if (deleteBlogId) {
                    try {
                      const res = await fetch(`/api/admin/blogs?id=${deleteBlogId}`, { method: "DELETE" });
                      const json = await res.json();
                      if (json.success) {
                        setBlogPosts(blogPosts.filter(p => p.id !== deleteBlogId));
                        toast.success("Đã xóa bài viết khỏi cơ sở dữ liệu");
                      } else {
                        toast.error("Không thể xóa bài viết: " + json.error);
                      }
                    } catch (err: any) {
                      toast.error("Lỗi kết nối máy chủ: " + err.message);
                    }
                    setDeleteBlogId(null);
                  }
                  setDeleteBlogAlertOpen(false);
                }}  
                className="bg-destructive hover:bg-destructive/90 text-white"
              >
                Xác nhận xóa
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  };

  // --- 4. BLOG COMPOSER EDITOR ---
  const renderBlogEditorInline = () => {
    return (
      <div className="space-y-6 animate-fadeIn pb-12">
        <div className="flex justify-between items-center border-b pb-4 dark:border-slate-800">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl leading-none tracking-tight flex items-center gap-2">
              <PenTool className="w-6 h-6 text-indigo-500" /> 
              {editingPost ? "Chỉnh sửa bài viết" : "Viết bài viết mới"}
            </h1>
            <p className="text-muted-foreground text-sm">Soạn thảo trực quan, tự động kiểm tra tối ưu hóa SEO và độ tương phản từ khóa.</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => window.location.hash = "#blog"} variant="outline" className="rounded-xl text-xs font-bold border-slate-200">
              Hủy
            </Button>
            <Button onClick={handleSaveBlog} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 shadow-sm">
              Lưu bài viết
            </Button>
          </div>
        </div>

        {/* Editor Body Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Side: General Write Form (8 cols) */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:shadow-[0_20px_40px_rgba(0,0,0,0.2)] rounded-xl p-5 md:p-6 space-y-6">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Tiêu đề bài viết (Blog Title)</label>
              <Input value={editorTitle} onChange={(e) => setEditorTitle(e.target.value)} placeholder="Nhập tiêu đề hấp dẫn..." className="rounded-xl h-11 text-xs font-bold dark:bg-slate-950 border-slate-200/80" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Danh mục</label>
                <select value={editorCategory} onChange={(e) => setEditorCategory(e.target.value)} className="w-full h-10 px-3 rounded-xl text-xs font-bold dark:bg-slate-950 border border-slate-200 dark:border-slate-800 bg-transparent focus:outline-none">
                  <option value="Kinh doanh">Kinh doanh</option>
                  <option value="Công nghệ">Công nghệ</option>
                  <option value="Quản lý">Quản lý</option>
                  <option value="Sự kiện">Sự kiện</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Trạng thái xuất bản</label>
                <select value={editorStatus} onChange={(e) => setEditorStatus(e.target.value as any)} className="w-full h-10 px-3 rounded-xl text-xs font-bold dark:bg-slate-950 border border-slate-200 dark:border-slate-800 bg-transparent focus:outline-none">
                  <option value="draft">Bản nháp (Draft)</option>
                  <option value="published">Xuất bản (Live)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Đường dẫn tĩnh (Slug URL)</label>
                <Input value={editorSlug} onChange={(e) => setEditorSlug(e.target.value)} placeholder="tieu-de-viet-lien-khong-dau" className="rounded-xl h-10 text-xs font-semibold dark:bg-slate-950 border-slate-200/80" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Thời gian đọc (Phút)</label>
                <Input value={editorReadTime} onChange={(e) => setEditorReadTime(e.target.value)} placeholder="5 phút" className="rounded-xl h-10 text-xs font-medium dark:bg-slate-950 border-slate-200/80" />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Tệp ảnh đại diện (Cover Image URL)</label>
                <Input value={editorCoverImage} onChange={(e) => setEditorCoverImage(e.target.value)} placeholder="https://unsplash.com/..." className="rounded-xl h-10 text-xs font-medium dark:bg-slate-950 border-slate-200/80" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Tóm tắt ngắn (Excerpt)</label>
              <textarea value={editorSummary} onChange={(e) => setEditorSummary(e.target.value)} placeholder="Nhập một đoạn tóm tắt ngắn làm mô tả SEO bài viết..." rows={2} className="w-full p-3 rounded-xl text-xs font-medium dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Nội dung chi tiết bài viết (Markdown supported)</label>
              <textarea value={editorContent} onChange={(e) => setEditorContent(e.target.value)} placeholder="Bắt đầu viết nội dung tại đây..." rows={12} className="w-full p-4 rounded-xl text-xs font-medium dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono" />
            </div>
          </div>

          {/* Right Side: AI SEO Assistant (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* AI Assistant Core Box */}
            <Card className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:shadow-[0_20px_40px_rgba(0,0,0,0.2)] rounded-xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse fill-yellow-300" /> Trợ lý Viết bài AI
                </CardTitle>
                <CardDescription className="text-indigo-100 text-[10px] font-bold uppercase tracking-wider">Phân tích điểm SEO tự động</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Circular SEO Score Gauge */}
                <div className="flex flex-col items-center space-y-2">
                  <div className="relative w-28 h-28 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="56" cy="56" r="48" stroke="#f1f5f9" strokeWidth="8" fill="transparent" className="dark:stroke-slate-800" />
                      <circle cx="56" cy="56" r="48" stroke="#6366f1" strokeWidth="8" fill="transparent" strokeDasharray="301.6" strokeDashoffset={301.6 - (301.6 * seoAnalysis.score) / 100} strokeLinecap="round" className="transition-all duration-1000" />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-2xl font-black text-slate-800 dark:text-slate-100">{seoAnalysis.score}</span>
                      <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Điểm SEO</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-center text-slate-500 dark:text-slate-400 max-w-[200px]">
                    {seoAnalysis.feedback}
                  </span>
                </div>

                {/* Analyzed Keywords list */}
                <div className="space-y-2">
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Từ khóa phát hiện (Keywords)</div>
                  <div className="flex flex-wrap gap-1.5">
                    {seoAnalysis.keywords.map((kw, i) => (
                      <Badge key={i} variant="secondary" className="text-[9px] bg-slate-100 dark:bg-slate-800 border-none font-bold text-slate-600 dark:text-slate-400 px-2 py-0.5">
                        {kw}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* AI helper action buttons */}
                <div className="space-y-2 pt-2">
                  <Button onClick={triggerAiSeoAnalyze} variant="outline" className="w-full rounded-xl h-10 text-xs font-bold border-slate-200">
                    <RefreshCw className="w-3.5 h-3.5 mr-2" /> Cập nhật phân tích SEO
                  </Button>
                  <Button onClick={() => {
                    toast.success("AI đã tối ưu hóa tiêu đề chu đáo!");
                    setEditorTitle("Hướng dẫn " + editorTitle);
                  }} variant="outline" className="w-full rounded-xl h-10 text-xs font-bold border-slate-200 text-indigo-600 hover:text-indigo-700">
                    <Sparkles className="w-3.5 h-3.5 mr-2" /> Viết lại Headline hấp dẫn
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  };

  // --- 5. MEDIA LIBRARY TAB ---
  const renderMediaGallery = () => {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full max-h-[850px] animate-fadeIn pb-6">
        {/* Files Grid (8 cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:shadow-[0_20px_40px_rgba(0,0,0,0.2)] rounded-xl p-5 md:p-6 space-y-6 flex flex-col h-full max-h-[800px]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl leading-none tracking-tight">Thư viện Media</h1>
              <p className="text-muted-foreground text-sm">Hình ảnh, bài đăng và tài liệu quảng cáo trang chủ.</p>
            </div>
            
            <div className="flex gap-2">
              <div className="relative w-44">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <Input value={mediaSearch} onChange={(e) => setMediaSearch(e.target.value)} placeholder="Tìm tệp tin..." className="rounded-xl pl-9 h-9 text-xs font-medium dark:bg-slate-950 border-slate-200/80" />
              </div>
              <Button onClick={handleUploadFakeMedia} className="rounded-xl h-9 text-xs font-bold bg-blue-600 text-white">
                <CloudUpload className="w-4 h-4 mr-2" /> Tải lên
              </Button>
            </div>
          </div>

          {/* Grid file container */}
          <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-2 md:grid-cols-4 gap-4 scrollbar-thin">
            {mediaItems.filter(m => m.name.toLowerCase().includes(mediaSearch.toLowerCase())).map((item) => {
              const isSelected = selectedMedia && selectedMedia.id === item.id;
              return (
                <div key={item.id} onClick={() => setSelectedMedia(item)} className={`group rounded-lg overflow-hidden border p-2 flex flex-col cursor-pointer transition-all ${
                  isSelected ? 'border-blue-650 bg-blue-50/50 dark:bg-blue-950/20' : 'border-slate-200/60 dark:border-slate-800/80 hover:border-slate-400 hover:scale-[1.02]'
                }`}>
                  <div className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-950 flex items-center justify-center relative shrink-0">
                    {item.type === 'image' ? (
                      <img src={item.url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <FileText className="w-10 h-10 text-slate-400" />
                    )}
                  </div>
                  
                  <div className="pt-2 flex-1 flex flex-col justify-between">
                    <span className="text-[10px] font-black text-slate-800 dark:text-slate-100 truncate block">{item.name}</span>
                    <span className="text-[9px] font-bold text-slate-400 block mt-0.5">{item.size}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar Info Details (4 cols) */}
        <div className="lg:col-span-4 h-full max-h-[800px]">
          <Card className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:shadow-[0_20px_40px_rgba(0,0,0,0.2)] rounded-xl h-full flex flex-col overflow-hidden">
            <CardHeader className="border-b dark:border-slate-800 shrink-0">
              <CardTitle className="text-base font-bold text-slate-800 dark:text-slate-100">Chi tiết tệp tin</CardTitle>
              <CardDescription className="text-xs font-semibold text-slate-400">Xem và sao chép mã liên kết CDN</CardDescription>
            </CardHeader>
            
            {selectedMedia ? (
              <CardContent className="p-5 flex-1 flex flex-col justify-between overflow-y-auto">
                <div className="space-y-6">
                  {/* File large preview */}
                  <div className="aspect-video w-full rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-950 border border-slate-200/40 dark:border-slate-800 flex items-center justify-center shrink-0">
                    {selectedMedia.type === 'image' ? (
                      <img src={selectedMedia.url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <FileText className="w-16 h-16 text-slate-400" />
                    )}
                  </div>

                  {/* Metadata fields list */}
                  <div className="space-y-4">
                    {[
                      { label: "Tên tệp tin", value: selectedMedia.name },
                      { label: "Kích thước vật lý", value: selectedMedia.size },
                      { label: "Thời gian đăng tải", value: selectedMedia.uploadedAt },
                      { label: "Loại định dạng", value: selectedMedia.type.toUpperCase() },
                    ].map((row, i) => (
                      <div key={i} className="flex justify-between items-center text-xs border-b pb-2 dark:border-slate-800 last:border-0">
                        <span className="font-bold text-slate-400">{row.label}</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300 truncate max-w-[150px]">{row.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Copy link box */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Đường dẫn CDN công khai</label>
                    <div className="flex gap-1.5 bg-slate-50 dark:bg-slate-950 p-2 rounded-xl border border-slate-200/60 dark:border-slate-850">
                      <span className="text-[10px] font-bold text-slate-500 truncate flex-1 leading-6">{selectedMedia.url}</span>
                      <Button onClick={() => handleCopyText(selectedMedia.url, "URL Media")} size="icon" variant="ghost" className="w-6 h-6 rounded-lg">
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Danger actions */}
                <div className="pt-6 border-t dark:border-slate-800 shrink-0">
                  <Button onClick={() => handleDeleteMedia(selectedMedia.id)} className="w-full bg-red-500 hover:bg-red-600 text-white rounded-lg h-11 text-xs font-bold">
                    <Trash2 className="w-4 h-4 mr-2" /> Xóa vĩnh viễn tệp này
                  </Button>
                </div>
              </CardContent>
            ) : (
              <CardContent className="p-5 flex-1 flex flex-col items-center justify-center text-center text-slate-400">
                <ImageIcon className="w-12 h-12 text-slate-300 dark:text-slate-800" />
                <span className="text-xs font-bold mt-2">Chọn một tệp từ thư viện để xem thông tin chi tiết</span>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    );
  };

  // --- 6. CONSULTATION LEADS SHEET (ALIGN WITH APP SUPPLIERS MULTI-LAYOUT) ---
  const renderInquiriesManager = () => {
    const filteredInquiries = inquiries.filter(inq => {
      const matchSearch = inq.customerName.toLowerCase().includes(inquirySearch.toLowerCase()) || 
                          inq.customerPhone.includes(inquirySearch) ||
                          inq.customerEmail.toLowerCase().includes(inquirySearch.toLowerCase());
      const matchStatus = inquiryFilter === "all" || inq.status === inquiryFilter;
      return matchSearch && matchStatus;
    });

    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full max-h-[850px] animate-fadeIn pb-6">
        {/* Inquiries Table (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:shadow-[0_20px_40px_rgba(0,0,0,0.2)] rounded-xl p-5 md:p-6 space-y-6 flex flex-col h-full max-h-[800px]">
          <div className="flex flex-col gap-1 border-b pb-4 dark:border-slate-800 shrink-0">
            <h1 className="text-3xl leading-none tracking-tight">Yêu cầu tư vấn (Leads)</h1>
            <p className="text-muted-foreground text-sm">Danh sách đăng ký tư vấn khách hàng tiềm năng nhận được từ trang giới thiệu sản phẩm ZPOS.</p>
          </div>

          {/* Search bar & filter */}
          <div className="flex items-center gap-2 py-2 shrink-0">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Tìm khách hàng, email, điện thoại..."
                value={inquirySearch}
                onChange={(e) => setInquirySearch(e.target.value)}
                className="pl-10 h-9 rounded-lg"
              />
            </div>
            
            <select 
              value={inquiryFilter} 
              onChange={(e) => setInquiryFilter(e.target.value)}
              className="h-9 px-3 rounded-lg text-xs font-medium dark:bg-slate-900 border border-slate-200 dark:border-slate-800 bg-transparent focus:outline-none"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="new">Khách hàng mới</option>
              <option value="contacted">Đang tư vấn</option>
              <option value="completed">Đã hoàn tất</option>
            </select>
          </div>

          {/* Shadcn Table aligned with SuppliersPage */}
          <div className="flex-1 overflow-y-auto rounded-md border scrollbar-thin">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Nội dung</TableHead>
                  <TableHead>Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInquiries.length ? (
                  filteredInquiries.map((inq) => {
                    const isSelected = selectedInquiry && selectedInquiry.id === inq.id;
                    return (
                      <TableRow 
                        key={inq.id} 
                        onClick={() => setSelectedInquiry(inq)}
                        className={`cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/40 ${
                          isSelected ? 'bg-blue-50/30 dark:bg-blue-950/20' : ''
                        }`}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center border border-primary/10 font-bold text-xs text-primary">
                              {inq.customerName.charAt(0)}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-bold text-slate-800 dark:text-slate-100">{inq.customerName}</span>
                              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">{inq.customerPhone}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[200px] truncate text-xs text-slate-500 dark:text-slate-400 font-medium">
                            {inq.message}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="secondary" 
                            className={
                              inq.status === 'new' ? "text-[10px] px-1.5 h-5 bg-red-500/10 text-red-600 border-none font-bold uppercase tracking-wider" :
                              inq.status === 'contacted' ? "text-[10px] px-1.5 h-5 bg-amber-500/10 text-amber-600 border-none font-bold uppercase tracking-wider" :
                              "text-[10px] px-1.5 h-5 bg-emerald-500/10 text-emerald-600 border-none font-bold uppercase tracking-wider"
                            }
                          >
                            {inq.status === 'new' ? "Mới" : inq.status === 'contacted' ? "Đang tư vấn" : "Đã liên hệ"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="h-40 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 opacity-50">
                        <MessageSquare className="w-12 h-12 text-slate-400" />
                        <span className="text-sm">Không tìm thấy yêu cầu tư vấn nào.</span>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Detailed CRM Customer Card Sheet (5 cols) */}
        <div className="lg:col-span-5 h-full max-h-[800px]">
          <Card className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:shadow-[0_20px_40px_rgba(0,0,0,0.2)] rounded-xl h-full flex flex-col overflow-hidden">
            <CardHeader className="border-b dark:border-slate-800 shrink-0">
              <CardTitle className="text-base font-bold text-slate-800 dark:text-slate-100">Chi tiết chăm sóc</CardTitle>
              <CardDescription className="text-xs font-semibold text-slate-400">Thông tin liên lạc & dòng lịch sử cuộc gọi</CardDescription>
            </CardHeader>
            
            {selectedInquiry ? (
              <CardContent className="p-5 flex-1 flex flex-col justify-between overflow-y-auto">
                <div className="space-y-6">
                  {/* Contacts block */}
                  <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-950 border space-y-3">
                    <div className="flex items-center gap-2.5 text-xs">
                      <User className="w-4 h-4 text-slate-400" />
                      <span className="font-bold text-slate-700 dark:text-slate-300">{selectedInquiry.customerName}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs border-t pt-2.5 dark:border-slate-850">
                      <span className="flex items-center gap-2.5">
                        <Mail className="w-4 h-4 text-slate-400" />
                        <span className="font-semibold text-slate-600 dark:text-slate-400 truncate max-w-[180px]">{selectedInquiry.customerEmail}</span>
                      </span>
                      <Button onClick={() => handleCopyText(selectedInquiry.customerEmail, "Email")} size="icon" variant="ghost" className="w-6 h-6 rounded-lg">
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between text-xs border-t pt-2.5 dark:border-slate-850">
                      <span className="flex items-center gap-2.5">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <span className="font-black text-slate-800 dark:text-slate-200">{selectedInquiry.customerPhone}</span>
                      </span>
                      <Button onClick={() => handleCopyText(selectedInquiry.customerPhone, "Số điện thoại")} size="icon" variant="ghost" className="w-6 h-6 rounded-lg text-blue-600">
                        <Phone className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Consultation Status select */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Trạng thái xử lý</label>
                    <select 
                      value={selectedInquiry.status} 
                      onChange={(e) => handleUpdateInquiryStatus(selectedInquiry.id, e.target.value as any)}
                      className="w-full h-10 px-3 rounded-xl text-xs font-bold dark:bg-slate-950 border border-slate-200 dark:border-slate-850 bg-transparent focus:outline-none"
                    >
                      <option value="new">Yêu cầu mới nhận (New Lead)</option>
                      <option value="contacted">Đang gọi điện tư vấn (Contacted)</option>
                      <option value="completed">Đã hoàn tất hỗ trợ (Completed)</option>
                    </select>
                  </div>

                  {/* Consultation Message */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Nội dung yêu cầu</label>
                    <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200/40 text-xs font-semibold text-slate-600 dark:text-slate-400 leading-relaxed">
                      {selectedInquiry.message}
                    </div>
                  </div>

                  {/* Operator Notes Timeline (Chat-style) */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Nhật ký xử lý (Timeline)</label>
                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                      {selectedInquiry.notes.map((note, idx) => (
                        <div key={idx} className="p-3 rounded-lg bg-indigo-50/60 dark:bg-slate-950 text-xs border-l-4 border-indigo-500 font-semibold text-slate-600 dark:text-slate-400">
                          {note}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Input box for new note */}
                <div className="pt-6 border-t dark:border-slate-800 space-y-2 shrink-0">
                  <div className="flex gap-2">
                    <Input value={noteInput} onChange={(e) => setNoteInput(e.target.value)} placeholder="Nhập ghi chú chăm sóc..." className="rounded-xl h-10 text-xs font-medium dark:bg-slate-950 border-slate-200/80" onKeyDown={(e) => e.key === 'Enter' && handleAddInquiryNote()} />
                    <Button onClick={handleAddInquiryNote} size="icon" className="w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            ) : (
              <CardContent className="p-5 flex-1 flex flex-col items-center justify-center text-center text-slate-400">
                <MessageSquare className="w-12 h-12 text-slate-300 dark:text-slate-800" />
                <span className="text-xs font-bold mt-2">Chọn khách hàng để xem tiến độ liên hệ</span>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    );
  };

  // --- 7. DATABASE BACKUPS & DNS RECORDS SETTINGS ---
  const renderSettings = () => {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full max-h-[850px] animate-fadeIn pb-6">
        {/* Core domains & SMTP parameters (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:shadow-[0_20px_40px_rgba(0,0,0,0.2)] rounded-xl p-5 md:p-6 space-y-6 overflow-y-auto max-h-[800px] scrollbar-thin">
          <div className="border-b pb-4 dark:border-slate-800">
            <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">Cấu hình Hệ thống CMS</h2>
            <p className="text-[11px] font-semibold text-slate-400 mt-1">Cấu hình tên miền trỏ về, cổng thư báo giá SMTP</p>
          </div>

          {/* Domain Setup */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
              <Globe className="w-4 h-4" /> 1. Tên miền trỏ về (Custom Domain Mapping)
            </h3>
            
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Tên miền chính (Domain Name)</label>
              <div className="flex gap-2">
                <Input value={customDomain} onChange={(e) => setCustomDomain(e.target.value)} placeholder="domain.com" className="rounded-xl h-10 font-bold text-xs dark:bg-slate-950 border-slate-200/80" />
                <Button onClick={() => {
                  setDomainVerified(true);
                  toast.success("Trỏ tên miền thành công! Bản ghi CNAME đã hoàn thành phân giải.");
                }} className="rounded-xl bg-blue-600 text-white text-xs font-bold px-4">
                  Cập nhật
                </Button>
              </div>
            </div>

            {/* DNS details CNAME boxes */}
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200/40 space-y-3">
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex justify-between items-center">
                <span>Cấu hình bản ghi DNS yêu cầu tại Cloudflare/Godaddy</span>
                {domainVerified ? (
                  <Badge className="bg-emerald-500 text-white border-none text-[8px] font-black">HOẠT ĐỘNG</Badge>
                ) : (
                  <Badge className="bg-amber-500 text-white border-none text-[8px] font-black">CHƯA XÁC MINH</Badge>
                )}
              </div>

              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-slate-400 border-b pb-1">
                  <span className="col-span-2">Loại</span>
                  <span className="col-span-3">Tên (Host)</span>
                  <span className="col-span-5">Giá trị trỏ về (Value/Target)</span>
                  <span className="col-span-2 text-right">TTL</span>
                </div>
                
                <div className="grid grid-cols-12 gap-2 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  <span className="col-span-2 text-blue-600">CNAME</span>
                  <span className="col-span-3">@</span>
                  <span className="col-span-5 truncate text-slate-500">cname.zpos.click</span>
                  <span className="col-span-2 text-right text-slate-400">Auto</span>
                </div>
              </div>
            </div>
          </div>

          {/* SMTP Setup */}
          <div className="space-y-4 pt-4 border-t dark:border-slate-800">
            <h3 className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
              <Mail className="w-4 h-4" /> 2. Cổng thư báo giá tự động (SMTP Server)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Máy chủ SMTP</label>
                <Input value={smtpServer} onChange={(e) => setSmtpServer(e.target.value)} className="rounded-xl h-10 text-xs font-medium dark:bg-slate-950 border-slate-200/80" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Tài khoản SMTP</label>
                <Input value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)} className="rounded-xl h-10 text-xs font-medium dark:bg-slate-950 border-slate-200/80" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Cổng Port</label>
                <Input value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} className="rounded-xl h-10 text-xs font-medium dark:bg-slate-950 border-slate-200/80" />
              </div>
            </div>
          </div>
        </div>

        {/* Database backup logs & status (5 cols) */}
        <div className="lg:col-span-5 h-full max-h-[800px]">
          <Card className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:shadow-[0_20px_40px_rgba(0,0,0,0.2)] rounded-xl h-full flex flex-col overflow-hidden">
            <CardHeader className="border-b dark:border-slate-800 shrink-0">
              <CardTitle className="text-base font-bold text-slate-800 dark:text-slate-100">Bản sao lưu cơ sở dữ liệu (Backups)</CardTitle>
              <CardDescription className="text-xs font-semibold text-slate-400">Quản lý các điểm phục hồi vật lý</CardDescription>
            </CardHeader>
            
            <CardContent className="p-5 flex-1 flex flex-col justify-between overflow-y-auto">
              <div className="space-y-4">
                <div className="flex justify-between items-center shrink-0">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Lịch sử sao lưu gần nhất</span>
                  <Button onClick={handleTriggerBackup} size="sm" className="rounded-xl text-[10px] font-bold h-8 bg-blue-600 text-white">
                    <Database className="w-3.5 h-3.5 mr-1" /> Backup ngay
                  </Button>
                </div>

                <div className="space-y-2 overflow-y-auto max-h-[420px] pr-1">
                  {backups.map((bk) => (
                    <div key={bk.id} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200 block truncate max-w-[160px]">{bk.version}</span>
                        <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold block mt-0.5">{bk.createdAt}</span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-500">{bk.size}</span>
                        {bk.status === 'success' ? (
                          <Badge className="bg-green-500 text-white border-none text-[8px] font-black">XONG</Badge>
                        ) : (
                          <Badge className="bg-red-500 text-white border-none text-[8px] font-black">LỖI</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recovery description */}
              <div className="p-4 rounded-lg bg-blue-50/50 dark:bg-slate-950 border border-blue-200/20 text-[11px] font-semibold leading-relaxed text-slate-600 dark:text-slate-400 shrink-0">
                <AlertTriangle className="w-4 h-4 text-blue-600 inline mr-1" />
                Mỗi tệp tin sao lưu được mã hóa theo chuẩn AES-256 và lưu trữ cách ly hoàn toàn. Vui lòng liên hệ quản trị hệ thống để kích hoạt điểm khôi phục (Restore Point).
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  // ==========================================
  // MAIN BODY RENDERER (SPA TAB CONDITIONAL RENDER)
  // ==========================================
  return (
    <div className="w-full h-full max-w-7xl mx-auto space-y-6">
      {/* SPA Layout Body Container */}
      <div className="w-full">
        {activeTab === "dashboard" && renderDashboard()}
        {activeTab === "landing-page" && renderLandingPageEditor()}
        {activeTab === "blog" && renderBlogManager()}
        {activeTab === "blog-editor" && renderBlogEditorInline()}
        {activeTab === "media" && renderMediaGallery()}
        {activeTab === "inquiries" && renderInquiriesManager()}
        {activeTab === "settings" && renderSettings()}
      </div>
    </div>
  );
}
