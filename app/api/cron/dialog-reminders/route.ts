import { NextRequest, NextResponse } from "next/server";
import { runDialogReminderJob } from "@/lib/dialog-reminders";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const CRON_SECRET_HEADER = "x-vercel-cron";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (
    secret &&
    request.headers.get(CRON_SECRET_HEADER) !== secret
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await runDialogReminderJob();
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("Cron dialog reminder gagal:", error);
    return NextResponse.json(
      { ok: false, error: "Internal Server Error" },
      { status: 500 },
    );
  }
}