import "server-only";
import { db, schema, eq, and, sql, gt, isNull } from "@quick2learn/db";
import { ForbiddenError, NotFoundError } from "../authz";

/**
 * Extracts the 10-digit Indian phone number from any formatted phone string.
 */
export function normalizeIndianPhoneDigits(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.slice(-10);
}

/**
 * Formats an Indian phone number to E.164 (+91XXXXXXXXXX).
 */
export function formatIndianE164(phone: string): string {
  const digits = normalizeIndianPhoneDigits(phone);
  return digits.length === 10 ? `+91${digits}` : phone;
}

/**
 * Links a parent to all students whose profiles.parent_phone matches the parent's phone.
 */
export async function linkParentToMatchingStudents(
  parentUserId: string,
  parentPhone: string
) {
  const digits = normalizeIndianPhoneDigits(parentPhone);
  if (digits.length !== 10) {
    return [];
  }

  // Find students whose parentPhone contains the matching 10 digits
  const matchingStudents = await db
    .select({
      id: schema.profiles.id,
      userId: schema.profiles.userId,
      fullName: schema.profiles.fullName,
      phone: schema.profiles.phone,
      classLevel: schema.profiles.classLevel,
      board: schema.profiles.board,
      school: schema.profiles.school,
      avatarUrl: schema.profiles.avatarUrl,
    })
    .from(schema.profiles)
    .where(
      and(
        sql`${schema.profiles.parentPhone} IS NOT NULL`,
        sql`RIGHT(REGEXP_REPLACE(${schema.profiles.parentPhone}, '\D', '', 'g'), 10) = ${digits}`
      )
    );

  const linked = [];
  for (const student of matchingStudents) {
    // A user cannot link themselves as their own parent
    if (student.userId === parentUserId) continue;

    await db
      .insert(schema.parentLinks)
      .values({
        parentUserId,
        studentUserId: student.userId,
        relation: "parent",
        verifiedAt: new Date(),
      })
      .onConflictDoNothing({
        target: [schema.parentLinks.parentUserId, schema.parentLinks.studentUserId],
      });

    linked.push(student);
  }

  return linked;
}

/**
 * Returns all students linked to a parent account.
 */
export async function getLinkedStudentsForParent(parentUserId: string) {
  const rows = await db
    .select({
      id: schema.profiles.id,
      userId: schema.profiles.userId,
      fullName: schema.profiles.fullName,
      phone: schema.profiles.phone,
      classLevel: schema.profiles.classLevel,
      board: schema.profiles.board,
      school: schema.profiles.school,
      avatarUrl: schema.profiles.avatarUrl,
      relation: schema.parentLinks.relation,
      verifiedAt: schema.parentLinks.verifiedAt,
    })
    .from(schema.parentLinks)
    .innerJoin(
      schema.profiles,
      eq(schema.parentLinks.studentUserId, schema.profiles.userId)
    )
    .where(eq(schema.parentLinks.parentUserId, parentUserId));

  return rows;
}

/**
 * Checks if a parent is linked to a specific student.
 */
export async function isParentLinkedToStudent(
  parentUserId: string,
  studentUserId: string
): Promise<boolean> {
  const [link] = await db
    .select({ id: schema.parentLinks.id })
    .from(schema.parentLinks)
    .where(
      and(
        eq(schema.parentLinks.parentUserId, parentUserId),
        eq(schema.parentLinks.studentUserId, studentUserId)
      )
    )
    .limit(1);

  return !!link;
}

/**
 * Generates an ambiguous-character-free 6-character alphanumeric invite code valid for 24 hours.
 */
export async function generateStudentParentInviteCode(studentUserId: string) {
  // Check for an existing valid code first
  const existing = await getActiveStudentInviteCode(studentUserId);
  if (existing) {
    return existing;
  }

  // 6-character code avoiding 0/O, 1/I, L, etc.
  const chars = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  const [inserted] = await db
    .insert(schema.parentInviteCodes)
    .values({
      studentUserId,
      code,
      expiresAt,
    })
    .returning();

  if (!inserted) {
    throw new Error("Failed to generate parent invite code");
  }

  return {
    code: inserted.code,
    expiresAt: inserted.expiresAt,
  };
}

/**
 * Retrieves the currently active, unexpired, and unused invite code for a student.
 */
export async function getActiveStudentInviteCode(studentUserId: string) {
  const [record] = await db
    .select({
      code: schema.parentInviteCodes.code,
      expiresAt: schema.parentInviteCodes.expiresAt,
    })
    .from(schema.parentInviteCodes)
    .where(
      and(
        eq(schema.parentInviteCodes.studentUserId, studentUserId),
        isNull(schema.parentInviteCodes.usedAt),
        gt(schema.parentInviteCodes.expiresAt, new Date())
      )
    )
    .limit(1);

  return record || null;
}

/**
 * Parent claims a student invite code, creating a verified parent_links record.
 */
export async function claimParentInviteCode(
  parentUserId: string,
  rawCode: string
) {
  const code = rawCode.trim().toUpperCase();

  const [invite] = await db
    .select()
    .from(schema.parentInviteCodes)
    .where(
      and(
        eq(schema.parentInviteCodes.code, code),
        isNull(schema.parentInviteCodes.usedAt),
        gt(schema.parentInviteCodes.expiresAt, new Date())
      )
    )
    .limit(1);

  if (!invite) {
    throw new NotFoundError("Invalid or expired parent invite code.");
  }

  if (invite.studentUserId === parentUserId) {
    throw new ForbiddenError("You cannot link yourself as your own student.");
  }

  // Run in transaction: mark code used, insert parent link
  return await db.transaction(async (tx) => {
    await tx
      .update(schema.parentInviteCodes)
      .set({
        usedAt: new Date(),
        usedByParentId: parentUserId,
      })
      .where(eq(schema.parentInviteCodes.id, invite.id));

    await tx
      .insert(schema.parentLinks)
      .values({
        parentUserId,
        studentUserId: invite.studentUserId,
        relation: "parent",
        verifiedAt: new Date(),
      })
      .onConflictDoNothing({
        target: [schema.parentLinks.parentUserId, schema.parentLinks.studentUserId],
      });

    const [studentProfile] = await tx
      .select({
        id: schema.profiles.id,
        userId: schema.profiles.userId,
        fullName: schema.profiles.fullName,
        phone: schema.profiles.phone,
        classLevel: schema.profiles.classLevel,
        board: schema.profiles.board,
        school: schema.profiles.school,
        avatarUrl: schema.profiles.avatarUrl,
      })
      .from(schema.profiles)
      .where(eq(schema.profiles.userId, invite.studentUserId))
      .limit(1);

    return studentProfile;
  });
}
