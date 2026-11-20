import { z } from "zod";
import { createTRPCRouter, protectedProcedure, adminProcedure, leadProcedure } from "@/server/trpc";
import { UserSystemRole } from "@prisma/client";

export const reportsRouter = createTRPCRouter({
  // Admin stats overview
  adminOverview: adminProcedure.query(async ({ ctx }) => {
    const [
      totalAmbassadors,
      activeAmbassadors,
      totalChapters,
      totalActivities,
      pendingActivities,
      totalWorkshops,
      totalProjects,
      totalReferrals,
      totalCertificates,
      totalMediaOrgs,
      totalEvents,
      communityTotal,
    ] = await Promise.all([
      ctx.db.ambassadorProfile.count(),
      ctx.db.user.count({ where: { systemRole: "AMBASSADOR", isActive: true, isSuspended: false } }),
      ctx.db.chapter.count({ where: { status: "ACTIVE" } }),
      ctx.db.activitySubmission.count({ where: { status: "APPROVED" } }),
      ctx.db.activitySubmission.count({ where: { status: { in: ["PENDING", "UNDER_REVIEW"] } } }),
      ctx.db.workshop.count({ where: { status: "COMPLETED" } }),
      ctx.db.studentProject.count({ where: { status: "VERIFIED" } }),
      ctx.db.referral.count({ where: { verificationStatus: "VERIFIED" } }),
      ctx.db.certificate.count({ where: { isRevoked: false } }),
      ctx.db.mediaOrganisation.count({ where: { isActive: true } }),
      ctx.db.event.count(),
      ctx.db.communityMetric.aggregate({
        _max: { totalMembers: true },
        where: { chapterId: null }, // national group
      }),
    ]);

    return {
      totalAmbassadors,
      activeAmbassadors,
      totalChapters,
      totalActivities,
      pendingActivities,
      totalWorkshops,
      totalProjects,
      totalReferrals,
      totalCertificates,
      totalMediaOrgs,
      totalEvents,
      nationalCommunitySize: communityTotal._max.totalMembers ?? 0,
    };
  }),

  // Activity trends (last 6 months)
  activityTrends: adminProcedure.query(async ({ ctx }) => {
    const months = 6;
    const results = [];

    for (let i = months - 1; i >= 0; i--) {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const [approved, submitted, referrals] = await Promise.all([
        ctx.db.activitySubmission.count({
          where: { status: "APPROVED", activityDate: { gte: start, lte: end } },
        }),
        ctx.db.activitySubmission.count({
          where: { submittedAt: { gte: start, lte: end } },
        }),
        ctx.db.referral.count({
          where: { verificationStatus: "VERIFIED", createdAt: { gte: start, lte: end } },
        }),
      ]);

      results.push({
        month: start.toLocaleString("default", { month: "short", year: "numeric" }),
        approved,
        submitted,
        referrals,
      });
    }

    return results;
  }),

  // Export data for CSV/Excel download
  exportData: leadProcedure
    .input(
      z.object({
        type: z.enum(["ambassadors", "activities", "workshops", "referrals", "chapters"]),
        chapterId: z.string().cuid().optional(),
        dateFrom: z.coerce.date().optional(),
        dateTo: z.coerce.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { type, chapterId, dateFrom, dateTo } = input;

      // Campus Leads can only export their own chapter
      let resolvedChapterId = chapterId;
      if (ctx.session.user.systemRole === UserSystemRole.CAMPUS_LEAD) {
        const lead = await ctx.db.campusLeadAssignment.findFirst({
          where: { userId: ctx.session.user.id, revokedAt: null },
        });
        resolvedChapterId = lead?.chapterId;
      }

      if (type === "ambassadors") {
        const where: any = {};
        if (resolvedChapterId) {
          where.memberships = { some: { chapterId: resolvedChapterId, leftAt: null } };
        }
        return ctx.db.ambassadorProfile.findMany({
          where,
          include: {
            user: { select: { firstName: true, lastName: true, email: true, phone: true, createdAt: true } },
            institution: { select: { name: true, type: true, county: true } },
          },
          orderBy: { totalPoints: "desc" },
        });
      }

      if (type === "activities") {
        const where: any = { status: "APPROVED" };
        if (resolvedChapterId) where.chapterId = resolvedChapterId;
        if (dateFrom) where.activityDate = { gte: dateFrom };
        if (dateTo) where.activityDate = { ...where.activityDate, lte: dateTo };

        return ctx.db.activitySubmission.findMany({
          where,
          include: {
            ambassador: { include: { user: { select: { firstName: true, lastName: true } } } },
            activityType: { select: { name: true, category: true } },
            chapter: { include: { institution: { select: { name: true } } } },
          },
          orderBy: { activityDate: "desc" },
        });
      }

      return [];
    }),
});
