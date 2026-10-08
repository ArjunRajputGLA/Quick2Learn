"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  ACADEMIC_BOARDS,
  ACADEMIC_CLASSES,
  SUBJECTS,
  type AcademicBoard,
  type AcademicClass,
  type Subject,
} from "@quick2learn/shared";
import { submitLeadInquiry } from "@/server/lead-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, CheckCircle2, BookOpen } from "lucide-react";

interface FormValues {
  studentName: string;
  parentName: string;
  phone: string;
  email: string;
  grade: AcademicClass;
  board: AcademicBoard;
  subjectsOfInterest: Subject[];
  message: string;
}

export function LeadCaptureForm() {
  const [isPending, startTransition] = React.useTransition();
  const [isSubmitted, setIsSubmitted] = React.useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      studentName: "",
      parentName: "",
      phone: "",
      email: "",
      grade: "X",
      board: "CBSE",
      subjectsOfInterest: ["Mathematics"],
      message: "",
    },
  });

  const selectedSubjects = watch("subjectsOfInterest") || [];

  const handleSubjectToggle = (subject: Subject) => {
    if (selectedSubjects.includes(subject)) {
      if (selectedSubjects.length > 1) {
        setValue(
          "subjectsOfInterest",
          selectedSubjects.filter((s) => s !== subject),
        );
      } else {
        toast.error("Please keep at least one subject selected");
      }
    } else {
      setValue("subjectsOfInterest", [...selectedSubjects, subject]);
    }
  };

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      try {
        const result = await submitLeadInquiry(data);
        if (result.success) {
          setIsSubmitted(true);
          toast.success("Thank you! Quick2Learn will contact you shortly.");
          reset();
        } else {
          toast.error(result.error || "Failed to submit inquiry. Please try again.");
        }
      } catch {
        toast.error("An unexpected error occurred. Please try again.");
      }
    });
  };

  if (isSubmitted) {
    return (
      <div className="rounded-xl border border-primary-soft bg-primary-soft/50 p-8 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-primary mb-4" />
        <h3 className="text-xl font-bold text-ink mb-2">Inquiry Received!</h3>
        <p className="text-ink-muted mb-6 max-w-md mx-auto text-sm">
          Thank you for reaching out to Quick2Learn. Mr. Dinesh Singh Rajput’s team in
          Mathura will get in touch with you regarding upcoming batch schedules.
        </p>
        <Button
          variant="outline"
          onClick={() => setIsSubmitted(false)}
          className="border-primary/30 text-primary hover:bg-primary-soft"
        >
          Submit Another Inquiry
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-caption font-semibold uppercase tracking-wider text-ink mb-1">
            Student Name *
          </label>
          <Input
            placeholder="e.g. Rahul Sharma"
            {...register("studentName", { required: "Student name is required" })}
          />
          {errors.studentName && (
            <p className="text-caption text-danger mt-1">{errors.studentName.message}</p>
          )}
        </div>

        <div>
          <label className="block text-caption font-semibold uppercase tracking-wider text-ink mb-1">
            Parent / Guardian Name
          </label>
          <Input placeholder="e.g. Rajesh Sharma" {...register("parentName")} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-caption font-semibold uppercase tracking-wider text-ink mb-1">
            Mobile Number (10 digits) *
          </label>
          <Input
            type="tel"
            placeholder="e.g. 9876543210"
            {...register("phone", {
              required: "Mobile number is required",
              pattern: {
                value: /^[6-9]\d{9}$/,
                message: "Enter a valid 10-digit Indian mobile number",
              },
            })}
          />
          {errors.phone && (
            <p className="text-caption text-danger mt-1">{errors.phone.message}</p>
          )}
        </div>

        <div>
          <label className="block text-caption font-semibold uppercase tracking-wider text-ink mb-1">
            Email Address
          </label>
          <Input
            type="email"
            placeholder="e.g. student@example.com"
            {...register("email")}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-caption font-semibold uppercase tracking-wider text-ink mb-1">
            Academic Class *
          </label>
          <select
            {...register("grade", { required: true })}
            className="flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {ACADEMIC_CLASSES.map((cls) => (
              <option key={cls} value={cls}>
                Class {cls}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-caption font-semibold uppercase tracking-wider text-ink mb-1">
            Board *
          </label>
          <select
            {...register("board", { required: true })}
            className="flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {ACADEMIC_BOARDS.map((bd) => (
              <option key={bd} value={bd}>
                {bd}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-caption font-semibold uppercase tracking-wider text-ink mb-1.5">
          Subjects of Interest *
        </label>
        <div className="flex flex-wrap gap-2">
          {SUBJECTS.map((sub) => {
            const isSelected = selectedSubjects.includes(sub);
            return (
              <button
                key={sub}
                type="button"
                onClick={() => handleSubjectToggle(sub)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-caption font-medium transition-all ${
                  isSelected
                    ? "border-primary bg-primary text-white font-semibold shadow-xs"
                    : "border-border bg-surface text-ink hover:bg-surface-subtle"
                }`}
              >
                <BookOpen className="h-3.5 w-3.5" />
                {sub}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-caption font-semibold uppercase tracking-wider text-ink mb-1">
          Message / Specific Goal (Optional)
        </label>
        <textarea
          rows={2}
          placeholder="e.g. Looking for Mathematics batch for Class XII Board exam preparation..."
          {...register("message")}
          className="flex w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary placeholder:text-ink-muted"
        />
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="w-full bg-primary hover:bg-primary-hover text-white font-medium py-2.5 h-11"
      >
        {isPending ? (
          "Submitting Inquiry..."
        ) : (
          <span className="inline-flex items-center gap-2">
            Register Early Interest <Send className="h-4 w-4" />
          </span>
        )}
      </Button>
    </form>
  );
}
