// Uses Google Gemini API (free tier) via plain HTTPS calls.
// No extra SDK dependency needed - Node 18+ has a built-in fetch.

const GEMINI_BASE_URL = process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta';
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

const SYSTEM_PROMPT = `You are an expert academic assessment writer helping a university lecturer create multiple-choice questions (MCQs) for a General Studies (GST) course, from their own uploaded course material.

Rules you must follow strictly:
- Base every question ONLY on the provided text. Do not invent facts that aren't supported by it.
- Each question must have exactly 4 options labelled A, B, C, D.
- Exactly one option must be correct.
- Distractors (wrong options) must be plausible and related to the topic, not obviously wrong or silly.
- Write a short explanation (1-3 sentences) for why the correct answer is right.
- Vary cognitive level across the set: include some straightforward recall questions and some that require understanding or application, per Bloom's Taxonomy (remember, understand, apply, analyze).
- Assign a short topic label to each question describing the sub-topic it covers.
- Assign a difficulty of "easy", "medium", or "hard".
- Return ONLY valid JSON matching the schema below. No preamble, no markdown code fences, no commentary.

JSON schema:
{
  "questions": [
    {
      "questionText": "string",
      "options": [
        { "label": "A", "text": "string" },
        { "label": "B", "text": "string" },
        { "label": "C", "text": "string" },
        { "label": "D", "text": "string" }
      ],
      "correctOption": "A" | "B" | "C" | "D",
      "explanation": "string",
      "topic": "string",
      "difficulty": "easy" | "medium" | "hard",
      "bloomLevel": "remember" | "understand" | "apply" | "analyze"
    }
  ]
}`;

/**
 * Generates MCQs from a single chunk of course text using Google Gemini.
 * @param {string} textChunk - cleaned course material text
 * @param {number} count - approx number of questions to generate for this chunk
 */
async function generateQuestionsFromChunk(textChunk, count = 5) {
  const userPrompt = `Course material excerpt:
"""
${textChunk}
"""

Generate ${count} multiple-choice questions from the excerpt above, following the schema and rules exactly. Return only the JSON object.`;

  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set in the environment.');
  }

  const url = `${GEMINI_BASE_URL}/models/${MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: SYSTEM_PROMPT }],
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: userPrompt }],
        },
      ],
      generationConfig: {
        temperature: 0.4,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => '');
    throw new Error(`Gemini API request failed (${response.status}): ${errBody.slice(0, 300)}`);
  }

  const data = await response.json();
  const messageContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!messageContent) {
    throw new Error('Gemini response contained no message content.');
  }

  return parseQuestionsJson(messageContent);
}

/**
 * Generates questions across multiple text chunks, aggregating and
 * de-duplicating the results, per the chunking strategy in the design doc.
 *
 * Gemini's free tier has a per-minute request limit, so chunks are processed
 * sequentially with a delay, and a single retry-with-backoff on 429 responses.
 */
async function generateQuestionsFromChunks(chunks, questionsPerChunk = 5) {
  const allQuestions = [];
  const errors = [];
  const DELAY_MS = Number(process.env.GEMINI_REQUEST_DELAY_MS || 4000);

  for (let i = 0; i < chunks.length; i += 1) {
    try {
      const { questions } = await generateWithRetry(chunks[i], questionsPerChunk);
      allQuestions.push(...questions);
    } catch (err) {
      errors.push({ chunkIndex: i, message: err.message });
    }

    if (i < chunks.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  const deduped = dedupeQuestions(allQuestions);

  return { questions: deduped, errors };
}

async function generateWithRetry(chunk, count, attempt = 1) {
  try {
    return await generateQuestionsFromChunk(chunk, count);
  } catch (err) {
    const isRateLimit = err.message.includes('429');
    if (isRateLimit && attempt < 3) {
      const backoffMs = 15000 * attempt;
      await sleep(backoffMs);
      return generateWithRetry(chunk, count, attempt + 1);
    }
    throw err;
  }
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function parseQuestionsJson(rawText) {
  let jsonText = rawText.trim();

  // Defensive cleanup in case the model wraps output in a code fence despite instructions.
  if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/^```(json)?/i, '').replace(/```$/, '').trim();
  }

  let parsed;
  try {
    parsed = JSON.parse(jsonText);
  } catch (err) {
    throw new Error('Failed to parse AI response as JSON.');
  }

  if (!parsed || !Array.isArray(parsed.questions)) {
    throw new Error('AI response JSON did not match the expected schema.');
  }

  const validated = parsed.questions.filter(isValidQuestion);
  return { questions: validated };
}

function isValidQuestion(q) {
  if (!q || typeof q.questionText !== 'string' || !q.questionText.trim()) return false;
  if (!Array.isArray(q.options) || q.options.length !== 4) return false;
  const labels = q.options.map((o) => o.label);
  if (!['A', 'B', 'C', 'D'].every((l) => labels.includes(l))) return false;
  if (!['A', 'B', 'C', 'D'].includes(q.correctOption)) return false;
  if (typeof q.explanation !== 'string' || !q.explanation.trim()) return false;
  return true;
}

function dedupeQuestions(questions) {
  const seen = new Set();
  const result = [];
  for (const q of questions) {
    const key = q.questionText.trim().toLowerCase().replace(/\s+/g, ' ');
    if (!seen.has(key)) {
      seen.add(key);
      result.push(q);
    }
  }
  return result;
}

module.exports = { generateQuestionsFromChunk, generateQuestionsFromChunks };
