import { StudioSection } from "@/features/landing/components/studio-shell";

/**
 * Decorative brand marks around a neutral headline.
 * Not a customer/endorsement claim — logos identify well-known employers only.
 *
 * Positions are intentionally irregular (stable “designed random”), not mirrored
 * left/right pairs or even rows. Mobile parks marks in staggered top/bottom
 * bands so copy stays clear; md+ uses a scattered orbit.
 */
const BRANDS = [
  {
    id: "accenture",
    name: "Accenture",
    src: "/landing/brands/accenture.svg",
    tile: "bg-[#A100FF]",
    logo: "brightness-0 invert",
    // mobile top-left · desktop upper-left
    mobile:
      "left-[4%] top-[1%] size-11 -rotate-[9deg] sm:size-12",
    desktop:
      "left-[3%] top-[6%] size-[4.1rem] -rotate-[8deg] lg:left-[5%]",
  },
  {
    id: "netflix",
    name: "Netflix",
    src: "/landing/brands/netflix.svg",
    tile: "bg-[#E50914]",
    logo: "brightness-0 invert",
    mobile:
      "left-[38%] top-[0%] size-10 rotate-[6deg] sm:left-[40%] sm:size-11",
    desktop:
      "left-[20%] top-[2%] size-[3.35rem] rotate-[5deg] lg:left-[22%]",
  },
  {
    id: "ibm",
    name: "IBM",
    src: "/landing/brands/ibm.svg",
    tile: "bg-[#0F62FE]",
    logo: "brightness-0 invert",
    mobile:
      "right-[5%] top-[5%] size-11 rotate-[4deg] sm:size-12",
    desktop:
      "right-[7%] top-[3%] size-[3.75rem] rotate-[7deg] lg:right-[9%]",
  },
  {
    id: "autodesk",
    name: "Autodesk",
    src: "/landing/brands/autodesk.svg",
    tile: "bg-[#000000]",
    logo: "brightness-0 invert",
    mobile:
      "left-[16%] top-[14%] size-[2.65rem] rotate-[13deg] sm:size-11",
    desktop:
      "left-[2%] top-[46%] size-16 rotate-[11deg] lg:left-[3%]",
  },
  {
    id: "adobe",
    name: "Adobe",
    src: "/landing/brands/adobe.svg",
    tile: "bg-[#EB1000]",
    logo: "brightness-0 invert",
    mobile:
      "left-[6%] bottom-[9%] size-10 -rotate-[14deg] sm:size-11",
    desktop:
      "right-[4%] top-[22%] size-[3.65rem] -rotate-[12deg] lg:right-[5%]",
  },
  {
    id: "sap",
    name: "SAP Labs",
    src: "/landing/brands/sap.svg",
    tile: "bg-[#008FD3]",
    logo: "brightness-0 invert",
    mobile:
      "left-[42%] bottom-[17%] size-10 -rotate-[3deg] sm:left-[44%] sm:size-11",
    desktop:
      "right-[2%] top-[52%] size-[3.5rem] -rotate-[6deg] lg:right-[3.5%]",
  },
  {
    id: "airbnb",
    name: "Airbnb",
    src: "/landing/brands/airbnb.svg",
    tile: "bg-[#FF5A5F]",
    logo: "brightness-0 invert",
    mobile:
      "right-[4%] bottom-[10%] size-[2.55rem] rotate-[10deg] sm:right-[6%] sm:size-10",
    desktop:
      "left-[24%] bottom-[4%] size-[3.6rem] rotate-[9deg] lg:left-[22%]",
  },
  {
    id: "pwc",
    name: "PwC",
    src: "/landing/brands/pwc.svg",
    tile: "bg-white",
    logo: "",
    mobile:
      "left-[22%] bottom-[0.5%] size-10 -rotate-[7deg] sm:left-[24%] sm:size-11",
    desktop:
      "left-[6%] bottom-[10%] size-[3.9rem] -rotate-[10deg] lg:left-[8%]",
  },
  {
    id: "standard-chartered",
    name: "Standard Chartered",
    src: "/landing/brands/standard-chartered.svg",
    tile: "bg-white",
    logo: "",
    mobile:
      "right-[26%] bottom-[1%] size-10 rotate-[8deg] sm:right-[28%] sm:size-11",
    desktop:
      "right-[10%] bottom-[16%] size-[3.55rem] rotate-[8deg] lg:right-[11%]",
  },
] as const;

function BrandTile({
  name,
  src,
  tile,
  logo,
  className,
}: {
  name: string;
  src: string;
  tile: string;
  logo: string;
  className: string;
}) {
  return (
    <span
      title={name}
      className={`absolute flex items-center justify-center rounded-2xl border border-border-default shadow-[0_8px_24px_rgba(26,24,40,0.08)] ${tile} ${className}`}
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

export function PeopleBrands() {
  return (
    <StudioSection id="people" padded={false} divider={false}>
      <div className="relative mx-auto w-full max-w-[52rem] px-3 py-6 sm:px-6 sm:py-8 md:py-10">
        {/* Mobile: staggered top/bottom marks — irregular, not mirrored rows */}
        <div
          className="pointer-events-none absolute inset-0 z-0 md:hidden"
          aria-hidden
        >
          {BRANDS.map((b) => (
            <BrandTile
              key={`m-${b.id}`}
              name={b.name}
              src={b.src}
              tile={b.tile}
              logo={b.logo}
              className={b.mobile}
            />
          ))}
        </div>

        {/* Desktop: irregular scattered orbit */}
        <div
          className="pointer-events-none absolute inset-0 z-0 hidden md:block"
          aria-hidden
        >
          {BRANDS.map((b) => (
            <BrandTile
              key={`d-${b.id}`}
              name={b.name}
              src={b.src}
              tile={b.tile}
              logo={b.logo}
              className={b.desktop}
            />
          ))}
        </div>

        {/* Generous vertical padding keeps copy clear of top/bottom logo bands */}
        <div className="relative z-[1] mx-auto max-w-[17.5rem] px-1 pt-36 pb-44 text-center sm:max-w-[22rem] sm:pt-40 sm:pb-48 md:max-w-[26rem] md:px-0 md:py-24">
          <h2 className="text-h1 font-semibold tracking-[-0.03em] text-text-primary">
            <span className="block">People from top companies,</span>
            <span className="block">on Livefolio.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-[16rem] text-body text-text-secondary sm:max-w-[28rem]">
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
