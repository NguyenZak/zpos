import React, { useRef, useState, useEffect } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BarcodeLabelPreview } from './barcode-label-preview';
import { toast } from 'sonner';

interface Variant {
  id: string;
  name: string;
  sku?: string;
  barcode?: string;
  barcode_type?: string;
  price?: number;
}

interface BarcodePrintDialogProps {
  productName: string;
  sku?: string;
  barcode?: string;
  barcodeType?: string;
  price?: number;
  storeLogo?: string;
  variants?: Variant[];
}

export function BarcodePrintDialog({
  productName,
  sku,
  barcode,
  barcodeType = 'CODE128',
  price,
  storeLogo,
  variants = []
}: BarcodePrintDialogProps) {
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const componentRef = useRef<HTMLDivElement>(null);
  
  const hasVariants = variants && variants.length > 0;
  
  const [selectedVariants, setSelectedVariants] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (open && hasVariants) {
      const initialSelection: Record<string, boolean> = {};
      variants.forEach(v => {
        initialSelection[v.id] = !!v.barcode;
      });
      setSelectedVariants(initialSelection);
    }
  }, [open, variants, hasVariants]);

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
    if (hasVariants) {
      const selectedCount = variants.filter(v => selectedVariants[v.id] && v.barcode).length;
      if (selectedCount === 0) {
        toast.error('Vui lòng chọn ít nhất một biến thể có mã vạch!');
        return;
      }
    } else {
      if (!barcode) {
        toast.error('Sản phẩm chưa có mã vạch!');
        return;
      }
    }
    print();
  };

  const decreaseQuantity = () => setQuantity(prev => Math.max(1, prev - 1));
  const increaseQuantity = () => setQuantity(prev => Math.min(1000, prev + 1));

  const handleSelectAll = (checked: boolean) => {
    const newSelection: Record<string, boolean> = {};
    variants.forEach(v => {
      if (checked) {
        newSelection[v.id] = !!v.barcode;
      } else {
        newSelection[v.id] = false;
      }
    });
    setSelectedVariants(newSelection);
  };

  const validVariants = variants.filter(v => v.barcode);
  const isAllSelected = validVariants.length > 0 && validVariants.every(v => selectedVariants[v.id]);
  const totalLabels = hasVariants 
    ? variants.filter(v => selectedVariants[v.id] && v.barcode).length * quantity
    : quantity;

  // Determine which barcode to preview
  const previewVariant = hasVariants ? variants.find(v => selectedVariants[v.id] && v.barcode) || validVariants[0] : null;

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
                 sku={hasVariants ? previewVariant?.sku : sku}
                 barcode={hasVariants ? (previewVariant?.barcode || '123456789') : (barcode || '123456789')}
                 barcodeType={hasVariants ? previewVariant?.barcode_type || 'CODE128' : barcodeType}
                 price={hasVariants ? previewVariant?.price : price}
                 variantName={hasVariants ? previewVariant?.name : undefined}
                 storeLogo={storeLogo}
               />
            </div>
          </div>

          {hasVariants && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label>Chọn biến thể cần in</Label>
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="select-all" 
                    checked={isAllSelected}
                    onCheckedChange={(checked) => handleSelectAll(!!checked)}
                  />
                  <label htmlFor="select-all" className="text-sm cursor-pointer font-medium">Chọn tất cả</label>
                </div>
              </div>
              <ScrollArea className="h-[150px] border rounded-md p-3 bg-muted/20">
                <div className="flex flex-col gap-3">
                  {variants.map(v => (
                    <div key={v.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`variant-${v.id}`} 
                        checked={!!selectedVariants[v.id]}
                        disabled={!v.barcode}
                        onCheckedChange={(checked) => setSelectedVariants(prev => ({ ...prev, [v.id]: !!checked }))}
                      />
                      <label 
                        htmlFor={`variant-${v.id}`} 
                        className={`text-sm font-medium leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${!v.barcode ? 'text-muted-foreground' : ''}`}
                      >
                        {v.name} {v.barcode ? <span className="font-mono text-xs text-muted-foreground ml-1">({v.barcode})</span> : <span className="text-xs text-rose-500 italic ml-1">(Chưa có mã)</span>}
                      </label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label>Số lượng tem {hasVariants ? 'mỗi biến thể' : 'cần in'}</Label>
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
            {hasVariants ? (
              variants.filter(v => selectedVariants[v.id] && v.barcode).flatMap(v => 
                Array.from({ length: quantity }).map((_, index) => (
                  <BarcodeLabelPreview
                    key={`${v.id}-${index}`}
                    productName={productName}
                    variantName={v.name}
                    sku={v.sku}
                    barcode={v.barcode!}
                    barcodeType={v.barcode_type || 'CODE128'}
                    price={v.price}
                    storeLogo={storeLogo}
                  />
                ))
              )
            ) : (
              Array.from({ length: quantity }).map((_, index) => (
                <BarcodeLabelPreview
                  key={index}
                  productName={productName}
                  sku={sku}
                  barcode={barcode!}
                  barcodeType={barcodeType}
                  price={price}
                  storeLogo={storeLogo}
                />
              ))
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
          <Button onClick={handlePrint} disabled={totalLabels === 0 || (!hasVariants && !barcode)}>
            <Printer className="w-4 h-4 mr-2" />
            In {totalLabels} tem
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
