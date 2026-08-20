import Image from "next/image";
import { LoginForm } from "./login-form";
import Link from "next/link";
import {
  ArrowLeftIcon,
} from "@phosphor-icons/react/dist/ssr";

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        
        <div className="rounded-lg border border-outline bg-surface p-8 shadow-ambient sm:p-10">
          <Link href="/" className="flex items-center gap-1.5 rounded-md text-sm font-medium text-ink transition-colors hover:text-amber-400">
            <ArrowLeftIcon size={16} weight="bold" />
            Kembali
          </Link>
          <div className="mb-8 flex flex-col items-center gap-4 text-center">
            <Image
              src="/logo-kpk.png"
              alt="Logo KPK"
              width={120}
              height={30}
              priority
              className="h-auto w-34"
            />
            <div className="flex flex-col gap-1">
              <h1 className="text-[24px] font-semibold leading-8 tracking-[-0.01em] text-ink">
                Dialog Kinerja
              </h1>
              <p className="text-sm leading-5 text-ink-muted">
                Masuk untuk melakukan dialog kinerja antara atasan dan pegawai.
              </p>
            </div>
          </div>

          <LoginForm />

          <p className="mt-8 border-t border-outline pt-5 text-center text-xs leading-4 text-ink-muted">
            &copy;2026 Tim Magang Biro SDM. All rights reserved.
          </p>
        </div>
      </div>
    </main>
  );
}
