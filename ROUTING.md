# 🌐 Cấu trúc Tên miền ZPOS (SaaS Routing)

Tài liệu này tổng hợp các đường dẫn truy cập cho các phân hệ của hệ thống ZPOS theo mô hình Multi-tenant.

## 🚀 Môi trường Production

| Phân hệ | Tên miền | Mô tả |
| :--- | :--- | :--- |
| **Website chính** | `https://zpos.click` | Trang giới thiệu, bảng giá, liên hệ. |
| **App khách hàng** | `https://app.zpos.click` | Cổng đăng nhập chung cho mọi khách hàng. |
| **App riêng từng khách** | `https://{tenant}.zpos.click` | Giao diện POS/Admin riêng (Ví dụ: `bibomart.zpos.click`). |
| **Quản trị tổng** | `https://console.zpos.click` | Quản lý Tenant, Gói cước, Hệ thống (Super Admin). |
| **Quản trị nội dung** | `https://cms.zpos.click` | Quản lý bài viết, Landing page, Marketing. |

---

## 💻 Môi trường Phát triển (Local)

Để chạy thử trên máy tính cá nhân, hãy sử dụng các đường dẫn dưới đây:

### 1. Truy cập nhanh (Không cần cấu hình)
Sử dụng định dạng `*.localhost:3000`:
- **Landing Page**: [http://localhost:3000](http://localhost:3000)
- **App Chung**: [http://app.localhost:3000](http://app.localhost:3000)
- **Tenant Demo**: [http://bibomart.localhost:3000](http://bibomart.localhost:3000)
- **Console**: [http://console.localhost:3000](http://console.localhost:3000)
- **CMS**: [http://cms.localhost:3000](http://cms.localhost:3000)

### 2. Cấu hình DNS local (Khuyên dùng)
Nếu muốn sử dụng tên miền giống hệt production để test, hãy thêm các dòng sau vào file `/etc/hosts`:

```bash
# ZPOS Local Domains
127.0.0.1 zpos.localhost
127.0.0.1 app.zpos.localhost
127.0.0.1 console.zpos.localhost
127.0.0.1 cms.zpos.localhost
127.0.0.1 demo.zpos.localhost
```

---

## 🛠 Cấu trúc Thư mục Code (App Router)

Hệ thống sử dụng Middleware để ánh xạ (rewrite) các subdomain vào các group route tương ứng:

- `src/app/(marketing)` → Xử lý `zpos.click`
- `src/app/app` → Xử lý `app.zpos.click` và `{tenant}.zpos.click`
- `src/app/console` → Xử lý `console.zpos.click`
- `src/app/cms` → Xử lý `cms.zpos.click`

---
*Cập nhật lần cuối: 17/05/2026*
