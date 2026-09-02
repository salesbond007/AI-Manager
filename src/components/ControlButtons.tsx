"use client";

import { useState, useTransition } from "react";
import { triggerControlAction } from "@/app/actions/tools";

const ACTIONS: { key: "start" | "stop" | "restart"; label: string }[] = [
  { key: "start", label: "起動" },
  { key: "stop", label: "停止" },
  { key: "restart", label: "再実行" },
];

export function ControlButtons({
  toolId,
  enabled,
}: {
  toolId: string;
  enabled: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  if (!enabled) {
    return (
      <p className="text-xs text-slate-400 dark:text-slate-500">
        操作用Webhook URLが未設定のため、起動/停止/再実行はできません（編集画面から設定できます）。
      </p>
    );
  }

  return (
    <div>
      <div className="flex gap-2">
        {ACTIONS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            disabled={isPending}
            onClick={() => {
              setMessage(null);
              startTransition(async () => {
                const result = await triggerControlAction(toolId, key);
                setMessage(
                  result.ok
                    ? { ok: true, text: `${label}を送信しました。` }
                    : { ok: false, text: `${label}に失敗しました: ${result.error}` }
                );
              });
            }}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {label}
          </button>
        ))}
      </div>
      {message && (
        <p
          className={`mt-2 text-xs ${
            message.ok ? "text-emerald-600" : "text-red-600"
          }`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
