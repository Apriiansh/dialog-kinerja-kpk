import { redirect } from "next/navigation";

export type FlashType = "success" | "error" | "info" | "warning";

export type FlashData = {
  type: FlashType;
  title: string;
  description?: string;
};

export function flashRedirect(path: string, flash: FlashData): never {
  const params = new URLSearchParams();
  params.set("flash", JSON.stringify(flash));
  const separator = path.includes("?") ? "&" : "?";
  redirect(`${path}${separator}${params.toString()}`);
}
