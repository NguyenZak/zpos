import { type NextRequest, NextResponse } from "next/server";
import { trackEvent } from "@/utils/audit-logger";

export async function POST(request: NextRequest) {
  try {
    const { type, tenantSlug } = await request.json();
    const ts = tenantSlug || "bibomart";

    let ipAddress = "118.70.147.202"; // Standard Hanoi IP
    let userAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

    if (type === "brute_force") {
      // Simulate 3 consecutive failed logins to trigger the rule
      const mockEmail = `hacker_test_${Math.floor(Math.random() * 100)}@gmail.com`;
      const threatIp = "91.200.12.89"; // Suspicious Tor exit node IP

      await trackEvent({
        tenant_id: ts,
        user_email: mockEmail,
        action: "login_failed",
        module: "auth",
        severity: "warning",
        ip_address: threatIp,
        user_agent: userAgent,
        metadata: { attempt: 1, reason: "Incorrect password" },
      });

      await trackEvent({
        tenant_id: ts,
        user_email: mockEmail,
        action: "login_failed",
        module: "auth",
        severity: "warning",
        ip_address: threatIp,
        user_agent: userAgent,
        metadata: { attempt: 2, reason: "Incorrect password" },
      });

      // The 3rd one triggers CRITICAL automatically due to our rules engine
      const criticalLog = await trackEvent({
        tenant_id: ts,
        user_email: mockEmail,
        action: "login_failed",
        module: "auth",
        severity: "warning",
        ip_address: threatIp,
        user_agent: userAgent,
        metadata: { attempt: 3, reason: "Incorrect password" },
      });

      return NextResponse.json({
        success: true,
        message: "Simulated 3 failed login attempts. Suspicious Brute-Force alert triggered!",
        log: criticalLog,
      });
    }

    if (type === "large_export") {
      const recordCount = Math.floor(Math.random() * 800) + 150; // Between 150 and 950 records
      const exportLog = await trackEvent({
        tenant_id: ts,
        user_email: "accountant_pro@gmail.com",
        action: "export",
        module: "inventory",
        severity: "info",
        ip_address: ipAddress,
        user_agent: userAgent,
        metadata: {
          file_name: `inventory_report_${new Date().toISOString().slice(0,10)}.csv`,
          record_count: recordCount,
          format: "CSV",
        },
      });

      return NextResponse.json({
        success: true,
        message: `Simulated export of ${recordCount} records. Risk alert triggered!`,
        log: exportLog,
      });
    }

    if (type === "bulk_delete") {
      const recordCount = Math.floor(Math.random() * 30) + 15; // Between 15 and 45 items
      const deleteLog = await trackEvent({
        tenant_id: ts,
        user_email: "disgruntled_staff@gmail.com",
        action: "bulk_delete",
        module: "products",
        severity: "warning",
        ip_address: ipAddress,
        user_agent: userAgent,
        metadata: {
          table_name: "products",
          record_count: recordCount,
          reason: "Product listing reorganization",
        },
      });

      return NextResponse.json({
        success: true,
        message: `Simulated bulk deletion of ${recordCount} products. CRITICAL Alert triggered!`,
        log: deleteLog,
      });
    }

    if (type === "unauthorized_access") {
      const deniedLog = await trackEvent({
        tenant_id: ts,
        user_email: "staff_member_04@gmail.com",
        action: "permission_denied",
        module: "billing",
        severity: "warning",
        ip_address: "171.244.20.105",
        user_agent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_1_1 like Mac OS X) AppleWebKit/605.1.15",
        metadata: {
          attempted_url: "/console/subscriptions",
          http_method: "POST",
          required_permission: "billing:write",
        },
      });

      return NextResponse.json({
        success: true,
        message: "Simulated permission violation. Risk Alert triggered!",
        log: deniedLog,
      });
    }

    if (type === "strange_ip") {
      const userMail = "owner_store_main@juno.vn";
      const goodIp = "113.161.40.12"; // Hanoi IP
      const torIp = "185.220.101.44"; // TOR Exit Node IP

      // 1. Successful login from good IP
      await trackEvent({
        tenant_id: ts,
        user_email: userMail,
        action: "login_success",
        module: "auth",
        severity: "info",
        ip_address: goodIp,
        user_agent: userAgent,
        metadata: { authentication_method: "password" },
      });

      // 2. Sudden successful login from TOR exit node IP triggers warning
      const alertLog = await trackEvent({
        tenant_id: ts,
        user_email: userMail,
        action: "login_success",
        module: "auth",
        severity: "info",
        ip_address: torIp,
        user_agent: userAgent,
        metadata: { authentication_method: "session_cookie_reuse" },
      });

      return NextResponse.json({
        success: true,
        message: "Simulated IP address jump. Inexplicable login location alert triggered!",
        log: alertLog,
      });
    }

    if (type === "privilege_escalation") {
      const escalationLog = await trackEvent({
        tenant_id: ts,
        user_email: "store_manager_quang@gmail.com",
        action: "role_updated",
        module: "permissions",
        severity: "info",
        ip_address: ipAddress,
        user_agent: userAgent,
        metadata: {
          target_user: "staff_member_lan@gmail.com",
          old_role: "staff",
          new_role: "admin",
          granted_permissions: ["products:*", "inventory:*", "billing:read"],
        },
      });

      return NextResponse.json({
        success: true,
        message: "Simulated permission updates. Permission change log captured!",
        log: escalationLog,
      });
    }

    if (type === "standard_logs") {
      const standardEvents = [
        { action: "login_success", module: "auth", severity: "info", email: "quynh.chi@bibomart.vn", msg: "User logged in successfully" },
        { action: "create_product", module: "products", severity: "info", email: "quynh.chi@bibomart.vn", msg: "Created product 'Sữa bột Meiji số 0'" },
        { action: "update_inventory", module: "inventory", severity: "info", email: "quynh.chi@bibomart.vn", msg: "Stock in +200 units for SKU MEIJI-0" },
        { action: "checkout_completed", module: "billing", severity: "info", email: "pos_terminal_03@bibomart.vn", msg: "POS Checkout completed, invoice #INV-29012" },
        { action: "webhook_failed", module: "billing", severity: "error", email: "system_gateway", msg: "Momo gateway payment notification failed, signature mismatch" },
        { action: "cron_sync_completed", module: "system", severity: "info", email: "system_cron", msg: "Successfully synchronized POS offline logs to Supabase" },
      ];

      const simulatedLogs = [];
      for (const ev of standardEvents) {
        const log = await trackEvent({
          tenant_id: ts,
          user_email: ev.email,
          action: ev.action,
          module: ev.module,
          severity: ev.severity as any,
          ip_address: "14.161.42.99",
          user_agent: userAgent,
          metadata: { details: ev.msg },
        });
        simulatedLogs.push(log);
      }

      return NextResponse.json({
        success: true,
        message: "Successfully loaded batch of 6 standard demo logs across different modules.",
        logs: simulatedLogs,
      });
    }

    return NextResponse.json({ success: false, error: "Unknown simulation type" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 400 });
  }
}
