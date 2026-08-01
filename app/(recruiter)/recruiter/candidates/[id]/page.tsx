"use client";

import { use } from "react";
import { CandidateDetail } from "@/features/recruiter/components/candidate-detail";

export default function CandidateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <CandidateDetail id={id} />;
}
