import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { InviteForm } from "./InviteForm";

const cardClass =
  "rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900";

function formatDateTime(date: Date | null | undefined) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    redirect("/");
  }

  const hdrs = await headers();
  const host = hdrs.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  const origin = host ? `${protocol}://${host}` : "";

  const [users, invites] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.invite.findMany({
      where: { acceptedAt: null },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-1 text-xl font-semibold text-slate-900 dark:text-slate-100">ユーザー管理</h1>
      <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
        招待制でユーザーを登録します。管理者／閲覧者の権限を選べます。
      </p>

      <section className={`mb-8 ${cardClass}`}>
        <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">新しく招待する</h2>
        <InviteForm origin={origin} />
      </section>

      <section className={`mb-8 ${cardClass}`}>
        <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
          登録済みユーザー
        </h2>
        <table className="min-w-full text-sm">
          <thead className="text-left text-xs text-slate-400 dark:text-slate-500">
            <tr>
              <th className="py-1 pr-4">名前</th>
              <th className="py-1 pr-4">メールアドレス</th>
              <th className="py-1 pr-4">権限</th>
              <th className="py-1 pr-4">登録日</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="py-1.5 pr-4 dark:text-slate-200">{u.name}</td>
                <td className="py-1.5 pr-4 text-slate-500 dark:text-slate-400">{u.email}</td>
                <td className="py-1.5 pr-4 dark:text-slate-200">
                  {u.role === "ADMIN" ? "管理者" : "閲覧者"}
                </td>
                <td className="py-1.5 pr-4 text-slate-500 dark:text-slate-400">
                  {formatDateTime(u.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className={cardClass}>
        <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
          未承諾の招待
        </h2>
        {invites.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500">未承諾の招待はありません。</p>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="text-left text-xs text-slate-400 dark:text-slate-500">
              <tr>
                <th className="py-1 pr-4">メールアドレス</th>
                <th className="py-1 pr-4">権限</th>
                <th className="py-1 pr-4">有効期限</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {invites.map((i) => (
                <tr key={i.id}>
                  <td className="py-1.5 pr-4 dark:text-slate-200">{i.email}</td>
                  <td className="py-1.5 pr-4 dark:text-slate-200">
                    {i.role === "ADMIN" ? "管理者" : "閲覧者"}
                  </td>
                  <td className="py-1.5 pr-4 text-slate-500 dark:text-slate-400">
                    {formatDateTime(i.expiresAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
