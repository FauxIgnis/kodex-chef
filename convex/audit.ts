import { v } from "convex/values";
import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getDocumentAuditLog = query({
  args: { 
    documentId: v.id("documents"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const logs = await ctx.db
      .query("auditLogs")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .order("desc")
      .take(args.limit || 100);

    // Get user information for each log entry
    const logsWithUsers = await Promise.all(
      logs.map(async (log) => {
        const user = await ctx.db.get(log.userId);
        return {
          ...log,
          user: user ? { name: user.name, email: user.email } : null,
        };
      })
    );

    return logsWithUsers;
  },
});

export const getUserAuditLog = query({
  args: { 
    userId: v.optional(v.id("users")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      return [];
    }

    const targetUserId = args.userId || currentUserId;

    const logs = await ctx.db
      .query("auditLogs")
      .withIndex("by_user", (q) => q.eq("userId", targetUserId))
      .order("desc")
      .take(args.limit || 100);

    // Get document information for each log entry
    const logsWithDocuments = await Promise.all(
      logs.map(async (log) => {
        const document = log.documentId ? await ctx.db.get(log.documentId) : null;
        return {
          ...log,
          document: document ? { title: document.title } : null,
        };
      })
    );

    return logsWithDocuments;
  },
});

export const getSystemAuditLog = query({
  args: { 
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    action: v.optional(v.union(
      v.literal("view"),
      v.literal("edit"),
      v.literal("create"),
      v.literal("delete"),
      v.literal("share"),
      v.literal("comment")
    )),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    let query = ctx.db.query("auditLogs").withIndex("by_timestamp");
    
    if (args.startDate) {
      query = query.filter((q) => q.gte(q.field("timestamp"), args.startDate!));
    }
    
    if (args.endDate) {
      query = query.filter((q) => q.lte(q.field("timestamp"), args.endDate!));
    }
    
    if (args.action) {
      query = query.filter((q) => q.eq(q.field("action"), args.action!));
    }

    const logs = await query
      .order("desc")
      .take(args.limit || 100);

    // Get user and document information for each log entry
    const logsWithDetails = await Promise.all(
      logs.map(async (log) => {
        const user = await ctx.db.get(log.userId);
        const document = log.documentId ? await ctx.db.get(log.documentId) : null;
        return {
          ...log,
          user: user ? { name: user.name, email: user.email } : null,
          document: document ? { title: document.title } : null,
        };
      })
    );

    return logsWithDetails;
  },
});
