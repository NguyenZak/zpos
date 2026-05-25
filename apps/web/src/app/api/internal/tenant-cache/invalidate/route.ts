import { NextRequest, NextResponse } from "next/server";
import { invalidateTenantBySlug, invalidateTenantByDomain } from "@/lib/tenant-cache";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    const domain = searchParams.get("domain");

    if (slug) {
      invalidateTenantBySlug(slug);
    }

    if (domain) {
      invalidateTenantByDomain(domain);
    }

    return NextResponse.json({ success: true, slug, domain });
  } catch (error) {
    return NextResponse.json({ error: "Failed to invalidate cache" }, { status: 500 });
  }
}
