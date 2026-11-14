import { StudioSection } from "@/features/landing/components/studio-shell";

/**
 * Decorative brand marks around a neutral headline.
 * Not a customer/endorsement claim. Logos identify well-known employers only.
 *
 * Marks sit in the open space above, below, and beside the copy, closer to
 * the headline than the page edges, so they don't form two side columns.
 */
const BRANDS = [
  {
    id: "accenture",
    name: "Accenture",
    src: "/landing/brands/accenture.svg",
    tile: "bg-[#A100FF]",
    logo: "brightness-0 invert",
    mark: "h-[50%] w-[50%]",
    mobile: "left-[6%] top-[6%] size-11 -rotate-[8deg] sm:size-12",
    desktop: "left-[10%] top-[14%] size-[4.1rem] -rotate-[8deg] lg:left-[14%]",
  },
  {
    id: "netflix",
    name: "Netflix",
    src: "/landing/brands/netflix.svg",
    tile: "bg-black border-black!",
    logo: "",
    mark: "h-[80%] w-auto",
    mobile: "left-[40%] top-[2%] size-12 rotate-[4deg] sm:left-[42%]",
    desktop: "left-[34%] top-[3%] size-[3.6rem] rotate-[4deg] lg:left-[36%]",
  },
  {
    id: "ibm",
    name: "IBM",
    src: "/landing/brands/ibm.svg",
    tile: "bg-[#0F62FE]",
    logo: "brightness-0 invert",
    mark: "h-[32%] w-[76%]",
    mobile: "right-[8%] top-[7%] size-11 rotate-[6deg] sm:size-12",
    desktop: "right-[22%] top-[5%] size-[3.85rem] rotate-[6deg] lg:right-[26%]",
  },
  {
    id: "autodesk",
    name: "Autodesk",
    src: "/landing/brands/autodesk.svg",
    tile: "bg-[#000000]",
    logo: "brightness-0 invert",
    mark: "h-[48%] w-[48%]",
    mobile: "left-[8%] top-[18%] size-10 rotate-[12deg]",
    desktop: "left-[5%] top-[42%] size-[3.7rem] rotate-[11deg] lg:left-[8%]",
  },
  {
    id: "adobe",
    name: "Adobe",
    src: "/landing/brands/adobe.svg",
    tile: "bg-[#EB1000]",
    logo: "brightness-0 invert",
    mark: "h-[52%] w-[46%]",
    mobile: "right-[7%] top-[20%] size-10 -rotate-[10deg]",
    desktop: "right-[6%] top-[36%] size-[3.65rem] -rotate-[10deg] lg:right-[9%]",
  },
  {
    id: "sap",
    name: "SAP Labs",
    src: "/landing/brands/sap.svg",
    tile: "bg-[#008FD3]",
    logo: "brightness-0 invert",
    mark: "h-[34%] w-[72%]",
    mobile: "left-[18%] bottom-[8%] size-10 -rotate-[4deg] sm:size-11",
    desktop: "right-[16%] bottom-[18%] size-[3.55rem] -rotate-[5deg] lg:right-[18%]",
  },
  {
    id: "airbnb",
    name: "Airbnb",
    src: "/landing/brands/airbnb.svg",
    tile: "bg-[#FF5A5F]",
    logo: "brightness-0 invert",
    mark: "h-[52%] w-[52%]",
    mobile: "left-[44%] bottom-[3%] size-11 rotate-[8deg]",
    desktop: "left-[40%] bottom-[2%] size-[3.5rem] rotate-[7deg] lg:left-[42%]",
  },
  {
    id: "pwc",
    name: "PwC",
    src: "/landing/brands/pwc.svg",
    tile: "bg-white",
    logo: "",
    mark: "h-[36%] w-[70%]",
    mobile: "left-[8%] bottom-[3%] size-10 -rotate-[7deg] sm:size-11",
    desktop: "left-[16%] bottom-[6%] size-[3.8rem] -rotate-[8deg] lg:left-[18%]",
  },
  {
    id: "standard-chartered",
    name: "Standard Chartered",
    src: "/landing/brands/standard-chartered.svg",
    tile: "bg-white",
    logo: "",
    mark: "h-[40%] w-[74%]",
    mobile: "right-[10%] bottom-[4%] size-11 rotate-[6deg]",
    desktop: "right-[28%] bottom-[3%] size-[3.6rem] rotate-[6deg] lg:right-[30%]",
  },
] as const;

function BrandTile({
  name,
  src,
  tile,
  logo,
  mark,
  className,
}: {
  name: string;
  src: string;
  tile: string;
  logo: string;
  mark: string;
  className: string;
}) {
  return (
    <span
      title={name}
      className={`absolute flex items-center justify-center overflow-hidden rounded-2xl border border-border-default shadow-[0_8px_24px_rgba(26,24,40,0.08)] ${tile} ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        width={40}
        height={40}
        className={`object-contain ${mark} ${logo}`}
      />
    </span>
  );
}

export function PeopleBrands() {
  return (
    <StudioSection id="people" padded={false} divider={false}>
      <div className="relative mx-auto w-full px-3 py-6 sm:px-6 sm:py-8 md:py-10">
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
              mark={b.mark}
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
              mark={b.mark}
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
            Portfolios that show real work, not just a resume.
          </p>
          <p className="mt-2 text-body-sm text-text-muted">
            And many more companies.
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
