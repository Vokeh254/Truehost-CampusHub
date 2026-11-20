import { z } from "zod";
import { hash } from "bcryptjs";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "@/server/trpc";
import { registerSchema, forgotPasswordSchema, resetPasswordSchema } from "@/lib/validations/auth";
import { UserSystemRole } from "@prisma/client";
import { randomBytes } from "crypto";
import { sendEmail } from "@/server/services/email.service";

export const authRouter = createTRPCRouter({
  register: publicProcedure
    .input(registerSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.user.findUnique({
        where: { email: input.email },
      });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "An account with this email already exists.",
        });
      }

      const institution = await ctx.db.institution.findUnique({
        where: { id: input.institutionId },
      });
      if (!institution) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Institution not found.",
        });
      }

      const passwordHash = await hash(input.password, 12);

      const user = await ctx.db.user.create({
        data: {
          email: input.email,
          passwordHash,
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone,
          systemRole: UserSystemRole.AMBASSADOR,
          ambassadorProfile: {
            create: {
              institutionId: input.institutionId,
              studentId: input.studentId,
              course: input.course,
              yearOfStudy: input.yearOfStudy,
            },
          },
        },
        include: { ambassadorProfile: true },
      });

      return {
        success: true,
        message: "Registration successful. Please log in.",
        userId: user.id,
      };
    }),

  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      include: {
        ambassadorProfile: {
          include: {
            institution: true,
            memberships: {
              where: { leftAt: null },
              include: { chapter: { include: { institution: true } } },
              take: 1,
            },
          },
        },
        campusLeadAssignments: {
          where: { revokedAt: null },
          include: { chapter: { include: { institution: true } } },
        },
      },
    });

    if (!user) throw new TRPCError({ code: "NOT_FOUND" });

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      profilePhoto: user.profilePhoto,
      systemRole: user.systemRole,
      ambassadorProfile: user.ambassadorProfile,
      leadAssignments: user.campusLeadAssignments,
    };
  }),

  forgotPassword: publicProcedure
    .input(forgotPasswordSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { email: input.email },
      });
      // Always return success to prevent email enumeration
      if (!user) return { success: true };

      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

      await ctx.db.passwordResetToken.create({
        data: { userId: user.id, token, expiresAt },
      });

      const resetUrl = `${process.env.APP_URL}/reset-password?token=${token}`;
      await sendEmail({
        to: user.email,
        subject: "Reset your Truehost Campus Builders password",
        html: `<p>Hi ${user.firstName},</p>
          <p>Click the link below to reset your password. This link expires in 1 hour.</p>
          <p><a href="${resetUrl}">${resetUrl}</a></p>
          <p>If you did not request this, ignore this email.</p>`,
      });

      return { success: true };
    }),

  resetPassword: publicProcedure
    .input(resetPasswordSchema)
    .mutation(async ({ ctx, input }) => {
      const record = await ctx.db.passwordResetToken.findUnique({
        where: { token: input.token },
      });

      if (!record || record.usedAt || record.expiresAt < new Date()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid or expired reset token.",
        });
      }

      const passwordHash = await hash(input.password, 12);

      await ctx.db.$transaction([
        ctx.db.user.update({
          where: { id: record.userId },
          data: { passwordHash },
        }),
        ctx.db.passwordResetToken.update({
          where: { id: record.id },
          data: { usedAt: new Date() },
        }),
      ]);

      return { success: true };
    }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        firstName: z.string().min(2).optional(),
        lastName: z.string().min(2).optional(),
        phone: z.string().optional(),
        bio: z.string().max(500).optional(),
        linkedinUrl: z.string().url().optional().or(z.literal("")),
        githubUrl: z.string().url().optional().or(z.literal("")),
        twitterUrl: z.string().url().optional().or(z.literal("")),
        course: z.string().optional(),
        yearOfStudy: z.number().int().min(1).max(7).optional(),
        skills: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { firstName, lastName, phone, bio, linkedinUrl, githubUrl, twitterUrl, course, yearOfStudy, skills } = input;

      await ctx.db.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: ctx.session.user.id },
          data: { firstName, lastName, phone },
        });
        await tx.ambassadorProfile.updateMany({
          where: { userId: ctx.session.user.id },
          data: { bio, linkedinUrl, githubUrl, twitterUrl, course, yearOfStudy, skills },
        });
      });

      return { success: true };
    }),
});
