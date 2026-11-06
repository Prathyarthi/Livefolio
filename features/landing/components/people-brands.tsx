import { StudioSection } from "@/features/landing/components/studio-shell";

/**
 * Decorative brand marks orbiting a neutral headline.
 * Not a customer/endorsement claim — logos identify well-known employers only.
 *
 * Mobile (< md): top/bottom logo bands with clear gap around the copy.
 * md+: scattered orbit (desktop visual QA).
 */
const BRANDS = [
  {
    id: "accenture",
    name: "Accenture",
    src: "/landing/brands/accenture.svg",
    tile: "bg-[#A100FF]",
    logo: "brightness-0 invert",
    rotate: "-rotate-[8deg]",
    band: "top",
    orbit:
      "left-[6%] top-[8%] -rotate-[8deg]",
  },
  {
    id: "ibm",
    name: "IBM",
    src: "/landing/brands/ibm.svg",
    tile: "bg-[#0F62FE]",
    logo: "brightness-0 invert",
    rotate: "rotate-[7deg]",
    band: "top",
    orbit: "right-[10%] top-[4%] rotate-[7deg]",
  },
  {
    id: "autodesk",
    name: "Autodesk",
    src: "/landing/brands/autodesk.svg",
    tile: "bg-[#000000]",
    logo: "brightness-0 invert",
    rotate: "rotate-[11deg]",
    band: "top",
    orbit: "left-[2%] top-[40%] rotate-[11deg] lg:left-[4%]",
  },
  {
    id: "sap",
    name: "SAP Labs",
    src: "/landing/brands/sap.svg",
    tile: "bg-[#008FD3]",
    logo: "brightness-0 invert",
    rotate: "-rotate-[6deg]",
    band: "bottom",
    orbit: "right-[3%] top-[36%] -rotate-[6deg] lg:right-[5%]",
  },
  {
    id: "pwc",
    name: "PwC",
    src: "/landing/brands/pwc.svg",
    tile: "bg-white",
    logo: "",
    rotate: "-rotate-[10deg]",
    band: "bottom",
    orbit: "bottom-[14%] left-[8%] -rotate-[10deg]",
  },
  {
    id: "standard-chartered",
    name: "Standard Chartered",
    src: "/landing/brands/standard-chartered.svg",
    tile: "bg-white",
    logo: "",
    rotate: "rotate-[8deg]",
    band: "bottom",
    orbit: "bottom-[12%] right-[8%] rotate-[8deg]",
  },
] as const;

const TOP = BRANDS.filter((b) => b.band === "top");
const BOTTOM = BRANDS.filter((b) => b.band === "bottom");

function BrandTile({
  name,
  src,
  tile,
  logo,
  className,
  sizeClass = "size-11 sm:size-12",
}: {
  name: string;
  src: string;
  tile: string;
  logo: string;
  className?: string;
  sizeClass?: string;
}) {
  return (
    <span
      title={name}
      className={`flex items-center justify-center rounded-2xl border border-border-default shadow-[0_8px_24px_rgba(26,24,40,0.08)] ${sizeClass} ${tile} ${className ?? ""}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        width={40}
        height={40}
        className={`h-[42%] w-[70%] max-w-[2.75rem] object-contain ${logo}`}
      />
    </span>
  );
}

function HeadingBlock({ className }: { className?: string }) {
  return (
    <div className={className}>
      <h2 className="text-h1 font-semibold tracking-[-0.03em] text-text-primary">
        <span className="block">People from top companies,</span>
        <span className="block">on Livefolio.</span>
      </h2>
      <p className="mx-auto mt-4 max-w-[20rem] text-body text-text-secondary sm:max-w-[28rem]">
        Portfolios that show real work — not just a resume.
      </p>
    </div>
  );
}

export function PeopleBrands() {
  return (
    <StudioSection id="people" padded={false} divider={false}>
      {/* Mobile / narrow: logos above + below copy — no absolute overlap */}
      <div className="mx-auto flex w-full max-w-[52rem] flex-col items-center gap-12 px-4 py-10 sm:gap-14 sm:px-6 sm:py-12 md:hidden">
        <div
          className="flex w-full max-w-[22rem] items-end justify-center gap-3 sm:gap-4"
          aria-hidden
        >
          {TOP.map((b) => (
            <BrandTile
              key={b.id}
              name={b.name}
              src={b.src}
              tile={b.tile}
              logo={b.logo}
              className={b.rotate}
            />
          ))}
        </div>

        <HeadingBlock className="relative z-[1] max-w-[20rem] px-2 text-center sm:max-w-[24rem]" />

        <div
          className="flex w-full max-w-[22rem] items-start justify-center gap-3 sm:gap-4"
          aria-hidden
        >
          {BOTTOM.map((b) => (
            <BrandTile
              key={b.id}
              name={b.name}
              src={b.src}
              tile={b.tile}
              logo={b.logo}
              className={b.rotate}
            />
          ))}
        </div>
      </div>

      {/* md+: scattered orbit — preserve desktop-passed composition */}
      <div className="relative mx-auto hidden w-full max-w-[52rem] px-6 py-10 md:block">
        <div
          className="pointer-events-none absolute inset-0 z-0"
          aria-hidden
        >
          {BRANDS.map((b) => (
            <BrandTile
              key={b.id}
              name={b.name}
              src={b.src}
              tile={b.tile}
              logo={b.logo}
              sizeClass="absolute size-16 lg:size-[4.25rem]"
              className={b.orbit}
            />
          ))}
        </div>

        <HeadingBlock className="relative z-[1] mx-auto max-w-[26rem] py-24 text-center" />
      </div>

      <ul className="sr-only">
        {BRANDS.map(({ id, name }) => (
          <li key={id}>{name}</li>
        ))}
      </ul>
    </StudioSection>
  );
}
