"use client";

import { ResumeUploader } from "@/features/resume/components/resume-uploader";
import { GitHubImporter } from "@/features/profile/components/github-importer";
import { LeetCodeImporter } from "@/features/profile/components/leetcode-importer";
import { MediumImporter } from "@/features/profile/components/medium-importer";
import type { ReactNode } from "react";
import type { ImportSourceValue } from "@/features/portfolio/constants/import-sources";

type ImportSourceContentProps = {
  source: ImportSourceValue;
  canUseImports: boolean;
  onToolbarActionsChange?: (actions: ReactNode) => void;
};

export function ImportSourceContent({
  source,
  canUseImports,
  onToolbarActionsChange,
}: ImportSourceContentProps) {
  if (!canUseImports) {
    return (
      <p className="text-body-sm text-text-secondary">
        {source === "resume" &&
          "Resume PDF import is locked. Upgrade to Pro to use AI resume parsing."}
        {source === "github" &&
          "GitHub import is locked. Upgrade to Pro to fetch and import repositories."}
        {source === "medium" &&
          "Medium import is locked. Upgrade to Pro to fetch and import articles."}
        {source === "leetcode" &&
          "LeetCode import is locked. Upgrade to Pro to sync your stats."}
      </p>
    );
  }

  return (
    <>
      <div hidden={source !== "resume"}>
        <ResumeUploader onToolbarActionsChange={onToolbarActionsChange} />
      </div>
      <div hidden={source !== "github"}>
        <GitHubImporter />
      </div>
      <div hidden={source !== "medium"}>
        <MediumImporter />
      </div>
      <div hidden={source !== "leetcode"}>
        <LeetCodeImporter />
      </div>
    </>
  );
}