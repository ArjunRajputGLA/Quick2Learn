export type AuthRole = "student" | "teacher" | "admin" | "parent";

export interface AuthUser {
  id: string;
  role?: AuthRole | string;
  email?: string;
  name?: string;
}

export class ForbiddenError extends Error {
  readonly status = 403;
  constructor(message = "Forbidden: You do not have permission to perform this action.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends Error {
  readonly status = 404;
  constructor(message = "Not Found: The requested resource does not exist.") {
    super(message);
    this.name = "NotFoundError";
  }
}

export class UnauthorizedError extends Error {
  readonly status = 401;
  constructor(message = "Unauthorized: Authentication required.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export function assert(
  condition: boolean,
  message = "Forbidden",
  status: 401 | 403 | 404 = 403,
): asserts condition {
  if (!condition) {
    if (status === 404) {
      throw new NotFoundError(message);
    }
    if (status === 401) {
      throw new UnauthorizedError(message);
    }
    throw new ForbiddenError(message);
  }
}

export function isStaff(user: AuthUser | null | undefined): boolean {
  if (!user) return false;
  return user.role === "admin" || user.role === "teacher";
}

export function isAdmin(user: AuthUser | null | undefined): boolean {
  if (!user) return false;
  return user.role === "admin";
}

export function isStudent(user: AuthUser | null | undefined): boolean {
  if (!user) return false;
  return user.role === "student";
}

export function isParent(user: AuthUser | null | undefined): boolean {
  if (!user) return false;
  return user.role === "parent";
}

export function canReadResource(
  user: AuthUser | null | undefined,
  resource: { visibility: string; batchId?: string | null },
  enrolledBatchIds: string[] = [],
): boolean {
  if (resource.visibility === "public") {
    return true;
  }
  if (!user) {
    return false;
  }
  if (isStaff(user)) {
    return true;
  }
  if (resource.visibility === "enrolled" && resource.batchId) {
    return enrolledBatchIds.includes(resource.batchId);
  }
  return false;
}

export function canViewPayment(
  user: AuthUser | null | undefined,
  payment: { studentId: string },
  linkedStudentIds: string[] = [],
): boolean {
  if (!user) return false;
  if (isStaff(user)) return true;
  if (user.id === payment.studentId) return true;
  if (isParent(user)) return linkedStudentIds.includes(payment.studentId);
  return false;
}

export function canViewEnrollment(
  user: AuthUser | null | undefined,
  enrollment: { studentId: string },
  linkedStudentIds: string[] = [],
): boolean {
  if (!user) return false;
  if (isStaff(user)) return true;
  if (user.id === enrollment.studentId) return true;
  if (isParent(user)) return linkedStudentIds.includes(enrollment.studentId);
  return false;
}

export function canViewFeeDue(
  user: AuthUser | null | undefined,
  enrollmentStudentId: string,
  linkedStudentIds: string[] = [],
): boolean {
  if (!user) return false;
  if (isStaff(user)) return true;
  if (user.id === enrollmentStudentId) return true;
  if (isParent(user)) return linkedStudentIds.includes(enrollmentStudentId);
  return false;
}

export function canReadAnnouncement(
  user: AuthUser | null | undefined,
  announcement: { audience: string; batchId?: string | null },
  enrolledBatchIds: string[] = [],
): boolean {
  if (isStaff(user)) return true;
  if (announcement.audience === "public") return true;
  if (announcement.audience === "all_students" && !!user) return true;
  if (
    announcement.audience === "batch" &&
    !!user &&
    announcement.batchId &&
    enrolledBatchIds.includes(announcement.batchId)
  ) {
    return true;
  }
  return false;
}

export type AllowedParentScope =
  | "attendance"
  | "tests"
  | "fees"
  | "announcements"
  | "timetable";

/**
 * Authorization helper verifying if a user can act for (or view data for) a student.
 * - Staff (admin/teacher) can act for any student.
 * - Students can act for themselves only.
 * - Parents can read their linked students' attendance, tests, fees, announcements, and timetable, and nothing else.
 */
export async function canActForStudent(
  user: AuthUser | null | undefined,
  studentId: string,
  options?: {
    scope?: AllowedParentScope | string;
    linkedStudentIds?: string[];
  }
): Promise<boolean> {
  if (!user) return false;

  // Student can only act for themselves
  if (user.id === studentId) return true;

  // Staff can act for any student
  if (isStaff(user)) return true;

  // Parent checks
  if (isParent(user)) {
    // Check if the scope is permitted for parents
    const allowedScopes: AllowedParentScope[] = [
      "attendance",
      "tests",
      "fees",
      "announcements",
      "timetable",
    ];
    if (options?.scope && !allowedScopes.includes(options.scope as AllowedParentScope)) {
      return false; // Forbidden scope for parents (e.g. watch lecture, take quiz, edit profile)
    }

    // Check parent-student link
    if (options?.linkedStudentIds) {
      return options.linkedStudentIds.includes(studentId);
    }

    const { isParentLinkedToStudent } = await import("./data/parent");
    return await isParentLinkedToStudent(user.id, studentId);
  }

  return false;
}
