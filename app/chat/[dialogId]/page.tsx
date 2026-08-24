import ChatClient from "./chat-client";

type PageProps = {
  params: Promise<{ dialogId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: PageProps) {
  const { dialogId } = await params;
  return {
    title: `Chat Dialog #${dialogId}`,
    description: `Ruang chat dialog ID: ${dialogId}`,
  };
}

export default async function Page({ params }: PageProps) {
  const { dialogId } = await params;
  return <ChatClient dialogId={dialogId} />;
}