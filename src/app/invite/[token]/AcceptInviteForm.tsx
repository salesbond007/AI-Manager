"use client";

import { useActionState } from "react";
import { acceptInviteAction } from "@/app/actions/invite";
import { PasswordField } from "@/components/PasswordField";

export function AcceptInviteForm({ token, email }: { token: string; email: string }) {
  const [state, formAction, pending] = useActionState(acceptInviteAction, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />
      <div>
        <p className="text-sm text-slate-500">招待メールアドレス</p>
        <p className="text-sm font-medium text-slate-900">{email}</p>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-medium text-slate-700">
          お名前
        </label>
        <input
          id="name"
          name="name"
          required
          className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
        />
      </div>
      <PasswordField
        id="password"
        name="password"
        label="パスワード（8文字以上）"
        autoComplete="new-password"
        minLength={8}
      />
      <PasswordField
        id="passwordConfirm"
        name="passwordConfirm"
        label="パスワード（確認）"
        autoComplete="new-password"
        minLength={8}
      />
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {pending ? "作成中..." : "アカウントを作成してログイン"}
      </button>
    </form>
  );
}
