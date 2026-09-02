import { prisma } from "@/lib/prisma";

export async function logAudit(params: {
  actorId?: string | null;
  action: string;
  toolId?: string | null;
  detail?: string | null;
}) {
  await prisma.auditLog.create({
    data: {
      actorId: params.actorId ?? null,
      action: params.action,
      toolId: params.toolId ?? null,
      detail: params.detail ?? null,
    },
  });
}
