"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import { adminLogoutAction } from "@/server/admin-auth-actions";
import { toast } from "sonner";
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
  ExternalLink,
  LogOut,
  Menu,
  X,
  ShieldAlert,
  ChevronRight,
  HelpCircle,
  Award,
  RefreshCw,
  PanelLeft,
  ChevronsUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: "MAIN",
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard, adminOnly: true },
    ],
  },
  {
    title: "MANAGEMENT",
    items: [
      { label: "Students", href: "/admin/students", icon: Users, adminOnly: true },
      { label: "Batches", href: "/admin/batches", icon: GraduationCap },
      { label: "Question Bank", href: "/admin/questions", icon: HelpCircle },
      { label: "Tests & Quizzes", href: "/admin/tests", icon: Award },
    ],
  },
  {
    title: "COMMUNICATION",
    items: [
      { label: "Chats", href: "/admin/chats", icon: MessageSquare },
      { label: "Announcements", href: "/admin/announcements", icon: Bell },
      { label: "Enquiries", href: "/admin/enquiries", icon: MessageSquare, adminOnly: true },
    ],
  },
  {
    title: "MEDIA & FINANCE",
    items: [
      { label: "Lectures", href: "/admin/lectures", icon: PlaySquare },
      { label: "Resources", href: "/admin/resources", icon: FileText },
      { label: "Payments", href: "/admin/payments", icon: CreditCard, adminOnly: true },
      { label: "Content", href: "/admin/content", icon: Sliders, adminOnly: true },
    ],
  },
];

export function AdminNav({ user, children }: AdminNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isAdmin = user.role === "admin";

  // Load collapsed preference from localStorage and register keyboard shortcuts
  useEffect(() => {
    try {
      const saved = localStorage.getItem("q2l_admin_sidebar_collapsed");
      if (saved !== null) {
        setIsCollapsed(saved === "true");
      }
    } catch {}

    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle sidebar: Ctrl+B or Cmd+B
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setIsCollapsed((prev) => {
          const next = !prev;
          try {
            localStorage.setItem("q2l_admin_sidebar_collapsed", String(next));
          } catch {}
          return next;
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("q2l_admin_sidebar_collapsed", String(next));
      } catch {}
      return next;
    });
  };

  const handleSignOut = async () => {
    try {
      await adminLogoutAction();
      try {
        await signOut();
      } catch {}
      toast.success("Signed out of Admin Panel");
      router.push("/admin");
      router.refresh();
    } catch {
      toast.error("Failed to sign out");
    }
  };

  const [isSyncingMobile, setIsSyncingMobile] = useState(false);

  const handleSyncWithMobile = async () => {
    setIsSyncingMobile(true);
    try {
      const res = await fetch("/api/v1/admin/sync");
      const data = await res.json();
      if (data.success) {
        toast.success(
          `Mobile App & CRM Synced! (${data.counts?.batches || 0} batches, ${data.counts?.students || 0} students)`
        );
        router.refresh();
      } else {
        toast.error("Failed to sync mobile app");
      }
    } catch {
      toast.error("Failed to connect to sync endpoint");
    } finally {
      setIsSyncingMobile(false);
    }
  };

  // Flattened items for active page title check & mobile nav
  const allNavItems = NAV_GROUPS.flatMap((g) => g.items);
  const visibleNavItems = allNavItems.filter((item) => !item.adminOnly || isAdmin);

  const activeGroup = NAV_GROUPS.find((g) =>
    g.items.some((item) =>
      item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href)
    )
  );

  const activeNavItem = visibleNavItems.find((item) =>
    item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href)
  );

  const userInitial =
    (user.name || "Dinesh")
      .trim()
      .charAt(0)
      .toUpperCase() || "D";

  return (
    <div className="h-screen flex flex-col bg-[#f0f4f9] text-slate-900 antialiased overflow-hidden">
      {/* 1. PROFESSIONAL TOP HEADER (Seamlessly in same layer as sidebar) */}
      <header className="shrink-0 z-40 bg-[#f0f4f9] h-14 flex items-center justify-between px-3 sm:px-5 transition-all">
        {/* Left: Organization Badge + Sidebar Toggle + Breadcrumb */}
        <div className="flex items-center gap-3">
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none transition-colors"
            aria-label="Toggle navigation menu"
            suppressHydrationWarning
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Organization Badge (like YI Yamuna Infra in inspiration) */}
          <Link href="/admin" className="flex items-center gap-2.5 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/logo.png"
              alt="Quick2Learn"
              className="w-8 h-8 rounded-lg object-contain shadow-xs shrink-0"
            />
            <div className="hidden sm:block text-left leading-tight">
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1 group-hover:text-blue-600 transition-colors">
                <span>Quick2Learn Mathura</span>
                <ChevronsUpDown className="w-3 h-3 text-slate-400" />
              </div>
              <div className="text-[10px] text-slate-500 font-medium">Enterprise Portal</div>
            </div>
          </Link>

          {/* Desktop Sidebar Collapse Toggle Button */}
          <button
            type="button"
            onClick={toggleSidebar}
            className="hidden md:flex items-center justify-center w-7.5 h-7.5 rounded-md border border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all cursor-pointer ml-1"
            title={isCollapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
            aria-label="Toggle Sidebar"
          >
            <PanelLeft className="w-4 h-4 text-slate-600" />
          </button>

          {/* Breadcrumbs (like Workspaces > Management > Leads & Customers) */}
          {activeNavItem && (
            <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500 font-medium pl-2">
              <span>Workspaces</span>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <span>{activeGroup?.title === "MAIN" ? "Dashboard" : activeGroup?.title || "Management"}</span>
              {activeNavItem.href !== "/admin" && (
                <>
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                  <span className="font-bold text-slate-900">{activeNavItem.label}</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Right: Sync Status + Public Site Link + User Avatar */}
        <div className="flex items-center gap-2">
          {/* Mobile App Two-Way Sync Indicator */}
          <button
            type="button"
            onClick={handleSyncWithMobile}
            disabled={isSyncingMobile}
            suppressHydrationWarning
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-[11px] font-semibold hover:bg-emerald-100 active:scale-95 transition-all cursor-pointer shadow-2xs"
            title="Two-way synchronized with Quick2Learn Mobile App (Click to refresh)"
          >
            <RefreshCw className={cn("w-3 h-3 text-emerald-600", isSyncingMobile && "animate-spin")} />
            <span className="hidden sm:inline">Mobile Synced</span>
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
          </button>

          {/* Public site link */}
          <Link
            href="/"
            target="_blank"
            className="w-8 h-8 rounded-full border border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-50 flex items-center justify-center transition-colors shadow-2xs"
            title="Open Public Website"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          {/* User Profile Avatar Circle (Solid Blue Circle with Initial like 'Y' in inspiration) */}
          <div
            className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs cursor-pointer hover:opacity-95 transition-opacity"
            title={`${user.name} (${user.role.toUpperCase()}) - ${user.email}`}
          >
            {userInitial}
          </div>
        </div>
      </header>

      {/* 2. BODY SHELL WITH FIXED, EXPANDABLE / COLLAPSIBLE SIDEBAR */}
      <div className="flex flex-1 overflow-hidden">
        {/* DESKTOP SIDEBAR (Seamlessly in same base layer as header) */}
        <aside
          className={cn(
            "hidden md:flex flex-col bg-[#f0f4f9] shrink-0 h-full transition-all duration-200 ease-in-out select-none",
            isCollapsed ? "w-[60px]" : "w-52"
          )}
        >
          {/* Main Navigation Groups - All fit in one single frame */}
          <div className="flex-1 overflow-y-auto py-2 px-2 space-y-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {NAV_GROUPS.map((group, groupIdx) => {
              const groupItems = group.items.filter((item) => !item.adminOnly || isAdmin);
              if (groupItems.length === 0) return null;

              return (
                <div key={group.title} className="space-y-0.5">
                  {!isCollapsed ? (
                    <div className="px-2.5 py-0.5 h-5 flex items-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {group.title}
                      </span>
                    </div>
                  ) : groupIdx > 0 ? (
                    <div className="w-6 mx-auto my-1.5 border-t border-slate-200/80" />
                  ) : null}

                  <nav className="space-y-0.5">
                    {groupItems.map((item) => {
                      const Icon = item.icon;
                      const isActive =
                        item.href === "/admin"
                          ? pathname === "/admin"
                          : pathname.startsWith(item.href);

                      return (
                        <div key={item.href} className="relative group">
                          <Link
                            href={item.href}
                            className={cn(
                              "flex items-center rounded-lg text-xs font-medium transition-all",
                              isCollapsed
                                ? "justify-center w-8 h-8 mx-auto"
                                : "gap-2.5 px-2.5 h-8 w-full",
                              isActive
                                ? "bg-white text-[#2563eb] font-semibold shadow-2xs border border-slate-200/80"
                                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                            )}
                            title={isCollapsed ? item.label : undefined}
                          >
                            <Icon
                              className={cn(
                                "w-4 h-4 shrink-0 transition-colors",
                                isActive ? "text-[#2563eb]" : "text-slate-500 group-hover:text-slate-800"
                              )}
                            />
                            {!isCollapsed && (
                              <span className="truncate">{item.label}</span>
                            )}
                          </Link>

                          {/* Hover Tooltip when sidebar is collapsed */}
                          {isCollapsed && (
                            <div className="absolute left-full ml-2.5 top-1/2 -translate-y-1/2 z-50 pointer-events-none opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 transition-all duration-150">
                              <div className="px-2.5 py-1 text-xs font-medium text-white bg-slate-900/95 backdrop-blur-sm rounded-md shadow-lg whitespace-nowrap border border-slate-700/50">
                                {item.label}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </nav>
                </div>
              );
            })}
          </div>

          {/* Teacher boundary info */}
          {!isAdmin && !isCollapsed && (
            <div className="mx-2 my-1.5 p-2 rounded-lg bg-amber-50/80 border border-amber-200/60 text-xs text-amber-900 space-y-0.5 shrink-0">
              <div className="flex items-center gap-1.5 text-amber-800 font-bold">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Teacher Workspace</span>
              </div>
              <p className="text-[11px] text-amber-700/90 leading-tight">
                Assigned batches, lectures, and doubts only.
              </p>
            </div>
          )}

          {/* GLAD Studio Attribution - Above separation line, centered */}
          <div className="px-2 pt-1 pb-1 flex items-center justify-center shrink-0">
            {isCollapsed ? (
              <a
                href="https://gladstudio.net"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-200/60 transition-all cursor-pointer group"
                title="Developed by GLAD Studio (gladstudio.net)"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/website logo(white background compatible).png"
                  alt="GLAD Studio"
                  className="max-h-5 max-w-[32px] object-contain group-hover:scale-110 transition-transform"
                />
              </a>
            ) : (
              <a
                href="https://gladstudio.net"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center justify-center gap-2 px-2 py-1 rounded-md hover:bg-slate-200/50 transition-all cursor-pointer"
                title="Developed by GLAD Studio (gladstudio.net)"
              >
                <span className="text-[11px] text-slate-500 font-medium whitespace-nowrap">
                  Developed by
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/website logo(white background compatible).png"
                  alt="GLAD Studio"
                  className="h-5 w-auto object-contain group-hover:scale-105 transition-transform"
                />
              </a>
            )}
          </div>

          {/* Sidebar Bottom Footer: Separation Line + Logout */}
          <div className="p-2 border-t border-slate-200/60 bg-transparent shrink-0">
            <button
              onClick={handleSignOut}
              suppressHydrationWarning
              className={cn(
                "flex items-center text-rose-500 hover:text-rose-600 hover:bg-rose-50/70 rounded-lg transition-colors cursor-pointer",
                isCollapsed
                  ? "justify-center w-8 h-8 mx-auto"
                  : "gap-2.5 px-2.5 h-8 w-full text-xs font-medium"
              )}
              title="Logout"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Logout</span>}
            </button>
          </div>
        </aside>

        {/* MOBILE DRAWER (Full screen sliding drawer) */}
        {mobileOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex">
            <div className="w-64 bg-white h-full p-4 flex flex-col justify-between space-y-4 shadow-2xl animate-in slide-in-from-left duration-200">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/images/logo.png"
                      alt="Quick2Learn"
                      className="w-7 h-7 rounded-lg object-contain shrink-0"
                    />
                    <span>Quick2Learn</span>
                  </div>
                  <button
                    onClick={() => setMobileOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100"
                  >
                    <X className="w-4.5 h-4.5" />
                  </button>
                </div>

                <nav className="space-y-4 mt-4 overflow-y-auto max-h-[calc(100vh-140px)]">
                  {NAV_GROUPS.map((group) => {
                    const groupItems = group.items.filter((item) => !item.adminOnly || isAdmin);
                    if (groupItems.length === 0) return null;

                    return (
                      <div key={group.title} className="space-y-1">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2">
                          {group.title}
                        </div>
                        {groupItems.map((item) => {
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
                              className={cn(
                                "flex items-center gap-2.5 px-2.5 h-8 rounded-lg text-xs font-medium transition-all",
                                isActive
                                  ? "bg-blue-600 text-white font-semibold shadow-xs"
                                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                              )}
                            >
                              <Icon className={cn("w-4 h-4 shrink-0 transition-colors", isActive ? "text-white" : "text-slate-500")} />
                              <span>{item.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    );
                  })}
                </nav>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800">{user.name}</div>
                  <div className="text-[10px] text-slate-400 capitalize">{user.role}</div>
                </div>
                <button
                  onClick={handleSignOut}
                  suppressHydrationWarning
                  className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-1" onClick={() => setMobileOpen(false)} />
          </div>
        )}

        {/* 3. MAIN CONTENT AREA (Elevated layer on top of unified header/sidebar with curved top-left corner, fully stretched and relaxed) */}
        <main className="flex-1 min-w-0 w-full bg-white rounded-tl-[24px] sm:rounded-tl-[32px] border-t border-l border-slate-200/80 shadow-sm overflow-y-auto p-4 sm:p-5 lg:p-6 relative transition-all duration-200 ease-in-out">
          {children}
        </main>
      </div>
    </div>
  );
} 