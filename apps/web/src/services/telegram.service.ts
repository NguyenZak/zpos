export type TelegramGroup = "sales" | "inventory" | "finance" | "reports";

export const telegramService = {
  isNotificationEnabled(key: string): boolean {
    if (typeof localStorage === "undefined") return false;
    return localStorage.getItem(`zpos_telegram_notify_${key}`) !== "false";
  },

  /**
   * Helper format VND
   */
  formatVND(amount: number): string {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  },

  /**
   * Cốt lõi: Gửi tin nhắn Telegram
   * @param group - nhóm thông báo để chọn thread_id riêng (sales/inventory/finance/reports).
   *                Nếu nhóm không có thread riêng → fallback về thread chung.
   */
  async sendMessage(message: string, group?: TelegramGroup) {
    if (typeof window === "undefined") return;
    const enabled = localStorage.getItem("zpos_telegram_enabled") === "true";
    const token = localStorage.getItem("zpos_telegram_token");
    const chatId = localStorage.getItem("zpos_telegram_chat_id");
    const groupThreadId = group ? localStorage.getItem(`zpos_telegram_thread_id_${group}`)?.trim() : "";
    const fallbackThreadId = localStorage.getItem("zpos_telegram_thread_id")?.trim();
    const threadId = groupThreadId && /^\d+$/.test(groupThreadId) ? groupThreadId : fallbackThreadId;
    const threadPayload = threadId && /^\d+$/.test(threadId) ? { message_thread_id: Number(threadId) } : {};

    if (!enabled || !token || !chatId) return;

    try {
      const url = `https://api.telegram.org/bot${token}/sendMessage`;
      await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId,
          ...threadPayload,
          text: message,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      });
    } catch (error) {
      console.warn("Failed to send Telegram notification:", error);
    }
  },

  // ==========================================
  // PHASE 1: MIGRATED NOTIFICATIONS
  // ==========================================

  async notifyLowStock(productName: string, currentStock: number, minStock: number = 5) {
    if (!this.isNotificationEnabled("stock")) return;

    const warningMsg = `⚠️ <b>CẢNH BÁO TỒN KHO THẤP</b>\n\nSản phẩm <b>${productName}</b> chỉ còn <b>${currentStock}</b> sản phẩm trong kho (mức tối thiểu: ${minStock}). Vui lòng nhập thêm hàng!`;
    await this.sendMessage(warningMsg, "inventory");
  },

  async notifyNewOrder(order: any, items: any[], staffName?: string | null, customerName?: string | null) {
    if (!this.isNotificationEnabled("order")) return;

    try {
      const orderNum = order.order_number || `DH-${order.id.slice(0, 8)}`;
      const totalFormatted = this.formatVND(order.total_amount);
      const paymentMethod =
        order.payment_method === "cash"
          ? "💵 Tiền mặt"
          : order.payment_method === "qr" || order.payment_method === "bank"
            ? "💳 Chuyển khoản"
            : order.payment_method === "debt"
              ? "🔴 GHI NỢ"
              : "💰 Khác";

      let itemsList = "";
      items.forEach((item: any, index: number) => {
        itemsList += `${index + 1}. <b>${item.name}</b> x${item.quantity} - ${this.formatVND(item.price * item.quantity)}\n`;
      });

      // Kiểm tra đơn hàng lớn
      const largeOrderThreshold = 5000000; // 5 triệu
      const isLargeOrder = order.total_amount >= largeOrderThreshold;
      const title = isLargeOrder ? `🚨 <b>ĐƠN HÀNG GIÁ TRỊ LỚN!</b>` : `🎉 <b>ĐƠN HÀNG MỚI!</b>`;

      const customerLine = `🔹 Khách hàng: <b>${customerName || "Khách lẻ"}</b>\n`;
      const staffLine = `🔹 Nhân viên bán: <b>${staffName || "Không xác định"}</b>\n`;

      const telegramMsg =
        `${title}\n\n` +
        `🔹 Mã đơn: <b>#${orderNum}</b>\n` +
        customerLine +
        staffLine +
        `🔹 Thanh toán: <b>${paymentMethod}</b>\n` +
        `🔹 Tổng tiền: <b>${totalFormatted}</b>\n\n` +
        `📋 <b>Chi tiết sản phẩm:</b>\n${itemsList}\n` +
        `⚡️ <i>Gửi từ hệ thống zpos.click!</i>`;

      await this.sendMessage(telegramMsg, "sales");
    } catch (telErr) {
      console.warn("Failed to compose and send order Telegram message:", telErr);
    }
  },

  async notifyReturnOrder(returnOrder: any) {
    if (!this.isNotificationEnabled("return")) return;

    const returnCode = returnOrder.return_code || `RT-${returnOrder.id.slice(0, 8)}`;
    const amountFormatted = this.formatVND(returnOrder.total_refund_amount || 0);
    const msg = `⚠️ <b>THÔNG BÁO TRẢ HÀNG</b>\n\n🔹 Mã phiếu trả: <b>${returnCode}</b>\n🔹 Mã đơn gốc: <b>${returnOrder.order_id}</b>\n🔹 Số tiền hoàn lại: <b>${amountFormatted}</b>\n🔹 Hình thức hoàn: ${returnOrder.refund_method}\n🔹 Lý do: ${returnOrder.reason || "Không có"}\n\n<i>Vui lòng kiểm tra lại nếu thấy bất thường.</i>`;
    await this.sendMessage(msg, "sales");
  },

  async notifyCancelledOrder(orderId: string, action: "HỦY" | "XÓA") {
    if (!this.isNotificationEnabled("cancel")) return;

    const msg = `🚨 <b>CẢNH BÁO BẢO MẬT</b>\n\nĐơn hàng <b>${orderId}</b> vừa bị <b>${action}</b> khỏi hệ thống!\n\n<i>Lưu ý: Việc hủy/xóa đơn hàng có thể ảnh hưởng đến doanh thu và tồn kho. Hãy kiểm tra lại thao tác này.</i>`;
    await this.sendMessage(msg, "sales");
  },
  async notifyPOCompleted(po: any) {
    if (!this.isNotificationEnabled("purchase")) return;

    const poNumber = po.po_number || `PO-${po.id.slice(0, 8)}`;
    const amountFormatted = this.formatVND(po.total_amount || 0);
    const msg = `📦 <b>NHẬP HÀNG THÀNH CÔNG</b>\n\n🔹 Mã phiếu: <b>${poNumber}</b>\n🔹 Nhà cung cấp: <b>${po.supplier?.name || "Khách lẻ"}</b>\n🔹 Tổng giá trị: <b>${amountFormatted}</b>\n\n<i>Kho hàng đã được cập nhật tự động.</i>`;
    await this.sendMessage(msg, "inventory");
  },

  async notifyNewExpense(expense: any) {
    if (!this.isNotificationEnabled("expense")) return;

    const amountFormatted = this.formatVND(expense.amount || 0);
    const msg = `💸 <b>PHIẾU CHI MỚI</b>\n\n🔹 Số tiền: <b>${amountFormatted}</b>\n🔹 Danh mục: ${expense.category || "Khác"}\n🔹 Người nhận: ${expense.recipient_name || "Không có"}\n🔹 Lý do: ${expense.description || expense.note || "Không có"}\n\n<i>Vui lòng kiểm tra nếu đây là khoản chi lớn.</i>`;
    await this.sendMessage(msg, "finance");
  },

  async notifySalaryAdvance(advance: any, employeeName: string) {
    if (!this.isNotificationEnabled("salary")) return;

    const amountFormatted = this.formatVND(advance.amount || 0);
    const msg = `💰 <b>YÊU CẦU ỨNG LƯƠNG</b>\n\n🔹 Nhân viên: <b>${employeeName}</b>\n🔹 Số tiền: <b>${amountFormatted}</b>\n🔹 Ngày ứng: ${new Date(advance.advance_date).toLocaleDateString("vi-VN")}\n🔹 Lý do: ${advance.reason || "Không có"}`;
    await this.sendMessage(msg, "finance");
  },

  async notifyShiftClosed(shiftSummary: any) {
    if (!this.isNotificationEnabled("shift")) return;

    const { employeeName, opening, sales, refund, expense, actualCash, difference } = shiftSummary;
    const msg = `🔐 <b>CHỐT CA LÀM VIỆC</b>\n\n🔹 Nhân viên: <b>${employeeName}</b>\n🔹 Tiền đầu ca: ${this.formatVND(opening)}\n🔹 Tổng thu (Tiền mặt): ${this.formatVND(sales)}\n🔹 Tổng chi/hoàn tiền: ${this.formatVND(expense + refund)}\n\n💰 <b>Tiền mặt thực tế: ${this.formatVND(actualCash)}</b>\n⚖️ <b>Chênh lệch: ${difference === 0 ? "✅ Khớp" : (difference > 0 ? "🟢 Dư " : "🔴 Âm ") + this.formatVND(Math.abs(difference))}</b>`;
    await this.sendMessage(msg, "finance");
  },

  async notifyStaleProducts(
    items: Array<{ name: string; stock: number; daysWithoutSale: number; lastSoldLabel: string }>,
    days: number,
  ) {
    if (!this.isNotificationEnabled("stale_products")) return;
    if (items.length === 0) return;

    const list = items
      .slice(0, 20)
      .map((item, index) => `${index + 1}. <b>${item.name}</b> - tồn <b>${item.stock}</b>, ${item.lastSoldLabel}`)
      .join("\n");
    const moreText = items.length > 20 ? `\n\n... và ${items.length - 20} mặt hàng khác.` : "";
    const msg = `🕒 <b>MẶT HÀNG LÂU CHƯA BÁN</b>\n\nCác mặt hàng còn tồn nhưng đã từ <b>${days} ngày</b> chưa bán được:\n\n${list}${moreText}\n\n<i>Gợi ý: kiểm tra trưng bày, khuyến mãi hoặc kế hoạch nhập hàng.</i>`;
    await this.sendMessage(msg, "inventory");
  },
};
