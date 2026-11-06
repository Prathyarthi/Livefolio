import { StudioSection } from "@/features/landing/components/studio-shell";

/**
 * Decorative brand marks orbiting a neutral headline.
 * Not a customer/endorsement claim — logos identify well-known employers only.
 */
const BRANDS = [
  {
    id: "accenture",
    name: "Accenture",
    src: "/landing/brands/accenture.svg",
    tile: "bg-[#A100FF]",
    logo: "brightness-0 invert",
    className: "left-[4%] top-[10%] -rotate-[8deg] md:left-[6%] md:top-[8%]",
  },
  {
    id: "ibm",
    name: "IBM",
    src: "/landing/brands/ibm.svg",
    tile: "bg-[#0F62FE]",
    logo: "brightness-0 invert",
    className: "right-[6%] top-[6%] rotate-[7deg] md:right-[10%] md:top-[4%]",
  },
  {
    id: "autodesk",
    name: "Autodesk",
    src: "/landing/brands/autodesk.svg",
    tile: "bg-[#000000]",
    logo: "brightness-0 invert",
    className: "left-[10%] top-[42%] rotate-[11deg] md:left-[2%] md:top-[40%] lg:left-[4%]",
  },
  {
    id: "sap",
    name: "SAP Labs",
    src: "/landing/brands/sap.svg",
    tile: "bg-[#008FD3]",
    logo: "brightness-0 invert",
    className: "right-[8%] top-[38%] -rotate-[6deg] md:right-[3%] md:top-[36%] lg:right-[5%]",
  },
  {
    id: "pwc",
    name: "PwC",
    src: "/landing/brands/pwc.svg",
    tile: "bg-white",
    logo: "",
    className: "bottom-[12%] left-[8%] -rotate-[10deg] md:bottom-[14%] md:left-[8%]",
  },
  {
    id: "standard-chartered",
    name: "Standard Chartered",
    src: "/landing/brands/standard-chartered.svg",
    tile: "bg-white",
    logo: "",
    className: "bottom-[10%] right-[6%] rotate-[8deg] md:bottom-[12%] md:right-[8%]",
  },
] as const;

export function PeopleBrands() {
  return (
    <StudioSection id="people" padded={false} divider={false}>
      <div className="relative mx-auto w-full max-w-[52rem] px-4 py-6 sm:px-6 sm:py-8 md:py-10">
        {/* Scattered brand tiles — aria-hidden; names also in sr list below */}
        <div
          className="pointer-events-none absolute inset-0 z-0 max-md:opacity-90"
          aria-hidden
        >
          {BRANDS.map(({ id, name, src, tile, logo, className }) => (
            <span
              key={id}
              title={name}
              className={`absolute flex size-14 items-center justify-center rounded-2xl border border-border-default shadow-[0_8px_24px_rgba(26,24,40,0.08)] sm:size-16 lg:size-[4.25rem] ${tile} ${className}`}
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
          ))}
        </div>

        <div className="relative z-[1] mx-auto max-w-[22rem] py-16 text-center sm:max-w-[26rem] sm:py-20 md:py-24">
          <h2 className="text-h1 font-semibold tracking-[-0.03em] text-text-primary">
            <span className="block">People from top companies,</span>
            <span className="block">on Livefolio.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-[28rem] text-body text-text-secondary">
            Portfolios that show real work — not just a resume.
          </p>
        </div>

        <ul className="sr-only">
          {BRANDS.map(({ id, name }) => (
            <li key={id}>{name}</li>
          ))}
        </ul>
      </div>
    </StudioSection>
  );
}
