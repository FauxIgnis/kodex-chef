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

export const createEvent = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    startTime: v.number(),
    endTime: v.number(),
    attendees: v.optional(v.array(v.id("users"))),
    documentId: v.optional(v.id("documents")),
    location: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUser(ctx);
    
    const eventId = await ctx.db.insert("calendarEvents", {
      title: args.title,
      description: args.description,
      startTime: args.startTime,
      endTime: args.endTime,
      createdBy: userId,
      attendees: args.attendees,
      documentId: args.documentId,
      location: args.location,
    });

    return eventId;
  },
});

export const getUserEvents = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const allEvents = args.startDate 
      ? await ctx.db
          .query("calendarEvents")
          .withIndex("by_start_time", (q) => q.gte("startTime", args.startDate!))
          .collect()
      : await ctx.db.query("calendarEvents").collect();
    
    // Filter events where user is creator or attendee
    const userEvents = allEvents.filter(event => 
      event.createdBy === userId || 
      (event.attendees && event.attendees.includes(userId))
    );

    // Filter by end date if provided
    const filteredEvents = args.endDate 
      ? userEvents.filter(event => event.startTime <= args.endDate!)
      : userEvents;

    // Get creator information
    const eventsWithCreators = await Promise.all(
      filteredEvents.map(async (event) => {
        const creator = await ctx.db.get(event.createdBy);
        const attendeeDetails = event.attendees ? await Promise.all(
          event.attendees.map(async (attendeeId) => {
            const attendee = await ctx.db.get(attendeeId);
            return attendee ? { id: attendeeId, name: attendee.name, email: attendee.email } : null;
          })
        ) : [];
        
        return {
          ...event,
          creator: creator ? { name: creator.name, email: creator.email } : null,
          attendeeDetails: attendeeDetails.filter(Boolean),
        };
      })
    );

    return eventsWithCreators.sort((a, b) => a.startTime - b.startTime);
  },
});

export const updateEvent = mutation({
  args: {
    eventId: v.id("calendarEvents"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
    location: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUser(ctx);
    
    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    // Only creator can update event
    if (event.createdBy !== userId) {
      throw new Error("Only the creator can update this event");
    }

    const updates: any = {};
    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.startTime !== undefined) updates.startTime = args.startTime;
    if (args.endTime !== undefined) updates.endTime = args.endTime;
    if (args.location !== undefined) updates.location = args.location;

    await ctx.db.patch(args.eventId, updates);
    return true;
  },
});

export const deleteEvent = mutation({
  args: { eventId: v.id("calendarEvents") },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUser(ctx);
    
    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    // Only creator can delete event
    if (event.createdBy !== userId) {
      throw new Error("Only the creator can delete this event");
    }

    await ctx.db.delete(args.eventId);
    return true;
  },
});
