// Best-effort text extraction from uploaded documents for the AI module.
// Supports plain text/markdown directly, and attempts PDF text extraction.
// Falls back gracefully if a file type cannot be parsed.

export async function extractTextFromFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());

  if (name.endsWith(".txt") || name.endsWith(".md") || file.type.startsWith("text/")) {
    return buffer.toString("utf-8");
  }

  if (name.endsWith(".pdf") || file.type === "application/pdf") {
    try {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      await parser.destroy();
      return result.text ?? "";
    } catch (err) {
      console.error("PDF extraction failed:", err);
      throw new Error(
        "Could not extract text from this PDF automatically. Please paste the report text instead.",
      );
    }
  }

  throw new Error("Unsupported file type. Please upload a .txt, .md or .pdf file.");
}
