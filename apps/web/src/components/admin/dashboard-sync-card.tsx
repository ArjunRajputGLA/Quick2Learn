"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, CheckCircle2, AlertCircle, Loader2, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
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

  const hasErrors = lastSync?.errors && lastSync.errors.length > 0;

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs flex flex-col justify-between space-y-3">
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/80">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-red-50 text-red-600">
            <Video className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">YouTube Channel Sync</h3>
            <p className="text-[11px] text-slate-500 leading-tight">@Quick2Learn lectures & playlists catalog</p>
          </div>
        </div>
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
            hasErrors
              ? "bg-rose-50 text-rose-700 border border-rose-200"
              : "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
          }`}
        >
          {hasErrors ? "Needs Review" : "Automated & Ready"}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center py-0.5">
        <div className="p-2.5 rounded-lg bg-slate-50/70 border border-slate-200/60">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Last Synced</div>
          <div className="text-xs font-bold text-slate-900 mt-0.5">
            {lastSync?.startedAt
              ? new Date(lastSync.startedAt).toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Never"}
          </div>
        </div>
        <div className="p-2.5 rounded-lg bg-slate-50/70 border border-slate-200/60">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Videos Added</div>
          <div className="text-xs font-bold text-emerald-600 mt-0.5">+{lastSync?.added ?? 0}</div>
        </div>
        <div className="p-2.5 rounded-lg bg-slate-50/70 border border-slate-200/60">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Videos Updated</div>
          <div className="text-xs font-bold text-blue-600 mt-0.5">{lastSync?.updated ?? 0}</div>
        </div>
        <div className="p-2.5 rounded-lg bg-slate-50/70 border border-slate-200/60">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Sync Status</div>
          <div className="text-xs font-bold text-slate-900 mt-0.5 flex items-center justify-center gap-1">
            {lastSync?.finishedAt ? (
              <>
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Healthy</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3 h-3 text-amber-500" />
                <span>Pending</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
        <span>Daily at 02:00 AM UTC via cron, or on demand.</span>
        <Button
          onClick={handleSyncNow}
          disabled={isSyncing}
          size="sm"
          className="h-8 px-3 text-xs gap-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-2xs"
        >
          {isSyncing ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Syncing...</span>
            </>
          ) : (
            <>
              <RefreshCw className="w-3 h-3" />
              <span>Sync now</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
