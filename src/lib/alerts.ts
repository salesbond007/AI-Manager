import { prisma } from "@/lib/prisma";
import { sendSlackAlert } from "@/lib/slack";
import { logAudit } from "@/lib/audit";

const FAILURE_STATUSES = new Set(["DOWN", "ERROR"]);
export const DEFAULT_FAILURE_THRESHOLD = 3;
export const DEFAULT_STALE_HOURS = 24;

/**
 * 直近の状態報告を保存した直後に呼び出す。
 * 直近N件（ツールごとの閾値、未設定ならデフォルト3）が連続して失敗（DOWN/ERROR）に
 * 転じた瞬間だけアラートを送る（毎回の重複通知を避ける）。
 */
export async function checkConsecutiveFailureAlert(toolId: string) {
  const tool = await prisma.tool.findUnique({ where: { id: toolId } });
  if (!tool) return;

  const threshold = tool.alertFailureThreshold ?? DEFAULT_FAILURE_THRESHOLD;

  const recent = await prisma.statusReport.findMany({
    where: { toolId },
    orderBy: { reportedAt: "desc" },
    take: threshold + 1,
  });

  if (recent.length < threshold) return;

  const latestN = recent.slice(0, threshold);
  const allFailed = latestN.every((r) => FAILURE_STATUSES.has(r.status));
  if (!allFailed) return;

  // N+1件目も失敗ならすでに前回のイベントでアラート済みなので今回はスキップ
  const previous = recent[threshold];
  if (previous && FAILURE_STATUSES.has(previous.status)) return;

  const text = `:rotating_light: *${tool.icon} ${tool.nickname}* が${threshold}回連続で失敗しました。\n直近のメッセージ: ${latestN[0].message ?? "(メッセージなし)"}`;
  await sendSlackAlert(text);
  await logAudit({
    action: "ALERT_CONSECUTIVE_FAILURE",
    toolId: tool.id,
    detail: `${threshold}回連続失敗を検知`,
  });
}

/**
 * Vercel Cron などから定期的に呼び出す。稼働中ツールで、ツールごとの閾値（未設定なら24時間）
 * 以上状態報告がないものを検知する。
 */
export async function checkStaleTools() {
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
    const staleHours = tool.alertStaleHours ?? DEFAULT_STALE_HOURS;
    const staleBefore = new Date(Date.now() - staleHours * 60 * 60 * 1000);

    const latest = tool.statusReports[0];
    const lastReportedAt = latest?.reportedAt ?? tool.createdAt;
    const isStale = lastReportedAt < staleBefore;
    if (!isStale) continue;

    // 同じ期間内に既に同じ警告を送っていれば重複送信しない
    const alreadyAlerted = await prisma.auditLog.findFirst({
      where: {
        toolId: tool.id,
        action: "ALERT_STALE",
        createdAt: { gte: staleBefore },
      },
    });
    if (alreadyAlerted) continue;

    const text = `:warning: *${tool.icon} ${tool.nickname}* から${staleHours}時間以上、状態報告がありません。\n最終報告: ${latest ? latest.reportedAt.toISOString() : "報告なし"}`;
    await sendSlackAlert(text);
    await logAudit({
      action: "ALERT_STALE",
      toolId: tool.id,
      detail: `${staleHours}時間以上状態報告なし`,
    });
    results.push({ toolId: tool.id, nickname: tool.nickname, alerted: true });
  }

  return results;
}
