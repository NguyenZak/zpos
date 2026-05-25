import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenant = searchParams.get("tenant");
    const tagsParam = searchParams.get("tags");

    if (!tenant) {
      return NextResponse.json({ error: "Missing tenant param" }, { status: 400 });
    }

    if (!tagsParam) {
      return NextResponse.json({ error: "Missing tags param" }, { status: 400 });
    }

    const tags = tagsParam.split(",");

    // Revalidate specific tags for the tenant
    for (const tag of tags) {
      // @ts-ignore - Next.js 16 types require a second argument for CacheLifeConfig
      revalidateTag(`tenant:${tenant}:${tag}`);
    }

    return NextResponse.json({ success: true, revalidated: true, tenant, tags });
  } catch (error) {
    return NextResponse.json({ error: "Failed to revalidate" }, { status: 500 });
  }
}
