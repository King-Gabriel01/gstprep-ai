import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/client.js";
import { Button, Card, Input, EmptyState, Spinner } from "../components/ui.jsx";

export default function LecturerDashboard() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", code: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadCourses() {
    setLoading(true);
    try {
      const { data } = await client.get("/courses");
      setCourses(data.courses);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCourses();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await client.post("/courses", form);
      setForm({ title: "", code: "", description: "" });
      setShowForm(false);
      loadCourses();
    } catch (err) {
      setError(err.response?.data?.message || "Could not create course");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Your courses</h1>
          <p className="mt-1 text-sm text-slatex">
            Upload materials, review AI-generated questions, and track class performance.
          </p>
        </div>
        <Button onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Cancel" : "New course"}
        </Button>
      </div>

      {showForm && (
        <Card className="mt-6 p-6">
          <form onSubmit={handleCreate} className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Input
              label="Course title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Communication in English"
              required
            />
            <Input
              label="Course code"
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              placeholder="GST 101"
              required
            />
            <Input
              label="Description (optional)"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="First-year compulsory course"
            />
            <div className="md:col-span-3">
              {error && <p className="mb-3 text-sm text-errorred">{error}</p>}
              <Button type="submit" variant="accent" disabled={saving}>
                {saving ? "Creating…" : "Create course"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="mt-8">
        {loading ? (
          <div className="flex justify-center py-16 text-slatex">
            <Spinner />
          </div>
        ) : courses.length === 0 ? (
          <EmptyState
            title="No courses yet"
            description="Create your first course to start uploading materials and generating practice questions."
            action={<Button onClick={() => setShowForm(true)}>New course</Button>}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => (
              <Link key={c._id} to={`/lecturer/courses/${c._id}`}>
                <Card className="h-full p-5 transition-shadow hover:shadow-md">
                  <p className="font-mono text-xs font-semibold uppercase tracking-widest text-amberflag">
                    {c.code}
                  </p>
                  <h3 className="mt-2 font-display text-lg font-semibold text-ink">{c.title}</h3>
                  <p className="mt-1 text-sm text-slatex">
                    {c.students?.length || 0} student{c.students?.length === 1 ? "" : "s"} enrolled
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
