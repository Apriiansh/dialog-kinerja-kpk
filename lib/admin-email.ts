import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

function baseTemplate(content: string) {
  return `
    <div style="margin:0;padding:0;background:#f4f5f7;font-family:Arial,Helvetica,sans-serif;">
      <div style="max-width:640px;margin:0 auto;padding:32px 16px;">

        <div style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">

          <div style="background:#111827;padding:22px 28px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="vertical-align:middle;">
                  <img
                    src="https://spipendidikan.kpk.go.id/dash/assets/spip/img/LOGO-KPK-putih.png"
                    alt="KPK"
                    width="72"
                    style="display:block;width:72px;height:auto;"
                  />
                </td>
                <td style="text-align:right;vertical-align:middle;">
                  <div style="color:#ffffff;font-size:14px;font-weight:bold;">
                    Dialog Kinerja
                  </div>
                  <div style="color:#9ca3af;font-size:11px;margin-top:4px;">
                    Notifikasi Admin
                  </div>
                </td>
              </tr>
            </table>
          </div>

          <div style="padding:32px 28px;">
            ${content}
          </div>

          <div style="
            background:#f9fafb;
            border-top:1px solid #e5e7eb;
            padding:18px 28px;
            text-align:center;
          ">
            <p style="margin:0 0 5px;color:#6b7280;font-size:11px;">
              Dialog Kinerja
            </p>
            <p style="margin:0;color:#9ca3af;font-size:10px;">
              Email ini dikirim secara otomatis oleh sistem.
              Mohon tidak membalas email ini. Aplikasi ini masih dalam proses pengembangan, jadi abaikan pesan ini jika Anda bukan pengguna aplikasi Dialog Kinerja.
            </p>
            <p style="margin:8px 0 0;color:#9ca3af;font-size:10px;">
              developer.dialogkinerja
            </p>
          </div>

        </div>

      </div>
    </div>
  `;
}

function infoRow(label: string, value: string) {
  return `
    <tr>
      <td style="padding:8px 0;color:#6b7280;font-size:13px;white-space:nowrap;vertical-align:top;">
        ${label}
      </td>
      <td style="padding:8px 0;color:#1f2937;font-size:13px;font-weight:500;">
        ${value}
      </td>
    </tr>
  `;
}

function dialogBaruTemplate(
  atasan: string,
  pegawai: string,
  periode: string,
  triwulan: string,
) {
  return `
    <p style="margin:0 0 8px;color:#111827;font-size:16px;">
      Halo <strong>Admin</strong>,
    </p>
    <p style="margin:0 0 24px;color:#4b5563;font-size:14px;line-height:1.7;">
      Sebuah dialog kinerja baru telah dibuat oleh atasan.
    </p>

    <div style="
      background:#f9fafb;
      border:1px solid #e5e7eb;
      border-radius:8px;
      padding:18px;
      margin-bottom:24px;
    ">
      <div style="color:#6b7280;font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">
        Detail Aktivitas
      </div>
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        ${infoRow("Atasan", atasan)}
        ${infoRow("Pegawai", pegawai)}
        ${infoRow("Periode", periode)}
        ${infoRow("Triwulan", triwulan)}
        ${infoRow("Status", "Draft Atasan")}
      </table>
    </div>

    <div style="text-align:center;margin:28px 0;">
      <a
        href="${process.env.NEXT_PUBLIC_APP_URL}/admin/monitoring"
        style="
          display:inline-block;
          background:#111827;
          color:#ffffff;
          text-decoration:none;
          font-size:13px;
          font-weight:bold;
          padding:12px 22px;
          border-radius:7px;
        "
      >
        Lihat Monitoring
      </a>
    </div>

    <p style="margin:0;color:#6b7280;font-size:12px;line-height:1.6;text-align:center;">
      Silakan masuk ke aplikasi Dialog Kinerja untuk melihat detail aktivitas terbaru.
    </p>
  `;
}

function dialogSelesaiTemplate(
  atasan: string,
  pegawai: string,
  periode: string,
  triwulan: string,
) {
  return `
    <p style="margin:0 0 8px;color:#111827;font-size:16px;">
      Halo <strong>Admin</strong>,
    </p>
    <p style="margin:0 0 24px;color:#4b5563;font-size:14px;line-height:1.7;">
      Sebuah dialog kinerja telah selesai setelah divalidasi oleh kedua belah pihak.
    </p>

    <div style="
      background:#f9fafb;
      border:1px solid #e5e7eb;
      border-radius:8px;
      padding:18px;
      margin-bottom:24px;
    ">
      <div style="color:#6b7280;font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">
        Detail Aktivitas
      </div>
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        ${infoRow("Atasan", atasan)}
        ${infoRow("Pegawai", pegawai)}
        ${infoRow("Periode", periode)}
        ${infoRow("Triwulan", triwulan)}
        ${infoRow("Status", "Selesai")}
      </table>
    </div>

    <div style="text-align:center;margin:28px 0;">
      <a
        href="${process.env.NEXT_PUBLIC_APP_URL}/admin/monitoring"
        style="
          display:inline-block;
          background:#111827;
          color:#ffffff;
          text-decoration:none;
          font-size:13px;
          font-weight:bold;
          padding:12px 22px;
          border-radius:7px;
        "
      >
        Lihat Monitoring
      </a>
    </div>

    <p style="margin:0;color:#6b7280;font-size:12px;line-height:1.6;text-align:center;">
      Silakan masuk ke aplikasi Dialog Kinerja untuk melihat detail aktivitas terbaru.
    </p>
  `;
}

function reviuBaruTemplate(
  atasan: string,
  pegawai: string,
  periode: string,
  triwulan: string,
) {
  return `
    <p style="margin:0 0 8px;color:#111827;font-size:16px;">
      Halo <strong>Admin</strong>,
    </p>
    <p style="margin:0 0 24px;color:#4b5563;font-size:14px;line-height:1.7;">
      Sebuah reviu baru telah dikirim oleh pegawai dan menunggu review atasan.
    </p>

    <div style="
      background:#f9fafb;
      border:1px solid #e5e7eb;
      border-radius:8px;
      padding:18px;
      margin-bottom:24px;
    ">
      <div style="color:#6b7280;font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">
        Detail Aktivitas
      </div>
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        ${infoRow("Pegawai", pegawai)}
        ${infoRow("Atasan", atasan)}
        ${infoRow("Periode", periode)}
        ${infoRow("Triwulan", triwulan)}
        ${infoRow("Status", "Menunggu Atasan")}
      </table>
    </div>

    <div style="text-align:center;margin:28px 0;">
      <a
        href="${process.env.NEXT_PUBLIC_APP_URL}/admin/monitoring"
        style="
          display:inline-block;
          background:#111827;
          color:#ffffff;
          text-decoration:none;
          font-size:13px;
          font-weight:bold;
          padding:12px 22px;
          border-radius:7px;
        "
      >
        Lihat Monitoring
      </a>
    </div>

    <p style="margin:0;color:#6b7280;font-size:12px;line-height:1.6;text-align:center;">
      Silakan masuk ke aplikasi Dialog Kinerja untuk melihat detail aktivitas terbaru.
    </p>
  `;
}

function reviuSelesaiTemplate(
  atasan: string,
  pegawai: string,
  periode: string,
  triwulan: string,
) {
  return `
    <p style="margin:0 0 8px;color:#111827;font-size:16px;">
      Halo <strong>Admin</strong>,
    </p>
    <p style="margin:0 0 24px;color:#4b5563;font-size:14px;line-height:1.7;">
      Sebuah reviu telah selesai setelah divalidasi oleh pegawai.
    </p>

    <div style="
      background:#f9fafb;
      border:1px solid #e5e7eb;
      border-radius:8px;
      padding:18px;
      margin-bottom:24px;
    ">
      <div style="color:#6b7280;font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">
        Detail Aktivitas
      </div>
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        ${infoRow("Pegawai", pegawai)}
        ${infoRow("Atasan", atasan)}
        ${infoRow("Periode", periode)}
        ${infoRow("Triwulan", triwulan)}
        ${infoRow("Status", "Selesai")}
      </table>
    </div>

    <div style="text-align:center;margin:28px 0;">
      <a
        href="${process.env.NEXT_PUBLIC_APP_URL}/admin/monitoring"
        style="
          display:inline-block;
          background:#111827;
          color:#ffffff;
          text-decoration:none;
          font-size:13px;
          font-weight:bold;
          padding:12px 22px;
          border-radius:7px;
        "
      >
        Lihat Monitoring
      </a>
    </div>

    <p style="margin:0;color:#6b7280;font-size:12px;line-height:1.6;text-align:center;">
      Silakan masuk ke aplikasi Dialog Kinerja untuk melihat detail aktivitas terbaru.
    </p>
  `;
}

async function getAdminEmails(): Promise<string[]> {
  const admins = await prisma.user.findMany({
    where: { is_admin: true, is_active: true, email: { not: null } },
    select: { email: true },
  });
  return admins.map((a) => a.email!).filter(Boolean);
}

export async function notifyAdminsEmail({
  subject,
  html,
}: {
  subject: string;
  html: string;
}) {
  try {
    const emails = await getAdminEmails();
    if (emails.length === 0) return;

    const wrappedHtml = baseTemplate(html);

    await Promise.allSettled(
      emails.map((email) =>
        sendEmail({ to: email, subject, html: wrappedHtml }),
      ),
    );
  } catch (e) {
    console.error("Gagal kirim email notifikasi admin:", e);
  }
}

export async function notifyAdminsDialogBaru({
  atasan,
  pegawai,
  periode,
  triwulan,
}: {
  atasan: string;
  pegawai: string;
  periode: string;
  triwulan: string;
}) {
  return notifyAdminsEmail({
    subject: `Dialog Kinerja Baru Dibuat | Dialog Kinerja`,
    html: dialogBaruTemplate(atasan, pegawai, periode, triwulan),
  });
}

export async function notifyAdminsDialogSelesai({
  atasan,
  pegawai,
  periode,
  triwulan,
}: {
  atasan: string;
  pegawai: string;
  periode: string;
  triwulan: string;
}) {
  return notifyAdminsEmail({
    subject: `Dialog Kinerja Selesai | Dialog Kinerja`,
    html: dialogSelesaiTemplate(atasan, pegawai, periode, triwulan),
  });
}

export async function notifyAdminsReviuBaru({
  atasan,
  pegawai,
  periode,
  triwulan,
}: {
  atasan: string;
  pegawai: string;
  periode: string;
  triwulan: string;
}) {
  return notifyAdminsEmail({
    subject: `Reviu Baru Dikirim | Dialog Kinerja`,
    html: reviuBaruTemplate(atasan, pegawai, periode, triwulan),
  });
}

export async function notifyAdminsReviuSelesai({
  atasan,
  pegawai,
  periode,
  triwulan,
}: {
  atasan: string;
  pegawai: string;
  periode: string;
  triwulan: string;
}) {
  return notifyAdminsEmail({
    subject: `Reviu Selesai | Dialog Kinerja`,
    html: reviuSelesaiTemplate(atasan, pegawai, periode, triwulan),
  });
}
