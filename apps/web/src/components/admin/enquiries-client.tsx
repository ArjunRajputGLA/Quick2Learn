"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  updateEnquiryStatusAction,
  convertEnquiryToStudentAction,
} from "@/server/admin-actions";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import {
  Phone,
  MessageSquare,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Edit2,
} from "lucide-react";

export interface EnquiryRow {
  id: string;
  name: string;
  email?: string | null;
  phone: string;
  classLevel: number | null;
  board: string | null;
  message: string | null;
  status: "new" | "contacted" | "enrolled" | "closed";
  notes: string | null;
  createdAt: Date | string;
}

interface EnquiriesClientProps {
  enquiries: EnquiryRow[];
}

export function EnquiriesClient({ enquiries }: EnquiriesClientProps) {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Conversion confirmation
  const [toConvert, setToConvert] = useState<EnquiryRow | null>(null);

  // Quick edit note state
  const [editingNoteEnquiryId, setEditingNoteEnquiryId] = useState<string | null>(null);
  const [tempNote, setTempNote] = useState("");

  const filtered = enquiries.filter((e) => {
    if (filterStatus !== "all" && e.status !== filterStatus) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        e.name.toLowerCase().includes(q) ||
        e.phone.includes(q) ||
        (e.email && e.email.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleStatusChange = async (
    enquiryId: string,
    status: "new" | "contacted" | "enrolled" | "closed",
  ) => {
    try {
      const res = await updateEnquiryStatusAction(enquiryId, status);
      if (!res.success) {
        throw new Error(res.error || "Failed to update status");
      }
      setStatusMessage("Enquiry status updated.");
      router.refresh();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Status update failed");
    }
  };

  const handleSaveNote = async (enquiryId: string) => {
    try {
      const enq = enquiries.find((e) => e.id === enquiryId);
      const res = await updateEnquiryStatusAction(
        enquiryId,
        enq ? enq.status : "contacted",
        tempNote.trim(),
      );
      if (!res.success) {
        throw new Error(res.error || "Failed to update note");
      }
      setStatusMessage("Enquiry notes updated.");
      setEditingNoteEnquiryId(null);
      router.refresh();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to save note");
    }
  };

  const handleConvert = async () => {
    if (!toConvert) return;
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      const res = await convertEnquiryToStudentAction(toConvert.id);
      if (!res.success || !res.data) {
        throw new Error(res.error || "Failed to convert enquiry to student");
      }

      const { studentUserId } = res.data;
      setStatusMessage(
        `Successfully converted ${toConvert.name} to a student account. Redirecting to student profile...`,
      );
      setTimeout(() => {
        router.push(`/admin/students/${studentUserId}`);
      }, 1000);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Conversion failed");
    } finally {
      setToConvert(null);
    }
  };

  return (
    <div className="space-y-6">
      {statusMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-body-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="font-semibold">{statusMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-critical/10 border border-critical/30 text-critical text-body-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="font-semibold">{errorMessage}</span>
        </div>
      )}

      {/* Header and Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-border bg-white shadow-xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name or phone..."
            className="pl-9 h-9 text-body-xs"
          />
        </div>

        <div className="flex items-center gap-2 text-body-xs">
          <span className="font-semibold text-ink-muted flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Status:
          </span>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-border bg-white text-ink font-medium"
          >
            <option value="all">All Statuses ({enquiries.length})</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="enrolled">Enrolled</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Enquiries Table */}
      <div className="rounded-2xl border border-border bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-body-sm text-ink border-collapse">
            <thead className="bg-surface-subtle border-b border-border text-[11px] font-bold text-ink-muted uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Prospective Student</th>
                <th className="py-3 px-4">Class & Board</th>
                <th className="py-3 px-4">Message / Notes</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Received</th>
                <th className="py-3 px-4 text-right">Quick Contact & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-ink-muted">
                    No enquiries match the current filter.
                  </td>
                </tr>
              ) : (
                filtered.map((enq) => {
                  const cleanPhone = enq.phone.replace(/[^0-9]/g, "");
                  const isEnrolled = enq.status === "enrolled";

                  return (
                    <tr key={enq.id} className="hover:bg-surface-subtle/80 transition-colors">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-ink">{enq.name}</div>
                        <div className="text-body-xs font-mono text-ink-muted mt-0.5">
                          {enq.phone}
                        </div>
                        {enq.email && (
                          <div className="text-[11px] text-ink-muted truncate max-w-[180px]">
                            {enq.email}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-body-xs">
                        <span className="font-semibold text-ink">
                          {enq.classLevel ? `Class ${enq.classLevel}` : "Class unset"}
                        </span>
                        {enq.board && (
                          <span className="text-ink-muted uppercase font-medium ml-1">
                            ({enq.board})
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 max-w-xs text-body-xs">
                        {editingNoteEnquiryId === enq.id ? (
                          <div className="space-y-1.5">
                            <Input
                              value={tempNote}
                              onChange={(e) => setTempNote(e.target.value)}
                              placeholder="Staff notes..."
                              className="text-xs h-7"
                              autoFocus
                            />
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                onClick={() => handleSaveNote(enq.id)}
                                className="h-6 text-[10px] px-2"
                              >
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingNoteEnquiryId(null)}
                                className="h-6 text-[10px] px-2"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            {enq.message && (
                              <p className="text-ink line-clamp-1 italic text-[11px]">
                                "{enq.message}"
                              </p>
                            )}
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-ink-muted line-clamp-1 text-[11px]">
                                {enq.notes || "No staff notes yet"}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingNoteEnquiryId(enq.id);
                                  setTempNote(enq.notes || "");
                                }}
                                className="p-0.5 text-ink-muted hover:text-ink shrink-0"
                                title="Edit staff notes"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <select
                          value={enq.status}
                          onChange={(e) =>
                            handleStatusChange(
                              enq.id,
                              e.target.value as "new" | "contacted" | "enrolled" | "closed",
                            )
                          }
                          className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                            enq.status === "new"
                              ? "bg-amber-100 text-amber-800 border border-amber-300"
                              : enq.status === "contacted"
                              ? "bg-blue-100 text-blue-800 border border-blue-300"
                              : enq.status === "enrolled"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              : "bg-neutral-subtle text-ink-muted border border-border"
                          }`}
                        >
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="enrolled">Enrolled</option>
                          <option value="closed">Closed</option>
                        </select>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-body-xs text-ink-muted">
                        {new Date(enq.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Call */}
                          <a
                            href={`tel:${cleanPhone}`}
                            className="p-1.5 rounded-lg border border-border bg-white hover:bg-surface-subtle text-ink-muted hover:text-ink"
                            title="Call Student / Parent"
                          >
                            <Phone className="w-3.5 h-3.5 text-emerald-600" />
                          </a>

                          {/* Quick WhatsApp */}
                          <a
                            href={`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(
                              `Hello ${enq.name}, Greetings from Quick2Learn Institute! We received your enquiry for Class ${enq.classLevel || 12}.`,
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg border border-border bg-white hover:bg-surface-subtle text-ink-muted hover:text-ink"
                            title="Chat on WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                          </a>

                          {/* Convert to Student */}
                          {!isEnrolled ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setToConvert(enq)}
                              className="h-7 text-xs font-semibold gap-1 text-primary border-primary/30 hover:bg-primary/5"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Convert</span>
                            </Button>
                          ) : (
                            <span className="text-body-xs text-emerald-700 font-semibold px-2">
                              Converted
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Convert Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!toConvert}
        title="Convert Enquiry to Student Account?"
        description={`This will automatically synthesize a registered student user (${toConvert?.phone}@student.quick2learn.in) and profile for ${toConvert?.name}. You can then immediately enrol them in batches.`}
        affectedItemName={`${toConvert?.name} (${toConvert?.phone})`}
        confirmLabel="Convert to Student"
        isDestructive={false}
        onConfirm={handleConvert}
        onCancel={() => setToConvert(null)}
      />
    </div>
  );
}
