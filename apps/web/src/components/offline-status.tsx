"use client";

import * as React from "react";

import { CloudOff, CloudUpload, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { flushOfflineQueue, pendingOrderCount } from "@/lib/offline/sync";

/**
 * Compact offline/online indicator with manual sync trigger.
 * Drop this into the POS header — it self-polls the queue every 5s while
 * mounted and reacts to online/offline events.
 */
export function OfflineStatus({
  className = "",
  onSyncComplete,
}: {
  className?: string;
  onSyncComplete?: (res: { ok: number; failed: number; remaining: number }) => void;
}) {
  const online = useOnlineStatus();
  const [queued, setQueued] = React.useState(0);
  const [syncing, setSyncing] = React.useState(false);

  const refresh = React.useCallback(async () => {
    try {
      setQueued(await pendingOrderCount());
    } catch {
      /* ignore */
    }
  }, []);

  React.useEffect(() => {
    refresh();
    const iv = setInterval(refresh, 5000);
    return () => clearInterval(iv);
  }, [refresh]);

  // When coming back online with a queue, auto-flush once.
  React.useEffect(() => {
    if (!online) return;
    if (queued === 0) return;
    let cancelled = false;
    (async () => {
      setSyncing(true);
      try {
        const res = await flushOfflineQueue();
        if (cancelled) return;
        if (res.ok > 0) {
          toast.success(`Đã đồng bộ ${res.ok} đơn offline`);
        }
        if (res.failed > 0) {
          toast.error(`${res.failed} đơn đồng bộ thất bại — sẽ thử lại`);
        }
        onSyncComplete?.(res);
      } finally {
        if (!cancelled) {
          setSyncing(false);
          refresh();
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online]);

  async function manualSync() {
    if (!online) {
      toast.error("Hiện đang offline — không thể đồng bộ");
      return;
    }
    setSyncing(true);
    try {
      const res = await flushOfflineQueue();
      if (res.ok > 0) toast.success(`Đã đồng bộ ${res.ok} đơn`);
      if (res.failed > 0) toast.error(`${res.failed} đơn còn lỗi`);
      onSyncComplete?.(res);
    } finally {
      setSyncing(false);
      refresh();
    }
  }

  // Online + empty queue — show a minimal "OK" pill
  if (online && queued === 0) {
    return (
      <Badge
        variant="outline"
        className={`gap-1 font-bold border-emerald-500/30 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 ${className}`}
      >
        <Wifi className="h-3 w-3" />
        Online
      </Badge>
    );
  }

  // Offline — red banner with queue count
  if (!online) {
    return (
      <Badge
        variant="outline"
        className={`gap-1.5 font-bold border-red-500/30 text-red-700 dark:text-red-400 bg-red-500/10 ${className}`}
      >
        <WifiOff className="h-3 w-3" />
        Offline
        {queued > 0 && (
          <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-600/20 text-[10px]">{queued} chờ sync</span>
        )}
      </Badge>
    );
  }

  // Online but queue still has items (failed earlier) — amber + manual sync button
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge
        variant="outline"
        className="gap-1 font-bold border-amber-500/30 text-amber-700 dark:text-amber-400 bg-amber-500/10"
      >
        <CloudOff className="h-3 w-3" />
        {queued} đơn chờ sync
      </Badge>
      <Button size="sm" variant="outline" onClick={manualSync} disabled={syncing} className="h-7 px-2 text-xs">
        {syncing ? <RefreshCw className="h-3 w-3 animate-spin" /> : <CloudUpload className="h-3 w-3 mr-1" />}
        Sync
      </Button>
    </div>
  );
}
