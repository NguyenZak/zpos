"use client";

import type { Shift, ShiftTransaction } from "@/services/shift.service";
import { fmtVND, fmtDate, fmtDuration } from "./format";

interface ShiftZReportProps {
  shift: Shift;
  transactions: ShiftTransaction[];
}

export function ShiftZReport({ shift, transactions }: ShiftZReportProps) {
  const diff = Number(shift.cash_difference || 0);
  const expected = Number(shift.expected_cash_amount || 0);
  const counted = Number(shift.counted_cash_amount || 0);

  const cashInTxs = transactions.filter(t => t.type === 'cash_in');
  const cashOutTxs = transactions.filter(t => t.type === 'cash_out');
  const expenseTxs = transactions.filter(t => t.type === 'expense');

  return (
    <div className="hidden print:block font-mono text-sm leading-tight p-4 mx-auto max-w-sm">
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold uppercase">Kết Toán Ca</h2>
        <p className="mt-1">Chi nhánh: {shift.branch?.name || "—"}</p>
        <p>Thu ngân: {shift.cashier?.full_name || shift.cashier?.email || "—"}</p>
        <p>Mã ca: #{shift.id.slice(0, 8)}</p>
        <p>Mở lúc: {fmtDate(shift.opened_at)}</p>
        {shift.closed_at && <p>Đóng lúc: {fmtDate(shift.closed_at)}</p>}
      </div>

      <div className="border-t border-dashed border-black py-2 mb-2">
        <div className="flex justify-between">
          <span>Tiền mặt đầu ca:</span>
          <span>{fmtVND(shift.opening_cash_amount)}</span>
        </div>
      </div>

      <div className="border-t border-dashed border-black py-2 mb-2 space-y-1">
        <div className="flex justify-between font-bold">
          <span>TỔNG DOANH THU:</span>
          <span>{fmtVND(shift.total_sales_amount)}</span>
        </div>
        <div className="flex justify-between">
          <span>- Tiền mặt:</span>
          <span>{fmtVND(shift.cash_sales_amount)}</span>
        </div>
        <div className="flex justify-between">
          <span>- Chuyển khoản/QR:</span>
          <span>{fmtVND(Number(shift.bank_transfer_amount) + Number(shift.vietqr_amount))}</span>
        </div>
        <div className="flex justify-between">
          <span>- Quẹt thẻ/MoMo/Khác:</span>
          <span>{fmtVND(Number(shift.card_amount) + Number(shift.momo_amount) + Number(shift.zalopay_amount) + Number(shift.debt_amount))}</span>
        </div>
      </div>

      {(cashInTxs.length > 0 || cashOutTxs.length > 0 || expenseTxs.length > 0) && (
        <div className="border-t border-dashed border-black py-2 mb-2 space-y-1">
          <p className="font-bold">GIAO DỊCH TRONG CA:</p>
          {cashInTxs.length > 0 && (
            <div className="flex justify-between">
              <span>+ Nộp tiền (Cash In):</span>
              <span>{fmtVND(cashInTxs.reduce((sum, t) => sum + Number(t.amount), 0))}</span>
            </div>
          )}
          {cashOutTxs.length > 0 && (
            <div className="flex justify-between">
              <span>- Rút tiền (Cash Out):</span>
              <span>{fmtVND(cashOutTxs.reduce((sum, t) => sum + Number(t.amount), 0))}</span>
            </div>
          )}
          {expenseTxs.length > 0 && (
            <div className="flex justify-between">
              <span>- Chi phí (Expense):</span>
              <span>{fmtVND(expenseTxs.reduce((sum, t) => sum + Number(t.amount), 0))}</span>
            </div>
          )}
        </div>
      )}

      <div className="border-t border-dashed border-black py-2 mb-4 space-y-1">
        <div className="flex justify-between font-bold">
          <span>TIỀN MẶT HỆ THỐNG:</span>
          <span>{fmtVND(expected)}</span>
        </div>
        <div className="flex justify-between font-bold">
          <span>TIỀN MẶT THỰC TẾ:</span>
          <span>{fmtVND(counted)}</span>
        </div>
        <div className="flex justify-between font-bold">
          <span>CHÊNH LỆCH:</span>
          <span>{diff === 0 ? "0" : diff > 0 ? "+" + fmtVND(diff) : "-" + fmtVND(Math.abs(diff))}</span>
        </div>
      </div>

      <div className="flex justify-between mt-8 pt-4">
        <div className="text-center">
          <p>Người lập phiếu</p>
          <p className="text-xs mt-10">(Ký & ghi rõ họ tên)</p>
        </div>
        <div className="text-center">
          <p>Người nhận/Quản lý</p>
          <p className="text-xs mt-10">(Ký & ghi rõ họ tên)</p>
        </div>
      </div>
      
      {shift.note && (
        <div className="mt-8 border-t border-dashed border-black pt-2">
          <p className="font-bold uppercase">Ghi chú bàn giao:</p>
          <p className="mt-1">{shift.note}</p>
        </div>
      )}
    </div>
  );
}
