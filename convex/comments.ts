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

export const addComment = mutation({
  args: {
    documentId: v.id("documents"),
    content: v.string(),
    parentCommentId: v.optional(v.id("comments")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUser(ctx);
    
    const commentId = await ctx.db.insert("comments", {
      documentId: args.documentId,
      content: args.content,
      authorId: userId,
      parentCommentId: args.parentCommentId,
      createdAt: Date.now(),
      type: "comment",
    });

    // Log audit event
    await ctx.db.insert("auditLogs", {
      documentId: args.documentId,
      userId,
      action: "comment",
      details: `Added comment: ${args.content.substring(0, 50)}...`,
      timestamp: Date.now(),
    });

    return commentId;
  },
});

export const getDocumentComments = query({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const comments = await ctx.db
      .query("comments")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .collect();

    // Get author information for each comment
    const commentsWithAuthors = await Promise.all(
      comments.map(async (comment) => {
        const author = await ctx.db.get(comment.authorId);
        return {
          ...comment,
          author: author ? { name: author.name, email: author.email } : null,
        };
      })
    );

    return commentsWithAuthors;
  },
});

export const deleteComment = mutation({
  args: { commentId: v.id("comments") },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUser(ctx);
    
    const comment = await ctx.db.get(args.commentId);
    if (!comment) {
      throw new Error("Comment not found");
    }

    // Only author can delete their comment
    if (comment.authorId !== userId) {
      throw new Error("You can only delete your own comments");
    }

    await ctx.db.delete(args.commentId);
    return true;
  },
});
