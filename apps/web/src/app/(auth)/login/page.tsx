import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = {
  title: "Sign In | Quick2Learn Portal",
  description: "Sign in to Quick2Learn Student and Administrator Portal.",
};

export default function LoginPage() {
  return (
    <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Suspense fallback={<div className="text-center py-12 text-ink-muted">Loading sign in form...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
