import { createTRPCRouter } from "@/server/trpc";
import { authRouter } from "@/server/routers/auth";
import { chaptersRouter } from "@/server/routers/chapters";
import { ambassadorsRouter } from "@/server/routers/ambassadors";
import { activitiesRouter } from "@/server/routers/activities";
import { eventsRouter } from "@/server/routers/events";
import { mediaRouter } from "@/server/routers/media";
import { communityRouter } from "@/server/routers/community";
import { certificatesRouter } from "@/server/routers/certificates";
import { leaderboardsRouter } from "@/server/routers/leaderboards";
import { notificationsRouter } from "@/server/routers/notifications";
import { reportsRouter } from "@/server/routers/reports";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  chapters: chaptersRouter,
  ambassadors: ambassadorsRouter,
  activities: activitiesRouter,
  events: eventsRouter,
  media: mediaRouter,
  community: communityRouter,
  certificates: certificatesRouter,
  leaderboards: leaderboardsRouter,
  notifications: notificationsRouter,
  reports: reportsRouter,
});

export type AppRouter = typeof appRouter;
