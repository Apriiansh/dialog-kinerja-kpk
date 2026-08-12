import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";

const TTD_DIR = path.join(process.cwd(), "uploads", "ttd");
const TTD_URL_PREFIX = "/ttd/";
const PNG_DATA_URL_PREFIX = "data:image/png;base64,";

export function isPngDataUrl(value: string) {
  return (
    value.startsWith(PNG_DATA_URL_PREFIX) &&
    value.length > PNG_DATA_URL_PREFIX.length + 100
  );
}

export function ttdUrlFor(
  dialogId: number,
  role: "pegawai" | "atasan",
): string {
  return `${TTD_URL_PREFIX}ttd-${dialogId}-${role}-${Date.now()}.png`;
}

export async function saveTtdFile(
  dataUrl: string,
  dialogId: number,
  role: "pegawai" | "atasan",
): Promise<string> {
  if (!isPngDataUrl(dataUrl)) {
    throw new Error("Format tanda tangan tidak valid.");
  }

  const url = ttdUrlFor(dialogId, role);
  const base64 = dataUrl.slice(PNG_DATA_URL_PREFIX.length);
  const buffer = Buffer.from(base64, "base64");
  if (buffer.length === 0) {
    throw new Error("Tanda tangan kosong.");
  }

  await mkdir(TTD_DIR, { recursive: true });
  await writeFile(path.join(TTD_DIR, path.basename(url)), buffer, "utf8");

  return url;
}

export function resolveTtdFile(url: string): string | null {
  if (!url.startsWith(TTD_URL_PREFIX)) return null;
  const fileName = path.basename(url);
  if (!/^ttd-[\d]+-(pegawai|atasan)-[\d]+\.png$/.test(fileName)) return null;
  const filePath = path.join(TTD_DIR, fileName);
  if (!filePath.startsWith(TTD_DIR)) return null;
  return filePath;
}