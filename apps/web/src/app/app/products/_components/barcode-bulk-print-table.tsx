import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2 } from "lucide-react";

interface BarcodeBulkPrintTableProps {
  products: any[];
  quantities: Record<string, number>;
  onChangeQuantity: (productId: string, quantity: number) => void;
}

export function BarcodeBulkPrintTable({ products, quantities, onChangeQuantity }: BarcodeBulkPrintTableProps) {
  
  const updateQty = (id: string, delta: number) => {
    const current = quantities[id] || 0;
    const next = Math.max(0, current + delta);
    onChangeQuantity(id, next);
  };

  const handleInputChange = (id: string, value: string) => {
    const parsed = parseInt(value);
    if (!isNaN(parsed)) {
      onChangeQuantity(id, Math.max(0, parsed));
    }
  };

  return (
    <div className="w-full">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
          <tr>
            <th className="p-3 w-10 text-center">#</th>
            <th className="p-3">Sản phẩm</th>
            <th className="p-3">Mã vạch</th>
            <th className="p-3 text-center">Số lượng tem</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product, index) => {
            const qty = quantities[product.id] || 0;
            return (
              <tr key={product.id} className="border-b hover:bg-muted/30">
                <td className="p-3 text-center">{index + 1}</td>
                <td className="p-3">
                  <div className="font-medium">{product.name}</div>
                  <div className="text-xs text-muted-foreground">{product.sku}</div>
                </td>
                <td className="p-3">
                  <span className="font-mono bg-muted px-2 py-1 rounded text-xs">{product.barcode}</span>
                </td>
                <td className="p-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    {qty === 0 ? (
                      <Button variant="ghost" size="icon-sm" className="text-destructive w-8 h-8" onClick={() => updateQty(product.id, 1)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    ) : (
                      <Button variant="outline" size="icon-sm" className="w-8 h-8" onClick={() => updateQty(product.id, -1)}>
                        <Minus className="w-3 h-3" />
                      </Button>
                    )}
                    
                    <Input 
                      className="w-16 h-8 text-center" 
                      value={qty.toString()}
                      onChange={(e) => handleInputChange(product.id, e.target.value)}
                    />
                    
                    <Button variant="outline" size="icon-sm" className="w-8 h-8" onClick={() => updateQty(product.id, 1)}>
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
