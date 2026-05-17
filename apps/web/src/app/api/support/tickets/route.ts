import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "src/data");
const TICKETS_FILE = path.join(DATA_DIR, "tickets.json");

// Helper to read tickets
async function readTickets() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    try {
      const fileData = await fs.readFile(TICKETS_FILE, "utf-8");
      return JSON.parse(fileData);
    } catch (e) {
      // File doesn't exist yet, return initial sample tickets
      const initialTickets = [
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
          createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
        },
        {
          id: "ticket-2",
          tenantName: "Cửa hàng Demo",
          tenantSlug: "demo",
          title: "Tư vấn nâng cấp lên gói Enterprise",
          description: "Chuỗi của tôi sắp khai trương thêm 3 chi nhánh mới tại Đà Nẵng, cần được tư vấn cấu hình đồng bộ kho đa điểm nâng cao.",
          category: "Hỏi đáp/Tư vấn",
          priority: "Trung bình",
          contactPhone: "0987654321",
          status: "Đang xử lý",
          createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
        }
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
async function writeTickets(tickets: any[]) {
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
    const { tenantName, tenantSlug, title, description, category, priority, contactPhone } = body;

    if (!title || !description) {
      return NextResponse.json({ success: false, error: "Thiếu thông tin tiêu đề hoặc nội dung yêu cầu" }, { status: 400 });
    }

    const tickets = await readTickets();
    const newTicket = {
      id: `ticket-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      tenantName: tenantName || "Khách vãng lai",
      tenantSlug: tenantSlug || "guest",
      title,
      description,
      category: category || "Hỗ trợ khác",
      priority: priority || "Trung bình",
      contactPhone: contactPhone || "",
      status: "Mới",
      createdAt: new Date().toISOString()
    };

    tickets.unshift(newTicket);
    await writeTickets(tickets);

    return NextResponse.json({ success: true, data: newTicket });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
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
    const ticketIndex = tickets.findIndex((t: any) => t.id === id);

    if (ticketIndex === -1) {
      return NextResponse.json({ success: false, error: "Không tìm thấy ticket" }, { status: 404 });
    }

    if (status !== undefined) tickets[ticketIndex].status = status;
    if (priority !== undefined) tickets[ticketIndex].priority = priority;
    tickets[ticketIndex].updatedAt = new Date().toISOString();

    await writeTickets(tickets);

    return NextResponse.json({ success: true, data: tickets[ticketIndex] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
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
    tickets = tickets.filter((t: any) => t.id !== id);
    await writeTickets(tickets);

    return NextResponse.json({ success: true, message: "Xóa ticket thành công" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
