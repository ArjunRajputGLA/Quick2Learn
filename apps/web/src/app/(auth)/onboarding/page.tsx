import { Suspense } from "react";
import { redirect } from "next/navigation";
import { requireUser } from "@/server/auth/session";
import { OnboardingForm } from "@/components/auth/onboarding-form";

export const metadata = {
  title: "Complete Your Profile | Quick2Learn",
  description: "Complete student registration for Quick2Learn classes and courses.",
};

export default async function OnboardingPage() {
  const current = await requireUser("/onboarding");

  // If already onboarded, send straight to dashboard
  if (current.profile?.onboardedAt) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-surface-subtle">
      <Suspense
        fallback={
          <div className="w-full max-w-xl mx-auto p-8 rounded-lg bg-surface border border-border text-center text-ink-muted">
            Loading student profile onboarding...
          </div>
        }
      >
        <OnboardingForm
          initialName={current.user.name || current.profile?.fullName || ""}
          initialEmail={current.user.email}
        />
      </Suspense>
    </div>
  );
}
