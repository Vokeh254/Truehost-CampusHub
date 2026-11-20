import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";

const redisConnection = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

export const certificateQueue = new Queue("certificate", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

export function startCertificateWorker() {
  const worker = new Worker(
    "certificate",
    async (job) => {
      const { certificateId } = job.data;

      // Lazy import to avoid loading Prisma in queue definition
      const { db } = await import("@/server/db");
      const puppeteer = await import("puppeteer-core");
      const chromium = await import("@sparticuz/chromium");
      const path = await import("path");
      const fs = await import("fs/promises");

      const cert = await db.certificate.findUnique({
        where: { id: certificateId },
        include: {
          template: true,
          issuedTo: { select: { firstName: true, lastName: true } },
          ambassador: { include: { institution: true } },
        },
      });

      if (!cert) throw new Error(`Certificate ${certificateId} not found`);

      // Fill template
      const html = cert.template.htmlTemplate
        .replace(/{{recipientName}}/g, `${cert.issuedTo.firstName} ${cert.issuedTo.lastName}`)
        .replace(/{{institution}}/g, cert.ambassador.institution.name)
        .replace(/{{achievement}}/g, cert.template.tier?.replace(/_/g, " ") ?? cert.template.name)
        .replace(/{{issuedDate}}/g, new Date(cert.issuedAt).toLocaleDateString("en-KE", { year: "numeric", month: "long", day: "numeric" }))
        .replace(/{{certificateCode}}/g, cert.certificateCode)
        .replace(/{{verifyUrl}}/g, cert.verifyUrl)
        .replace(/{{qrCodeUrl}}/g, `${process.env.APP_URL}${cert.qrCodeUrl}`);

      const browser = await puppeteer.default.launch({
        args: chromium.default.args,
        executablePath: await chromium.default.executablePath(),
        headless: true,
      });

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "load" });

      const pdfDir = path.join(process.env.UPLOAD_DIR ?? "./public/uploads", "certificates");
      await fs.mkdir(pdfDir, { recursive: true });

      const pdfPath = path.join(pdfDir, `${cert.certificateCode}.pdf`);
      await page.pdf({ path: pdfPath, format: "A4", landscape: true });
      await browser.close();

      const pdfUrl = `/uploads/certificates/${cert.certificateCode}.pdf`;
      await db.certificate.update({
        where: { id: certificateId },
        data: { pdfUrl },
      });

      console.log(`[Certificate] PDF generated: ${pdfUrl}`);
    },
    { connection: redisConnection, concurrency: 2 }
  );

  worker.on("failed", (job, err) => {
    console.error(`[Certificate] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}
