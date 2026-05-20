import React, { useRef, useState } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Printer, Minus, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BarcodeLabelPreview } from './barcode-label-preview';
import { toast } from 'sonner';

interface BarcodePrintDialogProps {
  productName: string;
  sku?: string;
  barcode: string;
  barcodeType?: string;
  price?: number;
  storeLogo?: string;
}

export function BarcodePrintDialog({
  productName,
  sku,
  barcode,
  barcodeType = 'CODE128',
  price,
  storeLogo
}: BarcodePrintDialogProps) {
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const componentRef = useRef<HTMLDivElement>(null);

  const print = useReactToPrint({
    contentRef: componentRef,
    pageStyle: `
      @page {
        size: 50mm 30mm;
        margin: 0;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
        }
      }
    `,
  });

  const handlePrint = () => {
    if (!barcode) {
      toast.error('Sản phẩm chưa có mã vạch!');
      return;
    }
    print();
  };

  const decreaseQuantity = () => setQuantity(prev => Math.max(1, prev - 1));
  const increaseQuantity = () => setQuantity(prev => Math.min(1000, prev + 1));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" title="In mã vạch">
          <Printer className="w-4 h-4 mr-2" />
          In tem
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>In tem mã vạch</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-6 py-4">
          <div className="flex justify-center">
            <div className="border border-dashed border-gray-300 p-4 rounded-xl bg-gray-50 flex items-center justify-center">
               <BarcodeLabelPreview
                 productName={productName}
                 sku={sku}
                 barcode={barcode}
                 barcodeType={barcodeType}
                 price={price}
                 storeLogo={storeLogo}
               />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Số lượng tem cần in</Label>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={decreaseQuantity}>
                <Minus className="w-4 h-4" />
              </Button>
              <Input 
                type="number" 
                value={quantity} 
                onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="text-center font-bold"
              />
              <Button variant="outline" size="icon" onClick={increaseQuantity}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Hidden area for print with repeated items */}
        <div style={{ display: 'none' }}>
          <div ref={componentRef} className="print-container">
            {Array.from({ length: quantity }).map((_, index) => (
              <BarcodeLabelPreview
                key={index}
                productName={productName}
                sku={sku}
                barcode={barcode}
                barcodeType={barcodeType}
                price={price}
                storeLogo={storeLogo}
              />
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
          <Button onClick={handlePrint} disabled={!barcode}>
            <Printer className="w-4 h-4 mr-2" />
            In {quantity} tem
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
