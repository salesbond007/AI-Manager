import { NextRequest, NextResponse } from "next/server";
import { checkStaleTools } from "@/lib/alerts";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`;

  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const results = await checkStaleTools();
  return NextResponse.json({ ok: true, alerted: results });
}
