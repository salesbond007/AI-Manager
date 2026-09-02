"use server";

import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/lib/auth";

export async function loginAction(_prevState: { error?: string } | undefined, formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const callbackUrl = String(formData.get("callbackUrl") ?? "/");

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: callbackUrl || "/",
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "メールアドレスまたはパスワードが正しくありません。" };
    }
    throw err;
  }
  return {};
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}

export async function bootstrapRedirect() {
  redirect("/");
}
