import { Crown, Gift, Link2, ArrowRight } from "lucide-react";

export function ClubBanner({ settings }: { settings?: any }) {
  const title = settings?.title || "ĐẶC QUYỀN DÀNH CHO";
  const count = settings?.count || "529.671";
  const suffix = settings?.suffix || "THÀNH VIÊN CLASSICX CLUB";

  return (
    <div className="bg-[#f3f4f6] py-8 px-8 w-full rounded-2xl my-8 border border-gray-200">
      <div className="w-full flex flex-col lg:flex-row gap-8 lg:gap-12 items-stretch">
        {/* Left Side: Perks */}
        <div className="flex-1 w-full">
          <h2 className="text-2xl font-black uppercase mb-6 text-[#1a1a1a] tracking-tight">
            {title} <span className="text-[#2f5acf]">{count}</span> {suffix}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Box 1 */}
            <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-5 relative min-h-[110px] flex flex-col justify-between group hover:shadow-md transition-shadow">
              <span className="font-semibold text-sm leading-snug text-gray-800 pr-6">Mời bạn bè<br />hoàn tiền 10% ClassicX Cash</span>
              <div className="absolute bottom-4 right-4 bg-blue-50 p-2 rounded-full group-hover:bg-blue-100 transition-colors">
                <Link2 className="w-5 h-5 text-[#2f5acf]" />
              </div>
            </div>
            {/* Box 2 */}
            <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-5 relative min-h-[110px] flex flex-col justify-between group hover:shadow-md transition-shadow">
              <span className="font-semibold text-sm leading-snug text-gray-800">Hoàn tiền<br />đến 7%</span>
              <div className="absolute bottom-4 right-4 bg-blue-50 p-2 rounded-full group-hover:bg-blue-100 transition-colors">
                <Crown className="w-5 h-5 text-[#2f5acf]" />
              </div>
            </div>
            {/* Box 3 */}
            <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-5 relative min-h-[110px] flex flex-col justify-between group hover:shadow-md transition-shadow">
              <span className="font-semibold text-sm leading-snug text-gray-800 pr-6">Quà tặng sinh nhật<br />& dịp đặc biệt</span>
              <div className="absolute bottom-4 right-4 bg-blue-50 p-2 rounded-full group-hover:bg-blue-100 transition-colors">
                <Gift className="w-5 h-5 text-[#2f5acf]" />
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden lg:block w-[1px] bg-gray-300 self-stretch mx-4"></div>

        {/* Right Side: Recent Activity */}
        <div className="w-full lg:w-[380px] shrink-0 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <h3 className="text-sm font-bold uppercase text-[#1a1a1a] tracking-wider">HOẠT ĐỘNG GẦN ĐÂY</h3>
          </div>
          
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm mb-6 flex-1 max-h-[110px] overflow-hidden relative">
            <div className="text-[12px] text-gray-600 leading-relaxed space-y-3">
              <p>Hà Thị Minh Tâm vừa được cộng <span className="font-bold text-[#2f5acf]">6.000 ClassicX Cash</span> từ ĐH #7xxx491</p>
              <p>Tạ Văn Cường vừa được cộng <span className="font-bold text-[#2f5acf]">12.000 ClassicX Cash</span> từ ĐH #8xxx639</p>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
          </div>

          <button className="bg-[#1a1a1a] text-white w-full rounded-xl py-3.5 text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-colors group">
            GIA NHẬP CLASSICX CLUB NGAY 
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
