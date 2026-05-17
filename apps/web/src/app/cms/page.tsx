import React from 'react';
import { 
  FileText, 
  Image as ImageIcon, 
  Globe, 
  Layout,
  Plus,
  PenTool
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function CMSDashboard() {
  const actions = [
    { title: "Bài viết mới", icon: PenTool, color: "bg-blue-500" },
    { title: "Nội dung Landing Page", icon: Layout, color: "bg-purple-500" },
    { title: "Cấu hình SEO", icon: Globe, color: "bg-green-500" },
    { title: "Thư viện Media", icon: ImageIcon, color: "bg-orange-500" },
  ];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">ZPOS CMS</h1>
          <p className="text-muted-foreground mt-2 font-medium">Quản lý nội dung trang chủ và các chiến dịch marketing.</p>
        </div>
        <Button className="rounded-full px-6 shadow-lg shadow-primary/20">
          <Plus className="mr-2 h-4 w-4" />
          Tạo nội dung mới
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {actions.map((action, i) => (
          <Card key={i} className="hover:scale-105 transition-transform cursor-pointer border-none shadow-xl">
            <CardContent className="pt-6 flex flex-col items-center text-center gap-4">
              <div className={`w-16 h-16 rounded-3xl ${action.color} flex items-center justify-center text-white shadow-inner`}>
                <action.icon className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-slate-800">{action.title}</h3>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="w-6 h-6 text-primary" />
          Nội dung gần đây
        </h2>
        <div className="bg-white border rounded-3xl shadow-sm overflow-hidden">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex items-center justify-between p-6 border-b last:border-0 hover:bg-slate-50 transition-colors">
              <div className="flex gap-4">
                <div className="w-20 h-14 rounded-xl bg-slate-100 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-slate-800">Cách tối ưu hóa hệ thống POS cho mùa mua sắm cao điểm</h4>
                  <div className="flex items-center gap-3 mt-1 text-xs font-medium text-muted-foreground uppercase tracking-widest">
                    <span>Đã xuất bản</span>
                    <span>•</span>
                    <span>Marketing</span>
                    <span>•</span>
                    <span>17 Tháng 5, 2026</span>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="rounded-full">
                <PenTool className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
