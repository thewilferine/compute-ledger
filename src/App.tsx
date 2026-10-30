import { Activity, ArrowUpRight, Database, ShieldCheck } from "lucide-react";

const principles = [
  {
    icon: Database,
    title: "Source-backed data",
    description: "Published prices and technical details are linked to their original sources and capture dates.",
  },
  {
    icon: Activity,
    title: "Explicit assumptions",
    description: "Estimated serving costs are presented as scenarios, not as facts about a provider's internal accounts.",
  },
  {
    icon: ShieldCheck,
    title: "Auditable methodology",
    description: "Inputs, calculations, and changes are designed to be inspectable and reproducible.",
  },
];

export default function App() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8 sm:px-10">
      <header className="flex items-center justify-between border-b border-white/10 pb-6">
        <a className="text-sm font-semibold tracking-[0.2em] text-cyan-300 uppercase" href="#">
          The Compute Ledger
        </a>
        <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-slate-400">
          Early development
        </span>
      </header>

      <section className="grid flex-1 items-center gap-12 py-20 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <p className="mb-5 text-sm font-medium tracking-[0.18em] text-cyan-300 uppercase">
            Understanding the economics of AI
          </p>
          <h1 className="max-w-3xl text-5xl leading-[1.08] font-semibold tracking-tight text-white sm:text-6xl">
            What does AI really cost to serve?
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-400">
            An independent, transparent look at the estimated cost of AI inference,
            the value of consumer plans, and the assumptions behind the numbers.
          </p>
          <div className="mt-9 flex items-center gap-3 text-sm text-slate-500">
            <span className="h-px w-10 bg-cyan-400" />
            Research and methodology first. Estimates with caveats, always.
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-7 shadow-2xl shadow-black/20">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">The project premise</span>
            <ArrowUpRight className="size-5 text-cyan-300" />
          </div>
          <p className="mt-6 text-2xl leading-snug font-medium text-white">
            Transparency over false precision.
          </p>
          <p className="mt-4 text-sm leading-6 text-slate-400">
            Provider infrastructure costs and per-user profitability are not
            public. This project will make its estimates understandable rather
            than pretend to know what cannot be verified.
          </p>
          <div className="mt-8 border-t border-white/10 pt-5 text-xs tracking-wide text-slate-500 uppercase">
            No provider has endorsed this project
          </div>
        </div>
      </section>

      <section className="grid gap-4 border-t border-white/10 py-10 md:grid-cols-3">
        {principles.map(({ icon: Icon, title, description }) => (
          <article key={title} className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
            <Icon className="size-5 text-cyan-300" />
            <h2 className="mt-4 font-medium text-white">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
          </article>
        ))}
      </section>

      <footer className="border-t border-white/10 py-5 text-xs text-slate-500">
        Independent research project · Methodology and source notes to follow
      </footer>
    </main>
  );
}
