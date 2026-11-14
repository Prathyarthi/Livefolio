import { useId } from "react";
import { cn } from "@/lib/utils";
import { BADGE_ART, FALLBACK_ART } from "@/features/badges/components/badge-art";

const RAYS = Array.from({ length: 16 }, (_, i) => i * 22.5);

/**
 * GitHub-achievement-style medallion: bevelled rim, gradient disc with a
 * sunburst, glossy highlight and a bold glyph. `locked` renders the same art
 * desaturated. Pure SVG; sized by `className` (defaults to 72px).
 */
export function BadgeMedallion({
  badgeKey,
  locked = false,
  count,
  className,
  title,
}: {
  badgeKey: string;
  locked?: boolean;
  count?: number;
  className?: string;
  title?: string;
}) {
  const art = BADGE_ART[badgeKey] ?? FALLBACK_ART;
  // Include the key so ids stay unique even across separately rendered roots.
  const id = `bm${useId().replace(/[^a-zA-Z0-9]/g, "")}-${badgeKey.replace(/[^a-zA-Z0-9]/g, "")}`;
  const ids = { rim: `${id}-rim`, disc: `${id}-disc`, shine: `${id}-shine`, glyph: `${id}-glyph` };

  return (
    <span
      className={cn(
        "relative inline-block size-[72px] shrink-0 drop-shadow-[0_4px_10px_rgba(15,23,42,0.28)]",
        locked && "opacity-55 grayscale drop-shadow-none",
        className,
      )}
    >
      <svg viewBox="0 0 120 120" className="size-full" role={title ? "img" : undefined} aria-hidden={title ? undefined : true}>
        {title ? <title>{title}</title> : null}
        <defs>
          <linearGradient id={ids.rim} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="45%" stopColor={art.light} />
            <stop offset="100%" stopColor={art.deep} />
          </linearGradient>
          <radialGradient id={ids.disc} cx="35%" cy="30%" r="80%">
            <stop offset="0%" stopColor={art.light} />
            <stop offset="55%" stopColor={art.mid} />
            <stop offset="100%" stopColor={art.deep} />
          </radialGradient>
          <linearGradient id={ids.shine} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <filter id={ids.glyph} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="1.2" floodColor="#000" floodOpacity="0.35" />
          </filter>
        </defs>

        {/* Bevelled rim */}
        <circle cx="60" cy="60" r="58" fill={`url(#${ids.rim})`} />
        <circle cx="60" cy="60" r="58" fill="none" stroke={art.deep} strokeOpacity="0.5" strokeWidth="1.5" />
        {/* Disc */}
        <circle cx="60" cy="60" r="49" fill={`url(#${ids.disc})`} />
        {/* Sunburst */}
        <g opacity="0.16" fill="#ffffff">
          {RAYS.map((angle) => (
            <path key={angle} d="M60 60 L57 12 L63 12 Z" transform={`rotate(${angle} 60 60)`} />
          ))}
        </g>
        {/* Inner ring */}
        <circle cx="60" cy="60" r="49" fill="none" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="2" />
        <circle cx="60" cy="60" r="43" fill="none" stroke="#ffffff" strokeOpacity="0.18" strokeWidth="1" strokeDasharray="2 4" />
        {/* Glyph */}
        <g transform="translate(33 33) scale(2.25)" filter={`url(#${ids.glyph})`}>
          <path d={art.glyph} fill={art.ink} />
        </g>
        {/* Gloss */}
        <path d="M20 52 A41 41 0 0 1 100 52 Q60 40 20 52 Z" fill={`url(#${ids.shine})`} />
      </svg>
      {count && count > 1 ? (
        <span className="absolute -bottom-0.5 -right-0.5 rounded-full border border-white/70 bg-slate-900 px-1.5 text-[11px] font-semibold leading-5 text-white shadow">
          x{count}
        </span>
      ) : null}
    </span>
  );
}
