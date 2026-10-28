"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, UserPlus, Trash2, Mail, Phone, HeartHandshake, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface LinkedParent {
  id: string;
  parentUserId: string;
  relation: string;
  verifiedAt: Date | string;
  createdAt: Date | string;
  name: string | null;
  email: string | null;
  phone: string | null;
}

interface StudentParentsSectionProps {
  studentId: string;
  studentName: string;
  linkedParents: LinkedParent[];
}

export function StudentParentsSection({
  studentId,
  studentName,
  linkedParents,
}: StudentParentsSectionProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [parentIdentifier, setParentIdentifier] = useState("");
  const [relation, setRelation] = useState("parent");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleLinkParent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentIdentifier.trim()) {
      toast.error("Please enter a parent email or 10-digit phone number");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/v1/admin/students/${studentId}/parents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentIdentifier: parentIdentifier.trim(),
          relation,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || json.message || "Failed to link parent");
      }

      toast.success("Parent linked successfully!");
      setModalOpen(false);
      setParentIdentifier("");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to link parent");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnlink = async (linkId: string, parentName: string) => {
    if (!confirm(`Are you sure you want to remove ${parentName} as a linked parent?`)) {
      return;
    }

    try {
      setDeletingId(linkId);
      const res = await fetch(`/api/v1/admin/students/${studentId}/parents`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkId }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || json.message || "Failed to remove parent link");
      }

      toast.success("Parent link removed");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to remove parent link");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <HeartHandshake className="w-5 h-5 text-primary" />
          <h2 className="text-body-md font-bold text-ink">
            Linked Parents & Guardians ({linkedParents.length})
          </h2>
        </div>
        <Button
          onClick={() => setModalOpen(true)}
          size="sm"
          variant="outline"
          className="gap-1.5 text-xs font-semibold border-primary text-primary hover:bg-primary/5"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Link Parent by Hand</span>
        </Button>
      </div>

      {linkedParents.length === 0 ? (
        <div className="text-center py-6 border border-dashed border-border rounded-xl bg-surface-subtle/50">
          <Users className="w-8 h-8 text-ink-muted/50 mx-auto mb-2" />
          <p className="text-body-sm font-semibold text-ink">No parents linked yet</p>
          <p className="text-body-xs text-ink-muted mt-1 max-w-sm mx-auto">
            Link a parent so they can monitor attendance, test performance, and receive fee notices in the parent mobile app.
          </p>
          <Button
            onClick={() => setModalOpen(true)}
            size="sm"
            className="mt-3 text-xs"
          >
            <UserPlus className="w-3.5 h-3.5 mr-1.5" />
            Link First Parent
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {linkedParents.map((p) => (
            <div
              key={p.id}
              className="p-4 rounded-xl border border-border bg-surface-subtle/30 hover:border-primary/30 transition-all flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-body-sm font-bold text-ink">{p.name || "Parent Account"}</p>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary">
                        {p.relation}
                      </span>
                    </div>
                    <p className="text-body-xs text-ink-muted mt-0.5">
                      User ID: <span className="font-mono">{p.parentUserId}</span>
                    </p>
                  </div>
                  <Button
                    onClick={() => handleUnlink(p.id, p.name || "Parent")}
                    variant="ghost"
                    size="sm"
                    disabled={deletingId === p.id}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1.5 h-auto rounded-lg"
                    title="Remove parent link"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-1 pt-1 text-body-xs text-ink-muted">
                  {p.email && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-ink-muted shrink-0" />
                      <span className="truncate">{p.email}</span>
                    </div>
                  )}
                  {p.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-ink-muted shrink-0" />
                      <span className="font-mono">{p.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Verified link</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Link Parent Modal */}
      {modalOpen && (
        <div
          onClick={() => setModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200/90 space-y-4 animate-in zoom-in-95 duration-150"
          >
            <div>
              <h3 className="text-body-md font-bold text-ink">Link Parent to {studentName}</h3>
              <p className="text-body-xs text-ink-muted mt-1">
                Enter the parent's registered email address or 10-digit Indian mobile number.
              </p>
            </div>

            <form onSubmit={handleLinkParent} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-body-xs font-semibold text-ink">
                  Parent Email or Mobile Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. 9876543210 or parent@gmail.com"
                  value={parentIdentifier}
                  onChange={(e) => setParentIdentifier(e.target.value)}
                  className="w-full px-3.5 py-2 border border-border rounded-xl text-body-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-body-xs font-semibold text-ink">
                  Relationship to Student
                </label>
                <select
                  value={relation}
                  onChange={(e) => setRelation(e.target.value)}
                  className="w-full px-3.5 py-2 border border-border rounded-xl text-body-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                >
                  <option value="father">Father</option>
                  <option value="mother">Mother</option>
                  <option value="guardian">Guardian</option>
                  <option value="parent">Parent</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="gap-1.5"
                >
                  {isSubmitting ? "Linking..." : "Link Parent"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
