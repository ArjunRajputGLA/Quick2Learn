import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = {
  title: "Login & Register | Quick2Learn",
  description: "Sign in to access your Quick2Learn courses, video lectures, and study materials.",
};

export default function LoginPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16 bg-surface-subtle">
      <Suspense
        fallback={
          <div className="w-full max-w-md mx-auto p-8 rounded-lg bg-surface border border-border text-center text-ink-muted">
            Loading authentication portal...
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
