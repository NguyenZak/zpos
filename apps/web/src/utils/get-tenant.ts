import { headers } from "next/headers";
import { createClient } from "./supabase/server";
import { cookies } from "next/headers";

function resolveMainDomain(host: string) {
  let mainDomain = process.env.NEXT_PUBLIC_MAIN_DOMAIN || "localhost:3000";

  if (host.includes("localhost")) {
    const port = host.includes(":") ? host.split(":").pop() : "";
    return port ? `localhost:${port}` : "localhost";
  }

  if (host.includes("zpos.click")) {
    mainDomain = "zpos.click";
  } else if (host.includes("zpos.vn")) {
    mainDomain = "zpos.vn";
  }

  return mainDomain;
}

function getSubdomainFromHost(host: string) {
  const mainDomain = resolveMainDomain(host);
  return host.endsWith(`.${mainDomain}`) ? host.replace(`.${mainDomain}`, "") : null;
}

export async function getTenantFromHost() {
  const headersList = await headers();
  const host = headersList.get("host") || "";
  const subdomain = getSubdomainFromHost(host);

  if (!subdomain || ["www", "app", "console", "cms"].includes(subdomain)) {
    return null;
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: tenant } = await supabase.from("organizations").select("*").eq("slug", subdomain).maybeSingle();

  return tenant || null;
}

export async function getIsConsoleFromHost() {
  const headersList = await headers();
  const host = headersList.get("host") || "";
  const subdomain = getSubdomainFromHost(host);

  return subdomain === "console";
}

export async function getIsAppFromHost() {
  const headersList = await headers();
  const host = headersList.get("host") || "";
  const subdomain = getSubdomainFromHost(host);

  return subdomain === "app";
}
