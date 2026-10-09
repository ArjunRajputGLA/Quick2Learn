"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { ArrowLeft, Mail, ShieldCheck, RefreshCw, AlertCircle } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "login";
  const nextParam = searchParams.get("next");

  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSocialLoading, setIsSocialLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    try {
      setIsSocialLoading(true);
      setErrorMsg(null);
      const callbackURL = nextParam || "/onboarding";
      await authClient.signIn.social({
        provider: "google",
        callbackURL,
      });
    } catch (err: unknown) {
      console.error("[auth] Google sign-in error:", err);
      setErrorMsg("Failed to initiate Google sign in. Please try email verification.");
      setIsSocialLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    try {
      setIsLoading(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const res = await authClient.emailOtp.sendVerificationOtp({
        email: email.trim().toLowerCase(),
        type: "sign-in",
      });

      if (res.error) {
        if (res.error.status === 429) {
          setErrorMsg("Too many requests. Please wait a few moments before trying again.");
        } else {
          setErrorMsg(res.error.message || "Failed to send verification code.");
        }
        setIsLoading(false);
        return;
      }

      setStep("otp");
      setSuccessMsg(`We sent a 6-digit verification code to ${email.trim()}`);
    } catch (err: unknown) {
      console.error("[auth] Send OTP error:", err);
      setErrorMsg("Unable to send verification code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOtp = otp.trim();
    if (cleanOtp.length !== 6) {
      setErrorMsg("Please enter the complete 6-digit code.");
      return;
    }

    try {
      setIsLoading(true);
      setErrorMsg(null);

      const res = await authClient.signIn.emailOtp({
        email: email.trim().toLowerCase(),
        otp: cleanOtp,
      });

      if (res.error) {
        const code = res.error.code;
        if (code === "TOO_MANY_ATTEMPTS") {
          setErrorMsg("Too many incorrect attempts. This code has been invalidated. Please request a new one.");
        } else if (code === "OTP_EXPIRED") {
          setErrorMsg("This verification code has expired. Please request a new one.");
        } else if (code === "INVALID_OTP") {
          setErrorMsg("Incorrect verification code. Please check your code and try again.");
        } else if (res.error.status === 429) {
          setErrorMsg("Too many requests. Please wait a few moments before trying again.");
        } else {
          setErrorMsg(res.error.message || "Verification failed. Please try again.");
        }
        setIsLoading(false);
        return;
      }

      // Successful sign in! Navigate to onboarding or requested page
      router.push(nextParam || "/onboarding");
      router.refresh();
    } catch (err: unknown) {
      console.error("[auth] Verify OTP error:", err);
      setErrorMsg("Failed to verify code. Please try again.");
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      setSuccessMsg(null);
      setOtp("");

      const res = await authClient.emailOtp.sendVerificationOtp({
        email: email.trim().toLowerCase(),
        type: "sign-in",
      });

      if (res.error) {
        if (res.error.status === 429) {
          setErrorMsg("Too many requests. Please wait a few moments before trying again.");
        } else {
          setErrorMsg(res.error.message || "Failed to resend code.");
        }
      } else {
        setSuccessMsg(`A fresh verification code was sent to ${email.trim()}`);
      }
    } catch {
      setErrorMsg("Failed to resend code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const isAdmin = searchParams.get("admin") === "true" || (nextParam ? nextParam.startsWith("/admin") : false);

  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="border-border bg-surface shadow-card hover:shadow-card-hover">
        <CardHeader className="text-center space-y-2 pb-6">
          <div className="mx-auto h-12 w-12 rounded-full bg-primary-soft flex items-center justify-center text-primary mb-1">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <CardTitle className="text-h2 font-bold text-ink">
            {isAdmin ? "Staff & Admin Portal" : mode === "signup" ? "Create your free account" : "Welcome back"}
          </CardTitle>
          <CardDescription className="text-body text-ink-muted">
            {isAdmin
              ? "Sign in to manage Quick2Learn batches, results, and student inquiries."
              : mode === "signup"
              ? "Join Quick2Learn for CBSE & ICSE Classes IX–XII."
              : "Sign in with Google or your email verification code."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Google OAuth Button */}
          <Button
            type="button"
            variant="outline"
            className="w-full py-2.5 font-medium flex items-center justify-center gap-3 text-ink hover:bg-surface-subtle border-border"
            onClick={handleGoogleSignIn}
            disabled={isSocialLoading || isLoading}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            {isSocialLoading ? "Connecting to Google..." : "Continue with Google"}
          </Button>

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-caption uppercase">
              <span className="bg-surface px-3 text-ink-muted">or continue with email</span>
            </div>
          </div>

          {/* Feedback messages */}
          {errorMsg && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200 text-danger text-small flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-md bg-green-50 border border-green-200 text-success text-small flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Step 1: Email Form */}
          {step === "email" ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-small font-medium text-ink">
                  Email Address
                </label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    required
                    autoComplete="email"
                    disabled={isLoading}
                    className="pl-10"
                  />
                  <Mail className="h-4 w-4 text-ink-muted absolute left-3 top-3 pointer-events-none" />
                </div>
                <p className="text-caption text-ink-muted">
                  New users are automatically registered on first login.
                </p>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full font-medium"
                disabled={isLoading || !email}
              >
                {isLoading ? "Sending code..." : "Send Verification Code"}
              </Button>
            </form>
          ) : (
            /* Step 2: 6-Digit Code Verification */
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="otp" className="block text-small font-medium text-ink">
                    Enter 6-Digit Code
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setStep("email");
                      setOtp("");
                      setErrorMsg(null);
                    }}
                    className="text-caption text-primary hover:underline flex items-center gap-1"
                  >
                    Change email
                  </button>
                </div>

                <Input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  autoFocus
                  required
                  disabled={isLoading}
                  className="text-center font-mono text-2xl tracking-[0.4em] py-3 font-bold"
                />

                <div className="flex items-center justify-between text-caption text-ink-muted pt-1">
                  <span>Sent to: <strong className="text-ink">{email}</strong></span>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isLoading}
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
                    Resend code
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full font-medium"
                disabled={isLoading || otp.length !== 6}
              >
                {isLoading ? "Verifying code..." : "Verify and Continue"}
              </Button>
            </form>
          )}
        </CardContent>

        <CardFooter className="flex flex-col space-y-4 border-t border-border pt-4 text-center">
          {isAdmin ? (
            <p className="text-caption text-ink-muted">
              Staff &amp; Administrative portal. Self-service student registration is disabled.
            </p>
          ) : (
            <button
              type="button"
              onClick={() => {
                const newMode = mode === "login" ? "signup" : "login";
                setMode(newMode);
                setErrorMsg(null);
              }}
              className="text-small text-ink-muted hover:text-primary transition-colors"
            >
              {mode === "login" ? (
                <>
                  New to Quick2Learn?{" "}
                  <span className="font-semibold text-primary underline">Join for Free</span>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <span className="font-semibold text-primary underline">Log in</span>
                </>
              )}
            </button>
          )}

          <Link href="/" className="inline-flex items-center justify-center gap-1 text-caption text-ink-muted hover:text-ink">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Quick2Learn Homepage
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
