import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/client.js";
import { Button, Card, EmptyState, Spinner, Badge } from "../components/ui.jsx";

export default function StudentDashboard() {
  const [myCourses, setMyCourses] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrollingId, setEnrollingId] = useState(null);

  async function loadAll() {
    setLoading(true);
    try {
      const [mine, all, hist] = await Promise.all([
        client.get("/courses"),
        client.get("/courses/all"),
        client.get("/performance/me"),
      ]);
      setMyCourses(mine.data.courses);
      setAllCourses(all.data.courses);
      setHistory(hist.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleEnroll(courseId) {
    setEnrollingId(courseId);
    try {
      await client.post(`/courses/${courseId}/enroll`);
      loadAll();
    } finally {
      setEnrollingId(null);
    }
  }

  const myCourseIds = new Set(myCourses.map((c) => c._id));
  const browsable = allCourses.filter((c) => !myCourseIds.has(c._id));

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="font-display text-2xl font-bold text-ink">Your dashboard</h1>

      {history && history.attempts > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card className="p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-slatex">
              Attempts
            </p>
            <p className="mt-1.5 font-display text-2xl font-bold text-ink">{history.attempts}</p>
          </Card>
          <Card className="p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-slatex">
              Average score
            </p>
            <p className="mt-1.5 font-display text-2xl font-bold text-ink">
              {history.avgPercentage}%
            </p>
          </Card>
        </div>
      )}

      <h2 className="mt-10 font-display text-lg font-semibold text-ink">Your courses</h2>
      {myCourses.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title="Not enrolled in any course yet"
            description="Browse available courses below and enroll to start practicing."
          />
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {myCourses.map((c) => (
            <Link key={c._id} to={`/student/courses/${c._id}`}>
              <Card className="h-full p-5 transition-shadow hover:shadow-md">
                <p className="font-mono text-xs font-semibold uppercase tracking-widest text-amberflag">
                  {c.code}
                </p>
                <h3 className="mt-2 font-display text-lg font-semibold text-ink">{c.title}</h3>
                <p className="mt-1 text-sm text-slatex">{c.lecturer?.name}</p>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <h2 className="mt-10 font-display text-lg font-semibold text-ink">Browse courses</h2>
      {browsable.length === 0 ? (
        <p className="mt-3 text-sm text-slatex">No other courses available right now.</p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {browsable.map((c) => (
            <Card key={c._id} className="p-5">
              <p className="font-mono text-xs font-semibold uppercase tracking-widest text-amberflag">
                {c.code}
              </p>
              <h3 className="mt-2 font-display text-lg font-semibold text-ink">{c.title}</h3>
              {c.description && <p className="mt-1 text-sm text-slatex">{c.description}</p>}
              <Button
                variant="accent"
                className="mt-4 w-full !py-2 text-xs"
                disabled={enrollingId === c._id}
                onClick={() => handleEnroll(c._id)}
              >
                {enrollingId === c._id ? "Enrolling…" : "Enroll"}
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
