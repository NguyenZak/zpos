import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "src/data");
const BLOGS_FILE = path.join(DATA_DIR, "blogs.json");

// Helper to read blogs from disk or load fallback mock data
async function readBlogs() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    try {
      const fileData = await fs.readFile(BLOGS_FILE, "utf-8");
      return JSON.parse(fileData);
    } catch (e) {
      // Fallback/Initial mock blogs
      const initialBlogs = [
        {
          id: "post-1",
          title: "Cách tối ưu hóa hệ thống POS cho mùa mua sắm cao điểm cuối năm",
          summary: "Chia sẻ 5 phương pháp tối ưu hóa dữ liệu kho, đồng bộ hóa hóa đơn tức thì và quản lý hiệu suất nhân viên để hạn chế gián đoạn thanh toán.",
          content: "Hệ thống POS (Point of Sale) đóng vai trò trung tâm của mọi hoạt động giao dịch tại quầy. Trong mùa mua sắm cao điểm cuối năm, lượng khách tăng đột biến có thể gây quá tải cho các hệ thống cũ kỹ. ZPOS với cấu trúc Offline-first và đồng bộ Realtime đảm bảo không gián đoạn bất kỳ giao dịch nào.",
          slug: "toi-uu-pos-mua-cao-diem",
          category: "Kinh doanh",
          author: "Nguyễn Minh Khôi",
          status: "published",
          readTime: "5 phút",
          publishedAt: "2026-05-15",
          coverImage: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=600&q=80",
          views: 1245
        },
        {
          id: "post-2",
          title: "Ứng dụng Trợ lý AI Giọng nói trong việc Gọi món & Tạo Order tự động",
          summary: "Đánh giá hiệu quả thực tế khi tích hợp Voice AI Assistant vào ZPOS giúp nhân viên giảm 50% thời gian nhập liệu hóa đơn.",
          content: "Công nghệ Trợ lý ảo AI đang thay đổi cách thức các cửa hàng bán lẻ và quán cafe vận hành. Thay vì gõ phím chọn món thủ công, nhân viên chỉ cần nói tự nhiên. Voice AI của ZPOS sẽ tự động nhận diện ngôn ngữ, nhận dạng giọng nói tiếng Việt 3 miền cực tốt để phân tích và lên đơn tức thì dưới 1.5 giây.",
          slug: "ung-dung-voice-ai-order",
          category: "Công nghệ",
          author: "Trần Anh Tú",
          status: "published",
          readTime: "7 phút",
          publishedAt: "2026-05-12",
          coverImage: "https://images.unsplash.com/photo-1531746790731-6c087fecd793?auto=format&fit=crop&w=600&q=80",
          views: 932
        },
        {
          id: "post-3",
          title: "Giải pháp ERP đám mây & Đồng bộ đa chi nhánh tối ưu cho chuỗi bán lẻ",
          summary: "Kiến trúc kỹ thuật đằng sau hệ thống quản lý kho đa chi nhánh (Multi-location) và cách thức vận hành đồng bộ không xung đột dữ liệu.",
          content: "Khi doanh nghiệp mở rộng quy mô từ một cửa hàng lên chuỗi nhiều chi nhánh, thách thức lớn nhất là làm thế nào đồng bộ kho, giá cả và doanh thu đồng nhất. Với hệ sinh thái ZPOS, tất cả dữ liệu được lưu trữ tập trung tại cơ sở dữ liệu Supabase mạnh mẽ và phân phối cực nhanh qua kiến trúc biên CDN.",
          slug: "erp-dong-bo-chuoi-ban-le",
          category: "Quản lý",
          author: "Lê Thị Thu Thủy",
          status: "draft",
          readTime: "6 phút",
          publishedAt: "2026-05-10",
          coverImage: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80",
          views: 456
        }
      ];
      await fs.writeFile(BLOGS_FILE, JSON.stringify(initialBlogs, null, 2), "utf-8");
      return initialBlogs;
    }
  } catch (error) {
    console.error("Error reading blogs:", error);
    return [];
  }
}

// Helper to write blogs to disk
async function writeBlogs(blogs: any[]) {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(BLOGS_FILE, JSON.stringify(blogs, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing blogs:", error);
  }
}

export async function GET() {
  const blogs = await readBlogs();
  return NextResponse.json({ success: true, data: blogs });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, title, summary, content, slug, category, author, status, readTime, coverImage, publishedAt } = body;

    if (!title || !slug) {
      return NextResponse.json({ success: false, error: "Thiếu Tiêu đề hoặc Đường dẫn tĩnh URL" }, { status: 400 });
    }

    const blogs = await readBlogs();

    if (id) {
      // EDIT/UPDATE MODE
      const index = blogs.findIndex((b: any) => b.id === id);
      if (index === -1) {
        return NextResponse.json({ success: false, error: "Không tìm thấy bài viết để sửa" }, { status: 404 });
      }

      blogs[index] = {
        ...blogs[index],
        title,
        summary,
        content,
        slug,
        category: category || "Kinh doanh",
        status: status || "draft",
        readTime: readTime || "5 phút",
        coverImage: coverImage || "https://images.unsplash.com/photo-1432821596592-e2c18b78144f?auto=format&fit=crop&w=600&q=80",
        publishedAt: publishedAt || blogs[index].publishedAt
      };

      await writeBlogs(blogs);
      return NextResponse.json({ success: true, data: blogs[index] });
    } else {
      // CREATE MODE
      const newBlog = {
        id: `post-${Date.now()}`,
        title,
        summary,
        content,
        slug,
        category: category || "Kinh doanh",
        author: author || "ZPOS Admin",
        status: status || "draft",
        readTime: readTime || "5 phút",
        publishedAt: new Date().toISOString().slice(0, 10),
        coverImage: coverImage || "https://images.unsplash.com/photo-1432821596592-e2c18b78144f?auto=format&fit=crop&w=600&q=80",
        views: 0
      };

      blogs.unshift(newBlog);
      await writeBlogs(blogs);
      return NextResponse.json({ success: true, data: newBlog });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Thiếu ID bài viết" }, { status: 400 });
    }

    let blogs = await readBlogs();
    blogs = blogs.filter((b: any) => b.id !== id);
    await writeBlogs(blogs);

    return NextResponse.json({ success: true, message: "Xóa bài viết thành công" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
