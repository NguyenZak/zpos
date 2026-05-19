// Centralised super-admin email check.
//
// Reads NEXT_PUBLIC_SUPER_ADMIN_EMAILS (comma-separated) at build time and
// always includes the original hard-coded address `quan.tm@zpos.click` as a
// safe default so nothing breaks if the env var is missing.
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

export const SUPER_ADMIN_EMAILS: readonly string[] = Array.from(
  new Set([HARD_CODED_DEFAULT, ...ENV_LIST]),
);

export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return SUPER_ADMIN_EMAILS.includes(email.toLowerCase().trim());
}
