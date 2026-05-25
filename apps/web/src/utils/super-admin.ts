// Centralised super-admin email check.
//
// Reads NEXT_PUBLIC_SUPER_ADMIN_EMAILS (comma-separated) at build time and
// always includes the original hard-coded address `quan.tm@zpos.click` and
// internal `@zpos.click` emails as safe defaults so nothing breaks if the env
// var or Auth metadata is missing.
//
// Example: NEXT_PUBLIC_SUPER_ADMIN_EMAILS="quan.tm@zpos.click,owner@example.com"
//
// Works in both browser and edge-middleware contexts because we only depend
// on process.env values that Next.js inlines into both bundles.

const HARD_CODED_DEFAULT = "quan.tm@zpos.click";

function parseList(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

const ENV_LIST = parseList(process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS);

export const SUPER_ADMIN_EMAILS: readonly string[] = Array.from(new Set([HARD_CODED_DEFAULT, ...ENV_LIST]));

export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.toLowerCase().trim();
  return SUPER_ADMIN_EMAILS.includes(normalized) || normalized.endsWith("@zpos.click");
}

export function isSuperAdminUser(
  user?: {
    email?: string | null;
    user_metadata?: Record<string, unknown> | null;
    app_metadata?: Record<string, unknown> | null;
  } | null,
): boolean {
  if (!user) return false;
  if (isSuperAdminEmail(user.email)) return true;

  const userRole = String(user.user_metadata?.role || user.user_metadata?.global_role || "").toLowerCase();
  const appRole = String(user.app_metadata?.role || user.app_metadata?.global_role || "").toLowerCase();
  const metadataFlag = user.user_metadata?.is_super_admin === true || user.app_metadata?.is_super_admin === true;

  return metadataFlag || userRole === "super_admin" || appRole === "super_admin";
}
