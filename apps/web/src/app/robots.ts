import type { MetadataRoute } from "next";
import { APP_CONFIG } from "@/config/app-config";

/**
 * Next.js App Router dynamic Robots.txt generator.
 * Explicitly structures indexable routes vs non-indexable tenant dashboards & consoles.
 */
export default function robots(): MetadataRoute.Robots {
  const siteUrl = APP_CONFIG.url;

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/pricing",
          "/solutions",
          "/features",
          "/blog",
          "/blog/*",
          "/docs",
          "/changelog",
          "/_next/static/images/*",
        ],
        disallow: [
          "/app",
          "/app/",
          "/app/*",
          "/console",
          "/console/",
          "/console/*",
          "/cms",
          "/cms/",
          "/cms/*",
          "/api",
          "/api/",
          "/api/*",
          "/v1",
          "/v1/*",
          "/v2",
          "/v2/*",
          "/login",
          "/register",
          "/unauthorized",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: ["/", "/pricing", "/solutions", "/features", "/blog", "/blog/*", "/docs"],
        disallow: ["/app/*", "/console/*", "/cms/*", "/api/*"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
