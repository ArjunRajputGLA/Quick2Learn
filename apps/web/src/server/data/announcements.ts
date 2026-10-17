import { db, schema, eq, and, or, inArray, desc, type DatabaseExecutor } from "@quick2learn/db";
import { assert, isStaff, type AuthUser } from "../authz";
import { getActiveEnrollmentBatchIds } from "./enrollments";

export async function getAnnouncements(user?: AuthUser | null, batchId?: string, tx?: DatabaseExecutor) {
  try {
    const d = tx || db;
    if (isStaff(user)) {
      if (batchId) {
        return await d.select().from(schema.announcements).where(eq(schema.announcements.batchId, batchId)).orderBy(desc(schema.announcements.isPinned), desc(schema.announcements.publishedAt));
      }
      return await d.select().from(schema.announcements).orderBy(desc(schema.announcements.isPinned), desc(schema.announcements.publishedAt));
    }

    if (!user?.id) {
      const conditions = [eq(schema.announcements.audience, "public")];
      if (batchId) conditions.push(eq(schema.announcements.batchId, batchId));
      return await d.select().from(schema.announcements).where(and(...conditions)).orderBy(desc(schema.announcements.isPinned), desc(schema.announcements.publishedAt));
    }

    const enrolledBatchIds = await getActiveEnrollmentBatchIds(user.id, d);
    const audienceConditions = [
      eq(schema.announcements.audience, "public"),
      eq(schema.announcements.audience, "all_students"),
    ];

    if (enrolledBatchIds.length > 0) {
      audienceConditions.push(
        and(
          eq(schema.announcements.audience, "batch"),
          inArray(schema.announcements.batchId, enrolledBatchIds),
        )!,
      );
    }

    const queryConditions = [or(...audienceConditions)!];
    if (batchId) {
      queryConditions.push(eq(schema.announcements.batchId, batchId));
    }

    return await d
      .select()
      .from(schema.announcements)
      .where(and(...queryConditions))
      .orderBy(desc(schema.announcements.isPinned), desc(schema.announcements.publishedAt));
  } catch (err) {
    console.warn("getAnnouncements query failed, returning empty array:", err);
    return [];
  }
}

export async function createAnnouncement(user: AuthUser, data: schema.NewAnnouncement, tx?: DatabaseExecutor) {
  assert(isStaff(user), "Only staff can post announcements.");
  const d = tx || db;
  const [created] = await d.insert(schema.announcements).values(data).returning();
  assert(!!created, "Failed to create announcement");
  return created;
}
