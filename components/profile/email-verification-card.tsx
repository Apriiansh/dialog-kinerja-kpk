"use client";

import { useActionState, useEffect } from "react";
import { EnvelopeSimpleIcon, CheckCircleIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { verifyEmailAction, type VerifyEmailState } from "@/lib/actions/profile";
import type { UserProfileData } from "@/lib/queries/profile";
import type { Role } from "@/lib/auth/session";

const initialState: VerifyEmailState = {};

export function EmailVerificationCard({
  user,
  activeRole,
}: {
  user: UserProfileData;
  activeRole: Role;
}) {
  const [state, formAction, pending] = useActionState(
    verifyEmailAction,
    initialState,
  );
  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [router, state.success]);

  if (activeRole === "ADMIN" || !user.email || user.email_verified_at) {
    return null;
  }

  return (
    <section className="overflow-hidden rounded-lg border border-amber-200 bg-amber-50">
      <div className="flex items-start gap-3 px-5 py-4 text-amber-950">
        <span className="mt-0.5 rounded-full bg-amber-100 p-2 text-amber-700">
          <EnvelopeSimpleIcon size={18} weight="bold" />
        </span>
        <div className="flex-1">
          <h2 className="text-sm font-semibold">Email belum diverifikasi</h2>
          <p className="mt-1 text-sm leading-5 text-amber-900/80">
            Email Anda belum diverifikasi. Ini tidak menghalangi akses fitur, tetapi
            sebaiknya ditandai terverifikasi agar status akun tetap lengkap.
          </p>

          {state.error ? (
            <div className="mt-3">
              <Banner tone="error">{state.error}</Banner>
            </div>
          ) : null}

          {state.success && state.message ? (
            <div className="mt-3">
              <Banner tone="success">{state.message}</Banner>
            </div>
          ) : null}

          <form action={formAction} className="mt-4">
            <Button
              type="submit"
              loading={pending}
              variant="outline"
              className="border-amber-300 bg-white text-amber-900 hover:border-amber-400 hover:bg-amber-100"
            >
              <CheckCircleIcon size={16} weight="bold" />
              Tandai Email Terverifikasi
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}
