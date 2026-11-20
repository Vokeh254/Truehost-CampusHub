import { PrismaClient } from "@prisma/client";

interface AuditLogParams {
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  oldValues?: object;
  newValues?: object;
  ipAddress?: string;
  userAgent?: string;
}

export async function createAuditLog(
  db: PrismaClient | Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">,
  params: AuditLogParams
) {
  try {
    await (db as PrismaClient).auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        resource: params.resource,
        resourceId: params.resourceId,
        oldValues: params.oldValues ? JSON.parse(JSON.stringify(params.oldValues)) : undefined,
        newValues: params.newValues ? JSON.parse(JSON.stringify(params.newValues)) : undefined,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  } catch (err) {
    // Audit log failure should never break the main operation
    console.error("Audit log error:", err);
  }
}
