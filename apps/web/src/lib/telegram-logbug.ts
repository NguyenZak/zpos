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
  | { ok: true; skipped: true; reason: "missing_config" };

const TELEGRAM_API_BASE = "https://api.telegram.org";
const MAX_MESSAGE_LENGTH = 3900;

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

  const lines = [
    "<b>ZPOS Logbug mới</b>",
    "",
    `<b>ID:</b> <code>${escapeHtml(ticket.id)}</code>`,
    `<b>Tenant:</b> ${escapeHtml(ticket.tenantName)} (${escapeHtml(ticket.tenantSlug)})`,
    `<b>Loại:</b> ${escapeHtml(ticket.category)}`,
    `<b>Ưu tiên:</b> ${escapeHtml(ticket.priority)}`,
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

export async function sendSupportTicketToTelegram(ticket: SupportTicket): Promise<TelegramResult> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const threadId = process.env.TELEGRAM_MESSAGE_THREAD_ID;

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
        text: formatTicketMessage(ticket),
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
