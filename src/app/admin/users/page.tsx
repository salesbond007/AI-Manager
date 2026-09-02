import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { InviteForm } from "./InviteForm";

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
      <h1 className="mb-1 text-xl font-semibold text-slate-900">ユーザー管理</h1>
      <p className="mb-6 text-sm text-slate-500">
        招待制でユーザーを登録します。管理者／閲覧者の権限を選べます。
      </p>

      <section className="mb-8 rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">新しく招待する</h2>
        <InviteForm origin={origin} />
      </section>

      <section className="mb-8 rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">
          登録済みユーザー
        </h2>
        <table className="min-w-full text-sm">
          <thead className="text-left text-xs text-slate-400">
            <tr>
              <th className="py-1 pr-4">名前</th>
              <th className="py-1 pr-4">メールアドレス</th>
              <th className="py-1 pr-4">権限</th>
              <th className="py-1 pr-4">登録日</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="py-1.5 pr-4">{u.name}</td>
                <td className="py-1.5 pr-4 text-slate-500">{u.email}</td>
                <td className="py-1.5 pr-4">
                  {u.role === "ADMIN" ? "管理者" : "閲覧者"}
                </td>
                <td className="py-1.5 pr-4 text-slate-500">
                  {formatDateTime(u.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">
          未承諾の招待
        </h2>
        {invites.length === 0 ? (
          <p className="text-sm text-slate-400">未承諾の招待はありません。</p>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="text-left text-xs text-slate-400">
              <tr>
                <th className="py-1 pr-4">メールアドレス</th>
                <th className="py-1 pr-4">権限</th>
                <th className="py-1 pr-4">有効期限</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invites.map((i) => (
                <tr key={i.id}>
                  <td className="py-1.5 pr-4">{i.email}</td>
                  <td className="py-1.5 pr-4">
                    {i.role === "ADMIN" ? "管理者" : "閲覧者"}
                  </td>
                  <td className="py-1.5 pr-4 text-slate-500">
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
