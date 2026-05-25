export const ROUTE_PERMISSION_MAP: Record<string, string> = {
  "/dashboard": "dashboard.view",
  "/pos": "pos.access",
  "/shifts": "shifts.view",
  "/ai": "ai.chat",
  "/products/barcodes": "products.barcode.print",
  "/products": "products.view",
  "/categories": "categories.view",
  "/inventory": "inventory.view",
  "/orders": "orders.view",
  "/customers": "customers.view",
  "/suppliers": "suppliers.view",
  "/staff": "staff.view",
  "/purchases": "purchases.view",
  "/reports": "reports.dashboard.view",
  "/settings": "settings.business.view",
  "/settings/branches": "settings.branches.manage",
  "/settings/printers": "settings.printers.manage",
  "/settings/billing": "settings.billing.update",
  "/settings/tax": "settings.tax.manage",
  "/settings/payments": "settings.payments.manage",
  "/settings/security": "settings.security.manage",
  "/settings/integrations": "settings.integrations.manage",
  "/settings/roles": "roles.manage",
  "/finance": "finance.overview.view",
  "/debt": "debt.view",
  "/invoices": "einvoice.view",
  "/loyalty": "loyalty.view",
  "/crm/zalo-messages": "zalo.view",
  "/sync": "sync.view",
};

/**
 * Maps a given request path to the required permission key.
 * Trims sub-paths to find the closest match.
 */
export function getRequiredPermissionForPath(pathname: string): string | null {
  let path = pathname.split("?")[0];

  // Strip prefix /app if present (e.g. /app/dashboard -> /dashboard)
  if (path.startsWith("/app")) {
    path = path.slice(4);
  }

  // Ensure path starts with /
  if (!path.startsWith("/")) {
    path = "/" + path;
  }

  // Sort paths by length descending to match most specific path first
  const sortedPaths = Object.keys(ROUTE_PERMISSION_MAP).sort((a, b) => b.length - a.length);
  for (const p of sortedPaths) {
    if (path === p || path.startsWith(p + "/")) {
      return ROUTE_PERMISSION_MAP[p];
    }
  }

  return null;
}
