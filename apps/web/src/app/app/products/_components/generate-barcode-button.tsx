import React from 'react';
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export function GenerateBarcodeButton({ onGenerate }: { onGenerate: (code: string) => void }) {
  const handleGenerate = () => {
    // Generate a random 13-digit number (EAN-13 style without strict checksum)
    const random = Math.floor(Math.random() * 899999999999) + 100000000000;
    onGenerate(random.toString());
  };

  return (
    <Button 
      type="button" 
      variant="outline" 
      size="sm" 
      onClick={handleGenerate} 
      className="shrink-0 gap-1 h-9"
    >
      <Sparkles className="w-3 h-3" />
      Tự tạo
    </Button>
  );
}
