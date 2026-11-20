import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "@/server/trpc";

export const leaderboardsRouter = createTRPCRouter({
  // Top individual ambassadors by points
  topAmbassadors: publicProcedure
    .input(z.object({ limit: z.number().int().min(1).max(100).default(10) }))
    .query(async ({ ctx, input }) => {
      return ctx.db.ambassadorProfile.findMany({
        take: input.limit,
        orderBy: { totalPoints: "desc" },
        include: {
          user: { select: { firstName: true, lastName: true, profilePhoto: true } },
          institution: { select: { name: true, shortName: true } },
          memberships: {
            where: { leftAt: null },
            include: { chapter: { include: { institution: { select: { name: true } } } } },
            take: 1,
          },
          _count: {
            select: { submissions: { where: { status: "APPROVED" } } },
          },
        },
      });
    }),

  // Best performing chapters
  topChapters: publicProcedure
    .input(z.object({ limit: z.number().int().min(1).max(50).default(10) }))
    .query(async ({ ctx, input }) => {
      const chapters = await ctx.db.chapter.findMany({
        where: { status: "ACTIVE" },
        include: {
          institution: true,
          leadAssignments: {
            where: { revokedAt: null },
            include: { user: { select: { firstName: true, lastName: true } } },
          },
          memberships: { where: { leftAt: null }, select: { id: true } },
          _count: {
            select: {
              activities: { where: { status: "APPROVED" } },
              workshops: { where: { status: "COMPLETED" } },
            },
          },
        },
      });

      // Calculate chapter score = total points of all members
      const chaptersWithScore = await Promise.all(
        chapters.map(async (chapter) => {
          const memberIds = chapter.memberships.map((m: any) => m.id);
          const totalPoints = await ctx.db.ambassadorProfile.aggregate({
            where: { id: { in: memberIds } },
            _sum: { totalPoints: true },
          });

          return {
            ...chapter,
            totalPoints: totalPoints._sum.totalPoints ?? 0,
            memberCount: chapter.memberships.length,
          };
        })
      );

      return chaptersWithScore
        .sort((a, b) => b.totalPoints - a.totalPoints)
        .slice(0, input.limit);
    }),

  // Community growth leaderboard (by recent WhatsApp growth)
  communityGrowth: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(50).default(10) }))
    .query(async ({ ctx, input }) => {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const metrics = await ctx.db.communityMetric.groupBy({
        by: ["chapterId"],
        where: {
          chapterId: { not: null },
          periodStart: { gte: monthStart },
        },
        _sum: { newMembersAdded: true },
        orderBy: { _sum: { newMembersAdded: "desc" } },
        take: input.limit,
      });

      const chapterIds = metrics.map((m: any) => m.chapterId).filter(Boolean) as string[];
      const chapters = await ctx.db.chapter.findMany({
        where: { id: { in: chapterIds } },
        include: { institution: { select: { name: true, shortName: true } } },
      });

      return metrics.map((m: any) => ({
        chapterId: m.chapterId,
        newMembersThisMonth: m._sum.newMembersAdded ?? 0,
        chapter: chapters.find((c: any) => c.id === m.chapterId),
      }));
    }),

  // Most workshops
  mostWorkshops: protectedProcedure
    .input(
      z.object({
        period: z.enum(["monthly", "quarterly", "annual"]).default("monthly"),
        limit: z.number().int().min(1).max(50).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const now = new Date();
      let dateFrom: Date;
      if (input.period === "monthly") dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
      else if (input.period === "quarterly") dateFrom = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
      else dateFrom = new Date(now.getFullYear(), 0, 1);

      const results = await ctx.db.workshop.groupBy({
        by: ["chapterId"],
        where: { status: "COMPLETED", workshopDate: { gte: dateFrom } },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: input.limit,
      });

      const chapterIds = results.map((r: any) => r.chapterId);
      const chapters = await ctx.db.chapter.findMany({
        where: { id: { in: chapterIds } },
        include: { institution: { select: { name: true } } },
      });

      return results.map((r: any) => ({
        chapterId: r.chapterId,
        workshopCount: r._count.id,
        chapter: chapters.find((c: any) => c.id === r.chapterId),
      }));
    }),
});
