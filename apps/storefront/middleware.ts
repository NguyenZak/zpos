import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { resolveTenantFromHost } from "./src/lib/tenant";

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;

  // Get hostname of request (e.g. bibomart.zshop.click or bibomart.com)
  const host = request.headers.get("host") || request.headers.get("x-forwarded-host") || "";

  // Bypass for local development if not simulating host
  if (host.includes("localhost") || host.includes("127.0.0.1")) {
    if (!host.includes(".localhost")) {
      // Return 404 or a default page for base localhost
      return new NextResponse("Tenant not found. Use {slug}.localhost to test locally.", { status: 404 });
    }
  }

  // Resolve tenant via Redis KV (falling back to DB only on miss)
  const tenant = await resolveTenantFromHost(host);

  if (!tenant) {
    return new NextResponse("Storefront not found or disabled", { status: 404 });
  }

  // Rewrite the URL to include the tenant slug in the header or path?
  // The spec says: "Rewrite /storefront/{path} + header x-zpos-storefront-tenant"
  // Wait, in apps/storefront, the app router handles the roots. So we don't need to rewrite to /storefront.
  // We can just pass the tenant info via headers.
  
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-zpos-storefront-tenant-id", tenant.id);
  requestHeaders.set("x-zpos-storefront-tenant-slug", tenant.slug);

  return NextResponse.rewrite(request.nextUrl, {
    request: {
      headers: requestHeaders,
    },
  });
}
