import { Expo, type ExpoPushMessage, type ExpoPushTicket } from "expo-server-sdk";
import { after } from "next/server";
import { db, schema, eq, inArray, and, isNull } from "@quick2learn/db";

export type NotificationTarget =
  | string[]
  | { userIds: string[] }
  | { batchId: string }
  | { parentsOfBatchId: string }
  | { role: "student" | "teacher" | "admin" };

export interface NotificationPayload {
  type: string;
  title: string;
  body: string;
  data?: {
    route?: string;
    [key: string]: any;
  };
}

export interface NotifyResult {
  success: boolean;
  recipientCount: number;
  inboxCount: number;
}

/**
 * Resolves targets into distinct user IDs.
 */
async function resolveTargetUserIds(target: NotificationTarget): Promise<string[]> {
  if (Array.isArray(target)) {
    return target;
  }

  if ("userIds" in target) {
    return target.userIds;
  }

  if ("batchId" in target) {
    const enrollments = await db
      .select({ studentId: schema.enrollments.studentId })
      .from(schema.enrollments)
      .where(
        and(
          eq(schema.enrollments.batchId, target.batchId),
          eq(schema.enrollments.status, "active")
        )
      );
    return enrollments.map((e) => e.studentId);
  }

  if ("parentsOfBatchId" in target) {
    const enrollments = await db
      .select({ studentId: schema.enrollments.studentId })
      .from(schema.enrollments)
      .where(
        and(
          eq(schema.enrollments.batchId, target.parentsOfBatchId),
          eq(schema.enrollments.status, "active")
        )
      );

    const studentIds = enrollments.map((e) => e.studentId);
    if (studentIds.length === 0) return [];

    const parentUserIds: string[] = [];

    // 1. Primary: schema.parentLinks
    const links = await db
      .select({ parentUserId: schema.parentLinks.parentUserId })
      .from(schema.parentLinks)
      .where(inArray(schema.parentLinks.studentUserId, studentIds));

    for (const l of links) {
      parentUserIds.push(l.parentUserId);
    }

    // 2. Fallback: match by parentPhone
    const studentProfiles = await db
      .select({ parentPhone: schema.profiles.parentPhone })
      .from(schema.profiles)
      .where(inArray(schema.profiles.userId, studentIds));

    const parentPhones = studentProfiles
      .map((p) => p.parentPhone)
      .filter((phone): phone is string => !!phone && phone.trim().length >= 10);

    if (parentPhones.length > 0) {
      const parentProfiles = await db
        .select({ userId: schema.profiles.userId })
        .from(schema.profiles)
        .where(inArray(schema.profiles.phone, parentPhones));

      for (const p of parentProfiles) {
        parentUserIds.push(p.userId);
      }
    }

    return Array.from(new Set(parentUserIds)).filter(Boolean);
  }

  if ("role" in target) {
    const profiles = await db
      .select({ userId: schema.profiles.userId })
      .from(schema.profiles)
      .where(eq(schema.profiles.role, target.role));
    return profiles.map((p) => p.userId);
  }

  return [];
}

/**
 * Sends notifications to user inboxes and dispatches push notifications via Expo Push API in chunks of 100.
 */
export async function notify(
  target: NotificationTarget,
  message: NotificationPayload
): Promise<NotifyResult> {
  const rawUserIds = await resolveTargetUserIds(target);
  const uniqueUserIds = Array.from(new Set(rawUserIds)).filter(Boolean);

  if (uniqueUserIds.length === 0) {
    return { success: true, recipientCount: 0, inboxCount: 0 };
  }

  // 1. Check user notification preferences
  const prefs = await db
    .select({
      userId: schema.notificationPrefs.userId,
      enabled: schema.notificationPrefs.enabled,
    })
    .from(schema.notificationPrefs)
    .where(
      and(
        inArray(schema.notificationPrefs.userId, uniqueUserIds),
        eq(schema.notificationPrefs.type, message.type)
      )
    );

  const disabledUserIds = new Set(
    prefs.filter((p) => !p.enabled).map((p) => p.userId)
  );

  const eligibleUserIds = uniqueUserIds.filter((id) => !disabledUserIds.has(id));

  if (eligibleUserIds.length === 0) {
    return { success: true, recipientCount: 0, inboxCount: 0 };
  }

  // 2. Write inbox rows
  const now = new Date();
  const rows = eligibleUserIds.map((userId) => ({
    userId,
    type: message.type,
    title: message.title,
    body: message.body,
    data: message.data ?? {},
    readAt: null,
    createdAt: now,
  }));

  for (let i = 0; i < rows.length; i += 500) {
    await db.insert(schema.notifications).values(rows.slice(i, i + 500));
  }

  // 3. Find active device tokens
  const tokens = await db
    .select({
      id: schema.deviceTokens.id,
      expoPushToken: schema.deviceTokens.expoPushToken,
      userId: schema.deviceTokens.userId,
    })
    .from(schema.deviceTokens)
    .where(
      and(
        inArray(schema.deviceTokens.userId, eligibleUserIds),
        isNull(schema.deviceTokens.disabledAt)
      )
    );

  // 4. Send Push Notifications via expo-server-sdk in chunks of 100 outside request
  const sendPushAsync = async () => {
    if (tokens.length === 0) return;

    const expo = new Expo();
    const validPushTokens: Array<{ id: string; token: string }> = [];

    for (const t of tokens) {
      if (Expo.isExpoPushToken(t.expoPushToken)) {
        validPushTokens.push({ id: t.id, token: t.expoPushToken });
      } else {
        console.warn(`[notify] Invalid Expo push token: ${t.expoPushToken}`);
      }
    }

    if (validPushTokens.length === 0) return;

    const messages: ExpoPushMessage[] = validPushTokens.map((t) => ({
      to: t.token,
      sound: "default",
      title: message.title,
      body: message.body,
      data: message.data,
    }));

    const chunks = expo.chunkPushNotifications(messages);
    const tickets: Array<{ ticket: ExpoPushTicket; tokenId: string; token: string }> = [];

    let messageIndex = 0;
    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        for (let i = 0; i < ticketChunk.length; i++) {
          const ticket = ticketChunk[i];
          const info = validPushTokens[messageIndex + i];
          if (info && ticket) {
            tickets.push({ ticket, tokenId: info.id, token: info.token });
          }
        }
      } catch (error) {
        console.error("[notify] Error sending push chunk:", error);
      }
      messageIndex += chunk.length;
    }

    // Disable tokens returning DeviceNotRegistered
    const tokensToDisable: string[] = [];
    for (const item of tickets) {
      if (item.ticket.status === "error") {
        if (item.ticket.details?.error === "DeviceNotRegistered") {
          tokensToDisable.push(item.tokenId);
        }
      }
    }

    if (tokensToDisable.length > 0) {
      console.log(`[notify] Disabling ${tokensToDisable.length} unregistered device tokens`);
      await db
        .update(schema.deviceTokens)
        .set({ disabledAt: new Date() })
        .where(inArray(schema.deviceTokens.id, tokensToDisable));
    }
  };

  try {
    after(async () => {
      await sendPushAsync();
    });
  } catch {
    // Non-request context (e.g. tests or background cron)
    await sendPushAsync();
  }

  return {
    success: true,
    recipientCount: eligibleUserIds.length,
    inboxCount: rows.length,
  };
}
