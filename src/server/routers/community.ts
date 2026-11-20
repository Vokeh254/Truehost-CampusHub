import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure, leadProcedure, adminProcedure } from "@/server/trpc";
import { UserSystemRole } from "@prisma/client";

export const communityRouter = createTRPCRouter({
  listGroups: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.communityGroup.findMany({
      where: { isActive: true },
      include: {
        chapter: { include: { institution: { select: { name: true } } } },
        _count: { select: { metrics: true } },
      },
      orderBy: [{ isNational: "desc" }, { name: "asc" }],
    });
  }),

  createGroup: adminProcedure
    .input(
      z.object({
        name: z.string().min(2).max(200),
        chapterId: z.string().cuid().optional(),
        groupLink: z.string().url().optional().or(z.literal("")),
        isNational: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.communityGroup.create({ data: input });
    }),

  submitMetrics: leadProcedure
    .input(
      z.object({
        groupId: z.string().cuid(),
        chapterId: z.string().cuid().optional(),
        periodStart: z.coerce.date(),
        periodEnd: z.coerce.date(),
        totalMembers: z.number().int().min(0),
        newMembersAdded: z.number().int().min(0),
        membersLeft: z.number().int().min(0),
        activeMembers: z.number().int().min(0).optional(),
        announcementsShared: z.number().int().min(0).default(0),
        eventsPromoted: z.number().int().min(0).default(0),
        questionsAsked: z.number().int().min(0).default(0),
        evidenceUrl: z.string().url().optional().or(z.literal("")),
        notes: z.string().max(1000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Campus Leads can only submit for their own chapter
      if (ctx.session.user.systemRole === UserSystemRole.CAMPUS_LEAD && input.chapterId) {
        const lead = await ctx.db.campusLeadAssignment.findFirst({
          where: { userId: ctx.session.user.id, chapterId: input.chapterId, revokedAt: null },
        });
        if (!lead) throw new TRPCError({ code: "FORBIDDEN" });
      }

      return ctx.db.communityMetric.create({
        data: { ...input, reportedById: ctx.session.user.id },
      });
    }),

  listMetrics: protectedProcedure
    .input(
      z.object({
        chapterId: z.string().cuid().optional(),
        groupId: z.string().cuid().optional(),
        from: z.coerce.date().optional(),
        to: z.coerce.date().optional(),
        page: z.number().int().positive().default(1),
        limit: z.number().int().min(1).max(50).default(12),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, chapterId, groupId, from, to } = input;
      const skip = (page - 1) * limit;

      const where: any = {};
      if (chapterId) where.chapterId = chapterId;
      if (groupId) where.groupId = groupId;
      if (from || to) {
        where.periodStart = {};
        if (from) where.periodStart.gte = from;
        if (to) where.periodStart.lte = to;
      }

      const [metrics, total] = await ctx.db.$transaction([
        ctx.db.communityMetric.findMany({
          where,
          skip,
          take: limit,
          include: {
            group: { select: { name: true, platform: true } },
            reportedBy: { select: { firstName: true, lastName: true } },
            chapter: { include: { institution: { select: { name: true } } } },
          },
          orderBy: { periodEnd: "desc" },
        }),
        ctx.db.communityMetric.count({ where }),
      ]);

      return { metrics, total };
    }),

  chapterGrowth: protectedProcedure
    .input(z.object({ chapterId: z.string().cuid(), months: z.number().int().min(1).max(24).default(6) }))
    .query(async ({ ctx, input }) => {
      const { chapterId, months } = input;
      const from = new Date();
      from.setMonth(from.getMonth() - months);

      const metrics = await ctx.db.communityMetric.findMany({
        where: { chapterId, periodStart: { gte: from } },
        orderBy: { periodStart: "asc" },
        select: {
          periodStart: true,
          periodEnd: true,
          totalMembers: true,
          newMembersAdded: true,
          activeMembers: true,
        },
      });

      return metrics;
    }),

  verifyMetric: adminProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.communityMetric.update({
        where: { id: input.id },
        data: { verifiedAt: new Date(), verifiedById: ctx.session.user.id },
      });
    }),
});
