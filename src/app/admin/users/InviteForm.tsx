"use client";

import { useActionState } from "react";
import { createInviteAction } from "@/app/actions/invite";

export function InviteForm({ origin }: { origin: string }) {
  const [state, formAction, pending] = useActionState(createInviteAction, undefined);

  return (
    <div>
      <form action={formAction} className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">メールアドレス</label>
          <input
            name="email"
            type="email"
            required
            className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-600"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">権限</label>
          <select
            name="role"
            defaultValue="VIEWER"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-600"
          >
            <option value="VIEWER">閲覧者</option>
            <option value="ADMIN">管理者</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
        >
          {pending ? "作成中..." : "招待を作成"}
        </button>
      </form>
      {state?.error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{state.error}</p>}
      {state?.success && state.token && (
        <div className="mt-3 rounded-md border border-emerald-300 bg-emerald-50 p-3 text-xs text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
          <p className="mb-1">{state.success} 以下のリンクを本人に共有してください。</p>
          <code className="block break-all rounded bg-white px-2 py-1 text-[11px] text-slate-900">
            {origin}/invite/{state.token}
          </code>
        </div>
      )}
    </div>
  );
}
