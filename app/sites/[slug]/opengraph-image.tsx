import { OG_CARD_CONTENT_TYPE, OG_CARD_SIZE } from "@/lib/og-card";
import { renderPortfolioOgCard } from "./og-card";

export const alt = "Portfolio on Livefolio";
export const size = OG_CARD_SIZE;
export const contentType = OG_CARD_CONTENT_TYPE;

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return renderPortfolioOgCard(slug);
}
