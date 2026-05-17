import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function AppPage() {
  const headerList = await headers();
  const host = headerList.get("host") || "";
  const mainDomain = process.env.NEXT_PUBLIC_MAIN_DOMAIN || "localhost:3000";

  // If we are on the main domain (not a subdomain), we need to include /app in the redirect path
  if (host === mainDomain || host === `www.${mainDomain}`) {
    redirect("/app/dashboard");
  }

  // If we are on a subdomain (e.g., app.zpos.vn), the middleware handles the /app prefix
  redirect("/dashboard");
}
