"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  updateEnquiryStatusAction,
  convertEnquiryToStudentAction,
  createEnquiryAction,
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
  Plus,
  Loader2,
  X,
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

  // New Enquiry modal state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newClass, setNewClass] = useState<number>(12);
  const [newBoard, setNewBoard] = useState<"cbse" | "icse" | "isc">("cbse");
  const [newMessage, setNewMessage] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);

  // Quick edit note state
  const [editingNoteEnquiryId, setEditingNoteEnquiryId] = useState<string | null>(null);
  const [tempNote, setTempNote] = useState("");

  const handleCreateEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) {
      setErrorMessage("Student name and phone are required.");
      return;
    }
    const cleanPhone = newPhone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setErrorMessage("Please enter a valid 10-digit phone number.");
      return;
    }

    setIsSubmittingNew(true);
    setErrorMessage(null);
    try {
      const res = await createEnquiryAction({
        name: newName.trim(),
        phone: cleanPhone.slice(-10),
        email: newEmail.trim() || undefined,
        classLevel: newClass,
        board: newBoard,
        message: newMessage.trim() || undefined,
        notes: newNotes.trim() || undefined,
      });

      if (!res.success) {
        throw new Error(res.error || "Failed to record enquiry");
      }

      setStatusMessage("Enquiry / Lead recorded successfully!");
      setIsAddOpen(false);
      setNewName("");
      setNewPhone("");
      setNewEmail("");
      setNewMessage("");
      setNewNotes("");
      router.refresh();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to create enquiry");
    } finally {
      setIsSubmittingNew(false);
    }
  };

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl border border-slate-200/80 bg-white shadow-xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name or phone..."
            className="pl-8 h-8 text-xs rounded-lg border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-500 flex items-center gap-1 text-[11px]">
            <Filter className="w-3 h-3" /> Status:
          </span>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-8 px-2.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-800 font-medium text-xs"
          >
            <option value="all">All Statuses ({enquiries.length})</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="enrolled">Enrolled</option>
            <option value="closed">Closed</option>
          </select>

          <Button
            size="sm"
            onClick={() => setIsAddOpen(true)}
            className="h-8 px-3 text-xs gap-1.5 font-semibold bg-blue-600 text-white hover:bg-blue-700 rounded-lg shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Enquiry</span>
          </Button>
        </div>
      </div>

      {/* Enquiries Table */}
      <div className="rounded-xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-800 border-collapse">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3.5">Prospective Student</th>
                <th className="py-2.5 px-3.5">Class &amp; Board</th>
                <th className="py-2.5 px-3.5">Message / Notes</th>
                <th className="py-2.5 px-3.5">Status</th>
                <th className="py-2.5 px-3.5">Received</th>
                <th className="py-2.5 px-3.5 text-right">Quick Contact &amp; Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No enquiries match the current filter.
                  </td>
                </tr>
              ) : (
                filtered.map((enq) => {
                  const cleanPhone = enq.phone.replace(/[^0-9]/g, "");
                  const isEnrolled = enq.status === "enrolled";

                  return (
                    <tr key={enq.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3.5 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{enq.name}</div>
                        <div className="text-[11px] font-mono text-slate-500">
                          {enq.phone}
                        </div>
                        {enq.email && (
                          <div className="text-[10px] text-slate-400 truncate max-w-[180px]">
                            {enq.email}
                          </div>
                        )}
                      </td>

                      <td className="py-2.5 px-3.5 whitespace-nowrap text-xs">
                        <span className="font-semibold text-slate-800">
                          {enq.classLevel ? `Class ${enq.classLevel}` : "Class unset"}
                        </span>
                        {enq.board && (
                          <span className="text-slate-400 uppercase font-medium ml-1">
                            ({enq.board})
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-3.5 max-w-xs text-xs">
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
                              <p className="text-slate-700 line-clamp-1 italic text-[11px]">
                                &ldquo;{enq.message}&rdquo;
                              </p>
                            )}
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-slate-400 line-clamp-1 text-[11px]">
                                {enq.notes || "No staff notes yet"}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingNoteEnquiryId(enq.id);
                                  setTempNote(enq.notes || "");
                                }}
                                className="p-0.5 text-slate-400 hover:text-slate-700 shrink-0"
                                title="Edit staff notes"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        )}
                      </td>

                      <td className="py-2.5 px-3.5 whitespace-nowrap">
                        <select
                          value={enq.status}
                          onChange={(e) =>
                            handleStatusChange(
                              enq.id,
                              e.target.value as "new" | "contacted" | "enrolled" | "closed",
                            )
                          }
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            enq.status === "new"
                              ? "bg-amber-50 text-amber-800 border border-amber-200"
                              : enq.status === "contacted"
                              ? "bg-blue-50 text-blue-800 border border-blue-200"
                              : enq.status === "enrolled"
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}
                        >
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="enrolled">Enrolled</option>
                          <option value="closed">Closed</option>
                        </select>
                      </td>

                      <td className="py-2.5 px-3.5 whitespace-nowrap text-xs text-slate-400">
                        {new Date(enq.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </td>

                      <td className="py-2.5 px-3.5 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Call */}
                          <a
                            href={`tel:${cleanPhone}`}
                            className="p-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-colors"
                            title="Call Student / Parent"
                          >
                            <Phone className="w-3 h-3 text-emerald-600" />
                          </a>

                          {/* Quick WhatsApp */}
                          <a
                            href={`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(
                              `Hello ${enq.name}, Greetings from Quick2Learn Institute! We received your enquiry for Class ${enq.classLevel || 12}.`,
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-colors"
                            title="Chat on WhatsApp"
                          >
                            <MessageSquare className="w-3 h-3 text-emerald-600" />
                          </a>

                          {/* Convert to Student */}
                          {!isEnrolled ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setToConvert(enq)}
                              className="h-7 text-xs font-semibold gap-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                            >
                              <UserCheck className="w-3 h-3" />
                              <span>Convert</span>
                            </Button>
                          ) : (
                            <span className="text-xs text-emerald-700 font-semibold px-2">
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

      {/* Add Enquiry Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-border shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-surface-subtle">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-body-base font-bold text-ink">Record New Admissions Enquiry</h3>
                  <p className="text-body-xs text-ink-muted">Add a prospective student walk-in or telephone lead.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="text-ink-muted hover:text-ink p-1.5 rounded-lg hover:bg-surface transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateEnquiry} className="p-6 space-y-4 overflow-y-auto">
              <div className="space-y-1">
                <label className="text-body-xs font-semibold text-ink">
                  Student Name <span className="text-critical">*</span>
                </label>
                <Input
                  required
                  placeholder="e.g. Priya Sharma"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-body-xs font-semibold text-ink">
                    Phone (10 Digits) <span className="text-critical">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-ink-muted">
                      +91
                    </span>
                    <Input
                      required
                      type="tel"
                      maxLength={10}
                      placeholder="9876543210"
                      className="pl-11"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value.replace(/\D/g, ""))}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-body-xs font-semibold text-ink">Email (Optional)</label>
                  <Input
                    type="email"
                    placeholder="priya@gmail.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-body-xs font-semibold text-ink">Target Class</label>
                  <select
                    value={newClass}
                    onChange={(e) => setNewClass(Number(e.target.value))}
                    className="w-full px-3 py-2 text-body-sm rounded-xl border border-border bg-white text-ink"
                  >
                    <option value="9">Class IX (9th)</option>
                    <option value="10">Class X (10th)</option>
                    <option value="11">Class XI (11th)</option>
                    <option value="12">Class XII (12th)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-body-xs font-semibold text-ink">Board</label>
                  <select
                    value={newBoard}
                    onChange={(e) => setNewBoard(e.target.value as "cbse" | "icse" | "isc")}
                    className="w-full px-3 py-2 text-body-sm rounded-xl border border-border bg-white text-ink uppercase"
                  >
                    <option value="cbse">CBSE</option>
                    <option value="icse">ICSE</option>
                    <option value="isc">ISC</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-body-xs font-semibold text-ink">Inquiry Message / Subject</label>
                <Input
                  placeholder="e.g. Interested in Class 12 Physics & Maths batch"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-body-xs font-semibold text-ink">Counselor / Follow-up Notes</label>
                <Input
                  placeholder="e.g. Walk-in at campus. Callback scheduled for Saturday."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                />
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddOpen(false)}
                  disabled={isSubmittingNew}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingNew}
                  className="gap-2 font-semibold bg-primary text-white hover:bg-primary-hover"
                >
                  {isSubmittingNew ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Record Enquiry</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
