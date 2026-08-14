import { NextRequest, NextResponse } from "next/server";
import { getRequestSession } from "@/lib/session";
import { generateDialogKinerjaWord } from "@/lib/word-export";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getRequestSession(request);
  if (!session?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  const dialogId = Number(id);
  if (Number.isNaN(dialogId)) {
    return new NextResponse("Invalid ID", { status: 400 });
  }

  try {
    const { filename, html } = await generateDialogKinerjaWord(
      dialogId,
      session.id,
      session.role,
    );

    return new NextResponse(html, {
      headers: {
        "Content-Type": "application/msword; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-cache",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan";
    return new NextResponse(message, { status: 400 });
  }
}
