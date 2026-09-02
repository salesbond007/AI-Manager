import { prisma } from "@/lib/prisma";
import { AcceptInviteForm } from "./AcceptInviteForm";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invite = await prisma.invite.findUnique({ where: { token } });

  const isInvalid = !invite || invite.acceptedAt || invite.expiresAt < new Date();

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-xl font-semibold text-slate-900">
          招待の受諾
        </h1>
        {isInvalid ? (
          <p className="mt-4 text-sm text-red-600">
            この招待リンクは無効か、有効期限が切れています。管理者に再発行を依頼してください。
          </p>
        ) : (
          <>
            <p className="mb-6 text-sm text-slate-500">
              アカウント情報を入力してください。
            </p>
            <AcceptInviteForm token={token} email={invite.email} />
          </>
        )}
      </div>
    </div>
  );
}
