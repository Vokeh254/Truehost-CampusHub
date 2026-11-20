import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure, leadProcedure, adminProcedure } from "@/server/trpc";
import {
  createEventSchema,
  updateEventStatusSchema,
  addInteractionSchema,
  registerForEventSchema,
} from "@/lib/validations/event";

export const eventsRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        status: z.string().optional(),
        category: z.string().optional(),
        chapterId: z.string().cuid().optional(),
        upcoming: z.boolean().optional(),
        page: z.number().int().positive().default(1),
        limit: z.number().int().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, status, category, chapterId, upcoming } = input;
      const skip = (page - 1) * limit;

      const where: any = {};
      if (status) where.status = status;
      if (category) where.category = category;
      if (chapterId) where.chapterId = chapterId;
      if (upcoming) where.eventDate = { gte: new Date() };

      const [events, total] = await ctx.db.$transaction([
        ctx.db.event.findMany({
          where,
          skip,
          take: limit,
          include: {
            chapter: { include: { institution: { select: { name: true } } } },
            assignedRep: { select: { firstName: true, lastName: true } },
            _count: { select: { registrations: true, interactions: true } },
          },
          orderBy: { eventDate: "asc" },
        }),
        ctx.db.event.count({ where }),
      ]);

      return { events, total, page, limit };
    }),

  byId: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const event = await ctx.db.event.findUnique({
        where: { id: input.id },
        include: {
          chapter: { include: { institution: true } },
          registrations: {
            include: { },
          },
          interactions: { orderBy: { interactedAt: "desc" } },
          assignedRep: { select: { firstName: true, lastName: true, email: true } },
        },
      });
      if (!event) throw new TRPCError({ code: "NOT_FOUND" });
      return event;
    }),

  create: leadProcedure
    .input(createEventSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.event.create({
        data: { ...input, assignedRepUserId: ctx.session.user.id },
      });
    }),

  updateStatus: leadProcedure
    .input(updateEventStatusSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.event.update({
        where: { id: input.id },
        data: { status: input.status },
      });
    }),

  addInteraction: leadProcedure
    .input(addInteractionSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.organiserInteraction.create({
        data: { ...input, interactedBy: ctx.session.user.id },
      });
    }),

  register: protectedProcedure
    .input(registerForEventSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.eventRegistration.findUnique({
        where: { eventId_userId: { eventId: input.eventId, userId: ctx.session.user.id } },
      });
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "Already registered." });

      return ctx.db.eventRegistration.create({
        data: {
          eventId: input.eventId,
          userId: ctx.session.user.id,
          role: input.role,
        },
      });
    }),

  recordAttendance: leadProcedure
    .input(
      z.object({
        eventId: z.string().cuid(),
        userId: z.string().cuid(),
        outcome: z.string().max(500).optional(),
        contacts: z.string().max(500).optional(),
        mediaLinks: z.array(z.string().url()).default([]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.eventAttendance.create({ data: input });
    }),

  pipeline: protectedProcedure
    .input(z.object({ assignedToMe: z.boolean().default(false) }))
    .query(async ({ ctx, input }) => {
      const where: any = {};
      if (input.assignedToMe) where.assignedRepUserId = ctx.session.user.id;

      const events = await ctx.db.event.groupBy({
        by: ["status"],
        where,
        _count: { id: true },
      });

      return events.map((e: any) => ({ status: e.status, count: e._count.id }));
    }),
});
