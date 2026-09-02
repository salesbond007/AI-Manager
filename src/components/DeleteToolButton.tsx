"use client";

import { useTransition } from "react";
import { deleteToolAction } from "@/app/actions/tools";

export function DeleteToolButton({ toolId, nickname }: { toolId: string; nickname: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        if (!confirm(`「${nickname}」を削除します。よろしいですか？`)) return;
        startTransition(() => {
          deleteToolAction(toolId);
        });
      }}
      className="rounded-md border border-red-300 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
    >
      {isPending ? "削除中..." : "削除"}
    </button>
  );
}
