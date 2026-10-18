import { db, schema, eq, type DatabaseExecutor } from "@quick2learn/db";
import { NotFoundError, ForbiddenError } from "../authz";
import type { RegisterDeviceInput, DeviceTokenResponse } from "@quick2learn/shared";

export async function registerDeviceToken(
  userId: string,
  input: RegisterDeviceInput,
  tx?: DatabaseExecutor
): Promise<DeviceTokenResponse> {
  const d = tx || db;
  const now = new Date();

  const [device] = await d
    .insert(schema.deviceTokens)
    .values({
      userId,
      expoPushToken: input.expoPushToken,
      platform: input.platform,
      appVersion: input.appVersion || null,
      lastSeenAt: now,
      disabledAt: null,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: schema.deviceTokens.expoPushToken,
      set: {
        userId,
        platform: input.platform,
        appVersion: input.appVersion || null,
        lastSeenAt: now,
        disabledAt: null,
        updatedAt: now,
      },
    })
    .returning();

  if (!device) {
    throw new Error("Failed to register device token");
  }

  return {
    id: device.id,
    userId: device.userId,
    expoPushToken: device.expoPushToken,
    platform: device.platform,
    appVersion: device.appVersion,
    lastSeenAt: device.lastSeenAt.toISOString(),
    disabledAt: device.disabledAt ? device.disabledAt.toISOString() : null,
  };
}

export async function unregisterDeviceToken(
  userId: string,
  deviceId: string,
  tx?: DatabaseExecutor
): Promise<{ success: boolean }> {
  const d = tx || db;

  const [existing] = await d
    .select()
    .from(schema.deviceTokens)
    .where(eq(schema.deviceTokens.id, deviceId))
    .limit(1);

  if (!existing) {
    throw new NotFoundError("Device token not found");
  }

  if (existing.userId !== userId) {
    throw new ForbiddenError("You do not have permission to delete this device token");
  }

  await d
    .delete(schema.deviceTokens)
    .where(eq(schema.deviceTokens.id, deviceId));

  return { success: true };
}
