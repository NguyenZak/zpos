import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.split(" ")[1];

    if (!token || token !== process.env.STOREFRONT_REVALIDATE_TOKEN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tags = searchParams.getAll("tag");

    if (!tags || tags.length === 0) {
      return NextResponse.json({ error: "Missing tag param" }, { status: 400 });
    }

    for (const tag of tags) {
      revalidateTag(tag, "max");
    }

    return NextResponse.json({ revalidated: true, now: Date.now(), tags });
  } catch (err) {
    return NextResponse.json({ error: "Error revalidating" }, { status: 500 });
  }
}
