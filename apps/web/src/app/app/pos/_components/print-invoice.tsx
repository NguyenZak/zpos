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
  isProvisional?: boolean;
  printType?: 'temp_bill' | 'kitchen_ticket' | 'bar_ticket' | 'final_receipt' | 'payment';
}

export function PrintInvoice({ order, isProvisional, printType = 'payment' }: PrintInvoiceProps) {
  const [paperSize, setPaperSize] = useState('K80 (80mm)');
  const [bizName, setBizName] = useState('ZPOS RETAIL STORE');
  const [bizAddr, setBizAddr] = useState('123 Đường ABC, Quận 1, TP. Hồ Chí Minh');
  
  // Custom template state
  const [bizPhone, setBizPhone] = useState('');
  const [showLogo, setShowLogo] = useState(true);
  const [logoUrl, setLogoUrl] = useState('');
  const [showHeader, setShowHeader] = useState(true);
  const [headerText, setHeaderText] = useState('HÓA ĐƠN BÁN LẺ');
  const [showCustomer, setShowCustomer] = useState(true);
  const [showPayment, setShowPayment] = useState(true);
  const [showQRCode, setShowQRCode] = useState(true);
  const [showFooter, setShowFooter] = useState(true);
  const [footerText, setFooterText] = useState('Cảm ơn quý khách. Hẹn gặp lại!');
  const [accentColor, setAccentColor] = useState('#000000');
  const [fontFamily, setFontFamily] = useState('font-sans');
  const [showBranchName, setShowBranchName] = useState(true);
  const [showCashierName, setShowCashierName] = useState(true);

  // Bank Info for QR code
  const [bankId, setBankId] = useState('');
  const [accountNo, setAccountNo] = useState('');
  const [memoTemplate, setMemoTemplate] = useState('ZPOS_');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Basic settings
      setPaperSize(localStorage.getItem('zpos_printer_paper') || 'K80 (80mm)');
      setBizName(localStorage.getItem('zpos_biz_name') || 'ZPOS RETAIL STORE');
      setBizAddr(localStorage.getItem('zpos_biz_addr') || '123 Đường ABC, Quận 1, TP. Hồ Chí Minh');
      setLogoUrl(localStorage.getItem('zpos_biz_logo') || '');

      const prefix = isProvisional ? 'zpos_prov_invoice' : 'zpos_invoice';
      const defaultHeader = isProvisional ? 'HÓA ĐƠN TẠM TÍNH' : 'HÓA ĐƠN BÁN LẺ';

      const getSetting = (key: string, isBool: boolean, defaultVal: any) => {
        const val = localStorage.getItem(`${prefix}_${key}`);
        if (val !== null) return isBool ? val !== 'false' : val;
        
        // Fallback to main invoice settings if provisional setting is missing
        if (isProvisional) {
          const mainVal = localStorage.getItem(`zpos_invoice_${key}`);
          if (mainVal !== null) return isBool ? mainVal !== 'false' : mainVal;
        }
        
        return defaultVal;
      };

      // Customization settings
      setBizPhone(getSetting('phone', false, ''));
      setShowLogo(getSetting('show_logo', true, true));
      setShowHeader(getSetting('show_header', true, true));
      setHeaderText(getSetting('header_text', false, defaultHeader));
      setShowCustomer(getSetting('show_customer', true, true));
      setShowPayment(getSetting('show_payment', true, true));
      setShowQRCode(getSetting('show_qrcode', true, !isProvisional)); // QR default false for prov, true for main
      setShowFooter(getSetting('show_footer', true, true));
      setFooterText(getSetting('footer_text', false, localStorage.getItem('zpos_printer_footer') || 'Cảm ơn quý khách. Hẹn gặp lại!'));
      setAccentColor(getSetting('accent_color', false, '#000000'));
      setFontFamily(getSetting('font_family', false, 'font-sans'));
      setShowBranchName(getSetting('show_branch', true, true));
      setShowCashierName(getSetting('show_cashier', true, true));

      // Bank Info
      setBankId(localStorage.getItem('zpos_qr_bank_id') || '');
      setAccountNo(localStorage.getItem('zpos_qr_account_no') || '');
      setMemoTemplate(localStorage.getItem('zpos_qr_memo_template') || 'ZPOS_');
    }
  }, [isProvisional, printType, order]);

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

  const getQrUrl = () => {
    if (!bankId || !accountNo) return '';
    return `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${order.total_amount}&addInfo=${memoTemplate}${order.order_number}`;
  };

  const fontClass = fontFamily === 'font-mono' ? 'font-mono' : fontFamily === 'font-serif' ? 'font-serif' : 'font-sans';

  let displayHeaderText = headerText;
  if (printType === 'kitchen_ticket') displayHeaderText = 'PHIẾU BẾP';
  if (printType === 'bar_ticket') displayHeaderText = 'PHIẾU BAR';

  const isOrderTicket = printType === 'kitchen_ticket' || printType === 'bar_ticket';
  
  return (
    <div id="print-area" className={`hidden print:block print:w-full relative print:bg-white text-black ${fontClass} overflow-hidden`}>
      <div className={`${getContainerWidth()} relative z-10`}>
        
        {/* Accent Bar for A4/A5 */}
        {!isThermal && (
          <div className="w-full h-1.5 mb-6" style={{ backgroundColor: accentColor }} />
        )}

        {/* Logo area */}
        {showLogo && logoUrl && (
          <div className="flex justify-center mb-4">
            <img src={logoUrl} alt="Store Logo" className="w-16 h-16 object-contain rounded" />
          </div>
        )}

        {/* Store Business Info */}
        <div className="text-center space-y-1 mb-6 border-b border-black/20 pb-4">
          <h1 
            className={`${isThermal ? 'text-lg' : 'text-2xl'} font-black uppercase tracking-widest`}
            style={{ color: !isThermal ? accentColor : '#000000' }}
          >
            {bizName}
          </h1>
          <p className={`${isThermal ? 'text-[10px]' : 'text-sm'} font-bold`}>{bizAddr}</p>
          {bizPhone && (
            <p className={isThermal ? 'text-[10px]' : 'text-xs'}>SĐT: {bizPhone}</p>
          )}
          {showBranchName && (
            <p className="text-[9px] opacity-75 uppercase font-bold">
              Chi nhánh: Trung Tâm
            </p>
          )}
        </div>

        {/* Title & Invoice info */}
        {showHeader && (
          <div className={`flex ${isThermal ? 'flex-col gap-2' : 'justify-between items-end'} mb-6`}>
            <div className="space-y-1 text-left">
              <p 
                className={`${isThermal ? 'text-xs' : 'text-base'} font-black uppercase`}
                style={{ color: !isThermal ? accentColor : '#000000' }}
              >
                {displayHeaderText}
              </p>
              <p className={isThermal ? 'text-[10px]' : 'text-xs'}>Số: <span className="font-bold">{order.order_number}</span></p>
              <p className={isThermal ? 'text-[10px]' : 'text-xs'}>Ngày: {new Date(order.created_at).toLocaleString('vi-VN')}</p>
            </div>
            
            {showCustomer && (
              <div className={`${isThermal ? 'text-left' : 'text-right'} space-y-1`}>
                <p className={`${isThermal ? 'text-[10px]' : 'text-xs'} font-bold`}>Khách hàng:</p>
                <p className={`${isThermal ? 'text-xs' : 'text-sm'} font-black`}>{order.customer?.name || "Khách lẻ"}</p>
                {order.customer?.phone && (
                  <p className={isThermal ? 'text-[10px]' : 'text-xs'}>{order.customer.phone}</p>
                )}
                {showCashierName && (
                  <p className="text-[9px] opacity-70">Thu ngân: Admin</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Products Table */}
        <table className="w-full mb-6">
          <thead className="border-y-2 border-black">
            <tr className={`${isThermal ? 'text-[10px]' : 'text-xs'} font-black uppercase text-left`}>
              <th className="py-2">SP</th>
              <th className="py-2 text-center">SL</th>
              {!isOrderTicket && <th className="py-2 text-right">Giá</th>}
              {!isOrderTicket && <th className="py-2 text-right">Tổng</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-black/10">
            {order.items?.map((item, index) => (
              <tr key={index} className={isThermal ? 'text-[10px]' : 'text-sm'}>
                <td className="py-2 font-bold max-w-[120px] truncate">{item.product_name || item.name}</td>
                <td className="py-2 text-center text-lg font-black">{item.quantity}</td>
                {!isOrderTicket && <td className="py-2 text-right font-mono">{formatCurrency(item.unit_price || item.price)}</td>}
                {!isOrderTicket && <td className="py-2 text-right font-black font-mono">{formatCurrency(item.total_price || (item.price * item.quantity))}</td>}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals & Payment */}
        {!isOrderTicket && (
          <div className="space-y-2 border-t-2 border-black pt-4">
            <div className="flex justify-between font-bold">
              <span>Tổng tiền:</span>
              <span 
                className={`${isThermal ? 'text-sm' : 'text-lg'} font-black`}
                style={{ color: !isThermal ? accentColor : '#000000' }}
              >
                {formatCurrency(order.total_amount)}
              </span>
            </div>
            {showPayment && (
              <div className={`flex justify-between ${isThermal ? 'text-[10px]' : 'text-sm'} italic`}>
                <span>Phương thức:</span>
                <span className="uppercase font-bold">
                  {order.payment_method === 'cash' ? 'Tiền mặt' : 
                   order.payment_method === 'transfer' ? 'Chuyển khoản' : 
                   order.payment_method === 'card' ? 'Thẻ' : 
                   order.payment_method === 'Chưa thanh toán' ? 'Chưa thanh toán' :
                   order.payment_method}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Signature Block for Reconciliation */}
        {!isOrderTicket && (
          <div className="flex justify-between mt-6 pt-2 pb-16 px-4 text-center">
            <div>
              <p className={`${isThermal ? 'text-[10px]' : 'text-xs'} font-bold uppercase`}>Khách hàng</p>
              <p className="text-[9px] italic opacity-70">(Ký, ghi rõ họ tên)</p>
            </div>
            <div>
              <p className={`${isThermal ? 'text-[10px]' : 'text-xs'} font-bold uppercase`}>Thu ngân</p>
              <p className="text-[9px] italic opacity-70">(Ký, ghi rõ họ tên)</p>
            </div>
          </div>
        )}

        {/* QR Code & Footer */}
        <div className="mt-8 text-center space-y-4">
          {!isOrderTicket && showQRCode && bankId && accountNo && (
            <div className="flex flex-col items-center justify-center gap-1.5">
              <div className="border border-black/10 p-1 bg-white inline-block">
                <img 
                  src={getQrUrl()} 
                  alt="VietQR Transfer" 
                  className={isThermal ? 'w-24 h-24' : 'w-32 h-32'}
                />
              </div>
              <p className="text-[8px] font-bold opacity-60 uppercase">Quét mã chuyển khoản</p>
            </div>
          )}

          {showFooter && footerText && (
            <p className={`${isThermal ? 'text-[10px]' : 'text-sm'} font-black italic whitespace-pre-line`}>
              {footerText}
            </p>
          )}
          
          <p className="text-[8px] opacity-40">Powered by ZPOS - viz.vn</p>
        </div>
      </div>
    </div>
  );
}
