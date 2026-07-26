const OpenAI = require("openai");

let client = null;
function getClient() {
  if (!client) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not set in .env");
    }
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

const SYSTEM_PROMPT = `You are an expert assessment designer for Nigerian tertiary-level
General Studies (GST) courses. Given a passage of course material, generate high-quality
multiple-choice questions (MCQs) that test genuine understanding, not just word-matching.

Rules:
- Each question must have exactly 4 options.
- Exactly one option is correct.
- Distractors must be plausible and related to the topic, not random or absurd.
- Include a short explanation (1-2 sentences) for why the correct answer is correct.
- Vary cognitive level across questions where possible (recall, application, analysis),
  in line with Bloom's Taxonomy.
- Base every question strictly on the provided passage. Do not invent facts not present
  or reasonably implied in the text.
- Return ONLY valid JSON, no markdown fences, no commentary.

Output JSON schema:
{
  "questions": [
    {
      "questionText": string,
      "options": [string, string, string, string],
      "correctIndex": number (0-3),
      "explanation": string,
      "difficulty": "easy" | "medium" | "hard"
    }
  ]
}`;

/**
 * Generate MCQs from a single chunk of course text.
 * @param {string} chunkText
 * @param {number} count - approximate number of questions to generate for this chunk
 */
async function generateQuestionsFromChunk(chunkText, count = 4) {
  const openai = getClient();
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  const response = await openai.chat.completions.create({
    model,
    temperature: 0.4,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Generate approximately ${count} multiple-choice questions from this passage:\n\n${chunkText}`,
      },
    ],
  });

  const raw = response.choices[0]?.message?.content || "{}";
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    throw new Error("AI returned malformed JSON for question generation");
  }

  const questions = Array.isArray(parsed.questions) ? parsed.questions : [];

  // Validate and normalize each question defensively
  return questions
    .filter(
      (q) =>
        q &&
        typeof q.questionText === "string" &&
        Array.isArray(q.options) &&
        q.options.length === 4 &&
        Number.isInteger(q.correctIndex) &&
        q.correctIndex >= 0 &&
        q.correctIndex <= 3
    )
    .map((q) => ({
      questionText: q.questionText.trim(),
      options: q.options.map((o) => String(o).trim()),
      correctIndex: q.correctIndex,
      explanation: (q.explanation || "").trim(),
      difficulty: ["easy", "medium", "hard"].includes(q.difficulty) ? q.difficulty : "medium",
    }));
}

/**
 * Generate MCQs across multiple chunks and de-duplicate near-identical questions.
 */
async function generateQuestionsFromChunks(chunks, questionsPerChunk = 4) {
  const all = [];
  for (const chunk of chunks) {
    try {
      const qs = await generateQuestionsFromChunk(chunk, questionsPerChunk);
      all.push(...qs);
    } catch (err) {
      console.error("[ai] chunk generation failed:", err.message);
      // continue with other chunks rather than failing the whole batch
    }
  }
  return deduplicate(all);
}

function deduplicate(questions) {
  const seen = new Set();
  return questions.filter((q) => {
    const key = q.questionText.toLowerCase().replace(/\s+/g, " ").trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

module.exports = { generateQuestionsFromChunk, generateQuestionsFromChunks };
