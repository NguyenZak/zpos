"use client";

import React from "react";
import { ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileFloatingCartProps {
  itemCount: number;
  totalAmount: number;
  onClick: () => void;
  className?: string;
}

export function MobileFloatingCart({
  itemCount,
  totalAmount,
  onClick,
  className
}: MobileFloatingCartProps) {
  if (itemCount === 0) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "fixed bottom-20 right-4 z-40 flex items-center gap-3 bg-gradient-to-r from-primary to-primary/95 text-primary-foreground pl-4 pr-5 py-3.5 rounded-full shadow-[0_8px_32px_rgba(var(--primary-rgb,0,0,0),0.35)] active:scale-95 hover:scale-102 transition-all animate-bounce-short border border-primary/20",
        className
      )}
      style={{ minHeight: "48px" }} // Large touch target
    >
      <div className="relative">
        <div className="p-1 rounded-full bg-primary-foreground/10 text-primary-foreground">
          <ShoppingCart className="w-5 h-5" />
        </div>
        <span className="absolute -top-2.5 -right-2.5 bg-destructive text-destructive-foreground text-[10px] font-black h-5 w-5 rounded-full flex items-center justify-center border-2 border-primary shadow-xs">
          {itemCount}
        </span>
      </div>
      
      <div className="flex flex-col items-start leading-none gap-0.5 border-l border-primary-foreground/20 pl-2.5">
        <span className="text-[8px] font-black tracking-widest text-primary-foreground/75 uppercase">Thanh toán</span>
        <span className="text-sm font-black font-mono leading-none">
          {formatCurrency(totalAmount)}
        </span>
      </div>

      {/* Pulse Glowing Effect */}
      <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-15 pointer-events-none z-[-1]" />
    </button>
  );
}
