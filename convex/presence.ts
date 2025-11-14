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

export const updatePresence = mutation({
  args: {
    documentId: v.optional(v.id("documents")),
    workspaceId: v.optional(v.id("workspaces")),
    cursorPosition: v.optional(v.number()),
    selection: v.optional(v.object({
      start: v.number(),
      end: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUser(ctx);
    
    const existingPresence = await ctx.db
      .query("presence")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const presenceData = {
      userId,
      documentId: args.documentId,
      workspaceId: args.workspaceId,
      lastSeen: Date.now(),
      isActive: true,
      cursorPosition: args.cursorPosition,
      selection: args.selection,
    };

    if (existingPresence) {
      await ctx.db.patch(existingPresence._id, presenceData);
    } else {
      await ctx.db.insert("presence", presenceData);
    }

    return true;
  },
});

export const getDocumentPresence = query({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const presenceRecords = await ctx.db
      .query("presence")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .filter((q) => q.gt(q.field("lastSeen"), Date.now() - 30000)) // Active in last 30 seconds
      .collect();

    // Get user information for each presence record
    const presenceWithUsers = await Promise.all(
      presenceRecords.map(async (presence) => {
        const user = await ctx.db.get(presence.userId);
        return {
          ...presence,
          user: user ? { 
            name: user.name, 
            email: user.email,
            id: user._id 
          } : null,
        };
      })
    );

    // Filter out current user and users without valid data
    return presenceWithUsers
      .filter(p => p.user && p.userId !== userId)
      .filter(Boolean);
  },
});

export const setInactive = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthenticatedUser(ctx);
    
    const existingPresence = await ctx.db
      .query("presence")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existingPresence) {
      await ctx.db.patch(existingPresence._id, {
        isActive: false,
        lastSeen: Date.now(),
      });
    }

    return true;
  },
});
