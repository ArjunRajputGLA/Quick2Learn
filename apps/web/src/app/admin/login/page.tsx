import { redirect } from "next/navigation";
import { getAdminSession } from "@/server/auth/session";
import { AdminLoginForm } from "@/components/admin/admin-login-form";

export const metadata = {
  title: "Admin Login · Quick2Learn Control Plane",
};

export default async function AdminLoginPage() {
  const session = await getAdminSession();
  if (session) {
    redirect(session.role === "teacher" ? "/admin/batches" : "/admin");
  }

  return <AdminLoginForm />;
}
