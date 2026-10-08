export type AuthRole = "student" | "teacher" | "admin";

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
): boolean {
  if (!user) return false;
  if (isStaff(user)) return true;
  return user.id === payment.studentId;
}

export function canViewEnrollment(
  user: AuthUser | null | undefined,
  enrollment: { studentId: string },
): boolean {
  if (!user) return false;
  if (isStaff(user)) return true;
  return user.id === enrollment.studentId;
}

export function canViewFeeDue(
  user: AuthUser | null | undefined,
  enrollmentStudentId: string,
): boolean {
  if (!user) return false;
  if (isStaff(user)) return true;
  return user.id === enrollmentStudentId;
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
