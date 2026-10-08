"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { submitContactEnquiryAction } from "@/server/contact-actions";
import { CheckCircle2, AlertCircle, Send, RotateCcw } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

export function ContactEnquiryForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [classLevel, setClassLevel] = useState<string>("");
  const [board, setBoard] = useState<string>("");
  const [message, setMessage] = useState("");
  const [websiteHp, setWebsiteHp] = useState(""); // Honeypot field

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setFieldErrors({});

    try {
      const res = await submitContactEnquiryAction({
        name,
        phone,
        classLevel: classLevel ? Number(classLevel) : null,
        board: board || null,
        message,
        website_hp: websiteHp,
      });

      if (res.success) {
        trackEvent("enquiry_submitted", {
          classLevel: classLevel ? Number(classLevel) : null,
          board: board || null,
        });
        setSuccessMessage(
          res.message ||
            "Thank you! Your enquiry has been received. Our team will contact you shortly.",
        );
      } else {
        setErrorMessage(
          res.error || "Failed to submit your enquiry. Please check the fields.",
        );
        if (res.fieldErrors) {
          setFieldErrors(res.fieldErrors);
        }
      }
    } catch {
      setErrorMessage("A network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setName("");
    setPhone("");
    setClassLevel("");
    setBoard("");
    setMessage("");
    setWebsiteHp("");
    setSuccessMessage(null);
    setErrorMessage(null);
    setFieldErrors({});
  };

  // If successfully submitted, show clear confirmation card
  if (successMessage) {
    return (
      <div className="rounded-2xl border-2 border-success/30 bg-success/5 p-8 text-center space-y-5 shadow-card animate-in fade-in zoom-in-95 duration-200">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <div className="space-y-2">
          <h3 className="text-h2 font-extrabold text-ink">
            Enquiry Received Successfully!
          </h3>
          <p className="text-body text-ink-muted max-w-md mx-auto leading-relaxed">
            {successMessage}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4 text-small text-ink-muted text-left max-w-md mx-auto space-y-1.5">
          <div className="flex justify-between">
            <span className="font-semibold text-ink">Student Name:</span>
            <span>{name}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-ink">Phone:</span>
            <span>{phone}</span>
          </div>
          {classLevel && (
            <div className="flex justify-between">
              <span className="font-semibold text-ink">Class Level:</span>
              <span>Class {classLevel}</span>
            </div>
          )}
          {board && (
            <div className="flex justify-between">
              <span className="font-semibold text-ink">Board:</span>
              <span className="uppercase">{board}</span>
            </div>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
          className="gap-2 text-small font-semibold"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Submit Another Enquiry</span>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {errorMessage && (
        <div className="rounded-xl border border-danger/30 bg-danger/10 p-4 text-small text-danger flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">Submission Error</div>
            <div>{errorMessage}</div>
          </div>
        </div>
      )}

      {/* Honeypot field (hidden from real users, filled by spambots) */}
      <div
        className="hidden opacity-0 pointer-events-none absolute -top-9999px -left-9999px"
        aria-hidden="true"
        tabIndex={-1}
      >
        <label htmlFor="website_hp">Leave this field blank</label>
        <input
          id="website_hp"
          type="text"
          name="website_hp"
          value={websiteHp}
          onChange={(e) => setWebsiteHp(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {/* Name Input */}
      <div className="space-y-1.5">
        <label htmlFor="name" className="text-small font-semibold text-ink block">
          Student or Parent Name <span className="text-danger">*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          placeholder="e.g. Rahul Sharma"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={`w-full rounded-lg border bg-surface px-3.5 py-2.5 text-body text-ink placeholder:text-ink-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/20 ${
            fieldErrors.name ? "border-danger focus:border-danger" : "border-border focus:border-primary"
          }`}
        />
        {fieldErrors.name && (
          <p className="text-caption text-danger">{fieldErrors.name}</p>
        )}
      </div>

      {/* Phone Input */}
      <div className="space-y-1.5">
        <label htmlFor="phone" className="text-small font-semibold text-ink block">
          Mobile Number (WhatsApp Preferred) <span className="text-danger">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-3.5 top-2.5 text-body text-ink-muted select-none">
            +91
          </span>
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            maxLength={14}
            placeholder="9876543210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={`w-full rounded-lg border bg-surface pl-13 pr-3.5 py-2.5 text-body text-ink placeholder:text-ink-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/20 ${
              fieldErrors.phone ? "border-danger focus:border-danger" : "border-border focus:border-primary"
            }`}
          />
        </div>
        {fieldErrors.phone && (
          <p className="text-caption text-danger">{fieldErrors.phone}</p>
        )}
      </div>

      {/* Class Level & Board Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="classLevel" className="text-small font-semibold text-ink block">
            Target Class
          </label>
          <select
            id="classLevel"
            name="classLevel"
            value={classLevel}
            onChange={(e) => setClassLevel(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-body text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Select Class</option>
            <option value="9">Class IX (9th)</option>
            <option value="10">Class X (10th)</option>
            <option value="11">Class XI (11th)</option>
            <option value="12">Class XII (12th)</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="board" className="text-small font-semibold text-ink block">
            School Board
          </label>
          <select
            id="board"
            name="board"
            value={board}
            onChange={(e) => setBoard(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-body text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Select Board</option>
            <option value="cbse">CBSE</option>
            <option value="icse">ICSE / ISC</option>
            <option value="up_board">UP Board</option>
            <option value="other">Other State Board</option>
          </select>
        </div>
      </div>

      {/* Message Textarea */}
      <div className="space-y-1.5">
        <label htmlFor="message" className="text-small font-semibold text-ink block">
          Your Question or Query (Optional)
        </label>
        <textarea
          id="message"
          name="message"
          rows={3}
          maxLength={1000}
          placeholder="Ask about batch timings, fees, demo classes, or student foundation level..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-body text-ink placeholder:text-ink-muted/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
        />
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        variant="primary"
        disabled={loading}
        className="w-full gap-2 text-body font-bold py-3 shadow-md"
      >
        <Send className="h-4 w-4" />
        <span>{loading ? "Submitting Enquiry..." : "Submit Admissions Enquiry"}</span>
      </Button>

      <p className="text-caption text-ink-muted text-center">
        🔒 Your phone number is strictly used for admissions counseling. No spam, ever.
      </p>
    </form>
  );
}
