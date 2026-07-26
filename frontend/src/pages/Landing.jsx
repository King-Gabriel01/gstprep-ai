import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const steps = [
  {
    n: '01',
    title: 'Lecturer uploads course material',
    body: 'A PDF of lecture notes, a textbook chapter, or a course outline — whatever already exists.',
  },
  {
    n: '02',
    title: 'AI reads and drafts questions',
    body: 'The material is chunked and read carefully, and multiple-choice questions are drafted with distractors, explanations, and difficulty tags.',
  },
  {
    n: '03',
    title: 'Lecturer reviews and approves',
    body: 'Nothing reaches a student unreviewed. Edit, approve, or reject each question before it enters the bank.',
  },
  {
    n: '04',
    title: 'Students practice and track progress',
    body: 'Timed practice sets, instant feedback, and a personal breakdown of strong and weak topics.',
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="relative max-w-6xl mx-auto px-6 pt-20 pb-24 overflow-hidden">
        {/* Ambient glow, subtle signature element */}
        <div
          className="pointer-events-none absolute -top-32 right-0 w-[32rem] h-[32rem] rounded-full opacity-[0.15] blur-[100px]"
          style={{ background: 'radial-gradient(circle, #4A9B7F 0%, transparent 70%)' }}
          aria-hidden="true"
        />

        <div className="relative max-w-3xl animate-fade-slide-up">
          <p className="font-mono text-xs tracking-widest text-moss-400 uppercase mb-6">
            For Nigerian tertiary institutions · GST courses
          </p>
          <h1 className="font-display text-5xl sm:text-6xl leading-[1.05] font-semibold tracking-tight text-paper">
            Turn your course notes into a{' '}
            <span className="italic text-moss-400">practice test</span>, automatically.
          </h1>
          <p className="mt-6 text-lg text-paper/70 leading-relaxed max-w-xl">
            GSTPrep AI reads the material lecturers already have and drafts multiple-choice
            questions from it — reviewed by the lecturer, practiced by the student, tracked
            over time.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link to="/register" className="btn-primary">
              Create your account
            </Link>
            <Link to="/login" className="btn-secondary">
              I already have one
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y border-ink-border bg-ink-raised">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <p className="font-mono text-xs tracking-widest text-muted uppercase mb-10">
            How it works
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {steps.map((s, i) => (
              <div
                key={s.n}
                className="border-t border-ink-border pt-5 transition-colors duration-300 hover:border-moss-500/40 animate-fade-slide-up"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <span className="font-display text-3xl text-gold">{s.n}</span>
                <h3 className="mt-3 font-semibold text-paper">{s.title}</h3>
                <p className="mt-2 text-sm text-paper/55 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-8">
        <div className="card card-hover">
          <h3 className="font-display text-2xl font-semibold text-paper">For lecturers</h3>
          <p className="mt-3 text-paper/65 leading-relaxed">
            Stop writing MCQs from scratch every semester. Upload what you already teach from,
            review the AI's draft, and publish a question bank in minutes rather than days.
          </p>
          <ul className="mt-5 space-y-2 text-sm text-paper/65">
            <li>— Full approval workflow before students see anything</li>
            <li>— Class-wide analytics: weak topics, most-missed questions</li>
            <li>— Schedule formal timed assessments from your approved bank</li>
          </ul>
        </div>
        <div className="card card-hover">
          <h3 className="font-display text-2xl font-semibold text-paper">For students</h3>
          <p className="mt-3 text-paper/65 leading-relaxed">
            Practice with questions drawn directly from your own course material, not generic
            test banks. Get instant explanations and see exactly which topics need more work.
          </p>
          <ul className="mt-5 space-y-2 text-sm text-paper/65">
            <li>— Unlimited practice sessions, instantly scored</li>
            <li>— Personal topic-by-topic accuracy breakdown</li>
            <li>— Enrol in any course with a single code</li>
          </ul>
        </div>
      </section>

      <footer className="border-t border-ink-border py-8">
        <div className="max-w-6xl mx-auto px-6 text-xs text-muted font-mono">
          GSTPrep AI — Final year project, Department of Computer Science
        </div>
      </footer>
    </div>
  );
}
