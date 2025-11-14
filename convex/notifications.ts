import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

async function getAuthenticatedUser(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Not authenticated");
  }
  return userId;
}

export const createNotification = mutation({
  args: {
    userId: v.id("users"),
    type: v.union(
      v.literal("mention"),
      v.literal("assignment"),
      v.literal("comment"),
      v.literal("suggestion"),
      v.literal("deadline"),
      v.literal("invitation")
    ),
    title: v.string(),
    message: v.string(),
    relatedDocumentId: v.optional(v.id("documents")),
    relatedCommentId: v.optional(v.id("comments")),
    relatedTaskId: v.optional(v.id("tasks")),
    actionUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const notificationId = await ctx.db.insert("notifications", {
      userId: args.userId,
      type: args.type,
      title: args.title,
      message: args.message,
      isRead: false,
      createdAt: Date.now(),
      relatedDocumentId: args.relatedDocumentId,
      relatedCommentId: args.relatedCommentId,
      relatedTaskId: args.relatedTaskId,
      actionUrl: args.actionUrl,
    });

    return notificationId;
  },
});

export const getUserNotifications = query({
  args: { 
    limit: v.optional(v.number()),
    unreadOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    let query = ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", userId));

    if (args.unreadOnly) {
      query = query.filter((q) => q.eq(q.field("isRead"), false));
    }

    const notifications = await query
      .order("desc")
      .take(args.limit || 50);

    return notifications;
  },
});

export const markNotificationAsRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUser(ctx);
    
    const notification = await ctx.db.get(args.notificationId);
    if (!notification || notification.userId !== userId) {
      throw new Error("Notification not found");
    }

    await ctx.db.patch(args.notificationId, {
      isRead: true,
    });

    return true;
  },
});

export const markAllNotificationsAsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthenticatedUser(ctx);
    
    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_read_status", (q) => q.eq("userId", userId).eq("isRead", false))
      .collect();

    for (const notification of unreadNotifications) {
      await ctx.db.patch(notification._id, {
        isRead: true,
      });
    }

    return unreadNotifications.length;
  },
});

export const getUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return 0;
    }

    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_read_status", (q) => q.eq("userId", userId).eq("isRead", false))
      .collect();

    return unreadNotifications.length;
  },
});
