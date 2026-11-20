import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure, adminProcedure, publicProcedure } from "@/server/trpc";
import { verifyCertificate, generateCertificate } from "@/server/services/certificate.service";
import { AmbassadorTier } from "@prisma/client";

export const certificatesRouter = createTRPCRouter({
  // Public verification — no auth required
  verify: publicProcedure
    .input(z.object({ code: z.string().min(1).max(20) }))
    .query(async ({ ctx, input }) => {
      const result = await verifyCertificate(ctx.db, input.code);
      return result;
    }),

  // List templates
  listTemplates: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.certificateTemplate.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });
  }),

  createTemplate: adminProcedure
    .input(
      z.object({
        name: z.string().min(3).max(100),
        tier: z.nativeEnum(AmbassadorTier).optional(),
        htmlTemplate: z.string().min(50),
        signatureConfig: z.object({
          signatoryName: z.string(),
          title: z.string(),
          signatureImageUrl: z.string().optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.certificateTemplate.create({ data: input });
    }),

  updateTemplate: adminProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        name: z.string().min(3).max(100).optional(),
        htmlTemplate: z.string().min(50).optional(),
        signatureConfig: z
          .object({
            signatoryName: z.string(),
            title: z.string(),
            signatureImageUrl: z.string().optional(),
          })
          .optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.certificateTemplate.update({ where: { id }, data });
    }),

  // Issue manually
  issue: adminProcedure
    .input(
      z.object({
        ambassadorId: z.string().cuid(),
        achievementId: z.string().cuid(),
        templateId: z.string().cuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return generateCertificate(ctx.db, {
        ...input,
        issuedBy: ctx.session.user.id,
      });
    }),

  // Revoke
  revoke: adminProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        reason: z.string().min(5).max(500),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.certificate.update({
        where: { id: input.id },
        data: {
          isRevoked: true,
          revokedAt: new Date(),
          revokedReason: input.reason,
          revokedBy: ctx.session.user.id,
        },
      });
    }),

  // My certificates
  mine: protectedProcedure.query(async ({ ctx }) => {
    const profile = await ctx.db.ambassadorProfile.findUnique({
      where: { userId: ctx.session.user.id },
    });
    if (!profile) return [];

    return ctx.db.certificate.findMany({
      where: { ambassadorId: profile.id },
      include: { template: { select: { name: true, tier: true } } },
      orderBy: { issuedAt: "desc" },
    });
  }),

  // Verification statistics (admin)
  verificationStats: adminProcedure
    .input(z.object({ certificateId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const count = await ctx.db.certificateVerification.count({
        where: { certificateId: input.certificateId },
      });
      const recent = await ctx.db.certificateVerification.findMany({
        where: { certificateId: input.certificateId },
        orderBy: { verifiedAt: "desc" },
        take: 10,
      });
      return { count, recent };
    }),
});
