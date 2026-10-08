import { ReactNode } from "react";
import { requireOnboardedUser } from "@/server/auth/session";
import { DashboardNav } from "@/components/student/dashboard-nav";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const current = await requireOnboardedUser();

  const userProp = {
    id: current.user.id,
    name: current.user.name,
    email: current.user.email,
    role: current.role,
    classLevel: current.profile?.classLevel,
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col md:flex-row">
      <DashboardNav user={userProp} />
      <main className="flex-1 min-w-0 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12">
        {children}
      </main>
    </div>
  );
}
