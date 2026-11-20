import { z } from "zod";
import { ChapterStatus, LeadRole } from "@prisma/client";

export const createChapterSchema = z.object({
  institutionId: z.string().cuid(),
  whatsappGroupLink: z.string().url().optional().or(z.literal("")),
  whatsappGroupName: z.string().max(100).optional(),
  status: z.nativeEnum(ChapterStatus).default("ACTIVE"),
  foundedAt: z.coerce.date().optional(),
  targetAmbassadors: z.number().int().positive().optional(),
  targetReferrals: z.number().int().positive().optional(),
  targetWorkshops: z.number().int().positive().optional(),
  targetProjects: z.number().int().positive().optional(),
});

export const updateChapterSchema = createChapterSchema.partial().extend({
  id: z.string().cuid(),
});

export const assignLeadSchema = z.object({
  chapterId: z.string().cuid(),
  userId: z.string().cuid(),
  role: z.nativeEnum(LeadRole),
  notes: z.string().max(500).optional(),
});

export const transferAmbassadorSchema = z.object({
  ambassadorId: z.string().cuid(),
  fromChapterId: z.string().cuid(),
  toChapterId: z.string().cuid(),
  notes: z.string().max(500).optional(),
});

export type CreateChapterInput = z.infer<typeof createChapterSchema>;
export type AssignLeadInput = z.infer<typeof assignLeadSchema>;
