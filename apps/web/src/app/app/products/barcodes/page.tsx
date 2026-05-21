"use client";

import React, { useState, useEffect } from 'react';
import { posService } from "@/services/pos.service";
import { Loader2, Printer, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { BarcodePrintDialog } from "../_components/barcode-print-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import Link from 'next/link';
import { BarcodeBulkPrintTable } from "../_components/barcode-bulk-print-table";
import { RequirePermission } from "@/components/auth/require-permission";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function BarcodesPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<Record<string, number>>({});
  
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await posService.getProducts();
      setProducts(data || []);
    } catch (error) {
      toast.error("Không thể tải danh sách sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const search = searchTerm.toLowerCase();
    if (product.name.toLowerCase().includes(search)) return true;
    if (product.barcode && product.barcode.toLowerCase().includes(search)) return true;
    if (product.sku && product.sku.toLowerCase().includes(search)) return true;
    
    // Check if any variant matches
    if (product.variants && Array.isArray(product.variants)) {
      return product.variants.some((v: any) => 
        (v.name && v.name.toLowerCase().includes(search)) ||
        (v.barcode && v.barcode.toLowerCase().includes(search)) ||
        (v.sku && v.sku.toLowerCase().includes(search))
      );
    }
    return false;
  });

  const toggleSelect = (product: any) => {
    setSelectedProducts(prev => {
      const next = { ...prev };
      if (next[product.id]) {
        delete next[product.id];
      } else {
        next[product.id] = 1;
      }
      return next;
    });
  };

  const selectedCount = Object.keys(selectedProducts).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl leading-none tracking-tight">Quản lý mã vạch</h1>
          <p className="text-muted-foreground text-sm">Quản lý và in tem mã vạch cho sản phẩm.</p>
        </div>
        <div className="flex flex-wrap items-end justify-end gap-2 lg:w-fit">
          <Button asChild disabled={selectedCount === 0}>
             <Link href={`/app/products/barcodes/print?ids=${Object.keys(selectedProducts).join(',')}`}>
               <Printer className="w-4 h-4 mr-2" />
               In tem hàng loạt ({selectedCount})
             </Link>
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 py-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Tìm theo tên, mã SKU, mã vạch..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="pl-10 h-9"
          />
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
              <tr>
                <th className="p-3 w-12 text-center">
                   <Checkbox 
                      checked={selectedCount > 0 && selectedCount >= filteredProducts.length} // Simplified logic for UI state
                      onCheckedChange={(c) => {
                        if (c) {
                          const all: Record<string, number> = {};
                          filteredProducts.forEach(p => {
                            if (p.variants && p.variants.length > 0) {
                              p.variants.forEach((v: any) => { all[v.id] = 1; });
                            } else {
                              all[p.id] = 1;
                            }
                          });
                          setSelectedProducts(all);
                        } else {
                          setSelectedProducts({});
                        }
                      }}
                   />
                </th>
                <th className="p-3 w-[40%]">Sản phẩm</th>
                <th className="p-3 w-[20%]">Mã SKU</th>
                <th className="p-3 w-[20%]">Mã vạch</th>
                <th className="p-3 w-[20%] text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="h-40 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-2" />
                    Đang tải...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="h-40 text-center text-muted-foreground">
                    Không tìm thấy sản phẩm nào
                  </td>
                </tr>
              ) : (
                filteredProducts.map(product => {
                  const variants = Array.isArray(product.variants) ? product.variants : [];
                  
                  if (variants.length > 0) {
                    return (
                      <tr key={product.id} className="border-b">
                        <td colSpan={5} className="p-0">
                          <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="variants" className="border-none">
                              <AccordionTrigger className="px-3 py-3 hover:no-underline hover:bg-muted/30">
                                <div className="flex items-center gap-3">
                                  <span className="font-bold text-base text-primary">{product.name}</span>
                                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">{variants.length} biến thể</span>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="pb-0 pt-0">
                                <table className="w-full text-sm text-left bg-muted/10">
                                  <tbody>
                                    {variants.map((v: any) => (
                                      <tr key={v.id} className="border-t border-dashed hover:bg-muted/40 transition-colors">
                                        <td className="p-3 w-12 text-center pl-6">
                                          <Checkbox 
                                            checked={!!selectedProducts[v.id]}
                                            onCheckedChange={() => toggleSelect(v)}
                                          />
                                        </td>
                                        <td className="p-3 w-[40%] font-medium text-muted-foreground flex items-center gap-2">
                                          <div className="w-1.5 h-1.5 rounded-full bg-primary/40"></div>
                                          {v.name}
                                        </td>
                                        <td className="p-3 w-[20%] text-muted-foreground font-mono text-xs">{v.sku || '-'}</td>
                                        <td className="p-3 w-[20%]">
                                          {v.barcode ? (
                                            <span className="font-mono bg-white px-2 py-1 rounded border shadow-sm text-xs">{v.barcode}</span>
                                          ) : (
                                            <span className="text-rose-500 italic text-[11px]">Chưa có mã vạch</span>
                                          )}
                                        </td>
                                        <td className="p-3 w-[20%] text-right">
                                          {v.barcode && (
                                            <RequirePermission requiredPermission="products.barcode.print">
                                              <BarcodePrintDialog 
                                                productName={`${product.name} - ${v.name}`}
                                                sku={v.sku}
                                                barcode={v.barcode}
                                                barcodeType={v.barcode_type || 'CODE128'}
                                                price={v.price || product.price}
                                              />
                                            </RequirePermission>
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={product.id} className="border-b hover:bg-muted/30">
                      <td className="p-3 text-center w-12">
                        <Checkbox 
                           checked={!!selectedProducts[product.id]}
                           onCheckedChange={() => toggleSelect(product)}
                        />
                      </td>
                      <td className="p-3 font-medium w-[40%]">{product.name}</td>
                      <td className="p-3 text-muted-foreground font-mono text-xs w-[20%]">{product.sku || '-'}</td>
                      <td className="p-3 w-[20%]">
                        {product.barcode ? (
                          <span className="font-mono bg-muted px-2 py-1 rounded text-xs">{product.barcode}</span>
                        ) : (
                          <span className="text-rose-500 italic text-[11px]">Chưa có mã vạch</span>
                        )}
                      </td>
                      <td className="p-3 text-right w-[20%]">
                        {product.barcode && (
                          <RequirePermission requiredPermission="products.barcode.print">
                            <BarcodePrintDialog 
                              productName={product.name}
                              sku={product.sku}
                              barcode={product.barcode}
                              barcodeType={product.barcode_type || 'CODE128'}
                              price={product.price}
                            />
                          </RequirePermission>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
