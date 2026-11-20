import { PrismaClient, NotificationType } from "@prisma/client";

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, string>;
}

export async function createNotification(
  db: PrismaClient,
  params: CreateNotificationParams
): Promise<void> {
  try {
    await db.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        body: params.body,
        data: params.data,
      },
    });
  } catch (err) {
    console.error("Notification creation error:", err);
  }
}

export async function notifyAdmins(
  db: PrismaClient,
  params: Omit<CreateNotificationParams, "userId">
): Promise<void> {
  const admins = await db.user.findMany({
    where: { systemRole: "SUPER_ADMIN", isActive: true },
    select: { id: true },
  });

  await Promise.all(
    admins.map((admin) =>
      createNotification(db, { ...params, userId: admin.id })
    )
  );
}

export async function notifyChapterLeads(
  db: PrismaClient,
  chapterId: string,
  params: Omit<CreateNotificationParams, "userId">
): Promise<void> {
  const leads = await db.campusLeadAssignment.findMany({
    where: { chapterId, revokedAt: null },
    select: { userId: true },
  });

  await Promise.all(
    leads.map((lead) =>
      createNotification(db, { ...params, userId: lead.userId })
    )
  );
}
