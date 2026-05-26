"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  ExternalLink,
  Globe,
  Layout,
  Package,
  Settings,
  BarChart,
  Plus,
  Trash2,
  Sparkles,
  Palette,
  Ruler,
  Layers,
  Image as ImageIcon,
  Megaphone,
  BookOpen,
  HelpCircle,
  Save,
  Percent,
  RefreshCw,
  Send,
  CheckCircle,
  ArrowRight,
  X,
  Edit,
  Eye,
  FolderTree,
  ShoppingCart,
  Users,
  Warehouse,
  LayoutTemplate,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { RichTextEditor } from "@/components/rich-text-editor";

interface Color {
  id: string;
  name: string;
  hex_code: string;
  slug: string;
}

interface Size {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
}

interface Variant {
  id: string;
  product_id: string;
  name: string;
  sku?: string;
  barcode?: string;
  price: number;
  cost_price: number;
  image_url?: string;
  color_id?: string;
  size_id?: string;
  stock: number;
  status: "active" | "inactive" | "sold_out";
}

export function StorefrontAdminClient({
  org,
  products: initialProducts,
  orgId,
  initialHomeBlocksJson,
}: {
  org: any;
  products: any[];
  orgId: string;
  initialHomeBlocksJson: string;
}) {
  const [loading, setLoading] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState("dashboard");
  const [storefrontEnabled, setStorefrontEnabled] = useState(org.storefront_enabled || false);
  const [customDomain, setCustomDomain] = useState(org.storefront_custom_domain || "");
  const [domainStatus, setDomainStatus] = useState(org.custom_domain_status || "inactive");
  const [theme, setTheme] = useState(org.storefront_theme || "minimal");
  const [customCss, setCustomCss] = useState(org.storefront_custom_css || "");
  const [customHead, setCustomHead] = useState(org.storefront_custom_head || "");
  const [homeBlocksJson, setHomeBlocksJson] = useState(initialHomeBlocksJson);
  const [bannerSettings, setBannerSettings] = useState(org.storefront_settings?.banner || {
    enabled: true,
    title: "ĐẶC QUYỀN DÀNH CHO",
    count: "529.671",
    suffix: "THÀNH VIÊN CLASSICX CLUB",
    heroImage: "",
    heroTitle: "",
    heroLink: ""
  });
  const [generalSettings, setGeneralSettings] = useState(org.storefront_settings?.general || {
    logo: "",
    favicon: "",
    hotline: "",
    email: "",
    social_facebook: "",
    social_instagram: "",
    social_tiktok: "",
    social_zalo: "",
    address: "",
    working_hours: ""
  });

  // DB States
  const [products, setProducts] = useState<any[]>(initialProducts);
  const [colors, setColors] = useState<Color[]>([]);
  const [sizes, setSizes] = useState<Size[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [lookbooks, setLookbooks] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [blogPosts, setBlogPosts] = useState<any[]>([]);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [seoRedirects, setSeoRedirects] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [pages, setPages] = useState<any[]>([]);

  // Dialog / Form States
  const [newColor, setNewColor] = useState({ name: "", hex_code: "" });
  const [newSize, setNewSize] = useState({ name: "", sort_order: 0 });
  const [newCollection, setNewCollection] = useState({ name: "", slug: "", description: "", banner_image: "" });
  const [newLookbook, setNewLookbook] = useState({ title: "", slug: "", cover_image: "", description: "" });
  const [newCampaign, setNewCampaign] = useState({ name: "", slug: "", banner_image: "", description: "" });
  const [newPromo, setNewPromo] = useState({ name: "", code: "", type: "percentage", value: 10, min_order_value: 0 });
  const [newRedirect, setNewRedirect] = useState({ source_path: "", target_path: "" });
  const [newBlog, setNewBlog] = useState({ title: "", slug: "", excerpt: "", content: "", thumbnail: "" });
  const [newCategory, setNewCategory] = useState({ name: "", is_published_online: true });
  const [newPage, setNewPage] = useState({ title: "", slug: "", content: "", is_published: true });
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  // Size Guide Editor State
  const [editingSizeGuideProduct, setEditingSizeGuideProduct] = useState<any>(null);
  const [sizeGuideContent, setSizeGuideContent] = useState("");

  // Variant Generator States
  const [selectedProductForVariants, setSelectedProductForVariants] = useState<string>("");
  const [activeVariants, setActiveVariants] = useState<Variant[]>([]);
  const [bulkGenPrice, setBulkGenPrice] = useState<number>(0);
  const [bulkGenCost, setBulkGenCost] = useState<number>(0);
  const [bulkGenStock, setBulkGenStock] = useState<number>(10);

  // AI assistant states
  const [aiProductInput, setAiProductInput] = useState("");
  const [aiPromptType, setAiPromptType] = useState<"description" | "seo" | "facebook" | "tiktok">("description");
  const [aiOutput, setAiOutput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPagePrompt, setAiPagePrompt] = useState("");
  const [isGeneratingPage, setIsGeneratingPage] = useState(false);

  const supabase = createClient();

  // Calculate storefront domain dynamically
  const [defaultDomain, setDefaultDomain] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isDev = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    let domain = "";
    if (isDev) {
      const port = window.location.port ? `:${window.location.port}` : "";
      domain = `${org.slug}-shop.localhost${port}`;
    } else {
      // Extract main domain from current hostname (e.g. console.zpos.click -> zpos.click)
      const parts = window.location.hostname.split(".");
      let mainDomain = "zpos.click";
      if (parts.length >= 2) {
        mainDomain = parts.slice(-2).join(".");
      }
      domain = `${org.slug}-shop.${mainDomain}`;
    }
    setDefaultDomain(domain);
  }, [org.slug]);

  // Load all initial databases
  useEffect(() => {
    fetchCMSData();
  }, [orgId]);

  const fetchCMSData = async () => {
    try {
      const { data: cols } = await supabase.from("colors").select("*").eq("organization_id", orgId);
      if (cols) setColors(cols);

      const { data: szs } = await supabase
        .from("sizes")
        .select("*")
        .eq("organization_id", orgId)
        .order("sort_order", { ascending: true });
      if (szs) setSizes(szs);

      const { data: colls } = await supabase.from("collections").select("*").eq("organization_id", orgId);
      if (colls) setCollections(colls);

      const { data: lbs } = await supabase.from("lookbooks").select("*").eq("organization_id", orgId);
      if (lbs) setLookbooks(lbs);

      const { data: camps } = await supabase.from("campaigns").select("*").eq("organization_id", orgId);
      if (camps) setCampaigns(camps);

      const { data: blogs } = await supabase.from("blog_posts").select("*").eq("organization_id", orgId);
      if (blogs) setBlogPosts(blogs);

      const { data: promos } = await supabase.from("promotions").select("*").eq("organization_id", orgId);
      if (promos) setPromotions(promos);

      const { data: redirects } = await supabase.from("seo_redirects").select("*").eq("organization_id", orgId);
      if (redirects) setSeoRedirects(redirects);

      const [cats, pgs] = await Promise.all([
        supabase.from("categories").select("*").eq("organization_id", orgId),
        supabase.from("storefront_pages").select("*").eq("organization_id", orgId),
      ]);
      if (cats.data) setCategories(cats.data);
      if (pgs.data) setPages(pgs.data);

      // Refresh products with full fields
      const { data: prods } = await supabase
        .from("products")
        .select(
          "id, name, is_published_online, online_price, sku, price, image, is_featured, is_new_arrival, is_best_seller",
        )
        .eq("organization_id", orgId)
        .eq("is_active", true);
      if (prods) setProducts(prods);
    } catch (e: any) {
      console.error("Error loading CMS data", e);
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("organizations")
        .update({
          storefront_enabled: storefrontEnabled,
          storefront_theme: theme,
          storefront_custom_css: customCss,
          storefront_custom_head: customHead,
          storefront_settings: {
            ...(org.storefront_settings || {}),
            banner: bannerSettings,
            general: generalSettings,
          },
        })
        .eq("id", orgId);

      if (error) throw error;

      // Save blocks override for page_home
      try {
        const blocksObj = JSON.parse(homeBlocksJson);
        const { error: blockErr } = await supabase.from("storefront_block_overrides").upsert({
          tenant_id: orgId,
          block_type: "page_home",
          props: blocksObj,
        });
        if (blockErr) throw blockErr;
      } catch (e: any) {
        throw new Error("Blocks JSON không hợp lệ: " + e.message);
      }

      // Trigger cache invalidation
      try {
        await fetch(`/api/internal/tenant-cache/invalidate?slug=${org.slug}`, { method: "POST" });
      } catch (e) {
        console.warn("Invalidate cache error", e);
      }

      toast.success("Đã lưu thiết lập cấu hình storefront!");
    } catch (error: any) {
      toast.error(error.message || "Không thể lưu cài đặt");
    } finally {
      setLoading(false);
    }
  };

  const handleAddDomain = async () => {
    if (!customDomain) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("organizations")
        .update({
          storefront_custom_domain: customDomain,
          custom_domain_status: "pending_verification",
        })
        .eq("id", orgId);

      if (error) throw error;
      setDomainStatus("pending_verification");
      toast.success("Đã thêm tên miền tuỳ chỉnh thành công!");
    } catch (error: any) {
      toast.error(error.message || "Thêm tên miền thất bại");
    } finally {
      setLoading(false);
    }
  };

  const toggleProductStatus = async (productId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("products")
        .update({ is_published_online: !currentStatus })
        .eq("id", productId);

      if (error) throw error;
      setProducts(products.map((p) => (p.id === productId ? { ...p, is_published_online: !currentStatus } : p)));
      toast.success("Đã cập nhật trạng thái hiển thị sản phẩm");
    } catch (error: any) {
      toast.error(error.message || "Lỗi cập nhật sản phẩm");
    }
  };

  const handleSaveSizeGuide = async () => {
    if (!editingSizeGuideProduct) return;
    try {
      const { error } = await supabase
        .from("products")
        .update({ size_guide: sizeGuideContent })
        .eq("id", editingSizeGuideProduct.id);

      if (error) throw error;
      setProducts(products.map((p) => (p.id === editingSizeGuideProduct.id ? { ...p, size_guide: sizeGuideContent } : p)));
      toast.success("Đã lưu bảng thông số size");
      setEditingSizeGuideProduct(null);
    } catch (error: any) {
      toast.error(error.message || "Lỗi lưu bảng thông số size. Hãy chắc chắn cột size_guide đã được thêm vào database.");
    }
  };

  const handleSaveProduct = async () => {
    if (!editingProduct) return;
    try {
      const { error } = await supabase
        .from("products")
        .update({
          name: editingProduct.name,
          sku: editingProduct.sku,
          price: editingProduct.price,
          online_price: editingProduct.online_price,
          image: editingProduct.image,
          description: editingProduct.description,
        })
        .eq("id", editingProduct.id);

      if (error) throw error;
      setProducts(products.map((p) => (p.id === editingProduct.id ? editingProduct : p)));
      toast.success("Đã cập nhật sản phẩm thành công");
      setEditingProduct(null);
    } catch (error: any) {
      toast.error(error.message || "Lỗi cập nhật sản phẩm");
    }
  };

  const toggleProductBadge = async (
    productId: string,
    field: "is_featured" | "is_new_arrival" | "is_best_seller",
    currentValue: boolean,
  ) => {
    try {
      const { error } = await supabase
        .from("products")
        .update({ [field]: !currentValue })
        .eq("id", productId);

      if (error) throw error;
      setProducts(products.map((p) => (p.id === productId ? { ...p, [field]: !currentValue } : p)));
      toast.success(`Đã cập nhật trạng thái của sản phẩm`);
    } catch (error: any) {
      toast.error(error.message || "Lỗi cập nhật sản phẩm");
    }
  };

  // Color Manager Actions
  const handleAddColor = async () => {
    if (!newColor.name || !newColor.hex_code) return;
    try {
      const slug = newColor.name.toLowerCase().replace(/\s+/g, "-");
      const { data, error } = await supabase
        .from("colors")
        .insert({
          organization_id: orgId,
          name: newColor.name,
          hex_code: newColor.hex_code,
          slug,
        })
        .select()
        .single();
      if (error) throw error;
      setColors([...colors, data]);
      setNewColor({ name: "", hex_code: "" });
      toast.success("Đã thêm mã màu mới!");
    } catch (error: any) {
      toast.error(error.message || "Lỗi thêm màu");
    }
  };

  const handleDeleteColor = async (id: string) => {
    try {
      const { error } = await supabase.from("colors").delete().eq("id", id);
      if (error) throw error;
      setColors(colors.filter((c) => c.id !== id));
      toast.success("Đã xoá màu sắc thành công!");
    } catch (error: any) {
      toast.error(error.message || "Không thể xoá màu sắc");
    }
  };

  // Size Manager Actions
  const handleAddSize = async () => {
    if (!newSize.name) return;
    try {
      const slug = newSize.name.toLowerCase().replace(/\s+/g, "-");
      const { data, error } = await supabase
        .from("sizes")
        .insert({
          organization_id: orgId,
          name: newSize.name,
          sort_order: Number(newSize.sort_order),
          slug,
        })
        .select()
        .single();
      if (error) throw error;
      setSizes([...sizes, data].sort((a, b) => a.sort_order - b.sort_order));
      setNewSize({ name: "", sort_order: 0 });
      toast.success("Đã thêm kích thước mới!");
    } catch (error: any) {
      toast.error(error.message || "Lỗi thêm size");
    }
  };

  const handleDeleteSize = async (id: string) => {
    try {
      const { error } = await supabase.from("sizes").delete().eq("id", id);
      if (error) throw error;
      setSizes(sizes.filter((s) => s.id !== id));
      toast.success("Đã xoá kích thước thành công!");
    } catch (error: any) {
      toast.error(error.message || "Không thể xoá kích thước");
    }
  };

  // Collection Actions
  const handleAddCollection = async () => {
    if (!newCollection.name) return;
    try {
      const slug = newCollection.slug || newCollection.name.toLowerCase().replace(/\s+/g, "-");
      const { data, error } = await supabase
        .from("collections")
        .insert({
          organization_id: orgId,
          name: newCollection.name,
          slug,
          description: newCollection.description,
          banner_image:
            newCollection.banner_image ||
            "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80",
          status: "published",
        })
        .select()
        .single();
      if (error) throw error;
      setCollections([...collections, data]);
      setNewCollection({ name: "", slug: "", description: "", banner_image: "" });
      toast.success("Đã tạo bộ sưu tập mới!");
    } catch (error: any) {
      toast.error(error.message || "Lỗi tạo bộ sưu tập");
    }
  };

  const handleDeleteCollection = async (id: string) => {
    try {
      const { error } = await supabase.from("collections").delete().eq("id", id);
      if (error) throw error;
      setCollections(collections.filter((c) => c.id !== id));
      toast.success("Đã xoá bộ sưu tập thành công!");
    } catch (error: any) {
      toast.error(error.message || "Không thể xoá bộ sưu tập");
    }
  };

  // Category Actions
  const handleAddCategory = async () => {
    if (!newCategory.name) return;
    try {
      const slug = newCategory.name.toLowerCase().replace(/\s+/g, "-");
      const { data, error } = await supabase
        .from("categories")
        .insert({
          organization_id: orgId,
          name: newCategory.name,
          slug,
          is_published_online: newCategory.is_published_online,
        })
        .select()
        .single();
      if (error) throw error;
      setCategories([...categories, data]);
      setNewCategory({ name: "", is_published_online: true });
      toast.success("Đã tạo danh mục mới!");
    } catch (error: any) {
      toast.error(error.message || "Lỗi tạo danh mục");
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
      setCategories(categories.filter((c) => c.id !== id));
      toast.success("Đã xoá danh mục thành công!");
    } catch (error: any) {
      toast.error(error.message || "Không thể xoá danh mục");
    }
  };

  // Lookbook Actions
  const handleAddLookbook = async () => {
    if (!newLookbook.title) return;
    try {
      const slug = newLookbook.slug || newLookbook.title.toLowerCase().replace(/\s+/g, "-");
      const { data, error } = await supabase
        .from("lookbooks")
        .insert({
          organization_id: orgId,
          title: newLookbook.title,
          slug,
          cover_image:
            newLookbook.cover_image ||
            "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80",
          description: newLookbook.description,
          status: "published",
        })
        .select()
        .single();
      if (error) throw error;
      setLookbooks([...lookbooks, data]);
      setNewLookbook({ title: "", slug: "", cover_image: "", description: "" });
      toast.success("Đã tạo Lookbook mới!");
    } catch (error: any) {
      toast.error(error.message || "Lỗi tạo lookbook");
    }
  };

  const handleDeleteLookbook = async (id: string) => {
    try {
      const { error } = await supabase.from("lookbooks").delete().eq("id", id);
      if (error) throw error;
      setLookbooks(lookbooks.filter((lb) => lb.id !== id));
      toast.success("Đã xoá Lookbook thành công!");
    } catch (error: any) {
      toast.error(error.message || "Không thể xoá lookbook");
    }
  };

  // Campaign Actions
  const handleAddCampaign = async () => {
    if (!newCampaign.name) return;
    try {
      const slug = newCampaign.slug || newCampaign.name.toLowerCase().replace(/\s+/g, "-");
      const { data, error } = await supabase
        .from("campaigns")
        .insert({
          organization_id: orgId,
          name: newCampaign.name,
          slug,
          banner_image:
            newCampaign.banner_image ||
            "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1200&q=80",
          description: newCampaign.description,
          status: "active",
        })
        .select()
        .single();
      if (error) throw error;
      setCampaigns([...campaigns, data]);
      setNewCampaign({ name: "", slug: "", banner_image: "", description: "" });
      toast.success("Đã tạo chiến dịch mới thành công!");
    } catch (error: any) {
      toast.error(error.message || "Lỗi tạo chiến dịch");
    }
  };

  // Promotion Actions
  const handleAddPromo = async () => {
    if (!newPromo.name || !newPromo.code) return;
    try {
      const { data, error } = await supabase
        .from("promotions")
        .insert({
          organization_id: orgId,
          name: newPromo.name,
          code: newPromo.code.toUpperCase(),
          type: newPromo.type,
          value: Number(newPromo.value),
          min_order_value: Number(newPromo.min_order_value),
          status: "active",
        })
        .select()
        .single();
      if (error) throw error;
      setPromotions([...promotions, data]);
      setNewPromo({ name: "", code: "", type: "percentage", value: 10, min_order_value: 0 });
      toast.success("Đã thêm chương trình khuyến mãi mới!");
    } catch (error: any) {
      toast.error(error.message || "Lỗi tạo khuyến mãi");
    }
  };

  // SEO Redirect Actions
  const handleAddRedirect = async () => {
    if (!newRedirect.source_path || !newRedirect.target_path) return;
    try {
      const { data, error } = await supabase
        .from("seo_redirects")
        .insert({
          organization_id: orgId,
          source_path: newRedirect.source_path,
          target_path: newRedirect.target_path,
          status_code: 301,
        })
        .select()
        .single();
      if (error) throw error;
      setSeoRedirects([...seoRedirects, data]);
      setNewRedirect({ source_path: "", target_path: "" });
      toast.success("Đã thêm cấu hình chuyển hướng URL (301 Redirect)!");
    } catch (error: any) {
      toast.error(error.message || "Lỗi thêm chuyển hướng");
    }
  };

  // Page Manager Actions
  const handleSavePage = async () => {
    if (!newPage.title) return;
    try {
      const slug = newPage.slug || newPage.title.toLowerCase().replace(/\s+/g, "-");
      let parsedContent = {};
      try {
        if (newPage.content.trim().startsWith("{") || newPage.content.trim().startsWith("[")) {
          parsedContent = JSON.parse(newPage.content || "{}");
        } else {
          parsedContent = { html: newPage.content };
        }
      } catch (e) {
        parsedContent = { html: newPage.content };
      }

      if (editingPageId) {
        // Update existing page
        const { data, error } = await supabase
          .from("storefront_pages")
          .update({
            title: newPage.title,
            slug,
            content: parsedContent,
            is_published: newPage.is_published,
          })
          .eq("id", editingPageId)
          .select()
          .single();
        if (error) throw error;
        setPages(pages.map((p) => (p.id === editingPageId ? data : p)));
        toast.success("Đã cập nhật trang thành công!");
      } else {
        // Create new page
        const { data, error } = await supabase
          .from("storefront_pages")
          .insert({
            organization_id: orgId,
            title: newPage.title,
            slug,
            content: parsedContent,
            is_published: newPage.is_published,
          })
          .select()
          .single();
        if (error) throw error;
        setPages([...pages, data]);
        toast.success("Đã tạo trang mới thành công!");
      }
      
      setNewPage({ title: "", slug: "", content: "", is_published: true });
      setEditingPageId(null);
    } catch (error: any) {
      toast.error(error.message || "Lỗi lưu trang");
    }
  };

  const handleEditPageClick = (page: any) => {
    let htmlContent = "";
    if (page.content) {
      if (typeof page.content === "string") {
        htmlContent = page.content;
      } else if (page.content.html) {
        htmlContent = page.content.html;
      } else {
        htmlContent = JSON.stringify(page.content);
      }
    }
    
    setNewPage({
      title: page.title,
      slug: page.slug,
      content: htmlContent,
      is_published: page.is_published,
    });
    setEditingPageId(page.id);
    
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeletePage = async (id: string) => {
    try {
      const { error } = await supabase.from("storefront_pages").delete().eq("id", id);
      if (error) throw error;
      setPages(pages.filter((p) => p.id !== id));
      toast.success("Đã xoá trang thành công!");
    } catch (error: any) {
      toast.error(error.message || "Không thể xoá trang");
    }
  };

  // Blog Manager Actions
  const handleAddBlog = async () => {
    if (!newBlog.title || !newBlog.content) return;
    try {
      const slug = newBlog.slug || newBlog.title.toLowerCase().replace(/\s+/g, "-");
      const { data, error } = await supabase
        .from("blog_posts")
        .insert({
          organization_id: orgId,
          title: newBlog.title,
          slug,
          excerpt: newBlog.excerpt,
          content: newBlog.content,
          thumbnail:
            newBlog.thumbnail ||
            "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=600&q=80",
          status: "published",
        })
        .select()
        .single();
      if (error) throw error;
      setBlogPosts([...blogPosts, data]);
      setNewBlog({ title: "", slug: "", excerpt: "", content: "", thumbnail: "" });
      toast.success("Đã đăng tải bài viết blog mới thành công!");
    } catch (error: any) {
      toast.error(error.message || "Lỗi thêm bài viết");
    }
  };

  // Variant Bulk Generation Flow
  const loadProductVariants = async (prodId: string) => {
    setSelectedProductForVariants(prodId);
    try {
      const { data, error } = await supabase.from("product_variants").select("*").eq("product_id", prodId);
      if (error) throw error;
      setActiveVariants(data || []);
    } catch (error: any) {
      console.error(error.message);
    }
  };

  const handleGenerateVariants = async () => {
    if (!selectedProductForVariants) {
      toast.warning("Vui lòng chọn sản phẩm để sinh biến thể!");
      return;
    }
    if (colors.length === 0 || sizes.length === 0) {
      toast.warning("Vui lòng khởi tạo ít nhất một Màu sắc và Kích thước trước!");
      return;
    }

    setLoading(true);
    try {
      const product = products.find((p) => p.id === selectedProductForVariants);
      const itemsToInsert = [];

      for (const col of colors) {
        for (const sz of sizes) {
          const varName = `${product.name} - ${col.name} / ${sz.name}`;
          const generatedSku = `${product.sku || "PROD"}-${col.slug.substring(0, 3).toUpperCase()}-${sz.slug.toUpperCase()}`;

          itemsToInsert.push({
            product_id: selectedProductForVariants,
            name: varName,
            sku: generatedSku,
            price: Number(bulkGenPrice) || Number(product.base_price) || 0,
            cost_price: Number(bulkGenCost) || 0,
            color_id: col.id,
            size_id: sz.id,
            stock: Number(bulkGenStock),
            status: "active",
          });
        }
      }

      const { data, error } = await supabase.from("product_variants").insert(itemsToInsert).select();

      if (error) throw error;

      setActiveVariants([...activeVariants, ...(data || [])]);
      toast.success(`Đã sinh tự động ${itemsToInsert.length} biến thể (Màu x Kích thước) thành công!`);
    } catch (error: any) {
      toast.error(error.message || "Lỗi sinh biến thể");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateVariantStock = async (varId: string, newStock: number) => {
    try {
      const { error } = await supabase
        .from("product_variants")
        .update({ stock: Number(newStock) })
        .eq("id", varId);
      if (error) throw error;
      setActiveVariants(activeVariants.map((v) => (v.id === varId ? { ...v, stock: newStock } : v)));
      toast.success("Đã cập nhật tồn kho biến thể!");
    } catch (e: any) {
      toast.error(e.message || "Không thể cập nhật");
    }
  };

  // AI Content Generator Execution
  const handleCallAI = async () => {
    if (!aiProductInput) return;
    setAiLoading(true);
    setAiOutput("");
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Viết ${aiPromptType === "description" ? "mô tả chi tiết sản phẩm thời trang" : aiPromptType === "seo" ? "tiêu đề và mô tả chuẩn SEO" : "bài đăng mạng xã hội quảng bá"} cho sản phẩm thời trang: ${aiProductInput}`,
        }),
      });
      const data = await res.json();
      if (data.reply) {
        setAiOutput(data.reply);
        toast.success("AI đã tạo nội dung thành công!");
      } else {
        throw new Error("Phản hồi rỗng");
      }
    } catch (e: any) {
      toast.error("Không thể kết nối AI: " + e.message);
      // Fallback
      setAiOutput(
        `[Mẫu gợi ý tự động] Siêu phẩm ${aiProductInput} chất liệu cotton tự nhiên thoáng mát, thiết kế phom dáng thanh lịch, phù hợp mặc đi học, đi chơi hoặc dạo phố cực kỳ thời thượng.`,
      );
    } finally {
      setAiLoading(false);
    }
  };

  const handleGeneratePageContentAI = async () => {
    if (!aiPagePrompt && !newPage.title) {
      toast.error("Vui lòng nhập tiêu đề trang hoặc chủ đề để AI viết!");
      return;
    }
    
    setIsGeneratingPage(true);
    try {
      const topic = aiPagePrompt || newPage.title;
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Viết nội dung cho trang web có chủ đề: "${topic}". Trả về nội dung dưới dạng mã HTML hợp lệ, với các thẻ cơ bản như <h2>, <h3>, <p>, <ul>, <li>. Bắt buộc KHÔNG CẦN giải thích thêm, chỉ trả về code HTML. Dùng định dạng văn phong chuyên nghiệp và phù hợp với thương hiệu thời trang.`,
        }),
      });
      const data = await res.json();
      if (data.reply) {
        let cleanHtml = data.reply.replace(/```html/g, "").replace(/```/g, "").trim();
        setNewPage({ ...newPage, content: cleanHtml });
        toast.success("AI đã tạo nội dung trang thành công!");
      } else {
        throw new Error("Phản hồi rỗng");
      }
    } catch (e: any) {
      toast.error("Không thể kết nối AI: " + e.message);
      // Fallback
      setNewPage({
        ...newPage,
        content: `<h2>${newPage.title || aiPagePrompt}</h2><p>Đây là nội dung mẫu được tạo tự động bởi trợ lý AI. Vui lòng chỉnh sửa lại theo ý muốn của bạn.</p>`,
      });
    } finally {
      setIsGeneratingPage(false);
    }
  };

  return (
    <div className="flex-1 space-y-4 pt-2 w-full">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Storefront</h2>
            <Badge
              variant="outline"
              className="border-emerald-500/30 text-emerald-500 bg-emerald-500/5 text-xs text-muted-foreground tracking-wider ml-2"
            >
              BETA
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">Cấu hình giao diện, danh mục, và thông tin cửa hàng trực tuyến.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 border px-3 py-1.5 rounded-md bg-muted/20">
            <Globe className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs">{defaultDomain}</span>
          </div>
          {storefrontEnabled && (
            <Button variant="outline" className="rounded-md border-zinc-900 text-xs font-medium h-9" asChild>
              <a href={`http://${defaultDomain}`} target="_blank" rel="noreferrer">
                Mở Storefront <ExternalLink className="ml-2 h-3.5 w-3.5" />
              </a>
            </Button>
          )}
          <Button
            onClick={handleSaveSettings}
            disabled={loading}
            className="rounded-md bg-primary text-white hover:bg-zinc-800 text-xs font-medium h-9"
          >
            {loading ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8 mt-6">
        {/* Vertical Sidebar Nav */}
        <div className="flex flex-col gap-1 w-full md:w-56 shrink-0 md:border-r md:pr-4">
          <div className="text-xs font-semibold text-muted-foreground uppercase px-2 mb-2">Menu CMS</div>
          {[
            { id: "dashboard", label: "Dashboard", icon: BarChart },
            { id: "orders", label: "Đơn hàng Online", icon: ShoppingCart },
            { id: "customers", label: "Khách hàng", icon: Users },
            { id: "products", label: "Sản phẩm", icon: Package },
            { id: "inventory", label: "Tồn kho", icon: Warehouse },
            { id: "categories", label: "Danh mục", icon: FolderTree },
            { id: "colors_sizes", label: "Màu/Size", icon: Palette },
            { id: "lookbooks", label: "Lookbook", icon: Layers },
            { id: "campaigns", label: "Chiến dịch", icon: Megaphone },
            { id: "promotions", label: "Khuyến mãi", icon: Percent },
            { id: "pages", label: "Trang nội dung", icon: FileText },
            { id: "blog", label: "Blog", icon: BookOpen },
            { id: "builder", label: "Trang chủ", icon: LayoutTemplate },
            { id: "domain", label: "Giao diện & Tên miền", icon: Globe },
            { id: "settings", label: "Cài đặt chung", icon: Settings },
            { id: "ai_assistant", label: "Trợ lý AI", icon: Sparkles },
          ].map((item) => {
            const ItemIcon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSubTab(item.id)}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-colors w-full text-left ${
                  activeSubTab === item.id
                    ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 font-semibold"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
              >
                <ItemIcon className={`w-4 h-4 shrink-0 ${activeSubTab === item.id ? "text-primary" : ""}`} />
                {item.label}
              </button>
            );
          })}

          <div className="mt-8 border-t pt-4 px-2">
            <div className="text-xs text-muted-foreground tracking-widest uppercase mb-3 font-bold">
              Storefront status
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Kích hoạt</span>
              <Switch checked={storefrontEnabled} onCheckedChange={setStorefrontEnabled} />
            </div>
          </div>
        </div>

        {/* CMS Workspace */}
        <div className="flex-1 min-h-[500px] min-w-0">
          {/* DASHBOARD TAB */}
          {activeSubTab === "dashboard" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="rounded-md border shadow-sm bg-card/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs text-muted-foreground tracking-wider text-muted-foreground uppercase">
                      Tổng số sản phẩm
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl tracking-tight font-bold">{products.length}</div>
                    <div className="text-xs text-muted-foreground text-emerald-500 mt-1">✓ Đồng bộ từ ZPOS</div>
                  </CardContent>
                </Card>
                <Card className="rounded-md border shadow-sm bg-card/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs text-muted-foreground tracking-wider text-muted-foreground uppercase">
                      Bộ sưu tập hoạt động
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl tracking-tight font-bold">{collections.length}</div>
                    <div className="text-xs text-muted-foreground text-muted-foreground mt-1">
                      {lookbooks.length} Lookbooks xuất bản
                    </div>
                  </CardContent>
                </Card>
                <Card className="rounded-md border shadow-sm bg-card/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs text-muted-foreground tracking-wider text-muted-foreground uppercase">
                      Mã giảm giá áp dụng
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl tracking-tight font-bold">
                      {promotions.filter((p) => p.status === "active").length}
                    </div>
                    <div className="text-xs text-muted-foreground text-emerald-500 mt-1">
                      Chương trình marketing chạy
                    </div>
                  </CardContent>
                </Card>
                <Card className="rounded-md border shadow-sm bg-card/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs text-muted-foreground tracking-wider text-muted-foreground uppercase">
                      Tên miền Storefront
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm font-semibold truncate text-zinc-900">{defaultDomain}</div>
                    <div className="text-xs text-muted-foreground text-emerald-500 mt-1">● SSL bảo mật kết nối</div>
                  </CardContent>
                </Card>
              </div>

              {/* Implementation Progress Checklist */}
              <Card className="rounded-md border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xs font-semibold tracking-tight">
                    Bản đồ triển khai Fashion CMS Checklist
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Theo dõi tiến độ hoàn thiện hệ thống tính năng theo PRD.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    {
                      title: "Khởi tạo hạ tầng Database & RLS",
                      desc: "Tạo cấu trúc bảng colors, sizes, product_variants, collections, lookbooks, campaigns, blog, promotions",
                      status: "done",
                    },
                    {
                      title: "Tùy biến thuộc tính và Kích cỡ / Màu sắc",
                      desc: "CRUD cho colors, sizes, categories từ bảng điều khiển admin",
                      status: "done",
                    },
                    {
                      title: "Trình tạo tự động biến thể sản phẩm thời trang",
                      desc: "Liên kết chéo màu x kích cỡ tự động tạo mã SKU và quản lý tồn kho chi tiết",
                      status: "done",
                    },
                    {
                      title: "Quản lý Bộ sưu tập & Lookbooks phong cách",
                      desc: "Tạo các bộ sưu tập thời trang biên tập và đính kèm danh sách sản phẩm",
                      status: "done",
                    },
                    {
                      title: "Nội dung & Blog thời trang",
                      desc: "Viết bài viết phong trào thời trang, phối đồ, xu hướng sản phẩm",
                      status: "done",
                    },
                    {
                      title: "Cấu hình Visual Layout & Builder",
                      desc: "Biên tập khối giao diện storefront trực tuyến thông qua định dạng cấu trúc JSON block",
                      status: "done",
                    },
                    {
                      title: "Hỗ trợ Trợ lý AI Content Generation",
                      desc: "Sử dụng mô hình Llama-3 tạo mô tả và SEO metadata tối ưu",
                      status: "done",
                    },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start justify-between border-b pb-3 last:border-0 last:pb-0">
                      <div className="flex gap-3">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold font-medium text-zinc-800">{item.title}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</p>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className="border-emerald-500/20 bg-emerald-500/5 text-emerald-600 rounded-md text-[9px] font-semibold tracking-tight px-2 py-0.5"
                      >
                        Hoàn thành
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {/* PRODUCTS TAB */}
          {activeSubTab === "products" && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 gap-8">
                {/* Products List Table */}
              <Card className="rounded-md border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xs font-semibold tracking-tight">Danh mục sản phẩm Storefront</CardTitle>
                  <CardDescription className="text-xs">
                    Đồng bộ sản phẩm thời trang và kích hoạt chế độ đăng tải, đặt tag sản phẩm nổi bật.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                      <thead>
                        <tr className="bg-muted/50 border-b text-xs text-muted-foreground tracking-widest uppercase text-muted-foreground">
                          <th className="p-3">Sản phẩm</th>
                          <th className="p-3">Giá bán</th>
                          <th className="p-3 text-center">New Arrival</th>
                          <th className="p-3 text-center">Best Seller</th>
                          <th className="p-3 text-center">Featured</th>
                          <th className="p-3 text-center">Bảng Size</th>
                          <th className="p-3 text-right">Hiển thị Online</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((p) => (
                          <tr key={p.id} className="border-b last:border-0 text-xs hover:bg-muted/20">
                            <td className="p-3 flex items-center gap-3">
                              {p.image ? (
                                <img src={p.image} alt={p.name} className="w-10 h-10 rounded-md object-cover border" />
                              ) : (
                                <div className="w-10 h-10 rounded-md border bg-muted/30 flex items-center justify-center text-muted-foreground">
                                  <ImageIcon className="w-4 h-4" />
                                </div>
                              )}
                              <div>
                                <p className="font-semibold text-zinc-900 uppercase">{p.name}</p>
                                <p className="text-xs text-muted-foreground text-muted-foreground">
                                  SKU: {p.sku || "N/A"}
                                </p>
                              </div>
                            </td>
                            <td className="p-3 font-semibold text-primary">
                              {new Intl.NumberFormat("vi-VN").format(p.online_price || p.price || 0)}đ
                            </td>
                            <td className="p-3 text-center">
                              <input
                                type="checkbox"
                                checked={p.is_new_arrival || false}
                                onChange={() => toggleProductBadge(p.id, "is_new_arrival", p.is_new_arrival)}
                                className="w-3.5 h-3.5 accent-primary"
                              />
                            </td>
                            <td className="p-3 text-center">
                              <input
                                type="checkbox"
                                checked={p.is_best_seller || false}
                                onChange={() => toggleProductBadge(p.id, "is_best_seller", p.is_best_seller)}
                                className="w-3.5 h-3.5 accent-primary"
                              />
                            </td>
                            <td className="p-3 text-center">
                              <input
                                type="checkbox"
                                checked={p.is_featured || false}
                                onChange={() => toggleProductBadge(p.id, "is_featured", p.is_featured)}
                                className="w-3.5 h-3.5 accent-primary"
                              />
                            </td>
                            <td className="p-3 text-center flex items-center justify-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-[10px] px-2 rounded"
                                onClick={() => {
                                  setEditingSizeGuideProduct(p);
                                  setSizeGuideContent(p.size_guide || "");
                                }}
                              >
                                <Ruler className="w-3 h-3 mr-1" />
                                Bảng size
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-[10px] px-2 rounded"
                                onClick={() => setEditingProduct({ ...p })}
                              >
                                <Edit className="w-3 h-3 mr-1" />
                                Sửa
                              </Button>
                            </td>
                            <td className="p-3 text-right">
                              <Switch
                                checked={p.is_published_online || false}
                                onCheckedChange={() => toggleProductStatus(p.id, p.is_published_online)}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
              </div>

              {/* Size Guide Dialog */}
              <Dialog open={!!editingSizeGuideProduct} onOpenChange={(open) => !open && setEditingSizeGuideProduct(null)}>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Bảng thông số size: {editingSizeGuideProduct?.name}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="text-xs text-muted-foreground flex-1">
                        Thiết kế bảng size dạng văn bản phong phú (Rich Text) cho sản phẩm này. Nếu bỏ trống, storefront sẽ hiển thị bảng size mặc định (nếu có).
                      </div>
                      <Button 
                        size="sm" 
                        variant="secondary"
                        className="shrink-0 text-xs h-8"
                        onClick={() => {
                          const sampleHtml = `
                            <h2>Bảng kích thước tham khảo</h2>
                            <ul>
                              <li><strong>Size S:</strong> Chiều cao 155 - 160cm | Cân nặng 45 - 50kg | Vòng ngực 84 - 88cm</li>
                              <li><strong>Size M:</strong> Chiều cao 160 - 165cm | Cân nặng 50 - 55kg | Vòng ngực 88 - 92cm</li>
                              <li><strong>Size L:</strong> Chiều cao 165 - 170cm | Cân nặng 55 - 65kg | Vòng ngực 92 - 96cm</li>
                              <li><strong>Size XL:</strong> Chiều cao 170 - 175cm | Cân nặng 65 - 75kg | Vòng ngực 96 - 100cm</li>
                            </ul>
                            <blockquote>Lưu ý: Thông số trên chỉ mang tính chất tham khảo. Bạn có thể chọn size lớn hơn nếu thích mặc form rộng (oversize).</blockquote>
                          `;
                          setSizeGuideContent(sampleHtml);
                        }}
                      >
                        <FileText className="w-3.5 h-3.5 mr-1.5" /> Chèn mẫu
                      </Button>
                    </div>
                    <RichTextEditor
                      value={sizeGuideContent}
                      onChange={setSizeGuideContent}
                      placeholder="Nhập thông số kích thước, hướng dẫn đo đạc cho sản phẩm này..."
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setEditingSizeGuideProduct(null)}>
                      Hủy bỏ
                    </Button>
                    <Button onClick={handleSaveSizeGuide}>
                      Lưu Bảng Size
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Edit Product Dialog */}
              <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Sửa thông tin: {editingProduct?.name}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs">Tên sản phẩm</Label>
                        <Input
                          value={editingProduct?.name || ""}
                          onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                          className="rounded-md text-xs"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">SKU</Label>
                        <Input
                          value={editingProduct?.sku || ""}
                          onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                          className="rounded-md text-xs"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs">Giá gốc</Label>
                        <Input
                          type="number"
                          value={editingProduct?.price || 0}
                          onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                          className="rounded-md text-xs"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Giá khuyến mãi online</Label>
                        <Input
                          type="number"
                          value={editingProduct?.online_price || ""}
                          onChange={(e) => setEditingProduct({ ...editingProduct, online_price: Number(e.target.value) })}
                          className="rounded-md text-xs"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Đường dẫn ảnh (URL)</Label>
                      <Input
                        value={editingProduct?.image || ""}
                        onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })}
                        placeholder="https://..."
                        className="rounded-md text-xs"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Mô tả sản phẩm</Label>
                      <RichTextEditor
                        value={editingProduct?.description || ""}
                        onChange={(val) => setEditingProduct({ ...editingProduct, description: val })}
                        placeholder="Mô tả chi tiết sản phẩm..."
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setEditingProduct(null)}>
                      Hủy bỏ
                    </Button>
                    <Button onClick={handleSaveProduct}>Lưu Thay Đổi</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {/* CATEGORIES TAB */}
          {activeSubTab === "categories" && (
            <div className="space-y-8">
              <Card className="rounded-md border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xs font-semibold tracking-tight">Quản lý danh mục thời trang</CardTitle>
                  <CardDescription className="text-xs">
                    Thiết lập các nhóm phân loại sản phẩm hiển thị trên menu chính.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Tên danh mục (ví dụ: Áo thun, Quần Jean)"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                      className="rounded-md text-xs"
                    />
                    <Button
                      onClick={handleAddCategory}
                      className="rounded-md bg-primary text-white text-xs uppercase h-10 px-4"
                    >
                      Thêm
                    </Button>
                  </div>

                  <div className="space-y-2 max-h-[350px] overflow-y-auto border p-2">
                    {categories.map((cat) => (
                      <div
                        key={cat.id}
                        className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0 text-xs font-medium"
                      >
                        <span>{cat.name}</span>
                        <div className="flex gap-2 items-center">
                          <Badge variant="outline" className="text-[9px] rounded-md">
                            {cat.is_published_online ? "ONLINE" : "DRAFT"}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* INVENTORY TAB */}
          {activeSubTab === "inventory" && (
            <div className="space-y-8">
              <Card className="rounded-md border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xs font-semibold tracking-tight">Quản lý tồn kho</CardTitle>
                  <CardDescription className="text-xs">
                    Kiểm tra và điều chỉnh số lượng tồn kho của tất cả sản phẩm biến thể.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                      <thead>
                        <tr className="bg-muted/50 border-b text-xs text-muted-foreground tracking-widest uppercase text-muted-foreground">
                          <th className="p-3">Sản phẩm biến thể</th>
                          <th className="p-3">SKU</th>
                          <th className="p-3">Giá bán</th>
                          <th className="p-3 text-right">Số lượng tồn</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeVariants.length > 0 ? (
                          activeVariants.map((v) => (
                            <tr key={v.id} className="border-b last:border-0 text-xs hover:bg-muted/20">
                              <td className="p-3 font-semibold text-zinc-900 uppercase">{v.name}</td>
                              <td className="p-3 text-muted-foreground">{v.sku || "N/A"}</td>
                              <td className="p-3">{v.price}đ</td>
                              <td className="p-3 text-right">
                                <Input
                                  type="number"
                                  value={v.stock}
                                  onChange={(e) => handleUpdateVariantStock(v.id, Number(e.target.value))}
                                  className="w-20 text-right ml-auto rounded-md text-xs h-8"
                                />
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="p-4 text-center text-xs text-muted-foreground">
                              Chưa tải dữ liệu biến thể. Vui lòng chọn sản phẩm ở tab Sản phẩm để xem.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ORDERS TAB */}
          {activeSubTab === "orders" && (
            <div className="space-y-8">
              <Card className="rounded-md border shadow-sm bg-muted/10">
                <CardHeader>
                  <CardTitle className="text-xs font-semibold tracking-tight">Đơn hàng Online</CardTitle>
                  <CardDescription className="text-xs">
                    Theo dõi và xử lý trạng thái đơn hàng (Sắp ra mắt trong Version 2).
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <ShoppingCart className="w-12 h-12 text-muted-foreground/30 mb-4" />
                  <p className="text-sm text-zinc-500">Mô-đun quản lý đơn hàng đang được phát triển.</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* CUSTOMERS TAB */}
          {activeSubTab === "customers" && (
            <div className="space-y-8">
              <Card className="rounded-md border shadow-sm bg-muted/10">
                <CardHeader>
                  <CardTitle className="text-xs font-semibold tracking-tight">Khách hàng</CardTitle>
                  <CardDescription className="text-xs">
                    Quản lý hồ sơ khách hàng mua sắm (Sắp ra mắt trong Version 2).
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Users className="w-12 h-12 text-muted-foreground/30 mb-4" />
                  <p className="text-sm text-zinc-500">Mô-đun quản lý khách hàng đang được phát triển.</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* COLORS & SIZES TAB */}
          {activeSubTab === "colors_sizes" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Colors Card */}
              <Card className="rounded-md border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xs font-semibold tracking-tight">Bảng màu thời trang (Colors)</CardTitle>
                  <CardDescription className="text-xs">
                    Định nghĩa danh sách màu và mã hex tương ứng để hiển thị vòng màu swatches ở storefront.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Tên màu (ví dụ: Đen, Trắng ngà)"
                      value={newColor.name}
                      onChange={(e) => setNewColor({ ...newColor, name: e.target.value })}
                      className="rounded-md text-xs flex-1"
                    />
                    <div className="relative flex items-center">
                      <input
                        type="color"
                        value={newColor.hex_code || "#000000"}
                        onChange={(e) => setNewColor({ ...newColor, hex_code: e.target.value })}
                        className="absolute left-1.5 top-1/2 -translate-y-1/2 w-7 h-7 cursor-pointer border-0 p-0 bg-transparent rounded-sm overflow-hidden"
                      />
                      <Input
                        placeholder="#ffffff"
                        value={newColor.hex_code}
                        onChange={(e) => setNewColor({ ...newColor, hex_code: e.target.value })}
                        className="w-[110px] rounded-md text-xs pl-10 font-mono"
                      />
                    </div>
                    <Button
                      onClick={handleAddColor}
                      className="rounded-md bg-primary text-white text-xs uppercase h-10 px-4"
                    >
                      Thêm
                    </Button>
                  </div>

                  <div className="space-y-2 mt-4 max-h-[300px] overflow-y-auto">
                    {colors.map((c) => (
                      <div key={c.id} className="flex items-center justify-between border-b pb-2 last:border-0 text-xs">
                        <div className="flex items-center gap-3">
                          <span className="w-4 h-4 border" style={{ backgroundColor: c.hex_code }} />
                          <span className="font-semibold">{c.name}</span>
                          <span className="text-xs text-muted-foreground text-muted-foreground">({c.hex_code})</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteColor(c.id)}
                          className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                    {colors.length === 0 && (
                      <p className="text-xs text-muted-foreground italic text-center py-6">Chưa định nghĩa màu sắc.</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Sizes Card */}
              <Card className="rounded-md border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xs font-semibold tracking-tight">Bảng kích thước (Sizes)</CardTitle>
                  <CardDescription className="text-xs">
                    Định nghĩa kích cỡ thời trang (S, M, L, XL) và thứ tự sắp xếp tương ứng.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Tên kích cỡ (S, M, 29, 30)"
                      value={newSize.name}
                      onChange={(e) => setNewSize({ ...newSize, name: e.target.value })}
                      className="rounded-md text-xs"
                    />
                    <Input
                      type="number"
                      placeholder="Thứ tự"
                      value={newSize.sort_order || ""}
                      onChange={(e) => setNewSize({ ...newSize, sort_order: Number(e.target.value) })}
                      className="w-20 rounded-md text-xs"
                    />
                    <Button
                      onClick={handleAddSize}
                      className="rounded-md bg-primary text-white text-xs uppercase h-10 px-4"
                    >
                      Thêm
                    </Button>
                  </div>

                  <div className="space-y-2 mt-4 max-h-[300px] overflow-y-auto">
                    {sizes.map((s) => (
                      <div key={s.id} className="flex items-center justify-between border-b pb-2 last:border-0 text-xs">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold uppercase">{s.name}</span>
                          <span className="text-xs text-muted-foreground text-muted-foreground">
                            (Thứ tự: {s.sort_order})
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSize(s.id)}
                          className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                    {sizes.length === 0 && (
                      <p className="text-xs text-muted-foreground italic text-center py-6">Chưa định nghĩa kích cỡ.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* COLLECTIONS TAB */}
          {activeSubTab === "pages" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white tracking-tight">
                    Quản lý trang (Pages)
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Tạo và cấu hình các trang nội dung như Giới thiệu, Chính sách, v.v.
                  </p>
                </div>
              </div>

              <Card className="rounded-md border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xs font-semibold tracking-tight uppercase">
                    {editingPageId ? "Chỉnh sửa trang" : "Thêm trang mới"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Tiêu đề trang</Label>
                      <Input
                        value={newPage.title}
                        onChange={(e) => setNewPage({ ...newPage, title: e.target.value })}
                        placeholder="VD: Về chúng tôi"
                        className="rounded-md text-xs"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Đường dẫn (Slug)</Label>
                      <Input
                        value={newPage.slug}
                        onChange={(e) => setNewPage({ ...newPage, slug: e.target.value })}
                        placeholder="ve-chung-toi"
                        className="rounded-md text-xs"
                      />
                    </div>
                  </div>
                  
                  {/* AI Generator Box */}
                  <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900 rounded-md p-3 space-y-3">
                    <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-medium text-xs">
                      <Sparkles className="w-4 h-4" />
                      Nhờ AI viết nội dung trang (Tùy chọn)
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={aiPagePrompt}
                        onChange={(e) => setAiPagePrompt(e.target.value)}
                        placeholder="VD: Viết chính sách đổi trả trong 30 ngày..."
                        className="rounded-md text-xs flex-1 bg-white dark:bg-black"
                      />
                      <Button
                        onClick={handleGeneratePageContentAI}
                        disabled={isGeneratingPage}
                        variant="secondary"
                        className="rounded-md text-xs h-9 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 dark:hover:bg-indigo-800"
                      >
                        {isGeneratingPage ? (
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4 mr-2" />
                        )}
                        {isGeneratingPage ? "Đang viết..." : "Tạo bằng AI"}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Nội dung (Rich Text)</Label>
                    <RichTextEditor
                      value={newPage.content}
                      onChange={(html) => setNewPage({ ...newPage, content: html })}
                      placeholder="Nhập nội dung trang ở đây..."
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is-published"
                      checked={newPage.is_published}
                      onCheckedChange={(checked) => setNewPage({ ...newPage, is_published: checked })}
                    />
                    <Label htmlFor="is-published" className="text-xs">
                      Xuất bản ngay
                    </Label>
                  </div>
                  <div className="flex space-x-2">
                    <Button onClick={handleSavePage} className="flex-1 rounded-md text-xs h-9">
                      {editingPageId ? (
                        <>
                          <Save className="w-4 h-4 mr-2" /> Cập nhật trang
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" /> Tạo trang
                        </>
                      )}
                    </Button>
                    {editingPageId && (
                      <Button
                        onClick={() => {
                          setEditingPageId(null);
                          setNewPage({ title: "", slug: "", content: "", is_published: true });
                        }}
                        variant="outline"
                        className="rounded-md text-xs h-9"
                      >
                        <X className="w-4 h-4 mr-2" /> Hủy
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Danh sách trang đã tạo</h4>
                {pages.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8 bg-zinc-50 border border-dashed rounded-md">
                    Chưa có trang nào
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {pages.map((p) => (
                      <div key={p.id} className="flex justify-between items-center p-4 border rounded-md bg-white">
                        <div>
                          <div className="font-semibold text-sm flex items-center gap-2">
                            {p.title}
                            {p.is_published ? (
                              <Badge
                                variant="outline"
                                className="text-[10px] bg-emerald-50 text-emerald-600 border-emerald-200"
                              >
                                Đã xuất bản
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] bg-zinc-100 text-zinc-600">
                                Bản nháp
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">/{p.slug}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditPageClick(p)}
                            className="text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-md"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeletePage(p.id)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-md"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSubTab === "collections" && (
            <div className="space-y-6">
              <Card className="rounded-md border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xs font-semibold tracking-tight">
                    Tạo bộ sưu tập biên tập (Collections)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Nhóm các mặt hàng thời trang vào các bộ sưu tập mang phong cách riêng.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs uppercase">Tên bộ sưu tập</Label>
                      <Input
                        placeholder="Ví dụ: Spring/Summer 2026 Edition"
                        value={newCollection.name}
                        onChange={(e) => setNewCollection({ ...newCollection, name: e.target.value })}
                        className="rounded-md text-xs"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs uppercase">Mã slug (URL)</Label>
                      <Input
                        placeholder="spring-summer-2026"
                        value={newCollection.slug}
                        onChange={(e) => setNewCollection({ ...newCollection, slug: e.target.value })}
                        className="rounded-md text-xs"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-xs uppercase">Banner hình ảnh (URL)</Label>
                      <Input
                        placeholder="https://..."
                        value={newCollection.banner_image}
                        onChange={(e) => setNewCollection({ ...newCollection, banner_image: e.target.value })}
                        className="rounded-md text-xs"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-xs uppercase">Mô tả bộ sưu tập</Label>
                      <textarea
                        className="w-full text-xs border rounded-md p-3 min-h-[80px]"
                        placeholder="Giới thiệu concept thiết kế..."
                        value={newCollection.description}
                        onChange={(e) => setNewCollection({ ...newCollection, description: e.target.value })}
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleAddCollection}
                    className="rounded-md bg-primary text-white text-xs font-medium h-10 px-6"
                  >
                    Tạo bộ sưu tập
                  </Button>
                </CardContent>
              </Card>

              {/* Collections list */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {collections.map((c) => (
                  <Card
                    key={c.id}
                    className="rounded-md border shadow-sm overflow-hidden bg-card/25 flex flex-col justify-between"
                  >
                    <div>
                      <div className="h-32 bg-muted relative overflow-hidden">
                        <img src={c.banner_image} alt={c.name} className="w-full h-full object-cover" />
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-black text-white rounded-md text-[9px] tracking-wider">
                            {c.status.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                      <div className="p-4">
                        <h4 className="text-xs uppercase font-bold tracking-wider">{c.name}</h4>
                        <p className="text-xs text-muted-foreground text-muted-foreground mt-1">Slug: /{c.slug}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-2">
                          {c.description || "Chưa có mô tả chi tiết."}
                        </p>
                      </div>
                    </div>
                    <CardFooter className="border-t p-3 bg-muted/10 flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCollection(c.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 text-xs uppercase"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" /> Xoá
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* LOOKBOOKS TAB */}
          {activeSubTab === "lookbooks" && (
            <div className="space-y-6">
              <Card className="rounded-md border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xs font-semibold tracking-tight">Tạo Lookbook mới</CardTitle>
                  <CardDescription className="text-xs">
                    Trực quan hóa phong cách phối đồ thông qua album hình ảnh chất lượng cao.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs uppercase">Tiêu đề Lookbook</Label>
                      <Input
                        placeholder="Ví dụ: Urban Comforts Style"
                        value={newLookbook.title}
                        onChange={(e) => setNewLookbook({ ...newLookbook, title: e.target.value })}
                        className="rounded-md text-xs"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs uppercase">Mã slug (URL)</Label>
                      <Input
                        placeholder="urban-comforts"
                        value={newLookbook.slug}
                        onChange={(e) => setNewLookbook({ ...newLookbook, slug: e.target.value })}
                        className="rounded-md text-xs"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-xs uppercase">Hình ảnh bìa (Cover Image URL)</Label>
                      <Input
                        placeholder="https://..."
                        value={newLookbook.cover_image}
                        onChange={(e) => setNewLookbook({ ...newLookbook, cover_image: e.target.value })}
                        className="rounded-md text-xs"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-xs uppercase">Lời dẫn / Mô tả ngắn</Label>
                      <textarea
                        className="w-full text-xs border rounded-md p-3 min-h-[60px]"
                        placeholder="Ý tưởng nghệ thuật sau lookbook..."
                        value={newLookbook.description}
                        onChange={(e) => setNewLookbook({ ...newLookbook, description: e.target.value })}
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleAddLookbook}
                    className="rounded-md bg-primary text-white text-xs font-medium h-10 px-6"
                  >
                    Tạo Lookbook
                  </Button>
                </CardContent>
              </Card>

              {/* Lookbooks list */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {lookbooks.map((lb) => (
                  <Card
                    key={lb.id}
                    className="rounded-md border shadow-sm overflow-hidden bg-card/25 flex flex-col justify-between"
                  >
                    <div>
                      <div className="h-44 bg-muted relative overflow-hidden">
                        <img src={lb.cover_image} alt={lb.title} className="w-full h-full object-cover" />
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-black text-white rounded-md text-[9px] tracking-wider">
                            {lb.status?.toUpperCase() || "PUBLISHED"}
                          </Badge>
                        </div>
                      </div>
                      <div className="p-4">
                        <h4 className="text-xs uppercase font-bold tracking-wider">{lb.title}</h4>
                        <p className="text-xs text-muted-foreground text-muted-foreground mt-1">
                          Slug: /lookbooks/{lb.slug}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-2">
                          {lb.description || "Không có mô tả chi tiết."}
                        </p>
                      </div>
                    </div>
                    <CardFooter className="border-t p-3 bg-muted/10 flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteLookbook(lb.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 text-xs uppercase"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" /> Xoá
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* CAMPAIGNS TAB */}
          {activeSubTab === "campaigns" && (
            <div className="space-y-6">
              <Card className="rounded-md border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xs font-semibold tracking-tight">
                    Tạo chiến dịch tiếp thị mới (Campaigns)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Lên lịch chiến dịch giảm giá, tặng quà hoặc giới thiệu bộ sưu tập mới.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs uppercase">Tên chiến dịch</Label>
                      <Input
                        placeholder="Ví dụ: Tết Holiday Collection Launch"
                        value={newCampaign.name}
                        onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                        className="rounded-md text-xs"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs uppercase">Mã slug chiến dịch</Label>
                      <Input
                        placeholder="tet-holiday-2026"
                        value={newCampaign.slug}
                        onChange={(e) => setNewCampaign({ ...newCampaign, slug: e.target.value })}
                        className="rounded-md text-xs"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-xs uppercase">Hình ảnh banner chính (URL)</Label>
                      <Input
                        placeholder="https://..."
                        value={newCampaign.banner_image}
                        onChange={(e) => setNewCampaign({ ...newCampaign, banner_image: e.target.value })}
                        className="rounded-md text-xs"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-xs uppercase">Nội dung chiến dịch</Label>
                      <textarea
                        className="w-full text-xs border rounded-md p-3 min-h-[60px]"
                        placeholder="Mô tả nội dung khuyến mại và thời hạn..."
                        value={newCampaign.description}
                        onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleAddCampaign}
                    className="rounded-md bg-primary text-white text-xs font-medium h-10 px-6"
                  >
                    Khởi tạo chiến dịch
                  </Button>
                </CardContent>
              </Card>

              {/* Campaigns list */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {campaigns.map((camp) => (
                  <Card key={camp.id} className="rounded-md border shadow-sm overflow-hidden bg-card/25">
                    <div className="h-40 bg-muted relative">
                      <img src={camp.banner_image} alt={camp.name} className="w-full h-full object-cover" />
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-emerald-600 text-white rounded-md text-[9px] font-medium">
                          {camp.status.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    <div className="p-4">
                      <h4 className="text-xs uppercase font-bold tracking-wider">{camp.name}</h4>
                      <p className="text-xs text-muted-foreground text-muted-foreground mt-1">
                        URL: /campaign/{camp.slug}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {camp.description || "Không có nội dung mô tả."}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* BLOG POSTS TAB */}
          {activeSubTab === "blog" && (
            <div className="space-y-6">
              <Card className="rounded-md border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xs font-semibold tracking-tight">
                    Viết bài viết Blog / Tin tức thời trang
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Đăng tải thông tin xu hướng thời trang, mẹo phối đồ giúp tối ưu SEO.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs uppercase">Tiêu đề bài viết</Label>
                      <Input
                        placeholder="Cách phối đồ với chân váy xếp ly..."
                        value={newBlog.title}
                        onChange={(e) => setNewBlog({ ...newBlog, title: e.target.value })}
                        className="rounded-md text-xs"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs uppercase">Mã slug (URL)</Label>
                      <Input
                        placeholder="cach-phoi-do-chan-vay"
                        value={newBlog.slug}
                        onChange={(e) => setNewBlog({ ...newBlog, slug: e.target.value })}
                        className="rounded-md text-xs"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-xs uppercase">Ảnh đại diện bài viết (Thumbnail URL)</Label>
                      <Input
                        placeholder="https://..."
                        value={newBlog.thumbnail}
                        onChange={(e) => setNewBlog({ ...newBlog, thumbnail: e.target.value })}
                        className="rounded-md text-xs"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-xs uppercase">Tóm tắt ngắn (Excerpt)</Label>
                      <Input
                        placeholder="Chia sẻ bí quyết kết hợp đồ cực xinh cho mùa hè này..."
                        value={newBlog.excerpt}
                        onChange={(e) => setNewBlog({ ...newBlog, excerpt: e.target.value })}
                        className="rounded-md text-xs"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-xs uppercase">
                        Nội dung chi tiết bài viết (Hỗ trợ định dạng HTML/Markdown)
                      </Label>
                      <textarea
                        className="w-full text-xs border rounded-md p-3 min-h-[160px]"
                        placeholder="Nội dung bài viết..."
                        value={newBlog.content}
                        onChange={(e) => setNewBlog({ ...newBlog, content: e.target.value })}
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleAddBlog}
                    className="rounded-md bg-primary text-white text-xs font-medium h-10 px-6"
                  >
                    Đăng bài viết
                  </Button>
                </CardContent>
              </Card>

              {/* Blog Posts list */}
              <div className="space-y-3">
                {blogPosts.map((post) => (
                  <div key={post.id} className="flex gap-4 border p-4 bg-card/35 text-xs items-center justify-between">
                    <div className="flex gap-4 items-center">
                      <img src={post.thumbnail} className="w-16 h-12 object-cover border" alt="" />
                      <div>
                        <h4 className="font-bold uppercase text-zinc-900">{post.title}</h4>
                        <p className="text-xs text-muted-foreground text-muted-foreground mt-1">
                          Slug: /blog/{post.slug} | Trạng thái: {post.status}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-primary rounded-md text-[9px]">POST</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VISUAL BUILDER TAB */}
          {activeSubTab === "builder" && (
            <div className="space-y-6">
              <Card className="rounded-md border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xs font-semibold tracking-tight">
                    Cấu hình Visual Blocks trang chủ
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Sắp xếp thứ tự hiển thị của các khối (Sliders, Banner grids, Products Showcase) bằng định dạng JSON
                    của Block Engine.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <textarea
                    className="w-full text-xs border rounded-md p-4 min-h-[380px] bg-primary text-emerald-400 focus:outline-none"
                    value={homeBlocksJson}
                    onChange={(e) => setHomeBlocksJson(e.target.value)}
                  />
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-xs text-muted-foreground text-muted-foreground">
                      Hệ thống hỗ trợ Slider, FeaturedCollection, LookbookShowcase, BannerGrid.
                    </span>
                    <Button
                      onClick={handleSaveSettings}
                      disabled={loading}
                      className="rounded-md bg-primary text-white text-xs uppercase px-4 h-9"
                    >
                      <Save className="w-3.5 h-3.5 mr-2" /> Lưu Layout trang chủ
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* MARKETING & PROMOTIONS TAB */}
          {activeSubTab === "promotions" && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Promo Code Creation */}
                <Card className="rounded-md border shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-xs font-semibold tracking-tight">
                      Tạo mã giảm giá (Coupon Code)
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Chạy chiến dịch khuyến mãi chiết khấu phần trăm hoặc số tiền cứng.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground uppercase">Tên chương trình</Label>
                        <Input
                          placeholder="Mở bán Tết 2026"
                          value={newPromo.name}
                          onChange={(e) => setNewPromo({ ...newPromo, name: e.target.value })}
                          className="rounded-md text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground uppercase">Mã Code áp dụng</Label>
                        <Input
                          placeholder="TET2026"
                          value={newPromo.code}
                          onChange={(e) => setNewPromo({ ...newPromo, code: e.target.value })}
                          className="rounded-md text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground uppercase">Loại giảm giá</Label>
                        <select
                          className="w-full text-xs border rounded-md p-2 h-10 bg-background"
                          value={newPromo.type}
                          onChange={(e) => setNewPromo({ ...newPromo, type: e.target.value })}
                        >
                          <option value="percentage">Phần trăm (%)</option>
                          <option value="fixed_amount">Số tiền cố định (đ)</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground uppercase">Giá trị giảm</Label>
                        <Input
                          type="number"
                          value={newPromo.value}
                          onChange={(e) => setNewPromo({ ...newPromo, value: Number(e.target.value) })}
                          className="rounded-md text-xs"
                        />
                      </div>
                    </div>
                    <Button
                      onClick={handleAddPromo}
                      className="rounded-md bg-primary text-white text-xs uppercase h-10 w-full"
                    >
                      Tạo mã giảm giá
                    </Button>
                  </CardContent>
                </Card>

                {/* SEO Redirects Manager */}
                <Card className="rounded-md border shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-xs font-semibold tracking-tight">
                      Cấu hình SEO URL Redirects (301)
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Chuyển hướng liên kết cũ sang đường dẫn mới để bảo toàn thứ hạng Google Search.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground uppercase">Đường dẫn gốc (Source)</Label>
                        <Input
                          placeholder="/san-pham-cu"
                          value={newRedirect.source_path}
                          onChange={(e) => setNewRedirect({ ...newRedirect, source_path: e.target.value })}
                          className="rounded-md text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground uppercase">Đường dẫn đích (Target)</Label>
                        <Input
                          placeholder="/products/san-pham-moi"
                          value={newRedirect.target_path}
                          onChange={(e) => setNewRedirect({ ...newRedirect, target_path: e.target.value })}
                          className="rounded-md text-xs"
                        />
                      </div>
                    </div>
                    <Button
                      onClick={handleAddRedirect}
                      className="rounded-md bg-primary text-white text-xs uppercase h-10 w-full"
                    >
                      Cài đặt chuyển hướng
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Promotions Table list */}
              <Card className="rounded-md border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xs font-semibold tracking-tight">Khuyến mãi đang chạy</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {promotions.map((p) => (
                      <div key={p.id} className="flex justify-between items-center border p-3 text-xs bg-card/35">
                        <div>
                          <p className="font-semibold text-zinc-900">{p.name}</p>
                          <p className="text-xs text-muted-foreground text-muted-foreground">
                            Mã áp dụng: <span className="font-bold border px-1.5 py-0.5 bg-muted">{p.code}</span> |
                            Loại: {p.type === "percentage" ? `${p.value}%` : `${p.value}đ`}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className="border-emerald-500/20 bg-emerald-500/5 text-emerald-600 rounded-md text-[9px]"
                        >
                          {p.status.toUpperCase()}
                        </Badge>
                      </div>
                    ))}
                    {promotions.length === 0 && (
                      <p className="text-xs text-muted-foreground italic text-center py-4">
                        Chưa tạo chiến dịch khuyến mãi nào.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* AI CONTENT ASSISTANT */}
          {activeSubTab === "ai_assistant" && (
            <div className="space-y-6">
              <Card className="rounded-md border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xs font-semibold tracking-tight flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-500" /> Trợ lý viết bài & SEO AI (Llama-3.3)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Sử dụng AI để tự động sinh văn bản mô tả, tối ưu hóa thẻ tiêu đề SEO hoặc viết bài đăng mạng xã hội
                    quảng cáo.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs uppercase">Tên sản phẩm / Ý tưởng thiết kế</Label>
                    <Input
                      placeholder="Áo khoác gió thời trang chống nước mỏng nhẹ..."
                      value={aiProductInput}
                      onChange={(e) => setAiProductInput(e.target.value)}
                      className="rounded-md text-xs"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs uppercase">Loại nội dung cần tạo</Label>
                    <div className="flex gap-4">
                      {[
                        { id: "description", label: "Mô tả sản phẩm" },
                        { id: "seo", label: "Tiêu đề & Mô tả SEO" },
                        { id: "facebook", label: "Bài viết Facebook" },
                        { id: "tiktok", label: "Ý tưởng Video TikTok" },
                      ].map((item) => (
                        <div key={item.id} className="flex items-center gap-2">
                          <input
                            type="radio"
                            id={item.id}
                            name="aiPromptType"
                            checked={aiPromptType === item.id}
                            onChange={() => setAiPromptType(item.id as any)}
                            className="w-3.5 h-3.5 accent-primary"
                          />
                          <Label htmlFor={item.id} className="text-xs uppercase cursor-pointer">
                            {item.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={handleCallAI}
                    disabled={aiLoading || !aiProductInput}
                    className="rounded-md bg-primary text-white text-xs font-medium h-10 px-6"
                  >
                    {aiLoading ? "Đang xử lý ý tưởng..." : "Sinh nội dung với AI"}
                  </Button>

                  {aiOutput && (
                    <div className="space-y-2 border pt-4 px-4 pb-5 bg-primary text-zinc-100 text-xs">
                      <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-2">
                        <span className="text-xs text-muted-foreground text-zinc-400 font-semibold tracking-wider uppercase">
                          Kết quả tạo lập bởi AI
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(aiOutput);
                            toast.success("Đã sao chép nội dung vào Clipboard!");
                          }}
                          className="h-7 rounded-md border border-zinc-800 text-xs text-muted-foreground uppercase text-zinc-300 hover:bg-zinc-800 hover:text-white"
                        >
                          Sao chép
                        </Button>
                      </div>
                      <p className="whitespace-pre-wrap leading-relaxed">{aiOutput}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* SETTINGS / DOMAIN TAB */}
          {activeSubTab === "domain" && (
            <div className="space-y-6">
              <Card className="rounded-md border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xs font-semibold tracking-tight">
                    Tên miền tùy chỉnh (Custom Domain)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Thiết lập kết nối tên miền riêng cho cửa hàng thời trang.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-xs uppercase">Tên miền mặc định của ZPOS</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input value={defaultDomain} readOnly className="bg-muted rounded-md text-xs" />
                      <Badge
                        variant="secondary"
                        className="rounded-md text-xs text-muted-foreground bg-emerald-500/10 text-emerald-600 border-none"
                      >
                        ACTIVE
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <Label className="text-xs uppercase">Thêm tên miền riêng của bạn</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        placeholder="Ví dụ: www.fashionbrand.com"
                        value={customDomain}
                        onChange={(e) => setCustomDomain(e.target.value)}
                        className="rounded-md text-xs"
                      />
                      <Button
                        onClick={handleAddDomain}
                        disabled={loading || !customDomain}
                        className="rounded-md bg-primary text-white text-xs uppercase h-10 px-6"
                      >
                        Kết nối
                      </Button>
                    </div>

                    {domainStatus === "pending_verification" && (
                      <div className="bg-zinc-50 border p-4 rounded-md text-xs mt-4">
                        <h4 className="font-bold text-zinc-950 uppercase mb-2">Hướng dẫn cấu hình DNS</h4>
                        <p className="mb-2 text-muted-foreground">
                          Vui lòng đăng nhập vào quản lý tên miền và thêm hai bản ghi sau để hoàn tất xác thực:
                        </p>
                        <ul className="list-disc pl-5 space-y-1 bg-white p-3 rounded border font-semibold text-zinc-800">
                          <li>Loại: TXT | Tên: _zpos-verify | Giá trị: zpos-verify=org_{orgId.split("-")[0]}</li>
                          <li>Loại: CNAME | Tên: @ hoặc www | Giá trị: cname.vercel-dns.com</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Theme Settings & Design Customization */}
              <Card className="rounded-md border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xs font-semibold tracking-tight">
                    Tùy chỉnh giao diện cửa hàng (Appearance)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs uppercase">Mẫu phong cách (Theme Presets)</Label>
                    <div className="flex gap-4 mt-2">
                      <div
                        onClick={() => setTheme("minimal")}
                        className={`border rounded-md p-4 cursor-pointer w-40 text-center transition-all ${theme === "minimal" ? "border-primary bg-zinc-50 font-bold" : "border-border hover:bg-zinc-50/50 text-muted-foreground"}`}
                      >
                        <div className="text-xs uppercase mb-1">Zara Minimal</div>
                        <div className="text-xs text-muted-foreground">Tối giản, đơn sắc</div>
                      </div>
                      <div
                        onClick={() => setTheme("bold")}
                        className={`border rounded-md p-4 cursor-pointer w-40 text-center transition-all ${theme === "bold" ? "border-primary bg-zinc-50 font-bold" : "border-border hover:bg-zinc-50/50 text-muted-foreground"}`}
                      >
                        <div className="text-xs uppercase mb-1">High Contrast</div>
                        <div className="text-xs text-muted-foreground">Độ tương phản cao</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-4 border-t">
                    <Label className="text-xs uppercase">Mã CSS tùy biến (Custom CSS Override)</Label>
                    <textarea
                      className="w-full text-xs border rounded-md p-3 min-h-[120px] bg-primary text-emerald-400 focus:outline-none"
                      placeholder=":root { --sb-cta-bg: #000000; }"
                      value={customCss}
                      onChange={(e) => setCustomCss(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground text-muted-foreground">
                      Tự cấu hình đè các biến CSS để tùy chọn màu sắc nút, cỡ chữ, phông nền của thương hiệu.
                    </p>
                  </div>

                  <div className="space-y-2 pt-4 border-t">
                    <Label className="text-xs uppercase">Mã Head HTML (Custom Head HTML)</Label>
                    <textarea
                      className="w-full text-xs border rounded-md p-3 min-h-[80px] bg-primary text-emerald-400 focus:outline-none"
                      placeholder="<script src='https://cdn.tracking.com/script.js'></script>"
                      value={customHead}
                      onChange={(e) => setCustomHead(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground text-muted-foreground">
                      Gắn thêm mã theo dõi của bên thứ ba như Google Analytics, Facebook Pixel.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeSubTab === "settings" && (
            <div className="space-y-6">
              <Card className="rounded-md border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xs font-semibold tracking-tight">
                    Cài đặt Banner Quảng Cáo (Storefront Banner)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Tùy chỉnh nội dung hiển thị trên Banner khuyến mãi hoặc thông báo của cửa hàng.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between pb-4 border-b">
                    <Label className="text-xs uppercase font-semibold">Hiển thị Banner Đặc Quyền (Club Banner)</Label>
                    <Switch
                      checked={bannerSettings.enabled}
                      onCheckedChange={(val) => setBannerSettings({ ...bannerSettings, enabled: val })}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs uppercase">Tiêu đề Banner</Label>
                      <Input
                        value={bannerSettings.title}
                        onChange={(e) => setBannerSettings({ ...bannerSettings, title: e.target.value })}
                        placeholder="ĐẶC QUYỀN DÀNH CHO"
                        className="rounded-md text-xs"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs uppercase">Số lượng (Điểm nhấn)</Label>
                      <Input
                        value={bannerSettings.count}
                        onChange={(e) => setBannerSettings({ ...bannerSettings, count: e.target.value })}
                        placeholder="529.671"
                        className="rounded-md text-xs"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-xs uppercase">Văn bản phụ (Suffix)</Label>
                      <Input
                        value={bannerSettings.suffix}
                        onChange={(e) => setBannerSettings({ ...bannerSettings, suffix: e.target.value })}
                        placeholder="THÀNH VIÊN CLASSICX CLUB"
                        className="rounded-md text-xs"
                      />
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t space-y-4">
                    <Label className="text-xs uppercase font-semibold block mb-2">Top Announcement Banner (Sắp ra mắt)</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs uppercase">Nội dung thông báo Top</Label>
                        <Input
                          value={bannerSettings.heroTitle}
                          onChange={(e) => setBannerSettings({ ...bannerSettings, heroTitle: e.target.value })}
                          placeholder="Freeship toàn quốc cho đơn hàng từ 500k"
                          className="rounded-md text-xs"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs uppercase">Đường dẫn khi click</Label>
                        <Input
                          value={bannerSettings.heroLink}
                          onChange={(e) => setBannerSettings({ ...bannerSettings, heroLink: e.target.value })}
                          placeholder="/collections/sale"
                          className="rounded-md text-xs"
                        />
                      </div>
                    </div>
                  </div>

                </CardContent>
              </Card>

              <Card className="rounded-md border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xs font-semibold tracking-tight">
                    Thông tin cơ bản (General Settings)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Cấu hình logo, favicon, thông tin liên hệ và các mạng xã hội của cửa hàng.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Branding */}
                  <div className="space-y-4">
                    <Label className="text-xs uppercase font-semibold text-primary">Nhận diện thương hiệu</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs uppercase">Logo URL</Label>
                        <Input
                          value={generalSettings.logo}
                          onChange={(e) => setGeneralSettings({ ...generalSettings, logo: e.target.value })}
                          placeholder="https://... (URL hình ảnh logo)"
                          className="rounded-md text-xs"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs uppercase">Favicon URL</Label>
                        <Input
                          value={generalSettings.favicon}
                          onChange={(e) => setGeneralSettings({ ...generalSettings, favicon: e.target.value })}
                          placeholder="https://... (URL hình ảnh favicon)"
                          className="rounded-md text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-4">
                    <Label className="text-xs uppercase font-semibold text-primary">Thông tin liên hệ</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs uppercase">Hotline / Số điện thoại</Label>
                        <Input
                          value={generalSettings.hotline}
                          onChange={(e) => setGeneralSettings({ ...generalSettings, hotline: e.target.value })}
                          placeholder="Ví dụ: 1900 xxxx"
                          className="rounded-md text-xs"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs uppercase">Email hỗ trợ</Label>
                        <Input
                          value={generalSettings.email}
                          onChange={(e) => setGeneralSettings({ ...generalSettings, email: e.target.value })}
                          placeholder="support@domain.com"
                          className="rounded-md text-xs"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-xs uppercase">Địa chỉ cửa hàng</Label>
                        <Input
                          value={generalSettings.address}
                          onChange={(e) => setGeneralSettings({ ...generalSettings, address: e.target.value })}
                          placeholder="Địa chỉ trụ sở chính / cửa hàng..."
                          className="rounded-md text-xs"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-xs uppercase">Giờ làm việc</Label>
                        <Input
                          value={generalSettings.working_hours}
                          onChange={(e) => setGeneralSettings({ ...generalSettings, working_hours: e.target.value })}
                          placeholder="VD: Thứ 2 - Chủ Nhật (9:00 - 22:00)"
                          className="rounded-md text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Social Links */}
                  <div className="space-y-4">
                    <Label className="text-xs uppercase font-semibold text-primary">Mạng xã hội</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs uppercase">Facebook Fanpage URL</Label>
                        <Input
                          value={generalSettings.social_facebook}
                          onChange={(e) => setGeneralSettings({ ...generalSettings, social_facebook: e.target.value })}
                          placeholder="https://facebook.com/..."
                          className="rounded-md text-xs"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs uppercase">Instagram URL</Label>
                        <Input
                          value={generalSettings.social_instagram}
                          onChange={(e) => setGeneralSettings({ ...generalSettings, social_instagram: e.target.value })}
                          placeholder="https://instagram.com/..."
                          className="rounded-md text-xs"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs uppercase">TikTok URL</Label>
                        <Input
                          value={generalSettings.social_tiktok}
                          onChange={(e) => setGeneralSettings({ ...generalSettings, social_tiktok: e.target.value })}
                          placeholder="https://tiktok.com/@..."
                          className="rounded-md text-xs"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs uppercase">Zalo OA URL / Phone</Label>
                        <Input
                          value={generalSettings.social_zalo}
                          onChange={(e) => setGeneralSettings({ ...generalSettings, social_zalo: e.target.value })}
                          placeholder="Đường dẫn Zalo..."
                          className="rounded-md text-xs"
                        />
                      </div>
                    </div>
                  </div>

                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
