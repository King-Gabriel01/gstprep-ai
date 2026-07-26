import React, { useState, useEffect, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import client from "../api/client.js";
import { Button, Card } from "../components/ui.jsx";

export default function PracticeSession() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const questions = location.state?.questions || [];

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({}); // questionId -> selectedIndex
  const [submitting, setSubmitting] = useState(false);
  const startTime = useRef(Date.now());

  useEffect(() => {
    if (questions.length === 0) {
      navigate(`/student/courses/${id}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (questions.length === 0) return null;

  const q = questions[current];
  const isLast = current === questions.length - 1;
  const answeredCount = Object.keys(answers).length;

  function selectOption(index) {
    setAnswers((a) => ({ ...a, [q.id]: index }));
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const payload = {
        courseId: id,
        mode: "practice",
        durationSeconds: Math.round((Date.now() - startTime.current) / 1000),
        answers: questions.map((item) => ({
          questionId: item.id,
          selectedIndex: answers[item.id] ?? null,
        })),
      };
      const { data } = await client.post("/tests/submit", payload);
      navigate(`/student/courses/${id}/results`, { state: { result: data } });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-widest text-slatex">
        <span>
          Question {current + 1} of {questions.length}
        </span>
        <span>{answeredCount} answered</span>
      </div>

      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-ink/10">
        <div
          className="h-full bg-moss transition-all"
          style={{ width: `${((current + 1) / questions.length) * 100}%` }}
        />
      </div>

      <Card className="mt-6 p-6">
        <p className="font-display text-lg font-medium leading-snug text-ink">{q.questionText}</p>
        <div className="mt-5 space-y-2.5">
          {q.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => selectOption(i)}
              className={`block w-full rounded-sm border px-4 py-3 text-left text-sm transition-colors focus-ring ${
                answers[q.id] === i
                  ? "border-moss bg-moss/10 text-moss font-semibold"
                  : "border-ink/15 text-ink hover:border-ink/40"
              }`}
            >
              <span className="mr-2 font-mono text-xs text-slatex">
                {String.fromCharCode(65 + i)}
              </span>
              {opt}
            </button>
          ))}
        </div>
      </Card>

      <div className="mt-6 flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          disabled={current === 0}
        >
          Previous
        </Button>

        {isLast ? (
          <Button
            variant="accent"
            onClick={handleSubmit}
            disabled={submitting || answeredCount === 0}
          >
            {submitting ? "Submitting…" : "Submit test"}
          </Button>
        ) : (
          <Button onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))}>
            Next
          </Button>
        )}
      </div>
    </div>
  );
}
