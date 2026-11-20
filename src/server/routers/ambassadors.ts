import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  adminProcedure,
  leadProcedure,
  protectedProcedure,
} from "@/server/trpc";
import { UserSystemRole } from "@prisma/client";
import { createAuditLog } from "@/server/services/audit.service";

export const ambassadorsRouter = createTRPCRouter({
  list: leadProcedure
    .input(
      z.object({
        chapterId: z.string().cuid().optional(),
        tier: z.string().optional(),
        institutionId: z.string().cuid().optional(),
        search: z.string().optional(),
        page: z.number().int().positive().default(1),
        limit: z.number().int().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, chapterId, tier, institutionId, search } = input;
      const skip = (page - 1) * limit;

      // Campus leads can only see their own chapter
      let resolvedChapterId = chapterId;
      if (ctx.session.user.systemRole === UserSystemRole.CAMPUS_LEAD) {
        const lead = await ctx.db.campusLeadAssignment.findFirst({
          where: { userId: ctx.session.user.id, revokedAt: null },
        });
        if (!lead) return { ambassadors: [], total: 0 };
        resolvedChapterId = lead.chapterId;
      }

      const where: any = {};
      if (resolvedChapterId) {
        where.memberships = { some: { chapterId: resolvedChapterId, leftAt: null } };
      }
      if (tier) where.currentTier = tier;
      if (institutionId) where.institutionId = institutionId;
      if (search) {
        where.user = {
          OR: [
            { firstName: { contains: search, mode: "insensitive" } },
            { lastName: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        };
      }

      const [ambassadors, total] = await ctx.db.$transaction([
        ctx.db.ambassadorProfile.findMany({
          where,
          skip,
          take: limit,
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                profilePhoto: true,
                isActive: true,
                isSuspended: true,
                createdAt: true,
              },
            },
            institution: true,
            memberships: {
              where: { leftAt: null },
              include: { chapter: { include: { institution: true } } },
              take: 1,
            },
            _count: {
              select: {
                submissions: { where: { status: "APPROVED" } },
                referralsMade: { where: { verificationStatus: "VERIFIED" } },
                certificates: true,
              },
            },
          },
          orderBy: { totalPoints: "desc" },
        }),
        ctx.db.ambassadorProfile.count({ where }),
      ]);

      return { ambassadors, total, page, limit };
    }),

  byId: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const profile = await ctx.db.ambassadorProfile.findUnique({
        where: { id: input.id },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              profilePhoto: true,
              isActive: true,
              isSuspended: true,
              createdAt: true,
              lastLoginAt: true,
            },
          },
          institution: true,
          memberships: {
            include: {
              chapter: { include: { institution: true } },
            },
            orderBy: { joinedAt: "desc" },
          },
          tierAchievements: {
            include: { milestone: true, certificate: true },
            orderBy: { achievedAt: "desc" },
          },
          certificates: {
            orderBy: { issuedAt: "desc" },
          },
          _count: {
            select: {
              submissions: { where: { status: "APPROVED" } },
              referralsMade: { where: { verificationStatus: "VERIFIED" } },
              projects: { where: { status: "VERIFIED" } },
            },
          },
        },
      });

      if (!profile) throw new TRPCError({ code: "NOT_FOUND" });

      // Ambassadors can only see their own profile
      if (ctx.session.user.systemRole === UserSystemRole.AMBASSADOR) {
        const isOwn = profile.userId === ctx.session.user.id;
        if (!isOwn) throw new TRPCError({ code: "FORBIDDEN" });
      }

      return profile;
    }),

  suspend: adminProcedure
    .input(
      z.object({
        userId: z.string().cuid(),
        reason: z.string().min(10),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.update({
        where: { id: input.userId },
        data: {
          isSuspended: true,
          suspendedAt: new Date(),
          suspendedReason: input.reason,
        },
      });

      await createAuditLog(ctx.db, {
        userId: ctx.session.user.id,
        action: "SUSPEND",
        resource: "User",
        resourceId: input.userId,
        newValues: { reason: input.reason },
      });

      return { success: true };
    }),

  unsuspend: adminProcedure
    .input(z.object({ userId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.user.update({
        where: { id: input.userId },
        data: { isSuspended: false, suspendedAt: null, suspendedReason: null },
      });
      return { success: true };
    }),

  dashboard: protectedProcedure.query(async ({ ctx }) => {
    const profile = await ctx.db.ambassadorProfile.findUnique({
      where: { userId: ctx.session.user.id },
      include: {
        institution: true,
        memberships: {
          where: { leftAt: null },
          include: { chapter: { include: { institution: true } } },
          take: 1,
        },
        tierAchievements: {
          include: { milestone: true },
          orderBy: { achievedAt: "desc" },
        },
        certificates: {
          where: { isRevoked: false },
          orderBy: { issuedAt: "desc" },
        },
        _count: {
          select: {
            submissions: true,
            referralsMade: true,
            projects: true,
          },
        },
      },
    });

    if (!profile) throw new TRPCError({ code: "NOT_FOUND" });

    const pendingSubmissions = await ctx.db.activitySubmission.count({
      where: {
        ambassadorId: profile.id,
        status: { in: ["PENDING", "UNDER_REVIEW"] },
      },
    });

    // National rank
    const betterCount = await ctx.db.ambassadorProfile.count({
      where: { totalPoints: { gt: profile.totalPoints } },
    });
    const nationalRank = betterCount + 1;

    // Chapter rank
    const currentChapter = profile.memberships[0]?.chapter;
    let chapterRank = 0;
    if (currentChapter) {
      const chapterBetter = await ctx.db.ambassadorProfile.count({
        where: {
          memberships: { some: { chapterId: currentChapter.id, leftAt: null } },
          totalPoints: { gt: profile.totalPoints },
        },
      });
      chapterRank = chapterBetter + 1;
    }

    return { profile, pendingSubmissions, nationalRank, chapterRank, currentChapter };
  }),

  completeOnboarding: protectedProcedure
    .input(z.object({ chapterId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const profile = await ctx.db.ambassadorProfile.findUnique({
        where: { userId: ctx.session.user.id },
      });
      if (!profile) throw new TRPCError({ code: "NOT_FOUND" });
      if (profile.onboardingCompleted) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Onboarding already completed." });
      }

      await ctx.db.$transaction([
        ctx.db.ambassadorProfile.update({
          where: { id: profile.id },
          data: { onboardingCompleted: true, onboardingCompletedAt: new Date() },
        }),
        ctx.db.chapterMembership.create({
          data: { ambassadorId: profile.id, chapterId: input.chapterId },
        }),
      ]);

      return { success: true };
    }),
});
