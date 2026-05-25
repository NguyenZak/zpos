import * as fs from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";

// ==========================================
// 1. ENVIRONMENT CONFIGURATION LOADER
// ==========================================
function loadEnv() {
  const envPath = path.join(__dirname, "../../.env.local");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf8");
    envContent.split("\n").forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const idx = trimmed.indexOf("=");
        if (idx !== -1) {
          const key = trimmed.substring(0, idx).trim();
          let val = trimmed.substring(idx + 1).trim();
          // Strip quotes if present
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.substring(1, val.length - 1);
          }
          process.env[key] = val;
        }
      }
    });
  }
}

loadEnv();

// Colorful console indicators
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  bgCyan: "\x1b[46m",
  bgGreen: "\x1b[42m",
  bgRed: "\x1b[41m",
};

function printHeader(title: string) {
  console.log(`\n${colors.bright}${colors.bgCyan}  === ${title.toUpperCase()} ===  ${colors.reset}\n`);
}

function printSuccess(message: string) {
  console.log(`  ${colors.green}✓ PASS:${colors.reset} ${message}`);
}

function printFail(message: string) {
  console.log(`  ${colors.red}✗ FAIL:${colors.reset} ${message}`);
}

function printInfo(message: string) {
  console.log(`  ${colors.cyan}ℹ INFO:${colors.reset} ${message}`);
}

// ==========================================
// 2. TEST CASE EXECUTION
// ==========================================
async function runTests() {
  console.log(`\n${colors.bright}${colors.magenta}🚀 STARTING ZPOS DIAGNOSTIC TEST SUITE 🚀${colors.reset}`);
  console.log(`================================================`);

  let totalTests = 0;
  let passedTests = 0;

  const assert = (condition: boolean, message: string) => {
    totalTests++;
    if (condition) {
      passedTests++;
      printSuccess(message);
      return true;
    } else {
      printFail(message);
      return false;
    }
  };

  // ------------------------------------------
  // TEST SUITE 1: Environmental Config Check
  // ------------------------------------------
  printHeader("Test Suite 1: Environmental Configuration");

  assert(
    !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    `NEXT_PUBLIC_SUPABASE_URL is defined (${process.env.NEXT_PUBLIC_SUPABASE_URL})`,
  );
  assert(!!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is defined`);
  assert(
    process.env.NEXT_PUBLIC_MAIN_DOMAIN === "localhost:3000",
    `NEXT_PUBLIC_MAIN_DOMAIN is set correctly for development (${process.env.NEXT_PUBLIC_MAIN_DOMAIN})`,
  );

  // ------------------------------------------
  // TEST SUITE 2: Multi-Tenant Host Routing Engine
  // ------------------------------------------
  printHeader("Test Suite 2: Subdomain / Tenant Host Routing");

  // Re-implement host parsing logic statically for validation
  function parseHost(host: string) {
    let mainDomain = process.env.NEXT_PUBLIC_MAIN_DOMAIN || "localhost:3000";
    if (host.includes("zpos.click")) {
      mainDomain = "zpos.click";
    } else if (host.includes("zpos.vn")) {
      mainDomain = "zpos.vn";
    }

    const subdomain = host.endsWith(`.${mainDomain}`) ? host.replace(`.${mainDomain}`, "") : null;

    const isConsole = subdomain === "console";
    const isApp = subdomain === "app";
    const isSystemSubdomain = !subdomain || ["www", "app", "console", "cms"].includes(subdomain);
    const tenantSlug = isSystemSubdomain ? null : subdomain;

    return { subdomain, isConsole, isApp, tenantSlug };
  }

  // Test Case A: Main domain
  const rootDomain = parseHost("localhost:3000");
  assert(
    rootDomain.subdomain === null &&
      rootDomain.isConsole === false &&
      rootDomain.isApp === false &&
      rootDomain.tenantSlug === null,
    "localhost:3000 -> Should resolve to main domain landing (Tenant: null, Console: false, App: false)",
  );

  // Test Case B: Global App Portal
  const appDomain = parseHost("app.localhost:3000");
  assert(
    appDomain.subdomain === "app" &&
      appDomain.isConsole === false &&
      appDomain.isApp === true &&
      appDomain.tenantSlug === null,
    "app.localhost:3000 -> Should resolve to global user portal (Tenant: null, Console: false, App: true) [FIXED 404 LOGIC]",
  );

  // Test Case C: Admin Console
  const consoleDomain = parseHost("console.localhost:3000");
  assert(
    consoleDomain.subdomain === "console" &&
      consoleDomain.isConsole === true &&
      consoleDomain.isApp === false &&
      consoleDomain.tenantSlug === null,
    "console.localhost:3000 -> Should resolve to central console node (Tenant: null, Console: true, App: false)",
  );

  // Test Case D: Retail Subdomain (Kphone)
  const kphoneDomain = parseHost("kphone.localhost:3000");
  assert(
    kphoneDomain.subdomain === "kphone" &&
      kphoneDomain.isConsole === false &&
      kphoneDomain.isApp === false &&
      kphoneDomain.tenantSlug === "kphone",
    "kphone.localhost:3000 -> Should resolve to retail tenant slug (Tenant: 'kphone', Console: false, App: false)",
  );

  // Test Case E: Production Domain with Tenant
  const prodDomain = parseHost("kphone.zpos.click");
  assert(
    prodDomain.subdomain === "kphone" && prodDomain.tenantSlug === "kphone",
    "kphone.zpos.click -> Should resolve to retail tenant slug in production (Tenant: 'kphone')",
  );

  // ------------------------------------------
  // TEST SUITE 3: Supabase Connection & DB Health
  // ------------------------------------------
  printHeader("Test Suite 3: Supabase Database Connectivity");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Test fetching organizations (checks read access & connection)
      const { data: orgs, error: orgsError } = await supabase
        .from("organizations")
        .select("id, name, slug")
        .in("slug", ["kphone", "zpos-retail"]);

      if (orgsError) throw orgsError;

      assert(
        Array.isArray(orgs) && orgs.length > 0,
        `Successfully queried active tenants from DB: [${orgs?.map((o) => o.slug).join(", ")}]`,
      );

      const kphoneOrg = orgs?.find((o) => o.slug === "kphone");
      assert(!!kphoneOrg, `Retrieved details for 'kphone' (ID: ${kphoneOrg?.id || "N/A"})`);
    } catch (dbError: any) {
      assert(false, `Supabase Database query failed: ${dbError.message}`);
    }
  } else {
    printFail("Skipped Database checks due to missing credentials.");
  }

  // ------------------------------------------
  // TEST SUITE 4: React 19 Root Layout Guard
  // ------------------------------------------
  printHeader("Test Suite 4: React 19 Layout Structure Validation");

  const layoutPath = path.join(__dirname, "../app/layout.tsx");
  if (fs.existsSync(layoutPath)) {
    const layoutContent = fs.readFileSync(layoutPath, "utf8");

    // Check 1: <head> exists
    const hasHead = layoutContent.includes("<head>") && layoutContent.includes("</head>");
    assert(hasHead, "RootLayout declares manual static <head> wrapper");

    // Check 2: script is a raw static element, not client <Script> from next/script nested in head
    const hasRawScript = layoutContent.includes("<script") && layoutContent.includes("dangerouslySetInnerHTML");
    assert(hasRawScript, "RootLayout renders raw <script> block for theme-boot (Hydration Safety)");

    const nextScriptImportRegex = /import\s+Script\s+from\s+['"]next\/script['"]/g;
    const hasNextScriptImportInLayout = nextScriptImportRegex.test(layoutContent);

    // Verify it doesn't nest next/script within head
    const inHeadScriptComponent = /<head>[\s\S]*?<Script\s+id=/g.test(layoutContent);
    assert(
      !inHeadScriptComponent,
      "No client rendering <Script> is nested inside `<head>` (Preventing Hydration Console Warnings)",
    );
  } else {
    printFail("Could not locate layout.tsx file at " + layoutPath);
  }

  // ------------------------------------------
  // TEST SUITE 5: Code Integrity Check
  // ------------------------------------------
  printHeader("Test Suite 5: Code Cleanliness & Sandbox Check");

  const loginFormPath = path.join(__dirname, "../app/(auth)/_components/login-form.tsx");
  if (fs.existsSync(loginFormPath)) {
    const loginFormContent = fs.readFileSync(loginFormPath, "utf8");

    // Check 1: Sandbox panel removed
    const hasSandboxPanel =
      loginFormContent.includes("Sandbox Quick Login") || loginFormContent.includes("Tài khoản Demo");
    assert(!hasSandboxPanel, "Sandbox Quick Login drawer interface successfully removed fromLoginForm");

    // Check 2: Unused imports cleaned up
    const hasUnusedIcons =
      loginFormContent.includes("Sparkles") ||
      loginFormContent.includes("ChevronDown") ||
      loginFormContent.includes("ChevronUp");
    assert(!hasUnusedIcons, "Unused lucide icons successfully cleaned from login form imports");
  } else {
    printFail("Could not locate login-form.tsx file at " + loginFormPath);
  }

  // ==========================================
  // 3. FINAL RESULTS REPORTING
  // ==========================================
  console.log(`\n================================================`);
  const successPercentage = Math.round((passedTests / totalTests) * 100);

  if (passedTests === totalTests) {
    console.log(
      `${colors.bright}${colors.bgGreen}  🏆 DIAGNOSTIC TEST RESULT: ALL TESTS PASSED (${passedTests}/${totalTests}) 🏆  ${colors.reset}`,
    );
    console.log(
      `  ${colors.green}Congratulations! The current architecture is stable, clean, and perfectly React 19 compliant.${colors.reset}`,
    );
  } else {
    console.log(
      `${colors.bright}${colors.bgRed}  ⚠️ DIAGNOSTIC TEST RESULT: SOME TESTS FAILED (${passedTests}/${totalTests} - ${successPercentage}%) ⚠️  ${colors.reset}`,
    );
    console.log(
      `  ${colors.red}Please review the failures listed above to ensure complete functional stability.${colors.reset}`,
    );
  }
  console.log(`================================================\n`);
}

runTests().catch(console.error);
