import { useState, useEffect, useCallback } from 'react';
import { courseApi, practiceApi, assessmentApi, analyticsApi } from '../services/resources';
import ScoreBadge from '../components/ScoreBadge';
import PracticeSession from '../components/PracticeSession';
import { Spinner, LoadingScreen } from '../components/Spinner';

const TABS = ['Practice', 'Assessments', 'My progress'];

export default function StudentCourseView({ courseId }) {
  const [course, setCourse] = useState(null);
  const [tab, setTab] = useState('Practice');

  useEffect(() => {
    courseApi.get(courseId).then((res) => setCourse(res.data.course));
  }, [courseId]);

  if (!course) return <LoadingScreen label="Loading course" />;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 animate-fade-slide-up">
      <p className="pill bg-moss-500/10 text-moss-400 border border-moss-500/25 font-mono text-xs w-fit">
        {course.courseCode}
      </p>
      <h1 className="mt-3 font-display text-3xl font-semibold text-paper">{course.title}</h1>

      <div className="mt-8 flex gap-1 border-b border-ink-border">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all duration-200 ease-smooth ${
              tab === t ? 'border-moss-400 text-moss-400' : 'border-transparent text-muted hover:text-paper/80'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === 'Practice' && <PracticeTab courseId={courseId} />}
        {tab === 'Assessments' && <AssessmentsTab courseId={courseId} />}
        {tab === 'My progress' && <ProgressTab courseId={courseId} />}
      </div>
    </div>
  );
}

// ---------------- Practice Tab ----------------
function PracticeTab({ courseId }) {
  const [session, setSession] = useState(null);
  const [count, setCount] = useState(10);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);

  const loadHistory = useCallback(() => {
    practiceApi.history(courseId).then((res) => setHistory(res.data.results));
  }, [courseId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  async function handleStart() {
    setStarting(true);
    setError('');
    try {
      const res = await practiceApi.start(courseId, count);
      setSession(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'No practice questions available yet.');
    } finally {
      setStarting(false);
    }
  }

  function handleFinish() {
    setSession(null);
    loadHistory();
  }

  if (session) {
    return (
      <PracticeSession
        session={session}
        courseId={courseId}
        mode="practice"
        onFinish={handleFinish}
      />
    );
  }

  return (
    <div>
      <div className="card max-w-md animate-fade-slide-up">
        <h3 className="font-display text-xl font-semibold text-paper">Start a practice session</h3>
        <div className="mt-4">
          <label className="label">Number of questions</label>
          <select
            className="input-field w-auto"
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
          >
            {[5, 10, 15, 20].map((n) => (
              <option key={n} value={n}>
                {n} questions
              </option>
            ))}
          </select>
        </div>
        {error && (
          <p className="mt-3 text-sm text-clay bg-clay/10 border border-clay/20 rounded-lg px-3 py-2 animate-fade-in">
            {error}
          </p>
        )}
        <button onClick={handleStart} disabled={starting} className="btn-primary mt-5 w-full">
          {starting ? (
            <>
              <Spinner /> Loading…
            </>
          ) : (
            'Start practice'
          )}
        </button>
      </div>

      <div className="mt-8">
        <h3 className="font-display text-xl font-semibold mb-3 text-paper">Recent attempts</h3>
        {history.length === 0 ? (
          <p className="text-sm text-muted">No attempts yet.</p>
        ) : (
          <div className="space-y-2">
            {history.map((r, i) => (
              <div
                key={r._id}
                className="card !py-3 flex items-center justify-between card-hover animate-fade-slide-up"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div>
                  <p className="text-sm text-paper/85">{new Date(r.submittedAt).toLocaleString()}</p>
                  <p className="text-xs text-muted">
                    {r.correctCount}/{r.totalQuestions} correct · {r.timeTakenSeconds}s
                  </p>
                </div>
                <ScoreBadge score={r.scorePercent} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------- Assessments Tab ----------------
function AssessmentsTab({ courseId }) {
  const [assessments, setAssessments] = useState([]);
  const [session, setSession] = useState(null);
  const [activeAssessmentId, setActiveAssessmentId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    assessmentApi.listForCourse(courseId).then((res) => setAssessments(res.data.assessments));
  }, [courseId]);

  async function handleTake(id) {
    setError('');
    try {
      const res = await assessmentApi.take(id);
      setSession(res.data);
      setActiveAssessmentId(id);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not start this assessment.');
    }
  }

  if (session) {
    return (
      <PracticeSession
        session={session}
        courseId={courseId}
        mode="formal"
        assessmentId={activeAssessmentId}
        onFinish={() => {
          setSession(null);
          setActiveAssessmentId(null);
        }}
      />
    );
  }

  const now = new Date();

  return (
    <div>
      {error && (
        <p className="mb-4 text-sm text-clay bg-clay/10 border border-clay/20 rounded-lg px-3 py-2 animate-fade-in">
          {error}
        </p>
      )}
      {assessments.length === 0 ? (
        <p className="text-sm text-muted">No assessments have been scheduled yet.</p>
      ) : (
        <div className="space-y-3">
          {assessments.map((a, i) => {
            const opens = new Date(a.availableFrom);
            const closes = new Date(a.availableUntil);
            const open = now >= opens && now <= closes;
            return (
              <div
                key={a._id}
                className="card !py-4 flex items-center justify-between gap-4 card-hover animate-fade-slide-up"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div>
                  <p className="font-medium text-paper">{a.title}</p>
                  <p className="text-xs text-muted font-mono mt-0.5">
                    {a.numberOfQuestions} questions · {a.durationMinutes} min · {opens.toLocaleString()} → {closes.toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => handleTake(a._id)}
                  disabled={!open}
                  className="btn-primary !py-1.5 !px-4 text-xs shrink-0"
                >
                  {open ? 'Take now' : now < opens ? 'Not open yet' : 'Closed'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------- Progress Tab ----------------
function ProgressTab({ courseId }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    analyticsApi.student(courseId).then((res) => setData(res.data));
  }, [courseId]);

  if (!data) return <LoadingScreen label="Loading progress" />;

  if (data.attemptCount === 0) {
    return <p className="text-sm text-muted">Complete a practice session to see your progress here.</p>;
  }

  return (
    <div className="space-y-8">
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="card text-center animate-fade-slide-up">
          <p className="font-display text-3xl font-semibold text-paper">{data.averageScore}%</p>
          <p className="text-xs text-muted mt-1">Average score</p>
        </div>
        <div className="card text-center animate-fade-slide-up" style={{ animationDelay: '60ms' }}>
          <p className="font-display text-3xl font-semibold text-paper">{data.bestScore}%</p>
          <p className="text-xs text-muted mt-1">Best score</p>
        </div>
        <div className="card text-center animate-fade-slide-up" style={{ animationDelay: '120ms' }}>
          <p className="font-display text-3xl font-semibold text-paper">{data.attemptCount}</p>
          <p className="text-xs text-muted mt-1">Attempts</p>
        </div>
      </div>

      <div>
        <h3 className="font-display text-xl font-semibold mb-3 text-paper">Topic breakdown</h3>
        <div className="space-y-2">
          {data.topicBreakdown.map((t, i) => (
            <div key={t.topic} className="flex items-center gap-3 animate-fade-slide-up" style={{ animationDelay: `${i * 40}ms` }}>
              <span className="text-sm w-40 truncate text-paper/80">{t.topic}</span>
              <div className="flex-1 h-2 rounded-full bg-ink-border overflow-hidden">
                <div
                  className="h-full bg-moss-500 transition-all duration-700 ease-smooth"
                  style={{ width: `${t.accuracyPercent}%` }}
                />
              </div>
              <ScoreBadge score={t.accuracyPercent} />
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-display text-xl font-semibold mb-3 text-paper">Score trend</h3>
        <div className="space-y-2">
          {data.scoreTrend.map((s, i) => (
            <div
              key={i}
              className="card !py-3 flex items-center justify-between card-hover animate-fade-slide-up"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <p className="text-sm text-paper/85">
                {new Date(s.date).toLocaleDateString()}{' '}
                <span className="text-xs text-muted font-mono ml-1">{s.mode}</span>
              </p>
              <ScoreBadge score={s.score} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
