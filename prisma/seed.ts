import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const rawEmail = process.env.ADMIN_EMAIL;
  const name = process.env.ADMIN_NAME ?? "管理者";
  const password = process.env.ADMIN_PASSWORD;

  if (!rawEmail || !password) {
    console.log(
      "ADMIN_EMAIL / ADMIN_PASSWORD が未設定のため、初期管理者の作成をスキップしました。"
    );
    return;
  }

  // ログイン時はメールアドレスを小文字化して照合するため、保存時も揃える
  const email = rawEmail.toLowerCase().trim();

  const passwordHash = await bcrypt.hash(password, 12);
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    await prisma.user.update({
      where: { email },
      data: { name, passwordHash, role: "ADMIN" },
    });
    console.log(`既存の管理者 ${email} のパスワードを ADMIN_PASSWORD の値に同期しました。`);
    return;
  }

  await prisma.user.create({
    data: { email, name, passwordHash, role: "ADMIN" },
  });

  console.log(`初期管理者を作成しました: ${email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
