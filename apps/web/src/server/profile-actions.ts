"use server";

import {
  db,
  profiles,
  auditLog,
  eq,
  type UserRole,
} from "@quick2learn/db";
import {
  onboardingSchema,
  updateProfileSchema,
  type OnboardingInput,
  type UpdateProfileInput,
} from "@quick2learn/shared";
import { requireUser, requireRole } from "./auth/session";

export interface ProfileActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Completes the one-time student onboarding process and marks onboarded_at.
 */
export async function completeOnboardingAction(
  input: OnboardingInput
): Promise<ProfileActionResult> {
  const current = await requireUser();
  const parsed = onboardingSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message || "Invalid onboarding form data",
    };
  }

  const { fullName, phone, classLevel, board, school, parentName, parentPhone, city } =
    parsed.data;

  try {
    await db
      .insert(profiles)
      .values({
        userId: current.user.id,
        fullName,
        phone,
        classLevel,
        board,
        school,
        parentName,
        parentPhone,
        city,
        role: "student",
        onboardedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: profiles.userId,
        set: {
          fullName,
          phone,
          classLevel,
          board,
          school,
          parentName,
          parentPhone,
          city,
          onboardedAt: new Date(),
          updatedAt: new Date(),
        },
      });

    return { success: true };
  } catch (err) {
    console.error("[completeOnboardingAction] Failed to update onboarding:", err);
    return {
      success: false,
      error: "Failed to save profile. Please try again.",
    };
  }
}

/**
 * Updates user profile with a strict whitelist of fields.
 * ROLE CAN NEVER BE UPDATED VIA THIS ACTION.
 */
export async function updateProfileAction(
  input: UpdateProfileInput
): Promise<ProfileActionResult> {
  const current = await requireUser();
  const parsed = updateProfileSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message || "Invalid profile data",
    };
  }

  const data = parsed.data;
  const updatePayload: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (data.fullName !== undefined) updatePayload.fullName = data.fullName;
  if (data.phone !== undefined) updatePayload.phone = data.phone;
  if (data.classLevel !== undefined) updatePayload.classLevel = data.classLevel;
  if (data.board !== undefined) updatePayload.board = data.board;
  if (data.school !== undefined) updatePayload.school = data.school;
  if (data.parentName !== undefined) updatePayload.parentName = data.parentName;
  if (data.parentPhone !== undefined) updatePayload.parentPhone = data.parentPhone;
  if (data.city !== undefined) updatePayload.city = data.city;

  try {
    await db
      .update(profiles)
      .set(updatePayload)
      .where(eq(profiles.userId, current.user.id));

    return { success: true };
  } catch (err) {
    console.error("[updateProfileAction] Failed to update profile:", err);
    return {
      success: false,
      error: "Failed to update profile.",
    };
  }
}

/**
 * Admin-only action to change a user's role.
 * Writes an immutable audit_log record inside a database transaction.
 */
export async function promoteUserRoleAction({
  targetUserId,
  newRole,
}: {
  targetUserId: string;
  newRole: UserRole;
}): Promise<ProfileActionResult> {
  const admin = await requireRole("admin");

  try {
    await db.transaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(profiles)
        .where(eq(profiles.userId, targetUserId))
        .limit(1);

      if (!existing) {
        throw new Error("Target user profile not found");
      }

      await tx
        .update(profiles)
        .set({ role: newRole, updatedAt: new Date() })
        .where(eq(profiles.userId, targetUserId));

      await tx.insert(auditLog).values({
        actorId: admin.user.id,
        action: "role_change",
        entity: "profile",
        entityId: targetUserId,
        diff: {
          previousRole: existing.role,
          newRole,
        },
      });
    });

    return { success: true };
  } catch (err) {
    console.error("[promoteUserRoleAction] Error changing role:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to change user role",
    };
  }
}
