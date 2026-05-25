"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { OpenShiftDialog } from "../_components/open-shift-dialog";

export default function OpenShiftRoute() {
  const router = useRouter();
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (!open) router.replace("/shifts");
  }, [open, router]);

  return (
    <div className="flex h-full flex-col items-center justify-center p-6">
      <OpenShiftDialog open={open} onOpenChange={setOpen} onOpened={(shift) => router.push(`/shifts/${shift.id}`)} />
    </div>
  );
}
