import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import client from "../api/client.js";
import { Button, Card, Spinner, EmptyState } from "../components/ui.jsx";

export default function StudentCourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [history, setHistory] = useState([]);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const [courseRes, histRes] = await Promise.all([
        client.get(`/courses/${id}`),
        client.get(`/performance/me?courseId=${id}`),
      ]);
      setCourse(courseRes.data.course);
      setHistory(histRes.data.results);
    }
    load();
  }, [id]);

  async function handleStart() {
    setStarting(true);
    setError("");
    try {
      const { data } = await client.get(`/tests/practice/${id}?count=10`);
      navigate(`/student/courses/${id}/practice`, { state: { questions: data.questions } });
    } catch (err) {
      setError(err.response?.data?.message || "Could not start practice session");
    } finally {
      setStarting(false);
    }
  }

  if (!course) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <p className="font-mono text-xs font-semibold uppercase tracking-widest text-amberflag">
        {course.code}
      </p>
      <h1 className="mt-1 font-display text-2xl font-bold text-ink">{course.title}</h1>

      <Card className="mt-6 p-6">
        <h3 className="font-display text-lg font-semibold text-ink">Start a practice session</h3>
        <p className="mt-1 text-sm text-slatex">
          10 questions, drawn randomly from your lecturer's approved question pool. No time limit.
        </p>
        {error && <p className="mt-3 text-sm text-errorred">{error}</p>}
        <Button variant="accent" className="mt-4" onClick={handleStart} disabled={starting}>
          {starting ? "Preparing…" : "Start practice"}
        </Button>
      </Card>

      <h2 className="mt-10 font-display text-lg font-semibold text-ink">Your history</h2>
      {history.length === 0 ? (
        <div className="mt-4">
          <EmptyState title="No attempts yet" description="Your results will appear here after your first practice session." />
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {history.map((r) => (
            <Card key={r._id} className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-semibold text-ink">
                  {r.score} / {r.totalQuestions} correct
                </p>
                <p className="text-xs text-slatex">
                  {new Date(r.createdAt).toLocaleString()} · {r.mode}
                </p>
              </div>
              <p className="font-display text-xl font-bold text-moss">{r.percentage}%</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
