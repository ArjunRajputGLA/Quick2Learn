"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  approveJoinRequestAction,
  rejectJoinRequestAction,
} from "@/server/admin-actions";
import { toast } from "sonner";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Phone,
  Mail,
  GraduationCap,
  Loader2,
} from "lucide-react";

export interface JoinRequestItem {
  id: string;
  batchId: string;
  batchTitle: string;
  batchMode: string;
  classLevel: number;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentPhone?: string | null;
  status: "pending" | "approved" | "rejected";
  note?: string | null;
  requestedAt: string;
  decidedAt?: string | null;
}

export interface BatchFeePlanOption {
  id: string;
  name: string;
  totalPaise: number;
}

interface BatchJoinRequestsInboxProps {
  initialRequests: JoinRequestItem[];
  feePlansByBatch?: Record<string, BatchFeePlanOption[]>;
  currentBatchId?: string;
}

export function BatchJoinRequestsInbox({
  initialRequests,
  feePlansByBatch = {},
  currentBatchId,
}: BatchJoinRequestsInboxProps) {
  const [requests, setRequests] = useState<JoinRequestItem[]>(initialRequests);
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Modal / Inline input state for approving or rejecting
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [selectedFeePlanId, setSelectedFeePlanId] = useState<Record<string, string>>({});

  const handleApprove = async (req: JoinRequestItem) => {
    setProcessingId(req.id);
    try {
      const chosenPlan = selectedFeePlanId[req.id];
      const res = await approveJoinRequestAction(req.id, chosenPlan);
      if (res.success) {
        toast.success(`Approved ${req.studentName} for ${req.batchTitle}! Student notified via push.`);
        setRequests((prev) =>
          prev.map((r) =>
            r.id === req.id
              ? { ...r, status: "approved", decidedAt: new Date().toISOString() }
              : r
          )
        );
      } else {
        toast.error(res.error || "Failed to approve join request");
      }
    } catch {
      toast.error("Failed to approve join request");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (req: JoinRequestItem) => {
    setProcessingId(req.id);
    try {
      const res = await rejectJoinRequestAction(req.id, rejectNote || undefined);
      if (res.success) {
        toast.success(`Request for ${req.studentName} rejected. Student notified.`);
        setRequests((prev) =>
          prev.map((r) =>
            r.id === req.id
              ? {
                  ...r,
                  status: "rejected",
                  note: rejectNote || null,
                  decidedAt: new Date().toISOString(),
                }
              : r
          )
        );
        setRejectingId(null);
        setRejectNote("");
      } else {
        toast.error(res.error || "Failed to reject join request");
      }
    } catch {
      toast.error("Failed to reject join request");
    } finally {
      setProcessingId(null);
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (filterStatus === "all") return true;
    return r.status === filterStatus;
  });

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <div className="space-y-6 rounded-2xl border border-border bg-white p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-display-xs font-bold text-ink">Join Requests Inbox</h3>
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                {pendingCount} Pending
              </span>
            )}
          </div>
          <p className="text-body-xs text-ink-muted mt-0.5">
            Approve or reject student batch join requests. Approved students are automatically enrolled.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-surface-subtle p-1 rounded-xl border border-border">
          {(["all", "pending", "approved", "rejected"] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg text-body-xs font-bold capitalize transition-colors ${
                filterStatus === status
                  ? "bg-white text-ink shadow-2xs font-extrabold"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface-subtle/40 p-12 text-center space-y-2">
          <Clock className="w-8 h-8 text-ink-muted mx-auto opacity-40" />
          <h4 className="text-body-sm font-bold text-ink">No requests found</h4>
          <p className="text-body-xs text-ink-muted">
            {filterStatus === "pending"
              ? "All caught up! There are no pending batch join requests."
              : `No ${filterStatus} requests to display.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((req) => {
            const batchPlans = feePlansByBatch[req.batchId] || [];
            const isPending = req.status === "pending";
            const isProcessing = processingId === req.id;
            const isRejecting = rejectingId === req.id;

            return (
              <div
                key={req.id}
                className="rounded-xl border border-border bg-white p-4 shadow-2xs hover:border-border/80 transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/50 pb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider ${
                        req.status === "pending"
                          ? "bg-amber-50 text-amber-800 border border-amber-200"
                          : req.status === "approved"
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : "bg-rose-50 text-rose-800 border border-rose-200"
                      }`}
                    >
                      {req.status === "pending" && <Clock className="w-3 h-3" />}
                      {req.status === "approved" && <CheckCircle2 className="w-3 h-3" />}
                      {req.status === "rejected" && <XCircle className="w-3 h-3" />}
                      {req.status}
                    </span>
                    <span className="text-body-xs font-semibold text-ink-muted">
                      Requested: {new Date(req.requestedAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  {!currentBatchId && (
                    <div className="flex items-center gap-1.5 text-body-xs font-bold text-ink">
                      <GraduationCap className="w-4 h-4 text-primary" />
                      <span>{req.batchTitle}</span>
                      <span className="text-ink-muted font-normal">
                        (Class {req.classLevel})
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-body-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                      {req.studentName.slice(0, 1)}
                    </div>
                    <div>
                      <p className="font-bold text-ink">{req.studentName}</p>
                      <p className="text-ink-muted text-[11px]">ID: {req.studentId.slice(0, 8)}...</p>
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    {req.studentPhone && (
                      <div className="flex items-center gap-1 text-ink-muted">
                        <Phone className="w-3.5 h-3.5 text-ink-muted" />
                        <span className="font-mono text-ink">{req.studentPhone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-ink-muted truncate">
                      <Mail className="w-3.5 h-3.5 text-ink-muted shrink-0" />
                      <span className="truncate">{req.studentEmail}</span>
                    </div>
                  </div>

                  {req.note && (
                    <div className="text-[11px] text-ink-muted bg-surface-subtle p-2 rounded-lg">
                      <span className="font-bold text-ink block">Note:</span>
                      {req.note}
                    </div>
                  )}
                </div>

                {/* Pending Actions */}
                {isPending && (
                  <div className="pt-2 border-t border-border/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    {/* Fee Plan Selector */}
                    {batchPlans.length > 0 && (
                      <div className="flex items-center gap-2">
                        <label className="text-[11px] font-bold text-ink-muted uppercase whitespace-nowrap">
                          Fee Plan:
                        </label>
                        <select
                          value={selectedFeePlanId[req.id] || batchPlans[0]?.id || ""}
                          onChange={(e) =>
                            setSelectedFeePlanId((prev) => ({
                              ...prev,
                              [req.id]: e.target.value,
                            }))
                          }
                          className="h-8 rounded-lg border border-border bg-white px-2 text-body-xs text-ink focus:outline-none"
                        >
                          {batchPlans.map((fp) => (
                            <option key={fp.id} value={fp.id}>
                              {fp.name} (₹{(fp.totalPaise / 100).toLocaleString("en-IN")})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2 ml-auto">
                      {!isRejecting ? (
                        <>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isProcessing}
                            onClick={() => setRejectingId(req.id)}
                            className="text-xs h-8 text-rose-700 hover:bg-rose-50 border-rose-200"
                          >
                            Reject
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            disabled={isProcessing}
                            onClick={() => handleApprove(req)}
                            className="text-xs h-8 gap-1.5 font-bold shadow-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            {isProcessing ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                            Approve & Enrol
                          </Button>
                        </>
                      ) : (
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <Input
                            placeholder="Reason for rejection (optional)"
                            value={rejectNote}
                            onChange={(e) => setRejectNote(e.target.value)}
                            className="h-8 text-xs min-w-[200px]"
                          />
                          <Button
                            size="sm"
                            disabled={isProcessing}
                            onClick={() => handleReject(req)}
                            className="h-8 text-xs font-bold px-2.5 bg-rose-600 hover:bg-rose-700 text-white"
                          >
                            Confirm Reject
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setRejectingId(null);
                              setRejectNote("");
                            }}
                            className="h-8 text-xs px-2"
                          >
                            Cancel
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
