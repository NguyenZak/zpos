import type { MetadataRoute } from "next";
import { APP_CONFIG } from "@/config/app-config";

// Force sitemap to be dynamically revalidated (or static with revalidation)
export const revalidate = 3600; // Cache for 1 hour

/**
 * Next.js App Router dynamic Sitemap generator.
 * Combines static landing routes, programmatic industry solutions, and dynamic blog posts
 * with proper priority and change frequencies.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = APP_CONFIG.url;

  // 1. Core static marketing pages
  const staticPages = [
    {
      url: `${siteUrl}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1.0,
    },
    {
      url: `${siteUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    {
      url: `${siteUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.9,
    },
  ];

  // 2. Programmatic SEO Solution pages (Industry specific)
  const solutions = ["retail", "cafe-restaurant", "boutique-fashion", "mini-mart", "chain-store"];
  const solutionPages = solutions.map((slug) => ({
    url: `${siteUrl}/solutions/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // 3. Programmatic SEO Feature pages (Key selling points)
  const features = [
    "offline-sync",
    "multi-device-management",
    "sales-analytics",
    "inventory-management",
    "payment-integration",
  ];
  const featurePages = features.map((slug) => ({
    url: `${siteUrl}/features/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // 4. Dynamic Blog Posts (Article content)
  // Inside a real DB environment, you query: const posts = await supabase.from('posts').select('slug, updated_at');
  // We provide realistic dynamic mappings based on CMS records
  const mockBlogSlugs = [
    { slug: "cach-toi-uu-hoa-he-thong-pos-cho-mua-mua-sam-cao-diem", date: "2026-05-15" },
    { slug: "chuong-trinh-khach-hang-than-thiet-chia-khoa-giu-chan-80-percent-doanh-thu", date: "2026-05-12" },
    { slug: "giai-phap-ban-hang-da-kenh-omni-channel-xu-huong-tat-yeu-2026", date: "2026-05-10" },
  ];

  const blogPages = mockBlogSlugs.map((post) => ({
    url: `${siteUrl}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...solutionPages, ...featurePages, ...blogPages];
}
