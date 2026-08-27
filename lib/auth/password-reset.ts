import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getAppBaseUrl } from "@/lib/url";
import { sendEmail } from "@/lib/email";

const RESET_TOKEN_TTL_MINUTES = 30;

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function resetEmailHtml(name: string, resetUrl: string) {
  return `
    <div style="margin:0;padding:0;background:#f4f5f7;font-family:Arial,Helvetica,sans-serif;">
      <div style="max-width:640px;margin:0 auto;padding:32px 16px;">
        <div style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
          <div style="background:#c8102e;padding:24px 28px;color:#ffffff;">
            <div style="font-size:14px;font-weight:bold;letter-spacing:.04em;text-transform:uppercase;">Dialog Kinerja</div>
            <div style="font-size:12px;margin-top:4px;opacity:.85;">Permintaan reset password</div>
          </div>
          <div style="padding:28px;">
            <p style="margin:0 0 16px 0;font-size:16px;color:#111827;">Halo ${name},</p>
            <p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;color:#374151;">
              Kami menerima permintaan reset password untuk akun Dialog Kinerja Anda.
            </p>
            <p style="margin:0 0 24px 0;font-size:14px;line-height:1.6;color:#374151;">
              Klik tombol di bawah ini untuk membuat password baru. Tautan ini berlaku selama ${RESET_TOKEN_TTL_MINUTES} menit.
            </p>
            <p style="margin:0 0 24px 0;">
              <a href="${resetUrl}" style="display:inline-block;background:#c8102e;color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;padding:12px 20px;border-radius:999px;">
                Reset Password
              </a>
            </p>
            <p style="margin:0;font-size:12px;line-height:1.6;color:#6b7280;">
              Jika Anda tidak meminta reset password, abaikan email ini.
            </p>
          </div>
        </div>
      </div>
    </div>
  `;
}

export async function requestPasswordReset({
  npp,
  headers,
}: {
  npp: string;
  headers: Headers;
}) {
  const user = await prisma.user.findUnique({
    where: { npp },
    select: { id: true, nama_pegawai: true, email: true, is_active: true },
  });

  if (!user) {
    return {
      ok: true,
      message:
        "Jika NPP terdaftar dan memiliki email aktif, tautan reset password akan dikirim.",
    };
  }

  if (!user.is_active) {
    return { ok: false, error: "Akun Anda dinonaktifkan. Hubungi admin." };
  }

  if (!user.email) {
    return {
      ok: false,
      error: "Email belum terdaftar pada akun ini. Hubungi admin.",
    };
  }

  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60_000);

  await prisma.passwordResetToken.deleteMany({
    where: { userId: user.id, usedAt: null },
  });

  const record = await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });

  const resetUrl = new URL(`/reset-password/${token}`, getAppBaseUrl(headers));

  try {
    await sendEmail({
      to: user.email,
      subject: "Reset Password Dialog Kinerja",
      html: resetEmailHtml(user.nama_pegawai, resetUrl.toString()),
    });
  } catch (error) {
    await prisma.passwordResetToken.delete({ where: { id: record.id } }).catch(() => {});
    throw error;
  }

  return {
    ok: true,
    message:
      "Jika NPP terdaftar dan memiliki email aktif, tautan reset password akan dikirim.",
  };
}

export async function resetPasswordWithToken({
  token,
  password,
}: {
  token: string;
  password: string;
}) {
  const tokenHash = hashToken(token);
  const now = new Date();

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      userId: true,
      expiresAt: true,
      usedAt: true,
      user: { select: { is_active: true } },
    },
  });

  if (!record || record.usedAt || record.expiresAt <= now) {
    return { ok: false, error: "Tautan reset password tidak valid atau sudah kedaluwarsa." };
  }

  if (!record.user.is_active) {
    return { ok: false, error: "Akun Anda dinonaktifkan. Hubungi admin." };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { password: hashedPassword },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: now },
    }),
    prisma.passwordResetToken.deleteMany({
      where: { userId: record.userId, id: { not: record.id } },
    }),
  ]);

  return { ok: true };
}
