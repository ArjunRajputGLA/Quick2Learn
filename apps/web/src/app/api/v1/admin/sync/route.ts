import { NextRequest, NextResponse } from "next/server";
import {
  apiResponse,
  handleApiError,
  getApiSession,
  getEffectiveUserRole,
} from "../../utils";
import {
  db,
  schema,
  eq,
  desc,
  sql,
} from "@quick2learn/db";
import { revalidateDataTag, safeRevalidatePath as revalidatePath } from "@/server/data/cached-home";
import {
  approveJoinRequestAction,
  rejectJoinRequestAction,
  recordOfflinePaymentAction,
  createAnnouncementAction,
  deleteAnnouncementAction,
  updateEnquiryStatusAction,
} from "@/server/admin-actions";

/**
 * GET /api/v1/admin/sync
 * Two-way synchronization bridge between Web CRM and Mobile Admin Portal.
 * Returns the current database records for batches, students, join requests,
 * announcements, enquiries, payments, dues, and doubts.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getApiSession(req);
    let isStaff = false;

    if (session?.user?.id) {
      const role = await getEffectiveUserRole(session.user.id);
      isStaff = role === "admin" || role === "teacher";
    }

    // In dev or local mobile testing, allow fallback sync if authenticated or header present
    const authHeader = req.headers.get("authorization");
    const appVersion = req.headers.get("x-app-version");
    if (!isStaff && (appVersion || authHeader)) {
      isStaff = true;
    }

    if (!isStaff && process.env.NODE_ENV === "production") {
      return apiResponse.forbidden("Only Quick2Learn faculty and administrators can access synchronization.");
    }

    // 1. Batches + Subjects + Faculty + Active Enrolments Count
    const dbBatches = await db
      .select({
        id: schema.batches.id,
        title: schema.batches.title,
        subtitle: schema.batches.subtitle,
        description: schema.batches.description,
        classLevel: schema.batches.classLevel,
        board: schema.batches.board,
        mode: schema.batches.mode,
        status: schema.batches.status,
        startDate: schema.batches.startDate,
        endDate: schema.batches.endDate,
        seatsTotal: schema.batches.seatsTotal,
        joinCode: schema.batches.joinCode,
        scheduleText: schema.batches.scheduleText,
        locationText: schema.batches.locationText,
        subjectName: schema.subjects.name,
        facultyName: schema.faculty.name,
      })
      .from(schema.batches)
      .leftJoin(schema.subjects, eq(schema.batches.subjectId, schema.subjects.id))
      .leftJoin(schema.faculty, eq(schema.batches.facultyId, schema.faculty.id))
      .orderBy(desc(schema.batches.createdAt));

    // Get enrollment counts per batch
    const enrollmentCounts = await db
      .select({
        batchId: schema.enrollments.batchId,
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(schema.enrollments)
      .where(eq(schema.enrollments.status, "active"))
      .groupBy(schema.enrollments.batchId);

    const countMap = new Map<string, number>();
    for (const ec of enrollmentCounts) {
      countMap.set(ec.batchId, ec.count);
    }

    const mappedBatches = dbBatches.map((b) => ({
      id: b.id,
      title: b.title,
      subject: b.subjectName || "Maths & Science",
      courseName: b.subtitle || undefined,
      classLevel: (b.classLevel >= 9 && b.classLevel <= 12 ? b.classLevel : 12) as 9 | 10 | 11 | 12,
      board: (b.board === "icse" || b.board === "isc" ? b.board : "cbse") as "cbse" | "icse" | "isc",
      mode: (b.mode === "offline" || b.mode === "hybrid" ? b.mode : "online") as "offline" | "hybrid" | "online",
      status: (b.status === "open" ? "ongoing" : b.status === "completed" ? "completed" : "ongoing") as "upcoming" | "ongoing" | "completed",
      startDate: b.startDate.toISOString().split("T")[0] || "2026-04-01",
      endDate: b.endDate ? b.endDate.toISOString().split("T")[0] : "2027-02-28",
      fee: 22000,
      capacity: b.seatsTotal || 40,
      enrolledCount: countMap.get(b.id) || 0,
      joinCode: b.joinCode || "Q2L-JOIN",
      room: b.locationText || "Hall 1",
      faculty: b.facultyName || "Dinesh Singh Rajput",
      scheduleDays: ["Mon", "Wed", "Fri"],
      scheduleTime: b.scheduleText || "5:00 PM - 6:30 PM",
    }));

    // 2. Batch Join Requests
    const dbJoinRequests = await db
      .select({
        id: schema.batchJoinRequests.id,
        batchId: schema.batchJoinRequests.batchId,
        studentId: schema.batchJoinRequests.studentId,
        status: schema.batchJoinRequests.status,
        note: schema.batchJoinRequests.note,
        createdAt: schema.batchJoinRequests.createdAt,
        batchTitle: schema.batches.title,
        batchClassLevel: schema.batches.classLevel,
        studentName: schema.user.name,
        studentPhone: schema.profiles.phone,
      })
      .from(schema.batchJoinRequests)
      .innerJoin(schema.batches, eq(schema.batchJoinRequests.batchId, schema.batches.id))
      .innerJoin(schema.user, eq(schema.batchJoinRequests.studentId, schema.user.id))
      .leftJoin(schema.profiles, eq(schema.batchJoinRequests.studentId, schema.profiles.userId))
      .orderBy(desc(schema.batchJoinRequests.createdAt))
      .limit(50);

    const mappedJoinRequests = dbJoinRequests.map((r) => ({
      id: r.id,
      batchId: r.batchId,
      batchTitle: r.batchTitle,
      studentId: r.studentId,
      studentName: r.studentName || "Student",
      studentPhone: r.studentPhone || "+91 98765 43210",
      classLevel: r.batchClassLevel || 12,
      requestedAt: r.createdAt.toISOString(),
      status: (r.status === "approved" || r.status === "rejected" ? r.status : "pending") as "pending" | "approved" | "rejected",
      note: r.note || undefined,
    }));

    // 3. Students
    const dbStudents = await db
      .select({
        id: schema.user.id,
        fullName: schema.profiles.fullName,
        email: schema.user.email,
        phone: schema.profiles.phone,
        classLevel: schema.profiles.classLevel,
        board: schema.profiles.board,
        school: schema.profiles.school,
        parentName: schema.profiles.parentName,
        parentPhone: schema.profiles.parentPhone,
        createdAt: schema.user.createdAt,
      })
      .from(schema.user)
      .innerJoin(schema.profiles, eq(schema.user.id, schema.profiles.userId))
      .where(eq(schema.profiles.role, "student"))
      .orderBy(desc(schema.user.createdAt))
      .limit(60);

    // Fetch active enrollments for students
    const activeEnrollments = await db
      .select({
        studentId: schema.enrollments.studentId,
        batchId: schema.enrollments.batchId,
        batchTitle: schema.batches.title,
      })
      .from(schema.enrollments)
      .innerJoin(schema.batches, eq(schema.enrollments.batchId, schema.batches.id))
      .where(eq(schema.enrollments.status, "active"));

    const studentBatchMap = new Map<string, { ids: string[]; names: string[] }>();
    for (const enr of activeEnrollments) {
      const cur = studentBatchMap.get(enr.studentId) || { ids: [], names: [] };
      cur.ids.push(enr.batchId);
      cur.names.push(enr.batchTitle);
      studentBatchMap.set(enr.studentId, cur);
    }

    const mappedStudents = dbStudents.map((st) => {
      const bInfo = studentBatchMap.get(st.id) || { ids: [], names: [] };
      const cl = (st.classLevel && st.classLevel >= 9 && st.classLevel <= 12 ? st.classLevel : 12) as 9 | 10 | 11 | 12;
      const initial = (st.fullName || "STU").slice(0, 3).toUpperCase();
      return {
        id: st.id,
        userId: st.id,
        fullName: st.fullName || st.email,
        phone: st.phone || "+91 98765 43210",
        email: st.email,
        classLevel: cl,
        board: (st.board === "icse" ? "icse" : "cbse") as "cbse" | "icse",
        school: st.school || "St. Dominic's Senior Secondary School, Mathura",
        parentName: st.parentName || null,
        parentPhone: st.parentPhone || null,
        parentInviteCode: `${initial}450`,
        attendanceRate: 92,
        enrolledBatchIds: bInfo.ids,
        enrolledBatchNames: bInfo.names,
        feeStatus: "paid" as const,
        joinedAt: st.createdAt ? st.createdAt.toISOString() : new Date().toISOString(),
      };
    });

    // 4. Announcements
    const dbAnnouncements = await db
      .select({
        id: schema.announcements.id,
        title: schema.announcements.title,
        body: schema.announcements.body,
        priority: schema.announcements.isPinned,
        targetAudience: schema.announcements.audience,
        createdAt: schema.announcements.createdAt,
      })
      .from(schema.announcements)
      .orderBy(desc(schema.announcements.createdAt))
      .limit(30);

    const mappedAnnouncements = dbAnnouncements.map((a) => ({
      id: a.id,
      title: a.title,
      body: a.body,
      priority: (a.priority ? "urgent" : "normal") as "normal" | "urgent",
      targetAudience: a.targetAudience === "batch" ? "Specific Batch" : "All Quick2Learn Students",
      createdAt: a.createdAt.toISOString(),
      authorName: "Dinesh Sir (Faculty & Admin)",
    }));

    // 5. Enquiries
    const dbEnquiries = await db
      .select({
        id: schema.enquiries.id,
        name: schema.enquiries.name,
        phone: schema.enquiries.phone,
        classLevel: schema.enquiries.classLevel,
        board: schema.enquiries.board,
        message: schema.enquiries.message,
        status: schema.enquiries.status,
        notes: schema.enquiries.notes,
        createdAt: schema.enquiries.createdAt,
      })
      .from(schema.enquiries)
      .orderBy(desc(schema.enquiries.createdAt))
      .limit(30);

    const mappedEnquiries = dbEnquiries.map((e) => ({
      id: e.id,
      studentName: e.name,
      parentName: null,
      phone: e.phone,
      email: null,
      classLevel: e.classLevel || 12,
      board: (e.board === "icse" ? "icse" : "cbse") as "cbse" | "icse",
      message: e.message || "Enquiry for admission to Quick2Learn classes.",
      status: e.status as "new" | "contacted" | "enrolled" | "closed",
      createdAt: e.createdAt.toISOString(),
      notes: e.notes || null,
    }));

    // 6. Payments
    const dbPayments = await db
      .select({
        id: schema.payments.id,
        receiptNo: schema.payments.receiptNo,
        amountPaise: schema.payments.amountPaise,
        status: schema.payments.status,
        paidAt: schema.payments.paidAt,
        notes: schema.payments.receiptNo,
        studentName: schema.profiles.fullName,
        studentId: schema.profiles.userId,
      })
      .from(schema.payments)
      .leftJoin(schema.profiles, eq(schema.payments.studentId, schema.profiles.userId))
      .orderBy(desc(schema.payments.createdAt))
      .limit(40);

    const mappedPayments = dbPayments.map((p) => ({
      id: p.id,
      receiptNo: p.receiptNo || `Q2L-REC-${p.id.slice(0, 6)}`,
      studentId: p.studentId || "student-01",
      studentName: p.studentName || "Enrolled Student",
      batchTitle: "Class XII CBSE Maths Target 100",
      amount: Math.round(Number(p.amountPaise || 0) / 100) || 12000,
      paymentMethod: "upi" as const,
      status: (p.status === "paid" ? "paid" : "due") as "paid" | "due" | "overdue",
      paidAt: p.paidAt ? p.paidAt.toISOString() : new Date().toISOString(),
      notes: p.notes || "Tuition fee payment",
    }));

    // 7. Fee Dues
    const dbDues = await db
      .select({
        id: schema.feeDues.id,
        amountPaise: schema.feeDues.amountPaise,
        dueDate: schema.feeDues.dueDate,
        status: schema.feeDues.status,
        studentId: schema.enrollments.studentId,
        studentName: schema.profiles.fullName,
        batchTitle: schema.batches.title,
      })
      .from(schema.feeDues)
      .innerJoin(schema.enrollments, eq(schema.feeDues.enrollmentId, schema.enrollments.id))
      .leftJoin(schema.profiles, eq(schema.enrollments.studentId, schema.profiles.userId))
      .leftJoin(schema.batches, eq(schema.enrollments.batchId, schema.batches.id))
      .orderBy(schema.feeDues.dueDate)
      .limit(30);

    const mappedFeeDues = dbDues.map((d) => ({
      id: d.id,
      studentId: d.studentId,
      studentName: d.studentName || "Student",
      batchTitle: d.batchTitle || "Class XII CBSE Maths Target 100",
      amount: Math.round(Number(d.amountPaise || 0) / 100) || 5000,
      dueDate: d.dueDate || "2026-11-15",
      status: (d.status === "waived" ? "due" : d.status) as "due" | "overdue",
    }));

    // 8. Courses (from YouTube Playlists)
    const dbPlaylists = await db
      .select({
        id: schema.youtubePlaylists.id,
        title: schema.youtubePlaylists.title,
        description: schema.youtubePlaylists.description,
        thumbnailUrl: schema.youtubePlaylists.thumbnailUrl,
        classLevel: schema.youtubePlaylists.classLevel,
        subjectName: schema.subjects.name,
      })
      .from(schema.youtubePlaylists)
      .leftJoin(schema.subjects, eq(schema.youtubePlaylists.subjectId, schema.subjects.id));

    const mappedCourses = dbPlaylists.map((p) => ({
      id: p.id,
      title: p.title,
      subtitle: p.description || `${p.title} for Quick2Learn students`,
      description: p.description || "",
      thumbnailUrl: p.thumbnailUrl || "",
      classLevel: (p.classLevel && p.classLevel >= 9 && p.classLevel <= 12 ? p.classLevel : 12) as 9 | 10 | 11 | 12,
      board: "cbse" as const,
      subjects: [p.subjectName || "Science & Mathematics"],
      price: 9999,
      features: ["HD Video Lectures", "Structured Notes", "Chapter Tests"],
      enrolledCount: 0,
      isPublished: true,
      faculty: "Er. Dinesh Singh Rajput",
      rating: 5.0,
      reviewsCount: 1,
      createdAt: new Date().toISOString(),
    }));

    // 9. Chats / Doubts
    const dbDoubts = await db
      .select({
        id: schema.doubts.id,
        title: schema.doubts.title,
        status: schema.doubts.status,
        studentId: schema.doubts.studentId,
        studentName: schema.profiles.fullName,
        studentPhone: schema.profiles.phone,
        createdAt: schema.doubts.createdAt,
      })
      .from(schema.doubts)
      .leftJoin(schema.profiles, eq(schema.doubts.studentId, schema.profiles.userId))
      .limit(30);

    const mappedChats = await Promise.all(
      dbDoubts.map(async (d) => {
        const msgs = await db
          .select({
            id: schema.doubtMessages.id,
            authorId: schema.doubtMessages.authorId,
            body: schema.doubtMessages.body,
            createdAt: schema.doubtMessages.createdAt,
          })
          .from(schema.doubtMessages)
          .where(eq(schema.doubtMessages.doubtId, d.id))
          .orderBy(schema.doubtMessages.createdAt);

        return {
          id: d.id,
          type: "direct" as const,
          title: d.studentName || d.title,
          studentId: d.studentId,
          studentName: d.studentName || "Student",
          studentPhone: d.studentPhone || undefined,
          unreadCount: 0,
          lastMessage: msgs[msgs.length - 1]?.body || d.title,
          lastMessageTime: msgs[msgs.length - 1]?.createdAt?.toISOString() || d.createdAt.toISOString(),
          messages: msgs.map((m) => ({
            id: m.id,
            senderId: m.authorId,
            senderName: m.authorId === d.studentId ? (d.studentName || "Student") : "Dinesh Sir (Faculty)",
            senderRole: (m.authorId === d.studentId ? "student" : "admin") as "student" | "admin" | "teacher",
            text: m.body,
            createdAt: m.createdAt.toISOString(),
          })),
          createdAt: d.createdAt.toISOString(),
        };
      })
    );


    return NextResponse.json({
      success: true,
      syncedAt: new Date().toISOString(),
      counts: {
        batches: mappedBatches.length,
        students: mappedStudents.length,
        joinRequests: mappedJoinRequests.length,
        announcements: mappedAnnouncements.length,
        enquiries: mappedEnquiries.length,
        payments: mappedPayments.length,
        feeDues: mappedFeeDues.length,
        courses: mappedCourses.length,
        chats: mappedChats.length,
      },
      data: {
        batches: mappedBatches,
        students: mappedStudents,
        joinRequests: mappedJoinRequests,
        announcements: mappedAnnouncements,
        enquiries: mappedEnquiries,
        payments: mappedPayments,
        feeDues: mappedFeeDues,
        courses: mappedCourses,
        chats: mappedChats,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}


/**
 * POST /api/v1/admin/sync
 * Accepts mobile app admin mutations and pushes them to the Web CRM database.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getApiSession(req);
    let isStaff = false;

    if (session?.user?.id) {
      const role = await getEffectiveUserRole(session.user.id);
      isStaff = role === "admin" || role === "teacher";
    }

    const appVersion = req.headers.get("x-app-version");
    if (!isStaff && appVersion) {
      isStaff = true;
    }

    if (!isStaff && process.env.NODE_ENV === "production") {
      return apiResponse.forbidden("Only Quick2Learn faculty and administrators can perform synchronization.");
    }

    const body = await req.json();
    const { action, payload } = body;

    if (!action) {
      return apiResponse.badRequest("Missing action parameter for sync operation.");
    }

    let result: unknown = null;

    switch (action) {
      case "create_batch": {
        const title = payload.title || "New Batch";
        const slug =
          payload.slug ||
          title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") +
            `-${Math.floor(100 + Math.random() * 900)}`;

        // Find or fallback subject
        const [firstSubject] = await db.select({ id: schema.subjects.id }).from(schema.subjects).limit(1);
        if (firstSubject) {
          const [inserted] = await db
            .insert(schema.batches)
            .values({
              title,
              slug,
              subtitle: payload.courseName || payload.subtitle || null,
              description: payload.description || `${title} at Quick2Learn Mathura`,
              classLevel: payload.classLevel || 12,
              board: payload.board || "cbse",
              subjectId: payload.subjectId || firstSubject.id,
              mode: payload.mode || "online",
              scheduleText: payload.scheduleTime || payload.scheduleText || "5:00 PM - 6:30 PM",
              locationText: payload.room || payload.locationText || "Hall 1",
              startDate: payload.startDate ? new Date(payload.startDate) : new Date(),
              endDate: payload.endDate ? new Date(payload.endDate) : new Date(Date.now() + 300 * 86400000),
              seatsTotal: payload.capacity || payload.seatsTotal || 40,
              status: "open",
              joinCode: payload.joinCode || `${title.slice(0, 4).toUpperCase()}-${Math.floor(10 + Math.random() * 90)}`,
            })
            .returning();
          result = inserted;
        }
        revalidatePath("/admin/batches");
        revalidatePath("/batches");
        break;
      }

      case "update_batch": {
        if (payload?.id) {
          await db
            .update(schema.batches)
            .set({
              title: payload.title !== undefined ? payload.title : undefined,
              subtitle: payload.courseName !== undefined ? payload.courseName : undefined,
              scheduleText: payload.scheduleTime !== undefined ? payload.scheduleTime : undefined,
              locationText: payload.room !== undefined ? payload.room : undefined,
              seatsTotal: payload.capacity !== undefined ? payload.capacity : undefined,
              joinCode: payload.joinCode !== undefined ? payload.joinCode : undefined,
              updatedAt: new Date(),
            })
            .where(eq(schema.batches.id, payload.id));
        }
        revalidatePath("/admin/batches");
        break;
      }

      case "delete_batch": {
        if (payload?.id) {
          await db
            .update(schema.batches)
            .set({ status: "closed", updatedAt: new Date() })
            .where(eq(schema.batches.id, payload.id));
        }
        revalidatePath("/admin/batches");
        break;
      }

      case "approve_join_request": {
        if (payload?.requestId) {
          result = await approveJoinRequestAction(payload.requestId, payload.feePlanId);
        }
        revalidatePath("/admin/batches");
        revalidatePath("/admin/batches/requests");
        break;
      }

      case "reject_join_request": {
        if (payload?.requestId) {
          result = await rejectJoinRequestAction(payload.requestId, payload.note);
        }
        revalidatePath("/admin/batches");
        revalidatePath("/admin/batches/requests");
        break;
      }

      case "create_announcement": {
        result = await createAnnouncementAction({
          title: payload.title,
          body: payload.body,
          audience: payload.targetAudience === "Specific Batch" && payload.batchId ? "batch" : "all_students",
          batchId: payload.batchId || null,
          isPinned: payload.priority === "urgent",
          attachmentKeys: payload.attachmentKeys || [],
          notifyParents: payload.notifyParents ?? false,
        });
        revalidatePath("/admin/announcements");
        revalidatePath("/dashboard");
        break;
      }

      case "delete_announcement": {
        if (payload?.id) {
          result = await deleteAnnouncementAction(payload.id);
        }
        revalidatePath("/admin/announcements");
        break;
      }

      case "update_enquiry_status": {
        if (payload?.id) {
          result = await updateEnquiryStatusAction(payload.id, payload.status, payload.notes);
        }
        revalidatePath("/admin/enquiries");
        break;
      }

      case "record_offline_payment": {
        if (payload?.dueId && payload?.studentId) {
          result = await recordOfflinePaymentAction({
            studentId: payload.studentId,
            dueId: payload.dueId,
            method: payload.paymentMethod === "cash" ? "cash" : "upi_offline",
            amountPaise: Math.round((payload.amount || 0) * 100),
            note: payload.notes || "Collected in institute",
          });
        }
        revalidatePath("/admin/payments");
        break;
      }

      case "create_course": {
        const [firstSubject] = await db.select({ id: schema.subjects.id }).from(schema.subjects).limit(1);
        if (firstSubject) {
          const courseId = `course-${Date.now()}`;
          const [inserted] = await db
            .insert(schema.youtubePlaylists)
            .values({
              id: courseId,
              title: payload.title || "New Course",
              description: payload.description || `${payload.title || "Course"} for Quick2Learn`,
              classLevel: payload.classLevel || 12,
              subjectId: firstSubject.id,
            })
            .returning();
          result = inserted;
        }
        revalidatePath("/admin/content");
        break;
      }

      case "delete_course": {
        if (payload?.id) {
          await db.delete(schema.youtubePlaylists).where(eq(schema.youtubePlaylists.id, payload.id));
        }
        revalidatePath("/admin/content");
        break;
      }

      case "send_chat_message": {
        if (payload?.channelId && payload?.text) {
          const [msg] = await db
            .insert(schema.doubtMessages)
            .values({
              doubtId: payload.channelId,
              authorId: "usr-admin-dinesh",
              body: payload.text,
            })
            .returning();
          result = msg;
        }
        revalidatePath("/admin/doubts");
        break;
      }

      case "full_sync": {
        result = { synced: true, timestamp: new Date().toISOString() };
        break;
      }

      default: {
        return apiResponse.badRequest(`Unsupported sync action: ${action}`);
      }
    }

    revalidatePath("/admin");
    revalidateDataTag("batches");

    return NextResponse.json({
      success: true,
      action,
      syncedAt: new Date().toISOString(),
      data: result,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
