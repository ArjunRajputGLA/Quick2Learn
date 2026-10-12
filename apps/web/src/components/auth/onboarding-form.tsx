"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { completeOnboardingAction } from "@/server/profile-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { AlertCircle, GraduationCap, CheckCircle } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

interface OnboardingFormProps {
  initialName?: string;
  initialEmail?: string;
}

function OnboardingFormContent({ initialName = "", initialEmail = "" }: OnboardingFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next");

  const [fullName, setFullName] = useState(initialName);
  const [phone, setPhone] = useState("");
  const [classLevel, setClassLevel] = useState<number>(10);
  const [board, setBoard] = useState<"cbse" | "icse" | "isc">("cbse");
  const [school, setSchool] = useState("");
  const [parentName, setParentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [city, setCity] = useState("Mathura");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName.trim() || fullName.trim().length < 2) {
      setErrorMsg("Please enter your full name.");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(phone.trim())) {
      setErrorMsg("Please enter a valid 10-digit Indian WhatsApp mobile number.");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(parentPhone.trim())) {
      setErrorMsg("Please enter a valid 10-digit Indian parent contact number.");
      return;
    }

    if (!school.trim()) {
      setErrorMsg("Please enter your school name.");
      return;
    }

    if (!parentName.trim()) {
      setErrorMsg("Please enter parent or guardian name.");
      return;
    }

    if (!city.trim()) {
      setErrorMsg("Please enter your city.");
      return;
    }

    try {
      setIsLoading(true);

      const res = await completeOnboardingAction({
        fullName: fullName.trim(),
        phone: phone.trim(),
        classLevel: Number(classLevel),
        board,
        school: school.trim(),
        parentName: parentName.trim(),
        parentPhone: parentPhone.trim(),
        city: city.trim(),
      });

      if (!res.success) {
        setErrorMsg(res.error || "Failed to complete onboarding.");
        setIsLoading(false);
        return;
      }

      trackEvent("signup_completed", {
        classLevel,
        board,
        city: city.trim(),
      });

      router.push(nextParam || "/dashboard");
      router.refresh();
    } catch (err: unknown) {
      console.error("[onboarding] Submit error:", err);
      setErrorMsg("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-xl mx-auto border-border bg-surface shadow-card hover:shadow-card-hover">
      <CardHeader className="text-center space-y-2 pb-6 border-b border-border">
        <div className="mx-auto h-12 w-12 rounded-full bg-primary-soft flex items-center justify-center text-primary mb-1">
          <GraduationCap className="h-6 w-6" />
        </div>
        <CardTitle className="text-h2 font-bold text-ink">Welcome to Quick2Learn!</CardTitle>
        <CardDescription className="text-body text-ink-muted">
          Complete your profile to personalize your classroom, batches, and study assignments.
        </CardDescription>
        {initialEmail && (
          <p className="text-caption text-ink-muted">
            Signed in as <strong className="text-ink">{initialEmail}</strong>
          </p>
        )}
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-5 pt-6">
          {errorMsg && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200 text-danger text-small flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Student Information Section */}
          <div className="space-y-4">
            <h3 className="text-small font-semibold text-ink uppercase tracking-wider text-primary border-b border-border pb-1">
              Student Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="fullName" className="block text-small font-medium text-ink">
                  Full Name *
                </label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Aarav Sharma"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="phone" className="block text-small font-medium text-ink">
                  WhatsApp Number *
                </label>
                <Input
                  id="phone"
                  type="tel"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  placeholder="10-digit mobile number"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="classLevel" className="block text-small font-medium text-ink">
                  Current Class *
                </label>
                <Select
                  id="classLevel"
                  value={String(classLevel)}
                  onChange={(e) => setClassLevel(Number(e.target.value))}
                >
                  <option value="9">Class IX</option>
                  <option value="10">Class X</option>
                  <option value="11">Class XI</option>
                  <option value="12">Class XII</option>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="board" className="block text-small font-medium text-ink">
                  Education Board *
                </label>
                <Select
                  id="board"
                  value={board}
                  onChange={(e) => setBoard(e.target.value as "cbse" | "icse" | "isc")}
                >
                  <option value="cbse">CBSE</option>
                  <option value="icse">ICSE</option>
                  <option value="isc">ISC</option>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="school" className="block text-small font-medium text-ink">
                  School Name *
                </label>
                <Input
                  id="school"
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  placeholder="e.g. St. Dominic's School"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="city" className="block text-small font-medium text-ink">
                  City *
                </label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Mathura, Vrindavan"
                  required
                />
              </div>
            </div>
          </div>

          {/* Parent Information Section */}
          <div className="space-y-4 pt-2">
            <h3 className="text-small font-semibold text-ink uppercase tracking-wider text-primary border-b border-border pb-1">
              Parent / Guardian Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="parentName" className="block text-small font-medium text-ink">
                  Parent / Guardian Name *
                </label>
                <Input
                  id="parentName"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  placeholder="e.g. Rajesh Sharma"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="parentPhone" className="block text-small font-medium text-ink">
                  Parent Contact Number *
                </label>
                <Input
                  id="parentPhone"
                  type="tel"
                  maxLength={10}
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value.replace(/\D/g, ""))}
                  placeholder="10-digit mobile number"
                  required
                />
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-3 border-t border-border pt-6">
          <Button
            type="submit"
            variant="primary"
            className="w-full py-2.5 font-medium gap-2 text-base"
            disabled={isLoading}
          >
            {isLoading ? (
              "Saving details..."
            ) : (
              <>
                <CheckCircle className="h-4 w-4" /> Complete Registration & Continue
              </>
            )}
          </Button>
          <p className="text-caption text-ink-muted text-center">
            Your details are kept strictly private and used only for academic and batch coordination.
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

export function OnboardingForm(props: OnboardingFormProps) {
  return (
    <Suspense fallback={null}>
      <OnboardingFormContent {...props} />
    </Suspense>
  );
}
