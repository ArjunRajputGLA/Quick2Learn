"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { updateProfileSchema, type UpdateProfileInput } from "@quick2learn/shared";
import { updateProfileAction } from "@/server/profile-actions";
import { signOut } from "@/lib/auth-client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Phone,
  Mail,
  School,
  MapPin,
  GraduationCap,
  ShieldAlert,
  LogOut,
  Save,
  Users,
} from "lucide-react";

interface StudentProfileFormProps {
  initialData: {
    fullName: string;
    email: string;
    phone?: string | null;
    classLevel?: number | null;
    board?: string | null;
    school?: string | null;
    city?: string | null;
    parentName?: string | null;
    parentPhone?: string | null;
    role: string;
    onboardedAt?: Date | null;
  };
}

export function StudentProfileForm({ initialData }: StudentProfileFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<UpdateProfileInput>({
    defaultValues: {
      fullName: initialData.fullName || "",
      phone: initialData.phone || "",
      classLevel: (initialData.classLevel as 9 | 10 | 11 | 12) || 12,
      board: (initialData.board as "cbse" | "icse" | "isc") || "cbse",
      school: initialData.school || "",
      city: initialData.city || "Mathura",
      parentName: initialData.parentName || "",
      parentPhone: initialData.parentPhone || "",
    },
  });

  const onSubmit = async (values: UpdateProfileInput) => {
    const parsed = updateProfileSchema.safeParse({
      ...values,
      classLevel: values.classLevel ? Number(values.classLevel) : undefined,
    });
    if (!parsed.success) {
      for (const err of parsed.error.errors) {
        const fieldName = err.path[0] as keyof UpdateProfileInput;
        if (fieldName) {
          setError(fieldName, { message: err.message });
        }
      }
      toast.error(parsed.error.errors[0]?.message || "Please fix validation errors");
      return;
    }

    setIsSaving(true);
    try {
      const res = await updateProfileAction(parsed.data);
      if (res.success) {
        toast.success("Profile details updated successfully");
        router.refresh();
      } else {
        toast.error(res.error || "Failed to update profile");
      }
    } catch {
      toast.error("An error occurred while saving your profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      toast.success("Signed out successfully");
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Failed to sign out");
      setIsSigningOut(false);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* SECTION 1: PERSONAL DETAILS */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white border border-border shadow-xs space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-border">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-body-lg font-bold text-ink">
                Personal Student Details
              </h2>
              <p className="text-caption text-ink-muted">
                Your official identification details for institute records and attendance.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="fullName" className="text-caption font-semibold text-ink">
                Full Name <span className="text-critical">*</span>
              </label>
              <input
                id="fullName"
                type="text"
                {...register("fullName")}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-white text-body-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                placeholder="Student full name"
              />
              {errors.fullName && (
                <p className="text-caption text-critical">{errors.fullName.message}</p>
              )}
            </div>

            {/* Email Address (Read-only) */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-caption font-semibold text-ink-muted flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                <span>Email Address (Account ID)</span>
              </label>
              <input
                id="email"
                type="email"
                value={initialData.email}
                disabled
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-neutral-subtle/50 text-body-sm text-ink-muted cursor-not-allowed select-none"
              />
              <span className="text-[11px] text-ink-muted">Linked to your login account</span>
            </div>

            {/* Phone Number */}
            <div className="space-y-1.5">
              <label htmlFor="phone" className="text-caption font-semibold text-ink flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" />
                <span>Student Mobile (WhatsApp)</span>
              </label>
              <input
                id="phone"
                type="tel"
                {...register("phone")}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-white text-body-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                placeholder="10-digit mobile number"
              />
              {errors.phone && (
                <p className="text-caption text-critical">{errors.phone.message}</p>
              )}
            </div>

            {/* Class Level */}
            <div className="space-y-1.5">
              <label htmlFor="classLevel" className="text-caption font-semibold text-ink flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Academic Grade (Class)</span>
              </label>
              <select
                id="classLevel"
                {...register("classLevel", { valueAsNumber: true })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-white text-body-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              >
                <option value={9}>Class IX (9th)</option>
                <option value={10}>Class X (10th)</option>
                <option value={11}>Class XI (11th)</option>
                <option value={12}>Class XII (12th)</option>
              </select>
            </div>

            {/* Education Board */}
            <div className="space-y-1.5">
              <label htmlFor="board" className="text-caption font-semibold text-ink">
                Educational Board
              </label>
              <select
                id="board"
                {...register("board")}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-white text-body-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              >
                <option value="cbse">CBSE</option>
                <option value="icse">ICSE</option>
                <option value="isc">ISC</option>
              </select>
            </div>

            {/* School Name */}
            <div className="space-y-1.5">
              <label htmlFor="school" className="text-caption font-semibold text-ink flex items-center gap-1.5">
                <School className="w-3.5 h-3.5" />
                <span>School / College Name</span>
              </label>
              <input
                id="school"
                type="text"
                {...register("school")}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-white text-body-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                placeholder="e.g. St. Dominic's, Mathura"
              />
            </div>

            {/* City */}
            <div className="space-y-1.5">
              <label htmlFor="city" className="text-caption font-semibold text-ink flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                <span>City / Town</span>
              </label>
              <input
                id="city"
                type="text"
                {...register("city")}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-white text-body-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                placeholder="e.g. Mathura"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: PARENT / GUARDIAN DETAILS */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white border border-border shadow-xs space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-border">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-body-lg font-bold text-ink">
                Parent / Guardian Contact
              </h2>
              <p className="text-caption text-ink-muted">
                Used for attendance SMS, fee receipts, and performance consultations.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Parent Name */}
            <div className="space-y-1.5">
              <label htmlFor="parentName" className="text-caption font-semibold text-ink">
                Parent / Guardian Name
              </label>
              <input
                id="parentName"
                type="text"
                {...register("parentName")}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-white text-body-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                placeholder="Father / Mother / Guardian name"
              />
            </div>

            {/* Parent Phone */}
            <div className="space-y-1.5">
              <label htmlFor="parentPhone" className="text-caption font-semibold text-ink">
                Parent Contact Mobile
              </label>
              <input
                id="parentPhone"
                type="tel"
                {...register("parentPhone")}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-white text-body-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                placeholder="10-digit mobile number"
              />
              {errors.parentPhone && (
                <p className="text-caption text-critical">{errors.parentPhone.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 3: ROLE & SECURITY (STRICTLY READ-ONLY) */}
        <div className="p-5 rounded-2xl bg-neutral-subtle/40 border border-border flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-neutral-subtle text-ink-muted shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <span className="text-caption font-semibold text-ink block">
                Account Role: <strong className="uppercase text-primary font-bold">{initialData.role}</strong>
              </span>
              <span className="text-[11px] text-ink-muted block mt-0.5">
                Roles cannot be altered by users. Access is verified on each server request.
              </span>
            </div>
          </div>
          <Badge variant="neutral" className="capitalize text-xs font-mono">
            {initialData.role}
          </Badge>
        </div>

        {/* SAVE CHANGES BUTTON */}
        <div className="flex items-center justify-between gap-4 pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white hover:bg-primary-hover font-semibold text-body-sm shadow-xs transition-all disabled:opacity-60 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? "Saving..." : "Save Profile Details"}</span>
          </button>
        </div>
      </form>

      {/* SECTION 4: SIGN OUT SECTION */}
      <div className="pt-6 border-t border-border flex items-center justify-between">
        <div>
          <h3 className="text-body font-bold text-ink">
            Sign out of Quick2Learn
          </h3>
          <p className="text-caption text-ink-muted">
            You will need to sign in again with your email OTP to access your dashboard.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-critical/30 bg-critical-soft/30 hover:bg-critical-soft/60 text-critical font-bold text-body-sm transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>{isSigningOut ? "Signing out..." : "Sign Out"}</span>
        </button>
      </div>
    </div>
  );
}
