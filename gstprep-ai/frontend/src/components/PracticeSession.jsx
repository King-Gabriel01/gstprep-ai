import { useState } from 'react';
import { practiceApi, assessmentApi } from '../services/resources';
import ScoreBadge from './ScoreBadge';

export default function PracticeSession({ session, courseId, mode, assessmentId, onFinish }) {
  const [answers, setAnswers] = useState({});
  const [index, setIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const questions = session.questions;
  const current = questions[index];
  const answered = Object.keys(answers).length;

  function selectOption(label) {
    setAnswers((a) => ({ ...a, [current.id]: label }));
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError('');
    const responses = questions.map((q) => ({
      questionId: q.id,
      selectedOption: answers[q.id] || null,
    }));

    try {
      if (mode === 'practice') {
        const res = await practiceApi.submit({
          courseId,
          startedAt: session.sessionStartedAt,
          responses,
        });
        setResult(res.data);
      } else {
        const res = await assessmentApi.submit(assessmentId, {
          startedAt: session.sessionStartedAt,
          responses,
        });
        setResult(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div className="max-w-2xl">
        <div className="card text-center py-10">
          <p className="text-xs font-mono uppercase tracking-wider text-ink/50">Your score</p>
          <p className="font-display text-6xl font-semibold mt-2">{result.scorePercent}%</p>
          <p className="mt-2 text-ink/60">
            {result.correctCount} of {result.totalQuestions} correct
          </p>
          <button onClick={onFinish} className="btn-primary mt-6">
            {mode === 'practice' ? 'Practice again' : 'Back to assessments'}
          </button>
        </div>

        {mode === 'practice' && result.questions && (
          <div className="mt-8 space-y-4">
            <h3 className="font-display text-xl font-semibold">Review</h3>
            {result.questions.map((q) => (
              <div key={q.id} className="card">
                <div className="flex items-start justify-between gap-4">
                  <p className="font-medium">{q.questionText}</p>
                  <span className={`pill shrink-0 ${q.isCorrect ? 'bg-moss-100 text-moss-700' : 'bg-clay/10 text-clay'}`}>
                    {q.isCorrect ? 'Correct' : 'Incorrect'}
                  </span>
                </div>
                <div className="mt-3 grid sm:grid-cols-2 gap-2">
                  {q.options.map((opt) => {
                    const isCorrectOpt = opt.label === q.correctOption;
                    const isSelected = opt.label === q.selectedOption;
                    return (
                      <div
                        key={opt.label}
                        className={`text-sm rounded-lg px-3 py-2 border ${
                          isCorrectOpt
                            ? 'border-moss-500 bg-moss-50 text-moss-700'
                            : isSelected
                            ? 'border-clay bg-clay/5 text-clay'
                            : 'border-ink/10 text-ink/70'
                        }`}
                      >
                        <span className="font-mono mr-2">{opt.label}</span>
                        {opt.text}
                      </div>
                    );
                  })}
                </div>
                <p className="mt-3 text-sm text-ink/50 italic">{q.explanation}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-mono text-ink/50">
          Question {index + 1} of {questions.length}
        </p>
        <p className="text-sm font-mono text-ink/50">{answered}/{questions.length} answered</p>
      </div>

      <div className="w-full h-1.5 rounded-full bg-ink/10 overflow-hidden mb-6">
        <div
          className="h-full bg-moss-500 transition-all"
          style={{ width: `${((index + 1) / questions.length) * 100}%` }}
        />
      </div>

      <div className="card">
        <p className="font-medium text-lg leading-relaxed">{current.questionText}</p>
        <div className="mt-5 space-y-2">
          {current.options.map((opt) => (
            <button
              key={opt.label}
              onClick={() => selectOption(opt.label)}
              className={`w-full text-left rounded-lg px-4 py-3 border text-sm transition-colors ${
                answers[current.id] === opt.label
                  ? 'border-moss-600 bg-moss-50 text-moss-700'
                  : 'border-ink/15 hover:border-ink/30'
              }`}
            >
              <span className="font-mono mr-3">{opt.label}</span>
              {opt.text}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-clay">{error}</p>}

      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          className="btn-secondary"
        >
          Previous
        </button>

        {index < questions.length - 1 ? (
          <button onClick={() => setIndex((i) => i + 1)} className="btn-primary">
            Next
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={submitting} className="btn-primary">
            {submitting ? 'Submitting…' : 'Submit'}
          </button>
        )}
      </div>
    </div>
  );
}
