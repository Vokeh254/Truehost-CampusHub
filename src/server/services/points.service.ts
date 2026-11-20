import { PrismaClient, PointsTransactionType } from "@prisma/client";
import { evaluateMilestones } from "./milestone.service";

export async function awardPoints(
  db: PrismaClient,
  params: {
    ambassadorId: string;
    submissionId: string;
    activityTypeId: string;
    basePoints: number;
    createdBy: string;
  }
): Promise<number> {
  const { ambassadorId, submissionId, activityTypeId, basePoints, createdBy } = params;

  // Check monthly cap for this activity type
  const activityType = await db.activityType.findUnique({
    where: { id: activityTypeId },
  });

  let pointsToAward = basePoints;

  if (activityType?.maxPointsPerMonth) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const monthlyTotal = await db.pointsTransaction.aggregate({
      where: {
        ambassadorId,
        createdAt: { gte: monthStart, lte: monthEnd },
        transactionType: PointsTransactionType.ACTIVITY_APPROVED,
        submission: { activityTypeId },
      },
      _sum: { points: true },
    });

    const alreadyEarned = monthlyTotal._sum.points ?? 0;
    const remaining = activityType.maxPointsPerMonth - alreadyEarned;
    pointsToAward = Math.min(pointsToAward, Math.max(0, remaining));
  }

  if (pointsToAward <= 0) return 0;

  // Create transaction and update profile total atomically
  await db.$transaction([
    db.pointsTransaction.create({
      data: {
        ambassadorId,
        submissionId,
        points: pointsToAward,
        reason: `Activity approved`,
        transactionType: PointsTransactionType.ACTIVITY_APPROVED,
        createdBy,
      },
    }),
    db.ambassadorProfile.update({
      where: { id: ambassadorId },
      data: { totalPoints: { increment: pointsToAward } },
    }),
  ]);

  // Trigger milestone evaluation asynchronously
  void evaluateMilestones(db, ambassadorId, createdBy);

  return pointsToAward;
}

export async function revokePoints(
  db: PrismaClient,
  params: {
    ambassadorId: string;
    submissionId: string;
    pointsToRevoke: number;
    reason: string;
    createdBy: string;
  }
): Promise<void> {
  const { ambassadorId, submissionId, pointsToRevoke, reason, createdBy } = params;

  await db.$transaction([
    db.pointsTransaction.create({
      data: {
        ambassadorId,
        submissionId,
        points: -pointsToRevoke,
        reason,
        transactionType: PointsTransactionType.POINTS_REVOKED,
        createdBy,
      },
    }),
    db.ambassadorProfile.update({
      where: { id: ambassadorId },
      data: { totalPoints: { decrement: pointsToRevoke } },
    }),
  ]);
}

export async function getPointsHistory(
  db: PrismaClient,
  ambassadorId: string,
  page = 1,
  limit = 20
) {
  const skip = (page - 1) * limit;
  const [transactions, total] = await db.$transaction([
    db.pointsTransaction.findMany({
      where: { ambassadorId },
      skip,
      take: limit,
      include: {
        submission: {
          select: { title: true, activityType: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.pointsTransaction.count({ where: { ambassadorId } }),
  ]);

  return { transactions, total, page, limit };
}
