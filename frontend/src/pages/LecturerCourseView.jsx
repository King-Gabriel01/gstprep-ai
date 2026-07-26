import { useState, useEffect, useCallback } from 'react';
import { courseApi, materialApi, questionApi, assessmentApi, analyticsApi } from '../services/resources';
import ScoreBadge from '../components/ScoreBadge';
import { Spinner, DotPulse, LoadingScreen } from '../components/Spinner';

const TABS = ['Materials', 'Questions', 'Assessments', 'Analytics'];

export default function LecturerCourseView({ courseId }) {
  const [course, setCourse] = useState(null);
  const [tab, setTab] = useState('Materials');

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
      <p className="mt-1 text-sm text-muted font-mono">
        Enrolment code: <span className="font-semibold text-paper/80">{course.enrolmentCode}</span> · share this with students
      </p>

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
        {tab === 'Materials' && <MaterialsTab courseId={courseId} />}
        {tab === 'Questions' && <QuestionsTab courseId={courseId} />}
        {tab === 'Assessments' && <AssessmentsTab courseId={courseId} />}
        {tab === 'Analytics' && <AnalyticsTab courseId={courseId} />}
      </div>
    </div>
  );
}

// ---------------- Materials Tab ----------------
function MaterialsTab({ courseId }) {
  const [materials, setMaterials] = useState([]);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    materialApi.listForCourse(courseId).then((res) => setMaterials(res.data.materials));
  }, [courseId]);

  useEffect(() => {
    load();
  }, [load]);

  // Poll status while any material is processing/generating
  useEffect(() => {
    const active = materials.some((m) => ['processing', 'generating'].includes(m.status));
    if (!active) return;
    const interval = setInterval(load, 4000);
    return () => clearInterval(interval);
  }, [materials, load]);

  async function handleUpload(e) {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('courseId', courseId);
      formData.append('title', title || file.name);
      await materialApi.upload(formData);
      setFile(null);
      setTitle('');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  }

  const statusStyles = {
    processing: 'bg-gold/10 text-gold border border-gold/25',
    generating: 'bg-gold/10 text-gold border border-gold/25',
    ready: 'bg-moss-500/10 text-moss-400 border border-moss-500/25',
    failed: 'bg-clay/10 text-clay border border-clay/25',
  };

  const statusLabel = {
    processing: 'Extracting text',
    generating: 'Generating questions',
    ready: 'Ready',
    failed: 'Failed',
  };

  return (
    <div>
      <form onSubmit={handleUpload} className="card max-w-xl space-y-4 animate-fade-slide-up">
        <div>
          <label className="label">Course material (PDF only)</label>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files[0])}
            className="input-field !py-2 file:mr-3 file:rounded-full file:border-0 file:bg-moss-500/15 file:text-moss-300 file:px-3 file:py-1.5 file:text-xs file:font-medium file:cursor-pointer hover:file:bg-moss-500/25 file:transition-colors"
          />
        </div>
        <div>
          <label className="label">Label (optional)</label>
          <input
            className="input-field"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Week 3 - Comprehension Skills"
          />
        </div>
        {error && (
          <p className="text-sm text-clay bg-clay/10 border border-clay/20 rounded-lg px-3 py-2 animate-fade-in">
            {error}
          </p>
        )}
        <button type="submit" disabled={!file || uploading} className="btn-primary">
          {uploading ? (
            <>
              <Spinner /> Uploading…
            </>
          ) : (
            'Upload & generate questions'
          )}
        </button>
        <p className="text-xs text-muted">
          Gemini will read this document and draft MCQs automatically. You'll review them in the Questions tab.
        </p>
      </form>

      <div className="mt-8 space-y-3">
        {materials.length === 0 && <p className="text-sm text-muted">No materials uploaded yet.</p>}
        {materials.map((m, i) => (
          <div
            key={m._id}
            className="card !py-4 flex items-center justify-between gap-4 card-hover animate-fade-slide-up"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div>
              <p className="font-medium text-paper">{m.title}</p>
              <p className="text-xs text-muted font-mono mt-0.5">
                {m.originalFileName} {m.pageCount ? `· ${m.pageCount}p` : ''}
              </p>
              {m.status === 'failed' && m.failureReason && (
                <p className="text-xs text-clay mt-1">{m.failureReason}</p>
              )}
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {m.status === 'ready' && (
                <span className="text-xs font-mono text-muted">{m.questionCount} questions</span>
              )}
              <span className={`pill ${statusStyles[m.status]}`}>
                {['processing', 'generating'].includes(m.status) && <DotPulse />}
                {statusLabel[m.status]}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------- Questions Tab ----------------
function QuestionsTab({ courseId }) {
  const [questions, setQuestions] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    questionApi.listForCourse(courseId, filter).then((res) => setQuestions(res.data.questions));
  }, [courseId, filter]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleApprove(id) {
    setBusy(true);
    await questionApi.approve(id);
    await load();
    setBusy(false);
  }

  async function handleReject(id) {
    setBusy(true);
    await questionApi.reject(id);
    await load();
    setBusy(false);
  }

  async function handleDelete(id) {
    if (!confirm('Delete this question permanently?')) return;
    setBusy(true);
    await questionApi.remove(id);
    await load();
    setBusy(false);
  }

  async function handleApproveAll() {
    setBusy(true);
    await questionApi.approveAllPending(courseId);
    await load();
    setBusy(false);
  }

  function startEdit(q) {
    setEditingId(q._id);
    setEditDraft({ ...q });
  }

  async function saveEdit() {
    setBusy(true);
    await questionApi.update(editingId, {
      questionText: editDraft.questionText,
      options: editDraft.options,
      correctOption: editDraft.correctOption,
      explanation: editDraft.explanation,
      topic: editDraft.topic,
      difficulty: editDraft.difficulty,
    });
    setEditingId(null);
    await load();
    setBusy(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2">
          {['pending', 'approved', 'rejected'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`pill capitalize border transition-all duration-200 ease-smooth ${
                filter === f
                  ? 'bg-paper text-ink border-paper'
                  : 'border-ink-border text-muted hover:border-paper/25'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        {filter === 'pending' && questions.length > 0 && (
          <button onClick={handleApproveAll} disabled={busy} className="btn-secondary !py-1.5 !px-3 text-xs">
            {busy ? <Spinner /> : 'Approve all pending'}
          </button>
        )}
      </div>

      <div className="mt-6 space-y-4">
        {questions.length === 0 && <p className="text-sm text-muted">No {filter} questions.</p>}

        {questions.map((q, i) => (
          <div
            key={q._id}
            className="card animate-fade-slide-up"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            {editingId === q._id ? (
              <div className="space-y-3 animate-fade-in">
                <textarea
                  className="input-field"
                  rows={2}
                  value={editDraft.questionText}
                  onChange={(e) => setEditDraft({ ...editDraft, questionText: e.target.value })}
                />
                {editDraft.options.map((opt, i2) => (
                  <div key={opt.label} className="flex items-center gap-2">
                    <span className="font-mono text-xs w-5 text-muted">{opt.label}</span>
                    <input
                      className="input-field"
                      value={opt.text}
                      onChange={(e) => {
                        const opts = [...editDraft.options];
                        opts[i2] = { ...opt, text: e.target.value };
                        setEditDraft({ ...editDraft, options: opts });
                      }}
                    />
                  </div>
                ))}
                <div className="flex items-center gap-3">
                  <label className="label !mb-0">Correct answer</label>
                  <select
                    className="input-field w-auto"
                    value={editDraft.correctOption}
                    onChange={(e) => setEditDraft({ ...editDraft, correctOption: e.target.value })}
                  >
                    {['A', 'B', 'C', 'D'].map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
                <textarea
                  className="input-field"
                  rows={2}
                  placeholder="Explanation"
                  value={editDraft.explanation}
                  onChange={(e) => setEditDraft({ ...editDraft, explanation: e.target.value })}
                />
                <div className="flex gap-2">
                  <button onClick={saveEdit} disabled={busy} className="btn-primary !py-1.5 !px-4 text-xs">
                    {busy ? <Spinner /> : 'Save'}
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="btn-secondary !py-1.5 !px-4 text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-4">
                  <p className="font-medium text-paper">{q.questionText}</p>
                  <span className="pill bg-paper/5 text-muted border border-ink-border shrink-0 text-xs">{q.topic}</span>
                </div>
                <div className="mt-3 grid sm:grid-cols-2 gap-2">
                  {q.options.map((opt) => (
                    <div
                      key={opt.label}
                      className={`text-sm rounded-lg px-3 py-2 border transition-colors duration-200 ${
                        opt.label === q.correctOption
                          ? 'border-moss-500 bg-moss-500/10 text-moss-300'
                          : 'border-ink-border text-paper/65'
                      }`}
                    >
                      <span className="font-mono mr-2">{opt.label}</span>
                      {opt.text}
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-sm text-muted italic">{q.explanation}</p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {q.approvalStatus !== 'approved' && (
                    <button
                      onClick={() => handleApprove(q._id)}
                      disabled={busy}
                      className="btn-primary !py-1.5 !px-4 text-xs"
                    >
                      Approve
                    </button>
                  )}
                  {q.approvalStatus !== 'rejected' && (
                    <button
                      onClick={() => handleReject(q._id)}
                      disabled={busy}
                      className="btn-secondary !py-1.5 !px-4 text-xs"
                    >
                      Reject
                    </button>
                  )}
                  <button onClick={() => startEdit(q)} className="btn-secondary !py-1.5 !px-4 text-xs">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(q._id)} className="btn-danger !py-1.5 !px-4 text-xs">
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------- Assessments Tab ----------------
function AssessmentsTab({ courseId }) {
  const [assessments, setAssessments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '',
    numberOfQuestions: 10,
    durationMinutes: 30,
    availableFrom: '',
    availableUntil: '',
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    assessmentApi.listForCourse(courseId).then((res) => setAssessments(res.data.assessments));
  }, [courseId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e) {
    e.preventDefault();
    setCreating(true);
    setError('');
    try {
      await assessmentApi.create({ ...form, courseId });
      setShowForm(false);
      setForm({ title: '', numberOfQuestions: 10, durationMinutes: 30, availableFrom: '', availableUntil: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create assessment.');
    } finally {
      setCreating(false);
    }
  }

  async function handlePublish(id) {
    await assessmentApi.publish(id);
    load();
  }

  return (
    <div>
      <button onClick={() => setShowForm((s) => !s)} className="btn-primary">
        {showForm ? 'Cancel' : '+ Schedule assessment'}
      </button>

      {showForm && (
        <form onSubmit={handleCreate} className="card mt-5 max-w-lg space-y-4 animate-fade-slide-up">
          <div>
            <label className="label">Title</label>
            <input
              required
              className="input-field"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Mid-semester CBT"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Number of questions</label>
              <input
                type="number"
                min={1}
                required
                className="input-field"
                value={form.numberOfQuestions}
                onChange={(e) => setForm({ ...form, numberOfQuestions: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="label">Duration (minutes)</label>
              <input
                type="number"
                min={1}
                required
                className="input-field"
                value={form.durationMinutes}
                onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Available from</label>
              <input
                type="datetime-local"
                required
                className="input-field"
                value={form.availableFrom}
                onChange={(e) => setForm({ ...form, availableFrom: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Available until</label>
              <input
                type="datetime-local"
                required
                className="input-field"
                value={form.availableUntil}
                onChange={(e) => setForm({ ...form, availableUntil: e.target.value })}
              />
            </div>
          </div>
          {error && (
            <p className="text-sm text-clay bg-clay/10 border border-clay/20 rounded-lg px-3 py-2 animate-fade-in">
              {error}
            </p>
          )}
          <button type="submit" disabled={creating} className="btn-primary">
            {creating ? (
              <>
                <Spinner /> Creating…
              </>
            ) : (
              'Create assessment'
            )}
          </button>
          <p className="text-xs text-muted">
            Only approved questions are used. You need at least as many approved questions as requested.
          </p>
        </form>
      )}

      <div className="mt-8 space-y-3">
        {assessments.length === 0 && <p className="text-sm text-muted">No assessments yet.</p>}
        {assessments.map((a, i) => (
          <div
            key={a._id}
            className="card !py-4 flex items-center justify-between gap-4 card-hover animate-fade-slide-up"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div>
              <p className="font-medium text-paper">{a.title}</p>
              <p className="text-xs text-muted font-mono mt-0.5">
                {a.numberOfQuestions} questions · {a.durationMinutes} min ·{' '}
                {new Date(a.availableFrom).toLocaleString()} → {new Date(a.availableUntil).toLocaleString()}
              </p>
            </div>
            {a.isPublished ? (
              <span className="pill bg-moss-500/10 text-moss-400 border border-moss-500/25 shrink-0">Published</span>
            ) : (
              <button onClick={() => handlePublish(a._id)} className="btn-secondary !py-1.5 !px-4 text-xs shrink-0">
                Publish
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------- Analytics Tab ----------------
function AnalyticsTab({ courseId }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    analyticsApi.lecturer(courseId).then((res) => setData(res.data));
  }, [courseId]);

  if (!data) return <LoadingScreen label="Loading analytics" />;

  return (
    <div className="space-y-8">
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="card text-center animate-fade-slide-up">
          <p className="font-display text-3xl font-semibold text-paper">{data.classAverage}%</p>
          <p className="text-xs text-muted mt-1">Class average</p>
        </div>
        <div className="card text-center animate-fade-slide-up" style={{ animationDelay: '60ms' }}>
          <p className="font-display text-3xl font-semibold text-paper">
            {data.activeStudentCount}/{data.enrolledCount}
          </p>
          <p className="text-xs text-muted mt-1">Active students</p>
        </div>
        <div className="card text-center animate-fade-slide-up" style={{ animationDelay: '120ms' }}>
          <p className="font-display text-3xl font-semibold text-paper">{data.totalAttempts}</p>
          <p className="text-xs text-muted mt-1">Total attempts</p>
        </div>
      </div>

      <div>
        <h3 className="font-display text-xl font-semibold mb-3 text-paper">Topic difficulty (class-wide)</h3>
        {data.classTopicBreakdown.length === 0 ? (
          <p className="text-sm text-muted">No attempts recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {data.classTopicBreakdown.map((t, i) => (
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
        )}
      </div>

      <div>
        <h3 className="font-display text-xl font-semibold mb-3 text-paper">Most-missed questions</h3>
        {data.mostMissedQuestions.length === 0 ? (
          <p className="text-sm text-muted">Not enough attempts yet.</p>
        ) : (
          <div className="space-y-2">
            {data.mostMissedQuestions.map((q, i) => (
              <div
                key={q.questionId}
                className="card !py-3 flex items-center justify-between gap-4 card-hover animate-fade-slide-up"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <p className="text-sm text-paper/85">{q.questionText}</p>
                <span className="pill bg-clay/10 text-clay border border-clay/25 shrink-0">{q.missRate}% miss</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="font-display text-xl font-semibold mb-3 text-paper">Student activity</h3>
        <div className="space-y-2">
          {data.studentActivity.map((s, i) => (
            <div
              key={s.studentId}
              className="card !py-3 flex items-center justify-between card-hover animate-fade-slide-up"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div>
                <p className="text-sm font-medium text-paper">{s.name}</p>
                <p className="text-xs text-muted">{s.email}</p>
              </div>
              <span
                className={`pill border ${
                  s.hasActivity
                    ? 'bg-moss-500/10 text-moss-400 border-moss-500/25'
                    : 'bg-paper/5 text-muted border-ink-border'
                }`}
              >
                {s.hasActivity ? 'Active' : 'No activity'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
