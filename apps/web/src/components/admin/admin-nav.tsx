"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { searchAdminGlobalAction } from "@/server/admin-actions";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  PlaySquare,
  FileText,
  Bell,
  MessageSquare,
  CreditCard,
  Sliders,
  Search,
  ExternalLink,
  LogOut,
  Menu,
  X,
  ShieldAlert,
  Loader2,
  ChevronRight,
} from "lucide-react";

interface AdminNavProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: "admin" | "teacher" | string;
  };
  children: React.ReactNode;
}

interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard, adminOnly: true },
  { label: "Students", href: "/admin/students", icon: Users, adminOnly: true },
  { label: "Batches", href: "/admin/batches", icon: GraduationCap },
  { label: "Lectures", href: "/admin/lectures", icon: PlaySquare },
  { label: "Resources", href: "/admin/resources", icon: FileText },
  { label: "Announcements", href: "/admin/announcements", icon: Bell },
  { label: "Enquiries", href: "/admin/enquiries", icon: MessageSquare, adminOnly: true },
  { label: "Payments", href: "/admin/payments", icon: CreditCard, adminOnly: true },
  { label: "Content", href: "/admin/content", icon: Sliders, adminOnly: true },
];

export function AdminNav({ user, children }: AdminNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Global Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    students: Array<{ id: string; title: string; subtitle: string; href: string }>;
    batches: Array<{ id: string; title: string; subtitle: string; href: string }>;
    videos: Array<{ id: string; title: string; subtitle: string; href: string }>;
  }>({ students: [], batches: [], videos: [] });
  const searchRef = useRef<HTMLDivElement>(null);

  const isAdmin = user.role === "admin";
  const visibleNavItems = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({ students: [], batches: [], videos: [] });
      setSearchOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await searchAdminGlobalAction(searchQuery);
        if (res.success && res.data) {
          setSearchResults(res.data);
          setSearchOpen(true);
        }
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside to close search
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out successfully");
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("Failed to sign out");
    }
  };

  const hasAnyResults =
    searchResults.students.length > 0 ||
    searchResults.batches.length > 0 ||
    searchResults.videos.length > 0;

  return (
    <>
      {/* TOP BAR */}
      <header className="sticky top-0 z-40 bg-white border-b border-border shadow-xs h-16 flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg text-ink hover:bg-neutral-subtle focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link href="/admin" className="flex items-center gap-2 font-black text-body-lg text-ink tracking-tight">
            <span className="text-primary font-extrabold text-xl">Quick2Learn</span>
            <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-bold uppercase tracking-wider">
              Control Panel
            </span>
          </Link>
        </div>

        {/* Global Search Bar */}
        <div ref={searchRef} className="relative flex-1 max-w-md mx-4 hidden sm:block">
          <div className="relative">
            <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search students, batches, videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.trim() && setSearchOpen(true)}
              className="w-full pl-9 pr-9 py-1.5 text-body-sm rounded-lg border border-border bg-surface-subtle text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all"
            />
            {isSearching && (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-ink-muted absolute right-3 top-1/2 -translate-y-1/2" />
            )}
          </div>

          {/* Search Dropdown Modal */}
          {searchOpen && (
            <div className="absolute left-0 right-0 mt-1.5 bg-white rounded-xl border border-border shadow-dropdown p-2 z-50 max-h-96 overflow-y-auto space-y-3">
              {!hasAnyResults && !isSearching ? (
                <div className="p-4 text-center text-caption text-ink-muted">
                  No matching records found for &ldquo;{searchQuery}&rdquo;
                </div>
              ) : (
                <>
                  {searchResults.students.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold text-ink-muted uppercase px-2 py-1 tracking-wider">
                        Students
                      </div>
                      <div className="space-y-0.5">
                        {searchResults.students.map((st) => (
                          <Link
                            key={st.id}
                            href={st.href}
                            onClick={() => setSearchOpen(false)}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-subtle text-left transition-colors"
                          >
                            <div>
                              <div className="text-body-sm font-semibold text-ink">{st.title}</div>
                              <div className="text-[11px] text-ink-muted">{st.subtitle}</div>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-ink-muted shrink-0" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults.batches.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold text-ink-muted uppercase px-2 py-1 tracking-wider">
                        Batches
                      </div>
                      <div className="space-y-0.5">
                        {searchResults.batches.map((b) => (
                          <Link
                            key={b.id}
                            href={b.href}
                            onClick={() => setSearchOpen(false)}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-subtle text-left transition-colors"
                          >
                            <div>
                              <div className="text-body-sm font-semibold text-ink">{b.title}</div>
                              <div className="text-[11px] text-ink-muted">{b.subtitle}</div>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-ink-muted shrink-0" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults.videos.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold text-ink-muted uppercase px-2 py-1 tracking-wider">
                        Lectures
                      </div>
                      <div className="space-y-0.5">
                        {searchResults.videos.map((v) => (
                          <Link
                            key={v.id}
                            href={v.href}
                            onClick={() => setSearchOpen(false)}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-subtle text-left transition-colors"
                          >
                            <div>
                              <div className="text-body-sm font-semibold text-ink line-clamp-1">{v.title}</div>
                              <div className="text-[11px] text-ink-muted">{v.subtitle}</div>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-ink-muted shrink-0" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Right Info & Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2 pr-3 border-r border-border text-right">
            <div>
              <div className="text-caption font-bold text-ink leading-tight">{user.name}</div>
              <div className="text-[11px] text-ink-muted leading-tight">{user.email}</div>
            </div>
            <Badge variant={isAdmin ? "primary" : "neutral"} className="text-[11px] uppercase tracking-wider font-bold">
              {user.role}
            </Badge>
          </div>

          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-caption font-semibold text-ink-muted hover:text-ink hover:bg-surface-subtle transition-colors"
          >
            <span>Public Site</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <button
            onClick={handleSignOut}
            className="p-2 rounded-lg text-ink-muted hover:text-critical hover:bg-critical/10 transition-colors"
            title="Sign Out"
            aria-label="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* BODY SHELL WITH SIDEBAR */}
      <div className="flex min-h-[calc(100vh-4rem)] bg-surface">
        {/* DESKTOP SIDEBAR */}
        <aside className="hidden md:flex flex-col w-60 bg-white border-r border-border shrink-0 p-3 space-y-1">
          <div className="px-3 py-2 mb-2">
            <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">
              Management Modules
            </span>
          </div>

          <nav className="space-y-1 flex-1">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-body-sm font-semibold transition-all ${
                    isActive
                      ? "bg-primary text-white shadow-xs font-bold"
                      : "text-ink-muted hover:text-ink hover:bg-surface-subtle"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Teacher boundary info */}
          {!isAdmin && (
            <div className="p-3 rounded-lg bg-accent/10 border border-accent/20 text-caption text-ink-muted space-y-1">
              <div className="flex items-center gap-1 text-warning font-bold">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Teacher Workspace</span>
              </div>
              <p className="text-[11px]">You have access to Lectures, Resources, Announcements, and your assigned batches.</p>
            </div>
          )}
        </aside>

        {/* MOBILE DRAWER */}
        {mobileOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-black/50 flex">
            <div className="w-64 bg-white h-full p-4 flex flex-col justify-between space-y-4 shadow-xl">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <div className="font-bold text-body text-ink">Admin Modules</div>
                  <button onClick={() => setMobileOpen(false)} className="p-1 text-ink-muted hover:text-ink">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <nav className="space-y-1 mt-4">
                  {visibleNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      item.href === "/admin"
                        ? pathname === "/admin"
                        : pathname.startsWith(item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-body-sm font-semibold ${
                          isActive
                            ? "bg-primary text-white"
                            : "text-ink-muted hover:text-ink hover:bg-surface-subtle"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-between">
                <div>
                  <div className="text-caption font-bold text-ink">{user.name}</div>
                  <div className="text-[11px] text-ink-muted capitalize">{user.role}</div>
                </div>
                <button onClick={handleSignOut} className="p-2 text-critical hover:bg-critical/10 rounded-lg">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-1" onClick={() => setMobileOpen(false)} />
          </div>
        )}

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {/* Mobile Global Search Input */}
          <div className="sm:hidden mb-4">
            <div className="relative">
              <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search students, batches..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-body-sm rounded-lg border border-border bg-white text-ink"
              />
            </div>
          </div>
          {children}
        </main>
      </div>
    </>
  );
}
