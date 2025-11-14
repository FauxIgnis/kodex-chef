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

// Free tier limits
const FREE_LIMITS = {
  aiQuestions: 10,
  tasksCreated: 3,
  documentsCreated: 5,
  pdfExports: 1,
  calendarEvents: 3,
  fileUploads: 5,
};

export const getUserSubscription = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    return subscription || {
      userId,
      plan: "free" as const,
      status: "active" as const,
      startDate: Date.now(),
    };
  },
});

export const getUserUsage = query({
  args: { month: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const currentMonth = args.month || new Date().toISOString().slice(0, 7); // YYYY-MM

    const usage = await ctx.db
      .query("usageTracking")
      .withIndex("by_user_month", (q) => q.eq("userId", userId).eq("month", currentMonth))
      .first();

    return usage || {
      userId,
      month: currentMonth,
      aiQuestions: 0,
      tasksCreated: 0,
      documentsCreated: 0,
      pdfExports: 0,
      calendarEvents: 0,
      fileUploads: 0,
      lastUpdated: Date.now(),
    };
  },
});

export const checkUsageLimit = query({
  args: { 
    feature: v.union(
      v.literal("aiQuestions"),
      v.literal("tasksCreated"),
      v.literal("documentsCreated"),
      v.literal("pdfExports"),
      v.literal("calendarEvents"),
      v.literal("fileUploads")
    )
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return { allowed: false, reason: "Not authenticated" };
    }

    // Check subscription
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    // Pro users have unlimited access
    if (subscription && subscription.plan === "pro") {
      return { allowed: true, isPro: true };
    }

    // Check free tier limits
    const currentMonth = new Date().toISOString().slice(0, 7);
    const usage = await ctx.db
      .query("usageTracking")
      .withIndex("by_user_month", (q) => q.eq("userId", userId).eq("month", currentMonth))
      .first();

    const currentUsage = usage?.[args.feature] || 0;
    const limit = FREE_LIMITS[args.feature];

    if (currentUsage >= limit) {
      return { 
        allowed: false, 
        reason: `Free tier limit reached (${currentUsage}/${limit})`,
        currentUsage,
        limit,
        isPro: false
      };
    }

    return { 
      allowed: true, 
      currentUsage, 
      limit, 
      isPro: false 
    };
  },
});

export const incrementUsage = mutation({
  args: {
    feature: v.union(
      v.literal("aiQuestions"),
      v.literal("tasksCreated"),
      v.literal("documentsCreated"),
      v.literal("pdfExports"),
      v.literal("calendarEvents"),
      v.literal("fileUploads")
    ),
    amount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUser(ctx);
    const currentMonth = new Date().toISOString().slice(0, 7);
    const increment = args.amount || 1;

    const existingUsage = await ctx.db
      .query("usageTracking")
      .withIndex("by_user_month", (q) => q.eq("userId", userId).eq("month", currentMonth))
      .first();

    if (existingUsage) {
      await ctx.db.patch(existingUsage._id, {
        [args.feature]: existingUsage[args.feature] + increment,
        lastUpdated: Date.now(),
      });
    } else {
      await ctx.db.insert("usageTracking", {
        userId,
        month: currentMonth,
        aiQuestions: args.feature === "aiQuestions" ? increment : 0,
        tasksCreated: args.feature === "tasksCreated" ? increment : 0,
        documentsCreated: args.feature === "documentsCreated" ? increment : 0,
        pdfExports: args.feature === "pdfExports" ? increment : 0,
        calendarEvents: args.feature === "calendarEvents" ? increment : 0,
        fileUploads: args.feature === "fileUploads" ? increment : 0,
        lastUpdated: Date.now(),
      });
    }

    return true;
  },
});

export const createSubscription = mutation({
  args: {
    plan: v.union(v.literal("free"), v.literal("pro")),
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUser(ctx);

    // Deactivate any existing subscriptions
    const existingSubscriptions = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    for (const sub of existingSubscriptions) {
      await ctx.db.patch(sub._id, {
        status: "cancelled" as const,
        endDate: Date.now(),
      });
    }

    // Create new subscription
    const subscriptionId = await ctx.db.insert("subscriptions", {
      userId,
      plan: args.plan,
      status: "active",
      startDate: Date.now(),
      stripeCustomerId: args.stripeCustomerId,
      stripeSubscriptionId: args.stripeSubscriptionId,
    });

    return subscriptionId;
  },
});
