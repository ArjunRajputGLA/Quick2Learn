"use client";

import * as React from "react";
import { useActionState } from "react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { submitEnquiryAction, type EnquiryActionState } from "@/server/enquiry-actions";
import { CheckCircle2, Loader2, Send } from "lucide-react";

export interface EnquiryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batchTitle?: string;
  defaultClassLevel?: number;
}

const initialState: EnquiryActionState = {
  success: false,
  message: "",
};

export function EnquiryDialog({
  open,
  onOpenChange,
  batchTitle,
  defaultClassLevel,
}: EnquiryDialogProps) {
  const [state, formAction, isPending] = useActionState(submitEnquiryAction, initialState);
  const [submitted, setSubmitted] = React.useState(false);

  React.useEffect(() => {
    if (state.success) {
      setSubmitted(true);
    }
  }, [state.success]);

  React.useEffect(() => {
    if (!open) {
      setSubmitted(false);
    }
  }, [open]);

  const handleClose = () => {
    onOpenChange(false);
    // Reset submitted state when closed
    if (submitted) {
      setTimeout(() => setSubmitted(false), 300);
    }
  };

  const currentPath = typeof window !== "undefined" ? window.location.pathname : "/";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogHeader>
        <DialogTitle>
          {batchTitle ? `Enquire for ${batchTitle}` : "Enquire for Admissions (Session 2026–27)"}
        </DialogTitle>
        <DialogDescription>
          Leave your contact details to speak directly with our academic mentors at Quick2Learn Mathura.
        </DialogDescription>
      </DialogHeader>

      {submitted ? (
        <div className="py-6 text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-success/10 text-success mx-auto flex items-center justify-center">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h4 className="text-h3 font-semibold text-ink">Enquiry Received!</h4>
            <p className="text-small text-ink-muted max-w-sm mx-auto">
              {state.message || "Thank you! Our admission team will contact you within 24 hours."}
            </p>
          </div>
          <div className="pt-2">
            <Button variant="primary" onClick={handleClose}>
              Done
            </Button>
          </div>
        </div>
      ) : (
        <form action={formAction} className="space-y-4 pt-2">
          {/* Honeypot field - hidden from human users */}
          <div className="hidden" aria-hidden="true">
            <label htmlFor="website_hp">Leave this empty</label>
            <input
              type="text"
              id="website_hp"
              name="website_hp"
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          <input type="hidden" name="sourcePath" value={currentPath} />

          <div className="space-y-1.5">
            <label htmlFor="enquiry-name" className="text-caption font-semibold text-ink">
              Student / Parent Full Name <span className="text-danger">*</span>
            </label>
            <Input
              id="enquiry-name"
              name="name"
              type="text"
              placeholder="e.g. Ramesh Sharma"
              required
              autoFocus
            />
            {state.fieldErrors?.name && (
              <p className="text-caption text-danger">{state.fieldErrors.name[0]}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="enquiry-phone" className="text-caption font-semibold text-ink">
              10-Digit Mobile / WhatsApp Number <span className="text-danger">*</span>
            </label>
            <Input
              id="enquiry-phone"
              name="phone"
              type="tel"
              placeholder="e.g. 9897012345"
              required
            />
            {state.fieldErrors?.phone && (
              <p className="text-caption text-danger">{state.fieldErrors.phone[0]}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="enquiry-class" className="text-caption font-semibold text-ink">
                Class
              </label>
              <select
                id="enquiry-class"
                name="classLevel"
                defaultValue={defaultClassLevel ? String(defaultClassLevel) : "12"}
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-small text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <option value="9">Class IX</option>
                <option value="10">Class X</option>
                <option value="11">Class XI</option>
                <option value="12">Class XII</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="enquiry-board" className="text-caption font-semibold text-ink">
                Board
              </label>
              <select
                id="enquiry-board"
                name="board"
                defaultValue="cbse"
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-small text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <option value="cbse">CBSE</option>
                <option value="icse">ICSE</option>
                <option value="isc">ISC</option>
                <option value="up_board">UP Board</option>
                <option value="other">Other State Board</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="enquiry-message" className="text-caption font-semibold text-ink">
              Specific Questions or Message (Optional)
            </label>
            <textarea
              id="enquiry-message"
              name="message"
              rows={2}
              placeholder="e.g. Interested in morning batch or online live sessions..."
              className="w-full rounded-md border border-border bg-surface p-3 text-small text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>

          {state.message && !state.success && (
            <div className="rounded-md bg-danger/10 p-2.5 text-caption text-danger">
              {state.message}
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
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
              variant="primary"
              disabled={isPending}
              className="gap-1.5"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Submit Enquiry</span>
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
