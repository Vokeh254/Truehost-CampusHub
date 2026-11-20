import { startCertificateWorker } from "@/server/jobs/certificate.job";

console.log("[Workers] Starting BullMQ workers...");

const certWorker = startCertificateWorker();

console.log("[Workers] Certificate worker started");

// Graceful shutdown
const shutdown = async () => {
  console.log("[Workers] Shutting down...");
  await certWorker.close();
  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
