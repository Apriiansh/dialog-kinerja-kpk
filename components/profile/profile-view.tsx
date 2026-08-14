"use client";

import { useState } from "react";
import {
  IdentificationBadgeIcon,
  PencilSimpleIcon,
  LockKeyIcon,
  GearSixIcon,
} from "@phosphor-icons/react";
import { ProfileHeader } from "./profile-header";
import { ProfileInfoCards } from "./profile-info-cards";
import { EditProfileForm } from "./edit-profile-form";
import { ChangePasswordForm } from "./change-password-form";
import { ProfilePreferencesForm } from "./profile-preferences-form";
import type { UserProfileData } from "@/lib/profile-queries";
import type { Role } from "@/lib/session";

type TabKey = "info" | "edit" | "password" | "preferences";

const TABS: {
  key: TabKey;
  label: string;
  icon: typeof IdentificationBadgeIcon;
}[] = [
  {
    key: "info",
    label: "Data Kepegawaian",
    icon: IdentificationBadgeIcon,
  },
  {
    key: "edit",
    label: "Perbarui Data",
    icon: PencilSimpleIcon,
  },
  {
    key: "password",
    label: "Ganti Kata Sandi",
    icon: LockKeyIcon,
  },
  {
    key: "preferences",
    label: "Pengaturan Akun",
    icon: GearSixIcon,
  },
];

export function ProfileView({
  user,
  activeRole,
  allowedRoles,
}: {
  user: UserProfileData;
  activeRole: Role;
  allowedRoles: Role[];
}) {
  const [activeTab, setActiveTab] = useState<TabKey>("info");

  return (
    <div className="flex flex-col gap-8">
      {/* Page Title & Header */}
      <header className="flex flex-col gap-2">
        <h1 className="text-[28px] font-semibold leading-9 tracking-[-0.01em] text-ink">
          Profil Pegawai
        </h1>
        <p className="text-sm leading-5 text-ink-muted">
          Informasi data induk kepegawaian, pembaharuan profil, dan keamanan akun Anda.
        </p>
      </header>

      {/* Profile Header Hero */}
      <ProfileHeader user={user} activeRole={activeRole} />

      {/* Tabs Navigation */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center gap-2 border-b border-outline pb-3">
          {TABS.map(({ key, label, icon: Icon }) => {
            const isActive = activeTab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`inline-flex items-center gap-2 rounded-md px-3.5 py-2 text-xs font-semibold transition-colors ${
                  isActive
                    ? "bg-primary text-on-primary shadow-xs"
                    : "border border-outline bg-surface text-ink-muted hover:border-primary hover:text-primary"
                }`}
              >
                <Icon size={16} weight={isActive ? "bold" : "regular"} />
                {label}
              </button>
            );
          })}
        </div>

        {/* Tab Contents */}
        <div>
          {activeTab === "info" && <ProfileInfoCards user={user} />}
          {activeTab === "edit" && <EditProfileForm user={user} />}
          {activeTab === "password" && <ChangePasswordForm />}
          {activeTab === "preferences" && (
            <ProfilePreferencesForm
              user={user}
              allowedRoles={allowedRoles}
            />
          )}
        </div>
      </div>
    </div>
  );
}
