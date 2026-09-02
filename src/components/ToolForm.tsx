"use client";

import { useActionState } from "react";
import {
  DEV_STATUS_LABELS,
  KIND_LABELS,
  RUN_MODE_LABELS,
} from "@/lib/status-labels";

type ToolFormValues = {
  nickname: string;
  icon: string;
  kind: string;
  purpose: string;
  devStatus: string;
  runMode: string;
  servicesUsed: string;
  repoUrl: string;
  dashboardUrl: string;
  apiKeyScopeNote: string;
  apiKeyLastRotatedAt: string;
  lastDeployedAt: string;
  monthlyFixedCostJpy: string;
  monthlyBudgetJpy: string;
  docUrl: string;
  runbookText: string;
  controlWebhookUrl: string;
  alertFailureThreshold: string;
  alertStaleHours: string;
};

const EMPTY: ToolFormValues = {
  nickname: "",
  icon: "🤖",
  kind: "WEB_APP",
  purpose: "",
  devStatus: "PLANNING",
  runMode: "MANUAL",
  servicesUsed: "",
  repoUrl: "",
  dashboardUrl: "",
  apiKeyScopeNote: "",
  apiKeyLastRotatedAt: "",
  lastDeployedAt: "",
  monthlyFixedCostJpy: "",
  monthlyBudgetJpy: "",
  docUrl: "",
  runbookText: "",
  controlWebhookUrl: "",
  alertFailureThreshold: "",
  alertStaleHours: "",
};

const inputClass =
  "rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-600";
const labelClass = "text-sm font-medium text-slate-700 dark:text-slate-300";

export function ToolForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: (
    prevState: { error?: string } | undefined,
    formData: FormData
  ) => Promise<{ error?: string } | undefined>;
  defaultValues?: Partial<ToolFormValues>;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const values = { ...EMPTY, ...defaultValues };

  return (
    <form action={formAction} className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      <div className="flex flex-col gap-1">
        <label className={labelClass}>愛称</label>
        <input name="nickname" required defaultValue={values.nickname} className={inputClass} />
      </div>
      <div className="flex flex-col gap-1">
        <label className={labelClass}>アイコン（絵文字）</label>
        <input name="icon" defaultValue={values.icon} className={inputClass} />
      </div>
      <div className="flex flex-col gap-1">
        <label className={labelClass}>種別</label>
        <select name="kind" defaultValue={values.kind} className={inputClass}>
          {Object.entries(KIND_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className={labelClass}>起動方式</label>
        <select name="runMode" defaultValue={values.runMode} className={inputClass}>
          {Object.entries(RUN_MODE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1 sm:col-span-2">
        <label className={labelClass}>目的・担当領域</label>
        <textarea name="purpose" required rows={2} defaultValue={values.purpose} className={inputClass} />
      </div>
      <div className="flex flex-col gap-1">
        <label className={labelClass}>開発状態</label>
        <select name="devStatus" defaultValue={values.devStatus} className={inputClass}>
          {Object.entries(DEV_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className={labelClass}>最終デプロイ日</label>
        <input type="date" name="lastDeployedAt" defaultValue={values.lastDeployedAt} className={inputClass} />
      </div>
      <div className="flex flex-col gap-1 sm:col-span-2">
        <label className={labelClass}>使用サービス・API（カンマ区切り）</label>
        <input
          name="servicesUsed"
          placeholder="Claude API, microCMS, Google Drive API"
          defaultValue={values.servicesUsed}
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className={labelClass}>コードの場所（GitHubリンク）</label>
        <input
          name="repoUrl"
          type="url"
          placeholder="https://github.com/..."
          defaultValue={values.repoUrl}
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className={labelClass}>管理画面リンク</label>
        <input
          name="dashboardUrl"
          type="url"
          placeholder="https://..."
          defaultValue={values.dashboardUrl}
          className={inputClass}
        />
      </div>

      <div className="sm:col-span-2 border-t border-slate-200 pt-4 dark:border-slate-700">
        <p className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
          セキュリティ・権限
        </p>
      </div>
      <div className="flex flex-col gap-1 sm:col-span-2">
        <label className={labelClass}>APIキー権限範囲メモ（キー自体は入力しないでください）</label>
        <input
          name="apiKeyScopeNote"
          placeholder="例: Claude API（読み取り専用）、Google Drive（フォルダ限定）"
          defaultValue={values.apiKeyScopeNote}
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className={labelClass}>APIキー最終ローテーション日</label>
        <input
          type="date"
          name="apiKeyLastRotatedAt"
          defaultValue={values.apiKeyLastRotatedAt}
          className={inputClass}
        />
      </div>

      <div className="sm:col-span-2 border-t border-slate-200 pt-4 dark:border-slate-700">
        <p className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
          コスト管理
        </p>
      </div>
      <div className="flex flex-col gap-1">
        <label className={labelClass}>月額固定費（円）</label>
        <input
          type="number"
          min={0}
          name="monthlyFixedCostJpy"
          placeholder="例: 5000"
          defaultValue={values.monthlyFixedCostJpy}
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className={labelClass}>従量課金の月間予算（円）</label>
        <input
          type="number"
          min={0}
          name="monthlyBudgetJpy"
          placeholder="例: 10000"
          defaultValue={values.monthlyBudgetJpy}
          className={inputClass}
        />
      </div>

      <div className="sm:col-span-2 border-t border-slate-200 pt-4 dark:border-slate-700">
        <p className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
          アラート閾値（空欄なら既定値: 3回連続失敗 / 24時間未報告）
        </p>
      </div>
      <div className="flex flex-col gap-1">
        <label className={labelClass}>連続失敗の回数でアラート</label>
        <input
          type="number"
          min={1}
          name="alertFailureThreshold"
          placeholder="既定値: 3"
          defaultValue={values.alertFailureThreshold}
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className={labelClass}>未報告とみなす時間（時間）</label>
        <input
          type="number"
          min={1}
          name="alertStaleHours"
          placeholder="既定値: 24"
          defaultValue={values.alertStaleHours}
          className={inputClass}
        />
      </div>

      <div className="sm:col-span-2 border-t border-slate-200 pt-4 dark:border-slate-700">
        <p className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
          アクセス・操作 / ドキュメント
        </p>
      </div>
      <div className="flex flex-col gap-1 sm:col-span-2">
        <label className={labelClass}>
          起動/停止/再実行 用Webhook URL（ツール側に用意してもらう。空欄ならボタン無効）
        </label>
        <input
          name="controlWebhookUrl"
          type="url"
          placeholder="https://..."
          defaultValue={values.controlWebhookUrl}
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-1 sm:col-span-2">
        <label className={labelClass}>仕様書・要件整理へのリンク</label>
        <input
          name="docUrl"
          type="url"
          placeholder="https://..."
          defaultValue={values.docUrl}
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-1 sm:col-span-2">
        <label className={labelClass}>障害時の対応手順（誰が何をするか）</label>
        <textarea
          name="runbookText"
          rows={3}
          placeholder="例: エラー通知を確認→〇〇に連絡→△△の手順で再起動"
          defaultValue={values.runbookText}
          className={inputClass}
        />
      </div>

      {state?.error && <p className="text-sm text-red-600 sm:col-span-2">{state.error}</p>}

      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
        >
          {pending ? "保存中..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
