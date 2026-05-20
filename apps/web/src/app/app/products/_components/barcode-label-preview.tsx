import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';

interface BarcodeLabelPreviewProps {
  productName: string;
  sku?: string;
  barcode: string;
  barcodeType: string;
  price?: number;
  variantName?: string;
  storeLogo?: string;
  width?: number; // width of label in mm, e.g., 35 for 35x22, 50 for 50x30
  height?: number; // height of label in mm
}

export const BarcodeLabelPreview = React.forwardRef<HTMLDivElement, BarcodeLabelPreviewProps>(({
  productName,
  sku,
  barcode,
  barcodeType = 'CODE128',
  price,
  variantName,
  storeLogo,
  width = 50,
  height = 30
}, ref) => {
  const barcodeRef = useRef<SVGSVGElement>(null);
  const qrcodeRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!barcode) return;

    try {
      if (barcodeType === 'QR_CODE') {
        if (qrcodeRef.current) {
          QRCode.toCanvas(qrcodeRef.current, barcode, {
            width: 80,
            margin: 0,
            color: {
              dark: '#000000',
              light: '#ffffff'
            }
          });
        }
      } else {
        if (barcodeRef.current) {
          // Normalize type for JsBarcode
          let format = barcodeType;
          if (format === 'EAN13' || format === 'EAN8') {
             // ensure length
          }
          
          JsBarcode(barcodeRef.current, barcode, {
            format: format,
            width: 1.5,
            height: 40,
            displayValue: true,
            fontSize: 12,
            margin: 0,
            textMargin: 2
          });
        }
      }
    } catch (err) {
      console.error("Barcode generation error:", err);
    }
  }, [barcode, barcodeType]);

  const formattedPrice = price 
    ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price)
    : "";

  return (
    <div 
      ref={ref}
      className="bg-white text-black border border-gray-300 shadow-sm flex flex-col justify-center items-center overflow-hidden p-1"
      style={{ 
        width: `${width}mm`, 
        height: `${height}mm`,
        boxSizing: 'border-box',
        pageBreakAfter: 'always',
        fontFamily: 'monospace' // good for printers
      }}
    >
      <div className="flex w-full items-center justify-between mb-1">
        {storeLogo ? (
           <img src={storeLogo} alt="Logo" className="h-4 object-contain" />
        ) : (
           <span className="text-[10px] font-bold truncate pr-1">ZPOS</span>
        )}
        {sku && <span className="text-[8px] font-bold">{sku}</span>}
      </div>

      <div className="w-full text-center truncate font-bold text-[10px] leading-tight mb-1">
        {productName} {variantName ? `- ${variantName}` : ''}
      </div>

      <div className="flex-1 flex justify-center items-center">
        {barcodeType === 'QR_CODE' ? (
          <canvas ref={qrcodeRef} className="max-h-full" />
        ) : (
          <svg ref={barcodeRef} className="max-w-full max-h-full" />
        )}
      </div>

      {price !== undefined && (
        <div className="w-full text-center font-bold text-[12px] leading-tight mt-1">
          {formattedPrice}
        </div>
      )}
    </div>
  );
});

BarcodeLabelPreview.displayName = 'BarcodeLabelPreview';
