"use server";

import { flashRedirect } from "@/lib/utils/flash";
import { resetPasswordWithToken } from "@/lib/auth/password-reset";

export interface ResetPasswordState {
  error?: string;
}

export async function resetPasswordAction(
  _prev: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const token = String(formData.get("token") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  if (!token) {
    return { error: "Token reset password tidak ditemukan." };
  }

  if (!password || !confirmPassword) {
    return { error: "Password baru dan konfirmasi wajib diisi." };
  }

  if (password.length < 8) {
    return { error: "Password baru minimal 8 karakter." };
  }

  if (password !== confirmPassword) {
    return { error: "Konfirmasi password tidak sama." };
  }

  const result = await resetPasswordWithToken({ token, password });

  if (!result.ok) {
    return { error: result.error };
  }

  flashRedirect("/login", {
    type: "success",
    title: "Password berhasil diperbarui",
    description: "Silakan masuk kembali menggunakan password baru Anda.",
  });
}
