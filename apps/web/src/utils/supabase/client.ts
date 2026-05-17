import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const createClient = () => {
  const isDev = process.env.NODE_ENV === "development";

  return createBrowserClient(
    supabaseUrl!,
    supabaseKey!,
    {
      cookieOptions: isDev 
        ? { path: "/" }
        : { domain: ".zpos.vn", path: "/" },
    }
  );
};
