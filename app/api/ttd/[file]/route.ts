import { readFile } from "node:fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestSession } from "@/lib/session";
import { resolveTtdFile } from "@/lib/ttd";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ file: string }> },
) {
  const { file } = await params;

  const session = await getRequestSession(request);
  if (!session?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const filePath = resolveTtdFile(`/api/ttd/${file}`);
  if (!filePath) {
    return new NextResponse("Not found", { status: 404 });
  }

  const match = /^ttd-(\d+)-(pegawai|atasan)-[\d]+\.png$/.exec(file);
  const dialogId = match ? Number(match[1]) : NaN;
  if (Number.isNaN(dialogId)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const dialog = await prisma.dialogKinerja.findFirst({
    where: { id: dialogId },
    select: { id_pegawai: true, id_atasan: true },
  });
  if (!dialog) {
    return new NextResponse("Not found", { status: 404 });
  }

  const isOwner =
    session.id === dialog.id_pegawai || session.id === dialog.id_atasan;
  if (!isOwner && session.role !== "ADMIN") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const data = await readFile(filePath);
    return new NextResponse(data, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "private, no-cache",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
