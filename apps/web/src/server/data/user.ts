import { db, schema, eq, type DatabaseExecutor } from "@quick2learn/db";
import { NotFoundError } from "../authz";
import type { MeResponse, UpdateMeInput } from "@quick2learn/shared";

export async function getUserAndProfile(
  userId: string,
  tx?: DatabaseExecutor
): Promise<MeResponse> {
  const d = tx || db;

  const [userRow] = await d
    .select()
    .from(schema.user)
    .where(eq(schema.user.id, userId))
    .limit(1);

  if (!userRow) {
    throw new NotFoundError("User not found");
  }

  const [profileRow] = await d
    .select()
    .from(schema.profiles)
    .where(eq(schema.profiles.userId, userId))
    .limit(1);

  const role = profileRow?.role ?? "student";

  // Linked students are only applicable for parent accounts
  let linkedStudents: MeResponse["linkedStudents"] = [];
  if (role === "parent") {
    const userPhone = profileRow?.phone || userRow.phoneNumber;
    if (userPhone) {
      const { linkParentToMatchingStudents } = await import("./parent");
      await linkParentToMatchingStudents(userId, userPhone);
    }

    const { getLinkedStudentsForParent } = await import("./parent");
    const linkedFromTable = await getLinkedStudentsForParent(userId);

    linkedStudents = linkedFromTable.map((s) => ({
      id: s.id,
      userId: s.userId,
      fullName: s.fullName,
      phone: s.phone,
      classLevel: s.classLevel !== null ? Number(s.classLevel) : null,
      board: s.board,
      school: s.school,
      avatarUrl: s.avatarUrl,
    }));
  }

  return {
    user: {
      id: userRow.id,
      email: userRow.email,
      name: userRow.name,
      image: userRow.image,
      phoneNumber: userRow.phoneNumber,
      phoneNumberVerified: userRow.phoneNumberVerified,
      emailVerified: userRow.emailVerified,
      createdAt: userRow.createdAt.toISOString(),
      updatedAt: userRow.updatedAt.toISOString(),
    },
    profile: profileRow
      ? {
          id: profileRow.id,
          userId: profileRow.userId,
          fullName: profileRow.fullName,
          phone: profileRow.phone,
          role: profileRow.role,
          classLevel: profileRow.classLevel !== null ? Number(profileRow.classLevel) : null,
          board: profileRow.board,
          school: profileRow.school,
          parentName: profileRow.parentName,
          parentPhone: profileRow.parentPhone,
          city: profileRow.city,
          avatarUrl: profileRow.avatarUrl,
          onboardedAt: profileRow.onboardedAt ? profileRow.onboardedAt.toISOString() : null,
          createdAt: profileRow.createdAt.toISOString(),
          updatedAt: profileRow.updatedAt.toISOString(),
        }
      : null,
    role,
    linkedStudents,
  };
}

export async function updateUserProfile(
  userId: string,
  input: UpdateMeInput,
  tx?: DatabaseExecutor
): Promise<MeResponse> {
  const d = tx || db;

  const [existingProfile] = await d
    .select()
    .from(schema.profiles)
    .where(eq(schema.profiles.userId, userId))
    .limit(1);

  const updatePayload: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (input.fullName !== undefined) updatePayload.fullName = input.fullName;
  if (input.phone !== undefined) updatePayload.phone = input.phone;
  if (input.classLevel !== undefined) updatePayload.classLevel = input.classLevel;
  if (input.board !== undefined) updatePayload.board = input.board;
  if (input.school !== undefined) updatePayload.school = input.school;
  if (input.parentName !== undefined) updatePayload.parentName = input.parentName;
  if (input.parentPhone !== undefined) updatePayload.parentPhone = input.parentPhone;
  if (input.city !== undefined) updatePayload.city = input.city;
  if (input.avatarUrl !== undefined) updatePayload.avatarUrl = input.avatarUrl;

  if (existingProfile) {
    await d
      .update(schema.profiles)
      .set(updatePayload)
      .where(eq(schema.profiles.userId, userId));
  } else {
    await d.insert(schema.profiles).values({
      userId,
      fullName: input.fullName || "Student",
      role: "student",
      phone: input.phone || null,
      classLevel: input.classLevel || null,
      board: input.board || null,
      school: input.school || null,
      parentName: input.parentName || null,
      parentPhone: input.parentPhone || null,
      city: input.city || null,
      avatarUrl: input.avatarUrl || null,
      onboardedAt: new Date(),
    });
  }

  return getUserAndProfile(userId, d);
}
