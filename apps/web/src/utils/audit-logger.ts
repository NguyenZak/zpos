import { createClient } from "@supabase/supabase-js";

import { sendAuditLogToTelegram } from "@/lib/telegram-logbug";

// Types for Audit Log
export interface AuditLog {
  id?: string;
  tenant_id: string | null; // organization id or slug
  user_id: string | null; // user id or email
  user_email?: string | null;
  action: string;
  module: string;
  severity: "info" | "warning" | "error" | "critical";
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, any>;
  is_alert?: boolean;
  alert_reason?: string | null;
  created_at?: string;
}

// Sensitive data masking rules
const SENSITIVE_KEYS = /password|pass|secret|token|api_key|apikey|key|card|cvv|auth|credential|pin/i;

export function maskSensitiveData(data: any): any {
  if (!data) return data;

  if (Array.isArray(data)) {
    return data.map((item) => maskSensitiveData(item));
  }

  if (typeof data === "object") {
    const masked: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (SENSITIVE_KEYS.test(key)) {
        if (typeof value === "string") {
          if (value.length <= 6) {
            masked[key] = "[MASKED]";
          } else {
            masked[key] = `${value.slice(0, 2)}****${value.slice(-2)}`;
          }
        } else {
          masked[key] = "[MASKED]";
        }
      } else {
        masked[key] = maskSensitiveData(value);
      }
    }
    return masked;
  }

  return data;
}

// Server-side direct file system fallback helper
async function saveToLocalJson(log: AuditLog) {
  if (typeof window !== "undefined") return;

  try {
    const fs = require("fs");
    const path = require("path");

    const dataDir = path.resolve(process.cwd(), "src/data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const filePath = path.join(dataDir, "audit_logs.json");
    let logs: AuditLog[] = [];

    if (fs.existsSync(filePath)) {
      try {
        const fileContent = fs.readFileSync(filePath, "utf-8");
        logs = JSON.parse(fileContent);
      } catch (e) {
        console.error("Failed to parse local audit logs JSON:", e);
      }
    }

    logs.unshift(log); // Add new log at the beginning
    fs.writeFileSync(filePath, JSON.stringify(logs, null, 2), "utf-8");
    console.log(`[AUDIT Fallback] Log written locally: ${log.action} - ${log.severity}`);
  } catch (e) {
    console.error("Critical: Failed to save audit log to local JSON:", e);
  }
}

// Fetch all local JSON logs
export function getLocalLogs(): AuditLog[] {
  if (typeof window !== "undefined") return [];

  try {
    const fs = require("fs");
    const path = require("path");
    const filePath = path.resolve(process.cwd(), "src/data/audit_logs.json");

    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(fileContent);
    }
  } catch (e) {
    console.error("Failed to read local audit logs:", e);
  }
  return [];
}

// Clean local JSON logs according to retention policy
export function cleanLocalLogsByRetention(): number {
  if (typeof window !== "undefined") return 0;

  try {
    const fs = require("fs");
    const path = require("path");
    const filePath = path.resolve(process.cwd(), "src/data/audit_logs.json");

    if (!fs.existsSync(filePath)) return 0;

    const fileContent = fs.readFileSync(filePath, "utf-8");
    const logs: AuditLog[] = JSON.parse(fileContent);
    const now = new Date();

    const initialLength = logs.length;

    const retentionDays = {
      info: 30,
      warning: 90,
      error: 180,
      critical: 365,
    };

    const filteredLogs = logs.filter((log) => {
      const createdAt = new Date(log.created_at || new Date());
      const ageInDays = (now.getTime() - createdAt.getTime()) / (1000 * 3600 * 24);
      const limit = retentionDays[log.severity] || 30;
      return ageInDays <= limit;
    });

    fs.writeFileSync(filePath, JSON.stringify(filteredLogs, null, 2), "utf-8");
    return initialLength - filteredLogs.length;
  } catch (e) {
    console.error("Failed to enforce retention on local audit logs:", e);
    return 0;
  }
}

// Main event logging utility
export async function trackEvent(params: {
  tenant_id?: string | null;
  user_id?: string | null;
  user_email?: string | null;
  action: string;
  module: string;
  severity?: "info" | "warning" | "error" | "critical";
  ip_address?: string | null;
  user_agent?: string | null;
  metadata?: Record<string, any>;
}): Promise<AuditLog> {
  let severity = params.severity ?? "info";
  const metadata = params.metadata ? maskSensitiveData(params.metadata) : {};
  let ip_address = params.ip_address || null;
  let user_agent = params.user_agent || null;
  let is_alert = false;
  let alert_reason: string | null = null;

  // Auto-detect environment headers on the server side
  if (typeof window === "undefined" && (!ip_address || !user_agent)) {
    try {
      const { headers } = require("next/headers");
      const reqHeaders = headers();
      if (!ip_address) {
        ip_address =
          reqHeaders.get("x-forwarded-for")?.split(",")[0].trim() || reqHeaders.get("x-real-ip") || "127.0.0.1";
      }
      if (!user_agent) {
        user_agent = reqHeaders.get("user-agent") || "Unknown Browser";
      }
    } catch (_) {
      // Not in a Next.js Server Component request context
      ip_address = ip_address || "127.0.0.1";
      user_agent = user_agent || "Server Process";
    }
  }

  // --- SECURITY RISK RULES ENGINE ---
  const action = params.action;

  // Rule 1: Login failed multiple times (Brute Force)
  if (action === "login_failed") {
    let recentFailures = 0;
    try {
      const recentLogs = getLocalLogs();
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      recentFailures = recentLogs.filter(
        (l) =>
          l.action === "login_failed" &&
          (l.user_email === params.user_email || l.ip_address === ip_address) &&
          new Date(l.created_at || new Date()) > tenMinutesAgo,
      ).length;
    } catch (_) {}

    if (recentFailures >= 2) {
      severity = "critical";
      is_alert = true;
      alert_reason = `Phát hiện tấn công Brute-Force: Thất bại liên tiếp ${recentFailures + 1} lần đăng nhập từ IP (${ip_address}) hoặc tài khoản (${params.user_email || "Không rõ"}).`;
    }
  }

  // Rule 2: Large Data Export
  if (action === "export" && metadata.record_count > 100) {
    severity = metadata.record_count > 500 ? "critical" : "warning";
    is_alert = true;
    alert_reason = `Xuất lượng dữ liệu lớn bất thường: ${metadata.record_count} bản ghi được kết xuất từ mô-đun ${params.module}.`;
  }

  // Rule 3: Bulk Deletion
  if ((action.startsWith("delete") || action === "bulk_delete") && metadata.record_count > 10) {
    severity = "critical";
    is_alert = true;
    alert_reason = `Xóa dữ liệu hàng loạt: ${metadata.record_count} bản ghi thuộc bảng/mô-đun ${params.module} bị xóa vĩnh viễn.`;
  }

  // Rule 4: Unauthorized Access
  if (action === "permission_denied" || action === "unauthorized_access") {
    severity = "warning";
    is_alert = true;
    alert_reason = `Truy cập trái quyền: Tài khoản cố gắng truy cập trái phép vào tài nguyên của mô-đun ${params.module}.`;
  }

  // Rule 5: Permission Changes
  if (action === "role_updated" || action === "permission_updated") {
    severity = "warning";
    is_alert = true;
    alert_reason = `Thay đổi phân quyền hệ thống: Nâng quyền hoặc thay đổi vai trò của thành viên ${metadata.target_user || "Không rõ"}.`;
  }

  // Rule 6: Login from unfamiliar/strange IP
  if (action === "login_success" && ip_address) {
    try {
      const recentLogs = getLocalLogs();
      const pastLogins = recentLogs.filter((l) => l.action === "login_success" && l.user_email === params.user_email);
      if (pastLogins.length > 0) {
        const knownIps = new Set(pastLogins.map((l) => l.ip_address).filter(Boolean));
        if (knownIps.size > 0 && !knownIps.has(ip_address)) {
          severity = "warning";
          is_alert = true;
          alert_reason = `Đăng nhập từ IP lạ: Tài khoản đăng nhập thành công từ địa chỉ IP mới (${ip_address}) chưa từng sử dụng trước đây.`;
        }
      }
    } catch (_) {}
  }

  const newLog: AuditLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    tenant_id: params.tenant_id || null,
    user_id: params.user_id || null,
    user_email: params.user_email || null,
    action,
    module: params.module,
    severity,
    ip_address,
    user_agent,
    metadata,
    is_alert,
    alert_reason,
    created_at: new Date().toISOString(),
  };

  // 1. Try writing directly to Supabase if config is active
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
      const supabase = createClient(supabaseUrl, supabaseKey!);

      const { error } = await supabase.from("audit_logs").insert([
        {
          tenant_id: newLog.tenant_id,
          user_id: newLog.user_id,
          user_email: newLog.user_email,
          action: newLog.action,
          module: newLog.module,
          severity: newLog.severity,
          ip_address: newLog.ip_address,
          user_agent: newLog.user_agent,
          metadata: newLog.metadata,
          is_alert: newLog.is_alert,
          alert_reason: newLog.alert_reason,
        },
      ]);

      if (error) {
        // Log to console but we will fallback to local json write
        console.warn("Supabase audit log insert failed (falling back to JSON):", error.message);
        await saveToLocalJson(newLog);
      } else {
        console.log(`[AUDIT] Log saved to Supabase: ${newLog.action}`);
      }
    } catch (err) {
      console.warn("Supabase audit log insertion exception (falling back to JSON):", err);
      await saveToLocalJson(newLog);
    }
  } else {
    await saveToLocalJson(newLog);
  }

  if (typeof window === "undefined") {
    const telegram = await sendAuditLogToTelegram(newLog);
    if (!telegram.ok) {
      console.warn("Telegram audit log notification failed:", telegram.error);
    }
  }

  return newLog;
}
