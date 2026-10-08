import { requireOnboardedUser } from "@/server/auth/session";
import { StudentProfileForm } from "@/components/student/student-profile-form";
import { Badge } from "@/components/ui/badge";

export const revalidate = 0;

export default async function StudentProfilePage() {
  const current = await requireOnboardedUser();
  const profile = current.profile!;

  const initialData = {
    fullName: profile.fullName,
    email: current.user.email,
    phone: profile.phone,
    classLevel: profile.classLevel,
    board: profile.board,
    school: profile.school,
    city: profile.city,
    parentName: profile.parentName,
    parentPhone: profile.parentPhone,
    role: current.role,
    onboardedAt: profile.onboardedAt,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-h2 font-extrabold text-ink tracking-tight">
            Student Profile &amp; Settings
          </h1>
          <p className="text-body-sm text-ink-muted">
            Manage your personal student details and parent contact for institute communications.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="primary" className="text-xs">
            Role: {current.role.toUpperCase()}
          </Badge>
        </div>
      </div>

      {/* Profile Form */}
      <StudentProfileForm initialData={initialData} />
    </div>
  );
}
