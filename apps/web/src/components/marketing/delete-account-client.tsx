"use client";

import * as React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { Mail, KeyRound, CheckCircle2, ArrowRight } from "lucide-react";

export function DeleteAccountClient() {
  const [step, setStep] = useState<"input" | "verify" | "done">("input");
  const [identifier, setIdentifier] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      toast.error("Please enter your registered email or mobile number.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/account/delete/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request", identifier: identifier.trim() }),
      });

      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error?.message || "Failed to send verification code.");
        setLoading(false);
        return;
      }

      setStatusMessage(json.data?.message || "Verification code dispatched.");
      toast.success("Verification code sent! Check your email or SMS.");
      setStep("verify");
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDeletion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || code.trim().length !== 6) {
      toast.error("Please enter the 6-digit verification code.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/account/delete/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "confirm",
          identifier: identifier.trim(),
          code: code.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error?.message || "Invalid verification code.");
        setLoading(false);
        return;
      }

      toast.success("Account successfully deleted and anonymized.");
      setStep("done");
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (step === "done") {
    return (
      <div className="rounded-2xl border border-border bg-white p-8 text-center space-y-4 shadow-sm">
        <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-gray-900">
          Account Successfully Anonymized
        </h3>
        <p className="text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
          Your personal data, enrolled batch records, device tokens, and active sessions have been permanently deleted from our systems. Historical financial receipts have been anonymized in accordance with Indian tax laws.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-6 sm:p-8 shadow-sm space-y-6">
      {step === "input" && (
        <form onSubmit={handleRequestOtp} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5">
              Registered Email or 10-Digit Mobile Number
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. rahul@example.com or 9876543210"
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                required
              />
            </div>
            <p className="text-xs text-gray-500 mt-1.5">
              We will send a 6-digit confirmation code to verify account ownership.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? "Sending Code..." : "Send Verification Code"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      )}

      {step === "verify" && (
        <form onSubmit={handleConfirmDeletion} className="space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
            {statusMessage}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5">
              Enter 6-Digit Verification Code
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm tracking-widest font-mono text-center font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep("input")}
              className="w-1/3 py-2.5 px-3 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-2/3 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-colors disabled:opacity-50"
            >
              {loading ? "Deleting..." : "Confirm & Delete Account"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
