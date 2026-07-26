import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { courseApi } from '../services/resources';

export default function LecturerDashboard() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', courseCode: '', description: '' });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCourses();
  }, []);

  async function loadCourses() {
    setLoading(true);
    try {
      const res = await courseApi.list();
      setCourses(res.data.courses);
    } catch (err) {
      setError('Failed to load courses.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setCreating(true);
    setError('');
    try {
      await courseApi.create(form);
      setForm({ title: '', courseCode: '', description: '' });
      setShowForm(false);
      loadCourses();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create course.');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">Your courses</h1>
          <p className="text-ink/60 text-sm mt-1">Manage materials, questions, and student performance.</p>
        </div>
        <button onClick={() => setShowForm((s) => !s)} className="btn-primary">
          {showForm ? 'Cancel' : '+ New course'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card mt-6 space-y-4 max-w-lg">
          <div>
            <label className="label">Course title</label>
            <input
              required
              className="input-field"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Communication in English"
            />
          </div>
          <div>
            <label className="label">Course code</label>
            <input
              required
              className="input-field"
              value={form.courseCode}
              onChange={(e) => setForm({ ...form, courseCode: e.target.value })}
              placeholder="GST101"
            />
          </div>
          <div>
            <label className="label">Description (optional)</label>
            <textarea
              className="input-field"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          {error && <p className="text-sm text-clay">{error}</p>}
          <button type="submit" disabled={creating} className="btn-primary">
            {creating ? 'Creating…' : 'Create course'}
          </button>
        </form>
      )}

      {loading ? (
        <p className="mt-8 text-ink/50 text-sm font-mono">Loading…</p>
      ) : courses.length === 0 ? (
        <div className="mt-10 card text-center py-14">
          <p className="text-ink/60">You haven't created any courses yet.</p>
        </div>
      ) : (
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((c) => (
            <Link
              to={`/courses/${c._id}`}
              key={c._id}
              className="card hover:border-moss-500/40 hover:shadow-md transition-all"
            >
              <span className="pill bg-moss-100 text-moss-700 font-mono text-xs">{c.courseCode}</span>
              <h3 className="mt-3 font-display text-xl font-semibold">{c.title}</h3>
              <p className="mt-2 text-sm text-ink/60 line-clamp-2">{c.description || 'No description'}</p>
              <p className="mt-4 text-xs font-mono text-ink/40">
                {c.enrolledStudents?.length || 0} enrolled · code {c.enrolmentCode}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
