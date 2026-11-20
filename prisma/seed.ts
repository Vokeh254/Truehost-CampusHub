import "dotenv/config";
import { PrismaClient, UserSystemRole, AmbassadorTier, ChapterStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { hash } from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter } as any);

const KENYAN_INSTITUTIONS = [
  { name: "University of Nairobi", shortName: "UoN", type: "UNIVERSITY" as const, county: "Nairobi", town: "Nairobi" },
  { name: "Kenyatta University", shortName: "KU", type: "UNIVERSITY" as const, county: "Kiambu", town: "Thika Road, Nairobi" },
  { name: "JKUAT", shortName: "JKUAT", type: "UNIVERSITY" as const, county: "Kiambu", town: "Juja" },
  { name: "Strathmore University", shortName: "Strathmore", type: "UNIVERSITY" as const, county: "Nairobi", town: "Nairobi" },
  { name: "Moi University", shortName: "MU", type: "UNIVERSITY" as const, county: "Uasin Gishu", town: "Eldoret" },
  { name: "Maseno University", shortName: "Maseno", type: "UNIVERSITY" as const, county: "Kisumu", town: "Maseno" },
  { name: "Egerton University", shortName: "Egerton", type: "UNIVERSITY" as const, county: "Nakuru", town: "Njoro" },
  { name: "Multimedia University of Kenya", shortName: "MMU", type: "UNIVERSITY" as const, county: "Nairobi", town: "Karen" },
  { name: "Technical University of Kenya", shortName: "TUK", type: "UNIVERSITY" as const, county: "Nairobi", town: "Nairobi" },
  { name: "Dedan Kimathi University of Technology", shortName: "DeKUT", type: "UNIVERSITY" as const, county: "Nyeri", town: "Nyeri" },
  { name: "Pwani University", shortName: "PU", type: "UNIVERSITY" as const, county: "Kilifi", town: "Kilifi" },
  { name: "Masinde Muliro University of Science", shortName: "MMUST", type: "UNIVERSITY" as const, county: "Kakamega", town: "Kakamega" },
  { name: "Nairobi Institute of Technology", shortName: "NIT", type: "TVET" as const, county: "Nairobi", town: "Nairobi" },
  { name: "Kenya Technical Trainers College", shortName: "KTTC", type: "TVET" as const, county: "Nairobi", town: "Gigiri" },
  { name: "Kisumu National Polytechnic", shortName: "KNP", type: "TVET" as const, county: "Kisumu", town: "Kisumu" },
  { name: "Eldoret National Polytechnic", shortName: "ENP", type: "TVET" as const, county: "Uasin Gishu", town: "Eldoret" },
];

const ACTIVITY_TYPES = [
  { name: "Student Referral", category: "Recruitment", basePoints: 10, requiresParticipantCount: false },
  { name: "Campus Recruitment Campaign", category: "Recruitment", basePoints: 20, maxPointsPerMonth: 60 },
  { name: "Workshop / Demo Session", category: "Education", basePoints: 30, requiresParticipantCount: true },
  { name: "Technology Meetup", category: "Community", basePoints: 25, requiresParticipantCount: true },
  { name: "Hackathon", category: "Competition", basePoints: 40, requiresParticipantCount: true },
  { name: "Student Project Deployment", category: "Technical", basePoints: 50 },
  { name: "Weekly Challenge", category: "Engagement", basePoints: 5, maxPointsPerMonth: 20 },
  { name: "Affiliate Referral", category: "Marketing", basePoints: 15, maxPointsPerMonth: 75 },
  { name: "Technical Mentorship Session", category: "Mentorship", basePoints: 20, requiresParticipantCount: true },
  { name: "Community Engagement Post", category: "Community", basePoints: 5, maxPointsPerMonth: 25 },
  { name: "Event Participation", category: "Networking", basePoints: 15 },
  { name: "Industry Networking", category: "Networking", basePoints: 20 },
  { name: "Media Appearance / Interview", category: "Media", basePoints: 50 },
  { name: "Podcast Interview", category: "Media", basePoints: 40 },
  { name: "Panel Discussion", category: "Media", basePoints: 35 },
  { name: "Published Article / Blog Post", category: "Content", basePoints: 25 },
  { name: "Volunteer Activity", category: "Community", basePoints: 10 },
];

const SYSTEM_SETTINGS = [
  {
    key: "campus_lead_scoring_weights",
    label: "Campus Lead Scoring Weights",
    group: "scoring",
    value: { activeAmbassadors: 15, newRecruits: 15, communityGrowth: 10, workshopsOrganised: 15, verifiedActivities: 15, studentProjects: 10, reportingConsistency: 10, mediaEngagements: 5, communityEngagement: 5 },
  },
  { key: "campus_lead_review_workflow_enabled", label: "Enable Campus Lead review workflow", group: "general", value: false },
  { key: "public_leaderboard_enabled", label: "Show national leaderboard publicly", group: "general", value: true },
  { key: "community_reporting_frequency", label: "Community metrics reporting frequency", group: "general", value: "monthly" },
];

async function main() {
  console.log("🌱 Seeding Truehost Campus Builders database...");

  // ── Institutions ───────────────────────────────────────────────────────────
  await db.institution.createMany({ data: KENYAN_INSTITUTIONS, skipDuplicates: true });
  const institutions = await db.institution.findMany({ orderBy: { name: "asc" } });
  console.log(`✓ ${institutions.length} institutions`);

  // ── Activity types ─────────────────────────────────────────────────────────
  await db.activityType.createMany({ data: ACTIVITY_TYPES, skipDuplicates: true });
  console.log(`✓ ${ACTIVITY_TYPES.length} activity types`);

  // ── Milestones ─────────────────────────────────────────────────────────────
  // Delete and recreate so we don't duplicate if seed is run again
  const existing = await db.milestone.count();
  if (existing === 0) {
    await db.milestone.createMany({
      data: [
        {
          name: "Campus Ambassador",
          tier: AmbassadorTier.CAMPUS_AMBASSADOR,
          description: "Complete onboarding and refer 10 verified students",
          pointsRequired: 0,
          referralsRequired: 10,
          onboardingRequired: true,
        },
        {
          name: "Chapter Lead Achievement",
          tier: AmbassadorTier.CHAPTER_LEAD_ACHIEVEMENT,
          description: "Earn 100 verified points and host at least one campus workshop",
          pointsRequired: 100,
          workshopsRequired: 1,
        },
        {
          name: "National Cloud Fellow",
          tier: AmbassadorTier.NATIONAL_CLOUD_FELLOW,
          description: "Earn 300 points, host 3 sessions, and mentor 5 deployed student projects",
          pointsRequired: 300,
          workshopsRequired: 3,
          projectsRequired: 5,
        },
      ],
    });
  }
  console.log("✓ Milestones seeded");

  // ── System settings ────────────────────────────────────────────────────────
  for (const s of SYSTEM_SETTINGS) {
    await db.systemSetting.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    });
  }
  console.log("✓ System settings seeded");

  // ── Super Admin ────────────────────────────────────────────────────────────
  const adminHash = await hash("Admin@TruehostCB2024!", 12);
  await db.user.upsert({
    where: { email: "admin@truehost.cloud" },
    update: {},
    create: {
      email: "admin@truehost.cloud",
      passwordHash: adminHash,
      firstName: "Truehost",
      lastName: "Admin",
      systemRole: UserSystemRole.SUPER_ADMIN,
    },
  });
  console.log("✓ Super Admin: admin@truehost.cloud / Admin@TruehostCB2024!");

  // ── Demo Campus Lead at JKUAT ──────────────────────────────────────────────
  const jkuat = institutions.find((i) => i.shortName === "JKUAT")!;

  const jkuatChapter = await db.chapter.upsert({
    where: { id: "cldemojkuatchap001" },
    update: {},
    create: {
      id: "cldemojkuatchap001",
      institutionId: jkuat.id,
      status: ChapterStatus.ACTIVE,
      whatsappGroupName: "JKUAT Campus Builders",
      targetAmbassadors: 20,
      targetReferrals: 100,
      targetWorkshops: 4,
      targetProjects: 5,
    },
  });

  const leadHash = await hash("Lead@JKUAT2024!", 12);
  const leadUser = await db.user.upsert({
    where: { email: "lead.jkuat@truehost.cloud" },
    update: {},
    create: {
      email: "lead.jkuat@truehost.cloud",
      passwordHash: leadHash,
      firstName: "Kevin",
      lastName: "Omondi",
      systemRole: UserSystemRole.CAMPUS_LEAD,
    },
  });

  // Create ambassador profile for lead
  const leadProfile = await db.ambassadorProfile.upsert({
    where: { userId: leadUser.id },
    update: {},
    create: {
      userId: leadUser.id,
      institutionId: jkuat.id,
      course: "B.Sc. Computer Science",
      yearOfStudy: 3,
      onboardingCompleted: true,
      onboardingCompletedAt: new Date(),
      currentTier: AmbassadorTier.CHAPTER_LEAD_ACHIEVEMENT,
      totalPoints: 185,
    },
  });

  // Add to chapter membership
  await db.chapterMembership.upsert({
    where: { id: "cldemojkuatmlead01" },
    update: {},
    create: {
      id: "cldemojkuatmlead01",
      chapterId: jkuatChapter.id,
      ambassadorId: leadProfile.id,
    },
  });

  // Assign as Campus Lead
  const existingAssignment = await db.campusLeadAssignment.findFirst({
    where: { userId: leadUser.id, chapterId: jkuatChapter.id, revokedAt: null },
  });
  if (!existingAssignment) {
    await db.campusLeadAssignment.create({
      data: {
        chapterId: jkuatChapter.id,
        userId: leadUser.id,
        role: "LEAD",
        assignedBy: leadUser.id,
      },
    });
  }
  console.log("✓ Campus Lead (JKUAT): lead.jkuat@truehost.cloud / Lead@JKUAT2024!");

  // ── Demo Ambassador at UoN ─────────────────────────────────────────────────
  const uon = institutions.find((i) => i.shortName === "UoN")!;

  const uonChapter = await db.chapter.upsert({
    where: { id: "cldemouonchap0001" },
    update: {},
    create: {
      id: "cldemouonchap0001",
      institutionId: uon.id,
      status: ChapterStatus.ACTIVE,
      whatsappGroupName: "UoN Campus Builders",
      targetAmbassadors: 15,
      targetReferrals: 75,
      targetWorkshops: 3,
    },
  });

  const ambHash = await hash("Amb@UoN2024!", 12);
  const ambUser = await db.user.upsert({
    where: { email: "amb.uon@truehost.cloud" },
    update: {},
    create: {
      email: "amb.uon@truehost.cloud",
      passwordHash: ambHash,
      firstName: "Amani",
      lastName: "Kamau",
      systemRole: UserSystemRole.AMBASSADOR,
    },
  });

  const ambProfile = await db.ambassadorProfile.upsert({
    where: { userId: ambUser.id },
    update: {},
    create: {
      userId: ambUser.id,
      institutionId: uon.id,
      course: "B.Sc. Information Technology",
      yearOfStudy: 3,
      onboardingCompleted: true,
      onboardingCompletedAt: new Date(),
      currentTier: AmbassadorTier.CAMPUS_AMBASSADOR,
      totalPoints: 45,
      bio: "Passionate about cloud computing and software development.",
    },
  });

  await db.chapterMembership.upsert({
    where: { id: "cldemouonmember01" },
    update: {},
    create: {
      id: "cldemouonmember01",
      chapterId: uonChapter.id,
      ambassadorId: ambProfile.id,
    },
  });
  console.log("✓ Ambassador (UoN): amb.uon@truehost.cloud / Amb@UoN2024!");

  // ── Additional demo ambassadors ────────────────────────────────────────────
  const demoAmbassadors = [
    { first: "Wanjiru", last: "Mwangi", email: "wanjiru@demo.truehost.cloud", instShort: "KU", points: 120, tier: AmbassadorTier.CHAPTER_LEAD_ACHIEVEMENT },
    { first: "Brian", last: "Otieno", email: "brian@demo.truehost.cloud", instShort: "JKUAT", points: 85, tier: AmbassadorTier.CAMPUS_AMBASSADOR },
    { first: "Fatuma", last: "Hassan", email: "fatuma@demo.truehost.cloud", instShort: "Maseno", points: 60, tier: AmbassadorTier.CAMPUS_AMBASSADOR },
    { first: "Kipchoge", last: "Rotich", email: "kipchoge@demo.truehost.cloud", instShort: "MU", points: 310, tier: AmbassadorTier.NATIONAL_CLOUD_FELLOW },
    { first: "Grace", last: "Njeri", email: "grace@demo.truehost.cloud", instShort: "Strathmore", points: 95, tier: AmbassadorTier.CAMPUS_AMBASSADOR },
  ];

  const kuInst = institutions.find((i) => i.shortName === "KU")!;
  const masenoBInst = institutions.find((i) => i.shortName === "Maseno")!;
  const muInst = institutions.find((i) => i.shortName === "MU")!;
  const strathmoreInst = institutions.find((i) => i.shortName === "Strathmore")!;

  const instMap: Record<string, string> = {
    KU: kuInst?.id,
    JKUAT: jkuat?.id,
    Maseno: masenoBInst?.id,
    MU: muInst?.id,
    Strathmore: strathmoreInst?.id,
  };

  for (const amb of demoAmbassadors) {
    const demoHash = await hash("Demo@2024!", 12);
    const demoUser = await db.user.upsert({
      where: { email: amb.email },
      update: {},
      create: {
        email: amb.email,
        passwordHash: demoHash,
        firstName: amb.first,
        lastName: amb.last,
        systemRole: UserSystemRole.AMBASSADOR,
      },
    });

    const instId = instMap[amb.instShort];
    if (!instId) continue;

    await db.ambassadorProfile.upsert({
      where: { userId: demoUser.id },
      update: {},
      create: {
        userId: demoUser.id,
        institutionId: instId,
        onboardingCompleted: true,
        onboardingCompletedAt: new Date(),
        currentTier: amb.tier,
        totalPoints: amb.points,
      },
    });
  }
  console.log(`✓ ${demoAmbassadors.length} demo ambassadors created`);

  // ── Kenyan media organisations ─────────────────────────────────────────────
  const mediaOrgs = [
    { name: "TechTrendsKE", type: "PODCAST" as const, website: "https://techtrends.co.ke", audience: "Kenyan tech enthusiasts and developers", estimatedReach: 15000 },
    { name: "My Tech Story Africa", type: "PODCAST" as const, audience: "African tech professionals", estimatedReach: 25000 },
    { name: "Admin Access", type: "PODCAST" as const, audience: "IT administrators and DevOps engineers", estimatedReach: 8000 },
    { name: "StartUp Soko", type: "PODCAST" as const, audience: "East African startup founders", estimatedReach: 12000 },
    { name: "Coffee Pump Podcast", type: "PODCAST" as const, audience: "Kenyan tech community", estimatedReach: 5000 },
    { name: "The Kenyan Wall Street", type: "NEWSLETTER" as const, website: "https://kenyans.co.ke", audience: "Business and finance community", estimatedReach: 50000 },
    { name: "Business Daily Africa", type: "NEWSPAPER" as const, website: "https://businessdailyafrica.com", audience: "East African business community", estimatedReach: 100000 },
    { name: "Techish Kenya", type: "TECH_BLOG" as const, website: "https://techishkenya.com", audience: "Kenyan tech community", estimatedReach: 20000 },
    { name: "KBC Radio", type: "RADIO" as const, audience: "National Kenyan audience", estimatedReach: 500000 },
    { name: "Nation Media Group", type: "NEWSPAPER" as const, website: "https://nation.africa", audience: "East Africa wide", estimatedReach: 1000000 },
  ];

  for (const org of mediaOrgs) {
    const existing = await db.mediaOrganisation.findFirst({ where: { name: org.name } });
    if (!existing) {
      await db.mediaOrganisation.create({ data: org });
    }
  }
  console.log(`✓ ${mediaOrgs.length} media organisations seeded`);

  // ── National WhatsApp community group ─────────────────────────────────────
  await db.communityGroup.upsert({
    where: { id: "clnationalwagroupx" },
    update: {},
    create: {
      id: "clnationalwagroupx",
      name: "Truehost Campus Builders Kenya",
      platform: "WHATSAPP",
      isNational: true,
      isActive: true,
    },
  });
  console.log("✓ National WhatsApp group seeded");

  console.log("\n✅ Database seeded successfully!");
  console.log("\n📋 Login accounts:");
  console.log("   Super Admin : admin@truehost.cloud         / Admin@TruehostCB2024!");
  console.log("   Campus Lead : lead.jkuat@truehost.cloud    / Lead@JKUAT2024!");
  console.log("   Ambassador  : amb.uon@truehost.cloud       / Amb@UoN2024!");
  console.log("   Demo        : wanjiru@demo.truehost.cloud  / Demo@2024!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await db.$disconnect(); await pool.end(); });
