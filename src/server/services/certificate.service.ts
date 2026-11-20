import { PrismaClient } from "@prisma/client";
import { randomBytes } from "crypto";
import QRCode from "qrcode";
import path from "path";
import fs from "fs/promises";

interface GenerateCertificateParams {
  ambassadorId: string;
  achievementId: string;
  templateId: string;
  issuedBy: string;
}

function generateCertificateCode(): string {
  return randomBytes(6).toString("hex").toUpperCase(); // 12 chars
}

export async function generateCertificate(
  db: PrismaClient,
  params: GenerateCertificateParams
): Promise<string> {
  const { ambassadorId, achievementId, templateId, issuedBy } = params;

  const [profile, template] = await Promise.all([
    db.ambassadorProfile.findUnique({
      where: { id: ambassadorId },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, id: true } },
        institution: true,
      },
    }),
    db.certificateTemplate.findUnique({ where: { id: templateId } }),
  ]);

  if (!profile || !template) throw new Error("Profile or template not found");

  const certCode = generateCertificateCode();
  const verifyUrl = `${process.env.APP_URL}/verify/${certCode}`;

  // Generate QR code
  const uploadsDir = process.env.UPLOAD_DIR ?? "./public/uploads";
  const qrDir = path.join(uploadsDir, "qrcodes");
  await fs.mkdir(qrDir, { recursive: true });

  const qrPath = path.join(qrDir, `${certCode}.png`);
  await QRCode.toFile(qrPath, verifyUrl, { width: 200, margin: 1 });
  const qrCodeUrl = `/uploads/qrcodes/${certCode}.png`;

  // Snapshot metadata
  const metadata = {
    recipientName: `${profile.user.firstName} ${profile.user.lastName}`,
    institution: profile.institution.name,
    tier: template.tier,
    issuedAt: new Date().toISOString(),
    verifyUrl,
  };

  const certificate = await db.certificate.create({
    data: {
      ambassadorId,
      issuedToUserId: profile.user.id,
      templateId,
      achievementId,
      certificateCode: certCode,
      verifyUrl,
      qrCodeUrl,
      metadata,
    },
  });

  // Enqueue PDF generation (non-blocking)
  void enqueuePdfGeneration(certificate.id);

  return certificate.id;
}

async function enqueuePdfGeneration(certificateId: string): Promise<void> {
  // Import here to avoid loading BullMQ in every module
  try {
    const { certificateQueue } = await import("@/server/jobs/certificate.job");
    await certificateQueue.add("generate-pdf", { certificateId });
  } catch (err) {
    console.error("Failed to enqueue PDF generation:", err);
  }
}

export async function verifyCertificate(db: PrismaClient, code: string) {
  const cert = await db.certificate.findUnique({
    where: { certificateCode: code },
    include: {
      ambassador: {
        include: { institution: true },
      },
      issuedTo: { select: { firstName: true, lastName: true } },
      template: { select: { name: true, tier: true } },
    },
  });

  if (!cert) return null;

  // Record verification
  await db.certificateVerification.create({
    data: { certificateId: cert.id },
  });

  return {
    isValid: !cert.isRevoked,
    isRevoked: cert.isRevoked,
    revokedReason: cert.isRevoked ? cert.revokedReason : undefined,
    recipientName: `${cert.issuedTo.firstName} ${cert.issuedTo.lastName}`,
    institution: cert.ambassador.institution.name,
    achievement: cert.template.tier?.replace(/_/g, " ") ?? cert.template.name,
    issuedAt: cert.issuedAt,
    certificateCode: cert.certificateCode,
  };
}
