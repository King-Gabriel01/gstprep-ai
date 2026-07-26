const fs = require("fs");
const pdfParse = require("pdf-parse");

/**
 * Extract raw text from a PDF file on disk.
 */
async function extractTextFromPdf(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(dataBuffer);
  return cleanText(data.text);
}

/**
 * Basic cleanup: collapse whitespace, strip control characters.
 */
function cleanText(raw) {
  return raw
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Split long text into semantically-sized chunks so each request to the
 * LLM stays within a manageable context window (see project chapter 2.7.2).
 * Chunks are split on paragraph boundaries where possible.
 */
function chunkText(text, maxChars = 3000) {
  const paragraphs = text.split(/\n\n+/).filter(Boolean);
  const chunks = [];
  let current = "";

  for (const para of paragraphs) {
    if ((current + "\n\n" + para).length > maxChars && current.length > 0) {
      chunks.push(current.trim());
      current = para;
    } else {
      current = current ? `${current}\n\n${para}` : para;
    }
  }
  if (current.trim()) chunks.push(current.trim());

  // Fallback: if a single paragraph is itself too long, hard-split it
  return chunks.flatMap((chunk) => {
    if (chunk.length <= maxChars) return [chunk];
    const parts = [];
    for (let i = 0; i < chunk.length; i += maxChars) {
      parts.push(chunk.slice(i, i + maxChars));
    }
    return parts;
  });
}

module.exports = { extractTextFromPdf, cleanText, chunkText };
