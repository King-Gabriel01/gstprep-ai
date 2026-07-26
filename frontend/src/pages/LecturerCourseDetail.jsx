import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import client from "../api/client.js";
import { Button, Card, Input, Badge, EmptyState, Spinner } from "../components/ui.jsx";

export default function LecturerCourseDetail() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [file, setFile] = useState(null);
  const [label, setLabel] = useState("");
  const [uploading, setUploading] = useState(false);
  const [generatingId, setGeneratingId] = useState(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("materials");

  async function loadAll() {
    const [courseRes, materialsRes, questionsRes, analyticsRes] = await Promise.all([
      client.get(`/courses/${id}`),
      client.get(`/materials/course/${id}`),
      client.get(`/questions/course/${id}`),
      client.get(`/performance/course/${id}`).catch(() => ({ data: null })),
    ]);
    setCourse(courseRes.data.course);
    setMaterials(materialsRes.data.materials);
    setQuestions(questionsRes.data.questions);
    setAnalytics(analyticsRes.data);
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleUpload(e) {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("courseId", id);
      formData.append("label", label);
      await client.post("/materials/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setFile(null);
      setLabel("");
      loadAll();
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleGenerate(materialId) {
    setGeneratingId(materialId);
    setError("");
    try {
      await client.post(`/materials/${materialId}/generate-questions`, { questionsPerChunk: 4 });
      await loadAll();
      setTab("questions");
    } catch (err) {
      setError(err.response?.data?.message || "Question generation failed");
    } finally {
      setGeneratingId(null);
    }
  }

  async function handleStatus(questionId, status) {
    await client.patch(`/questions/${questionId}/status`, { status });
    loadAll();
  }

  async function handleDelete(questionId) {
    await client.delete(`/questions/${questionId}`);
    loadAll();
  }

  if (!course) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    );
  }

  const pending = questions.filter((q) => q.approvalStatus === "pending");
  const approved = questions.filter((q) => q.approvalStatus === "approved");

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <p className="font-mono text-xs font-semibold uppercase tracking-widest text-amberflag">
        {course.code}
      </p>
      <h1 className="mt-1 font-display text-2xl font-bold text-ink">{course.title}</h1>

      <div className="mt-6 flex gap-6 border-b border-ink/10">
        {["materials", "questions", "analytics"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`border-b-2 pb-3 text-sm font-semibold capitalize transition-colors ${
              tab === t ? "border-moss text-ink" : "border-transparent text-slatex hover:text-ink"
            }`}
          >
            {t}
            {t === "questions" && pending.length > 0 && (
              <span className="ml-1.5 text-amberflag">({pending.length})</span>
            )}
          </button>
        ))}
      </div>

      {error && <p className="mt-4 text-sm text-errorred">{error}</p>}

      {tab === "materials" && (
        <div className="mt-6">
          <Card className="p-6">
            <h3 className="font-display text-lg font-semibold text-ink">Upload course material</h3>
            <p className="mt-1 text-sm text-slatex">
              PDF only. Lecture notes, handouts, or past questions all work.
            </p>
            <form onSubmit={handleUpload} className="mt-4 flex flex-col gap-3 md:flex-row md:items-end">
              <div className="flex-1">
                <Input
                  label="Label (optional)"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Week 3 — Effective Communication"
                />
              </div>
              <div className="flex-1">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slatex">
                    PDF file
                  </span>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-slatex file:mr-3 file:rounded-sm file:border-0 file:bg-ink file:px-3 file:py-2 file:text-xs file:font-semibold file:text-parchment"
                    required
                  />
                </label>
              </div>
              <Button type="submit" disabled={uploading || !file}>
                {uploading ? "Uploading…" : "Upload"}
              </Button>
            </form>
          </Card>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            {materials.length === 0 ? (
              <div className="md:col-span-2">
                <EmptyState
                  title="No materials uploaded yet"
                  description="Upload a PDF above to start generating practice questions."
                />
              </div>
            ) : (
              materials.map((m) => (
                <Card key={m._id} className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink">{m.label || m.originalName}</p>
                      <p className="mt-0.5 text-xs text-slatex">{m.originalName}</p>
                    </div>
                    <Badge
                      tone={
                        m.status === "generated"
                          ? "approved"
                          : m.status === "failed"
                          ? "rejected"
                          : "pending"
                      }
                    >
                      {m.status}
                    </Badge>
                  </div>
                  {m.errorMessage && (
                    <p className="mt-2 text-xs text-errorred">{m.errorMessage}</p>
                  )}
                  <Button
                    variant="accent"
                    className="mt-4 w-full !py-2 text-xs"
                    disabled={
                      generatingId === m._id || !["extracted", "generated"].includes(m.status)
                    }
                    onClick={() => handleGenerate(m._id)}
                  >
                    {generatingId === m._id
                      ? "Generating questions…"
                      : m.status === "generated"
                      ? "Generate more questions"
                      : "Generate questions"}
                  </Button>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {tab === "questions" && (
        <div className="mt-6 space-y-8">
          <QuestionGroup
            title={`Pending review (${pending.length})`}
            questions={pending}
            onStatus={handleStatus}
            onDelete={handleDelete}
          />
          <QuestionGroup
            title={`Approved — live for students (${approved.length})`}
            questions={approved}
            onStatus={handleStatus}
            onDelete={handleDelete}
          />
        </div>
      )}

      {tab === "analytics" && (
        <div className="mt-6">
          {!analytics ? (
            <Spinner />
          ) : analytics.totalAttempts === 0 ? (
            <EmptyState
              title="No attempts yet"
              description="Once students start practicing, class-wide performance will appear here."
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Card className="p-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-slatex">
                  Total attempts
                </p>
                <p className="mt-2 font-display text-3xl font-bold text-ink">
                  {analytics.totalAttempts}
                </p>
              </Card>
              <Card className="p-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-slatex">
                  Average score
                </p>
                <p className="mt-2 font-display text-3xl font-bold text-ink">
                  {analytics.avgPercentage}%
                </p>
              </Card>
              <Card className="p-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-slatex">
                  Active students
                </p>
                <p className="mt-2 font-display text-3xl font-bold text-ink">
                  {analytics.activeStudentCount}
                </p>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function QuestionGroup({ title, questions, onStatus, onDelete }) {
  if (questions.length === 0) return null;
  return (
    <div>
      <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
      <div className="mt-3 space-y-3">
        {questions.map((q) => (
          <Card key={q._id} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="font-medium text-ink">{q.questionText}</p>
              <Badge
                tone={
                  q.approvalStatus === "approved"
                    ? "approved"
                    : q.approvalStatus === "rejected"
                    ? "rejected"
                    : "pending"
                }
              >
                {q.approvalStatus}
              </Badge>
            </div>
            <ul className="mt-3 grid grid-cols-1 gap-1.5 text-sm md:grid-cols-2">
              {q.options.map((opt, i) => (
                <li
                  key={i}
                  className={`rounded-sm border px-3 py-1.5 ${
                    i === q.correctIndex
                      ? "border-moss bg-moss/10 text-moss font-semibold"
                      : "border-ink/10 text-slatex"
                  }`}
                >
                  {String.fromCharCode(65 + i)}. {opt}
                </li>
              ))}
            </ul>
            {q.explanation && (
              <p className="mt-3 text-xs italic text-slatex">Explanation: {q.explanation}</p>
            )}
            <div className="mt-4 flex gap-2">
              {q.approvalStatus !== "approved" && (
                <Button
                  variant="accent"
                  className="!py-1.5 !px-3 text-xs"
                  onClick={() => onStatus(q._id, "approved")}
                >
                  Approve
                </Button>
              )}
              {q.approvalStatus !== "rejected" && (
                <Button
                  variant="ghost"
                  className="!py-1.5 !px-3 text-xs"
                  onClick={() => onStatus(q._id, "rejected")}
                >
                  Reject
                </Button>
              )}
              <Button
                variant="danger"
                className="!py-1.5 !px-3 text-xs"
                onClick={() => onDelete(q._id)}
              >
                Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
