import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

export async function GET() {
  try {
    const info = await sendEmail({
      to: "eroashari@gmail.com",
      subject: "Test Email Dialog Kinerja",
      html: `
        <h1>Test Berhasil</h1>
        <p>Email ini dikirim langsung melalui Gmail SMTP.</p>
      `,
    });

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
    });
  } catch (error) {
    console.error("EMAIL ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: String(error),
      },
      { status: 500 }
    );
  }
}