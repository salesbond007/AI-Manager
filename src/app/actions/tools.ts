"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { slugify } from "@/lib/slug";
import { generateApiKey } from "@/lib/api-key";
import { sendSlackAlert } from "@/lib/slack";
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
    monthlyFixedCostJpy: parseOptionalInt(formData.get("monthlyFixedCostJpy")),
    monthlyBudgetJpy: parseOptionalInt(formData.get("monthlyBudgetJpy")),
    docUrl: String(formData.get("docUrl") ?? "").trim() || null,
    runbookText: String(formData.get("runbookText") ?? "").trim() || null,
    controlWebhookUrl: String(formData.get("controlWebhookUrl") ?? "").trim() || null,
    alertFailureThreshold: parseOptionalInt(formData.get("alertFailureThreshold")),
    alertStaleHours: parseOptionalInt(formData.get("alertStaleHours")),
  };
}

function parseOptionalInt(value: FormDataEntryValue | null) {
  const str = String(value ?? "").trim();
  if (!str) return null;
  const n = Number.parseInt(str, 10);
  return Number.isFinite(n) ? n : null;
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

export async function recordCostEntryAction(
  toolId: string,
  _prevState: { error?: string } | undefined,
  formData: FormData
) {
  const session = await requireAdmin();
  const yearMonth = String(formData.get("yearMonth") ?? "").trim();
  const usageCostJpy = parseOptionalInt(formData.get("usageCostJpy"));
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!/^\d{4}-\d{2}$/.test(yearMonth) || usageCostJpy === null) {
    return { error: "対象月（YYYY-MM）と金額を正しく入力してください。" };
  }

  await prisma.costEntry.upsert({
    where: { toolId_yearMonth: { toolId, yearMonth } },
    create: { toolId, yearMonth, usageCostJpy, note },
    update: { usageCostJpy, note },
  });

  await logAudit({
    actorId: session.user.id,
    action: "COST_ENTRY_RECORDED",
    toolId,
    detail: `${yearMonth}: ¥${usageCostJpy.toLocaleString("ja-JP")}`,
  });

  const tool = await prisma.tool.findUnique({ where: { id: toolId } });
  if (tool?.monthlyBudgetJpy != null && usageCostJpy > tool.monthlyBudgetJpy) {
    await sendSlackAlert(
      `:money_with_wings: *${tool.icon} ${tool.nickname}* の${yearMonth}従量課金実績が予算を超過しました。\n実績: ¥${usageCostJpy.toLocaleString("ja-JP")} / 予算: ¥${tool.monthlyBudgetJpy.toLocaleString("ja-JP")}`
    );
    await logAudit({
      action: "ALERT_BUDGET_OVER",
      toolId,
      detail: `${yearMonth}: 実績¥${usageCostJpy.toLocaleString("ja-JP")} / 予算¥${tool.monthlyBudgetJpy.toLocaleString("ja-JP")}`,
    });
  }

  revalidatePath(`/tools/${toolId}`);
  return {};
}

export async function recordMonthlyReviewAction(
  toolId: string,
  _prevState: { error?: string } | undefined,
  formData: FormData
) {
  const session = await requireAdmin();
  const yearMonth = String(formData.get("yearMonth") ?? "").trim();
  const riskScore = parseOptionalInt(formData.get("riskScore"));
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!/^\d{4}-\d{2}$/.test(yearMonth)) {
    return { error: "対象月（YYYY-MM）を正しく入力してください。" };
  }
  if (riskScore !== null && (riskScore < 0 || riskScore > 100)) {
    return { error: "リスクスコアは0〜100で入力してください。" };
  }

  await prisma.monthlyReview.create({
    data: {
      toolId,
      yearMonth,
      riskScore,
      notes,
      reviewedById: session.user.id,
    },
  });

  await logAudit({
    actorId: session.user.id,
    action: "MONTHLY_REVIEW_RECORDED",
    toolId,
    detail: `${yearMonth}${riskScore !== null ? ` リスクスコア${riskScore}` : ""}`,
  });

  revalidatePath(`/tools/${toolId}`);
  return {};
}

const CONTROL_ACTION_LABELS: Record<string, string> = {
  start: "起動",
  stop: "停止",
  restart: "再実行",
};

export async function triggerControlAction(toolId: string, action: "start" | "stop" | "restart") {
  const session = await requireAdmin();
  const tool = await prisma.tool.findUnique({ where: { id: toolId } });
  if (!tool) throw new Error("ツールが見つかりません。");
  if (!tool.controlWebhookUrl) {
    return { ok: false as const, error: "このツールには操作用Webhookが設定されていません。" };
  }

  let ok = false;
  let errorMessage: string | null = null;
  try {
    const res = await fetch(tool.controlWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    ok = res.ok;
    if (!ok) errorMessage = `送信先が ${res.status} を返しました。`;
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : "送信に失敗しました。";
  }

  await logAudit({
    actorId: session.user.id,
    action: "TOOL_CONTROL_TRIGGERED",
    toolId,
    detail: `${CONTROL_ACTION_LABELS[action]}${ok ? " (成功)" : ` (失敗: ${errorMessage})`}`,
  });

  revalidatePath(`/tools/${toolId}`);
  return ok ? { ok: true as const } : { ok: false as const, error: errorMessage ?? "送信に失敗しました。" };
}
