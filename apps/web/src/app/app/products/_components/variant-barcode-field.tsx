import React from 'react';
import { ProductBarcodeField } from "./product-barcode-field";

interface VariantBarcodeFieldProps {
  value: string;
  onChange: (val: string) => void;
  originalBarcode?: string;
  onValidationChange?: (isValid: boolean) => void;
}

export function VariantBarcodeField(props: VariantBarcodeFieldProps) {
  return (
    <ProductBarcodeField 
      {...props}
      label="Mã Barcode (Phiên bản)"
      placeholder="Mã vạch riêng của phiên bản..."
    />
  );
}
