import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const name = process.env.ADMIN_NAME ?? "管理者";
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.log(
      "ADMIN_EMAIL / ADMIN_PASSWORD が未設定のため、初期管理者の作成をスキップしました。"
    );
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`既に ${email} は登録済みです。スキップしました。`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
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
