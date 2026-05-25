import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const updateSession = async (request: NextRequest) => {
  const isDev = process.env.NODE_ENV === "development";
  const hostname = request.headers.get("host") || "";
  let mainDomain = process.env.NEXT_PUBLIC_MAIN_DOMAIN || "localhost:3000";
  if (hostname.includes("zpos.click")) {
    mainDomain = "zpos.click";
  } else if (hostname.includes("zpos.vn")) {
    mainDomain = "zpos.vn";
  }

  let cookieDomain = undefined;
  if (!isDev) {
    if (hostname.endsWith(mainDomain)) {
      cookieDomain = `.${mainDomain}`;
    } else {
      cookieDomain = ".zpos.click";
    }
  }

  // Create an unmodified response
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(supabaseUrl!, supabaseKey!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          const opt = isDev ? { ...options, path: "/" } : { ...options, domain: cookieDomain, path: "/" };
          if (isDev) delete opt.domain;
          supabaseResponse.cookies.set(name, value, opt);
        });
      },
    },
    cookieOptions: isDev ? { path: "/" } : { domain: cookieDomain, path: "/" },
  });

  // refreshing the auth token
  await supabase.auth.getUser();

  return supabaseResponse;
};
