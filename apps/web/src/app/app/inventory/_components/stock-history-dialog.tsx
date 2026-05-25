"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, History, Package, ArrowUpRight, ArrowDownRight, User2, Clock, FileText, Ghost } from "lucide-react";
import { InventoryItem } from "../page";
import { createClient } from "@/utils/supabase/client";

interface StockHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem | null;
}

export function StockHistoryDialog({ open, onOpenChange, item }: StockHistoryDialogProps) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (open && item) {
      loadHistory();
    }
  }, [open, item]);

  const loadHistory = async () => {
    if (!item) return;
    setLoading(true);
    setErrorMsg("");
    setHistory([]);
    try {
      const supabase = createClient();

      let query = supabase
        .from("inventory_transactions")
        .select("*, created_by:profiles(full_name, email)")
        .order("created_at", { ascending: false })
        .limit(50);

      if (item.is_variant) {
        query = query.eq("variant_id", item.id);
      } else {
        query = query.eq("product_id", item.id).is("variant_id", null);
      }

      const { data, error } = await query;

      if (error) {
        if (error.code === "42P01") {
          throw new Error("Bảng inventory_transactions chưa được tạo. Vui lòng chạy file migration trong database.");
        }
        throw error;
      }
      setHistory(data || []);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Không thể tải thẻ kho.");
    } finally {
      setLoading(false);
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case "SALE":
        return (
          <Badge
            variant="secondary"
            className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-none font-semibold"
          >
            Bán hàng
          </Badge>
        );
      case "IMPORT":
        return (
          <Badge
            variant="secondary"
            className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-none font-semibold"
          >
            Nhập hàng
          </Badge>
        );
      case "ADJUSTMENT":
        return (
          <Badge
            variant="secondary"
            className="bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 border-none font-semibold"
          >
            Điều chỉnh
          </Badge>
        );
      case "LOSS":
        return (
          <Badge
            variant="secondary"
            className="bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 border-none font-semibold"
          >
            Báo hỏng
          </Badge>
        );
      case "RETURN":
        return (
          <Badge
            variant="secondary"
            className="bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 border-none font-semibold"
          >
            Khách trả
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="font-semibold">
            {type}
          </Badge>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] w-[95vw] p-0 overflow-hidden bg-white/95 backdrop-blur-xl border-pebble/50 shadow-2xl rounded-2xl">
        <div className="bg-gradient-to-br from-mist/50 via-white to-transparent p-5 border-b border-pebble/30">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shadow-sm shrink-0">
                <History className="w-6 h-6" />
              </div>
              <div className="flex flex-col gap-1 text-left">
                <span className="text-2xl font-bold tracking-tight text-ink">Lịch sử thẻ kho</span>
                <span className="text-sm font-semibold text-ash flex items-center gap-1.5">
                  <Package className="w-4 h-4" /> {item?.name}
                </span>
              </div>
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="p-5 bg-mist/10">
          {errorMsg ? (
            <div className="p-5 bg-rose-50 text-rose-800 rounded-xl border border-rose-100 flex items-start gap-3 shadow-sm">
              <div className="p-2 bg-rose-100 rounded-lg text-rose-600 shrink-0">
                <History className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-rose-900 mb-1">Cần đồng bộ cơ sở dữ liệu</p>
                <p className="text-sm leading-relaxed">{errorMsg}</p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-pebble/60 bg-white shadow-sm overflow-hidden ring-1 ring-black/5 flex flex-col">
              <div className="max-h-[55vh] overflow-x-auto overflow-y-auto custom-scrollbar w-full">
                <Table className="w-full min-w-[700px]">
                  <TableHeader className="bg-mist/40 backdrop-blur-md sticky top-0 z-10 shadow-sm">
                    <TableRow className="border-b border-pebble/50 hover:bg-transparent">
                      <TableHead className="font-bold text-obsidian uppercase text-[10px] tracking-widest h-12">
                        Thời gian
                      </TableHead>
                      <TableHead className="font-bold text-obsidian uppercase text-[10px] tracking-widest h-12">
                        Loại giao dịch
                      </TableHead>
                      <TableHead className="font-bold text-obsidian uppercase text-[10px] tracking-widest h-12 text-right">
                        Biến động
                      </TableHead>
                      <TableHead className="font-bold text-obsidian uppercase text-[10px] tracking-widest h-12 text-right">
                        Tồn sau
                      </TableHead>
                      <TableHead className="font-bold text-obsidian uppercase text-[10px] tracking-widest h-12">
                        Người thực hiện
                      </TableHead>
                      <TableHead className="font-bold text-obsidian uppercase text-[10px] tracking-widest h-12">
                        Ghi chú
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-40 text-center">
                          <div className="flex flex-col items-center justify-center gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            <span className="text-sm font-bold text-ash">Đang tải lịch sử...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : history.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-40 text-center">
                          <div className="flex flex-col items-center justify-center gap-3 text-ash">
                            <div className="w-12 h-12 rounded-full bg-mist flex items-center justify-center">
                              <Ghost className="w-6 h-6 opacity-50" />
                            </div>
                            <span className="text-sm font-bold opacity-70">Chưa có giao dịch nào được ghi nhận.</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      history.map((tx) => (
                        <TableRow key={tx.id} className="hover:bg-mist/20 transition-colors border-pebble/40 group">
                          <TableCell className="whitespace-nowrap">
                            <div className="flex items-center gap-2 text-ink font-semibold text-sm">
                              <Clock className="w-3.5 h-3.5 text-ash" />
                              {new Date(tx.created_at).toLocaleString("vi-VN")}
                            </div>
                          </TableCell>
                          <TableCell>{getTransactionTypeLabel(tx.transaction_type)}</TableCell>
                          <TableCell className="text-right">
                            <div
                              className={`inline-flex items-center justify-end gap-1 font-bold ${tx.quantity > 0 ? "text-emerald-600" : "text-rose-600"}`}
                            >
                              {tx.quantity > 0 ? (
                                <ArrowUpRight className="w-4 h-4" />
                              ) : (
                                <ArrowDownRight className="w-4 h-4" />
                              )}
                              {Math.abs(tx.quantity)}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-black text-ink text-base">{tx.new_stock}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3 text-ink">
                              <div className="w-8 h-8 rounded-full bg-mist flex items-center justify-center shrink-0">
                                <User2 className="w-4 h-4 text-ash" />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-semibold text-sm">{tx.created_by?.full_name || "Hệ thống"}</span>
                                {tx.created_by?.email && (
                                  <span className="text-[11px] text-ash tracking-wide">{tx.created_by.email}</span>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[200px]">
                            <div
                              className="flex items-center gap-2 text-ash group-hover:text-ink transition-colors"
                              title={tx.notes}
                            >
                              <FileText className="w-3.5 h-3.5 shrink-0 opacity-50" />
                              <span className="truncate text-sm font-medium">{tx.notes || "-"}</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
