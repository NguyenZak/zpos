import { createClient } from "@/utils/supabase/client";

/**
 * Cleanly purges all active sessions, including live Supabase authentication state,
 * local storage tokens, and multi-subdomain sandbox mock cookies.
 */
export async function clearAllSessions(supabaseClient?: any) {
  // 1. Sign out from Live Supabase if possible
  try {
    const supabase = supabaseClient || createClient();
    await supabase.auth.signOut();
  } catch (e) {
    console.warn("Supabase signOut failed or was bypassed:", e);
  }

  // 2. Flush Browser Storage and Subdomain Cookies
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem("zpos_mock_user");
      localStorage.removeItem("zpos_mock_session");
      localStorage.removeItem("supabase.auth.token");
      sessionStorage.clear();
    } catch (e) {
      console.error("Failed to clear local or session storage:", e);
    }

    const cookieName = "zpos_mock_session";
    const host = window.location.hostname;

    // Define all potential subdomains and root domains to completely purge the cookie
    const domains = [
      "", // Current host-only
      host,
      `.${host}`,
      "localhost",
      ".localhost",
      "zpos.click",
      ".zpos.click",
      "zpos.vn",
      ".zpos.vn",
      "zpos-web.vercel.app",
      ".zpos-web.vercel.app",
    ];

    domains.forEach((dom) => {
      let cookieStr = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      if (dom) {
        cookieStr += `; domain=${dom}`;
      }
      document.cookie = cookieStr;
    });
  }
}
