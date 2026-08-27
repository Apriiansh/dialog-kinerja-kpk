"use server";

import { headers } from "next/headers";
import { requestPasswordReset } from "@/lib/auth/password-reset";

export interface ForgotPasswordState {
  error?: string;
  message?: string;
}

export async function forgotPasswordAction(
  _prev: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const npp = String(formData.get("npp") ?? "").trim();

  if (!/^\d{7}$/.test(npp)) {
    return { error: "NPP harus terdiri dari 7 digit angka." };
  }

  try {
    const result = await requestPasswordReset({
      npp,
      headers: await headers(),
    });

    if (!result.ok) {
      return { error: result.error };
    }

    return { message: result.message };
  } catch {
    return {
      error: "Gagal mengirim tautan reset password. Coba lagi nanti.",
    };
  }
}
