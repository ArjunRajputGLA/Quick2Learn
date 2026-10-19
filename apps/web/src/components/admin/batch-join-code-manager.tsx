"use client";

import { useState, useEffect } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { regenerateBatchJoinCodeAction } from "@/server/admin-actions";
import { toast } from "sonner";
import {
  Copy,
  Check,
  RefreshCw,
  Printer,
  QrCode,
  Loader2,
} from "lucide-react";

interface BatchJoinCodeManagerProps {
  batchId: string;
  batchTitle: string;
  classLevel: number;
  board: string;
  academicYear?: string | null;
  initialJoinCode: string;
}

export function BatchJoinCodeManager({
  batchId,
  batchTitle,
  classLevel,
  board,
  academicYear,
  initialJoinCode,
}: BatchJoinCodeManagerProps) {
  const [joinCode, setJoinCode] = useState(initialJoinCode);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!joinCode) return;
    // Generate QR code encoding JSON or the direct join code
    QRCode.toDataURL(
      JSON.stringify({ type: "quick2learn_batch_join", code: joinCode, batchId }),
      {
        width: 360,
        margin: 2,
        color: {
          dark: "#0F172A",
          light: "#FFFFFF",
        },
      }
    )
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error("QR generation failed", err));
  }, [joinCode, batchId]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(joinCode);
      setCopied(true);
      toast.success("Join code copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy code");
    }
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    setShowConfirm(false);
    try {
      const res = await regenerateBatchJoinCodeAction(batchId);
      if (res.success && res.data?.joinCode) {
        setJoinCode(res.data.joinCode);
        toast.success(`New join code generated: ${res.data.joinCode}`);
      } else {
        toast.error(res.error || "Failed to regenerate join code");
      }
    } catch {
      toast.error("Failed to regenerate join code");
    } finally {
      setIsRegenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-white p-6 shadow-xs space-y-6 print:border-none print:shadow-none print:p-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4 print:hidden">
          <div>
            <h3 className="text-display-xs font-bold text-ink flex items-center gap-2">
              <QrCode className="w-5 h-5 text-primary" />
              Join Code & QR Poster
            </h3>
            <p className="text-body-xs text-ink-muted">
              Students enter this 6-character code or scan the QR code in the app to join.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="gap-1.5 font-bold"
            >
              <Printer className="w-4 h-4" /> Print QR Poster
            </Button>
            {!showConfirm ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowConfirm(true)}
                disabled={isRegenerating}
                className="gap-1.5 text-xs text-rose-700 hover:bg-rose-50 border-rose-200"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Regenerate Code
              </Button>
            ) : (
              <div className="flex items-center gap-1.5 bg-rose-50 p-1.5 rounded-lg border border-rose-200">
                <span className="text-[11px] font-bold text-rose-800 px-1">
                  Revoke old code?
                </span>
                <Button
                  size="sm"
                  onClick={handleRegenerate}
                  className="h-7 text-xs px-2 bg-rose-600 hover:bg-rose-700 text-white font-bold"
                >
                  Yes, Regenerate
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowConfirm(false)}
                  className="h-7 text-xs px-2"
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Big Join Code Box */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-surface-subtle/80 border border-border print:hidden">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted block">
              Active Student Join Code
            </span>
            <div className="flex items-center gap-3 mt-1">
              <span className="font-mono text-3xl sm:text-4xl font-extrabold tracking-widest text-primary bg-white px-4 py-2 rounded-xl border border-border shadow-2xs">
                {joinCode}
              </span>
              <Button
                type="button"
                onClick={handleCopy}
                size="sm"
                className="gap-1.5 font-bold h-10 px-4"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" /> Copy Code
                  </>
                )}
              </Button>
            </div>
          </div>
          <p className="text-body-xs text-ink-muted max-w-xs">
            Share this code in the classroom or WhatsApp group. Students type it in the
            mobile app to send a join request.
          </p>
        </div>

        {/* Printable Poster Card (Clean display on screen and dedicated styling for print) */}
        <div className="max-w-md mx-auto rounded-3xl border-2 border-primary/20 bg-gradient-to-b from-primary/5 via-white to-white p-6 sm:p-8 text-center shadow-sm print:border-2 print:border-black print:max-w-full print:m-0 print:p-8">
          <div className="space-y-1 mb-4">
            <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
              Quick2Learn Mathura
            </span>
            <h4 className="text-display-xs sm:text-h3 font-black text-ink">
              {batchTitle}
            </h4>
            <p className="text-body-sm font-semibold text-ink-muted">
              Class {classLevel} ({board.toUpperCase()})
              {academicYear ? ` · ${academicYear}` : ""}
            </p>
          </div>

          {/* QR Container */}
          <div className="inline-block p-4 rounded-2xl bg-white border border-border shadow-xs my-2">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`Join QR Code for ${batchTitle}`}
                className="w-56 h-56 mx-auto object-contain"
              />
            ) : (
              <div className="w-56 h-56 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            )}
          </div>

          <div className="mt-4 space-y-2">
            <p className="text-body-xs font-bold text-ink-muted uppercase tracking-wider">
              Or Enter 6-Digit Join Code
            </p>
            <div className="inline-block font-mono text-3xl font-black tracking-widest text-primary bg-primary/10 border border-primary/20 px-6 py-2 rounded-xl">
              {joinCode}
            </div>
            <p className="text-body-xs text-ink-muted pt-2 max-w-xs mx-auto">
              Scan this QR in the Quick2Learn Student App or enter the code manually under{" "}
              <strong>Batches → Join a batch</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
