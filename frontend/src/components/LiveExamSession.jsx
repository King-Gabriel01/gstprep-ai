import { useState, useEffect, useCallback } from 'react';
import { useProctoring } from '../hooks/useProctoring';
import { getSocket, disconnectSocket } from '../services/socket';
import { examSessionApi } from '../services/resources';
import EnvironmentCheck from './EnvironmentCheck';
import { WarningToast, CriticalIntegrityAlert } from './ProctoringAlerts';
import { Spinner } from './Spinner';

/**
 * Full live-proctored exam flow:
 *  1. environment_check - camera + face verification gate
 *  2. in_progress - question flow with proctoring active in the background
 *  3. submitted - final score + integrity result
 */
export default function LiveExamSession({ assessmentId, onFinish }) {
  const [phase, setPhase] = useState('starting'); // starting | environment_check | in_progress | submitted | error
  const [examSessionId, setExamSessionId] = useState(null);
  const [examData, setExamData] = useState(null); // { title, durationMinutes, questions }
  const [answers, setAnswers] = useState({});
  const [index, setIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const proctoring = useProctoring({
    assessmentId,
    examSessionId,
    active: phase === 'in_progress',
  });

  // Start (or resume) the exam session on mount.
  useEffect(() => {
    (async () => {
      try {
        const res = await examSessionApi.start(assessmentId);
        setExamSessionId(res.data.examSessionId);
        setPhase(res.data.status === 'in_progress' ? 'in_progress' : 'environment_check');
      } catch (err) {
        setError(err.response?.data?.message || 'Could not start this exam.');
        setPhase('error');
      }
    })();
  }, [assessmentId]);

  // Join the socket exam room once we're actually in progress.
  useEffect(() => {
    if (phase !== 'in_progress' || !examSessionId) return undefined;
    const socket = getSocket();
    socket.emit('join-exam', { assessmentId, examSessionId });
    return () => disconnectSocket();
  }, [phase, examSessionId, assessmentId]);

  const handlePassedCheck = useCallback(async () => {
    try {
      const res = await examSessionApi.passEnvironmentCheck(examSessionId);
      setExamData(res.data);
      setPhase('in_progress');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not begin the exam.');
      setPhase('error');
    }
  }, [examSessionId]);

  function selectOption(label) {
    setAnswers((a) => ({ ...a, [examData.questions[index].id]: label }));
  }

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    setError('');
    const responses = examData.questions.map((q) => ({
      questionId: q.id,
      selectedOption: answers[q.id] || null,
    }));

    try {
      const res = await examSessionApi.submit(examSessionId, { responses });
      setResult(res.data);
      setPhase('submitted');
      disconnectSocket();
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  }, [examData, answers, examSessionId]);

  if (phase === 'starting') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <Spinner size="lg" />
        <p className="text-sm text-muted font-mono">Preparing your exam session…</p>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <p className="text-clay">{error}</p>
        <button onClick={onFinish} className="btn-secondary btn-ripple mt-6">
          Go back
        </button>
      </div>
    );
  }

  if (phase === 'environment_check') {
    return <EnvironmentCheck proctoring={proctoring} onPassed={handlePassedCheck} />;
  }

  if (phase === 'submitted') {
    const isPass = result.scorePercent >= 50;
    return (
      <div className="max-w-md mx-auto animate-fade-slide-up">
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
          <p className={`relative font-display text-6xl font-semibold mt-2 ${isPass ? 'text-moss-400' : 'text-clay'}`}>
            {result.scorePercent}%
          </p>
          <p className="relative mt-2 text-paper/65">
            {result.correctCount} of {result.totalQuestions} correct
          </p>

          <div className="relative mt-6 pt-6 border-t border-ink-border">
            <p className="text-xs font-mono uppercase tracking-wider text-muted">Integrity score</p>
            <p
              className={`mt-1 font-display text-3xl font-semibold ${
                result.integrityScore >= 70 ? 'text-moss-400' : result.integrityScore >= 40 ? 'text-gold' : 'text-clay'
              }`}
            >
              {result.integrityScore}%
            </p>
            <p className="mt-1 text-xs text-paper/50">Visible to your lecturer alongside this result.</p>
          </div>

          <button onClick={onFinish} className="relative btn-primary btn-ripple mt-6">
            Back to assessments
          </button>
        </div>
      </div>
    );
  }

  // phase === 'in_progress'
  const current = examData.questions[index];
  const answered = Object.keys(answers).length;
  const progress = ((index + 1) / examData.questions.length) * 100;

  return (
    <div className="max-w-2xl mx-auto">
      <WarningToast warning={proctoring.warning} />
      <CriticalIntegrityAlert
        show={proctoring.showCriticalAlert}
        integrityScore={proctoring.integrityScore}
        onDismiss={proctoring.dismissCriticalAlert}
        onSubmitNow={handleSubmit}
      />

      {/* Hidden video element - proctoring runs invisibly, no self-view shown */}
      <video ref={proctoring.videoRef} muted playsInline className="hidden" />

      <div className="flex items-center justify-between mb-4">
        <span className="pill bg-clay/10 text-clay border border-clay/25 text-xs font-mono">
          ● Live proctored exam
        </span>
        <span
          className={`pill text-xs font-mono border ${
            proctoring.integrityScore >= 70
              ? 'bg-moss-500/10 text-moss-400 border-moss-500/25'
              : proctoring.integrityScore >= 40
              ? 'bg-gold/10 text-gold border-gold/25'
              : 'bg-clay/10 text-clay border-clay/25'
          }`}
        >
          Integrity {proctoring.integrityScore}%
        </span>
      </div>

      <div className="flex items-end justify-between mb-2">
        <div>
          <span className="font-mono text-2xl text-paper tabular-nums">{String(index + 1).padStart(2, '0')}</span>
          <span className="font-mono text-sm text-muted"> / {String(examData.questions.length).padStart(2, '0')}</span>
        </div>
        <p className="text-xs font-mono text-muted uppercase tracking-wider">
          {answered}/{examData.questions.length} answered
        </p>
      </div>

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
          className="btn-secondary btn-ripple"
        >
          Previous
        </button>

        {index < examData.questions.length - 1 ? (
          <button onClick={() => setIndex((i) => i + 1)} className="btn-primary btn-ripple">
            Next
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={submitting} className="btn-primary btn-ripple">
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
