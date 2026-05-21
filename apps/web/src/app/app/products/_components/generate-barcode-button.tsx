import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

interface GenerateBarcodeButtonProps {
  onGenerate: (code: string) => void;
  barcodeType?: string;
}

const randomDigits = (length: number) => {
  const first = Math.floor(Math.random() * 9) + 1;
  const rest = Array.from({ length: length - 1 }, () => Math.floor(Math.random() * 10)).join("");
  return `${first}${rest}`;
};

const calculateEanChecksum = (payload: string) => {
  const sum = payload
    .split("")
    .map(Number)
    .reduce((total, digit, index) => total + digit * (index % 2 === 0 ? 1 : 3), 0);

  return String((10 - (sum % 10)) % 10);
};

const calculateUpcChecksum = (payload: string) => {
  const sum = payload
    .split("")
    .map(Number)
    .reduce((total, digit, index) => total + digit * (index % 2 === 0 ? 3 : 1), 0);

  return String((10 - (sum % 10)) % 10);
};

function generateBarcode(barcodeType = "CODE128") {
  if (barcodeType === "EAN13") {
    const payload = randomDigits(12);
    return `${payload}${calculateEanChecksum(payload)}`;
  }

  if (barcodeType === "EAN8") {
    const payload = randomDigits(7);
    return `${payload}${calculateEanChecksum(payload)}`;
  }

  if (barcodeType === "UPC") {
    const payload = randomDigits(11);
    return `${payload}${calculateUpcChecksum(payload)}`;
  }

  if (barcodeType === "QR_CODE") {
    return `ZPOS-${Date.now().toString(36).toUpperCase()}`;
  }

  return randomDigits(13);
}

export function GenerateBarcodeButton({ onGenerate, barcodeType = "CODE128" }: GenerateBarcodeButtonProps) {
  const handleGenerate = () => {
    onGenerate(generateBarcode(barcodeType));
  };

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleGenerate} className="h-9 shrink-0 gap-1">
      <Sparkles className="h-3 w-3" />
      Tự tạo
    </Button>
  );
}
