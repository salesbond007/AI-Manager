import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateToolAction } from "@/app/actions/tools";
import { ToolForm } from "@/components/ToolForm";

function toDateInputValue(date: Date | null) {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

export default async function EditToolPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    redirect("/");
  }

  const { id } = await params;
  const tool = await prisma.tool.findUnique({ where: { id } });
  if (!tool) notFound();

  const boundAction = updateToolAction.bind(null, tool.id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-1 text-xl font-semibold text-slate-900">
        {tool.icon} {tool.nickname} を編集
      </h1>
      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
        <ToolForm
          action={boundAction}
          submitLabel="保存する"
          defaultValues={{
            nickname: tool.nickname,
            icon: tool.icon,
            kind: tool.kind,
            purpose: tool.purpose,
            devStatus: tool.devStatus,
            runMode: tool.runMode,
            servicesUsed: tool.servicesUsed,
            repoUrl: tool.repoUrl ?? "",
            dashboardUrl: tool.dashboardUrl ?? "",
            apiKeyScopeNote: tool.apiKeyScopeNote ?? "",
            apiKeyLastRotatedAt: toDateInputValue(tool.apiKeyLastRotatedAt),
            lastDeployedAt: toDateInputValue(tool.lastDeployedAt),
          }}
        />
      </div>
    </div>
  );
}
