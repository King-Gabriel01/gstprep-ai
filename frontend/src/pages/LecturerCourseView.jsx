import { useState, useEffect, useCallback } from 'react';
import { courseApi, materialApi, questionApi, assessmentApi, analyticsApi } from '../services/resources';
import ScoreBadge from '../components/ScoreBadge';

const TABS = ['Materials', 'Questions', 'Assessments', 'Analytics'];

export default function LecturerCourseView({ courseId }) {
  const [course, setCourse] = useState(null);
  const [tab, setTab] = useState('Materials');

  useEffect(() => {
    courseApi.get(courseId).then((res) => setCourse(res.data.course));
  }, [courseId]);

  if (!course) return <div className="max-w-6xl mx-auto px-6 py-10 text-ink/50 text-sm font-mono">Loading…</div>;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <p className="pill bg-moss-100 text-moss-700 font-mono text-xs w-fit">{course.courseCode}</p>
      <h1 className="mt-3 font-display text-3xl font-semibold">{course.title}</h1>
      <p className="mt-1 text-sm text-ink/50 font-mono">
        Enrolment code: <span className="font-semibold text-ink/70">{course.enrolmentCode}</span> · share this with students
      </p>

      <div className="mt-8 flex gap-1 border-b border-ink/10">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t ? 'border-moss-700 text-moss-700' : 'border-transparent text-ink/50 hover:text-ink/80'
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
    processing: 'bg-gold/15 text-gold',
    generating: 'bg-gold/15 text-gold',
    ready: 'bg-moss-100 text-moss-700',
    failed: 'bg-clay/10 text-clay',
  };

  const statusLabel = {
    processing: 'Extracting text…',
    generating: 'Generating questions…',
    ready: 'Ready',
    failed: 'Failed',
  };

  return (
    <div>
      <form onSubmit={handleUpload} className="card max-w-xl space-y-4">
        <div>
          <label className="label">Course material (PDF only)</label>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files[0])}
            className="input-field !py-2"
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
        {error && <p className="text-sm text-clay">{error}</p>}
        <button type="submit" disabled={!file || uploading} className="btn-primary">
          {uploading ? 'Uploading…' : 'Upload & generate questions'}
        </button>
        <p className="text-xs text-ink/40">
          Grok will read this document and draft MCQs automatically. You'll review them in the Questions tab.
        </p>
      </form>

      <div className="mt-8 space-y-3">
        {materials.length === 0 && <p className="text-sm text-ink/50">No materials uploaded yet.</p>}
        {materials.map((m) => (
          <div key={m._id} className="card !py-4 flex items-center justify-between gap-4">
            <div>
              <p className="font-medium">{m.title}</p>
              <p className="text-xs text-ink/40 font-mono mt-0.5">
                {m.originalFileName} {m.pageCount ? `· ${m.pageCount}p` : ''}
              </p>
              {m.status === 'failed' && m.failureReason && (
                <p className="text-xs text-clay mt-1">{m.failureReason}</p>
              )}
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {m.status === 'ready' && (
                <span className="text-xs font-mono text-ink/50">{m.questionCount} questions</span>
              )}
              <span className={`pill ${statusStyles[m.status]}`}>{statusLabel[m.status]}</span>
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
              className={`pill capitalize border ${
                filter === f ? 'bg-ink text-paper border-ink' : 'border-ink/15 text-ink/60'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        {filter === 'pending' && questions.length > 0 && (
          <button onClick={handleApproveAll} disabled={busy} className="btn-secondary !py-1.5 !px-3 text-xs">
            Approve all pending
          </button>
        )}
      </div>

      <div className="mt-6 space-y-4">
        {questions.length === 0 && <p className="text-sm text-ink/50">No {filter} questions.</p>}

        {questions.map((q) => (
          <div key={q._id} className="card">
            {editingId === q._id ? (
              <div className="space-y-3">
                <textarea
                  className="input-field"
                  rows={2}
                  value={editDraft.questionText}
                  onChange={(e) => setEditDraft({ ...editDraft, questionText: e.target.value })}
                />
                {editDraft.options.map((opt, i) => (
                  <div key={opt.label} className="flex items-center gap-2">
                    <span className="font-mono text-xs w-5">{opt.label}</span>
                    <input
                      className="input-field"
                      value={opt.text}
                      onChange={(e) => {
                        const opts = [...editDraft.options];
                        opts[i] = { ...opt, text: e.target.value };
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
                    Save
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
                  <p className="font-medium">{q.questionText}</p>
                  <span className="pill bg-ink/5 text-ink/60 shrink-0 text-xs">{q.topic}</span>
                </div>
                <div className="mt-3 grid sm:grid-cols-2 gap-2">
                  {q.options.map((opt) => (
                    <div
                      key={opt.label}
                      className={`text-sm rounded-lg px-3 py-2 border ${
                        opt.label === q.correctOption
                          ? 'border-moss-500 bg-moss-50 text-moss-700'
                          : 'border-ink/10 text-ink/70'
                      }`}
                    >
                      <span className="font-mono mr-2">{opt.label}</span>
                      {opt.text}
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-sm text-ink/50 italic">{q.explanation}</p>

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
        <form onSubmit={handleCreate} className="card mt-5 max-w-lg space-y-4">
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
          {error && <p className="text-sm text-clay">{error}</p>}
          <button type="submit" disabled={creating} className="btn-primary">
            {creating ? 'Creating…' : 'Create assessment'}
          </button>
          <p className="text-xs text-ink/40">
            Only approved questions are used. You need at least as many approved questions as requested.
          </p>
        </form>
      )}

      <div className="mt-8 space-y-3">
        {assessments.length === 0 && <p className="text-sm text-ink/50">No assessments yet.</p>}
        {assessments.map((a) => (
          <div key={a._id} className="card !py-4 flex items-center justify-between gap-4">
            <div>
              <p className="font-medium">{a.title}</p>
              <p className="text-xs text-ink/40 font-mono mt-0.5">
                {a.numberOfQuestions} questions · {a.durationMinutes} min ·{' '}
                {new Date(a.availableFrom).toLocaleString()} → {new Date(a.availableUntil).toLocaleString()}
              </p>
            </div>
            {a.isPublished ? (
              <span className="pill bg-moss-100 text-moss-700 shrink-0">Published</span>
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

  if (!data) return <p className="text-sm text-ink/50 font-mono">Loading…</p>;

  return (
    <div className="space-y-8">
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="card text-center">
          <p className="font-display text-3xl font-semibold">{data.classAverage}%</p>
          <p className="text-xs text-ink/50 mt-1">Class average</p>
        </div>
        <div className="card text-center">
          <p className="font-display text-3xl font-semibold">
            {data.activeStudentCount}/{data.enrolledCount}
          </p>
          <p className="text-xs text-ink/50 mt-1">Active students</p>
        </div>
        <div className="card text-center">
          <p className="font-display text-3xl font-semibold">{data.totalAttempts}</p>
          <p className="text-xs text-ink/50 mt-1">Total attempts</p>
        </div>
      </div>

      <div>
        <h3 className="font-display text-xl font-semibold mb-3">Topic difficulty (class-wide)</h3>
        {data.classTopicBreakdown.length === 0 ? (
          <p className="text-sm text-ink/50">No attempts recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {data.classTopicBreakdown.map((t) => (
              <div key={t.topic} className="flex items-center gap-3">
                <span className="text-sm w-40 truncate">{t.topic}</span>
                <div className="flex-1 h-2 rounded-full bg-ink/10 overflow-hidden">
                  <div
                    className="h-full bg-moss-500"
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
        <h3 className="font-display text-xl font-semibold mb-3">Most-missed questions</h3>
        {data.mostMissedQuestions.length === 0 ? (
          <p className="text-sm text-ink/50">Not enough attempts yet.</p>
        ) : (
          <div className="space-y-2">
            {data.mostMissedQuestions.map((q) => (
              <div key={q.questionId} className="card !py-3 flex items-center justify-between gap-4">
                <p className="text-sm">{q.questionText}</p>
                <span className="pill bg-clay/10 text-clay shrink-0">{q.missRate}% miss</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="font-display text-xl font-semibold mb-3">Student activity</h3>
        <div className="space-y-2">
          {data.studentActivity.map((s) => (
            <div key={s.studentId} className="card !py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{s.name}</p>
                <p className="text-xs text-ink/40">{s.email}</p>
              </div>
              <span className={`pill ${s.hasActivity ? 'bg-moss-100 text-moss-700' : 'bg-ink/5 text-ink/40'}`}>
                {s.hasActivity ? 'Active' : 'No activity'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
