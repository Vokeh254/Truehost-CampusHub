import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure, leadProcedure, adminProcedure } from "@/server/trpc";
import {
  createMediaOrgSchema,
  createMediaContactSchema,
  createMediaOpportunitySchema,
  updateOpportunityStatusSchema,
} from "@/lib/validations/media";
import { addInteractionSchema } from "@/lib/validations/event";

export const mediaRouter = createTRPCRouter({
  // ── Organisations ──────────────────────────────────────────────────────────
  listOrgs: protectedProcedure
    .input(
      z.object({
        type: z.string().optional(),
        search: z.string().optional(),
        page: z.number().int().positive().default(1),
        limit: z.number().int().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, type, search } = input;
      const skip = (page - 1) * limit;

      const where: any = {};
      if (type) where.type = type;
      if (search) where.name = { contains: search, mode: "insensitive" };

      const [orgs, total] = await ctx.db.$transaction([
        ctx.db.mediaOrganisation.findMany({
          where,
          skip,
          take: limit,
          include: {
            _count: { select: { contacts: true, opportunities: true } },
          },
          orderBy: { name: "asc" },
        }),
        ctx.db.mediaOrganisation.count({ where }),
      ]);

      return { orgs, total, page, limit };
    }),

  createOrg: leadProcedure
    .input(createMediaOrgSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.mediaOrganisation.create({ data: input });
    }),

  createContact: leadProcedure
    .input(createMediaContactSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.mediaContact.create({ data: input });
    }),

  // ── Opportunities ──────────────────────────────────────────────────────────
  listOpportunities: protectedProcedure
    .input(
      z.object({
        status: z.string().optional(),
        organisationId: z.string().cuid().optional(),
        page: z.number().int().positive().default(1),
        limit: z.number().int().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, status, organisationId } = input;
      const skip = (page - 1) * limit;

      const where: any = {};
      if (status) where.status = status;
      if (organisationId) where.organisationId = organisationId;

      const [opportunities, total] = await ctx.db.$transaction([
        ctx.db.mediaOpportunity.findMany({
          where,
          skip,
          take: limit,
          include: {
            organisation: { select: { name: true, type: true } },
            contact: { select: { name: true, role: true } },
            _count: { select: { interactions: true } },
          },
          orderBy: { createdAt: "desc" },
        }),
        ctx.db.mediaOpportunity.count({ where }),
      ]);

      return { opportunities, total, page, limit };
    }),

  createOpportunity: leadProcedure
    .input(createMediaOpportunitySchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.mediaOpportunity.create({ data: input });
    }),

  updateOpportunityStatus: leadProcedure
    .input(updateOpportunityStatusSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.mediaOpportunity.update({ where: { id }, data });
    }),

  addInteraction: leadProcedure
    .input(addInteractionSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.organiserInteraction.create({
        data: { ...input, interactedBy: ctx.session.user.id },
      });
    }),

  // ── Dashboard ─────────────────────────────────────────────────────────────
  dashboard: protectedProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalOrgs,
      totalOpportunities,
      byStatus,
      confirmedInterviews,
      publishedArticles,
      followUpsDue,
      totalReach,
    ] = await Promise.all([
      ctx.db.mediaOrganisation.count({ where: { isActive: true } }),
      ctx.db.mediaOpportunity.count(),
      ctx.db.mediaOpportunity.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ctx.db.mediaOpportunity.count({ where: { status: "CONFIRMED" as any } }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ctx.db.mediaOpportunity.count({ where: { status: "PUBLISHED" as any } }),
      ctx.db.organiserInteraction.count({
        where: {
          followUpDate: { lte: now, gte: thirtyDaysAgo },
          followUpDone: false,
        },
      }),
      ctx.db.mediaOpportunity.aggregate({
        _sum: { estimatedReach: true },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        where: { status: { in: ["PUBLISHED", "COMPLETED"] as any } },
      }),
    ]);

    const totalContacted = byStatus.find((s: any) => s.status === "CONTACTED")?._count.id ?? 0;
    const totalPitched = byStatus.find((s: any) => s.status === "PITCH_SUBMITTED")?._count.id ?? 0;

    return {
      totalOrgs,
      totalOpportunities,
      confirmedInterviews,
      publishedArticles,
      followUpsDue,
      totalReach: totalReach._sum.estimatedReach ?? 0,
      totalContacted,
      totalPitched,
      byStatus,
      conversionRate:
        totalOpportunities > 0
          ? ((confirmedInterviews + publishedArticles) / totalOpportunities) * 100
          : 0,
    };
  }),

  followUpsDue: protectedProcedure.query(async ({ ctx }) => {
    const now = new Date();
    return ctx.db.organiserInteraction.findMany({
      where: {
        followUpDate: { lte: now },
        followUpDone: false,
      },
      include: {
        event: { select: { name: true, status: true } },
        mediaOpportunity: {
          include: { organisation: { select: { name: true } } },
        },
      },
      orderBy: { followUpDate: "asc" },
      take: 50,
    });
  }),

  markFollowUpDone: leadProcedure
    .input(z.object({ interactionId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.organiserInteraction.update({
        where: { id: input.interactionId },
        data: { followUpDone: true },
      });
    }),
});
