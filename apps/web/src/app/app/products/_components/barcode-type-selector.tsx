import React from 'react';
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const BARCODE_TYPES = [
  { value: "CODE128", label: "CODE128 (Khuyên dùng)" },
  { value: "EAN13", label: "EAN-13 (13 số)" },
  { value: "EAN8", label: "EAN-8 (8 số)" },
  { value: "UPC", label: "UPC-A (12 số)" },
  { value: "QR_CODE", label: "QR Code" }
];

interface BarcodeTypeSelectorProps {
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function BarcodeTypeSelector({ value = "CODE128", onChange, disabled }: BarcodeTypeSelectorProps) {
  return (
    <div className="grid gap-2">
      <Label>Loại mã vạch</Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger>
          <SelectValue placeholder="Chọn loại mã vạch" />
        </SelectTrigger>
        <SelectContent>
          {BARCODE_TYPES.map((type) => (
            <SelectItem key={type.value} value={type.value}>
              {type.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
