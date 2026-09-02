import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ACTION_LABELS: Record<string, string> = {
  TOOL_CREATED: "ツール登録",
  TOOL_UPDATED: "ツール編集",
  TOOL_DELETED: "ツール削除",
  REPORT_KEY_ROTATED: "状態報告APIキー発行",
  INVITE_CREATED: "ユーザー招待",
  INVITE_ACCEPTED: "招待承諾",
  ALERT_CONSECUTIVE_FAILURE: "連続失敗アラート送信",
  ALERT_STALE: "未報告アラート送信",
};

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function AdminLogsPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    redirect("/");
  }

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { actor: true, tool: true },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-1 text-xl font-semibold text-slate-900">操作ログ</h1>
      <p className="mb-6 text-sm text-slate-500">
        誰が何をしたか（第3線: 監査ログ）。直近100件を表示しています。
      </p>

      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <table className="min-w-full text-sm">
          <thead className="text-left text-xs text-slate-400">
            <tr>
              <th className="py-1 pr-4">日時</th>
              <th className="py-1 pr-4">実行者</th>
              <th className="py-1 pr-4">操作</th>
              <th className="py-1 pr-4">対象ツール</th>
              <th className="py-1 pr-4">詳細</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="py-1.5 pr-4 text-slate-500">
                  {formatDateTime(log.createdAt)}
                </td>
                <td className="py-1.5 pr-4">
                  {log.actor?.name ?? "システム"}
                </td>
                <td className="py-1.5 pr-4">
                  {ACTION_LABELS[log.action] ?? log.action}
                </td>
                <td className="py-1.5 pr-4 text-slate-500">
                  {log.tool?.nickname ?? "—"}
                </td>
                <td className="py-1.5 pr-4 text-slate-500">{log.detail ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
