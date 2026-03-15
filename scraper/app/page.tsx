import Link from "next/link";
import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import {
  ArrowRight,
  Bot,
  Boxes,
  Database,
  Globe,
  Play,
  Rows3,
} from "lucide-react";

const heroVideoUrl = "https://www.youtube.com/embed/YOUR_VIDEO_ID";

const tabs = [
  "Browser tool for agents",
  "Workflow automation",
  "Web scraping",
];

const featureCards = [
  {
    title: "Browser-native execution",
    copy:
      "Run real browser sessions for forms, clicks, waits, pagination, and session-aware workflows.",
    icon: Globe,
  },
  {
    title: "Structured extraction",
    copy:
      "Capture tables, selectors, and repeated fields into clean rows your team can actually use.",
    icon: Rows3,
  },
  {
    title: "Operator-grade orchestration",
    copy:
      "Chain browsing, enrichment, exports, and integrations inside one repeatable automation surface.",
    icon: Bot,
  },
];

const footerLinks = {
  Product: ["Platform", "APIs & SDKs", "Changelog", "Docs"],
  Company: ["About", "Careers", "Partner with us", "Trust & Security"],
  Developers: ["Blog", "Github", "Status", "Examples"],
};

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f7f4ef] text-black">
      <div className="bg-[linear-gradient(rgba(0,0,0,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.06)_1px,transparent_1px)] bg-[size:88px_88px]">
        <section className="mx-auto max-w-[1600px] px-4 pb-16 pt-4 sm:px-6 lg:px-8">
          <header className="sticky top-0 z-50 border border-black bg-[#f7f4ef]/95 backdrop-blur">
            <div className="grid items-center gap-4 px-5 py-4 lg:grid-cols-[220px_1fr_260px]">
              <Link href="/" className="text-3xl font-semibold tracking-tight">
                Browsera
              </Link>

              <nav className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm font-medium">
                <a href="#platform" className="hover:underline">
                  Platform
                </a>
                <a href="#automation" className="hover:underline">
                  Automation
                </a>
                <a href="#developers" className="hover:underline">
                  Developers
                </a>
                <a href="#footer" className="hover:underline">
                  Docs
                </a>
              </nav>

              <div className="flex items-center justify-end gap-3">
                <Show when="signed-out">
                  <SignInButton mode="modal">
                    <button className="cursor-pointer text-sm font-medium hover:underline">
                      Sign in
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="inline-flex cursor-pointer items-center justify-center bg-[#f53d00] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#d63600]">
                      Get Started
                    </button>
                  </SignUpButton>
                </Show>
                <Show when="signed-in">
                  <Link href="/dashboard" className="text-sm font-medium hover:underline">
                    Dashboard
                  </Link>
                  <UserButton />
                </Show>
              </div>
            </div>
          </header>

          <div className="border-x border-b border-black bg-[#f7f4ef]">
            <div className="grid gap-10 px-6 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:px-12 lg:py-16">
              <div className="max-w-4xl">
                <div className="inline-flex items-center gap-2 border border-black bg-white px-3 py-2 text-xs font-medium uppercase tracking-[0.24em]">
                  <Boxes className="h-3.5 w-3.5" />
                  AI browser automation platform
                </div>

                <h1 className="mt-6 max-w-4xl text-5xl font-medium leading-[0.92] tracking-[-0.06em] sm:text-6xl lg:text-[5.5rem]">
                  Anything you do with a web browser,
                  <br />
                  you can do with Browsera.
                </h1>

                <p className="mt-6 max-w-2xl text-lg leading-8 text-black/70">
                  Browsera is built for structured web data extraction and RPA. Run
                  browser sessions, detect selectors, solve dynamic flows, and export
                  usable data without stitching brittle scripts together.
                </p>

                <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                  <Show when="signed-out">
                    <SignUpButton mode="modal">
                      <button className="inline-flex cursor-pointer items-center justify-center gap-2 bg-[#f53d00] px-6 py-4 text-base font-semibold text-white transition hover:bg-[#d63600]">
                        Get started
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </SignUpButton>
                    <SignInButton mode="modal">
                      <button className="inline-flex cursor-pointer items-center justify-center border border-black bg-white px-6 py-4 text-base font-semibold hover:bg-black hover:text-white">
                        Sign in
                      </button>
                    </SignInButton>
                  </Show>
                  <Show when="signed-in">
                    <Link
                      href="/dashboard"
                      className="inline-flex items-center justify-center gap-2 bg-[#f53d00] px-6 py-4 text-base font-semibold text-white transition hover:bg-[#d63600]"
                    >
                      Launch dashboard
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Show>
                </div>
              </div>

              <div className="border border-black bg-white p-3">
                <div className="border border-black bg-black">
                  <div className="flex items-center justify-between border-b border-white/20 px-4 py-3 text-xs uppercase tracking-[0.18em] text-white/70">
                    <span>Live product demo</span>
                    <span>Youtube embed</span>
                  </div>
                  <div className="aspect-video w-full">
                    <iframe
                      className="h-full w-full"
                      src={heroVideoUrl}
                      title="Browsera demo video"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen
                    />
                  </div>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <div className="border border-black bg-[#f7f4ef] p-3 text-sm">
                    Open browser
                  </div>
                  <div className="border border-black bg-[#f7f4ef] p-3 text-sm">
                    Scan selectors
                  </div>
                  <div className="border border-black bg-[#f7f4ef] p-3 text-sm">
                    Export rows
                  </div>
                </div>
              </div>
            </div>

            <div className="grid border-t border-black lg:grid-cols-3">
              {tabs.map((tab, index) => (
                <div
                  key={tab}
                  className={`border-black px-8 py-6 text-2xl tracking-tight ${
                    index === 0
                      ? "bg-[#2d2725] text-white lg:border-r"
                      : index === 1
                        ? "border-t bg-[#f7f4ef] lg:border-r lg:border-t-0"
                        : "border-t bg-[#f7f4ef] lg:border-t-0"
                  }`}
                >
                  {tab}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="platform" className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
          <div className="grid border border-black bg-white lg:grid-cols-[1.1fr_0.9fr]">
            <div className="border-b border-black p-8 lg:border-b-0 lg:border-r lg:p-12">
              <h2 className="max-w-2xl text-4xl font-medium leading-tight tracking-[-0.04em] sm:text-5xl">
                A browser base layer for operators, agents, and teams that need
                repeatable web actions.
              </h2>
              <div className="mt-8 space-y-6 text-lg leading-8 text-black/72">
                <p>
                  Browsera sits between manual web work and fragile scripts. It gives
                  you a product surface for websites that do not expose clean APIs.
                </p>
                <p>
                  That means structured extraction, workflow automation, form handling,
                  and browser-driven RPA from one place.
                </p>
              </div>
            </div>

            <div className="p-8 lg:p-12">
              <ul className="space-y-7 text-lg leading-8 text-black/76">
                <li className="flex gap-4">
                  <span className="mt-3 h-2.5 w-2.5 bg-black" />
                  Detect forms, fields, and selectors directly from live pages.
                </li>
                <li className="flex gap-4">
                  <span className="mt-3 h-2.5 w-2.5 bg-black" />
                  Run human-like browser flows for scraping, navigation, and task automation.
                </li>
                <li className="flex gap-4">
                  <span className="mt-3 h-2.5 w-2.5 bg-black" />
                  Export structured outputs into files, APIs, and downstream storage systems.
                </li>
              </ul>

              <div className="mt-10 grid gap-px border border-black bg-black sm:grid-cols-2">
                <div className="bg-[#f7f4ef] p-5">
                  <p className="text-sm font-medium">Structured outputs</p>
                  <p className="mt-2 text-sm text-black/65">
                    CSV, Excel, JSON, APIs, MongoDB, and Milvus.
                  </p>
                </div>
                <div className="bg-[#f7f4ef] p-5">
                  <p className="text-sm font-medium">Execution modes</p>
                  <p className="mt-2 text-sm text-black/65">
                    Scan, click, solve captcha, paginate, and collect.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="automation"
          className="mx-auto max-w-[1600px] px-4 py-16 sm:px-6 lg:px-8"
        >
          <div className="grid gap-px border border-black bg-black lg:grid-cols-3">
            {featureCards.map((card) => {
              const Icon = card.icon;
              return (
                <article key={card.title} className="bg-[#f7f4ef] p-8">
                  <div className="flex h-12 w-12 items-center justify-center border border-black bg-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-6 text-2xl font-medium tracking-tight">
                    {card.title}
                  </h3>
                  <p className="mt-4 text-base leading-7 text-black/68">
                    {card.copy}
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        <section id="developers" className="mx-auto max-w-[1600px] px-4 pb-0 sm:px-6 lg:px-8">
          <div className="grid border border-black bg-[#f53d00] text-white lg:grid-cols-[1.15fr_0.85fr]">
            <div className="border-b border-white/35 p-8 lg:border-b-0 lg:border-r lg:p-12">
              <p className="text-sm uppercase tracking-[0.24em] text-white/70">
                Developer and operator workflows
              </p>
              <h2 className="mt-5 max-w-3xl text-4xl font-medium leading-tight tracking-[-0.05em] sm:text-5xl">
                Build web scraping systems, workflow automations, and AI-driven browser tasks on one platform.
              </h2>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Show when="signed-out">
                  <SignUpButton mode="modal">
                    <button className="inline-flex cursor-pointer items-center justify-center gap-2 border border-white bg-white px-6 py-4 text-base font-semibold text-[#f53d00] transition hover:bg-black hover:text-white">
                      Get Started
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </SignUpButton>
                  <SignInButton mode="modal">
                    <button className="inline-flex cursor-pointer items-center justify-center border border-white px-6 py-4 text-base font-semibold text-white transition hover:bg-white hover:text-[#f53d00]">
                      Sign in
                    </button>
                  </SignInButton>
                </Show>
                <Show when="signed-in">
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center justify-center gap-2 border border-white bg-white px-6 py-4 text-base font-semibold text-[#f53d00] transition hover:bg-black hover:text-white"
                  >
                    Open dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Show>
              </div>
            </div>

            <div className="flex items-center justify-center p-8 lg:p-12">
              <div className="relative h-64 w-64">
                <div className="absolute left-8 top-3 h-40 w-40 border-2 border-black bg-[#ff5a1f]" />
                <div className="absolute left-[88px] top-10 h-40 w-40 border-2 border-black bg-[#2a130d]" />
                <div className="absolute left-8 top-3 flex h-40 w-40 items-center justify-center border-2 border-black bg-[#ff5a1f] text-[6rem] font-semibold text-white">
                  B
                </div>
                <div className="absolute left-14 top-[176px] h-6 w-48 skew-x-[-35deg] bg-black/45" />
              </div>
            </div>
          </div>
        </section>

        <footer id="footer" className="mt-0 bg-[#f53d00] text-white">
          <div className="mx-auto grid max-w-[1600px] border-x border-white/30 lg:grid-cols-[0.9fr_1.1fr_0.75fr]">
            <div className="border-b border-white/30 px-8 py-10 lg:border-b-0 lg:border-r" />

            <div>
              <div className="grid gap-10 border-b border-white/30 px-8 py-12 sm:grid-cols-3">
                {Object.entries(footerLinks).map(([title, links]) => (
                  <div key={title}>
                    <h3 className="text-lg font-semibold">{title}</h3>
                    <ul className="mt-5 space-y-3 text-lg text-white/92">
                      {links.map((link) => (
                        <li key={link}>{link}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-6 border-b border-white/30 px-8 py-8 text-lg sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-8">
                  <span>Privacy policy</span>
                  <span>Terms of Service</span>
                </div>
                <div className="flex items-center gap-5 text-2xl">
                  <span>in</span>
                  <span>x</span>
                  <span>ig</span>
                  <span>
                    <Play className="h-5 w-5 fill-white text-white" />
                  </span>
                </div>
              </div>

              <div className="px-8 py-8">
                <p className="text-[clamp(5rem,16vw,10rem)] font-semibold leading-none tracking-[-0.08em]">
                  Browsera
                </p>
              </div>
            </div>

            <div className="flex items-end justify-center border-t border-white/30 px-8 py-12 lg:border-l lg:border-t-0">
              <div className="relative h-56 w-56">
                <div className="absolute left-4 top-2 h-36 w-36 border-2 border-black bg-[#ff5a1f]" />
                <div className="absolute left-[68px] top-8 h-36 w-36 border-2 border-black bg-[#240f0a]" />
                <div className="absolute left-4 top-2 flex h-36 w-36 items-center justify-center border-2 border-black bg-[#ff5a1f] text-[5rem] font-semibold text-white">
                  B
                </div>
                <div className="absolute left-8 top-[156px] h-5 w-40 skew-x-[-34deg] bg-black/45" />
              </div>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
