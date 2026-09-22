"use client";

import { useParams } from "next/navigation";
import { TalentSearchPage } from "@/features/talent/components/talent-search-page";

export default function CompanyTalentPage() {
  const params = useParams<{ orgSlug: string }>();
  return <TalentSearchPage orgSlug={params.orgSlug} />;
}
