import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  adminProcedure,
  leadProcedure,
  protectedProcedure,
} from "@/server/trpc";
import {
  createChapterSchema,
  updateChapterSchema,
  assignLeadSchema,
  transferAmbassadorSchema,
} from "@/lib/validations/chapter";
import { UserSystemRole } from "@prisma/client";
import { createAuditLog } from "@/server/services/audit.service";

export const chaptersRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        status: z.string().optional(),
        county: z.string().optional(),
        institutionType: z.string().optional(),
        page: z.number().int().positive().default(1),
        limit: z.number().int().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, status, county, institutionType } = input;
      const skip = (page - 1) * limit;

      // Campus Leads can only see their own chapter
      let chapterIdFilter: string | undefined;
      if (ctx.session.user.systemRole === UserSystemRole.CAMPUS_LEAD) {
        const lead = await ctx.db.campusLeadAssignment.findFirst({
          where: { userId: ctx.session.user.id, revokedAt: null },
        });
        if (!lead) return { chapters: [], total: 0 };
        chapterIdFilter = lead.chapterId;
      }

      const where: any = {};
      if (chapterIdFilter) where.id = chapterIdFilter;
      if (status) where.status = status;
      if (county) where.institution = { county };
      if (institutionType) where.institution = { ...where.institution, type: institutionType };

      const [chapters, total] = await ctx.db.$transaction([
        ctx.db.chapter.findMany({
          where,
          skip,
          take: limit,
          include: {
            institution: true,
            leadAssignments: {
              where: { revokedAt: null },
              include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
            },
            _count: {
              select: {
                memberships: { where: { leftAt: null } },
                activities: { where: { status: "APPROVED" } },
                workshops: { where: { status: "COMPLETED" } },
              },
            },
          },
          orderBy: { institution: { name: "asc" } },
        }),
        ctx.db.chapter.count({ where }),
      ]);

      return { chapters, total, page, limit };
    }),

  byId: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const chapter = await ctx.db.chapter.findUnique({
        where: { id: input.id },
        include: {
          institution: true,
          leadAssignments: {
            include: { user: { select: { id: true, firstName: true, lastName: true, email: true, profilePhoto: true } } },
            orderBy: { assignedAt: "desc" },
          },
          memberships: {
            where: { leftAt: null },
            include: {
              ambassador: {
                include: {
                  user: { select: { id: true, firstName: true, lastName: true, email: true, profilePhoto: true } },
                },
              },
            },
          },
          communityGroups: { where: { isActive: true } },
          _count: {
            select: {
              memberships: { where: { leftAt: null } },
              activities: { where: { status: "APPROVED" } },
              workshops: { where: { status: "COMPLETED" } },
            },
          },
        },
      });

      if (!chapter) throw new TRPCError({ code: "NOT_FOUND" });
      return chapter;
    }),

  create: adminProcedure
    .input(createChapterSchema)
    .mutation(async ({ ctx, input }) => {
      const chapter = await ctx.db.chapter.create({ data: input });
      await createAuditLog(ctx.db, {
        userId: ctx.session.user.id,
        action: "CREATE",
        resource: "Chapter",
        resourceId: chapter.id,
        newValues: input,
      });
      return chapter;
    }),

  update: adminProcedure
    .input(updateChapterSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const existing = await ctx.db.chapter.findUnique({ where: { id } });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      const updated = await ctx.db.chapter.update({ where: { id }, data });
      await createAuditLog(ctx.db, {
        userId: ctx.session.user.id,
        action: "UPDATE",
        resource: "Chapter",
        resourceId: id,
        oldValues: existing,
        newValues: data,
      });
      return updated;
    }),

  assignLead: adminProcedure
    .input(assignLeadSchema)
    .mutation(async ({ ctx, input }) => {
      const { chapterId, userId, role, notes } = input;

      // Revoke existing assignment for this role if any
      await ctx.db.campusLeadAssignment.updateMany({
        where: { chapterId, role, revokedAt: null },
        data: { revokedAt: new Date() },
      });

      // Update the user's system role to CAMPUS_LEAD
      await ctx.db.user.update({
        where: { id: userId },
        data: { systemRole: UserSystemRole.CAMPUS_LEAD },
      });

      const assignment = await ctx.db.campusLeadAssignment.create({
        data: { chapterId, userId, role, assignedBy: ctx.session.user.id, notes },
      });

      await createAuditLog(ctx.db, {
        userId: ctx.session.user.id,
        action: "ASSIGN_LEAD",
        resource: "CampusLeadAssignment",
        resourceId: assignment.id,
        newValues: { chapterId, userId, role },
      });

      return assignment;
    }),

  revokeLead: adminProcedure
    .input(z.object({ assignmentId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const assignment = await ctx.db.campusLeadAssignment.update({
        where: { id: input.assignmentId },
        data: { revokedAt: new Date() },
      });

      // Check if user has any other active lead assignments
      const remaining = await ctx.db.campusLeadAssignment.count({
        where: { userId: assignment.userId, revokedAt: null },
      });

      if (remaining === 0) {
        await ctx.db.user.update({
          where: { id: assignment.userId },
          data: { systemRole: UserSystemRole.AMBASSADOR },
        });
      }

      return { success: true };
    }),

  transferAmbassador: adminProcedure
    .input(transferAmbassadorSchema)
    .mutation(async ({ ctx, input }) => {
      const { ambassadorId, fromChapterId, toChapterId, notes } = input;

      await ctx.db.$transaction(async (tx) => {
        // Close current membership
        await tx.chapterMembership.updateMany({
          where: { ambassadorId, chapterId: fromChapterId, leftAt: null },
          data: { leftAt: new Date() },
        });
        // Create new membership
        await tx.chapterMembership.create({
          data: {
            ambassadorId,
            chapterId: toChapterId,
            transferredFrom: fromChapterId,
            notes,
          },
        });
      });

      return { success: true };
    }),

  performance: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        period: z.enum(["monthly", "quarterly", "annual"]).default("monthly"),
      })
    )
    .query(async ({ ctx, input }) => {
      const { id, period } = input;

      const now = new Date();
      let dateFrom: Date;
      if (period === "monthly") dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
      else if (period === "quarterly") dateFrom = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
      else dateFrom = new Date(now.getFullYear(), 0, 1);

      const [
        totalAmbassadors,
        newReferrals,
        approvedActivities,
        workshops,
        projects,
        communityMetric,
      ] = await Promise.all([
        ctx.db.chapterMembership.count({ where: { chapterId: id, leftAt: null } }),
        ctx.db.referral.count({
          where: {
            referrerId: { in: await ctx.db.chapterMembership.findMany({
              where: { chapterId: id, leftAt: null },
              select: { ambassadorId: true },
            }).then(ms => ms.map((m: { ambassadorId: string }) => m.ambassadorId)) },
            verificationStatus: "VERIFIED",
            createdAt: { gte: dateFrom },
          },
        }),
        ctx.db.activitySubmission.count({
          where: { chapterId: id, status: "APPROVED", activityDate: { gte: dateFrom } },
        }),
        ctx.db.workshop.count({
          where: { chapterId: id, status: "COMPLETED", workshopDate: { gte: dateFrom } },
        }),
        ctx.db.studentProject.count({
          where: {
            ambassador: { memberships: { some: { chapterId: id } } },
            status: "VERIFIED",
          },
        }),
        ctx.db.communityMetric.findFirst({
          where: { chapterId: id },
          orderBy: { periodEnd: "desc" },
        }),
      ]);

      return {
        period,
        totalAmbassadors,
        newReferrals,
        approvedActivities,
        workshops,
        projects,
        latestCommunityMetric: communityMetric,
      };
    }),

  listInstitutions: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.institution.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
  }),

  createInstitution: adminProcedure
    .input(
      z.object({
        name: z.string().min(3),
        shortName: z.string().optional(),
        type: z.enum(["UNIVERSITY", "TVET"]),
        county: z.string().min(2),
        town: z.string().min(2),
        region: z.string().optional(),
        website: z.string().url().optional().or(z.literal("")),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.institution.create({ data: input });
    }),
});
