"use client";

import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  affectedItemName?: string;
  confirmLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  affectedItemName,
  confirmLabel = "Confirm",
  isDestructive = true,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [isBusy, setIsBusy] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsBusy(true);
    try {
      await onConfirm();
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-md rounded-2xl bg-white border border-border p-6 shadow-xl space-y-4 animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start gap-3.5">
          <div
            className={`p-2.5 rounded-xl shrink-0 ${
              isDestructive ? "bg-critical/10 text-critical" : "bg-warning/10 text-warning"
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-body-lg font-bold text-ink leading-tight">{title}</h3>
            <p className="text-body-sm text-ink-muted leading-relaxed">{description}</p>
          </div>
        </div>

        {affectedItemName && (
          <div className="p-3 rounded-xl bg-surface-subtle border border-border text-body-sm text-ink font-semibold">
            Target: <span className="font-mono text-primary">{affectedItemName}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isBusy}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleConfirm}
            disabled={isBusy}
            className={isDestructive ? "bg-critical hover:bg-rose-700 text-white" : ""}
          >
            {isBusy ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                Processing...
              </>
            ) : (
              confirmLabel
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
