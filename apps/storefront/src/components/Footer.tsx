import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full bg-white border-t border-gray-200 pt-16 pb-8 text-sm">
      <div className="w-full mx-auto px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-12">
          
          {/* Column 1: Company Info */}
          <div className="flex flex-col gap-4">
            <h3 className="uppercase text-black font-bold tracking-widest text-lg mb-2">CLASSICX STUDIO</h3>
            <p className="text-gray-600 leading-relaxed text-[13px]">
              Tự hào mang đến những sản phẩm thời trang chất lượng, tối giản và hiện đại dành riêng cho bạn. ClassicX đồng hành cùng phong cách sống tự tin và năng động.
            </p>
            <div className="flex gap-4 mt-4">
              <a href="#" className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-black hover:bg-black hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
              </a>
              <a href="#" className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-black hover:bg-black hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line></svg>
              </a>
              <a href="#" className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-black hover:bg-black hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>
              </a>
            </div>
          </div>

          {/* Column 2: Customer Care */}
          <div className="flex flex-col gap-4">
            <h3 className="uppercase text-black font-bold tracking-wider mb-2">Chăm Sóc Khách Hàng</h3>
            <div className="flex flex-col gap-3">
              <Link href="/faq" className="text-gray-600 hover:text-black transition-colors text-[13px]">Hỏi đáp (FAQs)</Link>
              <Link href="/shipping" className="text-gray-600 hover:text-black transition-colors text-[13px]">Chính sách giao hàng</Link>
              <Link href="/returns" className="text-gray-600 hover:text-black transition-colors text-[13px]">Chính sách đổi trả 60 ngày</Link>
              <Link href="/warranty" className="text-gray-600 hover:text-black transition-colors text-[13px]">Chính sách bảo hành</Link>
              <Link href="/loyalty" className="text-gray-600 hover:text-black transition-colors text-[13px]">Chương trình ClassicX Club</Link>
            </div>
          </div>

          {/* Column 3: About & Policies */}
          <div className="flex flex-col gap-4">
            <h3 className="uppercase text-black font-bold tracking-wider mb-2">Về Chúng Tôi</h3>
            <div className="flex flex-col gap-3">
              <Link href="/about" className="text-gray-600 hover:text-black transition-colors text-[13px]">Câu chuyện ClassicX</Link>
              <Link href="/careers" className="text-gray-600 hover:text-black transition-colors text-[13px]">Tuyển dụng</Link>
              <Link href="/contact" className="text-gray-600 hover:text-black transition-colors text-[13px]">Liên hệ</Link>
              <Link href="/terms" className="text-gray-600 hover:text-black transition-colors text-[13px]">Điều khoản sử dụng</Link>
              <Link href="/privacy" className="text-gray-600 hover:text-black transition-colors text-[13px]">Chính sách bảo mật</Link>
            </div>
          </div>

          {/* Column 4: Contact */}
          <div className="flex flex-col gap-4">
            <h3 className="uppercase text-black font-bold tracking-wider mb-2">Thông Tin Liên Hệ</h3>
            <div className="flex flex-col gap-4 text-[13px] text-gray-600">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                <span>Tầng 3, Tòa nhà ViZ, 123 Đường Tôn Đức Thắng, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-400 shrink-0" />
                <span>Hotline: <strong className="text-black text-sm">1900 2727 37</strong> <br/><span className="text-xs">(9:00 - 18:00 | Thứ 2 - Thứ 7)</span></span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400 shrink-0" />
                <span>Email: contact@classicx.vn</span>
              </div>
            </div>
          </div>

        </div>

        {/* Divider */}
        <div className="w-full h-px bg-gray-200 mb-8"></div>

        {/* Bottom */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-gray-500 text-[12px]">
          <p>© {new Date().getFullYear()} CÔNG TY TNHH CLASSICX STUDIO. TẤT CẢ CÁC QUYỀN ĐƯỢC BẢO LƯU.</p>
          <div className="flex gap-4">
            <span>Mã số thuế: 0123456789</span>
            <span>Cấp ngày: 01/01/2024</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
