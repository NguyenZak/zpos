import fs from "node:fs/promises";
import path from "node:path";

type SupportTicket = {
  id: string;
  tenantName: string;
  tenantSlug: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  contactPhone: string;
  status: string;
  createdAt: string;
};

type TelegramResult =
  | { ok: true; skipped: false }
  | { ok: false; skipped: false; error: string }
  | { ok: true; skipped: true; reason: "missing_config" | "below_threshold" };

type AuditSeverity = "info" | "warning" | "error" | "critical";

type AuditLogNotification = {
  id?: string;
  tenant_id: string | null;
  user_id: string | null;
  user_email?: string | null;
  action: string;
  module: string;
  severity: AuditSeverity;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown>;
  is_alert?: boolean;
  alert_reason?: string | null;
  created_at?: string;
};

interface TelegramSettings {
  botToken?: string;
  chatId?: string;
  messageThreadId?: string;
  threadIdAudit?: string;
  threadIdTickets?: string;
  threadIdLogbugs?: string;
  logEnabled?: boolean;
  logMinSeverity?: string;
}

const TELEGRAM_API_BASE = "https://api.telegram.org";
const MAX_MESSAGE_LENGTH = 3900;

async function getTelegramSettings(): Promise<TelegramSettings> {
  try {
    const filePath = path.join(process.cwd(), "src/data/telegram_settings.json");
    const fileData = await fs.readFile(filePath, "utf-8");
    return JSON.parse(fileData);
  } catch {
    return {};
  }
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 3)}...`;
}

function formatTicketMessage(ticket: SupportTicket): string {
  const createdAt = new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "medium",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(ticket.createdAt));

  const isLogbug = ticket.category === "Lỗi phần mềm";

  const priorityEmoji =
    (
      {
        Cao: "🔴",
        "Trung bình": "🟡",
        Thấp: "🟢",
      } as Record<string, string>
    )[ticket.priority] || "⚪";

  const categoryEmoji =
    (
      {
        "Lỗi phần mềm": "🐞",
        "Yêu cầu tính năng": "✨",
        "Hỏi đáp/Tư vấn": "💬",
        "Hóa đơn/Thanh toán": "💳",
      } as Record<string, string>
    )[ticket.category] || "📝";

  const headerTitle = isLogbug
    ? `${categoryEmoji} <b>ZPOS Logbug Mới (Báo Cáo Lỗi)</b>`
    : `${categoryEmoji} <b>ZPOS Ticket Hỗ Trợ Mới</b>`;

  const lines = [
    headerTitle,
    "",
    `<b>ID:</b> <code>${escapeHtml(ticket.id)}</code>`,
    `<b>Tenant:</b> ${escapeHtml(ticket.tenantName)} (${escapeHtml(ticket.tenantSlug)})`,
    `<b>Loại:</b> ${escapeHtml(ticket.category)}`,
    `<b>Ưu tiên:</b> ${priorityEmoji} ${escapeHtml(ticket.priority)}`,
    `<b>Trạng thái:</b> ${escapeHtml(ticket.status)}`,
    `<b>SĐT:</b> ${escapeHtml(ticket.contactPhone || "Chưa cung cấp")}`,
    `<b>Thời gian:</b> ${escapeHtml(createdAt)}`,
    "",
    `<b>Tiêu đề:</b> ${escapeHtml(ticket.title)}`,
    "",
    `<b>Nội dung:</b>`,
    escapeHtml(ticket.description),
  ];

  return truncate(lines.join("\n"), MAX_MESSAGE_LENGTH);
}

function getSeverityRank(severity: AuditSeverity): number {
  return { info: 0, warning: 1, error: 2, critical: 3 }[severity];
}

function formatMetadata(metadata: Record<string, unknown>): string {
  const serialized = JSON.stringify(metadata, null, 2);
  if (!serialized || serialized === "{}") return "Không có";
  return truncate(serialized, 900);
}

function formatAuditLogMessage(log: AuditLogNotification): string {
  const createdAt = new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "medium",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(log.created_at ?? Date.now()));

  const title = log.is_alert ? "ZPOS Security Alert" : "ZPOS Server Log";
  const lines = [
    `<b>${title}</b>`,
    "",
    `<b>Mức độ:</b> <code>${escapeHtml(log.severity.toUpperCase())}</code>`,
    `<b>Module:</b> ${escapeHtml(log.module)}`,
    `<b>Action:</b> ${escapeHtml(log.action)}`,
    `<b>Tenant:</b> ${escapeHtml(log.tenant_id ?? "system")}`,
    `<b>User:</b> ${escapeHtml(log.user_email ?? log.user_id ?? "unknown")}`,
    `<b>IP:</b> ${escapeHtml(log.ip_address ?? "unknown")}`,
    `<b>Thời gian:</b> ${escapeHtml(createdAt)}`,
  ];

  if (log.alert_reason) {
    lines.push("", "<b>Lý do cảnh báo:</b>", escapeHtml(log.alert_reason));
  }

  lines.push("", "<b>Metadata:</b>", `<pre>${escapeHtml(formatMetadata(log.metadata))}</pre>`);

  return truncate(lines.join("\n"), MAX_MESSAGE_LENGTH);
}

async function sendTelegramMessage(
  text: string,
  botToken?: string,
  chatId?: string,
  threadId?: string,
): Promise<TelegramResult> {
  if (!botToken || !chatId) {
    return { ok: true, skipped: true, reason: "missing_config" };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(`${TELEGRAM_API_BASE}/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        disable_web_page_preview: true,
        message_thread_id: threadId ? Number(threadId) : undefined,
        parse_mode: "HTML",
        text,
      }),
      signal: controller.signal,
    });

    const payload: { ok?: boolean; description?: string } = await response.json().catch(() => ({}));

    if (!response.ok || !payload.ok) {
      return {
        ok: false,
        skipped: false,
        error: payload.description ?? `Telegram API returned ${response.status}`,
      };
    }

    return { ok: true, skipped: false };
  } catch (error) {
    return {
      ok: false,
      skipped: false,
      error: error instanceof Error ? error.message : "Unknown Telegram error",
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function sendSupportTicketToTelegram(ticket: SupportTicket): Promise<TelegramResult> {
  const settings = await getTelegramSettings();
  const botToken = settings.botToken || process.env.TELEGRAM_BOT_TOKEN;
  const chatId = settings.chatId || process.env.TELEGRAM_CHAT_ID;

  // All support tickets from Tenant App go to the Tickets Thread
  const ticketsThread = settings.threadIdTickets || process.env.TELEGRAM_THREAD_ID_TICKETS;
  const threadId = ticketsThread || settings.messageThreadId || process.env.TELEGRAM_MESSAGE_THREAD_ID;

  return sendTelegramMessage(formatTicketMessage(ticket), botToken, chatId, threadId);
}

export async function sendAuditLogToTelegram(log: AuditLogNotification): Promise<TelegramResult> {
  const settings = await getTelegramSettings();

  // Check log enabled
  const logEnabled =
    settings.logEnabled !== undefined ? settings.logEnabled : process.env.TELEGRAM_LOG_ENABLED !== "false";
  if (!logEnabled) {
    return { ok: true, skipped: true, reason: "missing_config" };
  }

  // Check severity threshold
  if (!log.is_alert) {
    const minSeverity = (settings.logMinSeverity ||
      process.env.TELEGRAM_LOG_MIN_SEVERITY ||
      "warning") as AuditSeverity;
    if (getSeverityRank(log.severity) < getSeverityRank(minSeverity)) {
      return { ok: true, skipped: true, reason: "below_threshold" };
    }
  }

  const botToken = settings.botToken || process.env.TELEGRAM_BOT_TOKEN;
  const chatId = settings.chatId || process.env.TELEGRAM_CHAT_ID;

  // Automated system errors (severity error or critical) go to Logbugs Thread
  // Normal logs go to Audit Thread
  let threadId = settings.messageThreadId || process.env.TELEGRAM_MESSAGE_THREAD_ID;
  if (log.severity === "error" || log.severity === "critical") {
    const logbugsThread = settings.threadIdLogbugs || process.env.TELEGRAM_THREAD_ID_LOGBUGS;
    if (logbugsThread) threadId = logbugsThread;
  } else {
    const auditThread = settings.threadIdAudit || process.env.TELEGRAM_THREAD_ID_AUDIT;
    if (auditThread) threadId = auditThread;
  }

  return sendTelegramMessage(formatAuditLogMessage(log), botToken, chatId, threadId);
}
