"use client";

import { useState, useEffect, Suspense } from "react";
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
  Check,
  X,
  GraduationCap,
  Award,
  BookOpen,
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

  // Initialize with remembered username if previously saved
  useEffect(() => {
    try {
      const savedId = localStorage.getItem("q2l_admin_remember_id");
      if (savedId) {
        setIdentifier(savedId);
        setRememberMe(true);
        if (
          savedId.toLowerCase().includes("teacher") ||
          savedId.toLowerCase().includes("namita")
        ) {
          setActivePreset("teacher");
        } else {
          setActivePreset("admin");
        }
      }
    } catch {
      // Ignore localStorage restrictions
    }
  }, []);

  // Handle persona switch
  const handlePresetSelect = (role: "admin" | "teacher") => {
    setActivePreset(role);
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = identifier.trim();
    const cleanPass = password.trim();

    if (!cleanId || !cleanPass) {
      setErrorMsg("Please enter both email/username and password.");
      return;
    }

    try {
      setIsLoading(true);
      setErrorMsg(null);

      // Save or remove remembered username in localStorage
      try {
        if (rememberMe) {
          localStorage.setItem("q2l_admin_remember_id", cleanId);
        } else {
          localStorage.removeItem("q2l_admin_remember_id");
        }
      } catch {
        // Ignore localStorage restrictions if any
      }

      // Fast direct API login with cookie setting
      let result: {
        success: boolean;
        error?: string;
        user?: { role: string; name: string };
      } | null = null;

      try {
        const res = await fetch("/api/v1/admin/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier: cleanId, password: cleanPass }),
        });
        result = await res.json();
      } catch {
        // Fallback to Server Action if fetch fails
        result = await adminLoginAction(cleanId, cleanPass);
      }

      if (!result || !result.success || !result.user) {
        const errText =
          result?.error ||
          "Invalid credentials. Please verify your email and password.";
        setErrorMsg(errText);
        toast.error(errText);
        setIsLoading(false);
        return;
      }

      toast.success(`Welcome back, ${result.user.name}!`);

      // Determine redirect target
      const targetUrl =
        nextParam || (result.user.role === "teacher" ? "/admin/batches" : "/admin");

      // Hard redirect ensures the browser sends the new session cookie and immediately loads dashboard
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
      <header
        className="w-full px-6 sm:px-12 py-5 flex items-center justify-between"
        suppressHydrationWarning
      >
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

        <div className="flex items-center gap-3 sm:gap-4 text-xs font-semibold text-slate-600">
          <Link
            href="/"
            className="flex items-center gap-1.5 hover:text-blue-600 transition-colors py-1.5 px-3 rounded-lg hover:bg-slate-100"
          >
            <span>Public Site</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-medium shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Mobile App Synced</span>
          </div>
        </div>
      </header>

      {/* 2. MAIN TWO-COLUMN CONTAINER */}
      <main className="w-full max-w-6xl mx-auto px-4 sm:px-8 py-6 sm:py-10 flex-1 flex flex-col lg:flex-row items-center justify-center gap-10 lg:gap-16">
        {/* LEFT COLUMN: Quote, Highlights & 3D Artwork */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center text-left space-y-6">
          <div className="space-y-3">
            <div className="text-4xl sm:text-5xl text-blue-600 font-serif leading-none select-none">
              “
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-snug">
              A Building With Four Walls And Tomorrow Inside
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-md">
              Premier Mathematics &amp; Science Coaching Academy in Mathura since 2001. Mentored by
              Mr. Dinesh Singh Rajput &amp; Mrs. Namita Singh Rajput.
            </p>
          </div>

          {/* Academic Highlights */}
          <div className="grid grid-cols-2 gap-2.5 max-w-md pt-1">
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Award className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <div className="font-bold text-slate-800">25+ Years Legacy</div>
                <div className="text-[10px] text-slate-500">Mathura, UP</div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <div className="font-bold text-slate-800">Classes IX – XII</div>
                <div className="text-[10px] text-slate-500">CBSE &amp; ICSE Boards</div>
              </div>
            </div>
          </div>

          {/* 3D Graduation Cap & Diploma Illustration */}
          <div className="relative pt-2 max-w-sm mx-auto lg:mx-0">
            <div className="relative w-64 sm:w-72 h-64 sm:h-72 mx-auto lg:mx-0 rounded-3xl overflow-hidden shadow-xl shadow-blue-500/10 border border-slate-200/80 bg-white group">
              <Image
                src="/images/assets/grad_cap_diploma.jpg"
                alt="Quick2Learn Academic Excellence"
                fill
                priority
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent opacity-60" />
              <div className="absolute bottom-3 left-3 right-3 px-3 py-1.5 rounded-xl bg-white/90 backdrop-blur-md border border-white/40 shadow-xs flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="text-[11px] font-bold text-slate-800 truncate">
                  Director Dinesh Sir · 100/100 Board Mentor
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Elevated Minimal White Card */}
        <div className="w-full lg:w-1/2 max-w-md mx-auto">
          <div
            className="bg-white rounded-3xl shadow-xl shadow-slate-200/90 border border-slate-200/80 overflow-hidden relative transition-all"
            suppressHydrationWarning
          >
            {/* Arched Blue Header Banner with Rich Gradient & Pattern */}
            <div className="bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 h-28 relative overflow-hidden flex items-center justify-between px-6">
              {/* Decorative background glow */}
              <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
              <div className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full bg-indigo-400/20 blur-lg pointer-events-none" />

              <div className="relative z-10 flex items-center justify-between w-full text-white/90">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider uppercase text-blue-100">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Quick2Learn Portal</span>
                </div>
                <div className="text-[10px] bg-white/15 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/20 font-medium text-white shadow-2xs">
                  Staff Access
                </div>
              </div>
            </div>

            {/* Overlapping Circular Avatar */}
            <div className="-mt-14 flex flex-col items-center relative z-10 px-6">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full bg-white p-1 shadow-xl shadow-slate-900/15 ring-4 ring-white relative overflow-hidden transition-transform duration-300 group-hover:scale-105">
                  <Image
                    src={
                      activePreset === "admin"
                        ? "/images/assets/dinesh-singh-rajput.jpeg"
                        : "/images/assets/namita-singh-rajput.jpeg"
                    }
                    alt={
                      activePreset === "admin"
                        ? "Mr. Dinesh Singh Rajput"
                        : "Mrs. Namita Singh Rajput"
                    }
                    fill
                    priority
                    className="object-cover"
                  />
                </div>
                {/* Verified badge */}
                <div
                  className={`absolute bottom-0 right-0 w-6 h-6 rounded-full ring-2 ring-white flex items-center justify-center text-white shadow-sm ${
                    activePreset === "admin" ? "bg-blue-600" : "bg-emerald-600"
                  }`}
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              </div>

              {/* Title & Role Info */}
              <div className="text-center mt-2.5 space-y-1">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  {activePreset === "admin"
                    ? "Mr. Dinesh Singh Rajput"
                    : "Mrs. Namita Singh Rajput"}
                </h2>
                <div className="flex items-center justify-center">
                  {activePreset === "admin" ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                      <span>Director &amp; Administrator</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Senior Faculty Member</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-6 sm:p-7 pt-4 space-y-4" suppressHydrationWarning>
              {/* Persona Quick Toggle */}
              <div
                className="bg-slate-100/90 p-1 rounded-xl flex items-center text-xs font-semibold border border-slate-200/70 shadow-2xs"
                suppressHydrationWarning
              >
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => handlePresetSelect("admin")}
                  className={`flex-1 py-1.5 px-3 rounded-lg transition-all duration-150 cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                    activePreset === "admin"
                      ? "bg-white text-blue-700 shadow-xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <ShieldCheck
                    className={`w-3.5 h-3.5 ${
                      activePreset === "admin" ? "text-blue-600" : "text-slate-400"
                    }`}
                  />
                  <span>Administrator</span>
                </button>
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => handlePresetSelect("teacher")}
                  className={`flex-1 py-1.5 px-3 rounded-lg transition-all duration-150 cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                    activePreset === "teacher"
                      ? "bg-white text-emerald-700 shadow-xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Sparkles
                    className={`w-3.5 h-3.5 ${
                      activePreset === "teacher" ? "text-emerald-600" : "text-slate-400"
                    }`}
                  />
                  <span>Faculty Member</span>
                </button>
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-in fade-in duration-150">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div className="flex-1">{errorMsg}</div>
                  <button
                    type="button"
                    onClick={() => setErrorMsg(null)}
                    className="text-rose-400 hover:text-rose-600 p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3.5" suppressHydrationWarning>
                {/* Username Input Container */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Email or Username
                  </label>
                  <div className="group relative flex items-center rounded-xl bg-slate-50/80 border border-slate-200 hover:border-slate-300 focus-within:bg-white focus-within:border-blue-600 focus-within:ring-3 focus-within:ring-blue-100 transition-all duration-150">
                    <div className="pl-3.5 pr-2 text-slate-400 group-focus-within:text-blue-600 transition-colors shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      autoComplete="username"
                      placeholder="e.g. admin@quick2learn.in"
                      value={identifier}
                      onChange={(e) => {
                        setIdentifier(e.target.value);
                        setErrorMsg(null);
                      }}
                      required
                      disabled={isLoading}
                      className="w-full py-2.5 pr-3 text-sm text-slate-900 placeholder:text-slate-400 bg-transparent border-0 outline-none focus:outline-none focus:ring-0"
                    />
                    {identifier && (
                      <button
                        type="button"
                        onClick={() => {
                          setIdentifier("");
                          setErrorMsg(null);
                        }}
                        className="mr-2.5 p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors cursor-pointer"
                        title="Clear"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Password Input Container */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Password
                  </label>
                  <div className="group relative flex items-center rounded-xl bg-slate-50/80 border border-slate-200 hover:border-slate-300 focus-within:bg-white focus-within:border-blue-600 focus-within:ring-3 focus-within:ring-blue-100 transition-all duration-150">
                    <div className="pl-3.5 pr-2 text-slate-400 group-focus-within:text-blue-600 transition-colors shrink-0">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setErrorMsg(null);
                      }}
                      required
                      disabled={isLoading}
                      className="w-full py-2.5 pr-10 text-sm text-slate-900 placeholder:text-slate-400 bg-transparent border-0 outline-none focus:outline-none focus:ring-0"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-200/50 transition-colors cursor-pointer"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me & App Synced Status */}
                <div
                  className="flex items-center justify-between text-xs text-slate-600 pt-1"
                  suppressHydrationWarning
                >
                  <label className="flex items-center gap-2 cursor-pointer select-none group">
                    <input
                      type="checkbox"
                      suppressHydrationWarning
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                    />
                    <span className="group-hover:text-slate-900 transition-colors font-medium">
                      Remember me
                    </span>
                  </label>

                  <div
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-medium cursor-default"
                    title="Real-time 2-way sync with Quick2Learn Student & Faculty Mobile App"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>App Synced</span>
                  </div>
                </div>

                {/* Primary Sign In Button */}
                <button
                  type="submit"
                  suppressHydrationWarning
                  disabled={isLoading}
                  className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.99] text-white shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed group"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Authenticating Securely...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to Dashboard</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </form>

              {/* Bottom Switch Pill */}
              <div className="text-center pt-1" suppressHydrationWarning>
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() =>
                    handlePresetSelect(activePreset === "admin" ? "teacher" : "admin")
                  }
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                >
                  <span>
                    Switch to {activePreset === "admin" ? "Faculty" : "Administrator"} Portal
                  </span>
                  <span>→</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 3. DARK BOTTOM FOOTER BAR */}
      <footer
        className="w-full bg-[#1b2028] text-slate-400 py-4 px-6 text-xs text-center border-t border-slate-800 mt-auto"
        suppressHydrationWarning
      >
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center justify-center gap-4 text-slate-300 font-medium">
            <Link href="/" className="hover:text-white transition-colors">
              Terms
            </Link>
            <span>·</span>
            <Link href="/" className="hover:text-white transition-colors">
              Policy &amp; Procedures
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
            © 2026 Quick2Learn Mathura · Managed by Dinesh Singh Rajput &amp; Namita Singh Rajput
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
