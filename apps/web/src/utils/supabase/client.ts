import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const createClient = () => {
  const isDev = process.env.NODE_ENV === "development";
  const mainDomain = process.env.NEXT_PUBLIC_MAIN_DOMAIN || 'localhost:3000';

  let cookieDomain = undefined;
  if (!isDev && typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname.endsWith(mainDomain)) {
      cookieDomain = `.${mainDomain}`;
    } else {
      cookieDomain = ".zpos.vn";
    }
  }

  return createBrowserClient(
    supabaseUrl!,
    supabaseKey!,
    {
      cookieOptions: isDev 
        ? { path: "/" }
        : { domain: cookieDomain, path: "/" },
    }
  );
};
