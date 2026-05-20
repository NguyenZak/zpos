import React from 'react';
import { BarcodeScannerDialog } from "@/components/barcode-scanner-dialog";

export function BarcodeCameraSheet({ 
  open, 
  onOpenChange, 
  onScan 
}: { 
  open: boolean, 
  onOpenChange: (open: boolean) => void, 
  onScan: (code: string) => void 
}) {
  return (
    <BarcodeScannerDialog 
      open={open}
      onOpenChange={onOpenChange}
      onRawScan={(code) => {
        onScan(code);
      }}
    />
  );
}
