import { db, schema, eq, and, or, inArray, desc, type DatabaseExecutor } from "@quick2learn/db";
import { assert, isStaff, canReadResource, type AuthUser } from "../authz";
import { getActiveEnrollmentBatchIds } from "./enrollments";
import { presignedGet, publicUrl } from "../storage";

export interface AccessibleResourceItem {
  id: string;
  title: string;
  type: schema.ResourceType;
  visibility: schema.Visibility;
  storageKey: string;
  createdAt: Date;
  downloadUrl: string;
  isPresigned: boolean;
  subject: {
    id: string;
    name: string;
    slug: string;
  } | null;
  chapter: {
    id: string;
    title: string;
    slug: string;
  } | null;
  batch: {
    id: string;
    title: string;
    slug: string;
  } | null;
}

export async function getResources(user?: AuthUser | null, batchId?: string, tx?: DatabaseExecutor) {
  try {
    const d = tx || db;
    if (isStaff(user)) {
      if (batchId) {
        return await d.select().from(schema.resources).where(eq(schema.resources.batchId, batchId)).orderBy(desc(schema.resources.createdAt));
      }
      return await d.select().from(schema.resources).orderBy(desc(schema.resources.createdAt));
    }

    if (!user?.id) {
      const conditions = [eq(schema.resources.visibility, "public")];
      if (batchId) conditions.push(eq(schema.resources.batchId, batchId));
      return await d
        .select()
        .from(schema.resources)
        .where(and(...conditions))
        .orderBy(desc(schema.resources.createdAt));
    }

    const enrolledBatchIds = await getActiveEnrollmentBatchIds(user.id, d);

    const visibilityConditions = [eq(schema.resources.visibility, "public")];
    if (enrolledBatchIds.length > 0) {
      visibilityConditions.push(
        and(
          eq(schema.resources.visibility, "enrolled"),
          inArray(schema.resources.batchId, enrolledBatchIds),
        )!,
      );
    }

    const queryConditions = [or(...visibilityConditions)!];
    if (batchId) {
      queryConditions.push(eq(schema.resources.batchId, batchId));
    }

    return await d
      .select()
      .from(schema.resources)
      .where(and(...queryConditions))
      .orderBy(desc(schema.resources.createdAt));
  } catch (err) {
    console.warn("getResources query failed, returning empty array:", err);
    return [];
  }
}

export async function getResourceById(user: AuthUser | null | undefined, resourceId: string, tx?: DatabaseExecutor) {
  const d = tx || db;
  const [resource] = await d.select().from(schema.resources).where(eq(schema.resources.id, resourceId));
  if (!resource) return null;

  let enrolledBatchIds: string[] = [];
  if (user?.id) {
    enrolledBatchIds = await getActiveEnrollmentBatchIds(user.id, d);
  }

  assert(canReadResource(user, resource, enrolledBatchIds), "Cannot access this study resource.");
  return resource;
}

/**
 * Generates a secure download URL for a study resource.
 * - Public resources return a direct public URL.
 * - Enrolled-only resources issue a 1-hour presigned URL from src/server/storage.ts ONLY
 *   after confirming that the user is actively enrolled.
 */
export async function getResourceDownloadUrl(
  user: AuthUser | null | undefined,
  resourceId: string,
  tx?: DatabaseExecutor,
): Promise<{ url: string; isPresigned: boolean; expiresInSeconds?: number }> {
  const resource = await getResourceById(user, resourceId, tx);
  assert(!!resource, "Study resource not found.", 404);

  if (resource.visibility === "public") {
    return {
      url: publicUrl(resource.storageKey),
      isPresigned: false,
    };
  }

  // Enrolled-only resource: 1-hour presigned URL
  const signedUrl = await presignedGet(resource.storageKey, 3600);
  return {
    url: signedUrl,
    isPresigned: true,
    expiresInSeconds: 3600,
  };
}

/**
 * Returns accessible resources with joined subject, chapter, and batch details,
 * along with ready-to-use signed/public download URLs.
 */
export async function getAccessibleResourcesWithDetails(
  user: AuthUser | null | undefined,
  filters?: {
    subjectId?: string;
    chapterId?: string;
    batchId?: string;
    type?: string;
  },
  tx?: DatabaseExecutor,
): Promise<AccessibleResourceItem[]> {
  try {
    const d = tx || db;
    const staff = isStaff(user);

    let enrolledBatchIds: string[] = [];
    if (user?.id) {
      enrolledBatchIds = await getActiveEnrollmentBatchIds(user.id, d);
    }

    const whereConditions = [];

    if (!staff) {
      if (!user?.id) {
        whereConditions.push(eq(schema.resources.visibility, "public"));
      } else {
        const visibilityConditions = [eq(schema.resources.visibility, "public")];
        if (enrolledBatchIds.length > 0) {
          visibilityConditions.push(
            and(
              eq(schema.resources.visibility, "enrolled"),
              inArray(schema.resources.batchId, enrolledBatchIds),
            )!,
          );
        }
        whereConditions.push(or(...visibilityConditions)!);
      }
    }

    if (filters?.chapterId) {
      whereConditions.push(eq(schema.resources.chapterId, filters.chapterId));
    }
    if (filters?.batchId) {
      whereConditions.push(eq(schema.resources.batchId, filters.batchId));
    }
    if (filters?.type && filters.type !== "all") {
      whereConditions.push(eq(schema.resources.type, filters.type as schema.ResourceType));
    }

    const rows = await d
      .select({
        resource: schema.resources,
        chapter: schema.chapters,
        subject: schema.subjects,
        batch: schema.batches,
      })
      .from(schema.resources)
      .leftJoin(schema.chapters, eq(schema.resources.chapterId, schema.chapters.id))
      .leftJoin(schema.subjects, eq(schema.chapters.subjectId, schema.subjects.id))
      .leftJoin(schema.batches, eq(schema.resources.batchId, schema.batches.id))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(schema.resources.createdAt));

    // If filtered by subjectId, apply post-filter if not joined directly
    const filteredRows = filters?.subjectId
      ? rows.filter((r) => r.subject?.id === filters.subjectId)
      : rows;

    // Generate appropriate download URLs for each accessible resource
    const results: AccessibleResourceItem[] = await Promise.all(
      filteredRows.map(async (row) => {
        let downloadUrl = "";
        let isPresigned = false;

        if (row.resource.visibility === "public") {
          downloadUrl = publicUrl(row.resource.storageKey);
        } else {
          // Enrolled only: 1-hour presigned URL
          try {
            downloadUrl = await presignedGet(row.resource.storageKey, 3600);
            isPresigned = true;
          } catch {
            downloadUrl = publicUrl(row.resource.storageKey);
          }
        }

        return {
          id: row.resource.id,
          title: row.resource.title,
          type: row.resource.type,
          visibility: row.resource.visibility,
          storageKey: row.resource.storageKey,
          createdAt: row.resource.createdAt,
          downloadUrl,
          isPresigned,
          subject: row.subject
            ? { id: row.subject.id, name: row.subject.name, slug: row.subject.slug }
            : null,
          chapter: row.chapter
            ? { id: row.chapter.id, title: row.chapter.title, slug: row.chapter.slug }
            : null,
          batch: row.batch
            ? { id: row.batch.id, title: row.batch.title, slug: row.batch.slug }
            : null,
        };
      }),
    );

    return results;
  } catch (err) {
    console.warn("getAccessibleResourcesWithDetails failed, returning empty array:", err);
    return [];
  }
}

export async function createResource(user: AuthUser, data: schema.NewResource, tx?: DatabaseExecutor) {
  assert(isStaff(user), "Only staff can upload and publish study resources.");
  const d = tx || db;
  const [created] = await d.insert(schema.resources).values(data).returning();
  assert(!!created, "Failed to create resource");
  return created;
}
