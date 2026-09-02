import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/StatusBadge";
import { RotateKeyButton } from "@/components/RotateKeyButton";
import { DeleteToolButton } from "@/components/DeleteToolButton";
import {
  DEV_STATUS_LABELS,
  KIND_LABELS,
  RUN_MODE_LABELS,
} from "@/lib/status-labels";

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
    },
  });
  if (!tool) notFound();

  const isAdmin = session?.user.role === "ADMIN";
  const latest = tool.statusReports[0];
  const errorReports = tool.statusReports.filter((r) =>
    ["ERROR", "DOWN"].includes(r.status)
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <Link href="/" className="text-xs text-slate-400 hover:text-slate-600">
            ← 一覧に戻る
          </Link>
          <h1 className="mt-1 flex items-center gap-2 text-xl font-semibold text-slate-900">
            <span className="text-2xl">{tool.icon}</span>
            {tool.nickname}
            <StatusBadge status={latest?.status ?? "UNKNOWN"} />
          </h1>
          <p className="mt-1 text-sm text-slate-500">{tool.purpose}</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Link
              href={`/tools/${tool.id}/edit`}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
            >
              編集
            </Link>
            <DeleteToolButton toolId={tool.id} nickname={tool.nickname} />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">
            インベントリ情報
          </h2>
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-slate-500">種別</dt>
            <dd>{KIND_LABELS[tool.kind] ?? tool.kind}</dd>
            <dt className="text-slate-500">開発状態</dt>
            <dd>{DEV_STATUS_LABELS[tool.devStatus] ?? tool.devStatus}</dd>
            <dt className="text-slate-500">起動方式</dt>
            <dd>{RUN_MODE_LABELS[tool.runMode] ?? tool.runMode}</dd>
            <dt className="text-slate-500">使用サービス・API</dt>
            <dd>{tool.servicesUsed || "—"}</dd>
            <dt className="text-slate-500">コードの場所</dt>
            <dd>
              {tool.repoUrl ? (
                <a
                  href={tool.repoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-700 underline"
                >
                  GitHubを開く
                </a>
              ) : (
                "—"
              )}
            </dd>
            <dt className="text-slate-500">管理画面</dt>
            <dd>
              {tool.dashboardUrl ? (
                <a
                  href={tool.dashboardUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-700 underline"
                >
                  開く
                </a>
              ) : (
                "—"
              )}
            </dd>
            <dt className="text-slate-500">最終デプロイ日</dt>
            <dd>{formatDate(tool.lastDeployedAt)}</dd>
            <dt className="text-slate-500">登録者</dt>
            <dd>{tool.createdBy.name}</dd>
          </dl>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">稼働状況</h2>
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-slate-500">直近の実行日時</dt>
            <dd>{formatDateTime(latest?.reportedAt)}</dd>
            <dt className="text-slate-500">処理件数</dt>
            <dd>{latest?.processedCount ?? "—"}</dd>
            <dt className="text-slate-500">成功件数</dt>
            <dd>{latest?.successCount ?? "—"}</dd>
            <dt className="text-slate-500">次回実行予定</dt>
            <dd>{formatDateTime(latest?.nextRunAt)}</dd>
          </dl>

          {isAdmin && (
            <div className="mt-5 border-t border-slate-100 pt-4">
              <p className="mb-2 text-xs text-slate-500">
                このツールから状態を報告させるには、以下のAPIキーを発行し、
                <code className="mx-1 rounded bg-slate-100 px-1">
                  POST /api/status-report
                </code>
                に送信させてください。
              </p>
              <p className="mb-2 text-xs text-slate-400">
                最終ローテーション: {formatDateTime(tool.reportKeyLastRotatedAt)}
              </p>
              <RotateKeyButton toolId={tool.id} />
            </div>
          )}
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 sm:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">
            セキュリティ・権限（APIキーの権限範囲のみ表示。キー自体は保存しません）
          </h2>
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-slate-500">権限範囲メモ</dt>
            <dd>{tool.apiKeyScopeNote || "未設定"}</dd>
            <dt className="text-slate-500">最終ローテーション日</dt>
            <dd>{formatDate(tool.apiKeyLastRotatedAt)}</dd>
          </dl>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 sm:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">
            直近のエラーログ
          </h2>
          {errorReports.length === 0 ? (
            <p className="text-sm text-slate-400">エラーはありません。</p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {errorReports.map((r) => (
                <li key={r.id} className="rounded-md bg-red-50 p-3 text-red-800">
                  <span className="mr-2 text-xs text-red-500">
                    {formatDateTime(r.reportedAt)}
                  </span>
                  {r.message || "(メッセージなし)"}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 sm:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">
            実行履歴（直近20件）
          </h2>
          {tool.statusReports.length === 0 ? (
            <p className="text-sm text-slate-400">まだ状態報告がありません。</p>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs text-slate-400">
                <tr>
                  <th className="py-1 pr-4">日時</th>
                  <th className="py-1 pr-4">状態</th>
                  <th className="py-1 pr-4">処理件数</th>
                  <th className="py-1 pr-4">メッセージ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tool.statusReports.map((r) => (
                  <tr key={r.id}>
                    <td className="py-1.5 pr-4 text-slate-500">
                      {formatDateTime(r.reportedAt)}
                    </td>
                    <td className="py-1.5 pr-4">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="py-1.5 pr-4 text-slate-600">
                      {r.processedCount ?? "—"}
                    </td>
                    <td className="py-1.5 pr-4 text-slate-600">
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
