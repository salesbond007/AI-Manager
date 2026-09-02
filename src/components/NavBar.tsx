import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";

export function NavBar({
  user,
}: {
  user: { name?: string | null; email?: string | null; role: "ADMIN" | "VIEWER" };
}) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-sm font-semibold text-slate-900">
            AI-Manager ダッシュボード
          </Link>
          <nav className="flex items-center gap-4 text-sm text-slate-600">
            <Link href="/" className="hover:text-slate-900">
              一覧
            </Link>
            {user.role === "ADMIN" && (
              <>
                <Link href="/tools/new" className="hover:text-slate-900">
                  ツール登録
                </Link>
                <Link href="/admin/users" className="hover:text-slate-900">
                  ユーザー管理
                </Link>
                <Link href="/admin/logs" className="hover:text-slate-900">
                  操作ログ
                </Link>
              </>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <span>
            {user.name ?? user.email}
            <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">
              {user.role === "ADMIN" ? "管理者" : "閲覧者"}
            </span>
          </span>
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-md border border-slate-300 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50"
            >
              ログアウト
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
