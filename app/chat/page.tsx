import { requireAuth, homePathForRole } from "@/lib/auth/session";
import { getChatHistory } from "@/lib/chat-queries";
import { ChatHistoryClient } from "./chat-history-client";

export const metadata = {
  title: "Riwayat Chat",
  description: "Riwayat percakapan dialog kinerja",
};

export default async function ChatHistoryPage() {
  const session = await requireAuth();
  const history = await getChatHistory(session);

  return (
    <ChatHistoryClient
      items={history}
      homePath={homePathForRole(session.role)}
    />
  );
}