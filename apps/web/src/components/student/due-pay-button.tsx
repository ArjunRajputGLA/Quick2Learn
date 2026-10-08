"use client";

import * as React from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { formatINR } from "@quick2learn/shared";
import { createDueOrderAction } from "@/server/payments/actions";
import { toast } from "sonner";
import { CreditCard, Loader2 } from "lucide-react";

interface DuePayButtonProps {
  dueId: string;
  dueLabel: string;
  amountPaise: number;
  razorpayKeyId: string;
  studentEmail?: string;
  studentName?: string;
}

export function DuePayButton({
  dueId,
  dueLabel,
  amountPaise,
  razorpayKeyId,
  studentEmail,
  studentName,
}: DuePayButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  const handlePayDue = async () => {
    setLoading(true);
    try {
      const res = await createDueOrderAction(dueId);
      if (!res.success) {
        toast.error(res.error || "Failed to initialize instalment order.");
        setLoading(false);
        return;
      }

      const orderData = res.data;

      if (typeof window.Razorpay !== "undefined") {
        const options = {
          key: razorpayKeyId || orderData.keyId,
          amount: orderData.amountPaise,
          currency: orderData.currency || "INR",
          name: "Quick2Learn",
          description: `${orderData.batchTitle} • ${dueLabel}`,
          order_id: orderData.orderId,
          prefill: {
            name: studentName,
            email: studentEmail,
          },
          theme: {
            color: "#0284c7",
          },
          modal: {
            ondismiss: () => {
              setLoading(false);
              toast.info("Payment cancelled.");
            },
          },
          handler: async (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            try {
              const verifyRes = await fetch("/api/payments/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              });

              const verifyJson = await verifyRes.json();
              if (!verifyRes.ok || !verifyJson.success) {
                toast.error(
                  verifyJson.error || "Payment signature verification failed.",
                );
                setLoading(false);
                return;
              }

              toast.success("Instalment payment recorded!");
              router.push(
                verifyJson.redirectUrl ||
                  `/dashboard/payments/${verifyJson.paymentId}`,
              );
            } catch {
              toast.error("Verification communication error.");
              setLoading(false);
            }
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        // Fallback for mock/test
        toast.info("Simulating payment verification in test environment...");
        const verifyRes = await fetch("/api/payments/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            razorpay_order_id: orderData.orderId,
            razorpay_payment_id: `pay_mock_${Date.now()}`,
            razorpay_signature: "mock_sig_for_local_dev",
          }),
        });

        const verifyJson = await verifyRes.json();
        if (verifyJson.redirectUrl) {
          router.push(verifyJson.redirectUrl);
        } else {
          router.push(`/dashboard/payments/${orderData.paymentId}`);
        }
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Payment processing error.",
      );
      setLoading(false);
    }
  };

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <button
        type="button"
        onClick={handlePayDue}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-small font-bold text-surface shadow-xs hover:bg-primary-hover active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Processing...</span>
          </>
        ) : (
          <>
            <CreditCard className="h-4 w-4" />
            <span>Pay {formatINR(amountPaise)}</span>
          </>
        )}
      </button>
    </>
  );
}
