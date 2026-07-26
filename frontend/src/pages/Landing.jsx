import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const steps = [
  {
    n: '01',
    title: 'Lecturer uploads course material',
    body: 'A PDF of lecture notes, a textbook chapter, or a course outline. Whatever already exists in your teaching folder.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
        <path d="M12 18v-6" />
        <path d="M9.5 15.5 12 12l2.5 3.5" />
      </svg>
    ),
  },
  {
    n: '02',
    title: 'AI reads and drafts questions',
    body: 'The material is read carefully and split into sections, and multiple-choice questions are drafted with distractors, explanations, and difficulty tags.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 8V4H8" />
        <rect x="4" y="8" width="16" height="12" rx="2" />
        <path d="M2 14h2" />
        <path d="M20 14h2" />
        <path d="M9 13v2" />
        <path d="M15 13v2" />
      </svg>
    ),
  },
  {
    n: '03',
    title: 'Lecturer reviews and approves',
    body: 'Nothing reaches a student unreviewed. Edit, approve, or reject each question before it enters the bank.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22c5.5-1.5 8-5 8-10V5l-8-3-8 3v7c0 5 2.5 8.5 8 10Z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
  {
    n: '04',
    title: 'Students practice and track progress',
    body: 'Timed practice sets, instant feedback, and a personal breakdown of strong and weak topics over time.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" />
        <path d="M18.4 8.6 13 14l-3-3-4.5 4.5" />
      </svg>
    ),
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="relative max-w-6xl mx-auto px-6 pt-20 pb-28 lg:pb-36 overflow-hidden">
        {/* Layered ambient glows */}
        <div
          className="pointer-events-none absolute -top-24 right-[-4rem] w-[30rem] h-[30rem] rounded-full opacity-[0.18] blur-[90px]"
          style={{ background: 'radial-gradient(circle, #4A9B7F 0%, transparent 70%)' }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute top-40 right-24 w-72 h-72 rounded-full opacity-[0.14] blur-[80px]"
          style={{ background: 'radial-gradient(circle, #D9A441 0%, transparent 70%)' }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute top-10 left-1/2 w-64 h-64 rounded-full opacity-[0.1] blur-[70px]"
          style={{ background: 'radial-gradient(circle, #C1622D 0%, transparent 70%)' }}
          aria-hidden="true"
        />

        <div className="relative max-w-3xl animate-fade-slide-up">
          <p className="font-display italic text-moss-400 text-sm mb-3">Study what's actually on your syllabus.</p>
          <p className="font-mono text-xs tracking-widest text-muted uppercase mb-6">
            Built for Nigerian tertiary institutions
          </p>
          <h1 className="font-display text-5xl sm:text-6xl leading-[1.05] tracking-tight text-paper">
            <span className="font-normal">Your GST course notes,</span>{' '}
            <span className="font-semibold italic text-moss-400">turned into a practice test</span>
          </h1>
          <p className="mt-6 text-lg text-paper/70 leading-relaxed max-w-xl">
            GSTPrep AI is a study platform built specifically for General Studies courses. Lecturers
            upload the material they already teach from, and AI drafts multiple-choice questions
            from it in minutes. Every question is reviewed before students ever see it. Students then
            get unlimited practice, instant feedback, and a clear picture of exactly which topics
            still need work, all drawn from their own coursework rather than a generic question bank.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link to="/register" className="btn-primary btn-ripple">
              Create your account
            </Link>
            <Link to="/login" className="btn-secondary btn-ripple">
              I already have one
            </Link>
          </div>
        </div>

        {/* Floating "live" cards */}
        <div
          className="hidden lg:block absolute top-8 right-4 card !p-3 w-52 animate-fade-slide-up shadow-[0_20px_50px_-15px_rgba(0,0,0,0.6)]"
          style={{ animationDelay: '250ms' }}
        >
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-moss-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-moss-400" />
            </span>
            <p className="text-xs font-mono text-muted uppercase tracking-wider">Just now</p>
          </div>
          <p className="mt-2 text-sm text-paper/90">
            <span className="font-semibold text-moss-400">18 questions</span> drafted from{' '}
            <span className="font-mono text-xs text-paper/60">GST101 Handouts.pdf</span>
          </p>
        </div>

        <div
          className="hidden lg:block absolute top-52 right-20 card !p-3 w-48 animate-fade-slide-up shadow-[0_20px_50px_-15px_rgba(0,0,0,0.6)]"
          style={{ animationDelay: '400ms' }}
        >
          <p className="text-xs font-mono text-muted uppercase tracking-wider">Practice result</p>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-2xl font-display font-semibold text-gold">86%</p>
            <span className="pill bg-gold/10 text-gold border border-gold/25 text-[10px]">9/10 correct</span>
          </div>
        </div>
      </section>

      <section className="border-y border-ink-border bg-ink-raised">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <p className="font-mono text-xs tracking-widest text-muted uppercase mb-2">How it works</p>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-paper mb-10 max-w-xl">
            From lecture notes to a scored practice test, in four steps.
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {steps.map((s, i) => (
              <div
                key={s.n}
                className="border-t border-ink-border pt-5 transition-colors duration-300 hover:border-moss-500/40 animate-fade-slide-up"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="w-11 h-11 rounded-xl bg-moss-500/10 border border-moss-500/25 flex items-center justify-center text-moss-400">
                  <span className="w-5 h-5">{s.icon}</span>
                </div>
                <span className="mt-4 block font-mono text-xs text-gold tracking-widest">{s.n}</span>
                <h3 className="mt-1 font-semibold text-paper">{s.title}</h3>
                <p className="mt-2 text-sm text-paper/55 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="card card-hover">
            <div className="w-11 h-11 rounded-xl bg-moss-500/10 border border-moss-500/25 flex items-center justify-center text-moss-400 mb-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M22 10v6M2 10l10-5 10 5-10 5-10-5Z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
            </div>
            <h3 className="font-display text-2xl font-semibold text-paper">For lecturers</h3>
            <p className="mt-3 text-paper/65 leading-relaxed">
              Stop writing MCQs from scratch every semester. Upload what you already teach from,
              review the AI's draft, and publish a question bank in minutes rather than days.
            </p>
            <ul className="mt-5 space-y-2.5 text-sm text-paper/65">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 w-1 h-1 rounded-full bg-moss-400 shrink-0" />
                Full approval workflow before students see anything
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 w-1 h-1 rounded-full bg-moss-400 shrink-0" />
                Class-wide analytics: weak topics, most-missed questions
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 w-1 h-1 rounded-full bg-moss-400 shrink-0" />
                Schedule formal timed assessments from your approved bank
              </li>
            </ul>
          </div>
          <div className="card card-hover">
            <div className="w-11 h-11 rounded-xl bg-gold/10 border border-gold/25 flex items-center justify-center text-gold mb-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
              </svg>
            </div>
            <h3 className="font-display text-2xl font-semibold text-paper">For students</h3>
            <p className="mt-3 text-paper/65 leading-relaxed">
              Practice with questions drawn directly from your own course material, not a generic
              test bank. Get instant explanations and see exactly which topics need more work.
            </p>
            <ul className="mt-5 space-y-2.5 text-sm text-paper/65">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 w-1 h-1 rounded-full bg-gold shrink-0" />
                Unlimited practice sessions, instantly scored
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 w-1 h-1 rounded-full bg-gold shrink-0" />
                Personal topic by topic accuracy breakdown
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 w-1 h-1 rounded-full bg-gold shrink-0" />
                Enrol in any course with a single code
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Coming soon: live exams */}
      <section className="border-y border-ink-border bg-ink-raised">
        <div className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-[1fr_auto] gap-10 items-center">
          <div>
            <span className="pill bg-clay/10 text-clay border border-clay/25 text-xs font-mono w-fit">Coming soon</span>
            <h2 className="mt-4 font-display text-2xl sm:text-3xl font-semibold text-paper max-w-lg">
              Live, invigilated online examinations.
            </h2>
            <p className="mt-3 text-paper/65 leading-relaxed max-w-lg">
              A dedicated exam mode is on the way: a locked-down timer, question-by-question
              submission, and a live view for lecturers to watch class progress as it happens.
              Built for real CBT-style exams, not just practice.
            </p>
          </div>
          <div className="w-40 h-40 mx-auto rounded-2xl border border-clay/25 bg-clay/5 flex items-center justify-center text-clay shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="w-16 h-16">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          </div>
        </div>
      </section>

      <footer className="border-t border-ink-border py-10">
        <div className="max-w-6xl mx-auto px-6 text-sm text-muted font-mono space-y-1">
          <p>GSTPrep AI, Final year project, Department of Mathematics and Computer Science</p>
          <p>University of Mkar, Mkar</p>
          <p className="text-paper/50">Presented by Iorwuese Kator Gabriel</p>
        </div>
      </footer>
    </div>
  );
}
