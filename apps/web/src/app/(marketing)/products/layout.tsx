import type { Metadata } from "next";
import { getMetadata } from "@/utils/seo";

export async function generateMetadata(): Promise<Metadata> {
  return getMetadata({
    title: "Giải pháp POS & Thiết bị bán hàng chuyên nghiệp",
    description: "Khám phá hệ sinh thái sản phẩm ZPOS: phần mềm quản lý bán hàng đa kênh, máy POS cảm ứng đứng, máy quét mã vạch và máy in hóa đơn nhiệt siêu tốc.",
    path: "/products",
    keywords: [
      "thiet bi pos",
      "phan mem ban hang pos",
      "may tinh tien cam ung",
      "may quet ma vach",
      "may in hoa don",
      "zpos retail max",
      "zpos fnb air"
    ]
  });
}

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
