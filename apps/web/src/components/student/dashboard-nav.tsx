"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  GraduationCap,
  PlaySquare,
  FileText,
  CreditCard,
  User,
  LogOut,
  ExternalLink,
  BookOpen,
} from "lucide-react";
import { signOut } from "@/lib/auth-client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface DashboardNavProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    classLevel?: number | null;
  };
}

export const NAV_ITEMS = [
  {
    name: "Home",
    href: "/dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    name: "My batches",
    href: "/dashboard/batches",
    icon: GraduationCap,
    exact: false,
  },
  {
    name: "Lectures",
    href: "/dashboard/lectures",
    icon: PlaySquare,
    exact: false,
  },
  {
    name: "Notes",
    href: "/dashboard/notes",
    icon: FileText,
    exact: false,
  },
  {
    name: "Payments",
    href: "/dashboard/payments",
    icon: CreditCard,
    exact: false,
  },
  {
    name: "Profile",
    href: "/dashboard/profile",
    icon: User,
    exact: false,
  },
];

export function DashboardNav({ user }: DashboardNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out successfully");
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Failed to sign out. Please try again.");
    }
  };

  const getIsActive = (href: string, exact: boolean) => {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "ST";

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 bg-white border-r border-border min-h-screen sticky top-0 h-screen select-none">
        {/* Brand & Wordmark */}
        <div className="p-5 border-b border-border">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/logo.png"
              alt="Quick2Learn"
              className="w-9 h-9 rounded-lg object-contain shadow-xs group-hover:scale-105 transition-transform shrink-0"
            />
            <div>
              <span className="font-extrabold text-ink text-base tracking-tight block">
                Quick2Learn
              </span>
              <span className="text-[11px] font-medium text-ink-muted block uppercase tracking-wider">
                Student Area
              </span>
            </div>
          </Link>
        </div>

        {/* Student Mini Profile Card */}
        <div className="p-4 mx-3 my-3 bg-neutral-subtle/70 rounded-xl border border-border/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 border border-primary/20 text-sm">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-body-sm font-bold text-ink truncate">
                {user.name}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Badge variant="primary" className="text-[10px] px-1.5 py-0">
                  {user.classLevel ? `Class ${user.classLevel}` : "Student"}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = getIsActive(item.href, item.exact);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-body-sm font-medium transition-all ${
                  isActive
                    ? "bg-primary text-white shadow-xs font-semibold"
                    : "text-ink hover:text-primary hover:bg-primary-soft/30"
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? "text-white" : "text-ink-muted"
                  }`}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-3 border-t border-border space-y-1">
          <Link
            href="/learn"
            className="flex items-center justify-between px-3.5 py-2 rounded-lg text-caption font-medium text-ink-muted hover:text-ink hover:bg-neutral-subtle transition-colors"
          >
            <span className="flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Free Lecture Library</span>
            </span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-body-sm font-medium text-critical hover:bg-critical-soft/30 transition-colors text-left"
          >
            <LogOut className="w-4 h-4 shrink-0 text-critical" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* MOBILE TOP BAR */}
      <header className="md:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-border px-4 py-2.5 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/logo.png"
            alt="Quick2Learn"
            className="w-7 h-7 rounded-md object-contain shrink-0"
          />
          <span className="font-bold text-ink text-sm">Quick2Learn</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/profile"
            className="w-7 h-7 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs border border-primary/20"
          >
            {initials}
          </Link>
        </div>
      </header>

      {/* MOBILE BOTTOM TAB BAR */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border flex items-center justify-around py-1.5 px-0.5 shadow-lg select-none"
        style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      >
        {NAV_ITEMS.map((item) => {
          const isActive = getIsActive(item.href, item.exact);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-1.5 min-w-[50px] transition-colors ${
                isActive
                  ? "text-primary font-bold"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              <div
                className={`p-1 rounded-full ${
                  isActive ? "bg-primary-soft/40" : ""
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-[10px] mt-0.5 leading-tight truncate max-w-[56px] text-center">
                {item.name === "My batches" ? "Batches" : item.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
