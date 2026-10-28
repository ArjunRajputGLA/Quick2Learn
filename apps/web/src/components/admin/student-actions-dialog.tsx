"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatINR } from "@quick2learn/shared";
import {
  manualEnrollStudentAction,
  recordOfflinePaymentAction,
  waiveFeeDueAction,
  addStudentNoteAction,
} from "@/server/admin-actions";
import { toast } from "sonner";
import {
  GraduationCap,
  CreditCard,
  AlertTriangle,
  FileText,
  Loader2,
  X,
} from "lucide-react";

interface ManualEnrollModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
  batches: Array<{
    id: string;
    title: string;
    feePlans: Array<{
      id: string;
      name: string;
      totalPaise: number;
    }>;
  }>;
}

export function ManualEnrollModal({
  isOpen,
  onClose,
  studentId,
  studentName,
  batches,
}: ManualEnrollModalProps) {
  const router = useRouter();
  const [selectedBatchId, setSelectedBatchId] = useState(batches[0]?.id || "");
  const [selectedFeePlanId, setSelectedFeePlanId] = useState(
    batches[0]?.feePlans[0]?.id || "",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const currentBatch = batches.find((b) => b.id === selectedBatchId);
  const feePlans = currentBatch?.feePlans || [];

  const handleBatchChange = (bId: string) => {
    setSelectedBatchId(bId);
    const b = batches.find((x) => x.id === bId);
    setSelectedFeePlanId(b?.feePlans[0]?.id || "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatchId) {
      toast.error("Please select a batch");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await manualEnrollStudentAction({
        studentId,
        batchId: selectedBatchId,
        feePlanId: selectedFeePlanId || undefined,
      });
      if (res.success) {
        toast.success(`Successfully enrolled ${studentName}`);
        onClose();
        router.refresh();
      } else {
        toast.error(res.error || "Enrollment failed");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl bg-white border border-slate-200/90 p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2 text-primary font-bold text-body-lg">
            <GraduationCap className="w-5 h-5" />
            <span>Manually Enrol Student</span>
          </div>
          <button onClick={onClose} className="p-1 text-ink-muted hover:text-ink">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 rounded-xl bg-surface-subtle border border-border text-caption text-ink font-semibold">
            Student: <span className="font-bold text-primary">{studentName}</span>
          </div>

          <div className="space-y-1.5">
            <label className="text-caption font-semibold text-ink">Choose Batch</label>
            <select
              value={selectedBatchId}
              onChange={(e) => handleBatchChange(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-white text-body-sm text-ink"
            >
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title}
                </option>
              ))}
            </select>
          </div>

          {feePlans.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-caption font-semibold text-ink">Choose Fee Plan</label>
              <select
                value={selectedFeePlanId}
                onChange={(e) => setSelectedFeePlanId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-white text-body-sm text-ink"
              >
                {feePlans.map((fp) => (
                  <option key={fp.id} value={fp.id}>
                    {fp.name} — {formatINR(fp.totalPaise)}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> Enrolling...
                </>
              ) : (
                "Enrol & Create Dues"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface RecordOfflinePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
  dues: Array<{
    id: string;
    label: string;
    amountPaise: number;
    status: string;
    batchTitle: string;
  }>;
}

export function RecordOfflinePaymentModal({
  isOpen,
  onClose,
  studentId,
  studentName,
  dues,
}: RecordOfflinePaymentModalProps) {
  const router = useRouter();
  const unpaidDues = dues.filter((d) => d.status === "due");
  const [selectedDueId, setSelectedDueId] = useState(unpaidDues[0]?.id || "");
  const [method, setMethod] = useState<"cash" | "upi_offline" | "bank_transfer">("cash");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const activeDue = unpaidDues.find((d) => d.id === selectedDueId) || unpaidDues[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDue) {
      toast.error("No unpaid fee due selected");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await recordOfflinePaymentAction({
        studentId,
        dueId: activeDue.id,
        method,
        amountPaise: activeDue.amountPaise,
        note: note.trim() || undefined,
      });
      if (res.success) {
        toast.success(`Payment recorded! Receipt generated.`);
        onClose();
        router.refresh();
      } else {
        toast.error(res.error || "Failed to record payment");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl bg-white border border-slate-200/90 p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2 text-primary font-bold text-body-lg">
            <CreditCard className="w-5 h-5" />
            <span>Record Offline Fee Payment</span>
          </div>
          <button onClick={onClose} className="p-1 text-ink-muted hover:text-ink">
            <X className="w-5 h-5" />
          </button>
        </div>

        {unpaidDues.length === 0 ? (
          <div className="py-6 text-center text-caption text-ink-muted space-y-3">
            <p>This student currently has no pending fee dues to collect.</p>
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-3 rounded-xl bg-surface-subtle border border-border text-caption text-ink font-semibold">
              Student: <span className="font-bold text-primary">{studentName}</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-caption font-semibold text-ink">Select Pending Due</label>
              <select
                value={selectedDueId}
                onChange={(e) => setSelectedDueId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-white text-body-sm text-ink"
              >
                {unpaidDues.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.batchTitle} · {d.label} ({formatINR(d.amountPaise)})
                  </option>
                ))}
              </select>
            </div>

            <div className="p-4 rounded-xl bg-primary-soft/30 border border-primary/20 flex items-center justify-between">
              <span className="text-body-sm font-semibold text-ink">Amount Payable:</span>
              <span className="text-h3 font-extrabold text-ink">
                {activeDue ? formatINR(activeDue.amountPaise) : "₹0"}
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-caption font-semibold text-ink">Payment Method</label>
              <select
                value={method}
                onChange={(e) =>
                  setMethod(e.target.value as "cash" | "upi_offline" | "bank_transfer")
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-white text-body-sm text-ink"
              >
                <option value="cash">Cash (In-person at institute)</option>
                <option value="upi_offline">Direct UPI (QR / PhonePe / GPay)</option>
                <option value="bank_transfer">Bank Transfer (NEFT / IMPS)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-caption font-semibold text-ink">Staff Note / Reference (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Received by Dinesh Sir in Mathura center"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3.5 py-2 text-body-sm rounded-xl border border-border bg-white text-ink"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
              <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting} className="bg-success hover:bg-emerald-700 text-white font-semibold">
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> Recording...
                  </>
                ) : (
                  "Record & Generate Receipt"
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

interface WaiveDueModalProps {
  isOpen: boolean;
  onClose: () => void;
  due: {
    id: string;
    label: string;
    amountPaise: number;
    studentId: string;
    studentName: string;
  } | null;
}

export function WaiveDueModal({ isOpen, onClose, due }: WaiveDueModalProps) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !due) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error("Please provide a waiver reason");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await waiveFeeDueAction({
        dueId: due.id,
        studentId: due.studentId,
        reason: reason.trim(),
      });
      if (res.success) {
        toast.success("Fee due waived successfully");
        onClose();
        router.refresh();
      } else {
        toast.error(res.error || "Failed to waive due");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white border border-slate-200/90 p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
      >
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-50 text-warning shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-body-lg font-bold text-ink">Waive Fee Due</h3>
            <p className="text-body-sm text-ink-muted">
              Waiving removes the fee requirement for this instalment.
            </p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-surface-subtle border border-border text-body-sm space-y-1">
          <div>Student: <span className="font-bold text-ink">{due.studentName}</span></div>
          <div>Due: <span className="font-semibold text-ink">{due.label}</span> ({formatINR(due.amountPaise)})</div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-caption font-semibold text-ink">
              Reason for Waiver <span className="text-critical">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Merit scholarship approved by Dinesh Sir"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border text-body-sm bg-white text-ink"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting} className="bg-warning hover:bg-amber-600 text-ink-inverted">
              {isSubmitting ? "Waiving..." : "Confirm Waiver"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface AddNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
}

export function AddNoteModal({ isOpen, onClose, studentId, studentName }: AddNoteModalProps) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await addStudentNoteAction({
        studentId,
        note: note.trim(),
      });
      if (res.success) {
        toast.success("Note added to student history");
        setNote("");
        onClose();
        router.refresh();
      } else {
        toast.error(res.error || "Failed to add note");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white border border-slate-200/90 p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
      >
        <div className="flex items-center gap-2 text-primary font-bold text-body-lg">
          <FileText className="w-5 h-5" />
          <span>Add Staff Note</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-caption font-semibold text-ink">
              Note regarding {studentName}
            </label>
            <textarea
              rows={4}
              placeholder="e.g. Spoke to parent regarding board exam test schedule. Promised fee clearance by next Monday."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border text-body-sm bg-white text-ink"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Note"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
