import type { Metadata } from "next";
import { headers, cookies } from "next/headers";
import { resolveTenantFromHost } from "../lib/tenant";
import { createServerClient } from "@supabase/ssr";
import "./globals.css";
import Link from "next/link";
import { getCart } from "../actions/cart-actions";
import { Toaster } from "sonner";
import { ClubBanner } from "../components/ClubBanner";
import { Footer } from "../components/Footer";
import { SearchBar } from "../components/SearchBar";

export async function generateMetadata(): Promise<Metadata> {
  const h = await headers();
  const host = h.get("host") || h.get("x-forwarded-host") || "";
  const tenant = await resolveTenantFromHost(host);

  if (!tenant) return { title: "Storefront Not Found" };

  return {
    title: {
      template: `%s | ${tenant.name}`,
      default: tenant.name,
    },
    description: `Official Storefront of ${tenant.name}`,
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const h = await headers();
  const host = h.get("host") || h.get("x-forwarded-host") || "";

  // We fetch tenant directly here to get theme/features/css
  // Next.js request memoization will cache it per request
  const tenant = await resolveTenantFromHost(host);

  if (!tenant) {
    return (
      <html lang="en">
        <body>Storefront not found.</body>
      </html>
    );
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => { } } }
  );

  // Fetch online categories for dynamic navbar links
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .eq("organization_id", tenant.id)
    .eq("is_published_online", true)
    .order("display_order", { ascending: true })
    .limit(5);

  const cart = await getCart();
  const cartCount = cart.items.reduce((acc, item) => acc + item.qty, 0);

  return (
    <html lang="en">
      <head>
        {tenant.customHead && (
          <div dangerouslySetInnerHTML={{ __html: tenant.customHead }} />
        )}
        {tenant.customCss && (
          <style dangerouslySetInnerHTML={{ __html: tenant.customCss }} />
        )}
      </head>
      <body data-theme={tenant.theme || "minimal"} className="flex flex-col min-h-screen">
        {tenant.settings?.banner?.heroTitle && (
          <div className="w-full bg-black text-white text-center text-[10px] sm:text-xs py-2 uppercase tracking-widest px-4">
            {tenant.settings.banner.heroLink ? (
              <Link href={tenant.settings.banner.heroLink} className="hover:underline">
                {tenant.settings.banner.heroTitle}
              </Link>
            ) : (
              <span>{tenant.settings.banner.heroTitle}</span>
            )}
          </div>
        )}
        {/* Minimal High-Fashion Zara Header */}
        <header
          className="w-full sticky top-0 z-50 py-6 px-8 flex flex-col md:flex-row justify-between items-start md:items-end border-b transition-all duration-300 gap-4"
          style={{
            backgroundColor: 'var(--color-luminous-white)',
            borderColor: 'var(--color-pitch-black)'
          }}
        >
          <Link
            href="/"
            className="text-3xl font-light tracking-tighter uppercase leading-none"
            style={{
              fontFamily: "'Helvetica Now Text', 'Helvetica Neue', Arial, sans-serif",
              color: 'var(--color-pitch-black)'
            }}
          >
            {tenant.name}
          </Link>
          <nav
            className="flex flex-wrap gap-x-8 gap-y-2 text-xs tracking-widest uppercase items-center"
            style={{ color: 'var(--color-pitch-black)' }}
          >
            <Link href="/" className="hover:opacity-60 transition-opacity">Home</Link>
            <Link href="/products" className="hover:opacity-60 transition-opacity">Shop All</Link>

            {/* Dynamic category links */}
            {categories && categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/categories/${cat.id}`}
                className="hover:opacity-60 transition-opacity"
              >
                {cat.name}
              </Link>
            ))}

            <Link href="/account/orders" className="hover:opacity-60 transition-opacity">Lookup</Link>
            <SearchBar tenantId={tenant.id} />
            <div className="relative group py-2 -my-2">
              <Link href="/cart" className="hover:opacity-60 transition-opacity flex items-center gap-1">
                Cart {cartCount > 0 && <span>({cartCount})</span>}
              </Link>

              {cart.items.length > 0 && (
                <div className="absolute right-0 top-full mt-2 w-80 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                  <div className="bg-white border border-neutral-200 shadow-[0px_4px_24px_rgba(0,0,0,0.08)] rounded-2xl p-5 flex flex-col gap-4 max-h-[60vh] overflow-y-auto cursor-default normal-case tracking-normal">
                    <p className="font-semibold text-sm border-b pb-3 mb-1 uppercase tracking-widest text-black">Giỏ hàng của bạn</p>
                    {cart.items.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="flex gap-4 border-b border-neutral-100 pb-4 last:border-0 last:pb-0">
                        {item.image ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={item.image} alt={item.name} className="w-16 h-20 object-cover rounded-lg shrink-0" />
                        ) : (
                          <div className="w-16 h-20 bg-neutral-100 rounded-lg shrink-0" />
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-neutral-900 line-clamp-2 leading-snug">{item.name}</p>
                          <p className="text-xs text-neutral-500 mt-1 uppercase tracking-wider">SL: {item.qty}</p>
                          <p className="text-sm font-semibold text-neutral-900 mt-1">
                            {(item.unit_price * item.qty).toLocaleString('vi-VN')}đ
                          </p>
                        </div>
                      </div>
                    ))}
                    {cart.items.length > 3 && (
                      <p className="text-xs text-center text-neutral-500 py-2">
                        Và {cart.items.length - 3} sản phẩm khác...
                      </p>
                    )}
                    <Link href="/cart" className="w-full text-center bg-black text-white rounded-full py-3 text-xs uppercase tracking-widest hover:bg-neutral-800 transition-colors mt-2">
                      Xem giỏ hàng
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </nav>
        </header>

        <div className="flex-grow">
          {children}
        </div>

        {/* Banner Section Above Footer */}
        {tenant.settings?.banner?.enabled !== false && (
          <div className="px-4 lg:px-8 w-full">
            <ClubBanner settings={tenant.settings?.banner} />
          </div>
        )}

        {/* Standard Footer */}
        <Footer />

        <Toaster position="top-right" />
      </body>
    </html>
  );
}
