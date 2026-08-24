"use client";

import { useState } from "react";
import { ChatCircleDotsIcon } from "@phosphor-icons/react";
import { ChatWidget } from "./ChatWidget";

interface ChatHeaderProps {
  dialogId: number;
  userRole: "atasan" | "pegawai" | "admin";
  partnerName?: string;
  partnerRoleLabel?: string;
  variant?: "button" | "floating-only";
}

export function ChatHeader({
  dialogId,
  userRole,
  partnerName,
  partnerRoleLabel,
  variant = "button",
}: ChatHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {variant === "button" && (
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary-soft px-3 text-xs font-semibold text-primary-strong shadow-2xs transition-colors hover:bg-primary-faint hover:text-primary active:scale-95"
          aria-label="Buka Chat Dialog"
        >
          <ChatCircleDotsIcon size={16} weight="bold" />
          <span>Chat Dialog</span>
        </button>
      )}

      <ChatWidget
        dialogId={dialogId}
        userRole={userRole}
        defaultOpen={isOpen}
        key={`${dialogId}-${isOpen}`}
        onClose={() => setIsOpen(false)}
        partnerName={partnerName}
        partnerRoleLabel={partnerRoleLabel}
      />
    </>
  );
}