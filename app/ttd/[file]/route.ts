import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ file: string }> },
) {
  const { file } = await params;

  return NextResponse.redirect(
    new URL(`/api/ttd/${file}${request.nextUrl.search}`, request.url),
    308,
  );
}