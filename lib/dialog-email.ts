import { sendEmail } from "@/lib/email";

function submissionEmailHtml({
  atasanName,
  pegawaiName,
  periode,
  link,
  isLanjutan,
  jadwalDialog,
  deskripsiPegawai,
}: {
  atasanName: string;
  pegawaiName: string;
  periode: string;
  link: string;
  isLanjutan?: boolean;
  jadwalDialog?: string;
  deskripsiPegawai?: string | null;
}) {
  const badgeText = isLanjutan ? "Dialog Kinerja Lanjutan" : "Dialog Kinerja";
  const headerTitle = isLanjutan
    ? "Pengajuan dialog kinerja lanjutan siap ditinjau"
    : "Pengajuan baru dari pegawai siap ditinjau";
  const bodyText = isLanjutan
    ? `<strong>${pegawaiName}</strong> telah mengajukan <strong>Dialog Kinerja Lanjutan</strong> untuk periode <strong>${periode}</strong>.`
    : `<strong>${pegawaiName}</strong> telah mengajukan Dialog Kinerja untuk periode <strong>${periode}</strong>.`;

  return `
    <div style="margin:0;padding:0;background:#f5f2ec;font-family:Arial,Helvetica,sans-serif;">
      <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
        Pengajuan dialog kinerja ${isLanjutan ? "lanjutan " : ""}dari ${pegawaiName} untuk ${periode}.
      </div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f2ec;padding:32px 16px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:680px;background:#ffffff;border:1px solid #e7dfd3;border-radius:18px;overflow:hidden;box-shadow:0 14px 40px rgba(25,20,16,0.08);">
              <tr>
                <td style="background:#c8102e;padding:28px 32px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="vertical-align:middle;">
                        <div style="display:inline-block;padding:7px 12px;border-radius:999px;background:rgba(255,255,255,0.16);color:#ffffff;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">
                          ${badgeText}
                        </div>
                        <div style="margin-top:14px;color:#ffffff;font-size:22px;line-height:1.25;font-weight:700;max-width:420px;">
                          ${headerTitle}
                        </div>
                        <div style="margin-top:8px;color:rgba(255,255,255,0.88);font-size:14px;line-height:1.6;max-width:480px;">
                          Ada pengajuan dialog kinerja yang masuk dan menunggu review Anda.
                        </div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <tr>
                <td style="padding:30px 32px 18px 32px;color:#241f1a;">
                  <div style="font-size:15px;line-height:1.7;margin-bottom:18px;">
                    Halo <strong>${atasanName}</strong>,
                  </div>

                  <div style="font-size:14px;line-height:1.75;color:#4b443c;margin-bottom:22px;">
                    ${bodyText}
                    Silakan buka detail pengajuan untuk meninjau jadwal serta catatan dan melanjutkan proses review.
                  </div>

                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
                    <tr>
                      <td style="padding:0 0 12px 0;">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #ebe3d8;border-radius:14px;background:#fbf9f6;">
                          <tr>
                            <td style="padding:14px 16px 12px 16px;">
                              <div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#8a7f74;margin-bottom:4px;">Pegawai</div>
                              <div style="font-size:15px;font-weight:700;color:#1f1914;line-height:1.5;">${pegawaiName}</div>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:0 0 12px 0;">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #ebe3d8;border-radius:14px;background:#fbf9f6;">
                          <tr>
                            <td style="padding:14px 16px 12px 16px;">
                              <div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#8a7f74;margin-bottom:4px;">Periode</div>
                              <div style="font-size:15px;font-weight:700;color:#1f1914;line-height:1.5;">${periode}</div>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    ${
                      jadwalDialog
                        ? `
                    <tr>
                      <td style="padding:0 0 12px 0;">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #ebe3d8;border-radius:14px;background:#fbf9f6;">
                          <tr>
                            <td style="padding:14px 16px 12px 16px;">
                              <div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#8a7f74;margin-bottom:4px;">Rencana Jadwal Pelaksanaan</div>
                              <div style="font-size:15px;font-weight:700;color:#1f1914;line-height:1.5;">${jadwalDialog}</div>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>`
                        : ""
                    }
                    ${
                      deskripsiPegawai
                        ? `
                    <tr>
                      <td style="padding:0 0 12px 0;">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #ebe3d8;border-radius:14px;background:#fbf9f6;">
                          <tr>
                            <td style="padding:14px 16px 12px 16px;">
                              <div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#8a7f74;margin-bottom:4px;">Catatan / Konteks Pengajuan</div>
                              <div style="font-size:14px;color:#241f1a;line-height:1.6;white-space:pre-wrap;">${deskripsiPegawai}</div>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>`
                        : ""
                    }
                    <tr>
                      <td>
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #ebe3d8;border-radius:14px;background:#fbf9f6;">
                          <tr>
                            <td style="padding:14px 16px 12px 16px;">
                              <div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#8a7f74;margin-bottom:4px;">Status</div>
                              <div style="font-size:15px;font-weight:700;color:#1f1914;line-height:1.5;">Menunggu review atasan</div>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px 0;">
                    <tr>
                      <td align="center" style="border-radius:999px;background:#c8102e;">
                        <a href="${link}" style="display:inline-block;padding:13px 24px;font-size:14px;font-weight:700;line-height:1;color:#ffffff;text-decoration:none;">Buka Pengajuan</a>
                      </td>
                    </tr>
                  </table>

                  <div style="font-size:12px;line-height:1.7;color:#7b7269;border-top:1px solid #ece3d7;padding-top:16px;">
                    Email ini dikirim otomatis oleh sistem Dialog Kinerja. Jika Anda tidak sedang bertugas sebagai atasan terkait, abaikan pesan ini.
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `;
}

export async function sendDialogSubmissionEmail({
  to,
  atasanName,
  pegawaiName,
  periode,
  link,
  isLanjutan,
  jadwalDialog,
  deskripsiPegawai,
}: {
  to: string;
  atasanName: string;
  pegawaiName: string;
  periode: string;
  link: string;
  isLanjutan?: boolean;
  jadwalDialog?: string;
  deskripsiPegawai?: string | null;
}) {
  const subjectPrefix = isLanjutan
    ? "Pengajuan Dialog Kinerja Lanjutan"
    : "Pengajuan Dialog Kinerja Baru";
  return sendEmail({
    to,
    subject: `${subjectPrefix} (${periode}) - ${pegawaiName} | Dialog Kinerja`,
    html: submissionEmailHtml({
      atasanName,
      pegawaiName,
      periode,
      link,
      isLanjutan,
      jadwalDialog,
      deskripsiPegawai,
    }),
  });
}
