import { NextRequest, NextResponse } from "next/server";
import { getChatMessages, sendChatMessage } from "@/lib/actions/chat";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const dialogIdStr = url.searchParams.get("dialogId");
  const dialogId = dialogIdStr ? Number(dialogIdStr) : NaN;

  if (Number.isNaN(dialogId)) {
    return NextResponse.json(
      { success: false, error: "Invalid dialogId" },
      { status: 400 },
    );
  }

  const result = await getChatMessages(dialogId);
  if (!result.success) {
    return NextResponse.json(result, {
      status: result.error === "Unauthorized" || result.error === "Akses ditolak" ? 403 : 500,
    });
  }

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  try {
    let dialogId: number | undefined;
    let content: string | undefined;

    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await request.json();
      dialogId = Number(body.dialogId);
      content = body.content;
    } else {
      const formData = await request.formData();
      dialogId = Number(formData.get("dialogId"));
      content = formData.get("content")?.toString();
    }

    if (!dialogId || Number.isNaN(dialogId) || !content) {
      return NextResponse.json(
        { success: false, error: "dialogId dan content harus diisi" },
        { status: 400 },
      );
    }

    const result = await sendChatMessage(dialogId, content);
    if (!result.success) {
      return NextResponse.json(result, {
        status: result.error === "Unauthorized" || result.error === "Akses ditolak" ? 403 : 500,
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in POST /api/chat:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server" },
      { status: 500 },
    );
  }
}