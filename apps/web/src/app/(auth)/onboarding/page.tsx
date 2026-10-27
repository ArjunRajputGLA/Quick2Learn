import { Suspense } from "react";
import { OnboardingForm } from "@/components/auth/onboarding-form";
import { requireUser } from "@/server/auth/session";

export const metadata = {
  title: "Complete Profile | Quick2Learn",
  description: "Set up your student profile and academic curriculum.",
};

export default async function OnboardingPage() {
  const current = await requireUser("/onboarding");

  return (
    <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Suspense fallback={<div className="text-center py-12 text-ink-muted">Loading profile setup...</div>}>
        <OnboardingForm initialName={current.user.name || ""} initialEmail={current.user.email} />
      </Suspense>
    </div>
  );
}
