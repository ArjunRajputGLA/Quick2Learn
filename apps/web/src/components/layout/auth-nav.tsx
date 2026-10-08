"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LayoutDashboard, User, Shield, LogOut, ChevronDown } from "lucide-react";

export function AuthNav() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setDropdownOpen(false);
    await authClient.signOut();
    router.push("/");
    router.refresh();
  };

  if (isPending) {
    return (
      <div className="flex items-center gap-3">
        <div className="h-8 w-16 bg-surface-subtle animate-pulse rounded" />
        <div className="h-8 w-24 bg-surface-subtle animate-pulse rounded" />
      </div>
    );
  }

  // 1. Logged Out State
  if (!session?.user) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/login"
          className="text-small font-medium text-ink hover:text-primary transition-colors px-2 py-1"
        >
          Log in
        </Link>
        <Link href="/login?mode=signup">
          <Button variant="primary" size="sm" className="font-medium shadow-xs">
            Join for Free
          </Button>
        </Link>
      </div>
    );
  }

  // 2. Logged In State
  const user = session.user;
  const initials = (user.name || user.email || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Better Auth custom user or default
  const userRole = (user as { role?: string }).role || "student";
  const isStaff = userRole === "admin" || userRole === "teacher";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setDropdownOpen((prev) => !prev)}
        className="flex items-center gap-2 p-1 rounded-full hover:bg-surface-subtle transition-colors border border-border"
        aria-expanded={dropdownOpen}
        aria-haspopup="true"
      >
        <div className="h-8 w-8 rounded-full bg-primary text-surface font-semibold text-caption flex items-center justify-center">
          {initials}
        </div>
        <span className="text-small font-medium text-ink hidden sm:inline max-w-[120px] truncate">
          {user.name || user.email}
        </span>
        <ChevronDown className="h-4 w-4 text-ink-muted mr-1" />
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-md bg-surface border border-border shadow-card-hover py-1.5 z-50 text-small animate-in fade-in-50 zoom-in-95">
          <div className="px-3 py-2 border-b border-border mb-1">
            <p className="font-medium text-ink truncate">{user.name || "Student"}</p>
            <p className="text-caption text-ink-muted truncate">{user.email}</p>
            {isStaff && (
              <Badge variant="primary" className="mt-1 text-[10px] uppercase font-bold py-0">
                {userRole}
              </Badge>
            )}
          </div>

          <Link
            href="/dashboard"
            onClick={() => setDropdownOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 text-ink hover:bg-surface-subtle transition-colors"
          >
            <LayoutDashboard className="h-4 w-4 text-primary" />
            <span>My dashboard</span>
          </Link>

          <Link
            href="/onboarding"
            onClick={() => setDropdownOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 text-ink hover:bg-surface-subtle transition-colors"
          >
            <User className="h-4 w-4 text-primary" />
            <span>Profile</span>
          </Link>

          {isStaff && (
            <Link
              href="/admin"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-ink hover:bg-surface-subtle transition-colors"
            >
              <Shield className="h-4 w-4 text-accent" />
              <span>Admin Panel</span>
            </Link>
          )}

          <div className="border-t border-border mt-1 pt-1">
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-danger hover:bg-red-50 transition-colors text-left"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
