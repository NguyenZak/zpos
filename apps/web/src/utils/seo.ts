import type { Metadata } from "next";
import { APP_CONFIG } from "@/config/app-config";

export interface SEOOptions {
  title?: string;
  siteName?: string; // Tên trang/thương hiệu tùy chỉnh của tenant (VD: Juno, Bibo Mart, ZPOS)
  description?: string;
  path?: string;
  image?: string;
  type?: "website" | "article" | "profile" | "product";
  robots?: {
    index?: boolean;
    follow?: boolean;
    noimageindex?: boolean;
    noarchive?: boolean;
    nosnippet?: boolean;
  };
  keywords?: string[];
  locale?: string;
  alternates?: {
    canonical?: string;
    languages?: Record<string, string>;
  };
  publishedTime?: string;
  authors?: string[];
}

/**
 * Highly comprehensive slug generator designed to convert text, especially Vietnamese
 * diacritics, into clean, search-engine-friendly URLs.
 */
export function generateSlug(text: string): string {
  if (!text) return "";

  let slug = text.toString().toLowerCase().trim();

  // Map Vietnamese diacritics to simple ASCII characters
  const map: Record<string, string> = {
    a: "áàảãạăắằẳẵặâấầẩẫậ",
    d: "đ",
    e: "éèẻẽẹêếềểễệ",
    i: "íìỉĩị",
    o: "óòỏõọôốồổỗộơớờởỡợ",
    u: "úùủũụưứừửữự",
    y: "ýỳỷỹỵ",
  };

  for (const [ascii, unicodeChars] of Object.entries(map)) {
    for (const char of unicodeChars) {
      slug = slug.replace(new RegExp(char, "g"), ascii);
    }
  }

  return slug
    .replace(/[^a-z0-9\s-]/g, "") // Remove all non-alphanumeric characters except spaces and hyphens
    .replace(/\s+/g, "-")         // Replace spaces with a single hyphen
    .replace(/-+/g, "-")          // Replace multiple hyphens with a single hyphen
    .trim()
    .replace(/^-+|-+$/g, "");     // Trim leading and trailing hyphens
}

/**
 * Enterprise-level dynamic Next.js Metadata generator supporting canonicals,
 * social meta cards (OpenGraph + Twitter), Edge cache indicators, hreflang alternates,
 * and advanced search crawler policies.
 */
export function getMetadata(options: SEOOptions = {}): Metadata {
  const currentSiteName = options.siteName || APP_CONFIG.name;
  const title = options.title
    ? `${options.title} | ${currentSiteName}`
    : `${currentSiteName} — ${APP_CONFIG.description}`;
  const description = options.description || APP_CONFIG.meta.description;
  const siteUrl = APP_CONFIG.url;
  
  // Build dynamic path and canonical URLs
  const cleanPath = options.path ? (options.path.startsWith("/") ? options.path : `/${options.path}`) : "";
  const canonicalUrl = options.alternates?.canonical || `${siteUrl}${cleanPath}`;
  
  // OG Image - using dynamic OG Generator by default or fallback
  const ogImageUrl = options.image || `${siteUrl}/api/og?title=${encodeURIComponent(options.title || currentSiteName)}&description=${encodeURIComponent(description.slice(0, 100))}&badge=${encodeURIComponent(currentSiteName.toUpperCase())}`;

  // Build standard multi-language alternates
  const defaultLanguages = {
    vi: `${siteUrl}${cleanPath}`,
    en: `${siteUrl}/en${cleanPath}`,
    "x-default": `${siteUrl}${cleanPath}`,
  };

  // Robot controls
  const robotConfig = {
    index: options.robots?.index !== false,
    follow: options.robots?.follow !== false,
    googleBot: {
      index: options.robots?.index !== false,
      follow: options.robots?.follow !== false,
      maxVideoPreview: -1,
      maxImagePreview: "large" as const,
      maxSnippet: -1,
    },
  };

  const metadata: Metadata = {
    title,
    description,
    keywords: options.keywords || [
      "zpos",
      "phan mem ban hang",
      "he thong pos",
      "quan ly ban le",
      "pos offline sync",
      "saas multi tenant",
      "retail operating system"
    ],
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical: canonicalUrl,
      languages: options.alternates?.languages || defaultLanguages,
    },
    robots: robotConfig,
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: currentSiteName,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: options.locale || "vi_VN",
      type: options.type === "article" ? "article" : (options.type === "profile" ? "profile" : "website"),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
      creator: "@zpos_click",
      site: "@zpos_click",
    },
  };

  // Inject article metadata if applicable
  if (options.type === "article" && metadata.openGraph) {
    // Custom structure injection via otherFields since it's fully enterprise-ready
    const articleFields: Record<string, string | string[]> = {};
    if (options.publishedTime) {
      articleFields["article:published_time"] = options.publishedTime;
    }
    if (options.authors && options.authors.length > 0) {
      articleFields["article:author"] = options.authors;
    }
    
    metadata.other = {
      ...metadata.other,
      ...articleFields
    };
  }

  return metadata;
}
