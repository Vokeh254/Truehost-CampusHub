import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";

export const notificationsRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        unreadOnly: z.boolean().default(false),
        page: z.number().int().positive().default(1),
        limit: z.number().int().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, unreadOnly } = input;
      const skip = (page - 1) * limit;

      const where: any = { userId: ctx.session.user.id };
      if (unreadOnly) where.isRead = false;

      const [notifications, total, unreadCount] = await ctx.db.$transaction([
        ctx.db.notification.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
        }),
        ctx.db.notification.count({ where }),
        ctx.db.notification.count({
          where: { userId: ctx.session.user.id, isRead: false },
        }),
      ]);

      return { notifications, total, unreadCount, page, limit };
    }),

  markRead: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.notification.updateMany({
        where: { id: input.id, userId: ctx.session.user.id },
        data: { isRead: true, readAt: new Date() },
      });
      return { success: true };
    }),

  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db.notification.updateMany({
      where: { userId: ctx.session.user.id, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return { success: true };
  }),
});
