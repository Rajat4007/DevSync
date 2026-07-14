import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useScrollToSection } from "../hooks/useScrollToSection";
import {
  KanbanSquare,
  BarChart3,
  ShieldCheck,
  ArrowRight,
  Zap,
  Users,
  GitBranch,
  CheckCircle2,
  Menu,
  X,
} from "lucide-react";

function Landing() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const scrollToSection = useScrollToSection();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-sans selection:bg-violet-500 selection:text-white">
      {/* ── STICKY NAVBAR ───────────────────────────────────────────── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-[#0a0a0f]/90 backdrop-blur-xl border-bborder-white/6 shadow-2xl shadow-black/40"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-15 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
              <GitBranch className="w-4 h-4 text-white" />
            </div>
            <span className="text-[15px] font-bold tracking-tight text-white">
              Dev<span className="text-violet-400">Sync</span>
            </span>
          </div>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-8 text-[13px] font-medium text-white/50">
            <button
              onClick={() => scrollToSection("features")}
              className="hover:text-white transition-colors bg-transparent border-0 text-[13px] font-medium text-white/50 cursor-pointer"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection("workflow")}
              className="hover:text-white transition-colors bg-transparent border-0 text-[13px] font-medium text-white/50 cursor-pointer"
            >
              Workflow
            </button>
            <button
              onClick={() => scrollToSection("stack")}
              className="hover:text-white transition-colors bg-transparent border-0 text-[13px] font-medium text-white/50 cursor-pointer"
            >
              Stack
            </button>
          </div>

          {/* Auth buttons  */}
          <div className="flex items-center gap-2.5">
            <Link
              to="/login"
              className="hidden sm:inline-flex items-center text-[13px] font-medium text-white/60 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/6 transition-all"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold bg-violet-600 hover:bg-violet-500 text-white px-4 py-1.5 rounded-lg transition-all shadow-lg shadow-violet-900/40"
            >
              Get Started
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            {/* Mobile hamburger */}
            <button
              className="md:hidden ml-1 text-white/60 hover:text-white"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-tborder-white/6 bg-[#0a0a0f]/95 backdrop-blur-xl px-5 py-4 flex flex-col gap-3 text-[13px] font-medium text-white/60">
                <button onClick={() => scrollToSection('features')} className="hover:text-white transition-colors bg-transparent border-0 text-[13px] font-medium text-white/50 cursor-pointer">
                    Features
                </button>

                <button onClick={() => scrollToSection('workflow')} className="hover:text-white transition-colors bg-transparent border-0 text-[13px] font-medium text-white/50 cursor-pointer">
                    Workflow
                </button>

                <button onClick={() => scrollToSection('stack')}    className="hover:text-white transition-colors bg-transparent border-0 text-[13px] font-medium text-white/50 cursor-pointer">
                    Stack
                </button>
                
                <Link to="/login"onClick={() => setMenuOpen(false)} className="hover:text-white transition-colors" >
                    Sign In
                </Link>
          </div>
        )}
      </nav>

      
      <section className="relative pt-36 pb-24 px-5 sm:px-8 overflow-hidden">
        {/* Background grid */}
        <div
          className="absolute inset-0 -z-10 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        {/* Subtle color blob */}
        <div className="absolute top-16 left-1/2 -translate-x-1/2 w-180 h-80 -z-10 rounded-full bg-violet-700/10 blur-[100px]" />

        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/[0.07] px-3.5 py-1 text-[12px] font-medium text-violet-300 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            Real-time · Collaborative · Agile
          </div>

          <h1 className="text-[clamp(2.4rem,6vw,4rem)] font-extrabold leading-[1.1] tracking-tight text-white mb-5">
            Your team's workflow, <br className="hidden sm:block" />
            <span className="text-violet-400">finally in sync.</span>
          </h1>

          <p className="text-[15px] sm:text-[17px] text-white/45 max-w-xl mx-auto leading-relaxed mb-10">
            A Kanban-first project management workspace built for engineering
            teams — with live sync, role-based access, and sprint analytics that
            actually matter.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold px-7 py-3 rounded-xl text-[14px] transition-all shadow-xl shadow-violet-900/40 group"
            >
              Start building free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-white/60 hover:text-white text-[14px] font-medium px-7 py-3 rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/4 transition-all"
            >
              View live demo
            </Link>
          </div>

          {/* Social proof line */}
          <p className="mt-8 text-[12px] text-white/25">
            No credit card required · MERN Stack · Socket.io powered
          </p>
        </div>

        {/* Hero mock window */}
        <div className="relative max-w-4xl mx-auto mt-16">
          <div className="rounded-2xl border border-white/8 bg-[#111118] overflow-hidden shadow-2xl shadow-black/60">
            {/* Window chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-bborder-white/6 bg-[#0e0e15]">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
              <span className="ml-4 text-[11px] text-white/20 font-mono">
                devsync.app/board/sprint-14
              </span>
              <span className="ml-auto flex items-center gap-1 text-[11px] text-green-400/70">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                3 online
              </span>
            </div>
            {/* Kanban columns preview */}
            <div className="p-5 grid grid-cols-4 gap-3 overflow-hidden">
              {[
                {
                  col: "To Do",
                  color: "text-white/40",
                  cards: ["Auth middleware", "User schema", "Setup .env"],
                },
                {
                  col: "In Progress",
                  color: "text-blue-400",
                  cards: ["JWT routes", "Socket setup"],
                },
                {
                  col: "Review",
                  color: "text-amber-400",
                  cards: ["Kanban API"],
                },
                {
                  col: "Done",
                  color: "text-green-400",
                  cards: ["DB connection", "Express server", "CORS config"],
                },
              ].map(({ col, color, cards }) => (
                <div key={col} className="min-w-0">
                  <div
                    className={`text-[11px] font-semibold uppercase tracking-wider mb-3 ${color}`}
                  >
                    {col}
                    <span className="ml-1.5 text-white/20 font-normal normal-case tracking-normal">
                      {cards.length}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {cards.map((c) => (
                      <div
                        key={c}
                        className="rounded-lg bg-white/4 borderborder-white/6 px-3 py-2.5 text-[11px] text-white/70 hover:bg-white/[0.07] transition-colors cursor-default"
                      >
                        {c}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Glow under card */}
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-2/3 h-16 bg-violet-700/20 blur-2xl rounded-full -z-10" />
        </div>
      </section>

      {/* ── STATS BAR ─── */}
      <section className="border-yborder-white/6 bg-white/1.15">
        <div className="max-w-4xl mx-auto px-5 py-6 grid grid-cols-3 divide-x divide-white/6">
          {[
            { val: "Socket.io", label: "Real-time sync engine" },
            { val: "RBAC", label: "Role-based access control" },
            { val: "Recharts", label: "Sprint analytics charts" },
          ].map(({ val, label }) => (
            <div key={val} className="px-4 sm:px-8 text-center">
              <div className="text-[15px] sm:text-[17px] font-bold text-white">
                {val}
              </div>
              <div className="text-[11px] sm:text-[12px] text-white/35 mt-0.5">
                {label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ───*/}
      <section id="features" className="max-w-6xl mx-auto px-5 sm:px-8 py-24">
        <div className="mb-14">
          <p className="text-[12px] font-semibold uppercase tracking-widest text-violet-400 mb-3">
            Features
          </p>
          <h2 className="text-[clamp(1.6rem,3.5vw,2.2rem)] font-bold tracking-tight text-white max-w-lg leading-snug">
            Everything a dev team needs, nothing they don't.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              icon: <KanbanSquare className="w-5 h-5" />,
              title: "Live Kanban Board",
              body: "Four-column drag-and-drop board — To Do, In Progress, Review, Done. Any change made by any teammate reflects instantly across all open sessions.",
              tag: "Socket.io",
            },
            {
              icon: <BarChart3 className="w-5 h-5" />,
              title: "Sprint Dashboard",
              body: "Visual breakdown of task velocity, completion rates, and team load using Recharts. Know exactly where your sprint stands without opening Slack.",
              tag: "Recharts",
            },
            {
              icon: <ShieldCheck className="w-5 h-5" />,
              title: "JWT + Role Guard",
              body: "Secure auth with bcrypt-hashed passwords and signed JWTs. Admin, Member, and Viewer roles gate every API route and board action.",
              tag: "JWT + RBAC",
            },
            {
              icon: <Zap className="w-5 h-5" />,
              title: "Instant Updates",
              body: "WebSocket rooms scoped to each project board. Only relevant clients get events — no wasted bandwidth, no polling.",
              tag: "WebSockets",
            },
            {
              icon: <Users className="w-5 h-5" />,
              title: "Team Workspaces",
              body: "Invite teammates, assign roles, and manage multiple projects under a single account. Built for small squads and scale-ups alike.",
              tag: "Multi-user",
            },
            {
              icon: <CheckCircle2 className="w-5 h-5" />,
              title: "Task Detail View",
              body: "Rich task cards with assignees, priority labels, due dates, and description. Everything tracked, nothing lost in thread.",
              tag: "Task Mgmt",
            },
          ].map(({ icon, title, body, tag }) => (
            <div
              key={title}
              className="group relative rounded-2xl border border-white/[0.07] bg-white/2.5 p-6 hover:border-violet-500/30 hover:bg-violet-500/3 transition-all duration-300"
            >
              <div className="w-9 h-9 rounded-lg bg-violet-600/15 border border-violet-500/20 text-violet-400 flex items-center justify-center mb-4 group-hover:bg-violet-600 group-hover:text-white group-hover:border-transparent transition-all duration-300">
                {icon}
              </div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="text-[14px] font-bold text-white leading-snug">
                  {title}
                </h3>
                <span className="shrink-0 text-[10px] font-semibold text-violet-400/70 bg-violet-500/10 border border-violet-500/15 px-2 py-0.5 rounded-full">
                  {tag}
                </span>
              </div>
              <p className="text-[13px] text-white/40 leading-relaxed">
                {body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── WORKFLOW ────────────────────────────────────────────────── */}
      <section
        id="workflow"
        className="border-tborder-white/6 bg-white/1"
      >
        <div className="max-w-4xl mx-auto px-5 sm:px-8 py-24">
          <div className="text-center mb-14">
            <p className="text-[12px] font-semibold uppercase tracking-widest text-violet-400 mb-3">
              Workflow
            </p>
            <h2 className="text-[clamp(1.6rem,3.5vw,2.2rem)] font-bold tracking-tight text-white">
              From signup to shipping in four steps
            </h2>
          </div>
          <div className="flex flex-col gap-0">
            {[
              {
                n: "01",
                title: "Create your workspace",
                body: "Sign up, name your project, and invite your team. Role assignments take seconds.",
              },
              {
                n: "02",
                title: "Build your backlog",
                body: "Add task cards with priority, assignee, and due date. Drag them into the right column.",
              },
              {
                n: "03",
                title: "Ship the sprint",
                body: "Watch tasks move in real-time as teammates update them. No refresh, no stale boards.",
              },
              {
                n: "04",
                title: "Review with data",
                body: "Head to the dashboard for burndown charts and completion metrics after each sprint.",
              },
            ].map(({ n, title, body }, i, arr) => (
              <div
                key={n}
                className={`flex gap-6 ${i < arr.length - 1 ? "pb-8" : ""} relative`}
              >
                {/* Line connector */}
                {i < arr.length - 1 && (
                  <div className="absolute left-4.75 top-10 bottom-0 w-px bg-white/6" />
                )}
                <div className="shrink-0 w-10 h-10 rounded-full border border-white/10 bg-white/3 flex items-center justify-center text-[11px] font-bold text-white/30 z-10">
                  {n}
                </div>
                <div className="pt-1.5">
                  <h3 className="text-[15px] font-bold text-white mb-1">
                    {title}
                  </h3>
                  <p className="text-[13px] text-white/40 leading-relaxed">
                    {body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TECH STACK ── */}
      <section id="stack" className="border-tborder-white/6">
        <div className="max-w-4xl mx-auto px-5 sm:px-8 py-16 text-center">
          <p className="text-[12px] font-semibold uppercase tracking-widest text-white/25 mb-6">
            Built with
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {[
              "MongoDB",
              "Express",
              "React",
              "Node.js",
              "Socket.io",
              "JWT",
              "Tailwind CSS",
              "Recharts",
              "bcryptjs",
            ].map((tech) => (
              <span
                key={tech}
                className="px-3.5 py-1.5 rounded-full border border-white/8 bg-white/3 text-[12px] font-medium text-white/50 hover:text-white hover:border-white/20 transition-all"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──── */}
      <section className="border-tborder-white/6">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 py-28 text-center">
          <h2 className="text-[clamp(1.8rem,4vw,2.6rem)] font-extrabold tracking-tight text-white mb-4 leading-snug">
            Ship smarter with your team.
          </h2>
          <p className="text-[15px] text-white/40 mb-10 max-w-md mx-auto leading-relaxed">
            Get a live Kanban board, real-time sync, and sprint metrics set up
            in under a minute — completely free.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold px-8 py-3.5 rounded-xl text-[14px] transition-all shadow-xl shadow-violet-900/40 group"
          >
            Create your workspace
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <p className="mt-5 text-[11px] text-white/20">
            No card needed · Built on MERN · Open source
          </p>
        </div>
      </section>

      {/* ── FOOTER ──── */}
      <footer className="border-tborder-white/6 py-7 px-5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-violet-600 flex items-center justify-center">
              <GitBranch className="w-3 h-3 text-white" />
            </div>
            <span className="text-[13px] font-semibold text-white/50">
              Dev<span className="text-violet-400/80">Sync</span>
            </span>
          </div>
          <p className="text-[12px] text-white/25">
            © 2026 DevSync — Built as a MERN portfolio project
          </p>
          <div className="flex gap-4 text-[12px] text-white/30">
            <Link to="/login" className="hover:text-white/60 transition-colors">
              Sign In
            </Link>
            <Link
              to="/register"
              className="hover:text-white/60 transition-colors"
            >
              Register
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Landing;
