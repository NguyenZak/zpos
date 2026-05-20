import { type NextRequest, NextResponse } from "next/server";

import { createClient } from "@supabase/supabase-js";

import { requireSuperAdmin } from "@/utils/admin-auth";
import { cleanLocalLogsByRetention, getLocalLogs, trackEvent } from "@/utils/audit-logger";

// GET handler: retrieves, filters, merges, and displays logs in the admin console
export async function GET(request: NextRequest) {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const tenant = searchParams.get("tenant") || "all";
  const user = searchParams.get("user") || "all";
  const moduleParam = searchParams.get("module") || "all";
  const severity = searchParams.get("severity") || "all";
  const action = searchParams.get("action") || "all";
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const search = searchParams.get("search")?.toLowerCase() || "";

  let logs: any[] = [];

  // 1. Fetch from Supabase if configured
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
      const supabase = createClient(supabaseUrl, supabaseKey!);

      const query = supabase.from("audit_logs").select("*").order("created_at", { ascending: false });

      const { data, error } = await query;
      if (!error && data) {
        logs = [...data];
      }
    } catch (e) {
      console.warn("API GET: Supabase audit logs query error:", e);
    }
  }

  // 2. Fetch local JSON logs and merge (prevent duplicates using id)
  const localLogs = getLocalLogs();
  const existingIds = new Set(logs.map((l) => l.id).filter(Boolean));

  for (const localLog of localLogs) {
    if (!existingIds.has(localLog.id)) {
      logs.push(localLog);
    }
  }

  // 3. Sort logs by created_at descending
  logs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // 4. Server-Side Filtering
  let filteredLogs = logs;

  if (tenant !== "all") {
    filteredLogs = filteredLogs.filter(
      (log) =>
        (log.tenant_id && log.tenant_id.toLowerCase() === tenant.toLowerCase()) ||
        (log.metadata?.tenant_slug && log.metadata.tenant_slug.toLowerCase() === tenant.toLowerCase()),
    );
  }

  if (user !== "all") {
    filteredLogs = filteredLogs.filter(
      (log) =>
        (log.user_email && log.user_email.toLowerCase() === user.toLowerCase()) ||
        (log.user_id && log.user_id.toLowerCase() === user.toLowerCase()),
    );
  }

  if (moduleParam !== "all") {
    filteredLogs = filteredLogs.filter((log) => log.module && log.module.toLowerCase() === moduleParam.toLowerCase());
  }

  if (severity !== "all") {
    filteredLogs = filteredLogs.filter((log) => log.severity && log.severity.toLowerCase() === severity.toLowerCase());
  }

  if (action !== "all") {
    filteredLogs = filteredLogs.filter((log) => log.action && log.action.toLowerCase() === action.toLowerCase());
  }

  if (startDate) {
    const start = new Date(startDate).getTime();
    filteredLogs = filteredLogs.filter((log) => new Date(log.created_at).getTime() >= start);
  }

  if (endDate) {
    const end = new Date(endDate).getTime();
    filteredLogs = filteredLogs.filter((log) => new Date(log.created_at).getTime() <= end);
  }

  if (search) {
    filteredLogs = filteredLogs.filter(
      (log) =>
        (log.action && log.action.toLowerCase().includes(search)) ||
        (log.module && log.module.toLowerCase().includes(search)) ||
        (log.user_email && log.user_email.toLowerCase().includes(search)) ||
        (log.alert_reason && log.alert_reason.toLowerCase().includes(search)) ||
        (log.ip_address && log.ip_address.includes(search)) ||
        (log.metadata && JSON.stringify(log.metadata).toLowerCase().includes(search)),
    );
  }

  // Calculate statistics for the dashboard dashboard
  const securityAlerts = filteredLogs.filter((l) => l.is_alert === true);
  const failedLogins = filteredLogs.filter((l) => l.action === "login_failed").length;
  const errorCount = filteredLogs.filter((l) => l.severity === "error" || l.severity === "critical").length;

  // Risky tenants aggregation
  const tenantRiskMap: Record<string, { count: number; score: number; slug: string }> = {};
  filteredLogs.forEach((log) => {
    if (!log.tenant_id && !log.metadata?.tenant_slug) return;
    const tSlug = log.metadata?.tenant_slug || log.tenant_id;
    if (!tSlug) return;

    if (!tenantRiskMap[tSlug]) {
      tenantRiskMap[tSlug] = { count: 0, score: 0, slug: tSlug };
    }

    tenantRiskMap[tSlug].count++;

    // Weight severities to get a risk score
    if (log.severity === "critical") tenantRiskMap[tSlug].score += 10;
    else if (log.severity === "error") tenantRiskMap[tSlug].score += 5;
    else if (log.severity === "warning") tenantRiskMap[tSlug].score += 2;
    else tenantRiskMap[tSlug].score += 0.2;
  });

  const topRiskyTenants = Object.values(tenantRiskMap)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const recentCriticalEvents = filteredLogs
    .filter((l) => l.severity === "critical" || l.is_alert === true)
    .slice(0, 10);

  return NextResponse.json({
    success: true,
    data: filteredLogs,
    stats: {
      totalCount: filteredLogs.length,
      securityAlertsCount: securityAlerts.length,
      securityAlertsList: securityAlerts.slice(0, 10),
      failedLoginsCount: failedLogins,
      errorCount: errorCount,
      topRiskyTenants,
      recentCriticalEvents,
    },
  });
}

// POST handler: allows clients/servers to track audit logs manually
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = String(body?.action || "");

    if (action !== "login_success" && action !== "login_failed") {
      const auth = await requireSuperAdmin();
      if (auth.error) return auth.error;
    }

    const newLog = await trackEvent({
      ...body,
      ...(action === "login_success" || action === "login_failed"
        ? {
            action,
            module: "auth",
            severity: action === "login_failed" ? "warning" : "info",
          }
        : {}),
    });
    return NextResponse.json({ success: true, data: newLog });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 400 });
  }
}

// DELETE handler: enforces the retention policy across both remote Supabase & local JSON store
export async function DELETE(request: NextRequest) {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  let supabaseDeleted = 0;
  let localDeleted = 0;

  // 1. Enforce local JSON retention policy
  localDeleted = cleanLocalLogsByRetention();

  // 2. Enforce Supabase database retention policy if active
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
      const supabase = createClient(supabaseUrl, supabaseKey!);

      const now = new Date();

      const retentionConfigs = [
        { severity: "info", days: 30 },
        { severity: "warning", days: 90 },
        { severity: "error", days: 180 },
        { severity: "critical", days: 365 },
      ];

      for (const config of retentionConfigs) {
        const boundaryDate = new Date(now.getTime() - config.days * 24 * 3600 * 1000).toISOString();
        const { error, count } = await supabase
          .from("audit_logs")
          .delete({ count: "exact" })
          .eq("severity", config.severity)
          .lt("created_at", boundaryDate);

        if (!error && count) {
          supabaseDeleted += count;
        }
      }
    } catch (e) {
      console.warn("API DELETE retention policy exception:", e);
    }
  }

  // Seed standard default logs if all are deleted to make it look alive
  return NextResponse.json({
    success: true,
    message: "Retention policy executed successfully.",
    deletedLogs: {
      supabase: supabaseDeleted,
      local: localDeleted,
      total: supabaseDeleted + localDeleted,
    },
  });
}
