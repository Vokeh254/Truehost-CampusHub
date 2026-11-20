import { z } from "zod";
import { createHash } from "crypto";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  protectedProcedure,
  leadProcedure,
  adminProcedure,
} from "@/server/trpc";
import {
  submitActivitySchema,
  reviewActivitySchema,
  activityFilterSchema,
} from "@/lib/validations/activity";
import { UserSystemRole, SubmissionStatus } from "@prisma/client";
import { awardPoints, revokePoints } from "@/server/services/points.service";
import { createNotification, notifyAdmins, notifyChapterLeads } from "@/server/services/notification.service";
import { sendEmail, activityApprovedEmail, activityRejectedEmail } from "@/server/services/email.service";
import { createAuditLog } from "@/server/services/audit.service";

function buildDuplicateHash(ambassadorId: string, activityTypeId: string, date: Date): string {
  const key = `${ambassadorId}:${activityTypeId}:${date.getFullYear()}-${date.getMonth()}`;
  return createHash("sha256").update(key).digest("hex");
}

export const activitiesRouter = createTRPCRouter({
  // ── Activity Types (admin config) ──────────────────────────────────────────
  listTypes: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.activityType.findMany({
      where: { isActive: true },
      orderBy: { category: "asc" },
    });
  }),

  createType: adminProcedure
    .input(
      z.object({
        name: z.string().min(3).max(100),
        category: z.string().min(2).max(100),
        description: z.string().max(500).optional(),
        basePoints: z.number().int().min(0).max(1000),
        maxPointsPerMonth: z.number().int().positive().optional(),
        requiresEvidence: z.boolean().default(true),
        requiresParticipantCount: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.activityType.create({ data: input });
    }),

  updateType: adminProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        basePoints: z.number().int().min(0).max(1000).optional(),
        maxPointsPerMonth: z.number().int().positive().optional().nullable(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.activityType.update({ where: { id }, data });
    }),

  // ── Submissions ─────────────────────────────────────────────────────────────
  list: leadProcedure
    .input(activityFilterSchema)
    .query(async ({ ctx, input }) => {
      const { page, limit, status, chapterId, ambassadorId, activityTypeId, dateFrom, dateTo } = input;
      const skip = (page - 1) * limit;

      let resolvedChapterId = chapterId;
      if (ctx.session.user.systemRole === UserSystemRole.CAMPUS_LEAD) {
        const lead = await ctx.db.campusLeadAssignment.findFirst({
          where: { userId: ctx.session.user.id, revokedAt: null },
        });
        if (!lead) return { submissions: [], total: 0 };
        resolvedChapterId = lead.chapterId;
      }

      const where: any = {};
      if (status) where.status = status;
      if (resolvedChapterId) where.chapterId = resolvedChapterId;
      if (ambassadorId) where.ambassadorId = ambassadorId;
      if (activityTypeId) where.activityTypeId = activityTypeId;
      if (dateFrom || dateTo) {
        where.activityDate = {};
        if (dateFrom) where.activityDate.gte = dateFrom;
        if (dateTo) where.activityDate.lte = dateTo;
      }

      const [submissions, total] = await ctx.db.$transaction([
        ctx.db.activitySubmission.findMany({
          where,
          skip,
          take: limit,
          include: {
            activityType: { select: { name: true, category: true, basePoints: true } },
            ambassador: {
              include: {
                user: { select: { firstName: true, lastName: true, email: true } },
              },
            },
            chapter: { include: { institution: { select: { name: true } } } },
            evidence: true,
            reviewedBy: { select: { firstName: true, lastName: true } },
          },
          orderBy: { createdAt: "desc" },
        }),
        ctx.db.activitySubmission.count({ where }),
      ]);

      return { submissions, total, page, limit };
    }),

  mySubmissions: protectedProcedure
    .input(
      z.object({
        status: z.nativeEnum(SubmissionStatus).optional(),
        page: z.number().int().positive().default(1),
        limit: z.number().int().min(1).max(50).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, status } = input;
      const skip = (page - 1) * limit;

      const profile = await ctx.db.ambassadorProfile.findUnique({
        where: { userId: ctx.session.user.id },
      });
      if (!profile) return { submissions: [], total: 0 };

      const where: any = { ambassadorId: profile.id };
      if (status) where.status = status;

      const [submissions, total] = await ctx.db.$transaction([
        ctx.db.activitySubmission.findMany({
          where,
          skip,
          take: limit,
          include: {
            activityType: { select: { name: true, category: true } },
            evidence: true,
            pointsTransaction: { select: { points: true } },
          },
          orderBy: { createdAt: "desc" },
        }),
        ctx.db.activitySubmission.count({ where }),
      ]);

      return { submissions, total, page, limit };
    }),

  submit: protectedProcedure
    .input(submitActivitySchema)
    .mutation(async ({ ctx, input }) => {
      const profile = await ctx.db.ambassadorProfile.findUnique({
        where: { userId: ctx.session.user.id },
      });
      if (!profile) throw new TRPCError({ code: "NOT_FOUND", message: "Ambassador profile not found." });

      const activityType = await ctx.db.activityType.findUnique({
        where: { id: input.activityTypeId },
      });
      if (!activityType || !activityType.isActive) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid activity type." });
      }

      // Duplicate detection
      const dupHash = buildDuplicateHash(profile.id, input.activityTypeId, input.activityDate);
      const duplicate = await ctx.db.activitySubmission.findFirst({
        where: { duplicateCheckHash: dupHash, status: { not: "REJECTED" } },
      });
      if (duplicate) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A similar activity submission already exists for this month.",
        });
      }

      const submission = await ctx.db.activitySubmission.create({
        data: {
          ambassadorId: profile.id,
          chapterId: input.chapterId,
          activityTypeId: input.activityTypeId,
          title: input.title,
          description: input.description,
          activityDate: input.activityDate,
          participantCount: input.participantCount,
          relevantUrls: input.relevantUrls,
          expectedOutcome: input.expectedOutcome,
          actualOutcome: input.actualOutcome,
          status: SubmissionStatus.PENDING,
          submittedAt: new Date(),
          duplicateCheckHash: dupHash,
        },
      });

      // Notify reviewers
      await notifyAdmins(ctx.db, {
        type: "SUBMISSION_RECEIVED",
        title: "New activity submission",
        body: `${ctx.session.user.name} submitted "${input.title}"`,
        data: { submissionId: submission.id },
      });

      await notifyChapterLeads(ctx.db, input.chapterId, {
        type: "SUBMISSION_RECEIVED",
        title: "New activity in your chapter",
        body: `A new activity "${input.title}" is pending review.`,
        data: { submissionId: submission.id },
      });

      return submission;
    }),

  uploadEvidence: protectedProcedure
    .input(
      z.object({
        submissionId: z.string().cuid(),
        fileUrl: z.string().url(),
        fileType: z.string(),
        fileName: z.string(),
        fileSize: z.number().int().positive().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const submission = await ctx.db.activitySubmission.findUnique({
        where: { id: input.submissionId },
        include: { ambassador: { select: { userId: true } } },
      });
      if (!submission) throw new TRPCError({ code: "NOT_FOUND" });
      if (submission.ambassador.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return ctx.db.activityEvidence.create({
        data: {
          submissionId: input.submissionId,
          fileUrl: input.fileUrl,
          fileType: input.fileType,
          fileName: input.fileName,
          fileSize: input.fileSize,
        },
      });
    }),

  review: leadProcedure
    .input(reviewActivitySchema)
    .mutation(async ({ ctx, input }) => {
      const { id, status, reviewFeedback, pointsAwarded } = input;

      const submission = await ctx.db.activitySubmission.findUnique({
        where: { id },
        include: {
          activityType: true,
          ambassador: {
            include: { user: { select: { id: true, email: true, firstName: true } } },
          },
        },
      });

      if (!submission) throw new TRPCError({ code: "NOT_FOUND" });

      if (![SubmissionStatus.PENDING, SubmissionStatus.UNDER_REVIEW].includes(submission.status as "PENDING" | "UNDER_REVIEW")) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only pending or under-review submissions can be reviewed.",
        });
      }

      const finalPoints =
        status === SubmissionStatus.APPROVED
          ? (pointsAwarded ?? submission.activityType.basePoints)
          : 0;

      await ctx.db.activitySubmission.update({
        where: { id },
        data: {
          status,
          reviewedAt: new Date(),
          reviewedById: ctx.session.user.id,
          reviewFeedback,
          pointsAwarded: status === SubmissionStatus.APPROVED ? finalPoints : undefined,
          requiresCorrection: status === SubmissionStatus.REQUIRES_CORRECTION,
        },
      });

      // Award points on approval
      if (status === SubmissionStatus.APPROVED) {
        await awardPoints(ctx.db, {
          ambassadorId: submission.ambassadorId,
          submissionId: id,
          activityTypeId: submission.activityTypeId,
          basePoints: finalPoints,
          createdBy: ctx.session.user.id,
        });

        const emailContent = activityApprovedEmail(
          submission.ambassador.user.firstName,
          submission.title,
          finalPoints
        );
        await sendEmail({ to: submission.ambassador.user.email, ...emailContent });
        await createNotification(ctx.db, {
          userId: submission.ambassador.user.id,
          type: "SUBMISSION_APPROVED",
          title: "Activity approved",
          body: `Your activity "${submission.title}" was approved. +${finalPoints} points.`,
        });
      }

      // Revoke points if previously approved and now being rejected
      if (status === SubmissionStatus.REJECTED && submission.status === SubmissionStatus.APPROVED) {
        const prevTx = await ctx.db.pointsTransaction.findUnique({
          where: { submissionId: id },
        });
        if (prevTx && prevTx.points > 0) {
          await revokePoints(ctx.db, {
            ambassadorId: submission.ambassadorId,
            submissionId: id,
            pointsToRevoke: prevTx.points,
            reason: `Activity rejected: ${reviewFeedback ?? "No reason given"}`,
            createdBy: ctx.session.user.id,
          });
        }
      }

      if (status === SubmissionStatus.REJECTED || status === SubmissionStatus.REQUIRES_CORRECTION) {
        const emailContent = activityRejectedEmail(
          submission.ambassador.user.firstName,
          submission.title,
          reviewFeedback ?? "Please review the submission guidelines."
        );
        await sendEmail({ to: submission.ambassador.user.email, ...emailContent });
        await createNotification(ctx.db, {
          userId: submission.ambassador.user.id,
          type: status === SubmissionStatus.REJECTED ? "SUBMISSION_REJECTED" : "SUBMISSION_CORRECTION_REQUIRED",
          title: `Activity ${status === SubmissionStatus.REJECTED ? "rejected" : "needs correction"}`,
          body: reviewFeedback ?? "Please review the feedback.",
        });
      }

      await createAuditLog(ctx.db, {
        userId: ctx.session.user.id,
        action: `REVIEW_${status}`,
        resource: "ActivitySubmission",
        resourceId: id,
        newValues: { status, reviewFeedback, pointsAwarded: finalPoints },
      });

      return { success: true, pointsAwarded: finalPoints };
    }),

  byId: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const submission = await ctx.db.activitySubmission.findUnique({
        where: { id: input.id },
        include: {
          activityType: true,
          ambassador: {
            include: {
              user: { select: { firstName: true, lastName: true, email: true } },
              institution: true,
            },
          },
          chapter: { include: { institution: true } },
          evidence: true,
          reviewedBy: { select: { firstName: true, lastName: true } },
          pointsTransaction: { select: { points: true, createdAt: true } },
        },
      });

      if (!submission) throw new TRPCError({ code: "NOT_FOUND" });
      return submission;
    }),

  referrals: protectedProcedure
    .input(
      z.object({
        page: z.number().int().positive().default(1),
        limit: z.number().int().min(1).max(50).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const profile = await ctx.db.ambassadorProfile.findUnique({
        where: { userId: ctx.session.user.id },
      });
      if (!profile) return { referrals: [], total: 0 };

      const skip = (input.page - 1) * input.limit;
      const [referrals, total] = await ctx.db.$transaction([
        ctx.db.referral.findMany({
          where: { referrerId: profile.id },
          skip,
          take: input.limit,
          orderBy: { createdAt: "desc" },
        }),
        ctx.db.referral.count({ where: { referrerId: profile.id } }),
      ]);

      return { referrals, total };
    }),

  submitReferral: protectedProcedure
    .input(
      z.object({
        studentName: z.string().min(2),
        studentEmail: z.string().email(),
        studentPhone: z.string().optional(),
        institution: z.string().min(2),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const profile = await ctx.db.ambassadorProfile.findUnique({
        where: { userId: ctx.session.user.id },
      });
      if (!profile) throw new TRPCError({ code: "NOT_FOUND" });

      // Duplicate referral check
      const dup = await ctx.db.referral.findFirst({
        where: {
          referrerId: profile.id,
          studentEmail: input.studentEmail,
          verificationStatus: { not: "REJECTED" },
        },
      });
      if (dup) {
        throw new TRPCError({ code: "CONFLICT", message: "You have already referred this student." });
      }

      return ctx.db.referral.create({
        data: { referrerId: profile.id, ...input },
      });
    }),
});
