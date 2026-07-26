const fs = require('fs');
const pdfParse = require('pdf-parse');

/**
 * Extracts raw text and metadata from a PDF file on disk.
 */
async function extractTextFromPdf(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  const result = await pdfParse(dataBuffer);

  const cleanedText = cleanText(result.text);

  return {
    text: cleanedText,
    pageCount: result.numpages || 0,
    charCount: cleanedText.length,
  };
}

/**
 * Basic cleanup: collapse excessive whitespace, strip control characters,
 * normalize line breaks so downstream chunking works on readable text.
 */
function cleanText(rawText) {
  return rawText
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Splits long extracted text into semantically manageable chunks so each
 * chunk stays within a safe size for the LLM prompt (per the chunking
 * strategy described in the project's methodology chapter).
 *
 * Chunking is paragraph-aware: it tries to keep paragraphs whole and only
 * splits mid-paragraph if a single paragraph exceeds the chunk size.
 */
function chunkText(text, maxCharsPerChunk = 3000) {
  const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const chunks = [];
  let current = '';

  for (const para of paragraphs) {
    if (para.length > maxCharsPerChunk) {
      // Flush whatever we have, then hard-split the oversized paragraph.
      if (current) {
        chunks.push(current.trim());
        current = '';
      }
      for (let i = 0; i < para.length; i += maxCharsPerChunk) {
        chunks.push(para.slice(i, i + maxCharsPerChunk));
      }
      continue;
    }

    if ((current + '\n\n' + para).length > maxCharsPerChunk) {
      chunks.push(current.trim());
      current = para;
    } else {
      current = current ? `${current}\n\n${para}` : para;
    }
  }

  if (current.trim()) chunks.push(current.trim());

  return chunks.filter((c) => c.length > 50); // discard near-empty scraps
}

module.exports = { extractTextFromPdf, chunkText, cleanText };
