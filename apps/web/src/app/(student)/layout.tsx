import { ReactNode } from "react";
import { requireOnboardedUser } from "@/server/auth/session";

export default async function StudentLayout({
  children,
}: {
  children: ReactNode;
}) {
  // (student) routes need a logged-in, onboarded user (else /onboarding or /login)
  await requireOnboardedUser();

  return <>{children}</>;
}
