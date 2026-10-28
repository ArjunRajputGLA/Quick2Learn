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
        className={triggerClassName || "h-8 px-3 text-xs gap-1.5 font-semibold shadow-2xs bg-blue-600 text-white hover:bg-blue-700 rounded-lg"}
      >
        <UserPlus className="w-3.5 h-3.5" />
        <span>{triggerLabel}</span>
      </Button>

      {isOpen && (
        <div
          onClick={handleClose}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl border border-slate-200/80 shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
          >
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Register New Student</h2>
                  <p className="text-xs text-slate-500">
                    Create profile, assign classes, and optionally enroll in an active batch.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content / Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-3.5 overflow-y-auto flex-1">
              {errorMessage && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                  <span className="font-semibold">{successMessage}</span>
                </div>
              )}

              {/* Section 1: Basic Info */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <GraduationCap className="w-3 h-3 text-blue-600" />
                  <span>Student Details</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700">
                      Student Full Name <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      required
                      placeholder="e.g. Aarav Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-8 text-xs rounded-lg border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700">
                      Mobile Phone (10 Digits) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-slate-400">
                        +91
                      </span>
                      <Input
                        required
                        type="tel"
                        maxLength={10}
                        placeholder="9876543210"
                        className="pl-9 h-8 text-xs rounded-lg border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700">Email Address (Optional)</label>
                    <Input
                      type="email"
                      placeholder="aarav@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-8 text-xs rounded-lg border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Academic Info */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <Building2 className="w-3 h-3 text-blue-600" />
                  <span>Academic Profile</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700">Class Level</label>
                    <select
                      value={classLevel}
                      onChange={(e) => setClassLevel(Number(e.target.value))}
                      className="w-full px-2.5 h-8 text-xs rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-800 font-medium"
                    >
                      <option value="9">Class IX (9th)</option>
                      <option value="10">Class X (10th)</option>
                      <option value="11">Class XI (11th)</option>
                      <option value="12">Class XII (12th)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700">Board</label>
                    <select
                      value={board}
                      onChange={(e) => setBoard(e.target.value as "cbse" | "icse" | "isc")}
                      className="w-full px-2.5 h-8 text-xs rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-800 font-medium uppercase"
                    >
                      <option value="cbse">CBSE</option>
                      <option value="icse">ICSE</option>
                      <option value="isc">ISC</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700">School (Optional)</label>
                    <Input
                      placeholder="e.g. St. Dominic's"
                      value={school}
                      onChange={(e) => setSchool(e.target.value)}
                      className="h-8 text-xs rounded-lg border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700">City</label>
                    <Input
                      placeholder="Mathura"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="h-8 text-xs rounded-lg border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Parent / Guardian Details */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <Users className="w-3 h-3 text-blue-600" />
                  <span>Parent / Guardian (Optional)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700">Parent / Guardian Name</label>
                    <Input
                      placeholder="e.g. Ramesh Sharma"
                      value={parentName}
                      onChange={(e) => setParentName(e.target.value)}
                      className="h-8 text-xs rounded-lg border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700">Parent Mobile Phone</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-slate-400">
                        +91
                      </span>
                      <Input
                        type="tel"
                        maxLength={10}
                        placeholder="9876543211"
                        className="pl-9 h-8 text-xs rounded-lg border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white"
                        value={parentPhone}
                        onChange={(e) => setParentPhone(e.target.value.replace(/\D/g, ""))}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 4: Batch & Fee Enrollment */}
              {availableBatches.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <CreditCard className="w-3 h-3 text-blue-600" />
                    <span>Initial Batch Enrollment (Optional)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700">Course Batch</label>
                      <select
                        value={selectedBatchId}
                        onChange={(e) => {
                          const bid = e.target.value;
                          setSelectedBatchId(bid);
                          const b = availableBatches.find((item) => item.id === bid);
                          setSelectedFeePlanId(b?.feePlans?.[0]?.id || "");
                        }}
                        className="w-full px-2.5 h-8 text-xs rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-800 font-medium"
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
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-700">
                          Fee Instalment Plan
                        </label>
                        <select
                          value={selectedFeePlanId}
                          onChange={(e) => setSelectedFeePlanId(e.target.value)}
                          className="w-full px-2.5 h-8 text-xs rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-800 font-medium"
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
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isPending}
                  className="h-8 px-3 text-xs rounded-lg border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="h-8 px-3.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-2xs gap-1.5"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Registering...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
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
