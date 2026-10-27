import { ReactNode } from "react";
import { getAdminSession } from "@/server/auth/session";
import { AdminNav } from "@/components/admin/admin-nav";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getAdminSession();

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 text-slate-900 flex flex-col justify-between">
        {children}
      </div>
    );
  }


  return (
    <AdminNav
      user={{
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.role,
      }}
    >
      {children}
    </AdminNav>
  );
}

