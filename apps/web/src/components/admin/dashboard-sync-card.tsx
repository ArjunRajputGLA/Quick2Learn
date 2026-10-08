"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, CheckCircle2, AlertCircle, Loader2, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { syncYouTubeNowAction } from "@/server/admin-actions";
import { toast } from "sonner";

interface DashboardSyncCardProps {
  lastSync: {
    id: string;
    startedAt: Date;
    finishedAt: Date | null;
    added: number;
    updated: number;
    errors: unknown[];
  } | null;
}

export function DashboardSyncCard({ lastSync }: DashboardSyncCardProps) {
  const router = useRouter();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncNow = async () => {
    setIsSyncing(true);
    try {
      const res = await syncYouTubeNowAction();
      if (res.success) {
        toast.success("YouTube channel synchronized successfully!");
        router.refresh();
      } else {
        toast.error(res.error || "Sync failed. Check channel API key.");
      }
    } catch {
      toast.error("Failed to run sync. Please try again.");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-xs flex flex-col justify-between space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-red-50 text-red-600">
            <Video className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-body font-bold text-ink">YouTube Channel Sync</h3>
            <p className="text-[11px] text-ink-muted">@Quick2Learn lectures & playlists catalog</p>
          </div>
        </div>
        <Badge variant={lastSync?.errors && lastSync.errors.length > 0 ? "critical" : "success"}>
          {lastSync?.errors && lastSync.errors.length > 0 ? "Needs Review" : "Automated & Ready"}
        </Badge>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center py-1">
        <div className="p-3 rounded-xl bg-surface-subtle border border-border">
          <div className="text-[11px] text-ink-muted font-semibold">Last Synced</div>
          <div className="text-body-sm font-bold text-ink mt-0.5">
            {lastSync?.startedAt ? new Date(lastSync.startedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "Never"}
          </div>
        </div>
        <div className="p-3 rounded-xl bg-surface-subtle border border-border">
          <div className="text-[11px] text-ink-muted font-semibold">Videos Added</div>
          <div className="text-body-sm font-bold text-success mt-0.5">+{lastSync?.added ?? 0}</div>
        </div>
        <div className="p-3 rounded-xl bg-surface-subtle border border-border">
          <div className="text-[11px] text-ink-muted font-semibold">Videos Updated</div>
          <div className="text-body-sm font-bold text-primary mt-0.5">{lastSync?.updated ?? 0}</div>
        </div>
        <div className="p-3 rounded-xl bg-surface-subtle border border-border">
          <div className="text-[11px] text-ink-muted font-semibold">Sync Status</div>
          <div className="text-body-sm font-bold text-ink mt-0.5 flex items-center justify-center gap-1">
            {lastSync?.finishedAt ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                <span>Healthy</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-warning" />
                <span>Pending</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <span className="text-[11px] text-ink-muted">
          Runs daily at 02:00 AM UTC via cron, or on demand.
        </span>
        <Button
          onClick={handleSyncNow}
          disabled={isSyncing}
          size="sm"
          className="gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold"
        >
          {isSyncing ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Syncing channel...
            </>
          ) : (
            <>
              <RefreshCw className="w-3.5 h-3.5" />
              Sync now
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
