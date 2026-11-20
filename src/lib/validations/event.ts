import { z } from "zod";
import {
  EventCategory,
  EventStatus,
  ParticipationRole,
  InteractionType,
} from "@prisma/client";

export const createEventSchema = z.object({
  name: z.string().min(3).max(300),
  organiser: z.string().min(2).max(200),
  description: z.string().min(10).max(5000),
  category: z.nativeEnum(EventCategory),
  location: z.string().min(2).max(300),
  isOnline: z.boolean().default(false),
  eventDate: z.coerce.date(),
  registrationDeadline: z.coerce.date().optional(),
  website: z.string().url().optional().or(z.literal("")),
  applicationUrl: z.string().url().optional().or(z.literal("")),
  contactPerson: z.string().max(200).optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
  contactPhone: z.string().max(20).optional(),
  targetAudience: z.string().max(500).optional(),
  estimatedParticipants: z.number().int().positive().optional(),
  chapterId: z.string().cuid().optional(),
  partnershipOpportunity: z.boolean().default(false),
  speakerOpportunity: z.boolean().default(false),
  sponsorshipOpportunity: z.boolean().default(false),
  exhibitionOpportunity: z.boolean().default(false),
});

export const updateEventStatusSchema = z.object({
  id: z.string().cuid(),
  status: z.nativeEnum(EventStatus),
});

export const addInteractionSchema = z.object({
  eventId: z.string().cuid().optional(),
  mediaOpportunityId: z.string().cuid().optional(),
  interactionType: z.nativeEnum(InteractionType),
  channel: z.string().max(50),
  summary: z.string().min(5).max(2000),
  interactedAt: z.coerce.date(),
  followUpDate: z.coerce.date().optional(),
});

export const registerForEventSchema = z.object({
  eventId: z.string().cuid(),
  role: z.nativeEnum(ParticipationRole),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
