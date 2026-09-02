import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/StatusBadge";
import { DEV_STATUS_LABELS, KIND_LABELS } from "@/lib/status-labels";

function formatDateTime(date: Date | null | undefined) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export default async function DashboardPage() {
  const tools = await prisma.tool.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      statusReports: {
        orderBy: { reportedAt: "desc" },
        take: 1,
      },
    },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">インベントリ一覧</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            登録されているエージェント・Webアプリの一覧と稼働状況です。
          </p>
        </div>
      </div>

      {tools.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          まだツールが登録されていません。「ツール登録」から追加してください。
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
            <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">ツール</th>
                <th className="px-4 py-3">種別</th>
                <th className="px-4 py-3">開発状態</th>
                <th className="px-4 py-3">稼働状況</th>
                <th className="px-4 py-3">直近の実行結果</th>
                <th className="px-4 py-3">次回実行予定</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {tools.map((tool) => {
                const latest = tool.statusReports[0];
                const successRate =
                  latest?.processedCount && latest.processedCount > 0
                    ? Math.round(
                        ((latest.successCount ?? 0) / latest.processedCount) * 100
                      )
                    : null;

                return (
                  <tr key={tool.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                    <td className="px-4 py-3">
                      <Link
                        href={`/tools/${tool.id}`}
                        className="flex items-center gap-2 font-medium text-slate-900 hover:underline dark:text-slate-100"
                      >
                        <span className="text-lg">{tool.icon}</span>
                        {tool.nickname}
                      </Link>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{tool.purpose}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {KIND_LABELS[tool.kind] ?? tool.kind}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {DEV_STATUS_LABELS[tool.devStatus] ?? tool.devStatus}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={latest?.status ?? "UNKNOWN"} />
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {latest ? (
                        <div className="flex flex-col">
                          <span>{formatDateTime(latest.reportedAt)}</span>
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            {latest.processedCount != null
                              ? `${latest.processedCount}件処理${
                                  successRate != null ? ` / 成功率${successRate}%` : ""
                                }`
                              : "—"}
                          </span>
                        </div>
                      ) : (
                        "報告なし"
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {formatDateTime(latest?.nextRunAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {tool.dashboardUrl ? (
                        <a
                          href={tool.dashboardUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-md border border-slate-300 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          開く
                        </a>
                      ) : (
                        <Link
                          href={`/tools/${tool.id}`}
                          className="rounded-md border border-slate-300 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          詳細
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
