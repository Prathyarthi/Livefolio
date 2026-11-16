import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site";

export const OG_CARD_SIZE = { width: 1200, height: 630 } as const;
export const OG_CARD_CONTENT_TYPE = "image/png";

const INK = "#2a2744";
const MUTED = "#5e5a6e";
const CORAL = "#e85d4c";
const CANVAS = "#fafafa";

function clamp(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
}

async function loadLogoDataUri(): Promise<string | null> {
  try {
    const file = await readFile(join(process.cwd(), "public/brand/logo-512.png"));
    return `data:image/png;base64,${file.toString("base64")}`;
  } catch {
    return null;
  }
}

type OgCardInput = {
  /** Main line, for example a person's name or page title. */
  title: string;
  /** Supporting line under the title. */
  subtitle?: string;
  /** Small line at the bottom left, for example the portfolio address. */
  footer?: string;
};

/** Branded 1200x630 PNG card, matching /public/og/default.png. */
export async function renderOgCard({ title, subtitle, footer }: OgCardInput) {
  const logo = await loadLogoDataUri();
  const safeTitle = clamp(title, 60) || siteConfig.name;
  const safeSubtitle = subtitle ? clamp(subtitle, 130) : "";
  const safeFooter = footer ? clamp(footer, 60) : siteConfig.name;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: CANVAS,
          padding: "72px 88px 56px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} width={72} height={72} alt="" />
          ) : null}
          <div
            style={{
              marginLeft: logo ? 20 : 0,
              fontSize: 40,
              fontWeight: 700,
              color: INK,
            }}
          >
            {siteConfig.name}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: safeTitle.length > 36 ? 64 : 84,
              fontWeight: 700,
              lineHeight: 1.1,
              color: INK,
            }}
          >
            {safeTitle}
          </div>
          {safeSubtitle ? (
            <div
              style={{
                marginTop: 24,
                fontSize: 36,
                lineHeight: 1.3,
                color: MUTED,
              }}
            >
              {safeSubtitle}
            </div>
          ) : null}
        </div>

        <div style={{ display: "flex", fontSize: 30, color: MUTED }}>
          {safeFooter}
        </div>

        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 14,
            background: CORAL,
          }}
        />
      </div>
    ),
    { ...OG_CARD_SIZE },
  );
}
