"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { adminLoginAction } from "@/server/admin-auth-actions";
import { toast } from "sonner";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";

function AdminLoginFormContent() {
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next");


  const [activePreset, setActivePreset] = useState<"admin" | "teacher">("admin");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fillCredentials = (role: "admin" | "teacher") => {
    setActivePreset(role);
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setErrorMsg("Please enter both email/username and password.");
      return;
    }

    try {
      setIsLoading(true);
      setErrorMsg(null);

      // 1. Fast direct API login with cookie setting
      let result: { success: boolean; error?: string; user?: { role: string; name: string } } | null = null;
      try {
        const res = await fetch("/api/v1/admin/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier, password }),
        });
        result = await res.json();
      } catch {
        // Fallback to Server Action if fetch fails
        result = await adminLoginAction(identifier, password);
      }

      if (!result || !result.success || !result.user) {
        setErrorMsg(
          result?.error ||
            "Invalid credentials. Please use the same admin credentials as in the mobile app."
        );
        toast.error(result?.error || "Login failed");
        setIsLoading(false);
        return;
      }

      toast.success(`Welcome back, ${result.user.name}!`);

      // Determine redirect target
      const targetUrl = nextParam || (result.user.role === "teacher" ? "/admin/batches" : "/admin");

      // Hard redirect ensures the browser sends the new session cookie and immediately loads the dashboard
      window.location.href = targetUrl;
    } catch (err: unknown) {
      console.error("Admin login error:", err);
      setErrorMsg("An unexpected error occurred during login. Please try again.");
      toast.error("Login failed");
      setIsLoading(false);
    }
  };


  return (
    <div className="flex-1 flex flex-col justify-between" suppressHydrationWarning>
      {/* 1. TOP NAVBAR / BRAND HEADER */}
      <header className="w-full px-6 sm:px-12 py-5 flex items-center justify-between" suppressHydrationWarning>
        <Link href="/" className="flex items-center group" aria-label="Quick2Learn Home">
          <Image
            src="/images/assets/unnamed-removebg-preview.png"
            alt="Quick2Learn Mathura"
            width={180}
            height={40}
            priority
            className="h-8 sm:h-9 lg:h-10 w-auto object-contain transition-transform duration-200 group-hover:scale-[1.02]"
          />
        </Link>

        <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
          <Link
            href="/"
            className="flex items-center gap-1.5 hover:text-blue-600 transition-colors py-1.5 px-3 rounded-lg hover:bg-slate-100"
          >
            <span>Public Site</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Mobile App Synced</span>
          </div>
        </div>
      </header>

      {/* 2. MAIN TWO-COLUMN CONTAINER */}
      <main className="w-full max-w-6xl mx-auto px-4 sm:px-8 py-6 sm:py-10 flex-1 flex flex-col lg:flex-row items-center justify-center gap-10 lg:gap-16">
        {/* LEFT COLUMN: Quote & 3D Artwork */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center text-left space-y-6">
          <div className="space-y-3">
            <div className="text-4xl sm:text-5xl text-blue-600 font-serif leading-none select-none">
              “
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-800 tracking-tight leading-snug">
              A Building With Four Walls And Tomorrow Inside
            </h1>
            <p className="text-sm sm:text-base text-slate-500 leading-relaxed max-w-md">
              Premier Mathematics & Science Coaching Academy in Mathura since 2001. Mentored by Mr. Dinesh Singh Rajput & Mrs. Namita Singh Rajput.
            </p>
          </div>

          {/* 3D Graduation Cap & Diploma Illustration */}
          <div className="relative pt-2 max-w-sm mx-auto lg:mx-0">
            <div className="relative w-72 sm:w-80 h-72 sm:h-80 mx-auto lg:mx-0 rounded-3xl overflow-hidden shadow-2xl shadow-blue-500/10 border border-slate-100 bg-white">
              <Image
                src="/images/assets/grad_cap_diploma.jpg"
                alt="Quick2Learn Academic Excellence"
                fill
                priority
                className="object-cover"
              />
            </div>
            <div className="text-center lg:text-left mt-3">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                Quick2Learn Unified Academic Portal
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Elevated Minimal White Card (Screenshot 2 Match) */}
        <div className="w-full lg:w-1/2 max-w-md mx-auto">
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/90 border border-slate-100 overflow-hidden relative transition-all" suppressHydrationWarning>
            {/* Arched Blue Header Banner */}
            <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-sky-500 h-28 relative overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent" />
            </div>

            {/* Overlapping Circular Avatar */}
            <div className="-mt-14 flex flex-col items-center relative z-10 px-6">
              <div className="w-24 h-24 rounded-full bg-white p-1 shadow-lg shadow-blue-900/10 ring-4 ring-white relative overflow-hidden">
                <Image
                  src={
                    activePreset === "admin"
                      ? "/images/assets/dinesh-singh-rajput.jpeg"
                      : "/images/assets/namita-singh-rajput.jpeg"
                  }
                  alt={activePreset === "admin" ? "Mr. Dinesh Singh Rajput" : "Mrs. Namita Singh Rajput"}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Title & Role Info */}
              <div className="text-center mt-2.5 space-y-0.5">
                <div className="text-base font-bold text-slate-800">
                  {activePreset === "admin" ? "Mr. Dinesh Singh Rajput" : "Mrs. Namita Singh Rajput"}
                </div>
                <div className="text-xs font-semibold text-blue-600 flex items-center justify-center gap-1">
                  {activePreset === "admin" ? (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Director & Administrator</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Senior Faculty Member</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-6 sm:p-8 pt-4 space-y-5" suppressHydrationWarning>
              {/* Persona Quick Toggle */}
              <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-semibold" suppressHydrationWarning>
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => fillCredentials("admin")}
                  className={`flex-1 py-1.5 px-3 rounded-lg transition-all cursor-pointer text-center ${
                    activePreset === "admin"
                      ? "bg-white text-blue-700 shadow-xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Administrator
                </button>
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => fillCredentials("teacher")}
                  className={`flex-1 py-1.5 px-3 rounded-lg transition-all cursor-pointer text-center ${
                    activePreset === "teacher"
                      ? "bg-white text-emerald-700 shadow-xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Faculty Member
                </button>
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div>{errorMsg}</div>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4" suppressHydrationWarning>
                {/* Username Input (Screenshot 2 minimal underline style) */}
                <div className="space-y-1">
                  <div className="relative border-b-2 border-slate-200 focus-within:border-blue-600 transition-colors pb-1">
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-blue-500 shrink-0" />
                      <input
                        type="text"
                        suppressHydrationWarning
                        placeholder="Enter your user name or email"
                        value={identifier}
                        onChange={(e) => {
                          setIdentifier(e.target.value);
                          setErrorMsg(null);
                        }}
                        required
                        disabled={isLoading}
                        className="w-full py-1.5 bg-transparent text-slate-800 placeholder-slate-400 text-sm focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-1">
                  <div className="relative border-b-2 border-slate-200 focus-within:border-blue-600 transition-colors pb-1">
                    <div className="flex items-center gap-3">
                      <Lock className="w-4 h-4 text-blue-500 shrink-0" />
                      <input
                        type={showPassword ? "text" : "password"}
                        suppressHydrationWarning
                        placeholder="Password"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setErrorMsg(null);
                        }}
                        required
                        disabled={isLoading}
                        className="w-full py-1.5 bg-transparent text-slate-800 placeholder-slate-400 text-sm focus:outline-none pr-8"
                      />
                      <button
                        type="button"
                        suppressHydrationWarning
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-slate-400 hover:text-slate-600 p-1"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Remember Me & App Synced Status */}
                <div className="flex items-center justify-between text-xs text-slate-500 pt-1" suppressHydrationWarning>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      suppressHydrationWarning
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                    />
                    <span>Remember me</span>
                  </label>

                  <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    <span>App Synced</span>
                  </span>
                </div>

                {/* Primary Sign In Button (Screenshot 2 blue button) */}
                <button
                  type="submit"
                  suppressHydrationWarning
                  disabled={isLoading}
                  className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Bottom Switch Pill (Like Screenshot 2 "Login as a Tutor") */}
              <div className="text-center pt-1" suppressHydrationWarning>
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => fillCredentials(activePreset === "admin" ? "teacher" : "admin")}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                >
                  <span>
                    Switch to {activePreset === "admin" ? "Faculty" : "Administrator"} Login
                  </span>
                  <span>→</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 3. DARK BOTTOM FOOTER BAR (Screenshot 2 exact match) */}
      <footer className="w-full bg-[#1b2028] text-slate-400 py-4 px-6 text-xs text-center border-t border-slate-800 mt-auto" suppressHydrationWarning>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center justify-center gap-4 text-slate-300 font-medium">
            <Link href="/" className="hover:text-white transition-colors">
              Terms
            </Link>
            <span>·</span>
            <Link href="/" className="hover:text-white transition-colors">
              Policy & Procedures
            </Link>
            <span>·</span>
            <Link href="/" className="hover:text-white transition-colors">
              Contact Us
            </Link>
            <span>·</span>
            <Link href="/" className="hover:text-white transition-colors">
              Help
            </Link>
          </div>

          <div className="text-[11px] text-slate-500">
            © 2026 Quick2Learn Mathura · Managed by Dinesh Singh Rajput & Namita Singh Rajput
          </div>
        </div>
      </footer>
    </div>
  );
}

export function AdminLoginForm() {
  return (
    <Suspense fallback={null}>
      <AdminLoginFormContent />
    </Suspense>
  );
}
