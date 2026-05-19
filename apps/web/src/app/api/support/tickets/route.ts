import { NextResponse } from "next/server";

import { sendSupportTicketToTelegram } from "@/lib/telegram-logbug";

import fs from "node:fs/promises";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "src/data");
const TICKETS_FILE = path.join(DATA_DIR, "tickets.json");

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
  updatedAt?: string;
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Đã xảy ra lỗi không xác định";
}

// Helper to read tickets
async function readTickets(): Promise<SupportTicket[]> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    try {
      const fileData = await fs.readFile(TICKETS_FILE, "utf-8");
      return JSON.parse(fileData);
    } catch {
      // File doesn't exist yet, return initial sample tickets
      const initialTickets: SupportTicket[] = [
        {
          id: "ticket-1",
          tenantName: "Kphone Store",
          tenantSlug: "kphone",
          title: "Không thể thêm sản phẩm biến thể mới",
          description: "Tôi thử thêm mẫu iPhone 15 Pro Max với dung lượng 256GB nhưng hệ thống báo lỗi không lưu được.",
          category: "Lỗi phần mềm",
          priority: "Cao",
          contactPhone: "0912345678",
          status: "Mới",
          createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
        },
        {
          id: "ticket-2",
          tenantName: "Cửa hàng Demo",
          tenantSlug: "demo",
          title: "Tư vấn nâng cấp lên gói Enterprise",
          description:
            "Chuỗi của tôi sắp khai trương thêm 3 chi nhánh mới tại Đà Nẵng, cần được tư vấn cấu hình đồng bộ kho đa điểm nâng cao.",
          category: "Hỏi đáp/Tư vấn",
          priority: "Trung bình",
          contactPhone: "0987654321",
          status: "Đang xử lý",
          createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
        },
      ];
      await fs.writeFile(TICKETS_FILE, JSON.stringify(initialTickets, null, 2), "utf-8");
      return initialTickets;
    }
  } catch (error) {
    console.error("Error reading tickets:", error);
    return [];
  }
}

// Helper to write tickets
async function writeTickets(tickets: SupportTicket[]) {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(TICKETS_FILE, JSON.stringify(tickets, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing tickets:", error);
  }
}

export async function GET() {
  const tickets = await readTickets();
  return NextResponse.json({ success: true, data: tickets });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tenantName, tenantSlug, title, description, category, priority, contactPhone } =
      body as Partial<SupportTicket>;

    if (!title || !description) {
      return NextResponse.json(
        { success: false, error: "Thiếu thông tin tiêu đề hoặc nội dung yêu cầu" },
        { status: 400 },
      );
    }

    const tickets = await readTickets();
    const newTicket: SupportTicket = {
      id: `ticket-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      tenantName: tenantName || "Khách vãng lai",
      tenantSlug: tenantSlug || "guest",
      title,
      description,
      category: category || "Hỗ trợ khác",
      priority: priority || "Trung bình",
      contactPhone: contactPhone || "",
      status: "Mới",
      createdAt: new Date().toISOString(),
    };

    tickets.unshift(newTicket);
    await writeTickets(tickets);

    const telegram = await sendSupportTicketToTelegram(newTicket);
    if (!telegram.ok) {
      console.warn("Telegram logbug notification failed:", telegram.error);
    }

    return NextResponse.json({ success: true, data: newTicket, telegram });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, status, priority } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Thiếu ID của ticket" }, { status: 400 });
    }

    const tickets = await readTickets();
    const ticketIndex = tickets.findIndex((ticket) => ticket.id === id);

    if (ticketIndex === -1) {
      return NextResponse.json({ success: false, error: "Không tìm thấy ticket" }, { status: 404 });
    }

    if (status !== undefined) tickets[ticketIndex].status = status;
    if (priority !== undefined) tickets[ticketIndex].priority = priority;
    tickets[ticketIndex].updatedAt = new Date().toISOString();

    await writeTickets(tickets);

    return NextResponse.json({ success: true, data: tickets[ticketIndex] });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Thiếu ID của ticket" }, { status: 400 });
    }

    let tickets = await readTickets();
    tickets = tickets.filter((ticket) => ticket.id !== id);
    await writeTickets(tickets);

    return NextResponse.json({ success: true, message: "Xóa ticket thành công" });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: getErrorMessage(error) }, { status: 500 });
  }
}
