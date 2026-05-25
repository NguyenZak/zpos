import { StorefrontAdminClient } from "./StorefrontAdminClient";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function StorefrontAdminPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // We must get the user to get their organization
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8 border max-w-md bg-card">
          <p className="text-sm text-muted-foreground mb-4">
            Không tìm thấy phiên đăng nhập hợp lệ. Vui lòng đăng nhập lại.
          </p>
          <Link
            href="/login"
            className="text-sm font-medium border rounded-md px-4 py-2 hover:bg-accent transition-colors"
          >
            Đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  // Get organization from organization_members
  const { data: member } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!member?.organization_id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8 border max-w-md bg-card">
          <p className="text-sm text-muted-foreground">Tài khoản của bạn chưa được cấp quyền quản lý cửa hàng nào.</p>
        </div>
      </div>
    );
  }

  const orgId = member.organization_id;

  const { data: org } = await supabase
    .from("organizations")
    .select(
      "storefront_enabled, storefront_custom_domain, custom_domain_status, storefront_settings, storefront_theme, storefront_features, storefront_custom_css, storefront_custom_head, slug",
    )
    .eq("id", orgId)
    .single();

  const { data: products } = await supabase
    .from("products")
    .select("id, name, is_published_online, online_price")
    .eq("organization_id", orgId)
    .eq("is_active", true)
    .limit(50);

  const { data: blocksOverride } = await supabase
    .from("storefront_block_overrides")
    .select("props")
    .eq("tenant_id", orgId)
    .eq("block_type", "page_home")
    .maybeSingle();

  const homeBlocksJson = blocksOverride?.props ? JSON.stringify(blocksOverride.props, null, 2) : '{\n  "blocks": []\n}';

  return (
    <div className="flex flex-col gap-6 w-full pb-20 pt-6 px-2">
      <StorefrontAdminClient
        org={org || {}}
        products={products || []}
        orgId={orgId}
        initialHomeBlocksJson={homeBlocksJson}
      />
    </div>
  );
}
