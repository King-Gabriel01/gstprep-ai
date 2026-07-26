import React from "react";
import { Link } from "react-router-dom";
import { Button, Card } from "../components/ui.jsx";

const modules = [
  {
    tag: "01 · Upload",
    title: "Course materials in, structured practice out",
    body: "Lecturers upload lecture notes and past questions as PDFs. GSTPrep AI extracts and chunks the text automatically.",
  },
  {
    tag: "02 · Generate",
    title: "AI-authored questions, human-approved",
    body: "The system drafts multiple-choice questions with explanations. Nothing reaches students until a lecturer approves it.",
  },
  {
    tag: "03 · Practice",
    title: "Unlimited retrieval practice",
    body: "Students test themselves anytime, get instant scores, and read explanations for every question they missed.",
  },
  {
    tag: "04 · Track",
    title: "Analytics for both sides",
    body: "Students see their progress over time. Lecturers see which questions the whole class keeps missing.",
  },
];

export default function Landing() {
  return (
    <div>
      <section className="mx-auto max-w-6xl px-6 pb-20 pt-16 md:pt-24">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-amberflag">
          For GST courses in Nigerian tertiary institutions
        </p>
        <h1 className="mt-5 max-w-3xl font-display text-4xl font-bold leading-[1.1] text-ink md:text-6xl">
          Turn a lecture PDF into a practice test before the class ends.
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-slatex">
          GSTPrep AI reads what lecturers already have, generates approved multiple-choice
          questions, and gives students a reason to study GST content all semester, not just the
          week before exams.
        </p>
        <div className="mt-8 flex gap-4">
          <Link to="/register">
            <Button className="!px-6 !py-3 text-sm">Create an account</Button>
          </Link>
          <Link to="/login">
            <Button variant="ghost" className="!px-6 !py-3 text-sm">
              I already have one
            </Button>
          </Link>
        </div>
      </section>

      <section className="border-t border-ink/10 bg-white/50">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-px bg-ink/10 md:grid-cols-2">
          {modules.map((m) => (
            <div key={m.tag} className="bg-parchment p-8 md:p-10">
              <p className="font-mono text-xs uppercase tracking-widest text-moss">{m.tag}</p>
              <h3 className="mt-3 font-display text-xl font-semibold text-ink">{m.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slatex">{m.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <Card className="flex flex-col items-start gap-4 p-8 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="font-display text-xl font-semibold text-ink">
              Lecturer or student — pick a role when you register.
            </h3>
            <p className="mt-1 text-sm text-slatex">
              Each role gets a purpose-built dashboard. You can register as many courses as you
              need.
            </p>
          </div>
          <Link to="/register">
            <Button variant="accent" className="!px-6 !py-3 text-sm whitespace-nowrap">
              Register now
            </Button>
          </Link>
        </Card>
      </section>
    </div>
  );
}
