import Link from "next/link";
import {
  Zap,
  FileInput,
  Mail,
  LayoutDashboard,
  Users,
  Workflow,
  FileText,
  MessageSquare,
  CheckCircle2,
  Smartphone,
  Send,
  Target,
  ListTodo,
  FolderOpen,
  PenTool,
  ArrowRight,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="text-xl font-bold tracking-tight">
            CreditLyft
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-slate-400 hover:text-white">
              Features
            </a>
            <a href="#import" className="text-sm text-slate-400 hover:text-white">
              Import & Disputes
            </a>
            <a href="#portal" className="text-sm text-slate-400 hover:text-white">
              Client Portal
            </a>
            <Link href="/lead" className="text-sm text-slate-400 hover:text-white">
              Get in touch
            </Link>
            <a href="#journey" className="text-sm text-slate-400 hover:text-white">
              Client Journey
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-200 hover:border-orange-500/50 hover:bg-orange-500/10 hover:text-white"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
            >
              Create account
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative border-b border-white/10 px-4 py-20 md:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(249,115,22,0.08),transparent)]" />
        <div className="relative mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
            The industry-leading credit repair software
          </h1>
          <p className="mt-6 text-xl text-slate-400">
            Introducing the most advanced all-in-one system ever created
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-6 py-3 font-semibold text-white hover:bg-orange-600"
            >
              Take a tour
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-600 px-6 py-3 font-medium text-slate-200 hover:border-orange-500/50 hover:bg-orange-500/10"
            >
              Sign in
            </Link>
          </div>
          <p className="mt-8 text-sm text-slate-500">Dispute automation that works</p>
          <div className="mt-12 flex flex-wrap justify-center gap-8 text-sm text-slate-400">
            <span className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-orange-500" />
              All-in-one system
            </span>
            <span className="flex items-center gap-2">
              <FileInput className="h-5 w-5 text-orange-500" />
              1-click import & disputes
            </span>
            <span className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-orange-500" />
              Automated emails
            </span>
            <span className="flex items-center gap-2">
              <LayoutDashboard className="h-5 w-5 text-orange-500" />
              Client portal
            </span>
          </div>
        </div>
      </section>

      {/* System highlights */}
      <section id="features" className="border-b border-white/10 px-4 py-16 md:py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-2xl font-bold md:text-3xl">
            So much more than just dispute software
          </h2>
          <p className="mt-4 text-center text-slate-400">
            Gone are the days of missing features, slow systems and difficult client communication
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Users, title: "Customer CRM", desc: "Manage clients and contacts in one place" },
              { icon: Workflow, title: "Workflows & notifications", desc: "Customizable automations and email campaigns" },
              { icon: LayoutDashboard, title: "Branded client portal", desc: "Documents, progress, messages — your branding" },
              { icon: FileInput, title: "Credit report import", desc: "Import reports and track scores by bureau" },
              { icon: PenTool, title: "Dispute letter builder", desc: "Templates and letter library for bureau & creditor disputes" },
              { icon: CheckCircle2, title: "And it&apos;s built right", desc: "Clean, fast, responsive — desktop, tablet & phone" },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-xl border border-white/10 bg-white/5 p-6 transition-colors hover:border-orange-500/30 hover:bg-white/[0.07]"
              >
                <Icon className="h-8 w-8 text-orange-500" />
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-slate-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Import & Disputes */}
      <section id="import" className="border-b border-white/10 px-4 py-16 md:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold md:text-3xl">Import & disputes</h2>
              <p className="mt-4 text-slate-400">
                The most intuitive credit import and dispute process. One-click import, make changes
                right on the report, create letters on the fly.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  "Credit report import and score tracking",
                  "Negative items and dispute rounds",
                  "On-page dispute management",
                  "Letter generator with templates",
                  "Batch letter generation",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-slate-300">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-orange-500" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="mt-8 inline-flex items-center gap-2 text-orange-500 hover:text-orange-400"
              >
                Get started
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-8">
              <FileText className="h-12 w-12 text-orange-500" />
              <h3 className="mt-4 font-semibold">Dispute management</h3>
              <p className="mt-2 text-sm text-slate-400">
                Track dispute rounds by bureau and creditor. Generate dispute letters, track
                outcomes, and keep client files moving.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Multi-step campaigns */}
      <section className="border-b border-white/10 px-4 py-16 md:py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-2xl font-bold md:text-3xl">Multi-step campaigns</h2>
          <p className="mt-4 text-center text-slate-400">
            Automate client onboarding, education, and follow-ups with email campaigns
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              "Client onboarding emails",
              "Education & nurture campaigns",
              "Reminders for required documents",
              "Score update notifications",
              "Pre-loaded, editable campaigns",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 px-6 py-4"
              >
                <Mail className="h-6 w-6 shrink-0 text-orange-500" />
                <span className="text-slate-200">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Communication center */}
      <section className="border-b border-white/10 px-4 py-16 md:py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-2xl font-bold md:text-3xl">
            All-in-one communication center
          </h2>
          <p className="mt-4 text-center text-slate-400">
            Stay on top of client communication with the tools you need
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <MessageSquare className="h-10 w-10 text-orange-500" />
              <h3 className="mt-4 font-semibold">Client portal messages</h3>
              <p className="mt-2 text-sm text-slate-400">
                2-way messaging. Clients get email when you send a message.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <Mail className="h-10 w-10 text-orange-500" />
              <h3 className="mt-4 font-semibold">Email notifications</h3>
              <p className="mt-2 text-sm text-slate-400">
                Automated alerts for new messages and key updates.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <LayoutDashboard className="h-10 w-10 text-orange-500" />
              <h3 className="mt-4 font-semibold">Client portal</h3>
              <p className="mt-2 text-sm text-slate-400">
                Secure portal for documents, progress, and messages.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Branded client portal */}
      <section id="portal" className="border-b border-white/10 px-4 py-16 md:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold md:text-3xl">Branded client portal</h2>
              <p className="mt-4 text-slate-400">
                Clients log in to check status, upload documents, and see their progress.
              </p>
              <ul className="mt-8 space-y-3">
                {[
                  "Required documents checklist",
                  "Document vault with categories",
                  "Digital agreement signature",
                  "Score snapshot and history",
                  "Tablet and mobile friendly",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-slate-300">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-orange-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-8">
              <FolderOpen className="h-12 w-12 text-orange-500" />
              <h3 className="mt-4 font-semibold">Documents & progress</h3>
              <p className="mt-2 text-sm text-slate-400">
                Upload ID, dispute docs, credit reports. Track funding readiness and tasks.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tablet & mobile */}
      <section className="border-b border-white/10 px-4 py-16 md:py-20">
        <div className="mx-auto max-w-4xl text-center">
          <Smartphone className="mx-auto h-14 w-14 text-orange-500" />
          <h2 className="mt-6 text-2xl font-bold md:text-3xl">Tablet & mobile friendly</h2>
          <p className="mt-4 text-slate-400">
            Run your credit repair workflow from anywhere. All pages optimized for tablet and phone.
          </p>
          <ul className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-slate-300">
            <li>All pages responsive</li>
            <li>Client portal on any device</li>
            <li>Document upload from phone</li>
            <li>Fast, clean interface</li>
          </ul>
        </div>
      </section>

      {/* Features spotlight */}
      <section className="border-b border-white/10 px-4 py-16 md:py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-2xl font-bold md:text-3xl">
            Credit repair features spotlight
          </h2>
          <p className="mt-4 text-center text-slate-400">
            A quick look at what makes the system powerful
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: LayoutDashboard, title: "Live dashboard", desc: "Track alerts, notifications and messages" },
              { icon: FileInput, title: "Report import", desc: "Import credit reports and track bureau scores" },
              { icon: Workflow, title: "Workflows", desc: "Automate onboarding, updates and follow-ups" },
              { icon: FileText, title: "Letter library", desc: "Dispute letter templates and generator" },
              { icon: LayoutDashboard, title: "Client portal", desc: "Branded portal for progress and docs" },
              { icon: ListTodo, title: "Notes, tasks & reminders", desc: "Centralized client progress and floating notes" },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-xl border border-white/10 bg-white/5 p-6 transition-colors hover:border-orange-500/30"
              >
                <Icon className="h-8 w-8 text-orange-500" />
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-slate-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Letters & print */}
      <section className="border-b border-white/10 px-4 py-16 md:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <Send className="h-12 w-12 text-orange-500" />
              <h2 className="mt-4 text-2xl font-bold md:text-3xl">Letters & batch generation</h2>
              <p className="mt-4 text-slate-400">
                Generate dispute letters from templates. Bureau, MOV, creditor direct, CFPB. Batch
                generation and download.
              </p>
              <ul className="mt-6 space-y-2 text-slate-300">
                <li>• Letter template library</li>
                <li>• Per-client letter generator</li>
                <li>• PDF download</li>
              </ul>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-8">
              <FileText className="h-12 w-12 text-orange-500" />
              <h3 className="mt-4 font-semibold">Dispute letters</h3>
              <p className="mt-2 text-sm text-slate-400">
                Pre-loaded letter types. Add your own templates. Create letters on the fly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Client journey */}
      <section id="journey" className="border-b border-white/10 px-4 py-16 md:py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-2xl font-bold md:text-3xl">The client journey</h2>
          <p className="mt-4 text-center text-slate-400">
            Track your client&apos;s credit repair progress with milestones and alerts
          </p>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Target, label: "Progress & scores" },
              { icon: FileText, label: "Disputes & letters" },
              { icon: MessageSquare, label: "Communications" },
              { icon: ListTodo, label: "Tasks & timeline" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 px-6 py-4"
              >
                <Icon className="h-8 w-8 text-orange-500" />
                <span className="font-medium">{label}</span>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm text-slate-400">
            <span>Quick overview</span>
            <span>•</span>
            <span>Stage progress</span>
            <span>•</span>
            <span>Current scores</span>
            <span>•</span>
            <span>Documents</span>
            <span>•</span>
            <span>Alerts</span>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-20 md:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold md:text-4xl">Discover what you&apos;ve been missing</h2>
          <p className="mt-6 text-slate-400">
            Take a deeper look at your credit repair software. All-in-one system, client portal,
            dispute management, and more.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-6 py-3 font-semibold text-white hover:bg-orange-600"
            >
              Create account
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-600 px-6 py-3 font-medium text-slate-200 hover:border-orange-500/50 hover:bg-orange-500/10"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <p className="text-sm text-slate-500">CreditLyft — Credit repair software</p>
            <div className="flex gap-8 text-sm text-slate-500">
              <Link href="/login" className="hover:text-slate-300">
                Sign in
              </Link>
              <Link href="/register" className="hover:text-slate-300">
                Create account
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
