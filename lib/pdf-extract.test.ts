import { beforeEach, describe, expect, mock, test } from "bun:test";

const destroy = mock(async () => undefined);
const documentProxy = {
  numPages: 1,
  destroy,
};
const getDocumentProxy = mock(async () => documentProxy);
const extractText = mock(async () => ({
  text: ["Resume text with email@example.com and education details"],
  totalPages: 1,
}));

mock.module("unpdf", () => ({
  extractText,
  getDocumentProxy,
}));

const {
  MAX_RESUME_PDF_PAGES,
  extractTextAndQualityFromPdf,
} = await import("./pdf-extract");

beforeEach(() => {
  documentProxy.numPages = 1;
  destroy.mockClear();
  getDocumentProxy.mockClear();
  extractText.mockClear();
  extractText.mockImplementation(async () => ({
    text: ["Resume text with email@example.com and education details"],
    totalPages: 1,
  }));
});

describe("secure PDF text extraction", () => {
  test("rejects excessive pages before extracting text", async () => {
    documentProxy.numPages = MAX_RESUME_PDF_PAGES + 1;

    await expect(
      extractTextAndQualityFromPdf(Buffer.from("%PDF-1.7")),
    ).rejects.toMatchObject({
      code: "PAGE_LIMIT",
    });
    expect(extractText).not.toHaveBeenCalled();
    expect(destroy).toHaveBeenCalledTimes(1);
  });

  test("rejects extracted text over the configured limit", async () => {
    extractText.mockImplementation(async () => ({
      text: ["A".repeat(101)],
      totalPages: 1,
    }));

    await expect(
      extractTextAndQualityFromPdf(
        Buffer.from("%PDF-1.7"),
        { maxChars: 100 },
      ),
    ).rejects.toMatchObject({
      code: "TEXT_LIMIT",
    });
    expect(destroy).toHaveBeenCalledTimes(1);
  });

  test("returns bounded text and extraction quality", async () => {
    const result = await extractTextAndQualityFromPdf(
      Buffer.from("%PDF-1.7"),
    );

    expect(result.text).toContain("--- Page 1 of 1 ---");
    expect(result.quality.pageCount).toBe(1);
    expect(result.quality.charCount).toBe(result.text.trim().length);
    expect(destroy).toHaveBeenCalledTimes(1);
  });
});
