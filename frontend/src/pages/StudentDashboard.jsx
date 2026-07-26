import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { courseApi } from '../services/resources';
import { Spinner, LoadingScreen } from '../components/Spinner';

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
      <div className="animate-fade-slide-up">
        <h1 className="font-display text-3xl font-semibold text-paper">Your courses</h1>
        <p className="text-muted text-sm mt-1">Practice questions and track your progress.</p>
      </div>

      <form
        onSubmit={handleEnrol}
        className="card mt-6 max-w-md flex items-end gap-3 animate-fade-slide-up"
        style={{ animationDelay: '80ms' }}
      >
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
          {enrolling ? <Spinner /> : 'Join'}
        </button>
      </form>
      {message && <p className="mt-2 text-sm text-moss-400 animate-fade-in">{message}</p>}
      {error && <p className="mt-2 text-sm text-clay animate-fade-in">{error}</p>}

      {loading ? (
        <LoadingScreen label="Loading courses" />
      ) : courses.length === 0 ? (
        <div className="mt-10 card text-center py-14 animate-fade-in">
          <p className="text-muted">You're not enrolled in any courses yet. Ask your lecturer for a code.</p>
        </div>
      ) : (
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((c, i) => (
            <Link
              to={`/courses/${c._id}`}
              key={c._id}
              className="card card-hover hover:-translate-y-0.5 animate-fade-slide-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <span className="pill bg-moss-500/10 text-moss-400 border border-moss-500/25 font-mono text-xs">
                {c.courseCode}
              </span>
              <h3 className="mt-3 font-display text-xl font-semibold text-paper">{c.title}</h3>
              <p className="mt-2 text-sm text-paper/60 line-clamp-2">{c.description || 'No description'}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
