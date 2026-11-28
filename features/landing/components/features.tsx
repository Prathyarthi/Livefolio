import Link from "next/link";
import { Bot } from "lucide-react";
import {
  DevtoIcon,
  HashnodeIcon,
  LeetCodeMark,
  StackOverflowIcon,
} from "@/components/icons";
import {
  GitHubIcon,
  MediumIcon,
} from "@/features/landing/components/integration-icons";
import { StudioSection } from "@/features/landing/components/studio-shell";

const START_OPTIONS = [
  { label: "PDF", active: true },
  { label: "Draft", active: false },
] as const;

const CONNECTED = [
  { label: "GitHub", Icon: GitHubIcon },
  { label: "Medium", Icon: MediumIcon },
  { label: "Dev.to", Icon: DevtoIcon },
  { label: "Hashnode", Icon: HashnodeIcon },
  { label: "LeetCode", Icon: LeetCodeMark },
  { label: "Stack Overflow", Icon: StackOverflowIcon },
] as const;

function GridMark() {
  return (
    <span className="grid grid-cols-2 gap-[3px]" aria-hidden>
      {Array.from({ length: 4 }).map((_, index) => (
        <span key={index} className="size-[3px] rounded-full bg-current" />
      ))}
    </span>
  );
}

/** Back to front; transforms fan the stack and spread further on card hover. */
const TEMPLATE_STACK = [
  {
    id: "blueprint",
    name: "Blueprint",
    className:
      "-translate-x-[38%] -rotate-[9deg] group-hover:-translate-x-[52%] group-hover:-rotate-[12deg]",
  },
  {
    id: "retro",
    name: "Retro",
    className:
      "translate-x-[38%] rotate-[9deg] group-hover:translate-x-[52%] group-hover:rotate-[12deg]",
  },
  {
    id: "modern",
    name: "Modern",
    className: "-translate-y-1 group-hover:-translate-y-3",
  },
] as const;

function TemplatePreview({ id, name }: { id: string; name: string }) {
  return (
    <figure className="overflow-hidden rounded-xl border border-black/10 bg-white shadow-[0_14px_30px_rgba(26,24,40,0.16)]">
      <div className="flex items-center gap-1 border-b border-black/5 bg-[#f4f2ee] px-2 py-1.5">
        <span className="size-1.5 rounded-full bg-[#ff5f57]" />
        <span className="size-1.5 rounded-full bg-[#febc2e]" />
        <span className="size-1.5 rounded-full bg-[#28c840]" />
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/templates/${id}.webp`}
        alt=""
        loading="lazy"
        className="aspect-[4/3] w-full object-cover object-top"
      />
      <figcaption className="px-2.5 py-1.5 text-[10px] font-medium tracking-[0.14em] text-[#6d675f] uppercase">
        {name}
      </figcaption>
    </figure>
  );
}

export function Features() {
  return (
    <StudioSection id="features" padded={false}>
      <div className="px-4 sm:px-6 md:px-8">
        <h2 className="text-center text-h1 text-text-primary">
          Meet <span className="text-[#e86a5a]">Livefolio</span>
        </h2>
        <p className="studio-lead mx-auto mt-4 max-w-xl text-center text-text-secondary">
          A portfolio that starts from your resume and stays current.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-3 lg:mt-10 lg:grid-cols-12">
          <article className="flex min-h-[280px] flex-col justify-between gap-8 rounded-[28px] bg-[#f6c2b0] p-6 text-[#2a241f] sm:p-8 lg:col-span-7 lg:flex-row lg:items-stretch">
            <div className="max-w-sm">
              <p className="text-[11px] font-medium tracking-[0.16em] text-[#6a463c]">
                RESUME
              </p>
              <h3 className="mt-3 font-sans text-[clamp(1.875rem,1.55rem+0.9vw,2.35rem)] font-semibold leading-[1.15] tracking-[-0.04em] text-[#2a241f]">
                Start from the resume you already have
              </h3>
              <p className="mt-3 text-base leading-relaxed text-[#5c4038]">
                Upload your resume PDF (up to 10 MB). We structure your
                experience, education, skills and projects so you begin with a
                draft, not a blank page.
              </p>
            </div>
            <ul className="flex w-full flex-col justify-center gap-2 lg:w-[11.5rem]">
              {START_OPTIONS.map((option) => (
                <li key={option.label}>
                  <span
                    className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[15px] font-medium ${
                      option.active
                        ? "bg-[#e86a5a] text-white shadow-[0_8px_18px_rgba(232,106,90,0.28)]"
                        : "text-[#3d342f]"
                    }`}
                  >
                    <GridMark />
                    {option.label}
                  </span>
                </li>
              ))}
            </ul>
          </article>

          <article className="relative min-h-[280px] overflow-hidden rounded-[28px] bg-[#1c1b19] text-white lg:col-span-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/landing/hero-mountains.jpg"
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-45"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#141311] via-[#141311]/75 to-[#141311]/35" />
            <div className="relative flex h-full flex-col justify-between p-6 sm:p-7">
              <div>
                <p className="text-[11px] font-medium tracking-[0.16em] text-white/70">
                  INTEGRATIONS
                </p>
                <h3 className="mt-3 max-w-[16ch] font-sans text-[clamp(1.875rem,1.55rem+0.9vw,2.35rem)] font-semibold leading-[1.15] tracking-[-0.04em] text-white">
                  Bring the work you already shipped
                </h3>
                <p className="mt-3 max-w-[34ch] text-base leading-relaxed text-white/75">
                  Repos, articles, and coding stats can sit next to your resume
                  once you connect them.
                </p>
              </div>
              <ul className="mt-6 flex flex-wrap gap-2">
                {CONNECTED.map(({ label, Icon }) => (
                  <li
                    key={label}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[12px] text-white/90 backdrop-blur-sm"
                  >
                    <Icon className="size-3.5" />
                    {label}
                  </li>
                ))}
              </ul>
            </div>
          </article>

          <article className="flex min-h-[240px] flex-col justify-between rounded-[28px] bg-[#efeee9] p-6 text-[#2a241f] sm:p-7 lg:col-span-4">
            <div>
              <p className="text-[11px] font-medium tracking-[0.16em] text-[#6d675f]">
                TEMPLATES
              </p>
              <h3 className="mt-3 font-sans text-[clamp(1.875rem,1.55rem+0.9vw,2.35rem)] font-semibold leading-[1.15] tracking-[-0.04em] text-[#2a241f]">
                Pick a layout, then keep editing
              </h3>
            </div>
            <p className="mt-4 max-w-[36ch] text-base leading-relaxed text-[#5c574f]">
              Headings, sections, and accents stay yours after you publish.
              Same story, your choice of personality.
            </p>
          </article>

          <Link
            href="/#showcase"
            aria-label="See all templates"
            className="group relative flex min-h-[300px] flex-col items-center justify-between overflow-hidden rounded-[28px] bg-[#f7f6f3] p-5 pt-10 lg:col-span-3"
          >
            <div className="relative grid w-[58%] max-w-[11rem] place-items-center">
              {TEMPLATE_STACK.map(({ id, name, className }) => (
                <div
                  key={id}
                  className={`col-start-1 row-start-1 w-full transition-transform duration-300 ease-[var(--ease-out)] motion-reduce:transition-none ${className}`}
                >
                  <TemplatePreview id={id} name={name} />
                </div>
              ))}
            </div>
            <span className="mt-8 inline-flex items-center gap-1.5 rounded-full bg-[#2a241f] px-4 py-2 text-[12px] font-medium tracking-[0.04em] text-white transition-colors group-hover:bg-[#e86a5a]">
              See all templates
              <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </span>
          </Link>

          <article className="flex min-h-[240px] flex-col justify-between rounded-[28px] bg-gradient-to-br from-[#e86a5a] via-[#ee8574] to-[#f3b5a4] p-6 text-white sm:p-8 lg:col-span-5">
            <div>
              <p className="text-[11px] font-medium tracking-[0.16em] text-white/80">
                YOUR LINK
              </p>
              <h3 className="mt-3 max-w-[16ch] font-sans text-[clamp(1.875rem,1.55rem+0.9vw,2.35rem)] font-semibold leading-[1.15] tracking-[-0.04em] text-white">
                One address, instead of a pile of profiles
              </h3>
            </div>
            <p className="mt-4 max-w-[38ch] text-base leading-relaxed text-white/90">
              Publish on{" "}
              <span className="rounded-md bg-white px-1.5 py-0.5 font-medium text-[#c24b3c]">
                yourname.livefolio.me
              </span>{" "}
              and send recruiters a single link that can stay current with the
              work you connect.
            </p>
          </article>

          <article className="flex min-h-[220px] flex-col justify-between gap-8 rounded-[28px] bg-[#2a2744] p-6 text-white sm:p-8 lg:col-span-12 lg:flex-row lg:items-center">
            <div className="max-w-xl">
              <p className="inline-flex items-center gap-2 text-[11px] font-medium tracking-[0.16em] text-white/70">
                <Bot className="size-3.5" aria-hidden />
                HIRING AGENT
              </p>
              <h3 className="mt-3 font-sans text-[clamp(1.875rem,1.55rem+0.9vw,2.35rem)] font-semibold leading-[1.15] tracking-[-0.04em] text-white">
                Describe the hire. The agent finds the people.
              </h3>
              <p className="mt-3 text-base leading-relaxed text-white/75">
                Hiring teams write the role in plain words. The agent drafts
                the job, finds people who opted in to be found, and drafts
                the invites they send.
              </p>
            </div>
            <div className="w-full max-w-sm rounded-2xl bg-white/10 p-4">
              <p className="text-[13px] leading-relaxed text-white/80">
                Need someone to fix our onboarding drop-off. Remote, mid-level.
              </p>
              <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#e86a5a] px-3 py-1.5 text-[12px] font-medium text-white">
                <Bot className="size-3.5" aria-hidden />
                Draft the job
              </span>
            </div>
          </article>
        </div>
      </div>
    </StudioSection>
  );
}
