import { RoleTag } from "@/components/shared/role-tag";
import type { UserProfileData } from "@/lib/queries/profile";
import type { Role } from "@/lib/auth/session";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

export function ProfileHeader({
  user,
  activeRole,
}: {
  user: UserProfileData;
  activeRole: Role;
}) {
  return (
    <div className="rounded-lg border border-outline bg-surface p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-on-primary">
            {initials(user.nama_pegawai)}
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold leading-tight text-ink sm:text-2xl">
                {user.nama_pegawai}
              </h1>
              <span
                className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
                  user.is_active
                    ? "bg-status-green-soft text-status-green"
                    : "bg-surface-muted text-ink-muted"
                }`}
              >
                {user.is_active ? "Aktif" : "Nonaktif"}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-ink-muted">
              <span>NPP: <strong className="font-semibold text-ink">{user.npp}</strong></span>
              {user.nip ? (
                <>
                  <span>·</span>
                  <span>NIP: {user.nip}</span>
                </>
              ) : null}
              {user.nama_jabatan ? (
                <>
                  <span>·</span>
                  <span>{user.nama_jabatan}</span>
                </>
              ) : null}
              {user.unit_kerja ? (
                <>
                  <span>·</span>
                  <span>{user.unit_kerja}</span>
                </>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-start gap-1.5 border-t border-outline pt-3 sm:items-end sm:border-t-0 sm:pt-0">
          <div className="flex flex-wrap items-center gap-1.5">
            {user.is_admin ? <RoleTag role="ADMIN" /> : null}
            {user.as_pegawai ? <RoleTag role="PEGAWAI" /> : null}
            {user._count.bawahan > 0 ? <RoleTag role="ATASAN" /> : null}
          </div>
          <span className="text-xs text-ink-muted">
            Peran Aktif: <strong className="font-semibold text-primary">{activeRole}</strong>
          </span>
        </div>
      </div>
    </div>
  );
}
