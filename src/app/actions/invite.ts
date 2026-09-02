"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { auth, signIn } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { generateInviteToken } from "@/lib/invite-token";
import { revalidatePath } from "next/cache";

const INVITE_EXPIRY_DAYS = 7;

export async function createInviteAction(
  _prevState: { error?: string; success?: string; token?: string } | undefined,
  formData: FormData
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return { error: "管理者のみ招待できます。" };
  }

  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const role = String(formData.get("role") ?? "VIEWER") as "ADMIN" | "VIEWER";

  if (!email) {
    return { error: "メールアドレスを入力してください。" };
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return { error: "そのメールアドレスは既に登録されています。" };
  }

  const token = generateInviteToken();
  const expiresAt = new Date(Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  await prisma.invite.create({
    data: {
      email,
      role,
      token,
      invitedById: session.user.id,
      expiresAt,
    },
  });

  await logAudit({
    actorId: session.user.id,
    action: "INVITE_CREATED",
    detail: `${email} (${role}) を招待`,
  });

  revalidatePath("/admin/users");
  return { success: `${email} 宛の招待を作成しました。`, token };
}

export async function acceptInviteAction(
  _prevState: { error?: string } | undefined,
  formData: FormData
) {
  const token = String(formData.get("token") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("passwordConfirm") ?? "");

  if (!name || !password) {
    return { error: "名前とパスワードを入力してください。" };
  }
  if (password.length < 8) {
    return { error: "パスワードは8文字以上にしてください。" };
  }
  if (password !== passwordConfirm) {
    return { error: "パスワードが一致しません。" };
  }

  const invite = await prisma.invite.findUnique({ where: { token } });
  if (!invite || invite.acceptedAt) {
    return { error: "招待が無効です。管理者に再発行を依頼してください。" };
  }
  if (invite.expiresAt < new Date()) {
    return { error: "招待の有効期限が切れています。管理者に再発行を依頼してください。" };
  }

  const existingUser = await prisma.user.findUnique({ where: { email: invite.email } });
  if (existingUser) {
    return { error: "そのメールアドレスは既に登録されています。ログインしてください。" };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.$transaction([
    prisma.user.create({
      data: {
        email: invite.email,
        name,
        passwordHash,
        role: invite.role,
      },
    }),
    prisma.invite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    }),
  ]);

  await logAudit({
    action: "INVITE_ACCEPTED",
    detail: `${invite.email} がアカウントを作成`,
  });

  await signIn("credentials", {
    email: invite.email,
    password,
    redirectTo: "/",
  });

  return {};
}
