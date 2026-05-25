import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = createClient(await cookies());
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("profile_id", user.id)
    .single();

  if (!membership) return NextResponse.json({ success: false, error: "No org" }, { status: 404 });

  const { data: org } = await supabase
    .from("organizations")
    .select("storefront_theme, storefront_features, storefront_custom_css")
    .eq("id", membership.organization_id)
    .single();

  return NextResponse.json({ success: true, data: org });
}

export async function POST(request: NextRequest) {
  const supabase = createClient(await cookies());
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("profile_id", user.id)
    .single();

  if (!membership) return NextResponse.json({ success: false, error: "No org" }, { status: 404 });

  try {
    const body = await request.json();
    const { storefront_custom_css, storefront_theme } = body;

    const { error } = await supabase
      .from("organizations")
      .update({
        storefront_custom_css,
        storefront_theme
      })
      .eq("id", membership.organization_id);

    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
