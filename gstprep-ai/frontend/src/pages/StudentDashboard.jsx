import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { courseApi } from '../services/resources';

export default function StudentDashboard() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [enrolling, setEnrolling] = useState(false);
  const [message, setMessage] = useState('');
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

  async function handleEnrol(e) {
    e.preventDefault();
    setEnrolling(true);
    setError('');
    setMessage('');
    try {
      const res = await courseApi.enrol(code.trim());
      setMessage(res.data.message);
      setCode('');
      loadCourses();
    } catch (err) {
      setError(err.response?.data?.message || 'Enrolment failed.');
    } finally {
      setEnrolling(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="font-display text-3xl font-semibold">Your courses</h1>
      <p className="text-ink/60 text-sm mt-1">Practice questions and track your progress.</p>

      <form onSubmit={handleEnrol} className="card mt-6 max-w-md flex items-end gap-3">
        <div className="flex-1">
          <label className="label">Have an enrolment code?</label>
          <input
            className="input-field uppercase"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g. A1B2C3"
            maxLength={8}
          />
        </div>
        <button type="submit" disabled={enrolling || !code} className="btn-primary shrink-0">
          {enrolling ? 'Joining…' : 'Join'}
        </button>
      </form>
      {message && <p className="mt-2 text-sm text-moss-700">{message}</p>}
      {error && <p className="mt-2 text-sm text-clay">{error}</p>}

      {loading ? (
        <p className="mt-8 text-ink/50 text-sm font-mono">Loading…</p>
      ) : courses.length === 0 ? (
        <div className="mt-10 card text-center py-14">
          <p className="text-ink/60">You're not enrolled in any courses yet. Ask your lecturer for a code.</p>
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
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
