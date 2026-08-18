import { PAGE_SIZE } from "@/components/ui/pagination";

export function getPageParams(
  searchParams: Record<string, string | string[] | undefined>,
  exclude?: string[],
) {
  const raw = typeof searchParams.page === "string" ? searchParams.page : "1";
  const page = Math.max(1, Number(raw) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const existing: Record<string, string> = {};
  const excludeSet = new Set(exclude ?? []);
  excludeSet.add("page");
  for (const [k, v] of Object.entries(searchParams)) {
    if (excludeSet.has(k)) continue;
    if (typeof v === "string") existing[k] = v;
  }

  return { page, skip, existingParams: existing };
}
