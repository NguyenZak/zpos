"use client";

import React, { useEffect, useState } from 'react';

interface PrintInvoiceProps {
  order: {
    order_number: string;
    created_at: string;
    items: any[];
    total_amount: number;
    payment_method: string;
    customer?: { name: string; phone: string };
  };
}

export function PrintInvoice({ order }: PrintInvoiceProps) {
  const [paperSize, setPaperSize] = useState('K80 (80mm)');
  const [bizName, setBizName] = useState('ZPOS RETAIL STORE');
  const [bizAddr, setBizAddr] = useState('123 Đường ABC, Quận 1, TP. Hồ Chí Minh');
  const [footerText, setFooterText] = useState('Cảm ơn quý khách. Hẹn gặp lại!');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPaperSize(localStorage.getItem('zpos_printer_paper') || 'K80 (80mm)');
      setBizName(localStorage.getItem('zpos_biz_name') || 'ZPOS RETAIL STORE');
      setBizAddr(localStorage.getItem('zpos_biz_addr') || '123 Đường ABC, Quận 1, TP. Hồ Chí Minh');
      setFooterText(localStorage.getItem('zpos_printer_footer') || 'Cảm ơn quý khách. Hẹn gặp lại!');
    }
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const isThermal = paperSize.includes('K80') || paperSize.includes('K57');
  
  const getContainerWidth = () => {
    if (paperSize.includes('K57')) return 'max-w-[58mm] mx-auto text-[10px] p-2';
    if (paperSize.includes('A4')) return 'max-w-[210mm] mx-auto text-sm p-8';
    if (paperSize.includes('A5')) return 'max-w-[148mm] mx-auto text-xs p-6';
    return 'max-w-[80mm] mx-auto text-[12px] p-4'; // K80 default
  };

  return (
    <div id="print-area" className="hidden print:block print:absolute print:left-0 print:top-0 print:w-full print:bg-white print:z-[9999] min-h-screen text-black font-sans">
      <div className={getContainerWidth()}>
        <div className="text-center space-y-2 mb-6 border-b-2 border-black pb-4">
          <h1 className={`${isThermal ? 'text-lg' : 'text-2xl'} font-black uppercase tracking-widest`}>{bizName}</h1>
          <p className={`${isThermal ? 'text-[10px]' : 'text-sm'} font-bold`}>{bizAddr}</p>
        </div>

        <div className={`flex ${isThermal ? 'flex-col gap-2' : 'justify-between items-end'} mb-6`}>
          <div className="space-y-1 text-left">
            <p className={`${isThermal ? 'text-xs' : 'text-sm'} font-black uppercase`}>Hóa đơn bán lẻ</p>
            <p className={isThermal ? 'text-[10px]' : 'text-xs'}>Số: <span className="font-bold">{order.order_number}</span></p>
            <p className={isThermal ? 'text-[10px]' : 'text-xs'}>Ngày: {new Date(order.created_at).toLocaleString('vi-VN')}</p>
          </div>
          <div className={`${isThermal ? 'text-left' : 'text-right'} space-y-1`}>
            <p className={`${isThermal ? 'text-[10px]' : 'text-xs'} font-bold`}>Khách hàng:</p>
            <p className={`${isThermal ? 'text-xs' : 'text-sm'} font-black`}>{order.customer?.name || "Khách lẻ"}</p>
            <p className={isThermal ? 'text-[10px]' : 'text-xs'}>{order.customer?.phone || ""}</p>
          </div>
        </div>

        <table className="w-full mb-6">
          <thead className="border-y-2 border-black">
            <tr className={`${isThermal ? 'text-[10px]' : 'text-xs'} font-black uppercase text-left`}>
              <th className="py-2">SP</th>
              <th className="py-2 text-center">SL</th>
              <th className="py-2 text-right">Giá</th>
              <th className="py-2 text-right">Tổng</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/10">
            {order.items?.map((item, index) => (
              <tr key={index} className={isThermal ? 'text-[10px]' : 'text-sm'}>
                <td className="py-2 font-bold max-w-[80px] truncate">{item.product_name}</td>
                <td className="py-2 text-center">{item.quantity}</td>
                <td className="py-2 text-right">{formatCurrency(item.unit_price)}</td>
                <td className="py-2 text-right font-black">{formatCurrency(item.total_price)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="space-y-2 border-t-2 border-black pt-4">
          <div className="flex justify-between font-bold">
            <span>Tổng tiền:</span>
            <span className={`${isThermal ? 'text-sm' : 'text-lg'} font-black`}>{formatCurrency(order.total_amount)}</span>
          </div>
          <div className={`flex justify-between ${isThermal ? 'text-[10px]' : 'text-sm'} italic`}>
            <span>Phương thức:</span>
            <span className="uppercase">{order.payment_method === 'cash' ? 'Tiền mặt' : order.payment_method === 'transfer' ? 'Chuyển khoản' : 'Thẻ'}</span>
          </div>
        </div>

        <div className="mt-8 text-center space-y-4">
          <p className={`${isThermal ? 'text-[10px]' : 'text-sm'} font-black italic`}>{footerText}</p>
          <div className="flex justify-center">
            <div className={`${isThermal ? 'w-16 h-16' : 'w-24 h-24'} border-2 border-black p-1`}>
              <div className="w-full h-full bg-black flex items-center justify-center text-white text-[8px] font-black uppercase">
                QR Code
              </div>
            </div>
          </div>
          <p className="text-[8px] opacity-50">Powered by ZPOS - viz.vn</p>
        </div>
      </div>
    </div>
  );
}
