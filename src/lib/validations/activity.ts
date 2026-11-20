import { z } from "zod";
import { SubmissionStatus } from "@prisma/client";

export const submitActivitySchema = z.object({
  activityTypeId: z.string().cuid(),
  chapterId: z.string().cuid(),
  title: z.string().min(5, "Title must be at least 5 characters").max(200),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(5000),
  activityDate: z.coerce.date(),
  participantCount: z.number().int().positive().optional(),
  relevantUrls: z.array(z.string().url()).default([]),
  expectedOutcome: z.string().max(1000).optional(),
  actualOutcome: z.string().max(1000).optional(),
});

export const reviewActivitySchema = z.object({
  id: z.string().cuid(),
  status: z.enum([
    SubmissionStatus.APPROVED,
    SubmissionStatus.REJECTED,
    SubmissionStatus.REQUIRES_CORRECTION,
    SubmissionStatus.UNDER_REVIEW,
  ]),
  reviewFeedback: z.string().max(2000).optional(),
  pointsAwarded: z.number().int().min(0).optional(),
});

export const activityFilterSchema = z.object({
  status: z.nativeEnum(SubmissionStatus).optional(),
  chapterId: z.string().cuid().optional(),
  ambassadorId: z.string().cuid().optional(),
  activityTypeId: z.string().cuid().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export type SubmitActivityInput = z.infer<typeof submitActivitySchema>;
export type ReviewActivityInput = z.infer<typeof reviewActivitySchema>;
