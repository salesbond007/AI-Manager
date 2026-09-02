"use client";

import { useState, useTransition } from "react";
import { rotateReportKeyAction } from "@/app/actions/tools";

export function RotateKeyButton({ toolId }: { toolId: string }) {
  const [isPending, startTransition] = useTransition();
  const [newKey, setNewKey] = useState<string | null>(null);

  return (
    <div>
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          setNewKey(null);
          startTransition(async () => {
            const result = await rotateReportKeyAction(toolId);
            setNewKey(result.plain);
          });
        }}
        className="rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50"
      >
        {isPending ? "発行中..." : "状態報告用APIキーを発行/再発行"}
      </button>
      {newKey && (
        <div className="mt-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
          <p className="mb-1 font-medium">
            この画面を閉じると二度と表示されません。安全な場所に保存してください。
          </p>
          <code className="block break-all rounded bg-white px-2 py-1 text-[11px]">
            {newKey}
          </code>
        </div>
      )}
    </div>
  );
}
