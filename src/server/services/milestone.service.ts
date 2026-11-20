import { PrismaClient, AmbassadorTier } from "@prisma/client";
import { generateCertificate } from "./certificate.service";
import { createNotification } from "./notification.service";
import { sendEmail, milestoneEmail } from "./email.service";

const TIER_ORDER: AmbassadorTier[] = [
  AmbassadorTier.CAMPUS_AMBASSADOR,
  AmbassadorTier.CHAPTER_LEAD_ACHIEVEMENT,
  AmbassadorTier.NATIONAL_CLOUD_FELLOW,
];

export async function evaluateMilestones(
  db: PrismaClient,
  ambassadorId: string,
  triggeredBy: string
): Promise<void> {
  const profile = await db.ambassadorProfile.findUnique({
    where: { id: ambassadorId },
    include: {
      tierAchievements: { select: { milestoneId: true } },
      user: { select: { id: true, email: true, firstName: true } },
    },
  });

  if (!profile) return;

  const achievedMilestoneIds = new Set(
    profile.tierAchievements.map((a) => a.milestoneId)
  );

  const milestones = await db.milestone.findMany({
    where: { isActive: true },
    include: { template: true },
    orderBy: { pointsRequired: "asc" },
  });

  for (const milestone of milestones) {
    if (achievedMilestoneIds.has(milestone.id)) continue;

    const met = await checkMilestoneCriteria(db, profile, milestone);
    if (!met) continue;

    // Create achievement
    const achievement = await db.tierAchievement.create({
      data: {
        ambassadorId,
        milestoneId: milestone.id,
        verifiedBy: triggeredBy,
      },
    });

    // Update ambassador tier if this is a higher tier
    const currentTierIndex = TIER_ORDER.indexOf(profile.currentTier);
    const newTierIndex = TIER_ORDER.indexOf(milestone.tier);
    if (newTierIndex > currentTierIndex) {
      await db.ambassadorProfile.update({
        where: { id: ambassadorId },
        data: { currentTier: milestone.tier },
      });
    }

    // Award bonus points
    if (milestone.bonusPoints > 0) {
      await db.$transaction([
        db.pointsTransaction.create({
          data: {
            ambassadorId,
            points: milestone.bonusPoints,
            reason: `Milestone bonus: ${milestone.name}`,
            transactionType: "MILESTONE_BONUS",
            createdBy: triggeredBy,
          },
        }),
        db.ambassadorProfile.update({
          where: { id: ambassadorId },
          data: { totalPoints: { increment: milestone.bonusPoints } },
        }),
      ]);
    }

    // Generate certificate if template exists
    if (milestone.template) {
      await generateCertificate(db, {
        ambassadorId,
        achievementId: achievement.id,
        templateId: milestone.templateId!,
        issuedBy: triggeredBy,
      });
    }

    // Send notification
    await createNotification(db, {
      userId: profile.user.id,
      type: "MILESTONE_ACHIEVED",
      title: `Milestone achieved: ${milestone.name}`,
      body: `Congratulations! You've reached ${milestone.tier.replace(/_/g, " ")}.`,
    });

    // Send email
    const certUrl = `${process.env.APP_URL}/ambassador/certificates`;
    const emailContent = milestoneEmail(
      profile.user.firstName,
      milestone.tier.replace(/_/g, " "),
      certUrl
    );
    await sendEmail({ to: profile.user.email, ...emailContent });
  }
}

async function checkMilestoneCriteria(
  db: PrismaClient,
  profile: any,
  milestone: any
): Promise<boolean> {
  if (profile.totalPoints < milestone.pointsRequired) return false;
  if (milestone.onboardingRequired && !profile.onboardingCompleted) return false;

  if (milestone.workshopsRequired > 0) {
    const count = await db.workshop.count({
      where: {
        facilitatorUserId: profile.userId,
        status: "COMPLETED",
      },
    });
    if (count < milestone.workshopsRequired) return false;
  }

  if (milestone.referralsRequired > 0) {
    const count = await db.referral.count({
      where: { referrerId: profile.id, verificationStatus: "VERIFIED" },
    });
    if (count < milestone.referralsRequired) return false;
  }

  if (milestone.projectsRequired > 0) {
    const count = await db.studentProject.count({
      where: { ambassadorId: profile.id, status: "VERIFIED" },
    });
    if (count < milestone.projectsRequired) return false;
  }

  return true;
}
