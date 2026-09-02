import { prisma } from "@/lib/prisma";
import { sendSlackAlert } from "@/lib/slack";
import { logAudit } from "@/lib/audit";

const FAILURE_STATUSES = new Set(["DOWN", "ERROR"]);
const CONSECUTIVE_FAILURE_THRESHOLD = 3;
const STALE_HOURS = 24;

/**
 * 直近の状態報告を保存した直後に呼び出す。
 * 直近3件が連続して失敗（DOWN/ERROR）に転じた瞬間だけアラートを送る（毎回の重複通知を避ける）。
 */
export async function checkConsecutiveFailureAlert(toolId: string) {
  const recent = await prisma.statusReport.findMany({
    where: { toolId },
    orderBy: { reportedAt: "desc" },
    take: CONSECUTIVE_FAILURE_THRESHOLD + 1,
  });

  if (recent.length < CONSECUTIVE_FAILURE_THRESHOLD) return;

  const latestN = recent.slice(0, CONSECUTIVE_FAILURE_THRESHOLD);
  const allFailed = latestN.every((r) => FAILURE_STATUSES.has(r.status));
  if (!allFailed) return;

  // 4件目も失敗ならすでに前回のイベントでアラート済みなので今回はスキップ
  const previous = recent[CONSECUTIVE_FAILURE_THRESHOLD];
  if (previous && FAILURE_STATUSES.has(previous.status)) return;

  const tool = await prisma.tool.findUnique({ where: { id: toolId } });
  if (!tool) return;

  const text = `:rotating_light: *${tool.icon} ${tool.nickname}* が${CONSECUTIVE_FAILURE_THRESHOLD}回連続で失敗しました。\n直近のメッセージ: ${latestN[0].message ?? "(メッセージなし)"}`;
  await sendSlackAlert(text);
  await logAudit({
    action: "ALERT_CONSECUTIVE_FAILURE",
    toolId: tool.id,
    detail: `${CONSECUTIVE_FAILURE_THRESHOLD}回連続失敗を検知`,
  });
}

/**
 * Vercel Cron などから定期的に呼び出す。稼働中ツールで24時間以上状態報告がないものを検知する。
 */
export async function checkStaleTools() {
  const staleBefore = new Date(Date.now() - STALE_HOURS * 60 * 60 * 1000);

  const activeTools = await prisma.tool.findMany({
    where: { devStatus: "ACTIVE" },
    include: {
      statusReports: {
        orderBy: { reportedAt: "desc" },
        take: 1,
      },
    },
  });

  const results: { toolId: string; nickname: string; alerted: boolean }[] = [];

  for (const tool of activeTools) {
    const latest = tool.statusReports[0];
    const lastReportedAt = latest?.reportedAt ?? tool.createdAt;
    const isStale = lastReportedAt < staleBefore;
    if (!isStale) continue;

    // 直近24時間以内に既に同じ警告を送っていれば重複送信しない
    const alreadyAlerted = await prisma.auditLog.findFirst({
      where: {
        toolId: tool.id,
        action: "ALERT_STALE",
        createdAt: { gte: new Date(Date.now() - STALE_HOURS * 60 * 60 * 1000) },
      },
    });
    if (alreadyAlerted) continue;

    const text = `:warning: *${tool.icon} ${tool.nickname}* から${STALE_HOURS}時間以上、状態報告がありません。\n最終報告: ${latest ? latest.reportedAt.toISOString() : "報告なし"}`;
    await sendSlackAlert(text);
    await logAudit({
      action: "ALERT_STALE",
      toolId: tool.id,
      detail: `${STALE_HOURS}時間以上状態報告なし`,
    });
    results.push({ toolId: tool.id, nickname: tool.nickname, alerted: true });
  }

  return results;
}
