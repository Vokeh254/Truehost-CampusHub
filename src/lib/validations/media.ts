import { z } from "zod";
import { MediaType, MediaOutreachStatus } from "@prisma/client";

export const createMediaOrgSchema = z.object({
  name: z.string().min(2).max(200),
  type: z.nativeEnum(MediaType),
  country: z.string().default("Kenya"),
  website: z.string().url().optional().or(z.literal("")),
  linkedinUrl: z.string().url().optional().or(z.literal("")),
  twitterUrl: z.string().url().optional().or(z.literal("")),
  instagramUrl: z.string().url().optional().or(z.literal("")),
  audience: z.string().max(500).optional(),
  estimatedReach: z.number().int().positive().optional(),
});

export const createMediaContactSchema = z.object({
  organisationId: z.string().cuid(),
  name: z.string().min(2).max(200),
  role: z.string().max(100).optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(20).optional(),
  linkedinUrl: z.string().url().optional().or(z.literal("")),
  twitterUrl: z.string().url().optional().or(z.literal("")),
  notes: z.string().max(1000).optional(),
});

export const createMediaOpportunitySchema = z.object({
  organisationId: z.string().cuid(),
  contactId: z.string().cuid().optional(),
  programmeName: z.string().max(200).optional(),
  topicProposed: z.string().min(5).max(500),
  spokespersonUserId: z.string().cuid().optional(),
  outreachChannel: z.string().max(50).optional(),
  pitchSentAt: z.coerce.date().optional(),
  followUpDate: z.coerce.date().optional(),
  interviewDate: z.coerce.date().optional(),
  estimatedReach: z.number().int().positive().optional(),
  notes: z.string().max(2000).optional(),
});

export const updateOpportunityStatusSchema = z.object({
  id: z.string().cuid(),
  status: z.nativeEnum(MediaOutreachStatus),
  publicationUrl: z.string().url().optional().or(z.literal("")),
  recordingUrl: z.string().url().optional().or(z.literal("")),
  evidenceUrl: z.string().url().optional().or(z.literal("")),
  estimatedReach: z.number().int().positive().optional(),
  engagementStats: z.string().max(500).optional(),
});

export type CreateMediaOpportunityInput = z.infer<
  typeof createMediaOpportunitySchema
>;
