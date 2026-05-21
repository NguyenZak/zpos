import { useEffect, useState } from "react";

import { AlertCircle, Barcode, CheckCircle2, Loader2 } from "lucide-react";

import { RequirePermission } from "@/components/auth/require-permission";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { permissionService } from "@/services/permission.service";
import { posService } from "@/services/pos.service";

import { BarcodeCameraSheet } from "./barcode-camera-sheet";
import { BarcodeTypeSelector } from "./barcode-type-selector";
import { GenerateBarcodeButton } from "./generate-barcode-button";

interface ProductBarcodeFieldProps {
  value: string;
  onChange: (val: string) => void;
  label?: string;
  placeholder?: string;
  originalBarcode?: string;
  onValidationChange?: (isValid: boolean) => void;
  disabled?: boolean;
  barcodeType?: string;
  onBarcodeTypeChange?: (val: string) => void;
}

export function ProductBarcodeField({
  value,
  onChange,
  label = "Mã Barcode",
  placeholder = "Nhập hoặc quét mã vạch...",
  originalBarcode,
  onValidationChange,
  disabled = false,
  barcodeType = "CODE128",
  onBarcodeTypeChange,
}: ProductBarcodeFieldProps) {
  const [scannerOpen, setScannerOpen] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!value) {
      setError(null);
      setSuccess(false);
      onValidationChange?.(true); // Empty is valid
      return;
    }

    if (value === originalBarcode) {
      setError(null);
      setSuccess(true);
      onValidationChange?.(true);
      return;
    }

    const validateBarcode = async () => {
      setValidating(true);
      setError(null);
      setSuccess(false);
      try {
        const orgId = await permissionService.getActiveOrgId();
        const exists = await posService.checkBarcodeExists(value, orgId);
        if (exists) {
          setError("Mã vạch đã tồn tại trong tổ chức!");
          onValidationChange?.(false);
        } else {
          setSuccess(true);
          onValidationChange?.(true);
        }
      } catch (_err: any) {
        setError("Lỗi kiểm tra mã vạch");
        onValidationChange?.(false);
      } finally {
        setValidating(false);
      }
    };

    const timeoutId = setTimeout(validateBarcode, 500);
    return () => clearTimeout(timeoutId);
  }, [value, originalBarcode, onValidationChange]);

  return (
    <div className="grid gap-4">
      {onBarcodeTypeChange && (
        <BarcodeTypeSelector value={barcodeType} onChange={onBarcodeTypeChange} disabled={disabled} />
      )}
      <div className="grid gap-2">
        <Label>{label}</Label>
        <div className="relative flex gap-2">
          <div className="relative flex-1">
            <Input
              placeholder={placeholder}
              className={`pr-8 uppercase ${error ? "border-destructive focus-visible:ring-destructive" : ""} ${success ? "border-green-500 focus-visible:ring-green-500" : ""}`}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              disabled={disabled}
            />
            <div className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center">
              {validating && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              {!validating && error && <AlertCircle className="h-4 w-4 text-destructive" />}
              {!validating && success && <CheckCircle2 className="h-4 w-4 text-green-500" />}
            </div>
          </div>
          {!disabled && (
            <>
              <RequirePermission requiredPermission="products.barcode.scan">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 shrink-0 border-purple-500/10 bg-purple-500/5 text-purple-500 hover:bg-purple-500/15"
                  onClick={() => setScannerOpen(true)}
                  title="Quét mã vạch bằng camera"
                >
                  <Barcode className="h-4 w-4" />
                </Button>
              </RequirePermission>
              <RequirePermission requiredPermission="products.barcode.generate">
                <GenerateBarcodeButton onGenerate={onChange} barcodeType={barcodeType} />
              </RequirePermission>
            </>
          )}
        </div>
        {error && <span className="font-medium text-destructive text-xs">{error}</span>}
        {!error && success && value && <span className="font-medium text-green-500 text-xs">Mã vạch hợp lệ</span>}

        <BarcodeCameraSheet open={scannerOpen} onOpenChange={setScannerOpen} onScan={onChange} />
      </div>
    </div>
  );
}
