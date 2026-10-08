"use server";

import { z } from "zod";
import { requireRole } from "./auth/session";
import {
  manualEnrollStudent,
  waiveFeeDue,
  addStudentNote,
  saveBatchWithPlans,
  bulkUpdateVideos,
  mapPlaylistToChapter,
  deleteResource,
  deleteAnnouncement,
  convertEnquiryToStudent,
} from "./data/admin";
import { createResource } from "./data/resources";
import { createAnnouncement } from "./data/announcements";
import { updateEnquiry } from "./data/enquiries";
import { updateSetting } from "./data/settings";
import { recordOfflinePayment } from "./payments/service";
import { syncYouTubeChannel } from "./youtube/sync";
import { presignedPut } from "./storage";
import { db, schema, eq, sql, or } from "@quick2learn/db";
import { revalidateDataTag, safeRevalidatePath as revalidatePath } from "./data/cached-home";
import type { AuthUser } from "./authz";

function toAuthUser(current: Awaited<ReturnType<typeof requireRole>>): AuthUser {
  return {
    id: current.user.id,
    email: current.user.email,
    name: current.user.name,
    role: current.role,
  };
}

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// -------------------------------------------------------------
// 1. GLOBAL SEARCH (STUDENTS, BATCHES, VIDEOS)
// -------------------------------------------------------------

export async function searchAdminGlobalAction(query: string): Promise<ActionResult<{
  students: Array<{ id: string; title: string; subtitle: string; href: string }>;
  batches: Array<{ id: string; title: string; subtitle: string; href: string }>;
  videos: Array<{ id: string; title: string; subtitle: string; href: string }>;
}>> {
  const current = await requireRole(["admin", "teacher"]);
  const q = query.trim().toLowerCase();
  if (!q) {
    return { success: true, data: { students: [], batches: [], videos: [] } };
  }

  const s = `%${q}%`;

  // 1. Students (admin only)
  let students: Array<{ id: string; title: string; subtitle: string; href: string }> = [];
  if (current.role === "admin") {
    const studentRows = await db
      .select({
        id: schema.user.id,
        name: schema.profiles.fullName,
        email: schema.user.email,
        phone: schema.profiles.phone,
        classLevel: schema.profiles.classLevel,
      })
      .from(schema.user)
      .innerJoin(schema.profiles, eq(schema.user.id, schema.profiles.userId))
      .where(
        or(
          sql`lower(${schema.profiles.fullName}) LIKE ${s}`,
          sql`lower(${schema.user.email}) LIKE ${s}`,
          sql`${schema.profiles.phone} LIKE ${s}`,
        ),
      )
      .limit(5);

    students = studentRows.map((st) => ({
      id: st.id,
      title: st.name || st.email,
      subtitle: `${st.email} ${st.phone ? `· ${st.phone}` : ""} · Class ${st.classLevel || 12}`,
      href: `/admin/students/${st.id}`,
    }));
  }

  // 2. Batches
  const batchRows = await db
    .select({
      id: schema.batches.id,
      title: schema.batches.title,
      slug: schema.batches.slug,
      status: schema.batches.status,
      mode: schema.batches.mode,
    })
    .from(schema.batches)
    .where(sql`lower(${schema.batches.title}) LIKE ${s}`)
    .limit(5);

  const batches = batchRows.map((b) => ({
    id: b.id,
    title: b.title,
    subtitle: `${b.status.toUpperCase()} · ${b.mode} mode`,
    href: `/admin/batches/${b.id}`,
  }));

  // 3. Videos
  const videoRows = await db
    .select({
      id: schema.youtubeVideos.id,
      title: schema.youtubeVideos.title,
      isPublished: schema.youtubeVideos.isPublished,
    })
    .from(schema.youtubeVideos)
    .where(
      or(
        sql`lower(${schema.youtubeVideos.title}) LIKE ${s}`,
        eq(schema.youtubeVideos.id, query.trim()),
      ),
    )
    .limit(5);

  const videos = videoRows.map((v) => ({
    id: v.id,
    title: v.title,
    subtitle: `YouTube ID: ${v.id} · ${v.isPublished ? "Published" : "Unpublished"}`,
    href: `/admin/lectures?q=${encodeURIComponent(v.id)}`,
  }));

  return { success: true, data: { students, batches, videos } };
}

// -------------------------------------------------------------
// 2. SYNC YOUTUBE NOW
// -------------------------------------------------------------

export async function syncYouTubeNowAction(): Promise<ActionResult> {
  await requireRole(["admin"]);
  try {
    const result = await syncYouTubeChannel();
    revalidateDataTag("videos");
    revalidatePath("/admin");
    revalidatePath("/admin/lectures");
    return { success: true, data: result };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "YouTube sync failed";
    return { success: false, error: msg };
  }
}

// -------------------------------------------------------------
// 3. PRESIGNED UPLOAD URL FOR S3/MINIO
// -------------------------------------------------------------

const uploadRequestSchema = z.object({
  filename: z.string().min(1),
  contentType: z.string().min(1),
  sizeBytes: z.number().int().positive().max(26214400, "File exceeds maximum size of 25 MB"),
  folder: z.enum(["resources/public", "resources/private", "covers", "photos", "testimonials", "results"]),
});

export async function getPresignedUploadUrlAction(
  input: z.infer<typeof uploadRequestSchema>,
): Promise<ActionResult<{ uploadUrl: string; key: string }>> {
  await requireRole(["admin", "teacher"]);

  const parsed = uploadRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message || "Invalid upload parameters" };
  }

  const { filename, contentType, sizeBytes, folder } = parsed.data;

  // Validate allowed extensions
  const cleanName = filename.toLowerCase().replace(/[^a-z0-9._-]/g, "_");
  const isPdf = contentType === "application/pdf" || cleanName.endsWith(".pdf");
  const isImage = contentType.startsWith("image/");

  if (folder.startsWith("resources/") && !isPdf) {
    return { success: false, error: "Only PDF documents can be uploaded as study materials." };
  }
  if (!folder.startsWith("resources/") && !isImage) {
    return { success: false, error: "Only image files (JPEG, PNG, WEBP) are allowed for this media type." };
  }

  const uniqueKey = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}-${cleanName}`;

  try {
    const uploadUrl = await presignedPut(uniqueKey, contentType, sizeBytes);
    return { success: true, data: { uploadUrl, key: uniqueKey } };
  } catch (err: unknown) {
    console.error("[getPresignedUploadUrlAction] Presigned URL generation failed:", err);
    return { success: false, error: "Failed to generate upload URL." };
  }
}

// -------------------------------------------------------------
// 4. STUDENT ACTIONS (ENROL, RECORD OFFLINE PAYMENT, WAIVE, NOTE)
// -------------------------------------------------------------

const manualEnrollSchema = z.object({
  studentId: z.string().min(1),
  batchId: z.string().uuid(),
  feePlanId: z.string().uuid().optional(),
});

export async function manualEnrollStudentAction(input: z.infer<typeof manualEnrollSchema>): Promise<ActionResult> {
  const current = await requireRole(["admin"]);
  const parsed = manualEnrollSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message };
  }

  try {
    const enrollment = await manualEnrollStudent(toAuthUser(current), parsed.data);
    return { success: true, data: enrollment };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Manual enrollment failed" };
  }
}

const offlinePaymentSchema = z.object({
  studentId: z.string().min(1),
  dueId: z.string().uuid(),
  method: z.enum(["cash", "upi_offline", "bank_transfer"]),
  amountPaise: z.number().int().positive(),
  note: z.string().trim().optional(),
});

export async function recordOfflinePaymentAction(input: z.infer<typeof offlinePaymentSchema>): Promise<ActionResult> {
  const current = await requireRole(["admin"]);
  const parsed = offlinePaymentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message };
  }

  try {
    const result = await recordOfflinePayment(toAuthUser(current), parsed.data);
    revalidatePath("/admin/payments");
    revalidatePath(`/admin/students/${parsed.data.studentId}`);
    revalidatePath("/dashboard/payments");
    return { success: true, data: result };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to record payment" };
  }
}

const waiveDueSchema = z.object({
  dueId: z.string().uuid(),
  studentId: z.string().min(1),
  reason: z.string().trim().min(3, "Reason is required when waiving fees"),
});

export async function waiveFeeDueAction(input: z.infer<typeof waiveDueSchema>): Promise<ActionResult> {
  const current = await requireRole(["admin"]);
  const parsed = waiveDueSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message };
  }

  try {
    const res = await waiveFeeDue(toAuthUser(current), parsed.data);
    return { success: true, data: res };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to waive due" };
  }
}

const addNoteSchema = z.object({
  studentId: z.string().min(1),
  note: z.string().trim().min(2, "Note cannot be empty"),
});

export async function addStudentNoteAction(input: z.infer<typeof addNoteSchema>): Promise<ActionResult> {
  const current = await requireRole(["admin", "teacher"]);
  const parsed = addNoteSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message };
  }

  try {
    const res = await addStudentNote(toAuthUser(current), parsed.data);
    return { success: true, data: res };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to add note" };
  }
}

// -------------------------------------------------------------
// 5. BATCH CREATION & MODIFICATION
// -------------------------------------------------------------

export async function saveBatchAction(data: {
  id?: string;
  title: string;
  slug: string;
  subtitle?: string;
  classLevel: number;
  board: "cbse" | "icse" | "isc";
  subjectId: string;
  facultyId?: string;
  mode: "offline" | "online" | "hybrid";
  scheduleText: string;
  locationText?: string;
  startDate: string;
  endDate?: string;
  seatsTotal: number;
  status: "draft" | "open" | "closed" | "completed";
  isFeatured: boolean;
  whatsappGroupUrl?: string;
  coverKey?: string;
  description: string;
  outcomes: string[];
  syllabus: unknown[];
  faqs: unknown[];
  feePlans?: Array<{
    id?: string;
    name: string;
    totalPaise: number;
    originalPaise?: number;
    instalments?: unknown[];
    isActive?: boolean;
  }>;
}): Promise<ActionResult> {
  const current = await requireRole(["admin"]);
  try {
    const res = await saveBatchWithPlans(toAuthUser(current), data);
    return { success: true, data: res };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to save batch" };
  }
}

// -------------------------------------------------------------
// 6. LECTURES & PLAYLIST ACTIONS
// -------------------------------------------------------------

const bulkUpdateVideosSchema = z.object({
  videoIds: z.array(z.string()).min(1, "Select at least one lecture"),
  classLevel: z.number().int().min(9).max(12).optional(),
  subjectId: z.string().uuid().optional(),
  chapterId: z.string().uuid().optional(),
  isPublished: z.boolean().optional(),
  isShort: z.boolean().optional(),
  needsReview: z.boolean().optional(),
});

export async function bulkUpdateVideosAction(input: z.infer<typeof bulkUpdateVideosSchema>): Promise<ActionResult> {
  const current = await requireRole(["admin", "teacher"]);
  const parsed = bulkUpdateVideosSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message };
  }

  try {
    const updated = await bulkUpdateVideos(toAuthUser(current), parsed.data);
    return { success: true, data: updated };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Bulk update failed" };
  }
}

const mapPlaylistSchema = z.object({
  playlistId: z.string().min(1),
  classLevel: z.number().int().min(9).max(12),
  subjectId: z.string().uuid(),
  chapterId: z.string().uuid(),
});

export async function mapPlaylistAction(
  input: z.infer<typeof mapPlaylistSchema>,
): Promise<ActionResult<{ playlistId: string; updatedVideosCount: number }>> {
  const current = await requireRole(["admin", "teacher"]);
  const parsed = mapPlaylistSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message };
  }

  try {
    const res = await mapPlaylistToChapter(toAuthUser(current), parsed.data);
    return { success: true, data: res };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Playlist mapping failed" };
  }
}

// -------------------------------------------------------------
// 7. RESOURCES ACTIONS
// -------------------------------------------------------------

const createResourceSchema = z.object({
  title: z.string().trim().min(2),
  type: z.enum(["notes", "worksheet", "pyq", "formula_sheet"]),
  storageKey: z.string().min(1),
  storageBucket: z.enum(["public", "private"]),
  visibility: z.enum(["public", "enrolled"]),
  chapterId: z.string().uuid().optional().nullable(),
  batchId: z.string().uuid().optional().nullable(),
  videoId: z.string().optional().nullable(),
});

export async function createResourceAction(input: z.infer<typeof createResourceSchema>): Promise<ActionResult> {
  const current = await requireRole(["admin", "teacher"]);
  const parsed = createResourceSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message };
  }

  try {
    const res = await createResource(toAuthUser(current), {
      title: parsed.data.title,
      type: parsed.data.type,
      storageKey: parsed.data.storageKey,
      storageBucket: parsed.data.storageBucket,
      visibility: parsed.data.visibility,
      chapterId: parsed.data.chapterId || null,
      batchId: parsed.data.batchId || null,
      videoId: parsed.data.videoId || null,
      createdBy: current.user.id,
    });

    await db.insert(schema.auditLog).values({
      actorId: current.user.id,
      action: "create_resource",
      entity: "resources",
      entityId: res.id,
      diff: { title: res.title, storageKey: res.storageKey },
    });

    revalidatePath("/admin/resources");
    revalidatePath("/dashboard/notes");
    revalidatePath("/learn");

    return { success: true, data: res };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to create resource" };
  }
}

export async function deleteResourceAction(resourceId: string): Promise<ActionResult> {
  const current = await requireRole(["admin", "teacher"]);
  try {
    const res = await deleteResource(toAuthUser(current), resourceId);
    return { success: true, data: res };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to delete resource" };
  }
}

// -------------------------------------------------------------
// 8. ANNOUNCEMENTS ACTIONS
// -------------------------------------------------------------

const createAnnouncementSchema = z.object({
  title: z.string().trim().min(3),
  body: z.string().trim().min(5),
  audience: z.enum(["public", "all_students", "batch"]),
  batchId: z.string().uuid().optional().nullable(),
  isPinned: z.boolean().default(false),
  publishedAt: z.string().optional(),
});

export async function createAnnouncementAction(input: z.infer<typeof createAnnouncementSchema>): Promise<ActionResult> {
  const current = await requireRole(["admin", "teacher"]);
  const parsed = createAnnouncementSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message };
  }

  try {
    const res = await createAnnouncement(toAuthUser(current), {
      title: parsed.data.title,
      body: parsed.data.body,
      audience: parsed.data.audience,
      batchId: parsed.data.audience === "batch" ? parsed.data.batchId || null : null,
      isPinned: parsed.data.isPinned,
      publishedAt: parsed.data.publishedAt ? new Date(parsed.data.publishedAt) : new Date(),
      createdBy: current.user.id,
    });

    await db.insert(schema.auditLog).values({
      actorId: current.user.id,
      action: "create_announcement",
      entity: "announcements",
      entityId: res.id,
      diff: { title: res.title, audience: res.audience },
    });

    revalidatePath("/admin/announcements");
    revalidatePath("/dashboard");
    revalidatePath("/");

    return { success: true, data: res };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to post announcement" };
  }
}

export async function deleteAnnouncementAction(announcementId: string): Promise<ActionResult> {
  const current = await requireRole(["admin", "teacher"]);
  try {
    const res = await deleteAnnouncement(toAuthUser(current), announcementId);
    return { success: true, data: res };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to delete announcement" };
  }
}

// -------------------------------------------------------------
// 9. ENQUIRIES ACTIONS
// -------------------------------------------------------------

export async function updateEnquiryStatusAction(
  enquiryId: string,
  status: "new" | "contacted" | "enrolled" | "closed",
  notes?: string,
): Promise<ActionResult> {
  const current = await requireRole(["admin"]);
  try {
    const res = await updateEnquiry(toAuthUser(current), enquiryId, {
      status,
      notes: notes !== undefined ? notes : undefined,
      updatedAt: new Date(),
    });
    revalidatePath("/admin/enquiries");
    return { success: true, data: res };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to update enquiry" };
  }
}

export async function convertEnquiryToStudentAction(
  enquiryId: string,
): Promise<ActionResult<{ studentUserId: string; studentEmail: string }>> {
  const current = await requireRole(["admin"]);
  try {
    const res = await convertEnquiryToStudent(toAuthUser(current), enquiryId);
    return { success: true, data: res };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to convert enquiry" };
  }
}

// -------------------------------------------------------------
// 10. CONTENT ACTIONS (FACULTY, TESTIMONIALS, RESULTS, SETTINGS)
// -------------------------------------------------------------

export async function saveFacultyMemberAction(data: {
  id?: string;
  name: string;
  slug: string;
  designation: string;
  bio: string;
  photoKey?: string;
  sortOrder?: number;
  isPublished?: boolean;
}): Promise<ActionResult> {
  const current = await requireRole(["admin"]);
  try {
    let facultyId = data.id;
    if (facultyId) {
      await db
        .update(schema.faculty)
        .set({
          name: data.name,
          slug: data.slug,
          designation: data.designation,
          bio: data.bio,
          photoKey: data.photoKey || null,
          sortOrder: data.sortOrder || 0,
          isPublished: data.isPublished ?? true,
          updatedAt: new Date(),
        })
        .where(eq(schema.faculty.id, facultyId));
    } else {
      const [inserted] = await db
        .insert(schema.faculty)
        .values({
          name: data.name,
          slug: data.slug,
          designation: data.designation,
          bio: data.bio,
          photoKey: data.photoKey || null,
          sortOrder: data.sortOrder || 0,
          isPublished: data.isPublished ?? true,
        })
        .returning();
      if (!inserted) throw new Error("Failed to insert faculty record");
      facultyId = inserted.id;
    }

    await db.insert(schema.auditLog).values({
      actorId: current.user.id,
      action: data.id ? "update_faculty" : "create_faculty",
      entity: "faculty",
      entityId: facultyId!,
      diff: { name: data.name, designation: data.designation },
    });

    revalidateDataTag("faculty");
    revalidatePath("/about");
    revalidatePath("/admin/content");

    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to save faculty" };
  }
}

export async function saveTestimonialAction(data: {
  id?: string;
  studentName: string;
  classLevel: number;
  year: number;
  quote: string;
  photoKey?: string;
  isPublished?: boolean;
  sortOrder?: number;
}): Promise<ActionResult> {
  await requireRole(["admin"]);
  try {
    let testId = data.id;
    if (testId) {
      await db
        .update(schema.testimonials)
        .set({
          studentName: data.studentName,
          classLevel: data.classLevel,
          year: data.year,
          quote: data.quote,
          photoKey: data.photoKey || null,
          isPublished: data.isPublished ?? true,
          sortOrder: data.sortOrder || 0,
          updatedAt: new Date(),
        })
        .where(eq(schema.testimonials.id, testId));
    } else {
      const [inserted] = await db
        .insert(schema.testimonials)
        .values({
          studentName: data.studentName,
          classLevel: data.classLevel,
          year: data.year,
          quote: data.quote,
          photoKey: data.photoKey || null,
          isPublished: data.isPublished ?? true,
          sortOrder: data.sortOrder || 0,
        })
        .returning();
      if (!inserted) throw new Error("Failed to insert testimonial");
      testId = inserted.id;
    }

    revalidateDataTag("testimonials");
    revalidatePath("/");
    revalidatePath("/admin/content");

    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to save testimonial" };
  }
}

export async function saveResultAction(data: {
  id?: string;
  studentName: string;
  exam: string;
  year: number;
  scoreText: string;
  photoKey?: string;
  isFeatured?: boolean;
  sortOrder?: number;
}): Promise<ActionResult> {
  await requireRole(["admin"]);
  try {
    let resId = data.id;
    if (resId) {
      await db
        .update(schema.results)
        .set({
          studentName: data.studentName,
          exam: data.exam,
          year: data.year,
          scoreText: data.scoreText,
          photoKey: data.photoKey || null,
          isFeatured: data.isFeatured ?? false,
          sortOrder: data.sortOrder || 0,
          updatedAt: new Date(),
        })
        .where(eq(schema.results.id, resId));
    } else {
      const [inserted] = await db
        .insert(schema.results)
        .values({
          studentName: data.studentName,
          exam: data.exam,
          year: data.year,
          scoreText: data.scoreText,
          photoKey: data.photoKey || null,
          isFeatured: data.isFeatured ?? false,
          sortOrder: data.sortOrder || 0,
        })
        .returning();
      if (!inserted) throw new Error("Failed to insert result");
      resId = inserted.id;
    }

    revalidateDataTag("results");
    revalidatePath("/results");
    revalidatePath("/");
    revalidatePath("/admin/content");

    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to save result" };
  }
}

export async function saveSiteSettingAction(key: string, value: unknown): Promise<ActionResult> {
  const current = await requireRole(["admin"]);
  try {
    await updateSetting(toAuthUser(current), key, value);
    revalidateDataTag("settings");
    revalidatePath("/");
    revalidatePath("/admin/content");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to save setting" };
  }
}
