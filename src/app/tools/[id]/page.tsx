import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/StatusBadge";
import { RotateKeyButton } from "@/components/RotateKeyButton";
import { DeleteToolButton } from "@/components/DeleteToolButton";
import { ControlButtons } from "@/components/ControlButtons";
import { CostEntryForm } from "@/components/CostEntryForm";
import { MonthlyReviewForm } from "@/components/MonthlyReviewForm";
import { DEFAULT_FAILURE_THRESHOLD, DEFAULT_STALE_HOURS } from "@/lib/alerts";
import {
  DEV_STATUS_LABELS,
  KIND_LABELS,
  RUN_MODE_LABELS,
} from "@/lib/status-labels";

const cardClass =
  "rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900";
const sectionTitleClass = "mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100";
const dtClass = "text-slate-500 dark:text-slate-400";

function formatDateTime(date: Date | null | undefined) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatDate(date: Date | null | undefined) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium" }).format(date);
}

function formatJpy(amount: number | null | undefined) {
  if (amount == null) return "—";
  return `¥${amount.toLocaleString("ja-JP")}`;
}

export default async function ToolDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;

  const tool = await prisma.tool.findUnique({
    where: { id },
    include: {
      createdBy: true,
      statusReports: {
        orderBy: { reportedAt: "desc" },
        take: 20,
      },
      costEntries: {
        orderBy: { yearMonth: "desc" },
        take: 12,
      },
      monthlyReviews: {
        orderBy: { yearMonth: "desc" },
        take: 12,
        include: { reviewedBy: true },
      },
    },
  });
  if (!tool) notFound();

  const isAdmin = session?.user.role === "ADMIN";
  const latest = tool.statusReports[0];
  const errorReports = tool.statusReports.filter((r) =>
    ["ERROR", "DOWN"].includes(r.status)
  );

  const currentYearMonth = (() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  })();
  const currentMonthUsage = tool.costEntries.find(
    (c) => c.yearMonth === currentYearMonth
  );
  const overBudget =
    tool.monthlyBudgetJpy != null &&
    currentMonthUsage != null &&
    currentMonthUsage.usageCostJpy > tool.monthlyBudgetJpy;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <Link
            href="/"
            className="text-xs text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
          >
            ← 一覧に戻る
          </Link>
          <h1 className="mt-1 flex items-center gap-2 text-xl font-semibold text-slate-900 dark:text-slate-100">
            <span className="text-2xl">{tool.icon}</span>
            {tool.nickname}
            <StatusBadge status={latest?.status ?? "UNKNOWN"} />
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{tool.purpose}</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Link
              href={`/tools/${tool.id}/edit`}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              編集
            </Link>
            <DeleteToolButton toolId={tool.id} nickname={tool.nickname} />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <section className={cardClass}>
          <h2 className={sectionTitleClass}>インベントリ情報</h2>
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className={dtClass}>種別</dt>
            <dd>{KIND_LABELS[tool.kind] ?? tool.kind}</dd>
            <dt className={dtClass}>開発状態</dt>
            <dd>{DEV_STATUS_LABELS[tool.devStatus] ?? tool.devStatus}</dd>
            <dt className={dtClass}>起動方式</dt>
            <dd>{RUN_MODE_LABELS[tool.runMode] ?? tool.runMode}</dd>
            <dt className={dtClass}>使用サービス・API</dt>
            <dd>{tool.servicesUsed || "—"}</dd>
            <dt className={dtClass}>コードの場所</dt>
            <dd>
              {tool.repoUrl ? (
                <a href={tool.repoUrl} target="_blank" rel="noreferrer" className="text-slate-700 underline dark:text-slate-300">
                  GitHubを開く
                </a>
              ) : (
                "—"
              )}
            </dd>
            <dt className={dtClass}>管理画面</dt>
            <dd>
              {tool.dashboardUrl ? (
                <a href={tool.dashboardUrl} target="_blank" rel="noreferrer" className="text-slate-700 underline dark:text-slate-300">
                  開く
                </a>
              ) : (
                "—"
              )}
            </dd>
            <dt className={dtClass}>最終デプロイ日</dt>
            <dd>{formatDate(tool.lastDeployedAt)}</dd>
            <dt className={dtClass}>登録者</dt>
            <dd>{tool.createdBy.name}</dd>
          </dl>
        </section>

        <section className={cardClass}>
          <h2 className={sectionTitleClass}>稼働状況</h2>
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className={dtClass}>直近の実行日時</dt>
            <dd>{formatDateTime(latest?.reportedAt)}</dd>
            <dt className={dtClass}>処理件数</dt>
            <dd>{latest?.processedCount ?? "—"}</dd>
            <dt className={dtClass}>成功件数</dt>
            <dd>{latest?.successCount ?? "—"}</dd>
            <dt className={dtClass}>次回実行予定</dt>
            <dd>{formatDateTime(latest?.nextRunAt)}</dd>
            <dt className={dtClass}>アラート閾値</dt>
            <dd className="text-xs text-slate-500 dark:text-slate-400">
              {tool.alertFailureThreshold ?? DEFAULT_FAILURE_THRESHOLD}回連続失敗 /{" "}
              {tool.alertStaleHours ?? DEFAULT_STALE_HOURS}時間未報告
            </dd>
          </dl>

          {isAdmin && (
            <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
              <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
                このツールから状態を報告させるには、以下のAPIキーを発行し、
                <code className="mx-1 rounded bg-slate-100 px-1 dark:bg-slate-800">
                  POST /api/status-report
                </code>
                に送信させてください。
              </p>
              <p className="mb-2 text-xs text-slate-400 dark:text-slate-500">
                最終ローテーション: {formatDateTime(tool.reportKeyLastRotatedAt)}
              </p>
              <RotateKeyButton toolId={tool.id} />
            </div>
          )}
        </section>

        <section className={`${cardClass} sm:col-span-2`}>
          <h2 className={sectionTitleClass}>アクセス・操作</h2>
          <ControlButtons toolId={tool.id} enabled={!!tool.controlWebhookUrl} />
        </section>

        <section className={`${cardClass} sm:col-span-2`}>
          <h2 className={sectionTitleClass}>
            セキュリティ・権限（APIキーの権限範囲のみ表示。キー自体は保存しません）
          </h2>
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className={dtClass}>権限範囲メモ</dt>
            <dd>{tool.apiKeyScopeNote || "未設定"}</dd>
            <dt className={dtClass}>最終ローテーション日</dt>
            <dd>{formatDate(tool.apiKeyLastRotatedAt)}</dd>
          </dl>
        </section>

        <section className={`${cardClass} sm:col-span-2`}>
          <h2 className={sectionTitleClass}>コスト管理</h2>
          <dl className="mb-4 grid grid-cols-2 gap-y-2 text-sm sm:grid-cols-4">
            <dt className={dtClass}>月額固定費</dt>
            <dd>{formatJpy(tool.monthlyFixedCostJpy)}</dd>
            <dt className={dtClass}>従量課金の月間予算</dt>
            <dd>{formatJpy(tool.monthlyBudgetJpy)}</dd>
            <dt className={dtClass}>今月の従量課金実績</dt>
            <dd className={overBudget ? "font-semibold text-red-600" : ""}>
              {currentMonthUsage ? formatJpy(currentMonthUsage.usageCostJpy) : "未記録"}
              {overBudget && " (予算超過)"}
            </dd>
          </dl>
          {tool.costEntries.length > 0 && (
            <table className="mb-4 min-w-full text-sm">
              <thead className="text-left text-xs text-slate-400 dark:text-slate-500">
                <tr>
                  <th className="py-1 pr-4">月</th>
                  <th className="py-1 pr-4">従量課金実績</th>
                  <th className="py-1 pr-4">メモ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {tool.costEntries.map((c) => (
                  <tr key={c.id}>
                    <td className="py-1.5 pr-4 text-slate-600 dark:text-slate-300">{c.yearMonth}</td>
                    <td className="py-1.5 pr-4 text-slate-600 dark:text-slate-300">
                      {formatJpy(c.usageCostJpy)}
                      {tool.monthlyBudgetJpy != null && c.usageCostJpy > tool.monthlyBudgetJpy && (
                        <span className="ml-2 text-xs text-red-600">予算超過</span>
                      )}
                    </td>
                    <td className="py-1.5 pr-4 text-slate-500 dark:text-slate-400">{c.note ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {isAdmin && <CostEntryForm toolId={tool.id} />}
        </section>

        <section className={`${cardClass} sm:col-span-2`}>
          <h2 className={sectionTitleClass}>月次レビュー・リスクスコア推移</h2>
          {tool.monthlyReviews.length === 0 ? (
            <p className="mb-4 text-sm text-slate-400 dark:text-slate-500">まだレビュー記録がありません。</p>
          ) : (
            <table className="mb-4 min-w-full text-sm">
              <thead className="text-left text-xs text-slate-400 dark:text-slate-500">
                <tr>
                  <th className="py-1 pr-4">月</th>
                  <th className="py-1 pr-4">リスクスコア</th>
                  <th className="py-1 pr-4">所見</th>
                  <th className="py-1 pr-4">レビュー者</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {tool.monthlyReviews.map((r) => (
                  <tr key={r.id}>
                    <td className="py-1.5 pr-4 text-slate-600 dark:text-slate-300">{r.yearMonth}</td>
                    <td className="py-1.5 pr-4 text-slate-600 dark:text-slate-300">
                      {r.riskScore ?? "—"}
                    </td>
                    <td className="py-1.5 pr-4 text-slate-500 dark:text-slate-400">{r.notes ?? "—"}</td>
                    <td className="py-1.5 pr-4 text-slate-500 dark:text-slate-400">
                      {r.reviewedBy?.name ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {isAdmin && <MonthlyReviewForm toolId={tool.id} />}
        </section>

        <section className={`${cardClass} sm:col-span-2`}>
          <h2 className={sectionTitleClass}>ドキュメント・引き継ぎ</h2>
          <dl className="grid grid-cols-1 gap-y-2 text-sm">
            <dt className={dtClass}>仕様書・要件整理へのリンク</dt>
            <dd>
              {tool.docUrl ? (
                <a href={tool.docUrl} target="_blank" rel="noreferrer" className="text-slate-700 underline dark:text-slate-300">
                  開く
                </a>
              ) : (
                "未設定"
              )}
            </dd>
            <dt className={dtClass}>障害時の対応手順</dt>
            <dd className="whitespace-pre-wrap text-slate-700 dark:text-slate-300">
              {tool.runbookText || "未設定"}
            </dd>
          </dl>
        </section>

        <section className={`${cardClass} sm:col-span-2`}>
          <h2 className={sectionTitleClass}>直近のエラーログ</h2>
          {errorReports.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500">エラーはありません。</p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {errorReports.map((r) => (
                <li
                  key={r.id}
                  className="rounded-md bg-red-50 p-3 text-red-800 dark:bg-red-950/40 dark:text-red-300"
                >
                  <span className="mr-2 text-xs text-red-500 dark:text-red-400">
                    {formatDateTime(r.reportedAt)}
                  </span>
                  {r.message || "(メッセージなし)"}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={`${cardClass} sm:col-span-2`}>
          <h2 className={sectionTitleClass}>実行履歴（直近20件）</h2>
          {tool.statusReports.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500">まだ状態報告がありません。</p>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs text-slate-400 dark:text-slate-500">
                <tr>
                  <th className="py-1 pr-4">日時</th>
                  <th className="py-1 pr-4">状態</th>
                  <th className="py-1 pr-4">処理件数</th>
                  <th className="py-1 pr-4">メッセージ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {tool.statusReports.map((r) => (
                  <tr key={r.id}>
                    <td className="py-1.5 pr-4 text-slate-500 dark:text-slate-400">
                      {formatDateTime(r.reportedAt)}
                    </td>
                    <td className="py-1.5 pr-4">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="py-1.5 pr-4 text-slate-600 dark:text-slate-300">
                      {r.processedCount ?? "—"}
                    </td>
                    <td className="py-1.5 pr-4 text-slate-600 dark:text-slate-300">
                      {r.message ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}
