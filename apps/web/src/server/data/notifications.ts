import { db, schema, eq, and, desc, lt, inArray, isNull, sql, type DatabaseExecutor } from "@quick2learn/db";
import type {
  NotificationItem,
  PaginatedNotifications,
  MarkNotificationsReadInput,
  MarkNotificationsReadResponse,
  UnreadCountResponse,
  NotificationPrefItem,
} from "@quick2learn/shared";

export async function listUserNotifications(
  userId: string,
  options?: { cursor?: string; limit?: number },
  tx?: DatabaseExecutor
): Promise<PaginatedNotifications> {
  const d = tx || db;
  const limit = Math.min(Math.max(options?.limit ?? 20, 1), 50);

  const conditions = [eq(schema.notifications.userId, userId)];

  if (options?.cursor) {
    const cursorDate = new Date(options.cursor);
    if (!isNaN(cursorDate.getTime())) {
      conditions.push(lt(schema.notifications.createdAt, cursorDate));
    }
  }

  const rows = await d
    .select()
    .from(schema.notifications)
    .where(and(...conditions))
    .orderBy(desc(schema.notifications.createdAt), desc(schema.notifications.id))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const itemsToReturn = hasMore ? rows.slice(0, limit) : rows;

  const items: NotificationItem[] = itemsToReturn.map((r) => ({
    id: r.id,
    userId: r.userId,
    type: r.type,
    title: r.title,
    body: r.body,
    data: r.data as Record<string, any>,
    readAt: r.readAt ? r.readAt.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
  }));

  const lastItem = itemsToReturn[itemsToReturn.length - 1];
  const nextCursor =
    hasMore && lastItem
      ? (typeof lastItem.createdAt === "string" ? lastItem.createdAt : lastItem.createdAt.toISOString())
      : null;

  return {
    items,
    nextCursor,
  };
}

export async function getUnreadNotificationsCount(
  userId: string,
  tx?: DatabaseExecutor
): Promise<UnreadCountResponse> {
  const d = tx || db;

  const [res] = await d
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.notifications)
    .where(
      and(
        eq(schema.notifications.userId, userId),
        isNull(schema.notifications.readAt)
      )
    );

  return { unreadCount: Number(res?.count ?? 0) };
}

export async function markNotificationsRead(
  userId: string,
  input: MarkNotificationsReadInput,
  tx?: DatabaseExecutor
): Promise<MarkNotificationsReadResponse> {
  const d = tx || db;
  const now = new Date();

  if ("all" in input && input.all) {
    const updated = await d
      .update(schema.notifications)
      .set({ readAt: now })
      .where(
        and(
          eq(schema.notifications.userId, userId),
          isNull(schema.notifications.readAt)
        )
      )
      .returning({ id: schema.notifications.id });

    return { success: true, count: updated.length };
  }

  if ("ids" in input && input.ids && input.ids.length > 0) {
    const updated = await d
      .update(schema.notifications)
      .set({ readAt: now })
      .where(
        and(
          eq(schema.notifications.userId, userId),
          inArray(schema.notifications.id, input.ids),
          isNull(schema.notifications.readAt)
        )
      )
      .returning({ id: schema.notifications.id });

    return { success: true, count: updated.length };
  }

  return { success: true, count: 0 };
}

export async function getUserNotificationPreferences(
  userId: string,
  tx?: DatabaseExecutor
): Promise<NotificationPrefItem[]> {
  const d = tx || db;

  const rows = await d
    .select({
      type: schema.notificationPrefs.type,
      enabled: schema.notificationPrefs.enabled,
    })
    .from(schema.notificationPrefs)
    .where(eq(schema.notificationPrefs.userId, userId));

  return rows;
}

export async function updateUserNotificationPreference(
  userId: string,
  type: string,
  enabled: boolean,
  tx?: DatabaseExecutor
): Promise<NotificationPrefItem> {
  const d = tx || db;
  const now = new Date();

  const [row] = await d
    .insert(schema.notificationPrefs)
    .values({
      userId,
      type,
      enabled,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [schema.notificationPrefs.userId, schema.notificationPrefs.type],
      set: {
        enabled,
        updatedAt: now,
      },
    })
    .returning({
      type: schema.notificationPrefs.type,
      enabled: schema.notificationPrefs.enabled,
    });

  if (!row) {
    throw new Error("Failed to update notification preference");
  }

  return row;
}
