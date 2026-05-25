import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const createClient = () => {
  const isDev = process.env.NODE_ENV === "development";
  let mainDomain = process.env.NEXT_PUBLIC_MAIN_DOMAIN || "localhost:3000";
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname.includes("zpos.click")) {
      mainDomain = "zpos.click";
    } else if (hostname.includes("zpos.vn")) {
      mainDomain = "zpos.vn";
    }
  }

  let cookieDomain = undefined;
  if (!isDev && typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname.endsWith(mainDomain)) {
      cookieDomain = `.${mainDomain}`;
    } else {
      cookieDomain = ".zpos.click";
    }
  }

  return createBrowserClient(supabaseUrl!, supabaseKey!, {
    cookieOptions: isDev ? { path: "/" } : { domain: cookieDomain, path: "/" },
  });
};
