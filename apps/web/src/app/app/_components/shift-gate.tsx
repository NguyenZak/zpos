"use client";

import { useEffect, useState } from "react";
import { Loader2, LogOut, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";

import { OpenShiftDialog } from "@/app/app/shifts/_components/open-shift-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { shiftService, type Shift } from "@/services/shift.service";
import { clearAllSessions } from "@/utils/clear-session";

interface ShiftGateProps {
  children: React.ReactNode;
}

export function ShiftGate({ children }: ShiftGateProps) {
  const router = useRouter();
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [loading, setLoading] = useState(true);
  const [openShiftDialog, setOpenShiftDialog] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadActiveShift = async (showDialog: boolean) => {
      setLoading(true);
      try {
        const shift = await shiftService.getActiveShift();
        if (cancelled) return;
        setActiveShift(shift);
        setOpenShiftDialog(!shift && showDialog);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") {
        loadActiveShift(false);
      }
    };

    const handleShiftClosed = () => {
      setActiveShift(null);
      setOpenShiftDialog(true);
      setLoading(false);
    };

    loadActiveShift(true);
    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    window.addEventListener("zpos_shift_closed", handleShiftClosed);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      window.removeEventListener("zpos_shift_closed", handleShiftClosed);
    };
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background print:hidden">
        <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="size-8 animate-spin text-primary" />
          <span>Đang kiểm tra ca làm việc...</span>
        </div>
      </div>
    );
  }

  if (!activeShift) {
    const handleSignOut = async () => {
      setSigningOut(true);
      await clearAllSessions();
      router.replace("/login");
    };

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background p-4 print:hidden">
        <Card className="w-full max-w-md border-muted shadow-xs">
          <CardContent className="flex flex-col items-center gap-5 p-8 text-center">
            <div className="rounded-2xl bg-amber-500/10 p-4 text-amber-600">
              <Wallet className="size-10" />
            </div>
            <div className="grid gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">Cần mở ca làm việc</h1>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Tất cả thao tác vận hành đang bị khóa. Hãy mở ca trước khi tiếp tục làm việc.
              </p>
            </div>
            <Button className="w-full gap-2" onClick={() => setOpenShiftDialog(true)}>
              <Wallet className="size-4" />
              Mở ca làm việc
            </Button>
            <Button variant="outline" className="w-full gap-2" onClick={handleSignOut} disabled={signingOut}>
              {signingOut ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
              Đăng xuất
            </Button>
          </CardContent>
        </Card>

        <OpenShiftDialog
          open={openShiftDialog}
          onOpenChange={setOpenShiftDialog}
          onOpened={(shift) => {
            setActiveShift(shift);
            setOpenShiftDialog(false);
          }}
        />
      </div>
    );
  }

  return <>{children}</>;
}
