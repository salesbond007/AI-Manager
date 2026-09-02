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
};

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
        <label className="text-sm font-medium text-slate-700">愛称</label>
        <input
          name="nickname"
          required
          defaultValue={values.nickname}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-700">アイコン（絵文字）</label>
        <input
          name="icon"
          defaultValue={values.icon}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-700">種別</label>
        <select
          name="kind"
          defaultValue={values.kind}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          {Object.entries(KIND_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-700">起動方式</label>
        <select
          name="runMode"
          defaultValue={values.runMode}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          {Object.entries(RUN_MODE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1 sm:col-span-2">
        <label className="text-sm font-medium text-slate-700">目的・担当領域</label>
        <textarea
          name="purpose"
          required
          rows={2}
          defaultValue={values.purpose}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-700">開発状態</label>
        <select
          name="devStatus"
          defaultValue={values.devStatus}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          {Object.entries(DEV_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-700">最終デプロイ日</label>
        <input
          type="date"
          name="lastDeployedAt"
          defaultValue={values.lastDeployedAt}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="flex flex-col gap-1 sm:col-span-2">
        <label className="text-sm font-medium text-slate-700">
          使用サービス・API（カンマ区切り）
        </label>
        <input
          name="servicesUsed"
          placeholder="Claude API, microCMS, Google Drive API"
          defaultValue={values.servicesUsed}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-700">
          コードの場所（GitHubリンク）
        </label>
        <input
          name="repoUrl"
          type="url"
          placeholder="https://github.com/..."
          defaultValue={values.repoUrl}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-700">
          管理画面リンク
        </label>
        <input
          name="dashboardUrl"
          type="url"
          placeholder="https://..."
          defaultValue={values.dashboardUrl}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="flex flex-col gap-1 sm:col-span-2">
        <label className="text-sm font-medium text-slate-700">
          APIキー権限範囲メモ（キー自体は入力しないでください）
        </label>
        <input
          name="apiKeyScopeNote"
          placeholder="例: Claude API（読み取り専用）、Google Drive（フォルダ限定）"
          defaultValue={values.apiKeyScopeNote}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-700">
          APIキー最終ローテーション日
        </label>
        <input
          type="date"
          name="apiKeyLastRotatedAt"
          defaultValue={values.apiKeyLastRotatedAt}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      {state?.error && (
        <p className="text-sm text-red-600 sm:col-span-2">{state.error}</p>
      )}

      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {pending ? "保存中..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
