import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashApiKey } from "@/lib/api-key";
import { checkConsecutiveFailureAlert } from "@/lib/alerts";

const bodySchema = z.object({
  status: z.enum(["OK", "WARNING", "DOWN", "ERROR"]),
  message: z.string().max(2000).optional(),
  processedCount: z.number().int().nonnegative().optional(),
  successCount: z.number().int().nonnegative().optional(),
  nextRunAt: z.string().datetime().optional(),
});

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization") ?? "";
  const apiKey = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : null;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Authorization: Bearer <APIキー> ヘッダーが必要です。" },
      { status: 401 }
    );
  }

  const tool = await prisma.tool.findUnique({
    where: { reportKeyHash: hashApiKey(apiKey) },
  });
  if (!tool) {
    return NextResponse.json({ error: "APIキーが無効です。" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "リクエスト形式が不正です。", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const report = await prisma.statusReport.create({
    data: {
      toolId: tool.id,
      status: data.status,
      message: data.message,
      processedCount: data.processedCount,
      successCount: data.successCount,
      nextRunAt: data.nextRunAt ? new Date(data.nextRunAt) : undefined,
    },
  });

  await checkConsecutiveFailureAlert(tool.id);

  return NextResponse.json({ ok: true, reportId: report.id }, { status: 201 });
}
