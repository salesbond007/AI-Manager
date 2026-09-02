"use client";

import { useActionState } from "react";
import { recordCostEntryAction } from "@/app/actions/tools";

function currentYearMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function CostEntryForm({ toolId }: { toolId: string }) {
  const boundAction = recordCostEntryAction.bind(null, toolId);
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
          従量課金実績（円）
        </label>
        <input
          type="number"
          min={0}
          name="usageCostJpy"
          required
          className="w-32 rounded-md border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-600"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">メモ</label>
        <input
          name="note"
          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-600"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
      >
        {pending ? "保存中..." : "記録する"}
      </button>
      {state?.error && <p className="w-full text-xs text-red-600">{state.error}</p>}
    </form>
  );
}
