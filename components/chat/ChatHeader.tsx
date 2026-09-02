"use client";

import { useState } from "react";
import { ChatWidget } from "./ChatWidget";

interface ChatHeaderProps {
  dialogId: string;
  userRole: "atasan" | "pegawai" | "admin";
  partnerName?: string;
  partnerRoleLabel?: string;
  defaultOpen?: boolean;
}

export function ChatHeader({
  dialogId,
  userRole,
  partnerName,
  partnerRoleLabel,
  defaultOpen = false,
}: ChatHeaderProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <ChatWidget
      dialogId={dialogId}
      userRole={userRole}
      open={isOpen}
      onOpenChange={setIsOpen}
      partnerName={partnerName}
      partnerRoleLabel={partnerRoleLabel}
    />
  );
}