"use server";

import { z } from "zod";
import { requireRole } from "./auth/session";
import {
  manualEnrollStudent,
  registerStudent,
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
import { updateEnquiry, createEnquiry } from "./data/enquiries";
import { updateSetting } from "./data/settings";
import { recordOfflinePayment } from "./payments/service";
import { syncYouTubeChannel } from "./youtube/sync";
import { presignedPut, getBucketForKey, s3 } from "./storage";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import { db, schema, eq, and, sql, or, desc, asc } from "@quick2learn/db";
import { revalidateDataTag, safeRevalidatePath as revalidatePath } from "./data/cached-home";
import {
  getBatchJoinRequests,
  approveJoinRequest,
  rejectJoinRequest,
  saveBatchTimetable,
  regenerateBatchJoinCode,
  getBatchTimetable,
} from "./data/batches";
import { notify } from "./notify";
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
  folder: z.enum(["resources/public", "resources/private", "covers", "photos", "testimonials", "results", "questions", "doubts"]),
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

  if (folder === "doubts") {
    if (!isImage && !isPdf) {
      return { success: false, error: "Only image files (JPEG, PNG, WEBP) and PDF documents are allowed in chat." };
    }
  } else if (folder.startsWith("resources/") && !isPdf) {
    return { success: false, error: "Only PDF documents can be uploaded as study materials." };
  } else if (!folder.startsWith("resources/") && !isImage) {
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

export async function uploadChatAttachmentAction(
  formData: FormData
): Promise<ActionResult<{ key: string; url: string; filename: string; isPdf: boolean }>> {
  await requireRole(["admin", "teacher"]);
  try {
    const file = formData.get("file") as File | null;
    if (!file) {
      return { success: false, error: "No file was selected for upload." };
    }

    const filename = file.name || "attachment";
    const contentType = file.type || "application/octet-stream";
    const sizeBytes = file.size;

    if (sizeBytes > 25 * 1024 * 1024) {
      return { success: false, error: "File exceeds 25 MB limit." };
    }

    const cleanName = filename.toLowerCase().replace(/[^a-z0-9._-]/g, "_");
    const isPdf = contentType === "application/pdf" || cleanName.endsWith(".pdf");
    const isImage = contentType.startsWith("image/");

    if (!isImage && !isPdf) {
      return {
        success: false,
        error: "Only image files (PNG, JPG, WEBP) and PDF documents are allowed in chat.",
      };
    }

    const uniqueKey = `doubts/${Date.now()}-${Math.random().toString(36).substring(2, 8)}-${cleanName}`;

    // Read file bytes
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. Try uploading to S3 / Cloud storage if configured
    try {
      const bucket = getBucketForKey(uniqueKey);
      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: uniqueKey,
          ContentType: contentType,
          Body: buffer,
        })
      );
    } catch (s3Err) {
      console.warn("[uploadChatAttachmentAction] S3 unreachable or unconfigured, persisting locally:", s3Err);
    }

    // 2. Persist locally to public/uploads/doubts for instant, zero-failure serving
    try {
      const targetDir = path.join(process.cwd(), "public", "uploads", "doubts");
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      const filePath = path.join(process.cwd(), "public", "uploads", uniqueKey);
      fs.writeFileSync(filePath, buffer);
    } catch (fsErr) {
      console.warn("[uploadChatAttachmentAction] Local file write warning:", fsErr);
    }

    const publicUrl = `/uploads/${uniqueKey}`;

    return {
      success: true,
      data: {
        key: uniqueKey,
        url: publicUrl,
        filename,
        isPdf,
      },
    };
  } catch (err: unknown) {
    console.error("[uploadChatAttachmentAction] Upload failed:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to upload file",
    };
  }
}

// -------------------------------------------------------------
// 4. STUDENT ACTIONS (REGISTER, ENROL, RECORD OFFLINE PAYMENT, WAIVE, NOTE)
// -------------------------------------------------------------

const registerStudentSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  phone: z.string().trim().min(10, "Phone number must be at least 10 digits"),
  email: z.string().trim().email("Invalid email").optional().or(z.literal("")),
  classLevel: z.number().int().min(9).max(12),
  board: z.enum(["cbse", "icse", "isc"]),
  school: z.string().trim().optional(),
  city: z.string().trim().optional(),
  parentName: z.string().trim().optional(),
  parentPhone: z.string().trim().optional(),
  batchId: z.string().uuid().optional().or(z.literal("")),
  feePlanId: z.string().uuid().optional().or(z.literal("")),
});

export async function registerStudentAction(
  input: z.infer<typeof registerStudentSchema>,
): Promise<ActionResult> {
  const current = await requireRole(["admin"]);
  const parsed = registerStudentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message };
  }

  try {
    const res = await registerStudent(toAuthUser(current), {
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email || undefined,
      classLevel: parsed.data.classLevel,
      board: parsed.data.board,
      school: parsed.data.school || undefined,
      city: parsed.data.city || undefined,
      parentName: parsed.data.parentName || undefined,
      parentPhone: parsed.data.parentPhone || undefined,
      batchId: parsed.data.batchId || undefined,
      feePlanId: parsed.data.feePlanId || undefined,
    });
    revalidatePath("/admin/students");
    return { success: true, data: res };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to register student" };
  }
}

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
  attachmentKeys: z.array(z.string()).default([]),
  notifyParents: z.boolean().default(false),
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
      attachmentKeys: parsed.data.attachmentKeys,
      notifyParents: parsed.data.notifyParents,
      createdBy: current.user.id,
    });

    await db.insert(schema.auditLog).values({
      actorId: current.user.id,
      action: "create_announcement",
      entity: "announcements",
      entityId: res.id,
      diff: { title: res.title, audience: res.audience },
    });

    // Send push notifications to enrolled batch students and parents
    if (parsed.data.audience === "batch" && parsed.data.batchId) {
      notify(
        { batchId: parsed.data.batchId },
        {
          type: "announcement",
          title: parsed.data.title,
          body: parsed.data.body.slice(0, 140),
          data: { route: `/batch/${parsed.data.batchId}` },
        }
      ).catch(() => {});

      if (parsed.data.notifyParents) {
        notify(
          { parentsOfBatchId: parsed.data.batchId },
          {
            type: "announcement",
            title: `[Notice] ${parsed.data.title}`,
            body: parsed.data.body.slice(0, 140),
          }
        ).catch(() => {});
      }
    } else if (parsed.data.audience === "all_students") {
      notify(
        { role: "student" },
        {
          type: "announcement",
          title: parsed.data.title,
          body: parsed.data.body.slice(0, 140),
        }
      ).catch(() => {});
    }

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

const createEnquirySchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  phone: z.string().trim().min(10, "Phone number must be at least 10 digits"),
  email: z.string().trim().email("Invalid email").optional().or(z.literal("")),
  classLevel: z.number().int().min(9).max(12).optional(),
  board: z.enum(["cbse", "icse", "isc"]).optional(),
  message: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export async function createEnquiryAction(
  input: z.infer<typeof createEnquirySchema>,
): Promise<ActionResult> {
  const current = await requireRole(["admin"]);
  const parsed = createEnquirySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message };
  }

  try {
    const combinedNotes = [
      parsed.data.email ? `Email: ${parsed.data.email}` : "",
      parsed.data.notes || "",
    ]
      .filter(Boolean)
      .join(" · ");

    const res = await createEnquiry({
      name: parsed.data.name,
      phone: parsed.data.phone,
      classLevel: parsed.data.classLevel ?? null,
      board: parsed.data.board ?? null,
      message: parsed.data.message ?? null,
      notes: combinedNotes || null,
      sourcePath: "/admin/enquiries",
      status: "new",
    });

    if (res?.id) {
      await db.insert(schema.auditLog).values({
        actorId: current.user.id,
        action: "create_enquiry",
        entity: "enquiries",
        entityId: res.id,
        diff: { name: res.name, phone: res.phone },
      });
    }

    revalidatePath("/admin/enquiries");
    return { success: true, data: res };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to record enquiry" };
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

export async function getBatchJoinRequestsAction(batchId?: string): Promise<ActionResult<any>> {
  const current = await requireRole(["admin", "teacher"]);
  try {
    const data = await getBatchJoinRequests(toAuthUser(current), batchId);
    return { success: true, data };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to fetch join requests" };
  }
}

export async function approveJoinRequestAction(requestId: string, feePlanId?: string): Promise<ActionResult> {
  const current = await requireRole(["admin"]);
  try {
    const res = await approveJoinRequest(toAuthUser(current), requestId, feePlanId);
    revalidatePath("/admin/batches");
    revalidatePath("/admin/batches/requests");
    return { success: true, data: res };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to approve join request" };
  }
}

export async function rejectJoinRequestAction(requestId: string, note?: string): Promise<ActionResult> {
  const current = await requireRole(["admin"]);
  try {
    const res = await rejectJoinRequest(toAuthUser(current), requestId, note);
    revalidatePath("/admin/batches");
    revalidatePath("/admin/batches/requests");
    return { success: true, data: res };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to reject join request" };
  }
}

export async function saveBatchTimetableAction(
  batchId: string,
  slots: Array<{
    weekday: number;
    startTime: string;
    endTime: string;
    subjectId?: string | null;
    teacherId?: string | null;
    mode?: string;
    roomOrLinkNote?: string | null;
  }>
): Promise<ActionResult> {
  const current = await requireRole(["admin"]);
  try {
    const res = await saveBatchTimetable(toAuthUser(current), batchId, slots);
    revalidatePath(`/admin/batches/${batchId}`);
    return { success: true, data: res };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to save timetable" };
  }
}

export async function regenerateBatchJoinCodeAction(batchId: string): Promise<ActionResult<{ joinCode: string }>> {
  const current = await requireRole(["admin"]);
  try {
    const updated = await regenerateBatchJoinCode(toAuthUser(current), batchId);
    if (!updated) throw new Error("Batch not found");
    revalidatePath(`/admin/batches/${batchId}`);
    return { success: true, data: { joinCode: updated.joinCode || "" } };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to regenerate join code" };
  }
}

export async function getBatchTimetableAction(batchId: string): Promise<ActionResult<any>> {
  await requireRole(["admin", "teacher"]);
  try {
    const data = await getBatchTimetable(batchId);
    return { success: true, data };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to fetch timetable" };
  }
}

// -------------------------------------------------------------
// 12. BATCH CONTENT & STUDY MATERIAL ACTIONS
// -------------------------------------------------------------

import {
  linkChapterToBatch,
  unlinkChapterFromBatch,
  createBatchContentItem,
  deleteBatchContentItem,
  reorderBatchContentItems,
  bulkUploadBatchPdfs,
  importBatchMaterialFromZipTree,
} from "./data/batch-content";

export async function getBatchContentManagerDataAction(batchId: string): Promise<ActionResult<{
  batch: { id: string; title: string; classLevel: number | null; board: string | null; subjectId: string | null };
  subjects: Array<{ id: string; name: string }>;
  chapters: Array<{ id: string; title: string; subjectId: string; classLevel: number; chapterNumber: number | null }>;
  linkedChapterIds: string[];
  contentItems: Array<{
    id: string;
    subjectId: string;
    chapterId: string;
    section: string | null;
    title: string;
    kind: string;
    youtubeVideoId: string | null;
    storageKey: string | null;
    url: string | null;
    sizeBytes: number | null;
    pageCount: number | null;
    sortOrder: number;
    isPublished: boolean;
    publishedAt: string;
  }>;
  availableVideos: Array<{
    id: string;
    title: string;
    chapterId: string | null;
    durationSeconds: number;
  }>;
}>> {
  await requireRole(["admin", "teacher"]);
  try {
    const [batch] = await db
      .select({
        id: schema.batches.id,
        title: schema.batches.title,
        classLevel: schema.batches.classLevel,
        board: schema.batches.board,
        subjectId: schema.batches.subjectId,
      })
      .from(schema.batches)
      .where(eq(schema.batches.id, batchId))
      .limit(1);

    if (!batch) throw new Error("Batch not found");

    const subjects = await db.select({ id: schema.subjects.id, name: schema.subjects.name }).from(schema.subjects).orderBy(schema.subjects.name);
    const chapters = await db
      .select({
        id: schema.chapters.id,
        title: schema.chapters.title,
        subjectId: schema.chapters.subjectId,
        classLevel: schema.chapters.classLevel,
        chapterNumber: schema.chapters.number,
      })
      .from(schema.chapters)
      .orderBy(schema.chapters.number, schema.chapters.title);

    const linkedLinks = await db
      .select({ chapterId: schema.batchChapterLinks.chapterId })
      .from(schema.batchChapterLinks)
      .where(eq(schema.batchChapterLinks.batchId, batchId));
    const linkedChapterIds = linkedLinks.map((l) => l.chapterId);

    const items = await db
      .select()
      .from(schema.contentItems)
      .where(eq(schema.contentItems.batchId, batchId))
      .orderBy(schema.contentItems.sortOrder, schema.contentItems.publishedAt);

    const availableVideos = await db
      .select({
        id: schema.youtubeVideos.id,
        title: schema.youtubeVideos.title,
        chapterId: schema.youtubeVideos.chapterId,
        durationSeconds: schema.youtubeVideos.durationSeconds,
      })
      .from(schema.youtubeVideos)
      .where(eq(schema.youtubeVideos.isPublished, true))
      .orderBy(desc(schema.youtubeVideos.publishedAt))
      .limit(200);

    return {
      success: true,
      data: {
        batch,
        subjects,
        chapters,
        linkedChapterIds,
        contentItems: items.map((i) => ({
          ...i,
          publishedAt: i.publishedAt.toISOString(),
        })),
        availableVideos,
      },
    };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to load content data" };
  }
}

export async function linkBatchChapterAction(batchId: string, chapterId: string): Promise<ActionResult> {
  const current = await requireRole(["admin", "teacher"]);
  try {
    await linkChapterToBatch(toAuthUser(current), batchId, chapterId);
    revalidatePath(`/admin/batches/${batchId}`);
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to link chapter" };
  }
}

export async function unlinkBatchChapterAction(batchId: string, chapterId: string): Promise<ActionResult> {
  const current = await requireRole(["admin", "teacher"]);
  try {
    await unlinkChapterFromBatch(toAuthUser(current), batchId, chapterId);
    revalidatePath(`/admin/batches/${batchId}`);
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to unlink chapter" };
  }
}

export async function saveBatchContentItemAction(data: {
  id?: string;
  batchId: string;
  subjectId: string;
  chapterId: string;
  section?: string | null;
  title: string;
  kind: "youtube" | "pdf" | "link" | "video_hosted";
  youtubeVideoId?: string | null;
  storageKey?: string | null;
  url?: string | null;
  sizeBytes?: number | null;
  pageCount?: number | null;
  sortOrder?: number;
  isPublished?: boolean;
  notifyBatch?: boolean;
}): Promise<ActionResult> {
  const current = await requireRole(["admin", "teacher"]);
  try {
    if (data.id) {
      // Update
      const [updated] = await db
        .update(schema.contentItems)
        .set({
          subjectId: data.subjectId,
          chapterId: data.chapterId,
          section: data.section || (data.kind === "pdf" ? "Class Notes" : "Lectures"),
          title: data.title,
          kind: data.kind,
          youtubeVideoId: data.youtubeVideoId || null,
          storageKey: data.storageKey || null,
          url: data.url || null,
          sizeBytes: data.sizeBytes || null,
          pageCount: data.pageCount || null,
          sortOrder: data.sortOrder || 0,
          isPublished: data.isPublished ?? true,
          updatedAt: new Date(),
        })
        .where(eq(schema.contentItems.id, data.id))
        .returning();

      revalidatePath(`/admin/batches/${data.batchId}`);
      return { success: true, data: updated };
    } else {
      // Create
      const created = await createBatchContentItem(toAuthUser(current), data);
      revalidatePath(`/admin/batches/${data.batchId}`);
      return { success: true, data: created };
    }
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to save content item" };
  }
}

export async function deleteBatchContentItemAction(contentItemId: string, batchId: string): Promise<ActionResult> {
  const current = await requireRole(["admin", "teacher"]);
  try {
    const res = await deleteBatchContentItem(toAuthUser(current), contentItemId);
    revalidatePath(`/admin/batches/${batchId}`);
    return { success: true, data: res };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to delete content item" };
  }
}

export async function reorderBatchContentItemsAction(batchId: string, itemIds: string[]): Promise<ActionResult> {
  const current = await requireRole(["admin", "teacher"]);
  try {
    await reorderBatchContentItems(toAuthUser(current), batchId, itemIds);
    revalidatePath(`/admin/batches/${batchId}`);
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to reorder content items" };
  }
}

export async function bulkUploadBatchPdfsAction(data: {
  batchId: string;
  subjectId: string;
  chapterId: string;
  section: string;
  files: Array<{
    name: string;
    storageKey: string;
    sizeBytes?: number | null;
    pageCount?: number | null;
  }>;
  notifyBatch?: boolean;
}): Promise<ActionResult> {
  const current = await requireRole(["admin", "teacher"]);
  try {
    const created = await bulkUploadBatchPdfs(toAuthUser(current), data);
    revalidatePath(`/admin/batches/${data.batchId}`);
    return { success: true, data: created };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to bulk upload study material" };
  }
}

export async function importBatchZipMaterialAction(data: {
  batchId: string;
  entries: Array<{
    subjectName: string;
    chapterTitle: string;
    sectionName: string;
    fileName: string;
    storageKey: string;
    sizeBytes?: number | null;
    pageCount?: number | null;
  }>;
}): Promise<ActionResult<{ importedCount: number }>> {
  const current = await requireRole(["admin", "teacher"]);
  try {
    const result = await importBatchMaterialFromZipTree(toAuthUser(current), data.batchId, data.entries);
    revalidatePath(`/admin/batches/${data.batchId}`);
    return { success: true, data: result };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to import materials from ZIP" };
  }
}

// ---------------------------------------------------------
// Live Sessions Admin Actions
// ---------------------------------------------------------

export async function getBatchLiveSessionsAdminAction(batchId: string): Promise<ActionResult> {
  const current = await requireRole(["admin", "teacher"]);
  try {
    const { getBatchLiveSessions } = await import("./data/live-sessions");
    const data = await getBatchLiveSessions(current.user.id, batchId);
    return { success: true, data };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to fetch live sessions" };
  }
}

export async function createLiveSessionAction(data: {
  batchId: string;
  subjectId?: string | null;
  teacherId?: string | null;
  title: string;
  startsAt: string;
  endsAt: string;
  provider: "zoom" | "google_meet" | "youtube_live" | "offline";
  joinUrl?: string | null;
  passcode?: string | null;
  recordingYoutubeId?: string | null;
}): Promise<ActionResult> {
  const current = await requireRole(["admin", "teacher"]);
  try {
    const { createLiveSession } = await import("./data/live-sessions");
    const created = await createLiveSession({
      ...data,
      createdBy: current.user.id,
    });
    revalidatePath(`/admin/batches/${data.batchId}`);
    return { success: true, data: created };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to create live session" };
  }
}

export async function updateLiveSessionAction(
  sessionId: string,
  batchId: string,
  data: {
    title?: string;
    startsAt?: string;
    endsAt?: string;
    provider?: "zoom" | "google_meet" | "youtube_live" | "offline";
    joinUrl?: string | null;
    passcode?: string | null;
    status?: "scheduled" | "live" | "ended" | "cancelled";
    recordingYoutubeId?: string | null;
    subjectId?: string | null;
    teacherId?: string | null;
  }
): Promise<ActionResult> {
  await requireRole(["admin", "teacher"]);
  try {
    const { updateLiveSession } = await import("./data/live-sessions");
    const updated = await updateLiveSession(sessionId, data);
    revalidatePath(`/admin/batches/${batchId}`);
    return { success: true, data: updated };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to update live session" };
  }
}

export async function startLiveSessionAction(
  sessionId: string,
  batchId: string
): Promise<ActionResult> {
  const current = await requireRole(["admin", "teacher"]);
  try {
    const { startLiveSession } = await import("./data/live-sessions");
    const updated = await startLiveSession(sessionId, current.user.id);
    revalidatePath(`/admin/batches/${batchId}`);
    return { success: true, data: updated };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to start live session" };
  }
}

export async function endLiveSessionAction(
  sessionId: string,
  batchId: string,
  recordingYoutubeId?: string | null
): Promise<ActionResult> {
  const current = await requireRole(["admin", "teacher"]);
  try {
    const { endLiveSession } = await import("./data/live-sessions");
    const updated = await endLiveSession(sessionId, recordingYoutubeId, current.user.id);
    revalidatePath(`/admin/batches/${batchId}`);
    return { success: true, data: updated };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to end live session" };
  }
}

export async function deleteLiveSessionAction(
  sessionId: string,
  batchId: string
): Promise<ActionResult> {
  await requireRole(["admin", "teacher"]);
  try {
    const { deleteLiveSession } = await import("./data/live-sessions");
    const deleted = await deleteLiveSession(sessionId);
    revalidatePath(`/admin/batches/${batchId}`);
    return { success: true, data: deleted };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to delete live session" };
  }
}

export async function generateBatchSessionsFromTimetableAction(
  batchId: string,
  daysAhead: number = 14
): Promise<ActionResult> {
  await requireRole(["admin", "teacher"]);
  try {
    const { generateSessionsFromTimetableCron } = await import("./data/live-sessions");
    const result = await generateSessionsFromTimetableCron(daysAhead, batchId);
    revalidatePath(`/admin/batches/${batchId}`);
    return { success: true, data: result };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to generate timetable sessions" };
  }
}

// ---------------------------------------------------------
// Attendance Admin Actions
// ---------------------------------------------------------

export async function getBatchAttendanceAdminAction(
  batchId: string,
  dateStr: string
): Promise<ActionResult> {
  await requireRole(["admin", "teacher"]);
  try {
    const enrolledStudents = await db
      .select({
        studentId: schema.enrollments.studentId,
        studentName: schema.profiles.fullName,
        studentPhone: schema.profiles.phone,
        enrolledAt: schema.enrollments.enrolledAt,
      })
      .from(schema.enrollments)
      .leftJoin(schema.profiles, eq(schema.enrollments.studentId, schema.profiles.userId))
      .where(
        and(
          eq(schema.enrollments.batchId, batchId),
          eq(schema.enrollments.status, "active")
        )
      )
      .orderBy(schema.profiles.fullName);

    const attendanceRecords = await db
      .select()
      .from(schema.attendanceRecords)
      .where(
        and(
          eq(schema.attendanceRecords.batchId, batchId),
          eq(schema.attendanceRecords.date, dateStr)
        )
      );

    const recordMap = new Map<string, (typeof attendanceRecords)[0]>();
    for (const r of attendanceRecords) {
      recordMap.set(r.studentId, r);
    }

    const students = enrolledStudents.map((s) => {
      const record = recordMap.get(s.studentId);
      return {
        studentId: s.studentId,
        studentName: s.studentName || "Student",
        phone: s.studentPhone || null,
        status: record ? record.status : null,
        source: record ? record.source : null,
        note: record ? record.note : null,
        isJoinedOnline: record?.source === "joined_online",
      };
    });

    return {
      success: true,
      data: {
        batchId,
        date: dateStr,
        students,
      },
    };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to fetch attendance" };
  }
}

export async function saveBatchAttendanceAction(data: {
  batchId: string;
  date: string;
  sessionId?: string | null;
  entries: Array<{
    studentId: string;
    status: "present" | "absent" | "late" | "excused";
    note?: string;
  }>;
}): Promise<ActionResult> {
  const current = await requireRole(["admin", "teacher"]);
  try {
    const { saveBatchAttendance } = await import("./data/attendance");
    const result = await saveBatchAttendance(
      current.user.id,
      data.batchId,
      data.date,
      data.entries,
      data.sessionId || null
    );
    revalidatePath(`/admin/batches/${data.batchId}`);
    return { success: true, data: result };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to save attendance" };
  }
}

// -------------------------------------------------------------
// 12. QUESTION BANK & TESTS ADMIN ACTIONS
// -------------------------------------------------------------

export async function getQuestionsAdminAction(filters?: any): Promise<ActionResult<any>> {
  await requireRole(["admin", "teacher"]);
  try {
    const { getQuestions } = await import("./data/questions");
    const questions = await getQuestions(filters);
    return { success: true, data: questions };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to fetch questions" };
  }
}

export async function createQuestionAdminAction(data: any): Promise<ActionResult<any>> {
  const current = await requireRole(["admin", "teacher"]);
  try {
    const { createQuestion } = await import("./data/questions");
    const question = await createQuestion(data, current.user.id);
    revalidatePath("/admin/questions");
    return { success: true, data: question };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to create question" };
  }
}

export async function updateQuestionAdminAction(id: string, data: any): Promise<ActionResult<any>> {
  const current = await requireRole(["admin", "teacher"]);
  try {
    const { updateQuestion } = await import("./data/questions");
    const question = await updateQuestion(id, data, current.user.id);
    revalidatePath("/admin/questions");
    return { success: true, data: question };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to update question" };
  }
}

export async function deleteQuestionAdminAction(id: string): Promise<ActionResult<any>> {
  await requireRole(["admin", "teacher"]);
  try {
    const { deleteQuestion } = await import("./data/questions");
    const result = await deleteQuestion(id);
    revalidatePath("/admin/questions");
    return { success: true, data: result };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to delete question" };
  }
}

export async function checkDuplicateQuestionAction(
  subjectId: string,
  classLevel: number,
  stem: string,
  excludeId?: string
): Promise<ActionResult<{ isDuplicate: boolean; existingId?: string; existingStem?: string }>> {
  await requireRole(["admin", "teacher"]);
  try {
    const { checkDuplicateQuestion } = await import("./data/questions");
    const result = await checkDuplicateQuestion(subjectId, classLevel, stem, excludeId);
    return { success: true, data: result };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to check duplicates" };
  }
}

export async function validateQuestionImportAction(rows: Array<Record<string, any>>): Promise<ActionResult<any>> {
  await requireRole(["admin", "teacher"]);
  try {
    const { parseAndValidateImportRows } = await import("./data/questions");
    const result = await parseAndValidateImportRows(rows);
    return { success: true, data: result };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to validate import rows" };
  }
}

export async function commitQuestionImportAction(previewRows: any[]): Promise<ActionResult<any>> {
  const current = await requireRole(["admin", "teacher"]);
  try {
    const { commitImportRows } = await import("./data/questions");
    const result = await commitImportRows(previewRows, current.user.id);
    revalidatePath("/admin/questions");
    return { success: true, data: result };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to commit import rows" };
  }
}

export async function createTestAdminAction(data: any): Promise<ActionResult<any>> {
  const current = await requireRole(["admin", "teacher"]);
  try {
    const { createTest } = await import("./data/tests");
    const test = await createTest(data, current.user.id);
    revalidatePath("/admin/tests");
    return { success: true, data: test };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to create test" };
  }
}

export async function updateTestAdminAction(id: string, data: any): Promise<ActionResult<any>> {
  const current = await requireRole(["admin", "teacher"]);
  try {
    const { updateTest } = await import("./data/tests");
    const test = await updateTest(id, data, current.user.id);
    revalidatePath("/admin/tests");
    revalidatePath(`/admin/tests/${id}`);
    return { success: true, data: test };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to update test" };
  }
}

export async function publishTestAdminAction(id: string): Promise<ActionResult<any>> {
  await requireRole(["admin", "teacher"]);
  try {
    const { publishTest } = await import("./data/tests");
    const test = await publishTest(id);
    revalidatePath("/admin/tests");
    revalidatePath(`/admin/tests/${id}`);
    return { success: true, data: test };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to publish test" };
  }
}

export async function autoPickQuestionsAdminAction(params: any): Promise<ActionResult<any>> {
  await requireRole(["admin", "teacher"]);
  try {
    const { autoPickQuestions } = await import("./data/tests");
    const picked = await autoPickQuestions(params);
    return { success: true, data: picked };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to auto-pick questions" };
  }
}

export async function getTestAdminResultsAction(testId: string): Promise<ActionResult<any>> {
  await requireRole(["admin", "teacher"]);
  try {
    const { getTestAdminResults } = await import("./data/tests");
    const results = await getTestAdminResults(testId);
    return { success: true, data: results };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to get test results" };
  }
}

// -------------------------------------------------------------
// DOUBTS ADMIN ACTIONS (Prompt 11)
// -------------------------------------------------------------

export async function listAdminDoubtsAction(params: any): Promise<ActionResult<any>> {
  const current = await requireRole(["admin", "teacher"]);
  try {
    const { listAdminDoubts } = await import("./data/doubts");
    const result = await listAdminDoubts(toAuthUser(current), params);
    return { success: true, data: result };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to list doubts" };
  }
}

export async function getDoubtThreadAction(doubtId: string): Promise<ActionResult<any>> {
  const current = await requireRole(["admin", "teacher"]);
  try {
    const { getDoubtThread } = await import("./data/doubts");
    const result = await getDoubtThread(toAuthUser(current), doubtId);
    return { success: true, data: result };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to get doubt thread" };
  }
}

export async function replyDoubtAction(doubtId: string, input: any): Promise<ActionResult<any>> {
  const current = await requireRole(["admin", "teacher"]);
  try {
    const { addDoubtMessage } = await import("./data/doubts");
    const result = await addDoubtMessage(toAuthUser(current), doubtId, input);
    return { success: true, data: result };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to send reply" };
  }
}

export async function closeDoubtAction(doubtId: string): Promise<ActionResult<any>> {
  const current = await requireRole(["admin", "teacher"]);
  try {
    const { closeDoubt } = await import("./data/doubts");
    const result = await closeDoubt(toAuthUser(current), doubtId);
    return { success: true, data: result };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to close doubt" };
  }
}

export async function listCannedRepliesAction(): Promise<ActionResult<any>> {
  const current = await requireRole(["admin", "teacher"]);
  try {
    const { listCannedReplies } = await import("./data/doubts");
    const result = await listCannedReplies(toAuthUser(current));
    return { success: true, data: result };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to load canned replies" };
  }
}

export async function createCannedReplyAction(input: any): Promise<ActionResult<any>> {
  const current = await requireRole(["admin", "teacher"]);
  try {
    const { createCannedReply } = await import("./data/doubts");
    const result = await createCannedReply(toAuthUser(current), input);
    return { success: true, data: result };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to create canned reply" };
  }
}

export interface ChatStudentOption {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  classLevel: number | null;
  board: string | null;
  batches: Array<{ id: string; title: string }>;
}

export async function listChatStudentsAction(): Promise<ActionResult<ChatStudentOption[]>> {
  await requireRole(["admin", "teacher"]);
  try {
    const students = await db
      .select({
        id: schema.user.id,
        name: schema.user.name,
        email: schema.user.email,
        phone: schema.profiles.phone,
        classLevel: schema.profiles.classLevel,
        board: schema.profiles.board,
      })
      .from(schema.user)
      .innerJoin(schema.profiles, eq(schema.user.id, schema.profiles.userId))
      .where(eq(schema.profiles.role, "student"))
      .orderBy(asc(schema.user.name));

    const enrollments = await db
      .select({
        studentId: schema.enrollments.studentId,
        batchId: schema.batches.id,
        batchTitle: schema.batches.title,
      })
      .from(schema.enrollments)
      .innerJoin(schema.batches, eq(schema.enrollments.batchId, schema.batches.id))
      .where(eq(schema.enrollments.status, "active"));

    const batchMap = new Map<string, Array<{ id: string; title: string }>>();
    for (const e of enrollments) {
      const list = batchMap.get(e.studentId) || [];
      list.push({ id: e.batchId, title: e.batchTitle });
      batchMap.set(e.studentId, list);
    }

    const data: ChatStudentOption[] = students.map((s) => ({
      ...s,
      name: s.name || "Student",
      batches: batchMap.get(s.id) || [],
    }));

    return { success: true, data };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to load students list",
    };
  }
}

export async function startStudentChatAction(input: {
  studentId: string;
  subjectId?: string;
  batchId?: string;
  title?: string;
  initialMessage?: string;
}): Promise<ActionResult<{ doubtId: string; isNew: boolean }>> {
  const current = await requireRole(["admin", "teacher"]);
  try {
    if (!input.studentId) {
      return { success: false, error: "Please select a student to chat with." };
    }

    // Verify student exists
    const [studentUser] = await db
      .select({
        id: schema.user.id,
        name: schema.user.name,
      })
      .from(schema.user)
      .where(eq(schema.user.id, input.studentId));

    if (!studentUser) {
      return { success: false, error: "Selected student profile not found." };
    }

    // Check if there is an existing conversation with this student
    const [existing] = await db
      .select({ id: schema.doubts.id, status: schema.doubts.status })
      .from(schema.doubts)
      .where(
        and(
          eq(schema.doubts.studentId, input.studentId),
          input.batchId ? eq(schema.doubts.batchId, input.batchId) : undefined
        )
      )
      .orderBy(desc(schema.doubts.lastActivityAt))
      .limit(1);

    if (existing && !input.initialMessage?.trim()) {
      return { success: true, data: { doubtId: existing.id, isNew: false } };
    }

    if (existing && input.initialMessage?.trim()) {
      await db.insert(schema.doubtMessages).values({
        doubtId: existing.id,
        authorId: current.user.id,
        body: input.initialMessage.trim(),
        attachmentKeys: [],
      });

      await db
        .update(schema.doubts)
        .set({
          status: "answered",
          assignedTeacherId: current.user.id,
          lastActivityAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(schema.doubts.id, existing.id));

      revalidatePath("/admin/chats");
      return { success: true, data: { doubtId: existing.id, isNew: false } };
    }

    // Create a brand new conversation thread
    let targetSubjectId = input.subjectId;
    if (!targetSubjectId) {
      const [firstSub] = await db
        .select({ id: schema.subjects.id })
        .from(schema.subjects)
        .orderBy(asc(schema.subjects.sortOrder))
        .limit(1);
      targetSubjectId = firstSub?.id;
    }

    if (!targetSubjectId) {
      return { success: false, error: "No active subject found to link chat." };
    }

    const conversationTitle = (input.title || `Chat with ${studentUser.name || "Student"}`).trim();

    const [newDoubt] = await db
      .insert(schema.doubts)
      .values({
        studentId: input.studentId,
        batchId: input.batchId || null,
        subjectId: targetSubjectId,
        sourceType: "general",
        title: conversationTitle,
        status: input.initialMessage?.trim() ? "answered" : "open",
        assignedTeacherId: current.user.id,
        lastActivityAt: new Date(),
      })
      .returning({ id: schema.doubts.id });

    if (!newDoubt) {
      throw new Error("Failed to create new chat thread");
    }

    if (input.initialMessage?.trim()) {
      await db.insert(schema.doubtMessages).values({
        doubtId: newDoubt.id,
        authorId: current.user.id,
        body: input.initialMessage.trim(),
        attachmentKeys: [],
      });
    }

    revalidatePath("/admin/chats");
    return { success: true, data: { doubtId: newDoubt.id, isNew: true } };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to start chat with student",
    };
  }
}



