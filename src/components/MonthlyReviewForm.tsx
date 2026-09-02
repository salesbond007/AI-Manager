"use client";

import { useActionState } from "react";
import { recordMonthlyReviewAction } from "@/app/actions/tools";

function currentYearMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function MonthlyReviewForm({ toolId }: { toolId: string }) {
  const boundAction = recordMonthlyReviewAction.bind(null, toolId);
  const [state, formAction, pending] = useActionState(boundAction, undefined);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">対象月</label>
        <input
          type="month"
          name="yearMonth"
          defaultValue={currentYearMonth()}
          required
          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-600"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
          リスクスコア（0-100・任意）
        </label>
        <input
          type="number"
          min={0}
          max={100}
          name="riskScore"
          className="w-24 rounded-md border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-600"
        />
      </div>
      <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">所見・メモ</label>
        <input
          name="notes"
          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-600"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
      >
        {pending ? "保存中..." : "レビューを記録"}
      </button>
      {state?.error && <p className="w-full text-xs text-red-600">{state.error}</p>}
    </form>
  );
}
