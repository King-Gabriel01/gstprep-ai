import { useState } from 'react';
import { practiceApi, assessmentApi } from '../services/resources';
import { Spinner } from './Spinner';

export default function PracticeSession({ session, courseId, mode, assessmentId, onFinish }) {
  const [answers, setAnswers] = useState({});
  const [index, setIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const questions = session.questions;
  const current = questions[index];
  const answered = Object.keys(answers).length;
  const progress = ((index + 1) / questions.length) * 100;

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
    const isPass = result.scorePercent >= 50;
    return (
      <div className="max-w-2xl animate-fade-slide-up">
        <div className="card text-center py-10 relative overflow-hidden">
          <div
            className="pointer-events-none absolute inset-0 opacity-10"
            style={{
              background: isPass
                ? 'radial-gradient(circle at 50% 0%, #4A9B7F 0%, transparent 60%)'
                : 'radial-gradient(circle at 50% 0%, #C1622D 0%, transparent 60%)',
            }}
            aria-hidden="true"
          />
          <p className="relative text-xs font-mono uppercase tracking-wider text-muted">Your score</p>
          <p
            className={`relative font-display text-6xl font-semibold mt-2 animate-fade-slide-up ${
              isPass ? 'text-moss-400' : 'text-clay'
            }`}
            style={{ animationDelay: '100ms' }}
          >
            {result.scorePercent}%
          </p>
          <p className="relative mt-2 text-paper/65">
            {result.correctCount} of {result.totalQuestions} correct
          </p>
          <button onClick={onFinish} className="relative btn-primary mt-6">
            {mode === 'practice' ? 'Practice again' : 'Back to assessments'}
          </button>
        </div>

        {mode === 'practice' && result.questions && (
          <div className="mt-8 space-y-4">
            <h3 className="font-display text-xl font-semibold text-paper">Review</h3>
            {result.questions.map((q, qi) => (
              <div
                key={q.id}
                className="card animate-fade-slide-up"
                style={{ animationDelay: `${qi * 50}ms` }}
              >
                <div className="flex items-start justify-between gap-4">
                  <p className="font-medium text-paper">{q.questionText}</p>
                  <span
                    className={`pill shrink-0 border ${
                      q.isCorrect
                        ? 'bg-moss-500/10 text-moss-400 border-moss-500/25'
                        : 'bg-clay/10 text-clay border-clay/25'
                    }`}
                  >
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
                        className={`text-sm rounded-lg px-3 py-2 border transition-colors duration-200 ${
                          isCorrectOpt
                            ? 'border-moss-500 bg-moss-500/10 text-moss-300'
                            : isSelected
                            ? 'border-clay bg-clay/10 text-clay'
                            : 'border-ink-border text-paper/60'
                        }`}
                      >
                        <span className="font-mono mr-2">{opt.label}</span>
                        {opt.text}
                      </div>
                    );
                  })}
                </div>
                <p className="mt-3 text-sm text-muted italic">{q.explanation}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-end justify-between mb-2">
        <div>
          <span className="font-mono text-2xl text-paper tabular-nums">{String(index + 1).padStart(2, '0')}</span>
          <span className="font-mono text-sm text-muted"> / {String(questions.length).padStart(2, '0')}</span>
        </div>
        <p className="text-xs font-mono text-muted uppercase tracking-wider">{answered}/{questions.length} answered</p>
      </div>

      {/* Signature progress element: a filling underline, like a page being read */}
      <div className="w-full h-[3px] rounded-full bg-ink-border overflow-hidden mb-6">
        <div
          className="h-full bg-gradient-to-r from-moss-600 to-moss-400 transition-all duration-500 ease-smooth"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div key={current.id} className="card animate-fade-slide-up">
        <p className="font-medium text-lg leading-relaxed text-paper">{current.questionText}</p>
        <div className="mt-5 space-y-2">
          {current.options.map((opt) => {
            const isSelected = answers[current.id] === opt.label;
            return (
              <button
                key={opt.label}
                onClick={() => selectOption(opt.label)}
                className={`w-full text-left rounded-lg px-4 py-3 border text-sm transition-all duration-200 ease-smooth ${
                  isSelected
                    ? 'border-moss-500 bg-moss-500/10 text-moss-300 shadow-[0_0_0_1px_rgba(74,155,127,0.3)]'
                    : 'border-ink-border text-paper/80 hover:border-paper/25 hover:bg-paper/[0.03]'
                }`}
              >
                <span className={`font-mono mr-3 ${isSelected ? 'text-moss-400' : 'text-muted'}`}>{opt.label}</span>
                {opt.text}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <p className="mt-3 text-sm text-clay bg-clay/10 border border-clay/20 rounded-lg px-3 py-2 animate-fade-in">
          {error}
        </p>
      )}

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
            {submitting ? (
              <>
                <Spinner /> Submitting…
              </>
            ) : (
              'Submit'
            )}
          </button>
        )}
      </div>
    </div>
  );
}
