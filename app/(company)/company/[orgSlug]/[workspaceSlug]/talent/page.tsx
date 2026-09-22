"use client";

import { useParams } from "next/navigation";
import { TalentSearchPage } from "@/features/talent/components/talent-search-page";

export default function WorkspaceTalentPage() {
  const params = useParams<{ orgSlug: string; workspaceSlug: string }>();
  return (
    <TalentSearchPage
      orgSlug={params.orgSlug}
      workspaceSlug={params.workspaceSlug}
    />
  );
}
