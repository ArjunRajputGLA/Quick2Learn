import { Metadata } from "next";
import { DeleteAccountClient } from "@/components/marketing/delete-account-client";
import { AlertTriangle, FileText, HelpCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Account & Data Deletion | Quick2Learn",
  description:
    "Request permanent deletion of your Quick2Learn student or parent account and personal data in compliance with Google Play Store policies.",
};

export default function DeleteAccountPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl space-y-10">
      {/* Title */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs font-semibold border border-red-200">
          <AlertTriangle className="w-3.5 h-3.5" /> Google Play Data Safety Compliance
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
          Quick2Learn Account &amp; Data Deletion
        </h1>
        <p className="text-sm sm:text-base text-gray-600 max-w-xl mx-auto leading-relaxed">
          You can request the permanent deletion and anonymization of your Quick2Learn account and associated personal data at any time.
        </p>
      </div>

      {/* Policy & Disclosure Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-red-600 font-bold text-sm">
            <AlertTriangle className="w-4 h-4" /> Data Deleted Immediately
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            Your full name, phone number, email address, profile photo, school details, enrolled batch memberships, student-teacher doubt conversations, and active sessions are permanently erased.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-blue-600 font-bold text-sm">
            <FileText className="w-4 h-4" /> Data Retained for Statutory Law
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            Historical fee receipts (Q2L-YYYY-XXXXXX) and payment audit records are retained for 7 years under Indian taxation and accounting laws, but are dissociated from your identity and marked as &apos;Deleted Account&apos;.
          </p>
        </div>
      </div>

      {/* Interactive Deletion Form */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4 text-center">
          Request Account Deletion via OTP
        </h2>
        <DeleteAccountClient />
      </div>

      {/* Center Contact & Manual Request */}
      <div className="p-6 rounded-2xl bg-gray-50 border border-gray-200 text-center space-y-2">
        <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-gray-700">
          <HelpCircle className="w-4 h-4 text-gray-500" /> Need Assistance with Account Removal?
        </div>
        <p className="text-xs text-gray-600 leading-relaxed max-w-lg mx-auto">
          You may also request account deletion by emailing us directly from your registered email address at{" "}
          <a
            href="mailto:contact@quick2learn.in"
            className="text-blue-600 underline font-medium"
          >
            contact@quick2learn.in
          </a>{" "}
          or by visiting our Mathura coaching center. Requests are processed within 48 business hours.
        </p>
      </div>
    </div>
  );
}
