import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { resolveTenantFromHost } from "../../lib/tenant";
import { BlockRenderer, type Block } from "@zpos/storefront-blocks";
import { createSupabaseDataSource } from "../../lib/block-data-source";
import { createServerClient } from "@supabase/ssr";
import type { Metadata } from "next";

function makeAnonClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug?: string[] }> }): Promise<Metadata> {
  const h = await headers();
  const host = h.get("host") || h.get("x-forwarded-host") || "";
  const tenant = await resolveTenantFromHost(host);
  if (!tenant) return {};

  const resolvedParams = await params;
  const slugPath = resolvedParams.slug?.join("/") || "home";

  if (slugPath === "home") {
    return {
      title: `Trang Chủ | ${tenant.name}`,
    };
  }

  // Fetch page metadata from storefront_pages
  const supabase = makeAnonClient();
  const { data } = await supabase
    .from("storefront_pages")
    .select("title, seo_title, seo_description")
    .eq("organization_id", tenant.id)
    .eq("slug", slugPath)
    .eq("is_published", true)
    .maybeSingle();

  if (data) {
    return {
      title: data.seo_title ? `${data.seo_title} | ${tenant.name}` : `${data.title} | ${tenant.name}`,
      description: data.seo_description || undefined
    };
  }

  const title = slugPath.charAt(0).toUpperCase() + slugPath.slice(1);
  return {
    title: `${title} | ${tenant.name}`,
  };
}

async function fetchBlocks(tenantId: string, blockType: string): Promise<Block[]> {
  const supabase = makeAnonClient();
  const { data, error } = await supabase
    .from("storefront_block_overrides")
    .select("props")
    .eq("tenant_id", tenantId)
    .eq("block_type", blockType)
    .maybeSingle();

  if (error || !data || !data.props || !Array.isArray(data.props.blocks) || data.props.blocks.length === 0) {
    // Default fallback blocks if no override exists
    return [
      {
        type: "hero",
        props: {
          headline: "CLASSIC X STUDIO",
          subheadline: "COLLECTION 2026 / MINIMALISM & GEOMETRY",
          image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200&auto=format&fit=crop",
          cta: {
            label: "DISCOVER THE COLLECTION",
            href: "/products",
          },
          align: "center",
        },
      },
      {
        type: "rich-text",
        props: {
          html: `<div class="text-center py-16 px-4 max-w-2xl mx-auto">
            <p class="text-xs uppercase tracking-[0.25em] text-gray-500 mb-4">The Philosophy</p>
            <h2 class="text-2xl uppercase tracking-[0.2em] font-light leading-relaxed text-black mb-6" style="font-family: var(--font-sans)">
              STARK MONOCHROME. GEOMETRIC SYMMETRY. ABSOLUTE FUNCTIONALITY.
            </h2>
            <div class="w-12 h-[1px] bg-black mx-auto mb-6"></div>
            <p class="text-sm tracking-wide text-gray-600 leading-relaxed font-light">
              Classic X Studio defines modern wardrobe architecture. Each piece is constructed with clean lines, zero ornamentation, and a relentless focus on silhouette and materiality.
            </p>
          </div>`,
          maxWidth: "medium",
        },
      },
      {
        type: "banner-split",
        props: {
          left: {
            image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=800&auto=format&fit=crop",
            headline: "WOMEN'S EDITORIAL",
            href: "/products",
          },
          right: {
            image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800&auto=format&fit=crop",
            headline: "MEN'S EDITORIAL",
            href: "/products",
          },
        },
      },
      {
        type: "product-grid",
        props: {
          title: "NEW IN",
          source: "best-seller",
          limit: 8,
          columns: 4,
          layout: "grid",
        },
      }
    ];
  }

  return data.props.blocks;
}

async function fetchPage(tenantId: string, slug: string) {
  const supabase = makeAnonClient();
  const { data } = await supabase
    .from("storefront_pages")
    .select("*")
    .eq("organization_id", tenantId)
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  return data;
}

export default async function StorefrontPage({ params }: { params: Promise<{ slug?: string[] }> }) {
  const h = await headers();
  const host = h.get("host") || h.get("x-forwarded-host") || "";
  
  const tenant = await resolveTenantFromHost(host);
  if (!tenant) return null;

  const resolvedParams = await params;
  const slugPath = resolvedParams.slug?.join("/") || "home";

  const dataSource = createSupabaseDataSource(tenant.id);

  if (slugPath === "home") {
    const blocks = await fetchBlocks(tenant.id, "page_home");
    return (
      <main className="min-h-screen">
        <BlockRenderer blocks={blocks} dataSource={dataSource} />
      </main>
    );
  }

  // Fallback to fetch from storefront_pages for any other slug
  const pageData = await fetchPage(tenant.id, slugPath);
  if (!pageData) {
    notFound();
  }

  let blocks: Block[] = [];
  if (pageData.content && Array.isArray(pageData.content.blocks)) {
    blocks = pageData.content.blocks;
  } else if (pageData.content && typeof pageData.content.html === 'string') {
    blocks = [
      {
        type: "rich-text",
        props: {
          html: `<div class="prose max-w-none text-gray-800 leading-relaxed font-light">${pageData.content.html}</div>`,
          maxWidth: "medium"
        }
      }
    ];
  } else if (pageData.content && typeof pageData.content.text === 'string') {
    blocks = [
      {
        type: "rich-text",
        props: {
          html: `<div class="prose max-w-none text-gray-800 leading-relaxed font-light">${pageData.content.text.replace(/\n/g, '<br/>')}</div>`,
          maxWidth: "medium"
        }
      }
    ];
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="pt-24 pb-12 text-center border-b bg-zinc-50">
        <h1 className="text-3xl font-light tracking-[0.2em] uppercase text-zinc-900">{pageData.title}</h1>
      </div>
      <div className="py-12">
        <BlockRenderer blocks={blocks} dataSource={dataSource} />
      </div>
    </main>
  );
}
