import { Badge } from "@/components/ui/badge";
import type { ShiftStatus } from "@/services/shift.service";

const STATUS_META: Record<ShiftStatus, { label: string; className: string }> = {
  open: { label: "Đang mở", className: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" },
  closed: { label: "Đã đóng", className: "bg-amber-100 text-amber-700 hover:bg-amber-100" },
  reviewed: { label: "Đã duyệt", className: "bg-blue-100 text-blue-700 hover:bg-blue-100" },
  cancelled: { label: "Đã huỷ", className: "bg-rose-100 text-rose-700 hover:bg-rose-100" },
};

export function ShiftStatusBadge({ status }: { status: ShiftStatus }) {
  const meta = STATUS_META[status] || STATUS_META.open;
  return (
    <Badge className={meta.className} variant="secondary">
      {meta.label}
    </Badge>
  );
}
