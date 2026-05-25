import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Settings, Receipt, Utensils, Beer } from "lucide-react";
import { printService, PrintType } from "@/services/print.service";
import { toast } from "sonner";

interface PrintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  enableProvisionalPrint?: boolean;
  enableKitchenPrint?: boolean;
  enableBarPrint?: boolean;
  enableFinalPrint?: boolean;
  orderInfo: {
    orderId: string | number;
    cart: any[];
    subtotal: number;
    discount: number;
    total: number;
    customer: any;
  };
  onPrintPreview: (type: PrintType) => void;
}

export function PrintDialog({
  open,
  onOpenChange,
  enableProvisionalPrint = true,
  enableKitchenPrint = true,
  enableBarPrint = true,
  enableFinalPrint = true,
  orderInfo,
  onPrintPreview,
}: PrintDialogProps) {
  const [isPrinting, setIsPrinting] = useState(false);

  // In a real scenario, this could come from a physical printer API or settings.
  // For browser printing, we just use window.print() after rendering the preview.
  const handlePrint = async (type: PrintType) => {
    setIsPrinting(true);
    try {
      // Set preview state first
      onPrintPreview(type);

      // Wait for React to render the PrintInvoice with the new type
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Trigger browser print
      window.print();

      // Log to database
      const orderIdStr = orderInfo.orderId.toString().startsWith("ORD-")
        ? orderInfo.orderId.toString()
        : `ORD-${orderInfo.orderId}`;

      // Just fire and forget logging
      printService
        .logPrint({
          orderId: orderIdStr,
          type: type,
        })
        .catch(console.warn);

      toast.success("Đã gửi lệnh in!");
      onOpenChange(false);
    } catch (e) {
      console.error(e);
      toast.error("Có lỗi xảy ra khi in");
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Printer className="w-5 h-5 text-primary" />
            Tùy chọn in ấn
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          {enableProvisionalPrint && (
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center gap-2 border-primary/20 hover:bg-primary/5 hover:border-primary"
              onClick={() => handlePrint("temp_bill")}
              disabled={isPrinting}
            >
              <Receipt className="w-8 h-8 text-primary" />
              <span className="font-bold">In Tạm Tính</span>
            </Button>
          )}

          {enableKitchenPrint && (
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center gap-2 border-emerald-500/20 hover:bg-emerald-500/5 hover:border-emerald-500"
              onClick={() => handlePrint("kitchen_ticket")}
              disabled={isPrinting}
            >
              <Utensils className="w-8 h-8 text-emerald-600" />
              <span className="font-bold">In Bếp</span>
            </Button>
          )}

          {enableBarPrint && (
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center gap-2 border-amber-500/20 hover:bg-amber-500/5 hover:border-amber-500"
              onClick={() => handlePrint("bar_ticket")}
              disabled={isPrinting}
            >
              <Beer className="w-8 h-8 text-amber-600" />
              <span className="font-bold">In Bar</span>
            </Button>
          )}

          {enableFinalPrint && (
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center gap-2 border-blue-500/20 hover:bg-blue-500/5 hover:border-blue-500"
              onClick={() => handlePrint("final_receipt")}
              disabled={isPrinting}
            >
              <Printer className="w-8 h-8 text-blue-600" />
              <span className="font-bold">In Hóa Đơn Cuối</span>
            </Button>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between border-t pt-4">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground"
            onClick={() => window.open("/app/settings", "_blank")}
          >
            <Settings className="w-4 h-4" />
            Cài đặt máy in
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
