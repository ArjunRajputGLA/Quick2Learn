import { db, schema, eq, sql } from "@quick2learn/db";
import {
  apiOnboardingInputSchema,
  meResponseSchema,
} from "@quick2learn/shared";
import {
  apiResponse,
  checkApiRateLimits,
  handleApiError,
  requireApiSession,
} from "../utils";
import { getUserAndProfile } from "@/server/data/user";
import {
  claimParentInviteCode,
  linkParentToMatchingStudents,
} from "@/server/data/parent";

export async function POST(req: Request) {
  try {
    const { session, errorResponse } = await requireApiSession(req);
    if (errorResponse) return errorResponse;

    const rateLimitError = await checkApiRateLimits(req, session.user.id);
    if (rateLimitError) return rateLimitError;

    const body = await req.json();
    const input = apiOnboardingInputSchema.parse(body);

    const now = new Date();

    if (input.role === "student") {
      // 1. Update user name
      await db
        .update(schema.user)
        .set({
          name: input.fullName,
          updatedAt: now,
        })
        .where(eq(schema.user.id, session.user.id));

      // 2. Update profile with student fields
      await db
        .update(schema.profiles)
        .set({
          fullName: input.fullName,
          role: "student",
          classLevel: input.classLevel,
          board: input.board,
          school: input.school,
          parentPhone: input.parentPhone ? input.parentPhone.trim() : null,
          onboardedAt: now,
          updatedAt: now,
        })
        .where(eq(schema.profiles.userId, session.user.id));

      // 3. If parent phone provided, check if a parent with that phone is already registered
      if (input.parentPhone && input.parentPhone.trim().length >= 10) {
        const digits = input.parentPhone.replace(/\D/g, "").slice(-10);
        const [parentUser] = await db
          .select({ id: schema.user.id })
          .from(schema.user)
          .where(
            andParentPhoneMatch(digits, session.user.id)
          )
          .limit(1);

        if (parentUser) {
          await db
            .insert(schema.parentLinks)
            .values({
              parentUserId: parentUser.id,
              studentUserId: session.user.id,
              relation: "parent",
              verifiedAt: now,
            })
            .onConflictDoNothing();
        }
      }
    } else {
      // Parent onboarding
      // 1. Update user name
      await db
        .update(schema.user)
        .set({
          name: input.fullName,
          updatedAt: now,
        })
        .where(eq(schema.user.id, session.user.id));

      // 2. Update profile with parent role
      await db
        .update(schema.profiles)
        .set({
          fullName: input.fullName,
          role: "parent",
          onboardedAt: now,
          updatedAt: now,
        })
        .where(eq(schema.profiles.userId, session.user.id));

      // 3. Link children by invite code if provided
      if (input.inviteCode && input.inviteCode.trim()) {
        try {
          await claimParentInviteCode(session.user.id, input.inviteCode);
        } catch (inviteErr) {
          console.warn("[onboarding] Invite code claim warning:", inviteErr);
        }
      }

      // 4. Link children matching parent phone number
      const parentPhone = (session.user as any).phoneNumber;
      if (parentPhone) {
        await linkParentToMatchingStudents(session.user.id, parentPhone);
      }
    }

    // Return the full updated me payload
    const updated = await getUserAndProfile(session.user.id);
    const validated = meResponseSchema.parse(updated);

    return apiResponse.success(validated);
  } catch (err) {
    return handleApiError(err);
  }
}

function andParentPhoneMatch(digits: string, currentUserId: string) {
  return sql`
    (${schema.user.id} != ${currentUserId}) AND (
      RIGHT(REGEXP_REPLACE(COALESCE(${schema.user.phoneNumber}, ''), '\\D', '', 'g'), 10) = ${digits}
    )
  `;
}
