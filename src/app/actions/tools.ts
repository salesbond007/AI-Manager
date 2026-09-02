"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { slugify } from "@/lib/slug";
import { generateApiKey } from "@/lib/api-key";
import type { DevStatus, RunMode, ToolKind } from "@prisma/client";

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("管理者のみ実行できます。");
  }
  return session;
}

function readToolFields(formData: FormData) {
  return {
    nickname: String(formData.get("nickname") ?? "").trim(),
    icon: String(formData.get("icon") ?? "🤖").trim() || "🤖",
    kind: String(formData.get("kind") ?? "WEB_APP") as ToolKind,
    purpose: String(formData.get("purpose") ?? "").trim(),
    devStatus: String(formData.get("devStatus") ?? "PLANNING") as DevStatus,
    runMode: String(formData.get("runMode") ?? "MANUAL") as RunMode,
    servicesUsed: String(formData.get("servicesUsed") ?? "").trim(),
    repoUrl: String(formData.get("repoUrl") ?? "").trim() || null,
    dashboardUrl: String(formData.get("dashboardUrl") ?? "").trim() || null,
    apiKeyScopeNote: String(formData.get("apiKeyScopeNote") ?? "").trim() || null,
    apiKeyLastRotatedAt: formData.get("apiKeyLastRotatedAt")
      ? new Date(String(formData.get("apiKeyLastRotatedAt")))
      : null,
    lastDeployedAt: formData.get("lastDeployedAt")
      ? new Date(String(formData.get("lastDeployedAt")))
      : null,
  };
}

export async function createToolAction(
  _prevState: { error?: string } | undefined,
  formData: FormData
) {
  const session = await requireAdmin();
  const fields = readToolFields(formData);

  if (!fields.nickname || !fields.purpose) {
    return { error: "愛称と目的は必須です。" };
  }

  let slug = slugify(fields.nickname);
  const existing = await prisma.tool.findUnique({ where: { slug } });
  if (existing) {
    slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
  }

  const tool = await prisma.tool.create({
    data: {
      ...fields,
      slug,
      createdById: session.user.id,
    },
  });

  await logAudit({
    actorId: session.user.id,
    action: "TOOL_CREATED",
    toolId: tool.id,
    detail: fields.nickname,
  });

  revalidatePath("/");
  redirect(`/tools/${tool.id}`);
}

export async function updateToolAction(
  toolId: string,
  _prevState: { error?: string } | undefined,
  formData: FormData
) {
  const session = await requireAdmin();
  const fields = readToolFields(formData);

  if (!fields.nickname || !fields.purpose) {
    return { error: "愛称と目的は必須です。" };
  }

  await prisma.tool.update({
    where: { id: toolId },
    data: fields,
  });

  await logAudit({
    actorId: session.user.id,
    action: "TOOL_UPDATED",
    toolId,
    detail: fields.nickname,
  });

  revalidatePath("/");
  revalidatePath(`/tools/${toolId}`);
  redirect(`/tools/${toolId}`);
}

export async function deleteToolAction(toolId: string) {
  const session = await requireAdmin();
  const tool = await prisma.tool.findUnique({ where: { id: toolId } });
  if (!tool) return;

  await prisma.tool.delete({ where: { id: toolId } });

  await logAudit({
    actorId: session.user.id,
    action: "TOOL_DELETED",
    detail: tool.nickname,
  });

  revalidatePath("/");
  redirect("/");
}

export async function rotateReportKeyAction(toolId: string) {
  const session = await requireAdmin();
  const { plain, hash } = generateApiKey();

  await prisma.tool.update({
    where: { id: toolId },
    data: { reportKeyHash: hash, reportKeyLastRotatedAt: new Date() },
  });

  await logAudit({
    actorId: session.user.id,
    action: "REPORT_KEY_ROTATED",
    toolId,
  });

  revalidatePath(`/tools/${toolId}`);
  return { plain };
}
