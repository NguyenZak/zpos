import { NextResponse } from "next/server";

import fs from "fs/promises";
import path from "path";

import { requireSuperAdmin } from "@/utils/admin-auth";

const DATA_DIR = path.join(process.cwd(), "src/data");
const INQUIRIES_FILE = path.join(DATA_DIR, "inquiries.json");

// Helper to read inquiries from disk or load fallback mock data
async function readInquiries() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    try {
      const fileData = await fs.readFile(INQUIRIES_FILE, "utf-8");
      return JSON.parse(fileData);
    } catch (e) {
      // If file doesn't exist, create it with rich mock data initially
      const initialInquiries = [
        {
          id: "inq-1",
          customerName: "Hoàng Đức Trung",
          customerEmail: "trung.hd@bibomart.com.vn",
          customerPhone: "0912 345 678",
          message:
            "Tôi muốn nhận báo giá hệ thống POS quản lý chuỗi 15 chi nhánh siêu thị mẹ và bé tại Hà Nội. Yêu cầu tích hợp xuất hóa đơn đỏ và chuyển kho nội bộ tức thời.",
          status: "new",
          date: "2026-05-17 18:35",
          notes: ["Khách hàng là đại diện chuỗi BiboMart Hà Nội.", "Cần demo hệ thống trực tiếp vào chiều thứ 4 này."],
        },
        {
          id: "inq-2",
          customerName: "Lâm Mỹ Lệ",
          customerEmail: "le.lam@thecoffeehouse.vn",
          customerPhone: "0977 888 999",
          message:
            "Tìm hiểu giải pháp Voice AI order cho quầy cafe take-away. Hệ thống có hỗ trợ máy in nhiệt bếp không?",
          status: "contacted",
          date: "2026-05-16 11:20",
          notes: [
            "Đã gọi điện tư vấn buổi sáng 16/5.",
            "Khách hàng phản hồi rất quan tâm đến trợ lý Voice AI nhưng lo ngại tiếng ồn tại quầy.",
          ],
        },
        {
          id: "inq-3",
          customerName: "Phạm Minh Hoàng",
          customerEmail: "hoangpm@tocotocotea.com",
          customerPhone: "0909 112 233",
          message:
            "Cần tích hợp ZPOS với phần mềm ERP SAP có sẵn của doanh nghiệp. Xin gửi tài liệu hướng dẫn API SDK.",
          status: "completed",
          date: "2026-05-14 09:45",
          notes: ["Đã bàn giao bộ tài liệu API Swagger.", "Kỹ thuật hai bên đã kết nối thử nghiệm Sandbox thành công."],
        },
      ];
      await fs.writeFile(INQUIRIES_FILE, JSON.stringify(initialInquiries, null, 2), "utf-8");
      return initialInquiries;
    }
  } catch (error) {
    console.error("Error reading inquiries:", error);
    return [];
  }
}

// Helper to write inquiries to disk
async function writeInquiries(inquiries: any[]) {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(INQUIRIES_FILE, JSON.stringify(inquiries, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing inquiries:", error);
  }
}

export async function GET() {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  const inquiries = await readInquiries();
  return NextResponse.json({ success: true, data: inquiries });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, phone, email, storeName, businessType, scale, message } = body;

    if (!name || !phone) {
      return NextResponse.json({ success: false, error: "Thiếu tên hoặc số điện thoại liên hệ" }, { status: 400 });
    }

    const inquiries = await readInquiries();
    const newInquiry = {
      id: `inq-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: name,
      customerEmail: email || `${name.toLowerCase().replace(/\s+/g, "")}@example.com`,
      customerPhone: phone,
      message:
        message ||
        `Yêu cầu dùng thử POS mô hình ${businessType || "Chưa rõ"} (Quy mô: ${scale || "1-5"}), Tên thương hiệu: ${storeName || "Chưa rõ"}`,
      status: "new",
      date: new Date().toISOString().slice(0, 16).replace("T", " "),
      notes: [],
    };

    inquiries.unshift(newInquiry);
    await writeInquiries(inquiries);

    return NextResponse.json({ success: true, data: newInquiry });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const { id, status, notes } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Thiếu ID yêu cầu" }, { status: 400 });
    }

    const inquiries = await readInquiries();
    const index = inquiries.findIndex((inq: any) => inq.id === id);

    if (index === -1) {
      return NextResponse.json({ success: false, error: "Không tìm thấy yêu cầu tư vấn" }, { status: 404 });
    }

    if (status !== undefined) inquiries[index].status = status;
    if (notes !== undefined) inquiries[index].notes = notes;

    await writeInquiries(inquiries);

    return NextResponse.json({ success: true, data: inquiries[index] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Thiếu ID yêu cầu" }, { status: 400 });
    }

    let inquiries = await readInquiries();
    inquiries = inquiries.filter((inq: any) => inq.id !== id);
    await writeInquiries(inquiries);

    return NextResponse.json({ success: true, message: "Xóa yêu cầu tư vấn thành công" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
