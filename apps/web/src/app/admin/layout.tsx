import { ReactNode } from "react";
import { requireRole } from "@/server/auth/session";
import { AdminNav } from "@/components/admin/admin-nav";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  // /admin needs teacher or admin, else 404
  const current = await requireRole(["admin", "teacher"]);

  return (
    <AdminNav
      user={{
        id: current.user.id,
        name: current.user.name,
        email: current.user.email,
        role: current.role,
      }}
    >
      {children}
    </AdminNav>
  );
}
