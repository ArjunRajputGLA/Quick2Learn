import { db, schema, eq, and, desc, type DatabaseExecutor } from "@quick2learn/db";
import { assert, isStaff, type AuthUser } from "../authz";

export async function getEnrollments(user: AuthUser, tx?: DatabaseExecutor) {
  assert(!!user?.id, "Authentication required to view enrollments.", 401);
  const d = tx || db;
  if (isStaff(user)) {
    return await d.select().from(schema.enrollments).orderBy(desc(schema.enrollments.enrolledAt));
  }
  return await d
    .select()
    .from(schema.enrollments)
    .where(eq(schema.enrollments.studentId, user.id))
    .orderBy(desc(schema.enrollments.enrolledAt));
}

export async function getActiveEnrollmentBatchIds(userId: string, tx?: DatabaseExecutor): Promise<string[]> {
  const d = tx || db;
  const active = await d
    .select({ batchId: schema.enrollments.batchId })
    .from(schema.enrollments)
    .where(
      and(
        eq(schema.enrollments.studentId, userId),
        eq(schema.enrollments.status, "active"),
      ),
    );
  return active.map((e: { batchId: string }) => e.batchId);
}

export async function getStudentEnrolledBatches(user: AuthUser, tx?: DatabaseExecutor) {
  assert(!!user?.id, "Authentication required to view enrolled batches.", 401);
  const d = tx || db;

  const rows = await d
    .select({
      enrollment: schema.enrollments,
      batch: schema.batches,
      faculty: schema.faculty,
      subject: schema.subjects,
    })
    .from(schema.enrollments)
    .innerJoin(schema.batches, eq(schema.enrollments.batchId, schema.batches.id))
    .leftJoin(schema.faculty, eq(schema.batches.facultyId, schema.faculty.id))
    .leftJoin(schema.subjects, eq(schema.batches.subjectId, schema.subjects.id))
    .where(eq(schema.enrollments.studentId, user.id))
    .orderBy(desc(schema.enrollments.enrolledAt));

  return rows;
}

export async function createEnrollment(
  user: AuthUser,
  data: {
    batchId: string;
    studentId: string;
    feePlanId?: string;
    status?: schema.EnrollmentStatus;
    source?: "online" | "admin";
  },
  tx?: DatabaseExecutor,
) {
  if (!isStaff(user)) {
    assert(user.id === data.studentId, "Students cannot create enrollments on behalf of other users.");
  }

  const d = tx || db;
  const [created] = await d
    .insert(schema.enrollments)
    .values({
      batchId: data.batchId,
      studentId: data.studentId,
      feePlanId: data.feePlanId,
      status: data.status || "pending_payment",
      source: isStaff(user) ? (data.source || "admin") : "online",
    })
    .returning();
  return created;
}

export async function updateEnrollmentStatus(
  user: AuthUser,
  enrollmentId: string,
  status: schema.EnrollmentStatus,
  tx?: DatabaseExecutor,
) {
  assert(isStaff(user), "Only staff can modify enrollment statuses.");
  const d = tx || db;
  const [updated] = await d
    .update(schema.enrollments)
    .set({ status })
    .where(eq(schema.enrollments.id, enrollmentId))
    .returning();
  return updated;
}
