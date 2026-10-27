"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { registerStudentAction } from "@/server/admin-actions";
import {
  UserPlus,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  GraduationCap,
  Users,
  CreditCard,
  Building2,
} from "lucide-react";
import { formatINR } from "@quick2learn/shared";

export interface AvailableBatchItem {
  id: string;
  title: string;
  feePlans?: Array<{
    id: string;
    name: string;
    totalPaise: number;
  }>;
}

interface RegisterStudentModalProps {
  availableBatches?: AvailableBatchItem[];
  triggerClassName?: string;
  triggerLabel?: string;
  triggerVariant?: "primary" | "outline" | "ghost";
}

export function RegisterStudentModal({
  availableBatches = [],
  triggerClassName,
  triggerLabel = "Register Student",
  triggerVariant = "primary",
}: RegisterStudentModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [classLevel, setClassLevel] = useState<number>(12);
  const [board, setBoard] = useState<"cbse" | "icse" | "isc">("cbse");
  const [school, setSchool] = useState("");
  const [city, setCity] = useState("Mathura");
  const [parentName, setParentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [selectedFeePlanId, setSelectedFeePlanId] = useState("");

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const selectedBatch = availableBatches.find((b) => b.id === selectedBatchId);
  const availableFeePlans = selectedBatch?.feePlans || [];

  const resetForm = () => {
    setName("");
    setPhone("");
    setEmail("");
    setClassLevel(12);
    setBoard("cbse");
    setSchool("");
    setCity("Mathura");
    setParentName("");
    setParentPhone("");
    setSelectedBatchId("");
    setSelectedFeePlanId("");
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleOpen = () => {
    resetForm();
    setIsOpen(true);
  };

  const handleClose = () => {
    if (isPending) return;
    setIsOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setErrorMessage("Please enter a valid 10-digit student phone number.");
      return;
    }

    if (!name.trim()) {
      setErrorMessage("Student full name is required.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await registerStudentAction({
          name: name.trim(),
          phone: cleanPhone.slice(-10),
          email: email.trim() || undefined,
          classLevel,
          board,
          school: school.trim() || undefined,
          city: city.trim() || undefined,
          parentName: parentName.trim() || undefined,
          parentPhone: parentPhone.trim() ? parentPhone.replace(/\D/g, "").slice(-10) : undefined,
          batchId: selectedBatchId || undefined,
          feePlanId: selectedFeePlanId || undefined,
        });

        if (!res.success) {
          throw new Error(res.error || "Failed to register student");
        }

        setSuccessMessage("Student successfully registered!");
        setTimeout(() => {
          setIsOpen(false);
          router.refresh();
        }, 800);
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : "Failed to register student");
      }
    });
  };

  return (
    <>
      <Button
        onClick={handleOpen}
        variant={triggerVariant}
        className={triggerClassName || "gap-2 font-semibold shadow-xs bg-primary text-white hover:bg-primary-hover"}
      >
        <UserPlus className="w-4 h-4" />
        <span>{triggerLabel}</span>
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-border shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-surface-subtle">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-body-base font-bold text-ink">Register New Student</h2>
                  <p className="text-body-xs text-ink-muted">
                    Create profile, assign classes, and optionally enroll in an active batch.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="text-ink-muted hover:text-ink p-1.5 rounded-lg hover:bg-surface transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content / Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-critical/10 border border-critical/30 text-critical text-body-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-body-xs flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span className="font-semibold">{successMessage}</span>
                </div>
              )}

              {/* Section 1: Basic Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-ink-muted uppercase tracking-wider">
                  <GraduationCap className="w-3.5 h-3.5 text-primary" />
                  <span>Student Details</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-body-xs font-semibold text-ink">
                      Student Full Name <span className="text-critical">*</span>
                    </label>
                    <Input
                      required
                      placeholder="e.g. Aarav Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-body-xs font-semibold text-ink">
                      Mobile Phone (10 Digits) <span className="text-critical">*</span>
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
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-body-xs font-semibold text-ink">Email Address (Optional)</label>
                    <Input
                      type="email"
                      placeholder="aarav@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Academic Info */}
              <div className="space-y-3 pt-2 border-t border-border">
                <div className="flex items-center gap-2 text-xs font-bold text-ink-muted uppercase tracking-wider">
                  <Building2 className="w-3.5 h-3.5 text-primary" />
                  <span>Academic Profile</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-body-xs font-semibold text-ink">Class Level</label>
                    <select
                      value={classLevel}
                      onChange={(e) => setClassLevel(Number(e.target.value))}
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
                      value={board}
                      onChange={(e) => setBoard(e.target.value as "cbse" | "icse" | "isc")}
                      className="w-full px-3 py-2 text-body-sm rounded-xl border border-border bg-white text-ink uppercase"
                    >
                      <option value="cbse">CBSE</option>
                      <option value="icse">ICSE</option>
                      <option value="isc">ISC</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-body-xs font-semibold text-ink">School Name (Optional)</label>
                    <Input
                      placeholder="e.g. St. Dominic's Senior Secondary School"
                      value={school}
                      onChange={(e) => setSchool(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-body-xs font-semibold text-ink">City</label>
                    <Input
                      placeholder="Mathura"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Parent / Guardian Details */}
              <div className="space-y-3 pt-2 border-t border-border">
                <div className="flex items-center gap-2 text-xs font-bold text-ink-muted uppercase tracking-wider">
                  <Users className="w-3.5 h-3.5 text-primary" />
                  <span>Parent / Guardian (Optional)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-body-xs font-semibold text-ink">Parent / Guardian Name</label>
                    <Input
                      placeholder="e.g. Ramesh Sharma"
                      value={parentName}
                      onChange={(e) => setParentName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-body-xs font-semibold text-ink">Parent Mobile Phone</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-ink-muted">
                        +91
                      </span>
                      <Input
                        type="tel"
                        maxLength={10}
                        placeholder="9876543211"
                        className="pl-11"
                        value={parentPhone}
                        onChange={(e) => setParentPhone(e.target.value.replace(/\D/g, ""))}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 4: Batch & Fee Enrollment */}
              {availableBatches.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-border">
                  <div className="flex items-center gap-2 text-xs font-bold text-ink-muted uppercase tracking-wider">
                    <CreditCard className="w-3.5 h-3.5 text-primary" />
                    <span>Initial Batch Enrollment (Optional)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-body-xs font-semibold text-ink">Course Batch</label>
                      <select
                        value={selectedBatchId}
                        onChange={(e) => {
                          const bid = e.target.value;
                          setSelectedBatchId(bid);
                          const b = availableBatches.find((item) => item.id === bid);
                          setSelectedFeePlanId(b?.feePlans?.[0]?.id || "");
                        }}
                        className="w-full px-3 py-2 text-body-sm rounded-xl border border-border bg-white text-ink"
                      >
                        <option value="">Do not enroll in a batch right now</option>
                        {availableBatches.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedBatchId && availableFeePlans.length > 0 && (
                      <div className="space-y-1 sm:col-span-2">
                        <label className="text-body-xs font-semibold text-ink">
                          Fee Instalment Plan
                        </label>
                        <select
                          value={selectedFeePlanId}
                          onChange={(e) => setSelectedFeePlanId(e.target.value)}
                          className="w-full px-3 py-2 text-body-sm rounded-xl border border-border bg-white text-ink"
                        >
                          {availableFeePlans.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} · {formatINR(p.totalPaise)}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Footer Buttons */}
              <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="gap-2 font-semibold bg-primary text-white hover:bg-primary-hover"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Registering...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Register Student</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
