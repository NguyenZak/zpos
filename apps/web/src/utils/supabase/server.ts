import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const createClient = (cookieStore: Awaited<ReturnType<typeof cookies>>) => {
  const isDev = process.env.NODE_ENV === "development";
  let mainDomain = process.env.NEXT_PUBLIC_MAIN_DOMAIN || "localhost:3000";

  let cookieDomain = undefined;
  if (!isDev) {
    let hostname = "";
    try {
      const { headers } = require("next/headers");
      hostname = headers().get("host") || "";
    } catch (e) {}

    if (hostname.includes("zpos.click")) {
      mainDomain = "zpos.click";
    } else if (hostname.includes("zpos.vn")) {
      mainDomain = "zpos.vn";
    }

    if (hostname && hostname.endsWith(mainDomain)) {
      cookieDomain = `.${mainDomain}`;
    } else {
      cookieDomain = ".zpos.click";
    }
  }

  return createServerClient(supabaseUrl!, supabaseKey!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            const opt = isDev ? { ...options, path: "/" } : { ...options, domain: cookieDomain, path: "/" };
            if (isDev) delete opt.domain;
            cookieStore.set(name, value, opt);
          });
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
    cookieOptions: isDev ? { path: "/" } : { domain: cookieDomain, path: "/" },
  });
};
