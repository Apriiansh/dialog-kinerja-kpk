import HTMLtoDOCX from "html-to-docx";
import { generateDialogKinerjaWord, generateReviuWord } from "@/lib/export/word-legacy";

/**
 * Generate native binary .docx for Dialog Kinerja
 */
export async function generateDialogKinerjaDocx(
  dialogId: number,
  sessionUserId: number,
  sessionRole: string,
): Promise<{ filename: string; buffer: Buffer }> {
  const { filename: oldFilename, html } = await generateDialogKinerjaWord(
    dialogId,
    sessionUserId,
    sessionRole,
  );

  const filename = oldFilename.replace(/\.doc$/, ".docx");

  const docxBlob = await HTMLtoDOCX(html, undefined, {
    table: { row: { cantSplit: true } },
    footer: true,
    pageNumber: true,
  });

  const buffer = Buffer.isBuffer(docxBlob)
    ? docxBlob
    : Buffer.from(await (docxBlob as Blob).arrayBuffer());

  return { filename, buffer };
}

/**
 * Generate native binary .docx for Reviu Hasil Dialog Kinerja
 */
export async function generateReviuDocx(
  reviuId: number,
  sessionUserId: number,
  sessionRole: string,
): Promise<{ filename: string; buffer: Buffer }> {
  const { filename: oldFilename, html } = await generateReviuWord(
    reviuId,
    sessionUserId,
    sessionRole,
  );

  const filename = oldFilename.replace(/\.doc$/, ".docx");

  const docxBlob = await HTMLtoDOCX(html, undefined, {
    table: { row: { cantSplit: true } },
    footer: true,
    pageNumber: true,
  });

  const buffer = Buffer.isBuffer(docxBlob)
    ? docxBlob
    : Buffer.from(await (docxBlob as Blob).arrayBuffer());

  return { filename, buffer };
}
