export const ROUTE_PERMISSION_MAP: Record<string, string> = {
  '/dashboard': 'dashboard.view',
  '/pos': 'pos.view',
  '/ai': 'ai.view',
  '/products': 'products.view',
  '/categories': 'products.view',
  '/inventory': 'inventory.view',
  '/orders': 'orders.view',
  '/customers': 'customers.view',
  '/suppliers': 'suppliers.view',
  '/staff': 'staff.view',
  '/purchases': 'purchases.view',
  '/reports': 'reports.view',
  '/settings': 'settings.view',
  '/finance': 'finance.view',
};

/**
 * Maps a given request path to the required permission key.
 * Trims sub-paths to find the closest match.
 */
export function getRequiredPermissionForPath(pathname: string): string | null {
  let path = pathname.split('?')[0];

  // Strip prefix /app if present (e.g. /app/dashboard -> /dashboard)
  if (path.startsWith('/app')) {
    path = path.slice(4);
  }

  // Ensure path starts with /
  if (!path.startsWith('/')) {
    path = '/' + path;
  }

  // Sort paths by length descending to match most specific path first
  const sortedPaths = Object.keys(ROUTE_PERMISSION_MAP).sort((a, b) => b.length - a.length);
  for (const p of sortedPaths) {
    if (path === p || path.startsWith(p + '/')) {
      return ROUTE_PERMISSION_MAP[p];
    }
  }

  return null;
}
