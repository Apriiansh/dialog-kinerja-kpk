/**
 * Get today's date in WIB (UTC+7) as ISO date string "YYYY-MM-DD".
 * Prisma @db.Date returns Date at midnight UTC, so string comparison is the safest approach.
 */
function todayWib(): string {
  const now = new Date();
  // WIB = UTC + 7 hours
  const wibTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  return wibTime.toISOString().split("T")[0]; // "YYYY-MM-DD"
}

/**
 * Convert a jadwal_dialog date to ISO date string "YYYY-MM-DD".
 */
function toIsoDate(d: Date | string): string {
  return new Date(d).toISOString().split("T")[0];
}

/**
 * Check if dialog has expired (past H+7 from jadwal_dialog).
 * Uses WIB (UTC+7) for "today" comparison.
 */
export function isDialogExpired(
  jadwalDialog: string | Date | null | undefined,
): boolean {
  if (!jadwalDialog) return false;
  const today = todayWib();
  const expiryDate = new Date(jadwalDialog);
  expiryDate.setDate(expiryDate.getDate() + 7);
  return today > toIsoDate(expiryDate);
}

/**
 * Check if jadwal_dialog date has arrived (today or later in WIB).
 * Uses WIB (UTC+7) for "today" comparison.
 */
export function isJadwalArrived(
  jadwalDialog: string | Date | null | undefined,
): boolean {
  if (!jadwalDialog) return false;
  const today = todayWib();
  return today >= toIsoDate(jadwalDialog);
}
