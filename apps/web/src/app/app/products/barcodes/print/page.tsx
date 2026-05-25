"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { posService } from "@/services/pos.service";
import { Loader2, Printer, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { BarcodeLabelPreview } from "../../_components/barcode-label-preview";
import { useReactToPrint } from "react-to-print";
import { BarcodeBulkPrintTable } from "../../_components/barcode-bulk-print-table";

export default function BulkPrintBarcodesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const idsParam = searchParams.get("ids");

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // quantity state per product ID
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const componentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (idsParam) {
      loadProducts(idsParam.split(","));
    } else {
      setLoading(false);
    }
  }, [idsParam]);

  const loadProducts = async (ids: string[]) => {
    setLoading(true);
    try {
      // In a real scenario we could fetch just these IDs.
      // For now we fetch all and filter to keep it simple, or write a new posService method
      const data = await posService.getProducts();

      const allItems: any[] = [];
      data.forEach((p: any) => {
        const variants = Array.isArray(p.variants) ? p.variants : [];
        if (variants.length > 0) {
          variants.forEach((v: any) => {
            allItems.push({
              id: v.id,
              product_id: p.id,
              name: `${p.name} - ${v.name}`,
              sku: v.sku || "",
              barcode: v.barcode || "",
              barcode_type: v.barcode_type || "CODE128",
              price: v.price || p.price,
            });
          });
        } else {
          allItems.push({
            id: p.id,
            product_id: p.id,
            name: p.name,
            sku: p.sku || "",
            barcode: p.barcode || "",
            barcode_type: p.barcode_type || "CODE128",
            price: p.price,
          });
        }
      });

      const filtered = allItems.filter((item: any) => ids.includes(item.id) && item.barcode);
      setProducts(filtered);

      const initialQtys: Record<string, number> = {};
      filtered.forEach((item: any) => {
        initialQtys[item.id] = 1;
      });
      setQuantities(initialQtys);
    } catch (error) {
      toast.error("Không thể tải thông tin sản phẩm");
    } finally {
      setLoading(false);
    }
  };

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
    if (products.length === 0) {
      toast.error("Không có sản phẩm nào để in");
      return;
    }
    print();
  };

  const totalLabels = Object.values(quantities).reduce((sum, q) => sum + (q || 0), 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl leading-none tracking-tight">In tem mã vạch hàng loạt</h1>
          <p className="text-muted-foreground text-sm">Tùy chỉnh số lượng tem cho từng sản phẩm.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : products.length === 0 ? (
        <div className="text-center p-12 border rounded-xl bg-card">
          <p className="text-muted-foreground">
            Không có sản phẩm hợp lệ nào được chọn (chỉ sản phẩm đã có mã vạch mới in được).
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-md border bg-card p-4">
            <BarcodeBulkPrintTable
              products={products}
              quantities={quantities}
              onChangeQuantity={(id, q) => setQuantities((prev) => ({ ...prev, [id]: q }))}
            />
          </div>

          <div className="rounded-md border bg-card p-4 flex flex-col gap-4">
            <h3 className="font-semibold text-lg">Tổng kết</h3>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Số mẫu sản phẩm</span>
              <span className="font-bold">{products.length}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Tổng số tem in</span>
              <span className="font-bold text-xl text-primary">{totalLabels}</span>
            </div>

            <Button className="w-full mt-4" size="lg" onClick={handlePrint} disabled={totalLabels === 0}>
              <Printer className="w-5 h-5 mr-2" />
              Tiến hành in
            </Button>
          </div>
        </div>
      )}

      {/* Hidden printing area */}
      <div style={{ display: "none" }}>
        <div ref={componentRef} className="print-container">
          {products.map((product) => {
            const qty = quantities[product.id] || 0;
            return Array.from({ length: qty }).map((_, index) => (
              <BarcodeLabelPreview
                key={`${product.id}-${index}`}
                productName={product.name}
                sku={product.sku}
                barcode={product.barcode}
                barcodeType={product.barcode_type}
                price={product.price}
              />
            ));
          })}
        </div>
      </div>
    </div>
  );
}
