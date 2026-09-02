import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { createToolAction } from "@/app/actions/tools";
import { ToolForm } from "@/components/ToolForm";

export default async function NewToolPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-1 text-xl font-semibold text-slate-900">ツール新規登録</h1>
      <p className="mb-6 text-sm text-slate-500">
        新しく管理対象に追加するエージェント・Webアプリの情報を入力してください。
      </p>
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <ToolForm action={createToolAction} submitLabel="登録する" />
      </div>
    </div>
  );
}
